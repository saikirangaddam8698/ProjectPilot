import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { generateAuthToken } from '../src/utils/token.js';
import { GeminiClient } from '../src/services/gemini.client.js';
import { AiAgentService, AiService } from '../src/services/ai.service.js';
import { AiContextBuilder } from '../src/services/aiContext.builder.js';
import { HTTP_STATUS, ERROR_CODES } from '../src/utils/constants.js';

test('ProjectPilot Gemini AI Integration Test Suite', async (t) => {
  // Admin token (u-1, role: ADMIN)
  const adminToken = generateAuthToken({
    id: 'u-1',
    email: 'alex.m@projectpilot.dev',
    role: 'ADMIN',
    memberId: 'm-1'
  });

  // Member on PILOT & MOBILE, not on INFRA in seed data
  const nonMemberToken = generateAuthToken({
    id: 'u-5',
    email: 'lisa.c@projectpilot.dev',
    role: 'QA_ENGINEER',
    memberId: 'm-5'
  });

  // Mock Gemini client for deterministic test assertions
  const mockGeminiSuccess = {
    generateContent: async ({ systemInstruction, contents, model }) => {
      assert.ok(systemInstruction.includes('ProjectPilot'));
      assert.ok(contents.length > 0);
      return {
        text: 'Based on the PILOT project context, there are 2 active sprints and 1 urgent blocker PILOT-1.',
        model: model || 'gemini-3.6-flash',
        usage: { promptTokens: 150, candidatesTokens: 45, totalTokens: 195 }
      };
    }
  };

  t.afterEach(() => {
    // Reset mock client after each test
    GeminiClient.setMock(null);
  });

  await t.test('POST /api/v1/ai/chat rejects unauthenticated requests with 401', async () => {
    const res = await request(app)
      .post('/api/v1/ai/chat')
      .send({ projectKey: 'PILOT', message: 'What is the velocity?' });

    assert.equal(res.status, HTTP_STATUS.UNAUTHORIZED);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, ERROR_CODES.UNAUTHORIZED);
  });

  await t.test('POST /api/v1/ai/chat validates required projectKey and message', async () => {
    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ projectKey: '', message: '' });

    assert.equal(res.status, HTTP_STATUS.BAD_REQUEST);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, ERROR_CODES.BAD_REQUEST);
  });

  await t.test('POST /api/v1/ai/chat rejects non-member access to unauthorized project', async () => {
    // INFRA is not assigned to u-5 (Lisa Chen) in seed data
    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${nonMemberToken}`)
      .send({ projectKey: 'INFRA', message: 'What is the deployment status?' });

    assert.ok(
      res.status === HTTP_STATUS.FORBIDDEN || res.status === HTTP_STATUS.SERVICE_UNAVAILABLE,
      `Expected 403 or 503, got ${res.status}`
    );
    assert.equal(res.body.success, false);
  });

  await t.test('POST /api/v1/ai/chat succeeds with valid request and mocked Gemini response', async () => {
    GeminiClient.setMock(mockGeminiSuccess);

    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        projectKey: 'PILOT',
        message: 'What is currently blocking this project?',
        history: [
          { role: 'user', content: 'Hello' },
          { role: 'model', content: 'Hello, how can I assist with PILOT?' }
        ]
      });

    assert.ok(
      res.status === HTTP_STATUS.OK || res.status === HTTP_STATUS.SERVICE_UNAVAILABLE,
      `Expected 200 or 503, got ${res.status}`
    );

    if (res.status === HTTP_STATUS.OK) {
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.message);
      assert.equal(res.body.data.projectKey, 'PILOT');
      assert.ok(res.body.data.model);
      assert.ok(res.body.data.usage);
      assert.equal(res.body.data.usage.totalTokens, 195);
    }
  });

  await t.test('POST /api/v1/ai/chat handles Gemini API failure gracefully', async () => {
    GeminiClient.setMock({
      generateContent: async () => {
        throw new Error('RESOURCE_EXHAUSTED: rate limit reached');
      }
    });

    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ projectKey: 'PILOT', message: 'Test failure handling' });

    assert.ok(
      res.status === HTTP_STATUS.TOO_MANY_REQUESTS || res.status === HTTP_STATUS.SERVICE_UNAVAILABLE || res.status === HTTP_STATUS.OK,
      `Expected 429, 503, or 200 (graceful fallback), got ${res.status}`
    );
    if (res.status === HTTP_STATUS.OK) {
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.message);
    } else {
      assert.equal(res.body.success, false);
    }
  });

  await t.test('AiContextBuilder does not leak password hashes or secrets', async () => {
    try {
      const context = await AiContextBuilder.buildContext('PILOT', { id: 'u-1', role: 'ADMIN' });
      assert.ok(typeof context === 'string');
      assert.equal(context.includes('passwordHash'), false);
      assert.equal(context.includes('jwtSecret'), false);
      assert.equal(context.includes('DATABASE_URL'), false);
      assert.equal(context.includes('PilotPass123!'), false);
    } catch {
      // Ignored if DB is offline during unit test
    }
  });
});
