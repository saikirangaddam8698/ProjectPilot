import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { HTTP_STATUS, ERROR_CODES, APP_INFO } from '../src/utils/constants.js';

test('ProjectPilot Backend Integration Tests', async (t) => {
  await t.test('GET /api/health returns 200 and healthy status payload', async () => {
    const res = await request(app).get('/api/health');

    assert.equal(res.status, HTTP_STATUS.OK);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'healthy');
    assert.equal(res.body.data.app, APP_INFO.NAME);
    assert.ok(res.body.data.timestamp);
    assert.ok(typeof res.body.data.uptime.seconds === 'number');
    assert.ok(res.body.data.system.nodeVersion);
  });

  await t.test('GET /api/v1 returns 200 and API metadata catalog', async () => {
    const res = await request(app).get('/api/v1');

    assert.equal(res.status, HTTP_STATUS.OK);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.name, APP_INFO.NAME);
    assert.equal(res.body.data.version, 'v1');
    assert.equal(res.body.data.status, 'active');
    assert.ok(res.body.data.endpoints.health);
  });

  await t.test('GET /api/v1/health returns 200 and health metrics', async () => {
    const res = await request(app).get('/api/v1/health');

    assert.equal(res.status, HTTP_STATUS.OK);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'healthy');
    assert.ok(res.body.data.system.memory.heapUsedMb > 0);
  });

  await t.test('GET /api/v1/health/system returns 200 and diagnostic metrics', async () => {
    const res = await request(app).get('/api/v1/health/system');

    assert.equal(res.status, HTTP_STATUS.OK);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.nodeVersion);
    assert.ok(res.body.data.platform);
  });

  await t.test('GET /api/v1/non-existent-route returns structured 404 error JSON', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');

    assert.equal(res.status, HTTP_STATUS.NOT_FOUND);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, ERROR_CODES.NOT_FOUND);
    assert.ok(res.body.error.message.includes('Route not found'));
    assert.ok(res.body.timestamp);
  });

  await t.test('Security headers (Helmet) are applied on responses', async () => {
    const res = await request(app).get('/api/health');

    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-dns-prefetch-control'], 'off');
    assert.ok(res.headers['x-frame-options'] === 'SAMEORIGIN' || res.headers['content-security-policy']);
  });

  await t.test('CORS headers allow requests with appropriate origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:3000');

    assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:3000');
    assert.equal(res.headers['access-control-allow-credentials'], 'true');
  });
});
