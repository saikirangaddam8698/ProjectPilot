import { Router } from 'express';
import { MemberController } from '../../controllers/member.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { createMemberSchema, updateMemberSchema } from '../../validators/member.validator.js';

const router = Router();

// Protect all member endpoints with authentication
router.use(authenticate);

// GET /api/v1/members
router.get('/', asyncHandler(MemberController.getAllMembers));

// POST /api/v1/members (Global Admin only)
router.post(
  '/',
  requireRole('ADMIN'),
  validate(createMemberSchema),
  asyncHandler(MemberController.createMember)
);

// GET /api/v1/members/:memberId
router.get('/:memberId', asyncHandler(MemberController.getMemberById));

// PATCH /api/v1/members/:memberId (Global Admin only)
router.patch(
  '/:memberId',
  requireRole('ADMIN'),
  validate(updateMemberSchema),
  asyncHandler(MemberController.updateMember)
);

// DELETE /api/v1/members/:memberId (Global Admin only)
router.delete(
  '/:memberId',
  requireRole('ADMIN'),
  asyncHandler(MemberController.deleteMember)
);

export default router;
