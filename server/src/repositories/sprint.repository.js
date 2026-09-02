/**
 * Sprint Repository — Data Access Layer for Sprint entities
 */
import { prisma } from '../db/prisma.js';

export class SprintRepository {
  /**
   * Find all sprints with optional filters
   */
  static async findAll({ projectId, projectKey, status } = {}) {
    const where = {};
    if (projectId) where.projectId = projectId;
    if (projectKey) where.project = { key: projectKey.toUpperCase() };
    if (status && status !== 'all') where.status = status.toUpperCase();

    return prisma.sprint.findMany({
      where,
      include: {
        project: {
          select: { id: true, key: true, name: true }
        },
        tickets: true,
        _count: {
          select: { tickets: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find sprint by unique ID
   */
  static async findById(id) {
    return prisma.sprint.findUnique({
      where: { id },
      include: {
        project: true,
        tickets: {
          include: {
            assignee: true,
            reporter: true
          },
          orderBy: { rank: 'asc' }
        },
        _count: {
          select: { tickets: true }
        }
      }
    });
  }

  /**
   * Find the currently active sprint for a project
   */
  static async findActiveSprint(projectId) {
    return prisma.sprint.findFirst({
      where: {
        projectId,
        status: 'ACTIVE'
      }
    });
  }

  /**
   * Create a new sprint
   */
  static async create(data) {
    return prisma.sprint.create({
      data,
      include: {
        project: true,
        tickets: true
      }
    });
  }

  /**
   * Update an existing sprint
   */
  static async update(id, data) {
    return prisma.sprint.update({
      where: { id },
      data,
      include: {
        project: true,
        tickets: true
      }
    });
  }

  /**
   * Complete a sprint
   */
  static async completeSprint(id) {
    return prisma.sprint.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      },
      include: {
        project: true,
        tickets: true
      }
    });
  }

  /**
   * Delete a sprint
   */
  static async delete(id) {
    return prisma.sprint.delete({
      where: { id }
    });
  }
}
