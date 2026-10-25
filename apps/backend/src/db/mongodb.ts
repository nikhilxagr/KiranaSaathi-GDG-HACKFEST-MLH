import dns from 'dns';
import mongoose from 'mongoose';
import { env } from '../utils/env';

let connectingPromise: Promise<{ success: boolean; message: string }> | null = null;
let lastError: string | null = null;
let listenersRegistered = false;
let dnsConfigured = false;

/**
 * Mask credentials in MongoDB connection string for safe logging and display
 */
export const maskMongoUri = (rawUri?: string | null): string => {
  if (!rawUri || typeof rawUri !== 'string') return 'Not Configured';
  try {
    return rawUri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
  } catch {
    return 'mongodb://***';
  }
};

/**
 * Configure reliable DNS servers for resolving MongoDB Atlas SRV records.
 * On Windows and certain network configurations, the default DNS resolver
 * (such as 127.0.0.1 or local router) rejects UDP port 53 SRV queries with ECONNREFUSED.
 */
export const configureDnsForAtlas = (): void => {
  if (dnsConfigured) return;
  try {
    const servers = dns.getServers();
    const hasPublicDns = servers.some((s) => s === '8.8.8.8' || s === '1.1.1.1');
    if (!hasPublicDns) {
      if (servers.length === 1 && servers[0] === '127.0.0.1') {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } else {
        dns.setServers(['8.8.8.8', '1.1.1.1', ...servers]);
      }
    }
    dnsConfigured = true;
  } catch {
    // Proceed if runtime environment restricts changing DNS servers
  }
};

/**
 * Initialize connection event listeners once to track MongoDB lifecycle
 */
const setupConnectionListeners = (): void => {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on('connected', () => {
    lastError = null;
    const dbName = mongoose.connection.name;
    const host = mongoose.connection.host;
    console.log(`[MongoDB] Connection active (host: ${host || 'unknown'}, db: ${dbName || 'default'})`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Connection lost. Operating in offline fallback mode.');
  });

  mongoose.connection.on('reconnected', () => {
    lastError = null;
    console.log('[MongoDB] Connection restored.');
  });

  mongoose.connection.on('error', (err: any) => {
    lastError = err?.message || 'Database connection error';
    console.error(`[MongoDB] Connection error: ${lastError}`);
  });
};

/**
 * Connect to MongoDB with timeout bounding, DNS fallback, and concurrency locking
 */
export const connectMongoDB = async (
  customUri?: string
): Promise<{ success: boolean; message: string }> => {
  setupConnectionListeners();

  // If already fully connected and ready
  if (mongoose.connection.readyState === 1) {
    return { success: true, message: 'Already connected to MongoDB.' };
  }

  // If a connection attempt is already in flight, reuse that promise
  if (connectingPromise) {
    return connectingPromise;
  }

  const rawUri = customUri || env.MONGODB_URI;

  if (!rawUri || !rawUri.trim()) {
    const msg = 'No MONGODB_URI configured. Backend running in offline-first fallback mode.';
    console.warn(`[MongoDB] ${msg}`);
    return { success: false, message: msg };
  }

  const uri = rawUri.trim();
  const masked = maskMongoUri(uri);

  // If using mongodb+srv://, ensure public DNS resolvers can handle the SRV query
  if (uri.startsWith('mongodb+srv://')) {
    configureDnsForAtlas();
  }

  connectingPromise = (async () => {
    try {
      mongoose.set('strictQuery', false);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        dbName: 'kiranasathi',
      });

      lastError = null;
      console.log(`[MongoDB] Connected successfully to ${masked}`);
      return { success: true, message: `Connected to MongoDB (${masked})` };
    } catch (error: any) {
      lastError = error?.message || 'Connection failed or timed out';
      console.warn(`[MongoDB] Unable to connect to ${masked}: ${lastError}`);
      console.warn('[MongoDB] Backend will continue in offline-first fallback mode.');
      return { success: false, message: lastError || 'Connection failed' };
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
};

/**
 * Verify whether MongoDB is currently in ready state (1 = connected)
 */
export const isMongoConnected = (): boolean => mongoose.connection.readyState === 1;

/**
 * Perform a live ping to verify that the database is actually reachable and responsive
 */
export const pingMongoDB = async (): Promise<{
  ok: boolean;
  latencyMs?: number;
  error?: string;
}> => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return {
      ok: false,
      error:
        mongoose.connection.readyState === 2
          ? 'Database is currently connecting'
          : 'Database is disconnected',
    };
  }

  const start = Date.now();
  try {
    await mongoose.connection.db.admin().ping();
    return {
      ok: true,
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Ping command failed',
    };
  }
};

/**
 * Return safe metadata describing the current connection state without leaking secrets
 */
export const getMongoStatus = () => {
  return {
    connected: isMongoConnected(),
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || null,
    dbName: mongoose.connection.name || null,
    uri: maskMongoUri(env.MONGODB_URI),
    lastError,
  };
};

/**
 * Disconnect cleanly during server shutdown
 */
export const disconnectMongoDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

