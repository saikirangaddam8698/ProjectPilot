import { HealthService } from '../services/health.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../utils/constants.js';

export class HealthController {
  /**
   * Health Check Handler
   * GET /api/health or GET /api/v1/health
   */
  static async getHealth(req, res) {
    const includeDb = req.query.db !== 'false';
    const health = await HealthService.getHealthStatus(includeDb);
    const statusCode = health.status === 'healthy' ? HTTP_STATUS.OK : HTTP_STATUS.OK;

    return ApiResponse.success(res, {
      statusCode,
      message: 'ProjectPilot Server is operational',
      data: health
    });
  }

  /**
   * Detailed System Status Handler
   * GET /api/v1/health/system
   */
  static async getSystemInfo(req, res) {
    const health = await HealthService.getHealthStatus(false);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'System diagnostics retrieved successfully',
      data: health.system
    });
  }

  /**
   * Database Health & Diagnostics Handler
   * GET /api/v1/health/db
   */
  static async getDatabaseHealth(req, res) {
    const dbHealth = await HealthService.getDatabaseHealth();
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Database diagnostics retrieved successfully',
      data: dbHealth
    });
  }
}
