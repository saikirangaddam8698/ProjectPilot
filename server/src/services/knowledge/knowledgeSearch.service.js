/**
 * Task 13, Task 15, Task 16, Task 18 & Task 19 — Knowledge Search Service
 * Advanced RAG Retrieval Pipeline with similarity thresholding, near-duplicate chunk reduction,
 * document-level diversity, deterministic ranking, and resilient error handling.
 */
import { KnowledgeRepository } from '../../repositories/knowledge.repository.js';
import { ProjectRepository } from '../../repositories/project.repository.js';
import { EmbeddingService } from './embedding.service.js';
import { QueryProcessor } from './queryProcessor.js';
import { RAG_CONFIG } from '../../config/rag.config.js';
import { ApiError } from '../../utils/apiError.js';

export class KnowledgeSearchService {
  /**
   * Semantic vector search across project documents with quality & diversity controls
   *
   * @param {object} params
   * @param {string} params.projectKey - Project key identifier
   * @param {string} params.query - Search query string
   * @param {number} [params.limit] - Maximum chunks to return
   * @returns {Promise<object>}
   */
  static async searchKnowledge({ projectKey, query, limit = RAG_CONFIG.TOP_K }) {
    if (!projectKey || !projectKey.trim()) {
      throw ApiError.badRequest('projectKey is required for knowledge search.');
    }
    if (!query || !query.trim()) {
      throw ApiError.badRequest('Search query cannot be empty.');
    }

    const pKey = projectKey.toUpperCase();
    const project = await ProjectRepository.findByKey(pKey);
    if (!project) {
      throw ApiError.notFound(`Project "${pKey}" not found.`);
    }

    // 1. Normalize query using lightweight QueryProcessor
    const normalizedQuery = QueryProcessor.process(query);
    if (!normalizedQuery) {
      return {
        projectKey: pKey,
        query: query.trim(),
        hasResults: false,
        results: [],
        count: 0,
        message: 'No relevant project documentation was found matching the query.'
      };
    }

    const targetLimit = Math.min(
      Math.max(parseInt(limit, 10) || RAG_CONFIG.TOP_K, 1),
      RAG_CONFIG.MAX_TOP_K
    );

    // 2. Generate 768-dim query vector (handle embedding failures gracefully)
    let queryVector;
    try {
      queryVector = await EmbeddingService.generateEmbedding(normalizedQuery, 768);
    } catch (embErr) {
      console.error('[RAG Search Error] Embedding service failed:', embErr.message);
      return {
        projectKey: pKey,
        query: normalizedQuery,
        hasResults: false,
        status: 'unavailable',
        results: [],
        count: 0,
        message: 'The RAG search service is currently unavailable.'
      };
    }

    // 3. Retrieve raw pgvector candidate chunks (fetch 3x candidate pool for filtering)
    let rawCandidates = [];
    try {
      rawCandidates = await KnowledgeRepository.searchChunksByVector({
        projectId: project.id,
        queryVector,
        limit: Math.max(targetLimit * 3, 15)
      });
    } catch (dbErr) {
      console.error('[RAG Search Error] Database vector query failed:', dbErr.message);
      return {
        projectKey: pKey,
        query: normalizedQuery,
        hasResults: false,
        status: 'unavailable',
        results: [],
        count: 0,
        message: 'The RAG search service is currently unavailable.'
      };
    }

    if (!rawCandidates || rawCandidates.length === 0) {
      return {
        projectKey: pKey,
        query: normalizedQuery,
        hasResults: false,
        results: [],
        count: 0,
        message: 'No relevant project documentation was found matching the query.'
      };
    }

    // 4. Filter candidates by MIN_SIMILARITY threshold (0.55)
    const thresholdFiltered = rawCandidates.filter(
      (r) => typeof r.similarity === 'number' && r.similarity >= RAG_CONFIG.MIN_SIMILARITY
    );

    if (thresholdFiltered.length === 0) {
      return {
        projectKey: pKey,
        query: normalizedQuery,
        hasResults: false,
        results: [],
        count: 0,
        message: 'No relevant project documentation was found matching the query.'
      };
    }

    // 5. Deduplicate near-duplicate chunks & enforce document-level diversity
    const selectedChunks = [];
    const docCounts = new Map();

    for (const item of thresholdFiltered) {
      // Check document-level limit (max 3 chunks per doc)
      const docId = item.documentId || item.documentTitle;
      const count = docCounts.get(docId) || 0;
      if (count >= RAG_CONFIG.MAX_CHUNKS_PER_DOC) {
        continue;
      }

      // Near-duplicate chunk reduction
      const isDuplicate = selectedChunks.some((existing) => {
        if (existing.documentId === item.documentId && existing.chunkIndex === item.chunkIndex) {
          return true;
        }
        // Text overlap check
        return this.isNearDuplicate(existing.content, item.content);
      });

      if (isDuplicate) {
        continue;
      }

      docCounts.set(docId, count + 1);
      selectedChunks.push(item);

      if (selectedChunks.length >= targetLimit) {
        break;
      }
    }

    // 6. Sort deterministically by similarity DESC, chunkIndex ASC
    selectedChunks.sort((a, b) => {
      if (b.similarity !== a.similarity) {
        return b.similarity - a.similarity;
      }
      return (a.chunkIndex || 0) - (b.chunkIndex || 0);
    });

    // 7. Enforce context character size budget (MAX_CONTEXT_CHARACTERS = 4000)
    const finalResults = [];
    let totalChars = 0;

    for (const chunk of selectedChunks) {
      if (
        finalResults.length >= RAG_CONFIG.MAX_CONTEXT_CHUNKS ||
        totalChars + chunk.content.length > RAG_CONFIG.MAX_CONTEXT_CHARACTERS
      ) {
        break;
      }

      finalResults.push({
        type: 'knowledge',
        chunkId: chunk.chunkId,
        documentId: chunk.documentId,
        documentTitle: chunk.documentTitle,
        documentType: chunk.documentType,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        similarity: chunk.similarity,
        section: chunk.section || 'General Content',
        page: chunk.page || (chunk.chunkIndex !== undefined ? Math.floor(chunk.chunkIndex / 3) + 1 : 1),
        source: chunk.source || chunk.documentTitle
      });

      totalChars += chunk.content.length;
    }

    if (finalResults.length === 0) {
      return {
        projectKey: pKey,
        query: normalizedQuery,
        hasResults: false,
        results: [],
        count: 0,
        message: 'No relevant project documentation was found matching the query.'
      };
    }

    return {
      projectKey: pKey,
      query: normalizedQuery,
      hasResults: true,
      results: finalResults,
      count: finalResults.length
    };
  }

  /**
   * Helper: Check if two text snippets are near-duplicates (>90% word overlap)
   */
  static isNearDuplicate(textA = '', textB = '') {
    if (textA === textB) return true;

    const wordsA = new Set(textA.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
    const wordsB = new Set(textB.toLowerCase().split(/\W+/).filter((w) => w.length > 3));

    if (wordsA.size === 0 || wordsB.size === 0) return false;

    let common = 0;
    for (const w of wordsA) {
      if (wordsB.has(w)) common++;
    }

    const overlap = common / Math.min(wordsA.size, wordsB.size);
    return overlap >= RAG_CONFIG.DEDUPLICATION_SIMILARITY_THRESHOLD;
  }
}
