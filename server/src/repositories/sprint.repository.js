/**
 * Sprint Repository — Data Access Layer for Sprint entities
 */
import { prisma } from '../db/prisma.js';

export class SprintRepository {
  /**
   * Find all sprints with optional filters
   */
  static async findAll({ projectId, projectKey, status, allowedProjectKeys } = {}) {
    const where = {};
    if (projectId) where.projectId = projectId;
    if (projectKey && projectKey !== 'all') {
      where.project = { key: projectKey.toUpperCase() };
    } else if (Array.isArray(allowedProjectKeys)) {
      where.project = { key: { in: allowedProjectKeys.map((k) => k.toUpperCase()) } };
    }
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
   * Find the active sprint for a project by projectKey, with its tickets and assignees.
   * Optimized for AI tool use: single DB query, only fetches the ACTIVE sprint,
   * avoids the N+1 pattern of findAll(all sprints) + findAll(all tickets) separately.
   *
   * @param {string} projectKey - Uppercase project key (e.g. 'PILOT')
   * @returns {Promise<object|null>} Sprint with sprint.tickets[] included, or null if none
   */
  static async findActiveSprintWithTickets(projectKey) {
    return prisma.sprint.findFirst({
      where: {
        project: { key: projectKey.toUpperCase() },
        status: 'ACTIVE'
      },
      include: {
        project: { select: { id: true, key: true, name: true } },
        tickets: {
          select: {
            id: true,
            key: true,
            title: true,
            status: true,
            priority: true,
            storyPoints: true,
            sprintId: true,
            assignee: { select: { id: true, name: true, role: true } }
          },
          orderBy: { rank: 'asc' }
        },
        _count: { select: { tickets: true } }
      },
      orderBy: { startDate: 'desc' }
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
