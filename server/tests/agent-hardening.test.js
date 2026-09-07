/**
 * ProjectPilot Task 23 — AI Production Integration & Safety Controls Test Suite
 * Tests Gemini timeouts, retry/backoff policy, malformed function call sanitization,
 * context budget pruning, overall agent execution timeout, request cancellation,
 * concurrency limiting, and error classification.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { GeminiClient } from '../src/services/gemini.client.js';
import { AiAgentService } from '../src/services/ai.service.js';
import { AiErrorClassifier, AI_ERROR_CATEGORIES } from '../src/services/ai/observability/aiErrorClassifier.js';
import { ApiError } from '../src/utils/apiError.js';

describe('ProjectPilot Task 23: AI Production Integration & Safety Controls', () => {
  const dummyUser = { id: 'u-test', memberId: 'm-test', role: 'ADMIN' };

  afterEach(() => {
    GeminiClient.setMock(null);
  });

  it('1. GeminiClient withTimeout rejects when operation exceeds timeout threshold', async () => {
    const slowPromise = new Promise((res) => setTimeout(res, 500));
    await assert.rejects(
      async () => {
        await GeminiClient.withTimeout(slowPromise, 50);
      },
      (err) => {
        return err instanceof ApiError && err.message.includes('timed out');
      }
    );
  });

  it('2. GeminiClient retries transient 503 errors and succeeds on retry', async () => {
    let attempts = 0;
    GeminiClient.setMock({
      async generateContent() {
        attempts++;
        if (attempts === 1) {
          const err = new Error('503 Service Unavailable');
          err.status = 503;
          throw err;
        }
        return {
          text: 'Success after retry',
          functionCalls: []
        };
      }
    });

    const res = await GeminiClient.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
    });

    assert.strictEqual(res.text, 'Success after retry');
    assert.strictEqual(attempts, 2);
  });

  it('3. GeminiClient filters out malformed function calls cleanly', async () => {
    GeminiClient.setMock({
      async generateContent() {
        return {
          text: 'Valid response',
          functionCalls: [
            { name: 'list_project_tickets', args: { projectKey: 'PILOT' } },
            null,
            { name: '', args: {} },
            { args: { key: 'invalid' } }
          ]
        };
      }
    });

    const res = await GeminiClient.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
    });

    assert.strictEqual(res.functionCalls.length, 1);
    assert.strictEqual(res.functionCalls[0].name, 'list_project_tickets');
  });

  it('4. AiAgentService.pruneContextIfNeeded prunes oldest history turns when character budget exceeded', () => {
    const longText = 'A'.repeat(15000);
    const contents = [
      { role: 'user', parts: [{ text: longText }] },
      { role: 'model', parts: [{ text: longText }] },
      { role: 'user', parts: [{ text: 'Latest query' }] }
    ];

    const pruned = AiAgentService.pruneContextIfNeeded(contents, 20000);
    assert.ok(pruned.length < contents.length);
    assert.strictEqual(pruned[pruned.length - 1].parts[0].text, 'Latest query');
  });

  it('5. AiErrorClassifier classifies Gemini timeout error correctly', () => {
    const category = AiErrorClassifier.classify(new Error('Gemini API request timed out after 15000ms'));
    assert.strictEqual(category, AI_ERROR_CATEGORIES.GEMINI_TIMEOUT);
  });

  it('6. AiErrorClassifier classifies Agent overall execution timeout error correctly', () => {
    const category = AiErrorClassifier.classify(new Error('AI Agent overall execution timed out after 30000ms'));
    assert.strictEqual(category, AI_ERROR_CATEGORIES.AGENT_TIMEOUT);
  });

  it('7. AiErrorClassifier classifies Client cancellation correctly', () => {
    const category = AiErrorClassifier.classify(new Error('AI request cancelled by client'));
    assert.strictEqual(category, AI_ERROR_CATEGORIES.CLIENT_CANCELLED);
  });

  it('8. AiErrorClassifier classifies Concurrency limit error correctly', () => {
    const category = AiErrorClassifier.classify(new Error('Too many concurrent AI requests'));
    assert.strictEqual(category, AI_ERROR_CATEGORIES.CONCURRENCY_LIMIT);
  });

  it('9. AiAgentService.chat respects AbortSignal cancellation', async () => {
    const controller = new AbortController();
    controller.abort();

    await assert.rejects(
      async () => {
        await AiAgentService.chat({
          projectKey: 'PILOT',
          message: 'Hello',
          user: dummyUser,
          signal: controller.signal
        });
      },
      (err) => {
        return err instanceof ApiError && err.message.includes('cancelled');
      }
    );
  });

});
