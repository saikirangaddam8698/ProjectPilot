import { Router } from 'express';
import { ProjectController } from '../../controllers/project.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requireRole, requireProjectAccess } from '../../middleware/auth.middleware.js';
import { createProjectSchema, updateProjectSchema, addProjectMemberSchema } from '../../validators/project.validator.js';

const router = Router();

// Protect all project endpoints with authentication
router.use(authenticate);

// GET /api/v1/projects (All authenticated users can list projects)
router.get('/', asyncHandler(ProjectController.getAllProjects));

// POST /api/v1/projects (Admin or Project Manager global role required)
router.post(
  '/',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  validate(createProjectSchema),
  asyncHandler(ProjectController.createProject)
);

// GET /api/v1/projects/:projectKey (Project member or Admin)
router.get(
  '/:projectKey',
  requireProjectAccess(),
  asyncHandler(ProjectController.getProjectByKey)
);

// PATCH /api/v1/projects/:projectKey (Admin or Project Manager with Project Admin role)
router.patch(
  '/:projectKey',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  requireProjectAccess('Project Admin'),
  validate(updateProjectSchema),
  asyncHandler(ProjectController.updateProject)
);

// DELETE /api/v1/projects/:projectKey (Global Admin only)
router.delete(
  '/:projectKey',
  requireRole('ADMIN'),
  asyncHandler(ProjectController.deleteProject)
);

// POST /api/v1/projects/:projectKey/members (Admin or Project Manager with Project Admin role)
router.post(
  '/:projectKey/members',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  requireProjectAccess('Project Admin'),
  validate(addProjectMemberSchema),
  asyncHandler(ProjectController.addProjectMember)
);

// DELETE /api/v1/projects/:projectKey/members/:memberId (Admin or Project Manager with Project Admin role)
router.delete(
  '/:projectKey/members/:memberId',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  requireProjectAccess('Project Admin'),
  asyncHandler(ProjectController.removeProjectMember)
);

export default router;
