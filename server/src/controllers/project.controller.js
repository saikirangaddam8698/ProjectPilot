/**
 * Project Controller — HTTP Request Handlers for Projects
 */
import { ProjectService } from '../services/project.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../utils/constants.js';

export class ProjectController {
  static async getAllProjects(req, res) {
    const { status, search } = req.query;
    const projects = await ProjectService.getAllProjects({
       status,
       search,
       user: req.user
     });
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Projects retrieved successfully',
      data: projects
    });
  }

  static async getProjectByKey(req, res) {
    const { projectKey } = req.params;
    const project = await ProjectService.getProjectByKey(projectKey);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Project retrieved successfully',
      data: project
    });
  }

  static async createProject(req, res) {
    const project = await ProjectService.createProject(req.body);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Project created successfully',
      data: project
    });
  }

  static async updateProject(req, res) {
    const { projectKey } = req.params;
    const project = await ProjectService.updateProject(projectKey, req.body);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Project updated successfully',
      data: project
    });
  }

  static async deleteProject(req, res) {
    const { projectKey } = req.params;
    const result = await ProjectService.deleteProject(projectKey);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Project deleted successfully',
      data: result
    });
  }

  static async addProjectMember(req, res) {
    const { projectKey } = req.params;
    const project = await ProjectService.addMember(projectKey, req.body);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Member added to project successfully',
      data: project
    });
  }

  static async removeProjectMember(req, res) {
    const { projectKey, memberId } = req.params;
    const project = await ProjectService.removeMember(projectKey, memberId);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Member removed from project successfully',
      data: project
    });
  }
}
