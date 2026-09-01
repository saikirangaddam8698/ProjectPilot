import { Router } from 'express';
import { HealthController } from '../../controllers/health.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// GET /api/v1/health
router.get('/', asyncHandler(HealthController.getHealth));

// GET /api/v1/health/system
router.get('/system', asyncHandler(HealthController.getSystemInfo));

// GET /api/v1/health/db
router.get('/db', asyncHandler(HealthController.getDatabaseHealth));

export default router;
