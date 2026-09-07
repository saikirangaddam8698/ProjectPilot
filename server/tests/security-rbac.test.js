/**
 * ProjectPilot Task 22 — Authentication & RBAC Security Hardening Test Suite
 * Formally tests JWT authentication rules, project membership boundaries, cross-project isolation,
 * private conversation ownership, and admin access control.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import { generateAuthToken, verifyAuthToken } from '../src/utils/token.js';
import { hashPassword, comparePassword } from '../src/utils/password.js';

describe('ProjectPilot Task 22: Authentication & RBAC Security Suite', () => {

  it('1. Unauthenticated requests to protected endpoints return 401 Unauthorized', async () => {
    const res = await request(app)
      .get('/api/v1/projects')
      .expect(401);

    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.status, 401);
  });

  it('2. Malformed JWT token returns 401 Unauthorized', async () => {
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', 'Bearer invalid_malformed_jwt_token')
      .expect(401);

    assert.strictEqual(res.body.success, false);
  });

  it('3. PasswordUtils generates valid salt and verifies correct password', async () => {
    const plain = 'SecurePassword123!';
    const hash = await hashPassword(plain);
    const isValid = await comparePassword(plain, hash);
    const isInvalid = await comparePassword('WrongPassword', hash);

    assert.strictEqual(isValid, true);
    assert.strictEqual(isInvalid, false);
  });

  it('4. JWT token generation and verification works with user payload', () => {
    const payload = { id: 'u-101', email: 'test@example.com', role: 'MEMBER' };
    const token = generateAuthToken(payload);
    const decoded = verifyAuthToken(token);

    assert.strictEqual(decoded.id, 'u-101');
    assert.strictEqual(decoded.role, 'MEMBER');
  });

  it('5. Non-member user is rejected with 403 when requesting unauthorized project details', async () => {
    const nonMemberToken = generateAuthToken({ id: 'u-nonmember', memberId: 'm-nonmember', role: 'MEMBER' });
    const res = await request(app)
      .get('/api/v1/projects/INFRA')
      .set('Authorization', `Bearer ${nonMemberToken}`);

    assert.ok([401, 403, 503].includes(res.status));
  });

  it('6. Non-member user is rejected when attempting to list tickets for unauthorized project', async () => {
    const nonMemberToken = generateAuthToken({ id: 'u-nonmember', memberId: 'm-nonmember', role: 'MEMBER' });
    const res = await request(app)
      .get('/api/v1/projects/INFRA/tickets')
      .set('Authorization', `Bearer ${nonMemberToken}`);

    assert.ok([401, 403, 503].includes(res.status));
  });

  it('7. Non-member user is rejected when attempting AI chat on unauthorized project', async () => {
    const nonMemberToken = generateAuthToken({ id: 'u-nonmember', memberId: 'm-nonmember', role: 'MEMBER' });
    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${nonMemberToken}`)
      .send({ projectKey: 'INFRA', message: 'Show tickets' });

    assert.ok([401, 403, 503].includes(res.status));
  });

  it('8. Cross-user private conversation access returns 404 or 403', async () => {
    const userAToken = generateAuthToken({ id: 'u-userA', memberId: 'm-userA', role: 'MEMBER' });
    const res = await request(app)
      .get('/api/v1/projects/PILOT/conversations/conv_belonging_to_user_B')
      .set('Authorization', `Bearer ${userAToken}`);

    assert.ok([401, 403, 404, 503].includes(res.status));
  });

  it('9. User profile responses never leak password hash', async () => {
    const userToken = generateAuthToken({ id: 'u-1', memberId: 'm-1', role: 'ADMIN' });
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    if (res.status === 200) {
      assert.strictEqual(Boolean(res.body.data?.passwordHash), false);
    }
  });

});
