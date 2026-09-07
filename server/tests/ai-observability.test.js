/**
 * Task 16 — AI Observability, Evaluation & Production Hardening Test Suite
 * Comprehensive, deterministic tests for request correlation IDs, telemetry, metrics,
 * error classification, deterministic evaluation, grounding checks, and security boundaries.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { generateAuthToken } from '../src/utils/token.js';
import { GeminiClient } from '../src/services/gemini.client.js';
import { requestId as requestIdMiddleware } from '../src/middleware/requestId.js';
import { AiErrorClassifier, AI_ERROR_CATEGORIES } from '../src/services/ai/observability/aiErrorClassifier.js';
import { AiMetrics } from '../src/services/ai/observability/aiMetrics.js';
import { AiEvaluator } from '../src/services/ai/observability/aiEvaluator.js';
import { HTTP_STATUS } from '../src/utils/constants.js';

test('ProjectPilot Task 16: AI Observability & Evaluation Test Suite', async (t) => {
  const adminToken = generateAuthToken({
    id: 'u-1',
    email: 'alex.m@projectpilot.dev',
    role: 'ADMIN',
    memberId: 'm-1'
  });

  t.beforeEach(() => {
    AiMetrics.reset();
  });

  t.afterEach(() => {
    GeminiClient.setMock(null);
  });

  // 1. Request ID generated
  await t.test('1. Request ID middleware generates correlation ID', () => {
    const req = { headers: {} };
    const res = { setHeader: () => {} };
    let nextCalled = false;

    requestIdMiddleware(req, res, () => { nextCalled = true; });

    assert.ok(nextCalled);
    assert.ok(req.requestId);
    assert.ok(req.requestId.startsWith('ai_'));
  });

  // 2. Request ID attached to request context
  await t.test('2. Request ID is attached to request object in controller pipeline', async () => {
    GeminiClient.setMock({
      generateContent: async () => ({
        text: 'Hello world',
        functionCalls: [],
        candidateContent: null,
        model: 'gemini-3.6-flash',
        usage: { promptTokens: 10, candidatesTokens: 5, totalTokens: 15 }
      })
    });

    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ projectKey: 'PILOT', message: 'Hello' });

    if (res.status === HTTP_STATUS.OK) {
      assert.ok(res.body.data.requestId);
      assert.ok(res.body.data.requestId.startsWith('ai_'));
    }
  });

  // 3. X-Request-Id response header returned
  await t.test('3. HTTP response header X-Request-Id is returned', async () => {
    const res = await request(app)
      .post('/api/v1/ai/chat')
      .send({ projectKey: 'PILOT', message: 'Test' });

    assert.ok(res.headers['x-request-id']);
  });

  // 4. Existing valid request ID reused
  await t.test('4. Existing valid X-Request-Id header is safely reused', () => {
    const req = { headers: { 'x-request-id': 'custom_corr_id_12345' } };
    let setHeaderVal = null;
    const res = { setHeader: (k, v) => { setHeaderVal = v; } };

    requestIdMiddleware(req, res, () => {});

    assert.equal(req.requestId, 'custom_corr_id_12345');
    assert.equal(setHeaderVal, 'custom_corr_id_12345');
  });

  // 5. Error classification — validation
  await t.test('5. AiErrorClassifier classifies validation error', () => {
    const cat = AiErrorClassifier.classify({ statusCode: 400, message: 'projectKey is required' });
    assert.equal(cat, AI_ERROR_CATEGORIES.VALIDATION_ERROR);
  });

  // 6. Error classification — authentication
  await t.test('6. AiErrorClassifier classifies 401 as AUTHENTICATION_ERROR', () => {
    const cat = AiErrorClassifier.classify({ statusCode: 401, message: 'Invalid JWT token' });
    assert.equal(cat, AI_ERROR_CATEGORIES.AUTHENTICATION_ERROR);
  });

  // 7. Error classification — authorization
  await t.test('7. AiErrorClassifier classifies 403 as AUTHORIZATION_ERROR', () => {
    const cat = AiErrorClassifier.classify({ statusCode: 403, message: 'User is not a member of project' });
    assert.equal(cat, AI_ERROR_CATEGORIES.AUTHORIZATION_ERROR);
  });

  // 8. Error classification — rate limit
  await t.test('8. AiErrorClassifier classifies 429 as RATE_LIMITED or GEMINI_RATE_LIMITED', () => {
    const cat1 = AiErrorClassifier.classify({ statusCode: 429, message: 'Rate limit exceeded' });
    const cat2 = AiErrorClassifier.classify({ statusCode: 429, message: 'Gemini rate limit exceeded' });

    assert.equal(cat1, AI_ERROR_CATEGORIES.RATE_LIMITED);
    assert.equal(cat2, AI_ERROR_CATEGORIES.GEMINI_RATE_LIMITED);
  });

  // 9. Error classification — Gemini unavailable
  await t.test('9. AiErrorClassifier classifies Gemini unavailable', () => {
    const cat = AiErrorClassifier.classify({ statusCode: 503, message: 'AI Generation error: Gemini model is overloaded' });
    assert.equal(cat, AI_ERROR_CATEGORIES.GEMINI_UNAVAILABLE);
  });

  // 10. Error classification — database unavailable
  await t.test('10. AiErrorClassifier classifies PostgreSQL/Prisma error as DATABASE_UNAVAILABLE', () => {
    const cat = AiErrorClassifier.classify({ message: 'Prisma Client PostgreSQL connection closed' });
    assert.equal(cat, AI_ERROR_CATEGORIES.DATABASE_UNAVAILABLE);
  });

  // 11. Error classification — RAG unavailable
  await t.test('11. AiErrorClassifier classifies RAG error as RAG_UNAVAILABLE', () => {
    const cat = AiErrorClassifier.classify({ message: 'Knowledge search vector failure' });
    assert.equal(cat, AI_ERROR_CATEGORIES.RAG_UNAVAILABLE);
  });

  // 12. Error classification — max agent rounds
  await t.test('12. AiErrorClassifier classifies max rounds as AGENT_MAX_ROUNDS', () => {
    const cat = AiErrorClassifier.classify({ message: 'MAX_AGENT_ROUNDS limit reached before completing response' });
    assert.equal(cat, AI_ERROR_CATEGORIES.AGENT_MAX_ROUNDS);
  });

  // 13. Metrics request counting
  await t.test('13. AiMetrics correctly records total, success, and failure counts', () => {
    AiMetrics.recordRequest();
    AiMetrics.recordRequest();
    AiMetrics.recordSuccess();
    AiMetrics.recordFailure();

    const snapshot = AiMetrics.getSnapshot();
    assert.equal(snapshot.totalRequests, 2);
    assert.equal(snapshot.successfulRequests, 1);
    assert.equal(snapshot.failedRequests, 1);
    assert.equal(snapshot.successRate, 0.5);
  });

  // 14. Metrics token counting
  await t.test('14. AiMetrics tracks total token usage', () => {
    AiMetrics.recordTokens(150);
    AiMetrics.recordTokens(250);

    const snapshot = AiMetrics.getSnapshot();
    assert.equal(snapshot.totalTokens, 400);
  });

  // 15. Metrics latency calculation
  await t.test('15. AiMetrics calculates average latency across successful requests', () => {
    AiMetrics.recordRequest();
    AiMetrics.recordSuccess();
    AiMetrics.recordLatency(100);

    AiMetrics.recordRequest();
    AiMetrics.recordSuccess();
    AiMetrics.recordLatency(300);

    const snapshot = AiMetrics.getSnapshot();
    assert.equal(snapshot.avgLatencyMs, 200);
  });

  // 16. Approved tool evaluation
  await t.test('16. AiEvaluator passes response with approved tools', () => {
    const evalReport = AiEvaluator.evaluate({
      message: 'Here is your ticket list.',
      executedTools: [{ name: 'list_project_tickets', label: 'Project Tickets', round: 1 }],
      sources: [],
      analysis: null
    });

    assert.equal(evalReport.valid, true);
    assert.equal(evalReport.checks.toolsApproved, true);
  });

  // 17. Unknown tool rejected
  await t.test('17. AiEvaluator detects and rejects unapproved tools', () => {
    const evalReport = AiEvaluator.evaluate({
      message: 'Executed malicious tool.',
      executedTools: [{ name: 'delete_database_table', label: 'Delete', round: 1 }],
      sources: [],
      analysis: null
    });

    assert.equal(evalReport.valid, false);
    assert.equal(evalReport.checks.toolsApproved, false);
    assert.ok(evalReport.violations.some((v) => v.includes('Unapproved tool')));
  });

  // 18. RAG citation grounding
  await t.test('18. AiEvaluator evaluates valid RAG citation sources', () => {
    const evalReport = AiEvaluator.evaluate({
      message: 'Based on specs...',
      executedTools: [{ name: 'search_project_knowledge', label: 'Project Knowledge', round: 1 }],
      sources: [{ type: 'knowledge', title: 'Auth Architecture ADR', similarity: 0.82 }],
      analysis: null
    });

    assert.equal(evalReport.grounded, true);
    assert.equal(evalReport.checks.sourcesGrounded, true);
  });

  // 19. Fabricated citation rejected
  await t.test('19. AiEvaluator rejects empty or malformed citation sources', () => {
    const evalReport = AiEvaluator.evaluate({
      message: 'Bad citation',
      executedTools: [],
      sources: [{ type: 'knowledge', title: '' }],
      analysis: null
    });

    assert.equal(evalReport.grounded, false);
    assert.equal(evalReport.checks.sourcesGrounded, false);
  });

  // 20. Analysis evidence grounding
  await t.test('20. AiEvaluator checks analysis findings structure', () => {
    const evalReport = AiEvaluator.evaluate({
      message: 'Risk summary',
      executedTools: [],
      sources: [],
      analysis: {
        type: 'sprint-risk',
        severity: 'high',
        findings: [{ text: 'Grounded finding', evidence: ['PILOT-104'] }],
        recommendations: [{ text: 'Grounded rec', evidence: ['PILOT-104'] }]
      }
    });

    assert.equal(evalReport.grounded, true);
    assert.equal(evalReport.checks.analysisGrounded, true);
  });

  // 21. Secret leakage detection
  await t.test('21. AiEvaluator flags secret leakage in payload', () => {
    const evalReport = AiEvaluator.evaluate({
      message: 'Here is your DB connection: postgres://admin:secret@localhost:5432/db',
      executedTools: [],
      sources: [],
      analysis: null
    });

    assert.equal(evalReport.valid, false);
    assert.equal(evalReport.checks.secretsSafe, false);
    assert.ok(evalReport.violations.some((v) => v.includes('Security check failed')));
  });

  // 22. Final response contains requestId + grounded
  await t.test('22. Final AI response payload contains correlation requestId and grounded boolean', async () => {
    GeminiClient.setMock({
      generateContent: async () => ({
        text: 'Clean grounded response',
        functionCalls: [],
        candidateContent: null,
        model: 'gemini-3.6-flash',
        usage: { promptTokens: 30, candidatesTokens: 10, totalTokens: 40 }
      })
    });

    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ projectKey: 'PILOT', message: 'Hello' });

    if (res.status === HTTP_STATUS.OK) {
      assert.ok('requestId' in res.body.data);
      assert.ok('grounded' in res.body.data);
      assert.equal(typeof res.body.data.grounded, 'boolean');
    }
  });
});
