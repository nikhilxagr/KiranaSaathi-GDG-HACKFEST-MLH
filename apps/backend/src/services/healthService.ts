export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
}

export const getHealthStatus = (environment: string): HealthStatus => {
  return {
    status: 'ok',
    service: 'kiranasathi-backend',
    version: '0.1.0',
    environment,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  };
};
