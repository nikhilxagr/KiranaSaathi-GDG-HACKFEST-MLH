import express, { Express } from 'express';
import cors from 'cors';
import apiRouter from './routes';
import { notFoundHandler } from './middleware/notFoundHandler';
import { errorHandler } from './middleware/errorHandler';
import { env } from './utils/env';

export const createApp = (): Express => {
  const app = express();

  // Basic security and parsing middleware
  app.use(
    cors({
      origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Root welcome endpoint for API discovery
  app.get('/', (_req, res) => {
    res.json({
      name: 'KiranaSathi API',
      version: '0.1.0',
      description: 'Backend services for KiranaSathi kirana inventory assistant',
      healthCheck: '/api/health',
    });
  });

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Catch-all 404 and Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();
