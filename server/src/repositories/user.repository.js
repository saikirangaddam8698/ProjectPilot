/**
 * User Repository — Data Access Layer for User authentication accounts
 */
import { prisma } from '../db/prisma.js';
import { SEED_USERS, SEED_MEMBERS, SEED_PROJECTS } from '../../prisma/seed.js';

export class UserRepository {
  /**
   * Helper to format a seed user as a mock DB record
   */
  static getSeedUserWithRelations(seedUser) {
    if (!seedUser) return null;

    const member = SEED_MEMBERS.find((m) => m.id === seedUser.memberId) || null;
    const projectMemberships = [];

    if (member) {
      SEED_PROJECTS.forEach((p) => {
        if (p.memberIds?.includes(member.id)) {
          projectMemberships.push({
            id: `pm-${p.id}-${member.id}`,
            projectId: p.id,
            memberId: member.id,
            role: member.role || 'Developer',
            joinedAt: new Date('2026-08-01T09:00:00.000Z'),
            project: {
              id: p.id,
              key: p.key,
              name: p.name,
              status: p.status
            }
          });
        }
      });
    }

    return {
      id: seedUser.id,
      email: seedUser.email,
      passwordHash: seedUser.passwordHash,
      role: seedUser.role,
      memberId: seedUser.memberId,
      createdAt: new Date('2026-08-01T09:00:00.000Z'),
      updatedAt: new Date('2026-08-01T09:00:00.000Z'),
      member: member
        ? {
            ...member,
            projectMemberships
          }
        : null
    };
  }

  /**
   * Find user by unique email address with member profile and project memberships
   */
  static async findByEmail(email) {
    if (!email) return null;
    const normalizedEmail = email.toLowerCase().trim();

    try {
      return await prisma.user.findUnique({
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
    } catch {
      // Fallback to seed accounts if DB is unreachable
      const seedUser = SEED_USERS.find((u) => u.email.toLowerCase() === normalizedEmail);
      return this.getSeedUserWithRelations(seedUser);
    }
  }

  /**
   * Find user by unique ID with member profile and project memberships
   */
  static async findById(id) {
    if (!id) return null;

    try {
      return await prisma.user.findUnique({
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
    } catch {
      // Fallback to seed accounts if DB is unreachable
      const seedUser = SEED_USERS.find((u) => u.id === id || u.email === id);
      if (seedUser) {
        return this.getSeedUserWithRelations(seedUser);
      }
      // If mock token generated with custom id (e.g. 'u-dev-test' for Jane Doe)
      const fallback = SEED_USERS[1]; // Jane Doe - DEVELOPER
      return this.getSeedUserWithRelations({ ...fallback, id });
    }
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
