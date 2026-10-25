import { Request, Response } from 'express';
import { getHealthStatus, getReadinessStatus, getDbHealthStatus } from '../services/healthService';
import { env } from '../utils/env';

export const getHealth = (_req: Request, res: Response): void => {
  const health = getHealthStatus(env.NODE_ENV);
  res.status(200).json(health);
};

export const getDbHealth = async (_req: Request, res: Response): Promise<void> => {
  const dbHealth = await getDbHealthStatus();
  const statusCode = dbHealth.connected ? 200 : 503;
  res.status(statusCode).json(dbHealth);
};

export const getReadiness = (_req: Request, res: Response): void => {
  const readiness = getReadinessStatus();
  res.status(200).json(readiness);
};
                                                                                                                                                                                    