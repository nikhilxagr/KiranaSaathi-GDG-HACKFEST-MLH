import { app } from './app';
import { env } from './utils/env';
import { connectMongoDB, disconnectMongoDB, maskMongoUri } from './db/mongodb';

const server = app.listen(env.PORT, async () => {
  console.log(`🚀 KiranaSathi Backend running on http://localhost:${env.PORT}`);
  console.log(`🩺 Health check available at: http://localhost:${env.PORT}/api/health`);
  console.log(`🩺 Readiness check available at: http://localhost:${env.PORT}/api/health/ready`);
  console.log(`🌐 Allowed frontend origin: ${env.FRONTEND_URL}`);
  console.log(`⚙️ Environment: ${env.NODE_ENV}`);
  console.log(`🍃 Configured MongoDB URI: ${maskMongoUri(env.MONGODB_URI)}`);

  // Attempt connection to MongoDB
  await connectMongoDB();
});

// Graceful shutdown handling
const handleShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  await disconnectMongoDB();
  server.close(() => {
    console.log('Server closed cleanly. Goodbye!');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export { server };
