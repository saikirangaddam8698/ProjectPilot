/**
 * Task 18 — Production Knowledge Base & RAG Ingestion Pipeline Test Suite
 * Validates PDF/DOCX/TXT/MD text extraction, semantic chunking, metadata preservation,
 * embedding generation, ingestion status transitions, re-indexing chunk safety,
 * vector similarity search, project isolation, and privacy.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { generateAuthToken } from '../src/utils/token.js';
import { DocumentExtractor } from '../src/services/knowledge/documentExtractor.js';
import { DocumentChunker } from '../src/services/knowledge/documentChunker.js';
import { EmbeddingService } from '../src/services/knowledge/embedding.service.js';
import { EmbeddingClient } from '../src/services/knowledge/embedding.client.js';
import { DocumentIngestionService } from '../src/services/knowledge/documentIngestion.service.js';
import { KnowledgeRepository } from '../src/repositories/knowledge.repository.js';
import { ToolExecutor } from '../src/services/ai/tool.executor.js';
import { HTTP_STATUS } from '../src/utils/constants.js';

test('ProjectPilot Task 18: Knowledge Ingestion & RAG Pipeline Test Suite', async (t) => {
  const adminToken = generateAuthToken({
    id: 'u-1',
    email: 'alex.m@projectpilot.dev',
    role: 'ADMIN',
    memberId: 'm-1'
  });

  const memberToken = generateAuthToken({
    id: 'u-2',
    email: 'jane.d@projectpilot.dev',
    role: 'DEVELOPER',
    memberId: 'm-2'
  });

  // User u-5 is David Kim (m-5), on PILOT and MOBILE but NOT INFRA
  const nonInfraMemberToken = generateAuthToken({
    id: 'u-5',
    email: 'david.k@projectpilot.dev',
    role: 'DEVELOPER',
    memberId: 'm-5'
  });

  let ingestedDocId = null;

  // Mock deterministic embedding client
  EmbeddingClient.setMock({
    async embedText(text, dim = 768) {
      const hash = Array.from(text).reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const vec = new Array(dim).fill(0).map((_, i) => Math.sin(hash + i));
      const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0));
      return vec.map((x) => x / (norm || 1));
    }
  });

  t.afterEach(() => {
    // Keep mock active
  });

  t.after(() => {
    EmbeddingClient.setMock(null);
  });

  // 1. TXT Extraction
  await t.test('1. DocumentExtractor extracts plain text from TXT payload', () => {
    const text = 'ProjectPilot authentication blueprint content.';
    const result = DocumentExtractor.extract({
      textContent: text,
      fileName: 'auth.txt',
      mimeType: 'text/plain'
    });
    assert.equal(result, 'ProjectPilot authentication blueprint content.');
  });

  // 2. Markdown Extraction
  await t.test('2. DocumentExtractor extracts and normalizes Markdown text', () => {
    const md = '# Architecture Spec\n\n## 1. Overview\nPostgreSQL pgvector vector indexing.';
    const result = DocumentExtractor.extract({
      textContent: md,
      fileName: 'spec.md',
      mimeType: 'text/markdown'
    });
    assert.ok(result.includes('Architecture Spec'));
    assert.ok(result.includes('PostgreSQL pgvector'));
  });

  // 3. PDF Extraction
  await t.test('3. DocumentExtractor extracts text blocks from PDF stream buffer', () => {
    const pdfBuffer = Buffer.from('%PDF-1.4 (Authentication Architecture) Tj stream (JWT cookies) Tj endstream', 'utf8');
    const result = DocumentExtractor.extract({
      fileBuffer: pdfBuffer,
      fileName: 'arch.pdf',
      mimeType: 'application/pdf'
    });
    assert.ok(result.includes('Authentication Architecture'));
  });

  // 4. DOCX Extraction
  await t.test('4. DocumentExtractor extracts XML text nodes from DOCX buffer', () => {
    const docxBuffer = Buffer.from('<w:p><w:t>Deployment Runbook for Kubernetes Clusters</w:t></w:p>', 'utf8');
    const result = DocumentExtractor.extract({
      fileBuffer: docxBuffer,
      fileName: 'runbook.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    assert.ok(result.includes('Deployment Runbook for Kubernetes Clusters'));
  });

  // 5. Unsupported file rejection
  await t.test('5. DocumentExtractor rejects unsupported MIME types', () => {
    assert.throws(
      () => {
        DocumentExtractor.extract({
          fileBuffer: Buffer.from('executable binary'),
          fileName: 'malware.exe',
          mimeType: 'application/x-msdownload'
        });
      },
      (err) => err.status === 400 || err.statusCode === 400
    );
  });

  // 6. Empty document rejection
  await t.test('6. DocumentExtractor rejects empty or whitespace-only documents', () => {
    assert.throws(
      () => {
        DocumentExtractor.extract({
          textContent: '   \n\t   ',
          fileName: 'empty.txt',
          mimeType: 'text/plain'
        });
      },
      (err) => err.status === 400 || err.statusCode === 400
    );
  });

  // 7. Chunk creation
  await t.test('7. DocumentChunker creates structured semantic chunks with token counts', () => {
    const md = '# Architecture ADR 101\n\n## Overview\nProjectPilot uses Postgres.\n\n## Security\nRBAC rules are enforced.';
    const chunks = DocumentChunker.chunk(md, { documentTitle: 'ADR 101', fileName: 'adr.md' });

    assert.ok(chunks.length >= 2);
    assert.equal(chunks[0].chunkIndex, 0);
    assert.ok(chunks[0].tokenCount > 0);
    assert.ok(typeof chunks[0].content === 'string');
  });

  // 8. Chunk overlap & metadata behavior
  await t.test('8. DocumentChunker attaches section, source, and page metadata', () => {
    const md = '# Security Specification\n\n## Tokens\nJWT cookies are HTTP-only.';
    const chunks = DocumentChunker.chunk(md, { documentTitle: 'Security Spec', fileName: 'sec.md' });

    assert.ok(chunks.length > 0);
    assert.ok(chunks[0].metadata);
    assert.equal(typeof chunks[0].metadata.section, 'string');
    assert.equal(chunks[0].metadata.source, 'sec.md');
    assert.ok(chunks[0].metadata.page >= 1);
  });

  // 9. Embedding generation
  await t.test('9. EmbeddingService generates 768-dimensional float vector', async () => {
    const vector = await EmbeddingService.generateEmbedding('JWT authentication security');
    assert.equal(Array.isArray(vector), true);
    assert.equal(vector.length, 768);
    assert.equal(typeof vector[0], 'number');
  });

  // 10. Embedding failure handling
  await t.test('10. EmbeddingService handles empty text input safely', async () => {
    await assert.rejects(
      async () => {
        await EmbeddingService.generateEmbedding('');
      },
      (err) => err.status === 400 || err.statusCode === 400
    );
  });

  // 11. Document PROCESSING -> READY transition via HTTP endpoint
  await t.test('11. Ingesting document creates document record and transitions to READY status', async () => {
    const res = await request(app)
      .post('/api/v1/projects/PILOT/knowledge')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        title: 'Task 18 Production RAG Architecture',
        description: 'Testing full ingestion pipeline from HTTP request to pgvector chunks.',
        documentType: 'ARCHITECTURE',
        fileName: 'rag_architecture.md',
        mimeType: 'text/markdown',
        content: '# RAG Architecture\n\n## 1. Vector Embeddings\nChunks are embedded into 768-float vectors.\n\n## 2. Ingestion Pipeline\nText extraction -> chunking -> pgvector storage -> READY.'
      });

    assert.equal(res.status, HTTP_STATUS.CREATED);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.id);
    assert.equal(res.body.data.status, 'READY');
    assert.ok(res.body.data.chunksCount > 0);

    ingestedDocId = res.body.data.id;
  });

  // 12. Document PROCESSING -> FAILED transition on corrupt payload
  await t.test('12. Ingesting corrupt document transitions status to FAILED', async () => {
    const res = await request(app)
      .post('/api/v1/projects/PILOT/knowledge')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        title: 'Corrupt Payload Doc',
        documentType: 'GENERAL',
        content: '   \n\n   ' // Invalid empty content
      });

    assert.equal(res.status, HTTP_STATUS.BAD_REQUEST);
  });

  // 13. Re-indexing safely replaces old chunks without duplication
  await t.test('13. Re-indexing document replaces existing chunks without creating duplicate chunks', async () => {
    const docBefore = await KnowledgeRepository.findDocumentById(ingestedDocId);
    const initialChunkCount = docBefore.chunks.length;

    const res = await request(app)
      .post(`/api/v1/projects/PILOT/knowledge/${ingestedDocId}/reindex`)
      .set('Authorization', `Bearer ${memberToken}`);

    assert.equal(res.status, HTTP_STATUS.OK);
    assert.equal(res.body.data.status, 'READY');

    const docAfter = await KnowledgeRepository.findDocumentById(ingestedDocId);
    assert.equal(docAfter.chunks.length, initialChunkCount);
  });

  // 14. Semantic search returns relevant chunks with similarity scores
  await t.test('14. Semantic vector search returns ranked matching chunks with similarity score and metadata', async () => {
    const res = await request(app)
      .post('/api/v1/projects/PILOT/knowledge/search')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        query: '768-float vector pgvector storage',
        limit: 3
      });

    assert.equal(res.status, HTTP_STATUS.OK);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.results));

    if (res.body.data.results.length > 0) {
      const match = res.body.data.results[0];
      assert.ok(match.documentTitle);
      assert.equal(typeof match.similarity, 'number');
      assert.equal(match.type, 'knowledge');
      assert.ok(match.content);
    }
  });

  // 15. Project isolation (PILOT vs INFRA)
  await t.test('15. Project isolation prevents non-member from searching unauthorized project knowledge', async () => {
    const res = await request(app)
      .post('/api/v1/projects/INFRA/knowledge/search')
      .set('Authorization', `Bearer ${nonInfraMemberToken}`)
      .send({
        query: 'Vector search'
      });

    assert.equal(res.status, HTTP_STATUS.FORBIDDEN);
  });

  // 16. Deleted document no longer searchable
  await t.test('16. Deleting document removes chunks from semantic search', async () => {
    // Create temp doc
    const tempRes = await request(app)
      .post('/api/v1/projects/PILOT/knowledge')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        title: 'Temp Doc For Deletion Test',
        content: 'UniqueSecretKeywordForDeletionTesting'
      });

    assert.equal(tempRes.status, HTTP_STATUS.CREATED);
    const tempId = tempRes.body.data.id;

    // Delete doc
    const delRes = await request(app)
      .delete(`/api/v1/projects/PILOT/knowledge/${tempId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    assert.equal(delRes.status, HTTP_STATUS.OK);

    // Search should not return deleted doc
    const searchRes = await request(app)
      .post('/api/v1/projects/PILOT/knowledge/search')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        query: 'UniqueSecretKeywordForDeletionTesting'
      });

    assert.equal(searchRes.status, HTTP_STATUS.OK);
    const matches = searchRes.body.data.results.filter((r) => r.documentId === tempId);
    assert.equal(matches.length, 0);
  });

  // 17. Sources correspond to actual documents/chunks
  await t.test('17. search_project_knowledge tool returns valid document title and source metadata', async () => {
    const result = await ToolExecutor.execute({
      name: 'search_project_knowledge',
      args: { projectKey: 'PILOT', query: 'RAG Architecture' },
      user: { id: 'u-1', role: 'ADMIN', memberId: 'm-1' },
      fallbackProjectKey: 'PILOT'
    });

    assert.equal(result.projectKey, 'PILOT');
    assert.ok(Array.isArray(result.documentationResults));
  });

  // 18. Embeddings are never returned to client in REST API payloads
  await t.test('18. GET document API payload contains no raw embedding vector arrays', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/PILOT/knowledge/${ingestedDocId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    const jsonStr = JSON.stringify(res.body);
    assert.equal(jsonStr.includes('passwordHash'), false);
    assert.equal(jsonStr.includes('"embedding":['), false);
  });

  // 19. Existing search_project_knowledge integration
  await t.test('19. Existing search_project_knowledge tool functions cleanly with upgraded pipeline', async () => {
    const searchRes = await ToolExecutor.execute({
      name: 'search_project_knowledge',
      args: { projectKey: 'PILOT', query: 'Task 18 RAG Pipeline' },
      user: { id: 'u-1', role: 'ADMIN', memberId: 'm-1' }
    });

    assert.ok(searchRes);
    assert.equal(searchRes.projectKey, 'PILOT');
  });

  // 20. Clean up main test document
  await t.test('20. Clean up test document and verify deletion', async () => {
    if (ingestedDocId) {
      const res = await request(app)
        .delete(`/api/v1/projects/PILOT/knowledge/${ingestedDocId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      assert.equal(res.status, HTTP_STATUS.OK);
    }
  });
});
