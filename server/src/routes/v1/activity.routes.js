import { Router } from 'express';
import { ActivityController } from '../../controllers/activity.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requireRole, requireProjectAccess } from '../../middleware/auth.middleware.js';
import { recordActivitySchema } from '../../validators/activity.validator.js';

const router = Router();

// Protect all activity endpoints with authentication
router.use(authenticate);

// GET /api/v1/activities
router.get('/', asyncHandler(ActivityController.getAllActivities));

// POST /api/v1/activities
router.post(
  '/',
  requireRole('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'),
  requireProjectAccess(),
  validate(recordActivitySchema),
  asyncHandler(ActivityController.recordActivity)
);

export default router;
