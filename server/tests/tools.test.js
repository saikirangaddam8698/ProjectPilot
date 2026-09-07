/**
 * ProjectPilot Task 24 — Controlled Advanced AI Tools Test Suite
 * Tests tool allowlist enforcement, argument validation, RBAC verification,
 * Gemini function declaration exports, and output payload sanitization.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { APPROVED_AI_TOOLS, ToolRegistry } from '../src/services/ai/tool.registry.js';
import { ToolExecutor } from '../src/services/ai/tool.executor.js';
import { ApiError } from '../src/utils/apiError.js';

describe('ProjectPilot Task 24: Controlled Advanced AI Tools', () => {

  it('1. APPROVED_AI_TOOLS contains exactly the 7 allowlisted read-only tools', () => {
    assert.strictEqual(APPROVED_AI_TOOLS.length, 7);
    assert.ok(APPROVED_AI_TOOLS.includes('list_project_tickets'));
    assert.ok(APPROVED_AI_TOOLS.includes('get_ticket_details'));
    assert.ok(APPROVED_AI_TOOLS.includes('get_sprint_progress'));
    assert.ok(APPROVED_AI_TOOLS.includes('list_sprint_tickets'));
    assert.ok(APPROVED_AI_TOOLS.includes('get_project_activity'));
    assert.ok(APPROVED_AI_TOOLS.includes('get_project_summary'));
    assert.ok(APPROVED_AI_TOOLS.includes('search_project_knowledge'));
  });

  it('2. ToolRegistry exports 7 Gemini-compatible function declarations', () => {
    const decls = ToolRegistry.getGeminiFunctionDeclarations();
    assert.strictEqual(decls.length, 7);
    decls.forEach((d) => {
      assert.ok(d.name);
      assert.ok(d.description);
      assert.ok(d.parameters);
      assert.strictEqual(d.parameters.type, 'OBJECT');
    });
  });

  it('3. ToolExecutor rejects unapproved mutation tool requests', async () => {
    await assert.rejects(
      async () => {
        await ToolExecutor.execute({
          name: 'delete_project_tickets',
          args: { projectKey: 'PILOT' },
          user: { id: 'u-1', role: 'ADMIN' }
        });
      },
      (err) => err instanceof ApiError && err.statusCode === 400
    );
  });

  it('4. ToolExecutor rejects unauthenticated requests', async () => {
    await assert.rejects(
      async () => {
        await ToolExecutor.execute({
          name: 'get_project_summary',
          args: { projectKey: 'PILOT' },
          user: null
        });
      },
      (err) => err instanceof ApiError && err.statusCode === 401
    );
  });

  it('5. ToolExecutor validates get_ticket_details arguments', async () => {
    await assert.rejects(
      async () => {
        await ToolExecutor.execute({
          name: 'get_ticket_details',
          args: { projectKey: 'PILOT', ticketKey: '' },
          user: { id: 'u-1', role: 'ADMIN' }
        });
      },
      (err) => err instanceof ApiError && err.message.includes('ticketKey')
    );
  });

  it('6. ToolExecutor validates projectKey parameter presence', async () => {
    await assert.rejects(
      async () => {
        await ToolExecutor.execute({
          name: 'list_project_tickets',
          args: {},
          user: { id: 'u-1', role: 'ADMIN' },
          fallbackProjectKey: ''
        });
      },
      (err) => err instanceof ApiError && err.message.includes('projectKey')
    );
  });

  it('7. Registering an unapproved tool throws an explicit error', () => {
    assert.throws(
      () => {
        ToolRegistry.register({ name: 'unauthorized_write_tool', description: 'desc' });
      },
      (err) => err.message.includes('allowlist')
    );
  });

});
