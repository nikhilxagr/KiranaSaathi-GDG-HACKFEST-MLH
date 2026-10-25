import { isMongoConnected, pingMongoDB, getMongoStatus } from '../db/mongodb';

export interface HealthStatus {
  success: boolean;
  status: 'ok' | 'degraded' | 'error';
  service: string;
  appName: string;
  version: string;
  environment: string;
  mongodb: 'connected' | 'disconnected';
  timestamp: string;
  uptimeSeconds: number;
}

export interface DbHealthStatus {
  success: boolean;
  connected: boolean;
  status: 'connected' | 'disconnected' | 'connecting' | 'degraded';
  readyState: number;
  database?: string | null;
  host?: string | null;
  pingMs?: number;
  message?: string;
  timestamp: string;
}

export interface ReadinessStatus {
  success: boolean;
  ready: boolean;
  service: string;
  timestamp: string;
}

export const getHealthStatus = (environment: string): HealthStatus => {
  return {
    success: true,
    status: 'ok',
    service: 'kiranasathi-backend',
    appName: 'KiranaSathi',
    version: '0.1.0',
    environment,
    mongodb: isMongoConnected() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  };
};

export const getDbHealthStatus = async (): Promise<DbHealthStatus> => {
  const status = getMongoStatus();
  const timestamp = new Date().toISOString();

  if (!status.connected) {
    let readableStatus: DbHealthStatus['status'] = 'disconnected';
    if (status.readyState === 2) readableStatus = 'connecting';
    else if (status.readyState === 3) readableStatus = 'degraded';

    return {
      success: false,
      connected: false,
      status: readableStatus,
      readyState: status.readyState,
      message: status.lastError || 'Database is not connected',
      timestamp,
    };
  }

  // Live ping check
  const ping = await pingMongoDB();
  if (!ping.ok) {
    return {
      success: false,
      connected: false,
      status: 'degraded',
      readyState: status.readyState,
      message: ping.error || 'Database ping failed',
      timestamp,
    };
  }

  return {
    success: true,
    connected: true,
    status: 'connected',
    readyState: status.readyState,
    database: status.dbName,
    host: status.host,
    pingMs: ping.latencyMs,
    timestamp,
  };
};

export const getReadinessStatus = (): ReadinessStatus => {
  return {
    success: true,
    ready: true,
    service: 'kiranasathi-backend',
    timestamp: new Date().toISOString(),
  };
};

