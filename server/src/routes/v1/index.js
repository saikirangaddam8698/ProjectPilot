import { Router } from 'express';
import { ApiController } from '../../controllers/api.controller.js';
import healthRoutes from './health.routes.js';

const router = Router();

// GET /api/v1 (API info & endpoint catalog)
router.get('/', ApiController.getApiRoot);

// Mount sub-resources
router.use('/health', healthRoutes);

export default router;
