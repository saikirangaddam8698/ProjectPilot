/**
 * Activity Controller — HTTP Request Handlers for Audit/Activity log
 */
import { ActivityService } from '../services/activity.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../utils/constants.js';

export class ActivityController {
  static async getAllActivities(req, res) {
    const { projectKey, type, actorId, limit, offset } = req.query;
    const user = req.user;

    let allowedProjectKeys = null;
    if (user && user.role !== 'ADMIN') {
      const userKeys = (user.projectKeys || []).map((k) => k.toUpperCase());
      if (projectKey && projectKey !== 'all') {
        if (!userKeys.includes(projectKey.toUpperCase())) {
          throw ApiError.forbidden(`Forbidden: You are not a member of project workspace "${projectKey}"`);
        }
      } else {
        allowedProjectKeys = userKeys;
      }
    }

    const activities = await ActivityService.getAllActivities({ projectKey, type, actorId, limit, offset, allowedProjectKeys });
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Activities retrieved successfully',
      data: activities
    });
  }

  static async recordActivity(req, res) {
    const { projectKey } = req.body;
    const user = req.user;
    if (user && user.role !== 'ADMIN') {
      const userKeys = (user.projectKeys || []).map((k) => k.toUpperCase());
      if (!projectKey || !userKeys.includes(projectKey.toUpperCase())) {
        throw ApiError.forbidden(`Forbidden: You are not a member of project workspace "${projectKey || ''}"`);
      }
      if (user.role === 'VIEWER') {
        throw ApiError.forbidden('Forbidden: Viewer role is read-only and cannot record activity');
      }
    }

    const activity = await ActivityService.recordActivity(req.body);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Activity recorded successfully',
      data: activity
    });
  }
}

