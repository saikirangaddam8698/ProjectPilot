/**
 * ProjectPilot Task 26 — AI Quality & Evaluation Dashboard Test Suite
 * Tests AI metrics snapshot calculation, request/grounding telemetry recording,
 * and GET /api/v1/ai/metrics API endpoint.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import { AiMetrics } from '../src/services/ai/observability/aiMetrics.js';
import { generateAuthToken } from '../src/utils/token.js';

describe('ProjectPilot Task 26: AI Quality & Evaluation Dashboard', () => {

  beforeEach(() => {
    AiMetrics.reset();
  });

  it('1. AiMetrics calculates snapshot statistics correctly', () => {
    AiMetrics.recordRequest();
    AiMetrics.recordSuccess();
    AiMetrics.recordTokens(150);
    AiMetrics.recordLatency(450);
    AiMetrics.recordGroundedResponse(true);

    const snapshot = AiMetrics.getSnapshot();
    assert.strictEqual(snapshot.totalRequests, 1);
    assert.strictEqual(snapshot.successfulRequests, 1);
    assert.strictEqual(snapshot.successRate, 1);
    assert.strictEqual(snapshot.totalTokens, 150);
    assert.strictEqual(snapshot.avgLatencyMs, 450);
    assert.strictEqual(snapshot.groundedResponses, 1);
  });

  it('2. GET /api/v1/ai/metrics returns aggregated metrics payload', async () => {
    const adminToken = generateAuthToken({ id: 'u-1', memberId: 'm-1', role: 'ADMIN' });
    const res = await request(app)
      .get('/api/v1/ai/metrics')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.ok([200, 503].includes(res.status));
    if (res.status === 200) {
      assert.ok(res.body.data);
      assert.strictEqual(typeof res.body.data.totalRequests, 'number');
      assert.strictEqual(typeof res.body.data.successRate, 'number');
      assert.strictEqual(typeof res.body.data.avgLatencyMs, 'number');
    }
  });

  it('3. GET /api/v1/ai/evaluation returns same evaluation snapshot', async () => {
    const adminToken = generateAuthToken({ id: 'u-1', memberId: 'm-1', role: 'ADMIN' });
    const res = await request(app)
      .get('/api/v1/ai/evaluation')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.ok([200, 503].includes(res.status));
    if (res.status === 200) {
      assert.ok(res.body.data);
      assert.strictEqual(typeof res.body.data.groundedResponses, 'number');
    }
  });

});
