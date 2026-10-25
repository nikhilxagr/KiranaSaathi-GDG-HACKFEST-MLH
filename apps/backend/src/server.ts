import http from 'http';
import { app } from './app';
import { env } from './utils/env';
import { connectMongoDB, disconnectMongoDB, maskMongoUri } from './db/mongodb';

export let server: http.Server;

const startServer = async () => {
  // Attempt initial connection to MongoDB during startup
  const dbResult = await connectMongoDB();

  server = app.listen(env.PORT, () => {
    console.log(`🚀 KiranaSathi Backend running on http://localhost:${env.PORT}`);
    console.log(`🩺 Health check available at: http://localhost:${env.PORT}/api/health`);
    console.log(`🩺 Database health available at: http://localhost:${env.PORT}/api/health/db`);
    console.log(`🩺 Readiness check available at: http://localhost:${env.PORT}/api/health/ready`);
    console.log(`🌐 Allowed frontend origin: ${env.FRONTEND_URL}`);
    console.log(`⚙️ Environment: ${env.NODE_ENV}`);
    console.log(`🍃 Configured MongoDB URI: ${maskMongoUri(env.MONGODB_URI)}`);
    if (dbResult.success) {
      console.log(`✅ MongoDB: Connected`);
    } else {
      console.log(`⚠️ MongoDB: Offline-first fallback mode active (${dbResult.message})`);
    }
  });

  // Graceful shutdown handling
  const handleShutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    await disconnectMongoDB();
    if (server) {
      server.close(() => {
        console.log('Server closed cleanly. Goodbye!');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));

  return server;
};

startServer();

