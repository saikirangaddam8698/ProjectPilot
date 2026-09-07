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
      message: `${APP_INFO.NAME} API v1`,
      data: {
        name: APP_INFO.NAME,
        version: 'v1',
        description: APP_INFO.DESCRIPTION,
        status: 'active',
        environment: config.env,
        endpoints: {
          auth: `${config.apiPrefix}/auth`,
          health: `${config.apiPrefix}/health`,
          databaseHealth: `${config.apiPrefix}/health/db`,
          system: `${config.apiPrefix}/health/system`,
          projects: `${config.apiPrefix}/projects`,
          tickets: `${config.apiPrefix}/tickets`,
          sprints: `${config.apiPrefix}/sprints`,
          members: `${config.apiPrefix}/members`,
          activities: `${config.apiPrefix}/activities`,
          ai: `${config.apiPrefix}/ai`,
          knowledge: `${config.apiPrefix}/projects/:projectKey/knowledge`
        }
      }
    });
  }
}
