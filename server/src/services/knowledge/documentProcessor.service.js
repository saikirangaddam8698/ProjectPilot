/**
 * Document Processor Service
 * Normalizes text, splits into semantic chunks, generates vector embeddings,
 * and persists indexed chunks to PostgreSQL.
 */
import { KnowledgeRepository } from '../../repositories/knowledge.repository.js';
import { ChunkingService } from './chunking.service.js';
import { EmbeddingClient } from './embedding.client.js';
import { ApiError } from '../../utils/apiError.js';

export class DocumentProcessorService {
  /**
   * Process and index a document into vector chunks
   * @param {string} documentId
   * @returns {Promise<object>}
   */
  static async processAndIndexDocument(documentId) {
    if (!documentId) {
      throw ApiError.badRequest('documentId is required for indexing.');
    }

    const document = await KnowledgeRepository.findDocumentById(documentId);
    if (!document) {
      throw ApiError.notFound(`Document "${documentId}" not found.`);
    }

    if (!document.content || !document.content.trim()) {
      throw ApiError.badRequest('Cannot index an empty document.');
    }

    // 1. Semantic Chunking
    const chunks = ChunkingService.splitIntoChunks(document.content, {
      maxChunkSize: 650,
      overlapSize: 80,
      documentTitle: document.title
    });

    if (chunks.length === 0) {
      throw ApiError.badRequest('Document content produced 0 valid chunks.');
    }

    // 2. Remove old chunks before re-indexing
    await KnowledgeRepository.deleteChunksByDocumentId(documentId);

    // 3. Generate embeddings and save chunks with pgvector
    const indexedChunks = [];
    for (const chunk of chunks) {
      // Generate 768-dim vector embedding
      let embedding = null;
      try {
        embedding = await EmbeddingClient.embedText(chunk.content, 768);
      } catch (err) {
        // Rollback status to DRAFT on embedding provider failure
        await KnowledgeRepository.updateDocument(documentId, { status: 'DRAFT' });
        throw ApiError.internal(`Failed to generate embeddings for document: ${err.message}`);
      }

      // Persist chunk with vector
      const savedChunk = await KnowledgeRepository.createChunkWithVector({
        documentId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        tokenCount: chunk.tokenCount,
        embedding
      });

      indexedChunks.push(savedChunk);
    }

    // 4. Mark document as INDEXED
    const updatedDoc = await KnowledgeRepository.updateDocument(documentId, {
      status: 'INDEXED'
    });

    return {
      documentId: updatedDoc.id,
      title: updatedDoc.title,
      status: updatedDoc.status,
      chunksCount: indexedChunks.length
    };
  }
}
