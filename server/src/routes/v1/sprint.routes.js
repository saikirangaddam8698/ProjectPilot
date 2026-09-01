import { Router } from 'express';
import { SprintController } from '../../controllers/sprint.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requireRole, requireProjectAccess } from '../../middleware/auth.middleware.js';
import { createSprintSchema, updateSprintSchema } from '../../validators/sprint.validator.js';

const router = Router();

// Protect all sprint endpoints with authentication
router.use(authenticate);

// GET /api/v1/sprints
router.get('/', asyncHandler(SprintController.getAllSprints));

// POST /api/v1/sprints (Project Manager or Admin with Project Admin role)
router.post(
  '/',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  requireProjectAccess('Project Admin'),
  validate(createSprintSchema),
  asyncHandler(SprintController.createSprint)
);

// GET /api/v1/sprints/:sprintId
router.get('/:sprintId', asyncHandler(SprintController.getSprintById));

// PATCH /api/v1/sprints/:sprintId
router.patch(
  '/:sprintId',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  requireProjectAccess('Project Admin'),
  validate(updateSprintSchema),
  asyncHandler(SprintController.updateSprint)
);

// POST /api/v1/sprints/:sprintId/start
router.post(
  '/:sprintId/start',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  requireProjectAccess('Project Admin'),
  asyncHandler(SprintController.startSprint)
);

// POST /api/v1/sprints/:sprintId/complete
router.post(
  '/:sprintId/complete',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  requireProjectAccess('Project Admin'),
  asyncHandler(SprintController.completeSprint)
);

// DELETE /api/v1/sprints/:sprintId
router.delete(
  '/:sprintId',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  requireProjectAccess('Project Admin'),
  asyncHandler(SprintController.deleteSprint)
);

export default router;
