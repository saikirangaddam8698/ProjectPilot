/**
 * Auth Controller — HTTP Request Handlers for Authentication & Session
 */
import { AuthService } from '../services/auth.service.js';
import { getCookieOptions, getClearCookieOptions } from '../utils/token.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { config } from '../config/index.js';
import { HTTP_STATUS } from '../utils/constants.js';

export class AuthController {
  /**
   * POST /api/v1/auth/login
   */
  static async login(req, res) {
    const { email, password } = req.body;
    const { user, token } = await AuthService.login({ email, password });

    // Set secure HTTP-only cookie
    res.cookie(config.auth.cookieName, token, getCookieOptions());

    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Logged in successfully',
      data: {
        user,
        token
      }
    });
  }

  /**
   * POST /api/v1/auth/logout
   */
  static async logout(req, res) {
    // Clear HTTP-only cookie cleanly
    res.clearCookie(config.auth.cookieName, getClearCookieOptions());

    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Logged out successfully',
      data: null
    });
  }

  /**
   * GET /api/v1/auth/me
   */
  static async getMe(req, res) {
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Current authenticated session retrieved',
      data: req.user
    });
  }
}
