/**
 * Knowledge Base Controller
 */
import { KnowledgeService } from '../services/knowledge/knowledge.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../utils/constants.js';

export class KnowledgeController {
  /**
   * List all documents for project
   * GET /api/v1/projects/:projectKey/knowledge
   */
  static async listDocuments(req, res) {
    const { projectKey } = req.params;
    const documents = await KnowledgeService.listDocuments(projectKey);
    return ApiResponse.success(res, {
      data: documents,
      message: `Fetched ${documents.length} documents for project "${projectKey.toUpperCase()}"`
    });
  }

  /**
   * Get single document
   * GET /api/v1/projects/:projectKey/knowledge/:documentId
   */
  static async getDocument(req, res) {
    const { projectKey, documentId } = req.params;
    const document = await KnowledgeService.getDocumentById(documentId);
    if (projectKey && document.project?.key && document.project.key.toUpperCase() !== projectKey.toUpperCase()) {
      throw ApiError.forbidden(`Forbidden: Document "${documentId}" does not belong to project "${projectKey}"`);
    }
    return ApiResponse.success(res, {
      data: document
    });
  }

  static async createDocument(req, res) {
    const { projectKey } = req.params;
    if (req.user && req.user.role === 'VIEWER') {
      throw ApiError.forbidden('Forbidden: Viewer role is read-only and cannot create documents');
    }
    const document = await KnowledgeService.createDocument(projectKey, req.body, req.user);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.CREATED,
      data: document,
      message: 'Document created successfully.'
    });
  }

  static async updateDocument(req, res) {
    const { projectKey, documentId } = req.params;
    if (req.user && req.user.role === 'VIEWER') {
      throw ApiError.forbidden('Forbidden: Viewer role is read-only and cannot edit documents');
    }
    const existing = await KnowledgeService.getDocumentById(documentId);
    if (projectKey && existing.project?.key && existing.project.key.toUpperCase() !== projectKey.toUpperCase()) {
      throw ApiError.forbidden(`Forbidden: Document "${documentId}" does not belong to project "${projectKey}"`);
    }
    const document = await KnowledgeService.updateDocument(documentId, req.body);
    return ApiResponse.success(res, {
      data: document,
      message: 'Document updated successfully.'
    });
  }

  static async deleteDocument(req, res) {
    const { projectKey, documentId } = req.params;
    const existing = await KnowledgeService.getDocumentById(documentId);
    if (projectKey && existing.project?.key && existing.project.key.toUpperCase() !== projectKey.toUpperCase()) {
      throw ApiError.forbidden(`Forbidden: Document "${documentId}" does not belong to project "${projectKey}"`);
    }
    if (req.user && req.user.role !== 'ADMIN') {
      const membership = (req.user.projectMemberships || []).find(
        (pm) => pm.projectKey?.toUpperCase() === projectKey.toUpperCase()
      );
      const isProjectAdmin = membership?.projectRole === 'Project Admin' || membership?.projectRole === 'Lead';
      if (!isProjectAdmin && existing.createdById !== req.user.memberId && existing.createdById !== req.user.id) {
        throw ApiError.forbidden(`Forbidden: Only Project Admins or document authors can delete documents in project "${projectKey}"`);
      }
    }

    const result = await KnowledgeService.deleteDocument(documentId);
    return ApiResponse.success(res, {
      data: result,
      message: 'Document deleted successfully.'
    });
  }

  static async indexDocument(req, res) {
    const { projectKey, documentId } = req.params;
    if (req.user && req.user.role === 'VIEWER') {
      throw ApiError.forbidden('Forbidden: Viewer role is read-only and cannot index documents');
    }
    const existing = await KnowledgeService.getDocumentById(documentId);
    if (projectKey && existing.project?.key && existing.project.key.toUpperCase() !== projectKey.toUpperCase()) {
      throw ApiError.forbidden(`Forbidden: Document "${documentId}" does not belong to project "${projectKey}"`);
    }
    const result = await KnowledgeService.indexDocument(documentId);
    return ApiResponse.success(res, {
      data: result,
      message: `Document indexed successfully into ${result.chunksCount} chunks.`
    });
  }

  /**
   * Semantic Vector Search
   * POST /api/v1/projects/:projectKey/knowledge/search
   */
  static async searchKnowledge(req, res) {
    const { projectKey } = req.params;
    const { query, limit } = req.body;
    const result = await KnowledgeService.searchKnowledge({
      projectKey,
      query,
      limit
    });
    return ApiResponse.success(res, {
      data: result,
      message: `Found ${result.count} relevant document sections.`
    });
  }
}
