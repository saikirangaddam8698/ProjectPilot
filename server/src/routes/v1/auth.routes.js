/**
 * Auth Routes — Endpoints for Login, Logout, and Current User Session
 */
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../../controllers/auth.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { loginSchema } from '../../validators/auth.validator.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Strict Rate Limiting on Login Endpoint to prevent brute-force attacks
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 login attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts. Please try again after 15 minutes.'
    }
  }
});

// POST /api/v1/auth/login
router.post('/login', authRateLimiter, validate(loginSchema), asyncHandler(AuthController.login));

// POST /api/v1/auth/logout
router.post('/logout', asyncHandler(AuthController.logout));

// GET /api/v1/auth/me
router.get('/me', authenticate, asyncHandler(AuthController.getMe));

export default router;
