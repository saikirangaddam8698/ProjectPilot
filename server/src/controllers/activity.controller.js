/**
 * Activity Controller — HTTP Request Handlers for Audit/Activity log
 */
import { ActivityService } from '../services/activity.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../utils/constants.js';

export class ActivityController {
  static async getAllActivities(req, res) {
    const { projectKey, type, actorId, limit, offset } = req.query;
    const activities = await ActivityService.getAllActivities({ projectKey, type, actorId, limit, offset });
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Activities retrieved successfully',
      data: activities
    });
  }

  static async recordActivity(req, res) {
    const activity = await ActivityService.recordActivity(req.body);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Activity recorded successfully',
      data: activity
    });
  }
}
