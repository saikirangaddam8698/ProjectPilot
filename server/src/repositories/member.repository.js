/**
 * Member Repository — Data Access Layer for Workspace Member entities
 */
import { prisma } from '../db/prisma.js';

export class MemberRepository {
  /**
   * Find all members with optional filtering
   */
  static async findAll({ status, department, search } = {}) {
    const where = {};
    if (status && status !== 'all') where.status = status.toUpperCase();
    if (department && department !== 'all') where.department = department;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } }
      ];
    }

    return prisma.member.findMany({
      where,
      include: {
        projectMemberships: {
          include: {
            project: {
              select: { id: true, key: true, name: true }
            }
          }
        },
        _count: {
          select: {
            assignedTickets: true,
            ledProjects: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Find member by unique ID
   */
  static async findById(id) {
    return prisma.member.findUnique({
      where: { id },
      include: {
        projectMemberships: {
          include: {
            project: true
          }
        },
        assignedTickets: {
          include: {
            project: true,
            sprint: true
          }
        },
        ledProjects: true
      }
    });
  }

  /**
   * Find member by email address
   */
  static async findByEmail(email) {
    if (!email) return null;
    return prisma.member.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        projectMemberships: {
          include: {
            project: true
          }
        }
      }
    });
  }

  /**
   * Create a new team member
   */
  static async create(data) {
    return prisma.member.create({
      data,
      include: {
        projectMemberships: true
      }
    });
  }

  /**
   * Update an existing team member
   */
  static async update(id, data) {
    return prisma.member.update({
      where: { id },
      data,
      include: {
        projectMemberships: true
      }
    });
  }

  /**
   * Delete a team member
   */
  static async delete(id) {
    return prisma.member.delete({
      where: { id }
    });
  }
}
