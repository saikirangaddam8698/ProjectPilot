/**
 * Sprint Controller — HTTP Request Handlers for Sprints
 */
import { SprintService } from '../services/sprint.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../utils/constants.js';

export class SprintController {
  static async getAllSprints(req, res) {
    const { projectKey, status } = req.query;
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

    const sprints = await SprintService.getAllSprints({ projectKey, status, allowedProjectKeys });
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Sprints retrieved successfully',
      data: sprints
    });
  }

  static async getSprintById(req, res) {
    const { sprintId } = req.params;
    const sprint = await SprintService.getSprintById(sprintId);
    const user = req.user;
    if (user && user.role !== 'ADMIN') {
      const userKeys = (user.projectKeys || []).map((k) => k.toUpperCase());
      if (sprint.projectKey && !userKeys.includes(sprint.projectKey.toUpperCase())) {
        throw ApiError.forbidden(`Forbidden: You are not a member of project workspace "${sprint.projectKey}"`);
      }
    }
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Sprint retrieved successfully',
      data: sprint
    });
  }

  static async createSprint(req, res) {
    const { projectKey } = req.body;
    const user = req.user;
    if (user && user.role !== 'ADMIN') {
      const userKeys = (user.projectKeys || []).map((k) => k.toUpperCase());
      if (!projectKey || !userKeys.includes(projectKey.toUpperCase())) {
        throw ApiError.forbidden(`Forbidden: You are not a member of project workspace "${projectKey || ''}"`);
      }
      const membership = (user.projectMemberships || []).find(
        (pm) => pm.projectKey?.toUpperCase() === projectKey.toUpperCase()
      );
      const isProjectAdmin = membership?.projectRole === 'Project Admin' || membership?.projectRole === 'Lead';
      if (!isProjectAdmin && user.role !== 'PROJECT_MANAGER') {
        throw ApiError.forbidden(`Forbidden: Action requires "Project Admin" role in project "${projectKey}"`);
      }
    }

    const sprint = await SprintService.createSprint(req.body);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Sprint created successfully',
      data: sprint
    });
  }

  static async updateSprint(req, res) {
    const { sprintId } = req.params;
    const existing = await SprintService.getSprintById(sprintId);
    const user = req.user;
    if (user && user.role !== 'ADMIN') {
      const userKeys = (user.projectKeys || []).map((k) => k.toUpperCase());
      if (existing.projectKey && !userKeys.includes(existing.projectKey.toUpperCase())) {
        throw ApiError.forbidden(`Forbidden: You are not a member of project workspace "${existing.projectKey}"`);
      }
      const membership = (user.projectMemberships || []).find(
        (pm) => pm.projectKey?.toUpperCase() === existing.projectKey.toUpperCase()
      );
      const isProjectAdmin = membership?.projectRole === 'Project Admin' || membership?.projectRole === 'Lead';
      if (!isProjectAdmin && user.role !== 'PROJECT_MANAGER') {
        throw ApiError.forbidden(`Forbidden: Action requires "Project Admin" role in project "${existing.projectKey}"`);
      }
    }

    const sprint = await SprintService.updateSprint(sprintId, req.body);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Sprint updated successfully',
      data: sprint
    });
  }

  static async startSprint(req, res) {
    const { sprintId } = req.params;
    const existing = await SprintService.getSprintById(sprintId);
    const user = req.user;
    if (user && user.role !== 'ADMIN') {
      const userKeys = (user.projectKeys || []).map((k) => k.toUpperCase());
      if (existing.projectKey && !userKeys.includes(existing.projectKey.toUpperCase())) {
        throw ApiError.forbidden(`Forbidden: You are not a member of project workspace "${existing.projectKey}"`);
      }
      const membership = (user.projectMemberships || []).find(
        (pm) => pm.projectKey?.toUpperCase() === existing.projectKey.toUpperCase()
      );
      const isProjectAdmin = membership?.projectRole === 'Project Admin' || membership?.projectRole === 'Lead';
      if (!isProjectAdmin && user.role !== 'PROJECT_MANAGER') {
        throw ApiError.forbidden(`Forbidden: Action requires "Project Admin" role in project "${existing.projectKey}"`);
      }
    }

    const sprint = await SprintService.startSprint(sprintId);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Sprint started successfully',
      data: sprint
    });
  }

  static async completeSprint(req, res) {
    const { sprintId } = req.params;
    const existing = await SprintService.getSprintById(sprintId);
    const user = req.user;
    if (user && user.role !== 'ADMIN') {
      const userKeys = (user.projectKeys || []).map((k) => k.toUpperCase());
      if (existing.projectKey && !userKeys.includes(existing.projectKey.toUpperCase())) {
        throw ApiError.forbidden(`Forbidden: You are not a member of project workspace "${existing.projectKey}"`);
      }
      const membership = (user.projectMemberships || []).find(
        (pm) => pm.projectKey?.toUpperCase() === existing.projectKey.toUpperCase()
      );
      const isProjectAdmin = membership?.projectRole === 'Project Admin' || membership?.projectRole === 'Lead';
      if (!isProjectAdmin && user.role !== 'PROJECT_MANAGER') {
        throw ApiError.forbidden(`Forbidden: Action requires "Project Admin" role in project "${existing.projectKey}"`);
      }
    }

    const result = await SprintService.completeSprint(sprintId, req.body);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Sprint completed successfully',
      data: result
    });
  }

  static async deleteSprint(req, res) {
    const { sprintId } = req.params;
    const existing = await SprintService.getSprintById(sprintId);
    const user = req.user;
    if (user && user.role !== 'ADMIN') {
      const userKeys = (user.projectKeys || []).map((k) => k.toUpperCase());
      if (existing.projectKey && !userKeys.includes(existing.projectKey.toUpperCase())) {
        throw ApiError.forbidden(`Forbidden: You are not a member of project workspace "${existing.projectKey}"`);
      }
      const membership = (user.projectMemberships || []).find(
        (pm) => pm.projectKey?.toUpperCase() === existing.projectKey.toUpperCase()
      );
      const isProjectAdmin = membership?.projectRole === 'Project Admin' || membership?.projectRole === 'Lead';
      if (!isProjectAdmin) {
        throw ApiError.forbidden(`Forbidden: Only Project Admins can delete sprints in project "${existing.projectKey}"`);
      }
    }

    const result = await SprintService.deleteSprint(sprintId);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Sprint deleted successfully',
      data: result
    });
  }
}

