/**
 * Task 13, Task 15, Task 16 & Task 18 — Knowledge Base Domain Service
 * High-level orchestration for project documents, file ingestion, chunking, indexing, and semantic search.
 */
import { KnowledgeRepository } from '../../repositories/knowledge.repository.js';
import { ProjectRepository } from '../../repositories/project.repository.js';
import { DocumentIngestionService } from './documentIngestion.service.js';
import { KnowledgeSearchService } from './knowledgeSearch.service.js';
import { ApiError } from '../../utils/apiError.js';

export class KnowledgeService {
  /**
   * List all documents for a project
   */
  static async listDocuments(projectKey) {
    const pKey = projectKey.toUpperCase();
    return await KnowledgeRepository.findDocumentsByProjectKey(pKey);
  }

  /**
   * Get single document with chunk details
   */
  static async getDocumentById(documentId) {
    const doc = await KnowledgeRepository.findDocumentById(documentId);
    if (!doc) {
      throw ApiError.notFound(`Document "${documentId}" not found.`);
    }
    return doc;
  }

  /**
   * Create or ingest a new project document
   */
  static async createDocument(projectKey, data, user) {
    const pKey = projectKey.toUpperCase();
    const project = await ProjectRepository.findByKey(pKey);
    if (!project) {
      throw ApiError.notFound(`Project "${pKey}" not found.`);
    }

    if (!data.title || !data.title.trim()) {
      throw ApiError.badRequest('Document title is required.');
    }

    const createdById = user?.memberId || user?.id || null;

    // If file payload or autoIngest flag is explicitly provided, execute full ingestion pipeline immediately
    if (data.fileBuffer || data.mimeType || data.autoIngest === true || data.status === 'READY') {
      return await DocumentIngestionService.ingestDocument({
        projectId: project.id,
        uploadedById: createdById,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        documentType: data.documentType || 'GENERAL',
        fileBuffer: data.fileBuffer || null,
        fileName: data.fileName || `${data.title.trim()}.txt`,
        mimeType: data.mimeType || 'text/plain',
        textContent: data.content || data.textContent || ''
      });
    }

    // Default: Create document in DRAFT status
    return await KnowledgeRepository.createDocument({
      projectId: project.id,
      createdById,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      documentType: data.documentType || 'GENERAL',
      source: data.source || 'manual',
      content: data.content || '',
      status: data.status || 'DRAFT'
    });
  }

  /**
   * Update an existing document
   */
  static async updateDocument(documentId, data) {
    const existing = await KnowledgeRepository.findDocumentById(documentId);
    if (!existing) {
      throw ApiError.notFound(`Document "${documentId}" not found.`);
    }

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.documentType !== undefined) updateData.documentType = data.documentType;
    if (data.content !== undefined) {
      updateData.content = data.content.trim();
      if (existing.status === 'READY' || existing.status === 'INDEXED') {
        updateData.status = 'OUTDATED';
      }
    }

    return await KnowledgeRepository.updateDocument(documentId, updateData);
  }

  /**
   * Delete a document
   */
  static async deleteDocument(documentId) {
    const existing = await KnowledgeRepository.findDocumentById(documentId);
    if (!existing) {
      throw ApiError.notFound(`Document "${documentId}" not found.`);
    }
    await KnowledgeRepository.deleteDocument(documentId);
    return { success: true, message: `Document "${existing.title}" deleted.` };
  }

  /**
   * Index / re-index document into chunks and vector embeddings
   */
  static async indexDocument(documentId) {
    return await DocumentIngestionService.reindexDocument(documentId);
  }

  /**
   * Semantic vector search across project documents
   */
  static async searchKnowledge({ projectKey, query, limit = 5 }) {
    return await KnowledgeSearchService.searchKnowledge({ projectKey, query, limit });
  }
}
