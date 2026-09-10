import { Router } from 'express';
import { ApiController } from '../../controllers/api.controller.js';
import authRoutes from './auth.routes.js';
import healthRoutes from './health.routes.js';
import projectRoutes from './project.routes.js';
import ticketRoutes from './ticket.routes.js';
import sprintRoutes from './sprint.routes.js';
import memberRoutes from './member.routes.js';
import activityRoutes from './activity.routes.js';
import aiRoutes from './ai.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

// GET /api/v1 (API info & endpoint catalog - public)
router.get('/', ApiController.getApiRoot);

// Public sub-resources
router.use('/auth', authRoutes);
router.use('/health', healthRoutes);

// Protected sub-resources
router.use('/projects', projectRoutes);
router.use('/tickets', ticketRoutes);
router.use('/sprints', sprintRoutes);
router.use('/members', memberRoutes);
router.use('/activities', activityRoutes);
router.use('/ai', aiRoutes);
router.use('/notifications', notificationRoutes);

export default router;
