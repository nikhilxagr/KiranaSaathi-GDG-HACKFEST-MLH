import { Request, Response, NextFunction } from 'express';
import { env } from '../utils/env';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Catch malformed JSON payload (SyntaxError from express.json())
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400 && 'body' in err) {
    res.status(400).json({
      success: false,
      error: 'Invalid JSON payload received.',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Catch CORS origin rejections
  if (err.message && err.message.startsWith('CORS blocked')) {
    res.status(403).json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const statusCode = typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600
    ? err.statusCode
    : 500;

  const isProduction = env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    error: isProduction ? 'Internal Server Error' : err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
};
