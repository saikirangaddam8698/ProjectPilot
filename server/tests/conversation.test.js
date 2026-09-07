/**
 * Task 17 — AI Conversation & Project Context Persistence Test Suite
 * Validates persistent conversation creation, listing, message sending, context history,
 * history bounding, RBAC security, metadata storage, and secret filtering.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { generateAuthToken } from '../src/utils/token.js';
import { GeminiClient } from '../src/services/gemini.client.js';
import { ConversationRepository } from '../src/repositories/conversation.repository.js';
import { HTTP_STATUS } from '../src/utils/constants.js';

test('ProjectPilot Task 17: Conversation & Context Persistence Test Suite', async (t) => {
  const adminToken = generateAuthToken({
    id: 'u-1',
    email: 'alex.m@projectpilot.dev',
    role: 'ADMIN',
    memberId: 'm-1'
  });

  const nonMemberToken = generateAuthToken({
    id: 'u-5',
    email: 'david.k@projectpilot.dev',
    role: 'DEVELOPER',
    memberId: 'm-5'
  });

  let createdConvId = null;

  t.afterEach(() => {
    GeminiClient.setMock(null);
  });

  // 1. Create conversation
  await t.test('1. Authenticated user can create a new conversation', async () => {
    const res = await request(app)
      .post('/api/v1/projects/PILOT/conversations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Sprint Health Discussion' });

    assert.equal(res.status, HTTP_STATUS.CREATED);
    assert.ok(res.body.data.id);
    assert.equal(res.body.data.title, 'Sprint Health Discussion');

    createdConvId = res.body.data.id;
  });

  // 2. List conversations
  await t.test('2. List conversations for authorized project returns list including newly created conversation', async () => {
    const res = await request(app)
      .get('/api/v1/projects/PILOT/conversations')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, HTTP_STATUS.OK);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.some((c) => c.id === createdConvId));
  });

  // 3. Get single conversation
  await t.test('3. Can retrieve single conversation details and messages', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/PILOT/conversations/${createdConvId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, HTTP_STATUS.OK);
    assert.equal(res.body.data.id, createdConvId);
    assert.ok(Array.isArray(res.body.data.messages));
  });

  // 4 & 5 & 6. Send message, persist user message & assistant message
  await t.test('4. Send message persists user and assistant message turns with metadata', async () => {
    GeminiClient.setMock({
      generateContent: async () => ({
        text: 'The current sprint is progressing well with 80% completion.',
        functionCalls: [],
        candidateContent: null,
        model: 'gemini-3.6-flash',
        usage: { promptTokens: 40, candidatesTokens: 20, totalTokens: 60 }
      })
    });

    const res = await request(app)
      .post(`/api/v1/projects/PILOT/conversations/${createdConvId}/messages`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: 'What is the current sprint status?' });

    assert.equal(res.status, HTTP_STATUS.OK);
    assert.ok(res.body.data.userMessage);
    assert.equal(res.body.data.userMessage.role, 'user');
    assert.equal(res.body.data.userMessage.content, 'What is the current sprint status?');

    assert.ok(res.body.data.assistantMessage);
    assert.equal(res.body.data.assistantMessage.role, 'assistant');
    assert.ok(res.body.data.assistantMessage.content.includes('80% completion'));
    assert.ok(res.body.data.grounded);
  });

  // 7 & 8. Continue existing conversation & pass history
  await t.test('7. Subsequent message sends conversation history context to Gemini', async () => {
    let receivedContents = null;

    GeminiClient.setMock({
      generateContent: async ({ contents }) => {
        receivedContents = contents;
        return {
          text: 'Continuing context answer',
          functionCalls: [],
          candidateContent: null,
          model: 'gemini-3.6-flash',
          usage: { promptTokens: 50, candidatesTokens: 15, totalTokens: 65 }
        };
      }
    });

    const res = await request(app)
      .post(`/api/v1/projects/PILOT/conversations/${createdConvId}/messages`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: 'Tell me more details.' });

    assert.equal(res.status, HTTP_STATUS.OK);
    assert.ok(receivedContents);
    // Should include previous user turn, previous assistant turn, and new user message
    assert.ok(receivedContents.length >= 3);
  });

  // 9. History ordering preserved
  await t.test('9. History messages in getRecentMessages maintain chronological order', async () => {
    const recent = await ConversationRepository.getRecentMessages({
      conversationId: createdConvId,
      limit: 10
    });

    assert.ok(recent.length >= 4);
    for (let i = 1; i < recent.length; i++) {
      assert.ok(new Date(recent[i].createdAt) >= new Date(recent[i - 1].createdAt));
    }
  });

  // 10. History bounded to configured limit (20)
  await t.test('10. History returned for agent is bounded to recent limit', async () => {
    const recent = await ConversationRepository.getRecentMessages({
      conversationId: createdConvId,
      limit: 2
    });

    assert.equal(recent.length, 2);
  });

  // 11. Tool metadata persisted safely
  await t.test('11. Tool execution metadata is safely stored in assistant message', async () => {
    GeminiClient.setMock({
      generateContent: async () => ({
        text: 'Sprint progress evaluated.',
        functionCalls: [],
        candidateContent: null,
        model: 'gemini-3.6-flash'
      })
    });

    const res = await request(app)
      .post(`/api/v1/projects/PILOT/conversations/${createdConvId}/messages`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: 'Check sprint progress' });

    assert.equal(res.status, HTTP_STATUS.OK);
    assert.ok(Array.isArray(res.body.data.executedTools));
  });

  // 12. RAG sources persisted safely
  await t.test('12. RAG sources metadata is safely stored in assistant message', async () => {
    const detail = await request(app)
      .get(`/api/v1/projects/PILOT/conversations/${createdConvId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(detail.status, HTTP_STATUS.OK);
    const lastAssistantMsg = detail.body.data.messages.filter((m) => m.role === 'assistant').pop();
    assert.ok(lastAssistantMsg);
    assert.ok(Array.isArray(lastAssistantMsg.sources));
  });

  // 13. Analysis metadata persisted safely
  await t.test('13. Risk analysis metadata is safely stored in assistant message', async () => {
    let callCount = 0;
    GeminiClient.setMock({
      generateContent: async () => {
        callCount++;
        if (callCount === 1) {
          return {
            text: '',
            functionCalls: [{ name: 'get_sprint_progress', args: {} }],
            model: 'gemini-3.6-flash'
          };
        }
        return {
          text: 'Risk analysis result\nANALYSIS_BLOCK: {"type":"sprint-risk","severity":"medium","findings":[{"text":"Minor delay","evidence":["PILOT"]}],"recommendations":[{"text":"Track tickets","evidence":["PILOT"]}]}',
          functionCalls: [],
          model: 'gemini-3.6-flash'
        };
      }
    });

    const res = await request(app)
      .post(`/api/v1/projects/PILOT/conversations/${createdConvId}/messages`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: 'What are the biggest risks in the current sprint?' });

    assert.equal(res.status, HTTP_STATUS.OK);
    assert.ok(res.body.data.analysis);
    assert.equal(res.body.data.analysis.type, 'sprint-risk');
  });

  // 14. Unauthorized project rejected
  await t.test('14. Non-member user cannot access conversations for unauthorized project', async () => {
    const res = await request(app)
      .get('/api/v1/projects/INFRA/conversations')
      .set('Authorization', `Bearer ${nonMemberToken}`);

    assert.equal(res.status, HTTP_STATUS.FORBIDDEN);
  });

  // 15. Unauthorized conversation ID rejected
  await t.test('15. Attempting to get non-existent conversation returns 404', async () => {
    const res = await request(app)
      .get('/api/v1/projects/PILOT/conversations/nonexistent_conv_id')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, HTTP_STATUS.NOT_FOUND);
  });

  // 16. Cross-project conversation access rejected
  await t.test('16. Cross-project conversation access is rejected with 404', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/INFRA/conversations/${createdConvId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, HTTP_STATUS.NOT_FOUND);
  });

  // 17. Invalid conversation ID rejected
  await t.test('17. Sending message to invalid conversation returns 404', async () => {
    const res = await request(app)
      .post('/api/v1/projects/PILOT/conversations/invalid_conv_99/messages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: 'Hello' });

    assert.equal(res.status, HTTP_STATUS.NOT_FOUND);
  });

  // 18. Oversized message rejected
  await t.test('18. Oversized message exceeding 2000 characters is rejected with 400', async () => {
    const longMsg = 'A'.repeat(2005);
    const res = await request(app)
      .post(`/api/v1/projects/PILOT/conversations/${createdConvId}/messages`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: longMsg });

    assert.equal(res.status, HTTP_STATUS.BAD_REQUEST);
  });

  // 19. Secrets not persisted
  await t.test('19. Conversation message metadata contains no DB credentials or API keys', async () => {
    const detail = await request(app)
      .get(`/api/v1/projects/PILOT/conversations/${createdConvId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const payloadStr = JSON.stringify(detail.body);
    assert.equal(payloadStr.includes('DATABASE_URL'), false);
    assert.equal(payloadStr.includes('GEMINI_API_KEY'), false);
  });

  // 20. Raw tool results not persisted
  await t.test('20. Raw tool results are excluded from persisted assistant metadata', async () => {
    const detail = await request(app)
      .get(`/api/v1/projects/PILOT/conversations/${createdConvId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const lastMsg = detail.body.data.messages.pop();
    assert.ok(lastMsg);
    // executedTools should only contain name, label, round
    for (const tool of lastMsg.executedTools) {
      assert.equal('result' in tool, false);
      assert.equal('args' in tool, false);
    }
  });

  // 21. Delete conversation
  await t.test('21. User can delete an existing conversation', async () => {
    const delRes = await request(app)
      .delete(`/api/v1/projects/PILOT/conversations/${createdConvId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(delRes.status, HTTP_STATUS.OK);

    const getRes = await request(app)
      .get(`/api/v1/projects/PILOT/conversations/${createdConvId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(getRes.status, HTTP_STATUS.NOT_FOUND);
  });

  // 22. Initial message on creation
  await t.test('22. Creating a conversation with initialMessage processes prompt and returns initial response', async () => {
    GeminiClient.setMock({
      generateContent: async () => ({
        text: 'Initial conversation answer.',
        functionCalls: [],
        candidateContent: null,
        model: 'gemini-3.6-flash'
      })
    });

    const res = await request(app)
      .post('/api/v1/projects/PILOT/conversations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ initialMessage: 'How is the project doing?' });

    assert.equal(res.status, HTTP_STATUS.CREATED);
    assert.ok(res.body.data.id);
    assert.ok(res.body.data.latestResponse);
    assert.ok(res.body.data.latestResponse.message.includes('Initial conversation answer'));
  });
});
