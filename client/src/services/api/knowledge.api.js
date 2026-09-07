/**
 * Task 13, Task 15, Task 16 & Task 18 — Knowledge Base API Service
 * Handles project documentation CRUD, document ingestion pipeline, re-indexing, and semantic search.
 */
import { httpClient } from './httpClient.js';

export const knowledgeApi = {
  /**
   * List all documents for a project
   */
  listDocuments: (projectKey) =>
    httpClient.get(`/projects/${projectKey}/knowledge`),

  /**
   * Get single document by ID with chunks
   */
  getDocument: (projectKey, documentId) =>
    httpClient.get(`/projects/${projectKey}/knowledge/${documentId}`),

  /**
   * Create/ingest a new document
   */
  createDocument: (projectKey, data) =>
    httpClient.post(`/projects/${projectKey}/knowledge`, data),

  /**
   * Update an existing document
   */
  updateDocument: (projectKey, documentId, data) =>
    httpClient.put(`/projects/${projectKey}/knowledge/${documentId}`, data),

  /**
   * Delete a document
   */
  deleteDocument: (projectKey, documentId) =>
    httpClient.delete(`/projects/${projectKey}/knowledge/${documentId}`),

  /**
   * Trigger document chunking and vector embedding indexing
   */
  indexDocument: (projectKey, documentId) =>
    httpClient.post(`/projects/${projectKey}/knowledge/${documentId}/index`),

  /**
   * Re-index an existing document
   */
  reindexDocument: (projectKey, documentId) =>
    httpClient.post(`/projects/${projectKey}/knowledge/${documentId}/reindex`),

  /**
   * Perform semantic similarity vector search across project knowledge
   */
  searchKnowledge: (projectKey, params) =>
    httpClient.post(`/projects/${projectKey}/knowledge/search`, params)
};
