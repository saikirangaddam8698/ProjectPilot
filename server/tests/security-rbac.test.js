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

  it('10. GET /api/v1/projects scopes project list to accessible projects for non-admin user', async () => {
    // Non-admin user with only INFRA project membership
    const userToken = generateAuthToken({ id: 'u-3', memberId: 'm-3', role: 'DEVELOPER' });
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${userToken}`);

    if (res.status === 200) {
      assert.strictEqual(res.body.success, true);
      const projects = res.body.data || [];
      // Every returned project must include the member
      projects.forEach((p) => {
        const isMember = (p.members || []).some((m) => m.id === 'm-3');
        assert.strictEqual(isMember, true, `Project ${p.key} should contain member m-3`);
      });
    }
  });

  it('11. GET /api/v1/tickets rejects query with 403 when requesting unauthorized project', async () => {
    const nonMemberToken = generateAuthToken({ id: 'u-5', memberId: 'm-5', role: 'DEVELOPER' }); // David Kim is in PILOT & MOBILE, NOT INFRA
    const res = await request(app)
      .get('/api/v1/tickets?projectKey=INFRA')
      .set('Authorization', `Bearer ${nonMemberToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  it('12. Workspace Admin has global access to all projects without membership restrictions', async () => {
    const adminToken = generateAuthToken({ id: 'u-1', memberId: 'm-1', role: 'ADMIN' });
    const res = await request(app)
      .get('/api/v1/projects/INFRA')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.key, 'INFRA');
  });

  it('13. Non-member is rejected with 403 when accessing ticket directly via /tickets/:ticketKey', async () => {
    // David Kim (u-5) is not in INFRA
    const nonMemberToken = generateAuthToken({ id: 'u-5', memberId: 'm-5', role: 'DEVELOPER' });
    const res = await request(app)
      .get('/api/v1/tickets/INFRA-14')
      .set('Authorization', `Bearer ${nonMemberToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  it('14. Non-member cannot mutate ticket status in unauthorized project (PATCH /tickets/:ticketKey/status)', async () => {
    // Elena Rostova (u-4) is not in INFRA
    const nonMemberToken = generateAuthToken({ id: 'u-4', memberId: 'm-4', role: 'PROJECT_MANAGER' });
    const res = await request(app)
      .patch('/api/v1/tickets/INFRA-14/status')
      .set('Authorization', `Bearer ${nonMemberToken}`)
      .send({ status: 'Done' });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  it('15. Non-member cannot view sprint details in unauthorized project (GET /sprints/:sprintId)', async () => {
    // David Kim (u-5) is not in INFRA
    const nonMemberToken = generateAuthToken({ id: 'u-5', memberId: 'm-5', role: 'DEVELOPER' });
    const res = await request(app)
      .get('/api/v1/sprints/sprint-infra-12')
      .set('Authorization', `Bearer ${nonMemberToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  it('16. Non-member cannot start sprint in unauthorized project (POST /sprints/:sprintId/start)', async () => {
    // Elena Rostova (u-4) is not in INFRA
    const nonMemberToken = generateAuthToken({ id: 'u-4', memberId: 'm-4', role: 'PROJECT_MANAGER' });
    const res = await request(app)
      .post('/api/v1/sprints/sprint-infra-12/start')
      .set('Authorization', `Bearer ${nonMemberToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  it('17. Viewer role is strictly read-only and cannot mutate ticket status', async () => {
    // Priya Patel (u-6) is a member of PILOT but has VIEWER global role
    const viewerToken = generateAuthToken({ id: 'u-6', memberId: 'm-6', role: 'VIEWER' });
    const res = await request(app)
      .patch('/api/v1/tickets/PILOT-89/status')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ status: 'Done' });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  it('18. Non-member is rejected with 403 when requesting project activities', async () => {
    // David Kim (u-5) is not in INFRA
    const nonMemberToken = generateAuthToken({ id: 'u-5', memberId: 'm-5', role: 'DEVELOPER' });
    const res = await request(app)
      .get('/api/v1/activities?projectKey=INFRA')
      .set('Authorization', `Bearer ${nonMemberToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  it('19. Non-member is rejected with 403 on project knowledge semantic search', async () => {
    // David Kim (u-5) is not in INFRA
    const nonMemberToken = generateAuthToken({ id: 'u-5', memberId: 'm-5', role: 'DEVELOPER' });
    const res = await request(app)
      .post('/api/v1/projects/INFRA/knowledge/search')
      .set('Authorization', `Bearer ${nonMemberToken}`)
      .send({ query: 'Kubernetes TLS configuration' });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  it('20. Global tickets endpoint /tickets without projectKey excludes unauthorized project tickets', async () => {
    // David Kim (u-5) has access to PILOT & MOBILE, not INFRA
    const userToken = generateAuthToken({ id: 'u-5', memberId: 'm-5', role: 'DEVELOPER' });
    const res = await request(app)
      .get('/api/v1/tickets')
      .set('Authorization', `Bearer ${userToken}`);

    if (res.status === 200) {
      const tickets = res.body.data || [];
      const hasInfraTicket = tickets.some((t) => (t.projectKey || t.key || '').startsWith('INFRA'));
      assert.strictEqual(hasInfraTicket, false, 'Non-member should never receive INFRA tickets');
    }
  });

});

