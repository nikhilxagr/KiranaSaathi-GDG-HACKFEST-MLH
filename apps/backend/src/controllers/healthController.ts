import { Request, Response } from 'express';
import { getHealthStatus, getReadinessStatus } from '../services/healthService';
import { env } from '../utils/env';

export const getHealth = (_req: Request, res: Response): void => {
  const health = getHealthStatus(env.NODE_ENV);
  res.status(200).json(health);
};

export const getReadiness = (_req: Request, res: Response): void => {
  const readiness = getReadinessStatus();
  res.status(200).json(readiness);
};
