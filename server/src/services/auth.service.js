/**
 * Auth Service — Business logic for Authentication & Current Session
 */
import { UserRepository } from '../repositories/user.repository.js';
import { comparePassword } from '../utils/password.js';
import { generateAuthToken } from '../utils/token.js';
import { ApiError } from '../utils/apiError.js';

export class AuthService {
  /**
   * Sanitize user object to ensure ZERO password hash or secret leakage
   */
  static sanitizeUser(user) {
    if (!user) return null;

    const projectMemberships = (user.member?.projectMemberships || []).map((pm) => ({
      projectId: pm.projectId,
      projectKey: pm.project?.key,
      projectName: pm.project?.name,
      projectRole: pm.role || 'Developer',
      joinedAt: pm.joinedAt
    }));

    const projectKeys = projectMemberships.map((pm) => pm.projectKey).filter(Boolean);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      memberId: user.memberId,
      member: user.member
        ? {
            id: user.member.id,
            name: user.member.name,
            avatar: user.member.avatar,
            email: user.member.email,
            role: user.member.role,
            department: user.member.department,
            status: user.member.status === 'ACTIVE' ? 'Active' : user.member.status === 'AWAY' ? 'Away' : 'Offline',
            skills: user.member.skills || [],
            capacity: user.member.capacity
          }
        : null,
      projectMemberships,
      projectKeys,
      createdAt: user.createdAt
    };
  }

  /**
   * Authenticate user by email & password
   */
  static async login({ email, password }) {
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      // Generic error response to prevent user enumeration
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const sanitizedUser = this.sanitizeUser(user);
    const token = generateAuthToken({
      id: user.id,
      email: user.email,
      role: user.role,
      memberId: user.memberId
    });

    return {
      user: sanitizedUser,
      token
    };
  }

  /**
   * Get currently authenticated user profile
   */
  static async getCurrentUser(userId, tokenRole = null) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw ApiError.unauthorized('Authenticated user session not found');
    }
    const sanitized = this.sanitizeUser(user);
    if (tokenRole) {
      sanitized.role = tokenRole;
    }
    return sanitized;
  }
}
