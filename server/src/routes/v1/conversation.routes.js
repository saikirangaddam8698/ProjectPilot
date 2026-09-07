/**
 * Task 17 — Conversation Routes
 * Mounted under /api/v1/projects/:projectKey/conversations
 */
import { Router } from 'express';
import { ConversationController } from '../../controllers/conversation.controller.js';
import { authenticate, requireProjectAccess } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.js';
import { aiRateLimiter } from '../../middleware/rateLimiter.js';
import {
  createConversationSchema,
  sendMessageSchema
} from '../../validators/conversation.validator.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router({ mergeParams: true });

// All conversation endpoints require authenticated session and project membership
router.use(authenticate);
router.use(requireProjectAccess());
router.use(aiRateLimiter);

// List conversations & Create new conversation
router
  .route('/')
  .get(asyncHandler(ConversationController.listConversations))
  .post(validate(createConversationSchema), asyncHandler(ConversationController.createConversation));

// Get single conversation details & Delete conversation
router
  .route('/:conversationId')
  .get(asyncHandler(ConversationController.getConversation))
  .delete(asyncHandler(ConversationController.deleteConversation));

// Send message within conversation
router.post(
  '/:conversationId/messages',
  validate(sendMessageSchema),
  asyncHandler(ConversationController.sendMessage)
);

export default router;
