/**
 * Database Service — Database health verification, metrics, and diagnostics
 */
import { prisma, checkDatabaseHealth } from '../db/prisma.js';

export class DatabaseService {
  /**
   * Perform comprehensive database health verification
   * @returns {Promise<object>}
   */
  static async verifyHealth() {
    const health = await checkDatabaseHealth();

    if (health.status !== 'connected') {
      return {
        status: 'disconnected',
        provider: 'postgresql',
        latencyMs: health.latencyMs,
        error: health.error,
        tables: null,
        timestamp: new Date().toISOString()
      };
    }

    // If connected, retrieve quick aggregate counts
    try {
      const [projectCount, ticketCount, sprintCount, memberCount, activityCount] =
        await Promise.all([
          prisma.project.count(),
          prisma.ticket.count(),
          prisma.sprint.count(),
          prisma.member.count(),
          prisma.activity.count()
        ]);

      return {
        status: 'connected',
        provider: 'postgresql',
        latencyMs: health.latencyMs,
        tables: {
          projects: projectCount,
          tickets: ticketCount,
          sprints: sprintCount,
          members: memberCount,
          activities: activityCount
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'degraded',
        provider: 'postgresql',
        latencyMs: health.latencyMs,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get database diagnostics summary
   */
  static async getDiagnostics() {
    return this.verifyHealth();
  }
}
