import { Router } from 'express';
import { HealthController } from '../../controllers/health.controller.js';

const router = Router();

// GET /api/v1/health
router.get('/', HealthController.getHealth);

// GET /api/v1/health/system
router.get('/system', HealthController.getSystemInfo);

export default router;
