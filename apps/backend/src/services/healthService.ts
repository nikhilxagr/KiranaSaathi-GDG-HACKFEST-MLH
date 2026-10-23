import { isMongoConnected } from '../db/mongodb';

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

export const getReadinessStatus = (): ReadinessStatus => {
  return {
    success: true,
    ready: true,
    service: 'kiranasathi-backend',
    timestamp: new Date().toISOString(),
  };
};
