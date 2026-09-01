/**
 * Activity Repository — Data Access Layer for Audit / Activity entities
 */
import { prisma } from '../db/prisma.js';

export class ActivityRepository {
  /**
   * Find all activities with optional filters and pagination
   */
  static async findAll({ projectId, projectKey, type, actorId, limit = 50, offset = 0 } = {}) {
    const where = {};
    if (projectId) where.projectId = projectId;
    if (projectKey) where.project = { key: projectKey.toUpperCase() };
    if (type && type !== 'all') where.type = type;
    if (actorId) where.actorId = actorId;

    return prisma.activity.findMany({
      where,
      include: {
        actor: true,
        project: {
          select: { id: true, key: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  /**
   * Find recent activities for a specific project
   */
  static async findByProject(projectId, limit = 50) {
    return prisma.activity.findMany({
      where: { projectId },
      include: {
        actor: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Record a new activity entry
   */
  static async createActivity(data) {
    return prisma.activity.create({
      data,
      include: {
        actor: true
      }
    });
  }
}
