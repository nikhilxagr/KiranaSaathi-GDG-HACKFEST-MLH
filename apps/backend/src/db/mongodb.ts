import mongoose from 'mongoose';
import { env } from '../utils/env';

let isConnected = false;
let lastError: string | null = null;

/**
 * Mask credentials in MongoDB connection string for safe logging and display
 */
export const maskMongoUri = (uri: string): string => {
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  } catch {
    return 'mongodb://***';
  }
};

export const connectMongoDB = async (
  customUri?: string
): Promise<{ success: boolean; message: string }> => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return { success: true, message: 'Already connected to MongoDB.' };
  }

  const uri = customUri || env.MONGODB_URI;
  const masked = maskMongoUri(uri);

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
    });

    isConnected = true;
    lastError = null;
    console.log(`[MongoDB] Connected successfully to ${masked}`);
    return { success: true, message: `Connected to MongoDB (${masked})` };
  } catch (error: any) {
    isConnected = false;
    lastError = error?.message || 'Connection failed or timed out';
    console.warn(`[MongoDB] Unable to connect to ${masked}: ${lastError}`);
    return { success: false, message: lastError || 'Connection failed or timed out' };
  }
};

export const isMongoConnected = (): boolean =>
  isConnected && mongoose.connection.readyState === 1;

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

export const disconnectMongoDB = async (): Promise<void> => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
};
