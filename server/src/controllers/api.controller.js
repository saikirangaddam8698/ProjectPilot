import { APP_INFO, HTTP_STATUS } from '../utils/constants.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { config } from '../config/index.js';

export class ApiController {
  /**
   * Root API & Version Discovery Handler
   * GET /api/v1
   */
  static getApiRoot(req, res) {
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: `${APP_INFO.NAME} Root`,
      data: {
        name: APP_INFO.NAME,
        version: APP_INFO.VERSION,
        description: APP_INFO.DESCRIPTION,
        status: 'active',
        environment: config.env,
        endpoints: {
          health: `${config.apiPrefix}/health`,
          system: `${config.apiPrefix}/health/system`
        }
      }
    });
  }
}
