/**
 * ProjectPilot Prisma Database Client & Lifecycle Manager
 * Provides singleton PrismaClient instance, connection lifecycle, and health verification.
 */
import { PrismaClient } from '../generated/client/index.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// Configure logging levels for Prisma based on runtime environment
const prismaLogLevels = config.isTest
  ? ['error']
  : config.isDevelopment
    ? ['warn', 'error']
    : ['warn', 'error'];

/**
 * Singleton PrismaClient instance
 */
export const prisma = new PrismaClient({
  log: prismaLogLevels.map((level) => ({
    emit: 'event',
    level
  }))
});

// Bind log events to centralized application logger
prisma.$on('warn', (e) => logger.warn(`⚠️ [Prisma Warning]: ${e.message}`));
prisma.$on('error', (e) => logger.error(`❌ [Prisma Error]: ${e.message}`));

/**
 * Connect to PostgreSQL database and verify connection
 * @returns {Promise<boolean>}
 */
export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('🐘 PostgreSQL database connected successfully via Prisma Client');
    return true;
  } catch (error) {
    logger.error('❌ Failed to connect to PostgreSQL database:', {
      message: error.message,
      code: error.code
    });
    return false;
  }
}

/**
 * Gracefully disconnect Prisma client from PostgreSQL
 * @returns {Promise<void>}
 */
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    logger.info('🔒 PostgreSQL connection closed gracefully');
  } catch (error) {
    logger.error('❌ Error disconnecting PostgreSQL database:', { message: error.message });
  }
}

/**
 * Check database health and latency
 * @returns {Promise<{ status: 'connected' | 'disconnected', latencyMs?: number, provider: string, error?: string }>}
 */
export async function checkDatabaseHealth() {
  const start = performance.now();
  try {
    // Run simple lightweight ping query
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Math.round((performance.now() - start) * 100) / 100;

    return {
      status: 'connected',
      latencyMs,
      provider: 'postgresql'
    };
  } catch (error) {
    const latencyMs = Math.round((performance.now() - start) * 100) / 100;
    return {
      status: 'disconnected',
      latencyMs,
      provider: 'postgresql',
      error: error.message
    };
  }
}

export default prisma;
