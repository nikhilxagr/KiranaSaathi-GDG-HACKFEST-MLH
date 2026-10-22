import { app } from './app';
import { env } from './utils/env';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 KiranaSathi Backend running on http://localhost:${env.PORT}`);
  console.log(`🩺 Health check available at: http://localhost:${env.PORT}/api/health`);
  console.log(`🩺 Readiness check available at: http://localhost:${env.PORT}/api/health/ready`);
  console.log(`🌐 Allowed frontend origin: ${env.FRONTEND_URL}`);
  console.log(`⚙️ Environment: ${env.NODE_ENV}`);
});

// Graceful shutdown handling
const handleShutdown = (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed cleanly. Goodbye!');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export { server };
