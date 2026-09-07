import { Router } from 'express';
import { AiController } from '../../controllers/ai.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requireProjectAccess } from '../../middleware/auth.middleware.js';
import { aiRateLimiter } from '../../middleware/rateLimiter.js';
import { aiChatSchema } from '../../validators/ai.validator.js';

const router = Router();

// 1. Enforce authentication on all AI routes
router.use(authenticate);

// 2. Enforce dedicated AI rate limiting
router.use(aiRateLimiter);

/**
 * POST /api/v1/ai/chat
 * Project-aware conversational intelligence
 * Enforces project access check (body.projectKey) and request validation
 */
router.post(
  '/chat',
  validate(aiChatSchema),
  requireProjectAccess(),
  asyncHandler(AiController.chat)
);

/**
 * GET /api/v1/ai/metrics
 * Returns aggregated AI quality, evaluation, and latency metrics
 */
router.get('/metrics', asyncHandler(AiController.getMetrics));
router.get('/evaluation', asyncHandler(AiController.getMetrics));

export default router;
