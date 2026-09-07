/**
 * Task 18 — Document Ingestion Service
 * Orchestrates the production Knowledge Base & RAG ingestion pipeline:
 * Upload → Validate → Set PROCESSING → Extract Text → Chunk → Embed Vectors → Persist Chunks → Set READY / INDEXED (or FAILED on error).
 */
import { KnowledgeRepository } from '../../repositories/knowledge.repository.js';
import { DocumentExtractor } from './documentExtractor.js';
import { DocumentChunker } from './documentChunker.js';
import { EmbeddingService } from './embedding.service.js';
import { ApiError } from '../../utils/apiError.js';
import crypto from 'crypto';

export class DocumentIngestionService {
  /**
   * Execute document ingestion pipeline
   */
  static async ingestDocument(params) {
    const {
      projectId,
      uploadedById,
      title,
      description = '',
      documentType = 'GENERAL',
      fileBuffer,
      fileName = 'document.txt',
      mimeType = 'text/plain',
      textContent
    } = params;

    if (!projectId || !title) {
      throw ApiError.badRequest('projectId and title are required for document ingestion');
    }

    // 1. Calculate checksum if fileBuffer or textContent provided
    const payloadStr = textContent || (Buffer.isBuffer(fileBuffer) ? fileBuffer.toString('utf8') : String(fileBuffer || ''));
    const checksum = crypto.createHash('sha256').update(payloadStr).digest('hex');
    const fileSize = Buffer.isBuffer(fileBuffer) ? fileBuffer.length : Buffer.byteLength(payloadStr, 'utf8');

    const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
    if (fileSize > MAX_FILE_SIZE_BYTES) {
      throw ApiError.badRequest('Document size exceeds maximum allowed limit of 10MB');
    }

    // 2. Create Document record in PROCESSING status
    const doc = await KnowledgeRepository.createDocument({
      projectId,
      createdById: uploadedById,
      title,
      fileName,
      mimeType,
      fileSize,
      checksum,
      description,
      documentType,
      source: fileName || 'upload',
      content: payloadStr.slice(0, 5000) || title,
      status: 'PROCESSING'
    });

    try {
      // 3. Extract text
      const extractedText = DocumentExtractor.extract({
        fileBuffer,
        textContent: textContent || payloadStr,
        fileName,
        mimeType
      });

      // 4. Chunk text into semantic sections
      const chunks = DocumentChunker.chunk(extractedText, {
        documentTitle: title,
        fileName
      });

      if (!chunks || chunks.length === 0) {
        throw ApiError.badRequest('No valid text chunks generated from document content');
      }

      // 5. Generate embeddings & persist chunks to PostgreSQL/pgvector
      await KnowledgeRepository.deleteChunksByDocumentId(doc.id);

      for (const c of chunks) {
        let embedding = null;
        try {
          embedding = await EmbeddingService.generateEmbedding(c.content);
        } catch (embErr) {
          console.warn(`Vector embedding failed for chunk ${c.chunkIndex}:`, embErr.message);
        }

        await KnowledgeRepository.createChunkWithVector({
          documentId: doc.id,
          chunkIndex: c.chunkIndex,
          content: c.content,
          tokenCount: c.tokenCount,
          metadata: c.metadata,
          embedding
        });
      }

      // 6. Update document status to READY and update full extracted content
      const readyDoc = await KnowledgeRepository.updateDocument(doc.id, {
        content: extractedText,
        status: 'READY'
      });

      return {
        ...readyDoc,
        status: 'READY',
        chunksCount: chunks.length
      };
    } catch (err) {
      await KnowledgeRepository.updateDocument(doc.id, {
        status: 'FAILED'
      }).catch(() => {});

      throw err;
    }
  }

  /**
   * Re-index an existing document safely replacing old chunks
   */
  static async reindexDocument(documentId) {
    const doc = await KnowledgeRepository.findDocumentById(documentId);
    if (!doc) {
      throw ApiError.notFound(`Knowledge document with ID "${documentId}" not found`);
    }

    const targetStatus = doc.status === 'DRAFT' ? 'INDEXED' : 'READY';

    // Set PROCESSING status
    await KnowledgeRepository.updateDocument(doc.id, { status: 'PROCESSING' });

    try {
      // Extract text
      const extractedText = DocumentExtractor.extract({
        textContent: doc.content,
        fileName: doc.fileName || doc.title,
        mimeType: doc.mimeType || 'text/plain'
      });

      // Chunk text
      const chunks = DocumentChunker.chunk(extractedText, {
        documentTitle: doc.title,
        fileName: doc.fileName || doc.title
      });

      // Safely delete previous chunks
      await KnowledgeRepository.deleteChunksByDocumentId(doc.id);

      // Generate embeddings & insert new chunks
      for (const c of chunks) {
        let embedding = null;
        try {
          embedding = await EmbeddingService.generateEmbedding(c.content);
        } catch (embErr) {
          console.warn(`Vector embedding failed for chunk ${c.chunkIndex}:`, embErr.message);
        }

        await KnowledgeRepository.createChunkWithVector({
          documentId: doc.id,
          chunkIndex: c.chunkIndex,
          content: c.content,
          tokenCount: c.tokenCount,
          metadata: c.metadata,
          embedding
        });
      }

      // Set target status (INDEXED for draft reindex, READY for production reindex)
      const updatedDoc = await KnowledgeRepository.updateDocument(doc.id, {
        status: targetStatus
      });

      return {
        ...updatedDoc,
        status: targetStatus,
        chunksCount: chunks.length
      };
    } catch (err) {
      await KnowledgeRepository.updateDocument(doc.id, { status: 'FAILED' }).catch(() => {});
      throw err;
    }
  }
}
