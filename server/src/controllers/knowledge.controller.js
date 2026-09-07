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
    const { documentId } = req.params;
    const document = await KnowledgeService.getDocumentById(documentId);
    return ApiResponse.success(res, {
      data: document
    });
  }

  /**
   * Create document
   * POST /api/v1/projects/:projectKey/knowledge
   */
  static async createDocument(req, res) {
    const { projectKey } = req.params;
    const document = await KnowledgeService.createDocument(projectKey, req.body, req.user);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.CREATED,
      data: document,
      message: 'Document created successfully.'
    });
  }

  /**
   * Update document
   * PUT /api/v1/projects/:projectKey/knowledge/:documentId
   */
  static async updateDocument(req, res) {
    const { documentId } = req.params;
    const document = await KnowledgeService.updateDocument(documentId, req.body);
    return ApiResponse.success(res, {
      data: document,
      message: 'Document updated successfully.'
    });
  }

  /**
   * Delete document
   * DELETE /api/v1/projects/:projectKey/knowledge/:documentId
   */
  static async deleteDocument(req, res) {
    const { documentId } = req.params;
    const result = await KnowledgeService.deleteDocument(documentId);
    return ApiResponse.success(res, {
      data: result,
      message: 'Document deleted successfully.'
    });
  }

  /**
   * Process & Index document into vector chunks
   * POST /api/v1/projects/:projectKey/knowledge/:documentId/index
   */
  static async indexDocument(req, res) {
    const { documentId } = req.params;
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
