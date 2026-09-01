import os from 'os';
import { config } from '../config/index.js';
import { APP_INFO } from '../utils/constants.js';

export class HealthService {
  /**
   * Compute comprehensive system and service health status
   */
  static getHealthStatus() {
    const memoryUsage = process.memoryUsage();
    const uptimeSeconds = Math.floor(process.uptime());

    return {
      status: 'healthy',
      app: APP_INFO.NAME,
      version: APP_INFO.VERSION,
      environment: config.env,
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptimeSeconds,
        formatted: this.formatUptime(uptimeSeconds)
      },
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
