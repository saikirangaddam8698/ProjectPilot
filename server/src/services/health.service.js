import os from 'os';
import { config } from '../config/index.js';
import { APP_INFO } from '../utils/constants.js';
import { DatabaseService } from './database.service.js';

export class HealthService {
  /**
   * Compute comprehensive system and service health status
   * @param {boolean} includeDb - whether to include database verification
   */
  static async getHealthStatus(includeDb = true) {
    const memoryUsage = process.memoryUsage();
    const uptimeSeconds = Math.floor(process.uptime());

    let dbHealth = null;
    if (includeDb) {
      dbHealth = await DatabaseService.verifyHealth();
    }

    const overallStatus = dbHealth && dbHealth.status === 'disconnected' ? 'degraded' : 'healthy';

    return {
      status: overallStatus,
      app: APP_INFO.NAME,
      version: APP_INFO.VERSION,
      environment: config.env,
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptimeSeconds,
        formatted: this.formatUptime(uptimeSeconds)
      },
      ...(dbHealth ? { database: dbHealth } : {}),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        memory: {
          rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
          heapTotalMb: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
          heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100
        },
        cpuLoad: os.loadavg()
      }
    };
  }

  /**
   * Get database-specific health and diagnostics
   */
  static async getDatabaseHealth() {
    return DatabaseService.verifyHealth();
  }

  /**
   * Get production readiness status (checks DB connectivity & AI configuration)
   */
  static async getReadiness() {
    const dbHealth = await DatabaseService.verifyHealth();
    const isDbReady = dbHealth.status === 'connected';
    const isAiConfigured = Boolean(config.ai.geminiApiKey || process.env.GEMINI_API_KEY);

    const isReady = isDbReady;

    return {
      status: isReady ? 'ready' : 'unready',
      timestamp: new Date().toISOString(),
      checks: {
        database: isDbReady ? 'connected' : 'disconnected',
        aiService: isAiConfigured ? 'configured' : 'unconfigured'
      }
    };
  }

  /**
   * Helper to format seconds into readable uptime string
   * @param {number} seconds
   * @returns {string}
   */
  static formatUptime(seconds) {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const sec = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${sec}s`);

    return parts.join(' ');
  }
}
