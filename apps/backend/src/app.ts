import express, { Express } from 'express';
import cors from 'cors';
import apiRouter from './routes';
import { notFoundHandler } from './middleware/notFoundHandler';
import { errorHandler } from './middleware/errorHandler';
import { env } from './utils/env';

export const createApp = (): Express => {
  const app = express();

  // Configure explicit CORS origins
  const allowedOrigins = [
    env.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Permit requests with no origin (e.g. server-to-server, curl, mobile native or test runner)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked for origin: ${origin}`));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      credentials: true,
    })
  );

  // Parse JSON requests with safe 100kb limit
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Root discovery endpoint
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      service: 'kiranasathi-backend',
      appName: 'KiranaSathi',
      version: '0.1.0',
      description: 'Backend API service for KiranaSathi',
      healthCheck: '/api/health',
      readinessCheck: '/api/health/ready',
    });
  });

  // Mount API router
  app.use('/api', apiRouter);

  // Catch-all 404 and centralized error handler
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();
