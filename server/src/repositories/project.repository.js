/**
 * Project Repository — Data Access Layer for Project entities
 */
import { prisma } from '../db/prisma.js';

export class ProjectRepository {
  /**
   * Find all projects with optional filtering
   */
  static async findAll({ status, search } = {}) {
    const where = {};
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { key: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    return prisma.project.findMany({
      where,
      include: {
        lead: true,
        members: {
          include: {
            member: true
          }
        },
        sprints: {
          orderBy: { createdAt: 'desc' }
        },
        tickets: {
          select: {
            id: true,
            status: true,
            priority: true,
            storyPoints: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find project by ID
   */
  static async findById(id) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        lead: true,
        members: {
          include: {
            member: true
          }
        },
        sprints: {
          orderBy: { createdAt: 'desc' }
        },
        tickets: {
          select: {
            id: true,
            status: true,
            priority: true,
            storyPoints: true
          }
        }
      }
    });
  }

  /**
   * Find project by unique project key (e.g. 'PILOT')
   */
  static async findByKey(key) {
    if (!key) return null;
    return prisma.project.findUnique({
      where: { key: key.toUpperCase() },
      include: {
        lead: true,
        members: {
          include: {
            member: true
          }
        },
        sprints: {
          orderBy: { createdAt: 'desc' }
        },
        tickets: {
          select: {
            id: true,
            status: true,
            priority: true,
            storyPoints: true
          }
        }
      }
    });
  }

  /**
   * Create a new project
   */
  static async create(data) {
    return prisma.project.create({
      data,
      include: {
        lead: true,
        members: {
          include: {
            member: true
          }
        },
        sprints: true
      }
    });
  }

  /**
   * Update an existing project
   */
  static async update(id, data) {
    return prisma.project.update({
      where: { id },
      data,
      include: {
        lead: true,
        members: {
          include: {
            member: true
          }
        },
        sprints: true
      }
    });
  }

  /**
   * Delete a project by ID
   */
  static async delete(id) {
    return prisma.project.delete({
      where: { id }
    });
  }

  /**
   * Add a team member to a project
   */
  static async addMember(projectId, memberId, role = 'Developer') {
    return prisma.projectMember.upsert({
      where: {
        projectId_memberId: {
          projectId,
          memberId
        }
      },
      update: { role },
      create: {
        projectId,
        memberId,
        role
      },
      include: {
        member: true,
        project: true
      }
    });
  }

  /**
   * Remove a team member from a project
   */
  static async removeMember(projectId, memberId) {
    return prisma.projectMember.deleteMany({
      where: {
        projectId,
        memberId
      }
    });
  }
}
