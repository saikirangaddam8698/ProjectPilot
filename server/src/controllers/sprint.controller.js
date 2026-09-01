/**
 * Sprint Controller — HTTP Request Handlers for Sprints
 */
import { SprintService } from '../services/sprint.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../utils/constants.js';

export class SprintController {
  static async getAllSprints(req, res) {
    const { projectKey, status } = req.query;
    const sprints = await SprintService.getAllSprints({ projectKey, status });
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Sprints retrieved successfully',
      data: sprints
    });
  }

  static async getSprintById(req, res) {
    const { sprintId } = req.params;
    const sprint = await SprintService.getSprintById(sprintId);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Sprint retrieved successfully',
      data: sprint
    });
  }

  static async createSprint(req, res) {
    const sprint = await SprintService.createSprint(req.body);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Sprint created successfully',
      data: sprint
    });
  }

  static async updateSprint(req, res) {
    const { sprintId } = req.params;
    const sprint = await SprintService.updateSprint(sprintId, req.body);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Sprint updated successfully',
      data: sprint
    });
  }

  static async startSprint(req, res) {
    const { sprintId } = req.params;
    const sprint = await SprintService.startSprint(sprintId);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Sprint started successfully',
      data: sprint
    });
  }

  static async completeSprint(req, res) {
    const { sprintId } = req.params;
    const result = await SprintService.completeSprint(sprintId, req.body);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Sprint completed successfully',
      data: result
    });
  }

  static async deleteSprint(req, res) {
    const { sprintId } = req.params;
    const result = await SprintService.deleteSprint(sprintId);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Sprint deleted successfully',
      data: result
    });
  }
}
