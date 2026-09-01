import app from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { connectDatabase, disconnectDatabase } from './db/prisma.js';

// Initialize HTTP server
const server = app.listen(config.port, async () => {
  logger.info(`🚀 ProjectPilot Server running in ${config.env.toUpperCase()} mode`);
  logger.info(`📡 Listening on http://localhost:${config.port}`);
  logger.info(`🩺 Health check: http://localhost:${config.port}/api/health`);
  logger.info(`📋 API Root: http://localhost:${config.port}${config.apiPrefix}`);

  // Test database connection on startup (non-fatal for dev flexibility)
  await connectDatabase();
});

// Graceful Shutdown Handler
const gracefulShutdown = async (signal) => {
  logger.warn(`⚠️ Received ${signal}. Starting graceful shutdown...`);

  // Close Prisma connections
  await disconnectDatabase();

  server.close(() => {
    logger.info('🔒 HTTP server closed gracefully. Exiting process.');
    process.exit(0);
  });

  // Force close after 10s if connections linger
  setTimeout(() => {
    logger.error('❌ Could not close connections in time, forcefully shutting down.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection at Promise:', { reason });
});

process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception thrown:', { message: error.message, stack: error.stack });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

export default server;
