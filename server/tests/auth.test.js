import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { generateAuthToken } from '../src/utils/token.js';
import { hashPassword, comparePassword } from '../src/utils/password.js';
import { HTTP_STATUS, ERROR_CODES } from '../src/utils/constants.js';

test('ProjectPilot Authentication & RBAC Test Suite', async (t) => {
  await t.test('Password utility correctly hashes and verifies passwords', async () => {
    const plain = 'PilotPass123!';
    const hash = await hashPassword(plain);
    assert.ok(hash);
    assert.notEqual(hash, plain);

    const isMatch = await comparePassword(plain, hash);
    assert.equal(isMatch, true);

    const isWrong = await comparePassword('WrongPassword', hash);
    assert.equal(isWrong, false);
  });

  await t.test('POST /api/v1/auth/login validates required fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'invalid' });

    assert.equal(res.status, HTTP_STATUS.BAD_REQUEST);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, ERROR_CODES.BAD_REQUEST);
  });

  await t.test('POST /api/v1/auth/login returns generic 401 on non-existent account or invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@projectpilot.dev', password: 'Password123!' });

    assert.equal(res.status, HTTP_STATUS.UNAUTHORIZED);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.message, 'Invalid email or password');
  });

  await t.test('POST /api/v1/auth/login succeeds with valid seed credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alex.m@projectpilot.dev', password: 'PilotPass123!' });

    assert.equal(res.status, HTTP_STATUS.OK);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.ok(res.body.data.user);
    assert.equal(res.body.data.user.email, 'alex.m@projectpilot.dev');
    assert.equal(res.body.data.user.role, 'ADMIN');
    // Ensure ZERO password or passwordHash is present in response
    assert.equal(res.body.data.user.password, undefined);
    assert.equal(res.body.data.user.passwordHash, undefined);

    // Verify Set-Cookie header contains projectpilot_token
    const cookies = res.headers['set-cookie'] || [];
    assert.ok(cookies.some((c) => c.includes('projectpilot_token=')));
  });

  await t.test('GET /api/v1/auth/me returns current authenticated user profile', async () => {
    const adminToken = generateAuthToken({
      id: 'u-1',
      email: 'alex.m@projectpilot.dev',
      role: 'ADMIN',
      memberId: 'm-1'
    });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, HTTP_STATUS.OK);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.email, 'alex.m@projectpilot.dev');
    assert.equal(res.body.data.role, 'ADMIN');
    assert.equal(res.body.data.password, undefined);
    assert.equal(res.body.data.passwordHash, undefined);
  });

  await t.test('POST /api/v1/auth/logout returns 200 and clears authentication cookie', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    assert.equal(res.status, HTTP_STATUS.OK);
    assert.equal(res.body.success, true);
    const cookies = res.headers['set-cookie'] || [];
    assert.ok(cookies.some((c) => c.includes('projectpilot_token=;') || c.includes('Max-Age=0') || c.includes('Expires=')));
  });

  await t.test('Protected endpoints reject unauthenticated requests with 401', async () => {
    const endpoints = [
      { method: 'get', url: '/api/v1/auth/me' },
      { method: 'get', url: '/api/v1/projects' },
      { method: 'get', url: '/api/v1/tickets' },
      { method: 'get', url: '/api/v1/sprints' },
      { method: 'get', url: '/api/v1/members' },
      { method: 'get', url: '/api/v1/activities' }
    ];

    for (const ep of endpoints) {
      const res = await request(app)[ep.method](ep.url);
      assert.equal(res.status, HTTP_STATUS.UNAUTHORIZED, `Endpoint ${ep.url} should require auth`);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, ERROR_CODES.UNAUTHORIZED);
    }
  });

  await t.test('Protected endpoints reject invalid or expired JWT with 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.token.value');

    assert.equal(res.status, HTTP_STATUS.UNAUTHORIZED);
    assert.equal(res.body.success, false);
  });

  await t.test('RBAC: Non-admin users are rejected with 403 on admin-only endpoints', async () => {
    // Generate valid token for a DEVELOPER
    const devToken = generateAuthToken({
      id: 'u-2',
      email: 'jane.d@projectpilot.dev',
      role: 'DEVELOPER',
      memberId: 'm-2'
    });

    // Attempt global admin action: DELETE /api/v1/projects/PILOT
    const res = await request(app)
      .delete('/api/v1/projects/PILOT')
      .set('Authorization', `Bearer ${devToken}`);

    // Should be rejected by requireRole('ADMIN')
    assert.equal(res.status, HTTP_STATUS.FORBIDDEN);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.message.includes('Forbidden'));
  });
});
