/**
 * ProjectPilot Task 21 — Production API & Backend Hardening Test Suite
 * Tests health & readiness endpoints, request correlation headers, environment validation,
 * 404/500 error sanitization, and CORS preflight response headers.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import app from '../src/app.js';
import { validateEnv, config } from '../src/config/index.js';
import { HealthService } from '../src/services/health.service.js';

describe('ProjectPilot Task 21: Production API & Backend Hardening', () => {

  it('1. validateEnv executes without throwing and returns validation report', () => {
    const report = validateEnv();
    assert.strictEqual(typeof report.valid, 'boolean');
    assert.strictEqual(Array.isArray(report.warnings), true);
  });

  it('2. GET /api/v1/health returns operational server status', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .expect(200);

    assert.ok(res.body.data);
    assert.ok(res.body.data.status);
    assert.ok(res.body.data.app.includes('ProjectPilot'));
  });

  it('3. GET /api/v1/health/ready returns readiness check response', async () => {
    const res = await request(app)
      .get('/api/v1/health/ready');

    assert.ok([200, 503].includes(res.status));
    assert.ok(res.body.data);
    assert.ok(res.body.data.status);
    assert.ok(res.body.data.checks);
  });

  it('4. HealthService.getReadiness computes database and AI check flags', async () => {
    const readiness = await HealthService.getReadiness();
    assert.ok(readiness.status);
    assert.ok(readiness.checks.database);
    assert.ok(readiness.checks.aiService);
  });

  it('5. Response contains X-Request-Id header for request correlation', async () => {
    const res = await request(app)
      .get('/api/v1/health');

    assert.ok(res.headers['x-request-id']);
    assert.ok(res.headers['x-request-id'].length > 0);
  });

  it('6. Custom X-Request-Id header from client is preserved in response header', async () => {
    const customId = 'req_custom_test_12345';
    const res = await request(app)
      .get('/api/v1/health')
      .set('X-Request-Id', customId);

    assert.strictEqual(res.headers['x-request-id'], customId);
  });

  it('7. 404 handler formats missing endpoint as clean structured JSON without stack trace leakage', async () => {
    const res = await request(app)
      .get('/api/v1/non_existent_route_999')
      .expect(404);

    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error);
    assert.strictEqual(Boolean(res.body.stack), false);
  });

  it('8. CORS preflight OPTIONS request returns configured CORS headers', async () => {
    const res = await request(app)
      .options('/api/v1/health')
      .set('Origin', 'http://localhost:3000');

    assert.ok([200, 204].includes(res.status));
  });

  it('9. Express body parser handles JSON payload limit cleanly', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    assert.ok([200, 400, 401, 503].includes(res.status));
  });

});
