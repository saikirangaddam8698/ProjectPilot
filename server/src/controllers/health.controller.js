import { HealthService } from '../services/health.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../utils/constants.js';

export class HealthController {
  /**
   * Health Check Handler
   * GET /api/health or GET /api/v1/health
   */
  static getHealth(req, res) {
    const health = HealthService.getHealthStatus();
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'ProjectPilot Server is operational',
      data: health
    });
  }

  /**
   * Detailed System Status Handler
   * GET /api/v1/health/system
   */
  static getSystemInfo(req, res) {
    const health = HealthService.getHealthStatus();
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'System diagnostics retrieved successfully',
      data: health.system
    });
  }
}
