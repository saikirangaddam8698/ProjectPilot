import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { generateAuthToken } from '../src/utils/token.js';
import { HTTP_STATUS, ERROR_CODES } from '../src/utils/constants.js';

test('ProjectPilot REST API v1 Integration Tests', async (t) => {
  const adminToken = generateAuthToken({
    id: 'u-1',
    email: 'alex.m@projectpilot.dev',
    role: 'ADMIN',
    memberId: 'm-1'
  });

  await t.test('GET /api/v1 lists all available domain endpoint catalogs', async () => {
    const res = await request(app).get('/api/v1');
    assert.equal(res.status, HTTP_STATUS.OK);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.endpoints.auth);
    assert.ok(res.body.data.endpoints.projects);
    assert.ok(res.body.data.endpoints.tickets);
    assert.ok(res.body.data.endpoints.sprints);
    assert.ok(res.body.data.endpoints.members);
    assert.ok(res.body.data.endpoints.activities);
  });

  await t.test('POST /api/v1/projects validation failure on missing name', async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ key: 'TEST' });

    assert.ok(res.status === HTTP_STATUS.BAD_REQUEST || res.status === HTTP_STATUS.UNAUTHORIZED);
    assert.equal(res.body.success, false);
  });

  await t.test('POST /api/v1/tickets validation failure on missing title or projectKey', async () => {
    const res = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'No title' });

    assert.ok(res.status === HTTP_STATUS.BAD_REQUEST || res.status === HTTP_STATUS.UNAUTHORIZED);
    assert.equal(res.body.success, false);
  });

  await t.test('POST /api/v1/sprints validation failure on missing name', async () => {
    const res = await request(app)
      .post('/api/v1/sprints')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ capacity: 20 });

    assert.ok(res.status === HTTP_STATUS.BAD_REQUEST || res.status === HTTP_STATUS.UNAUTHORIZED);
    assert.equal(res.body.success, false);
  });

  await t.test('POST /api/v1/members validation failure on invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'John Doe', email: 'invalid-email' });

    assert.ok(res.status === HTTP_STATUS.BAD_REQUEST || res.status === HTTP_STATUS.UNAUTHORIZED);
    assert.equal(res.body.success, false);
  });

  await t.test('POST /api/v1/activities validation failure on missing message', async () => {
    const res = await request(app)
      .post('/api/v1/activities')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ projectKey: 'PILOT' });

    assert.ok(res.status === HTTP_STATUS.BAD_REQUEST || res.status === HTTP_STATUS.UNAUTHORIZED);
    assert.equal(res.body.success, false);
  });

  await t.test('PATCH /api/v1/tickets/PILOT-9999/status returns error with structured JSON', async () => {
    const res = await request(app)
      .patch('/api/v1/tickets/PILOT-9999/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'InvalidStatus' });

    assert.ok(res.status === HTTP_STATUS.BAD_REQUEST || res.status === HTTP_STATUS.UNAUTHORIZED);
    assert.equal(res.body.success, false);
  });
});
