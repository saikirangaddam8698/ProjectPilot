/**
 * User Repository — Data Access Layer for User authentication accounts
 */
import { prisma } from '../db/prisma.js';

export class UserRepository {
  /**
   * Find user by unique email address with member profile and project memberships
   */
  static async findByEmail(email) {
    if (!email) return null;
    const normalizedEmail = email.toLowerCase().trim();

    return prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        member: {
          include: {
            projectMemberships: {
              include: {
                project: {
                  select: { id: true, key: true, name: true, status: true }
                }
              }
            }
          }
        }
      }
    });
  }

  /**
   * Find user by unique ID with member profile and project memberships
   */
  static async findById(id) {
    if (!id) return null;

    return prisma.user.findUnique({
      where: { id },
      include: {
        member: {
          include: {
            projectMemberships: {
              include: {
                project: {
                  select: { id: true, key: true, name: true, status: true }
                }
              }
            }
          }
        }
      }
    });
  }

  /**
   * Create a new User
   */
  static async create(data) {
    return prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase().trim()
      },
      include: {
        member: true
      }
    });
  }

  /**
   * Update an existing User
   */
  static async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        member: true
      }
    });
  }
}
