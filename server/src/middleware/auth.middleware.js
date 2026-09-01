/**
 * Authentication & Authorization Middleware
 */
import { verifyAuthToken } from '../utils/token.js';
import { AuthService } from '../services/auth.service.js';
import { ApiError } from '../utils/apiError.js';
import { config } from '../config/index.js';

/**
 * Authenticate incoming request using HTTP-only cookie or Bearer Authorization header
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check HTTP-only cookie
    if (req.cookies && req.cookies[config.auth.cookieName]) {
      token = req.cookies[config.auth.cookieName];
    }

    // 2. Check Authorization Bearer header (for test suites / API integrations)
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      throw ApiError.unauthorized('Authentication required: No active session or token provided');
    }

    // 3. Verify JWT token
    let decoded;
    try {
      decoded = verifyAuthToken(token);
    } catch (err) {
      // Clear potentially invalid cookie
      res.clearCookie(config.auth.cookieName, { path: '/' });
      throw ApiError.unauthorized(`Invalid or expired session: ${err.message}`);
    }

    // 4. Resolve authenticated user profile and project memberships
    const user = await AuthService.getCurrentUser(decoded.id, decoded.role);
    if (!user) {
      res.clearCookie(config.auth.cookieName, { path: '/' });
      throw ApiError.unauthorized('Authenticated user not found or inactive');
    }

    // Attach to request context
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Enforce minimum Global Role (RBAC)
 * e.g., requireRole('ADMIN', 'PROJECT_MANAGER')
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Forbidden: Action requires one of [${allowedRoles.join(', ')}] global role. Your role is ${req.user.role}`
        )
      );
    }

    next();
  };
};

/**
 * Enforce Project-level membership and optional project role
 * e.g., requireProjectAccess('Project Admin')
 */
export const requireProjectAccess = (minProjectRole = null) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Global ADMIN always has superuser access across all projects
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const projectKey = (
      req.params.projectKey ||
      req.body.projectKey ||
      req.query.projectKey ||
      ''
    ).toUpperCase();

    if (!projectKey) {
      return next();
    }

    const membership = (req.user.projectMemberships || []).find(
      (pm) => pm.projectKey?.toUpperCase() === projectKey
    );

    if (!membership) {
      return next(
        ApiError.forbidden(`Forbidden: You are not a member of project workspace "${projectKey}"`)
      );
    }

    // Check project-specific role if specified
    if (minProjectRole) {
      const userProjectRole = membership.projectRole;
      const isProjectAdmin = userProjectRole === 'Project Admin' || userProjectRole === 'Lead';

      if (!isProjectAdmin && userProjectRole !== minProjectRole) {
        return next(
          ApiError.forbidden(
            `Forbidden: Action requires "${minProjectRole}" role in project "${projectKey}". Your project role is "${userProjectRole}"`
          )
        );
      }
    }

    next();
  };
};
