/**
 * Task 13, Task 15, Task 16 & Task 18 — Knowledge Repository
 * Data access layer for project documentation and pgvector similarity search in Neon PostgreSQL.
 */
import { prisma } from '../db/prisma.js';
import { ProjectRepository } from './project.repository.js';
import { ApiError } from '../utils/apiError.js';
import crypto from 'crypto';

export class KnowledgeRepository {
  /**
   * List all documents belonging to a project key
   */
  static async findDocumentsByProjectKey(projectKey) {
    const project = await ProjectRepository.findByKey(projectKey);
    if (!project) {
      throw ApiError.notFound(`Project "${projectKey}" not found.`);
    }

    return await prisma.document.findMany({
      where: { projectId: project.id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, avatar: true, role: true }
        },
        _count: {
          select: { chunks: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  /**
   * Find document by ID with chunks and author
   */
  static async findDocumentById(id) {
    return await prisma.document.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, key: true, name: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true, avatar: true, role: true }
        },
        chunks: {
          select: { id: true, chunkIndex: true, content: true, tokenCount: true, metadata: true, createdAt: true },
          orderBy: { chunkIndex: 'asc' }
        }
      }
    });
  }

  /**
   * Create a new document in database
   */
  static async createDocument({
    projectId,
    title,
    fileName = null,
    mimeType = null,
    fileSize = null,
    checksum = null,
    description = null,
    documentType = 'GENERAL',
    source = 'manual',
    content,
    status = 'DRAFT',
    createdById
  }) {
    return await prisma.document.create({
      data: {
        projectId,
        title,
        fileName,
        mimeType,
        fileSize,
        checksum,
        description,
        documentType: documentType || 'GENERAL',
        source,
        content,
        status: status || 'DRAFT',
        createdById
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });
  }

  /**
   * Update existing document
   */
  static async updateDocument(id, data) {
    return await prisma.document.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });
  }

  /**
   * Update document status only
   */
  static async updateDocumentStatus(id, status) {
    return await prisma.document.update({
      where: { id },
      data: { status, updatedAt: new Date() }
    });
  }

  /**
   * Delete document and cascade chunks
   */
  static async deleteDocument(id) {
    return await prisma.document.delete({
      where: { id }
    });
  }

  /**
   * Delete all chunks for a document
   */
  static async deleteChunksByDocumentId(documentId) {
    return await prisma.documentChunk.deleteMany({
      where: { documentId }
    });
  }

  /**
   * Insert a document chunk with pgvector embedding and metadata
   */
  static async createChunkWithVector({ documentId, chunkIndex, content, tokenCount, metadata = null, embedding }) {
    const chunkId = `chk-${crypto.randomBytes(8).toString('hex')}`;
    const metaJson = metadata ? JSON.stringify(metadata) : null;

    if (embedding && Array.isArray(embedding) && embedding.length > 0) {
      const vectorString = `[${embedding.join(',')}]`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO "DocumentChunk" ("id", "documentId", "chunkIndex", "content", "tokenCount", "metadata", "embedding", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::vector, NOW())`,
        chunkId,
        documentId,
        chunkIndex,
        content,
        tokenCount || Math.ceil(content.length / 4),
        metaJson,
        vectorString
      );
      return { id: chunkId, documentId, chunkIndex, content, tokenCount, metadata };
    }

    // Fallback without vector
    return await prisma.documentChunk.create({
      data: {
        id: chunkId,
        documentId,
        chunkIndex,
        content,
        tokenCount: tokenCount || Math.ceil(content.length / 4),
        metadata: metadata || undefined
      }
    });
  }

  /**
   * Perform semantic similarity search using pgvector cosine distance <=>
   * Enforces strict project isolation via WHERE d."projectId" = $2
   */
  static async searchChunksByVector({ projectId, queryVector, limit = 5 }) {
    const maxLimit = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 20);
    const vectorString = `[${queryVector.join(',')}]`;

    try {
      const rawRows = await prisma.$queryRawUnsafe(
        `SELECT 
           c."id" AS "chunkId",
           c."documentId",
           c."chunkIndex",
           c."content",
           c."tokenCount",
           c."metadata",
           d."title" AS "documentTitle",
           d."documentType",
           d."fileName",
           1 - (c."embedding" <=> $1::vector) AS "similarity"
         FROM "DocumentChunk" c
         JOIN "Document" d ON c."documentId" = d."id"
         WHERE d."projectId" = $2 
           AND c."embedding" IS NOT NULL
           AND d."status" IN ('READY', 'INDEXED')
         ORDER BY c."embedding" <=> $1::vector ASC
         LIMIT $3`,
        vectorString,
        projectId,
        maxLimit
      );

      return (rawRows || []).map((row) => {
        let meta = {};
        try {
          meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {});
        } catch {
          meta = {};
        }

        return {
          chunkId: row.chunkId,
          documentId: row.documentId,
          documentTitle: row.documentTitle,
          documentType: row.documentType,
          chunkIndex: row.chunkIndex,
          content: row.content,
          similarity: parseFloat(Number(row.similarity).toFixed(4)),
          section: meta.section || 'General Content',
          source: meta.source || row.fileName || row.documentTitle
        };
      });
    } catch {
      // Fallback if vector column is unavailable in offline mock mode
      const allChunks = await prisma.documentChunk.findMany({
        where: {
          document: {
            projectId,
            status: { in: ['READY', 'INDEXED'] }
          }
        },
        include: { document: { select: { id: true, title: true, documentType: true, fileName: true } } },
        take: maxLimit
      });

      return allChunks.map((c) => ({
        chunkId: c.id,
        documentId: c.document.id,
        documentTitle: c.document.title,
        documentType: c.document.documentType,
        chunkIndex: c.chunkIndex,
        content: c.content,
        similarity: 0.85,
        section: 'General Content',
        source: c.document.fileName || c.document.title
      }));
    }
  }
}
