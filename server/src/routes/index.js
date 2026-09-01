import { Router } from 'express';
import v1Routes from './v1/index.js';
import { HealthController } from '../controllers/health.controller.js';
import { ApiController } from '../controllers/api.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Top-level aliases for operational visibility
router.get('/health', asyncHandler(HealthController.getHealth));
router.get('/api/health', asyncHandler(HealthController.getHealth));

// Root API information
router.get('/api', asyncHandler(ApiController.getApiRoot));

// Mount versioned v1 API
router.use('/api/v1', v1Routes);

export default router;
