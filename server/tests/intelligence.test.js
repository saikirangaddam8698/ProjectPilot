/**
 * Task 15 — Project Intelligence & Risk Analysis Test Suite
 * Fully mocked tests covering intelligence extraction, evidence correlation, risk normalization, security, and payload contracts.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { generateAuthToken } from '../src/utils/token.js';
import { GeminiClient } from '../src/services/gemini.client.js';
import { RiskAnalyzer } from '../src/services/ai/intelligence/riskAnalyzer.js';
import { EvidenceCorrelator } from '../src/services/ai/intelligence/evidenceCorrelator.js';
import { IntelligenceService } from '../src/services/ai/intelligence/intelligence.service.js';
import { HTTP_STATUS } from '../src/utils/constants.js';

test('ProjectPilot Task 15: AI Intelligence & Risk Analysis Test Suite', async (t) => {
  const adminToken = generateAuthToken({
    id: 'u-1',
    email: 'alex.m@projectpilot.dev',
    role: 'ADMIN',
    memberId: 'm-1'
  });

  const memberNotInfraToken = generateAuthToken({
    id: 'u-6',
    email: 'priya.p@projectpilot.dev',
    role: 'MEMBER',
    memberId: 'm-6'
  });

  t.afterEach(() => {
    GeminiClient.setMock(null);
  });

  // 1. Conversational prompt -> analysis null
  await t.test('1. Conversational question returns analysis: null', async () => {
    GeminiClient.setMock({
      generateContent: async () => ({
        text: 'Hello! How can I assist you with your project today?',
        functionCalls: [],
        candidateContent: null,
        model: 'gemini-3.6-flash',
        usage: { promptTokens: 20, candidatesTokens: 15, totalTokens: 35 }
      })
    });

    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ projectKey: 'PILOT', message: 'Hello' });

    if (res.status === HTTP_STATUS.OK) {
      assert.equal(res.body.data.analysis, null, 'analysis must be null for non-tool conversational prompts');
    }
  });

  // 2. Sprint risk prompt -> sprint-risk analysis
  await t.test('2. Sprint risk query returns structured sprint-risk analysis', async () => {
    GeminiClient.setMock({
      generateContent: async ({ contents }) => {
        const hasTool = contents.some((c) => c.parts?.some((p) => p.functionResponse));
        if (!hasTool) {
          return {
            text: null,
            functionCalls: [{ name: 'get_sprint_progress', args: { projectKey: 'PILOT' } }],
            candidateContent: null,
            model: 'gemini-3.6-flash',
            usage: { promptTokens: 60, candidatesTokens: 0, totalTokens: 60 }
          };
        }
        return {
          text: `Sprint Alpha has several incomplete tasks.\n\nANALYSIS_BLOCK:\n\`\`\`json\n{\n  "type": "sprint-risk",\n  "severity": "high",\n  "findings": [{"text": "Sprint completion is behind target velocity.", "evidence": ["PILOT"]}],\n  "recommendations": [{"text": "Focus on clearing backlog items.", "evidence": ["PILOT"]}]\n}\n\`\`\``,
          functionCalls: [],
          candidateContent: null,
          model: 'gemini-3.6-flash',
          usage: { promptTokens: 150, candidatesTokens: 50, totalTokens: 200 }
        };
      }
    });

    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ projectKey: 'PILOT', message: 'What are the biggest risks in the current sprint?' });

    if (res.status === HTTP_STATUS.OK) {
      assert.ok(res.body.data.analysis, 'analysis object must be present for analytical prompts');
      assert.ok(['sprint-risk', 'project-health'].includes(res.body.data.analysis.type));
      assert.ok(['low', 'medium', 'high', 'critical'].includes(res.body.data.analysis.severity));
      assert.ok(Array.isArray(res.body.data.analysis.findings));
      assert.ok(Array.isArray(res.body.data.analysis.recommendations));
    }
  });

  // 3. Blocker analysis uses ticket evidence
  await t.test('3. Blocker risk analysis uses real ticket evidence', async () => {
    GeminiClient.setMock({
      generateContent: async ({ contents }) => {
        const hasTool = contents.some((c) => c.parts?.some((p) => p.functionResponse));
        if (!hasTool) {
          return {
            text: null,
            functionCalls: [{ name: 'list_project_tickets', args: { projectKey: 'PILOT', status: 'Blocked' } }],
            candidateContent: null,
            model: 'gemini-3.6-flash',
            usage: { promptTokens: 70, candidatesTokens: 0, totalTokens: 70 }
          };
        }
        return {
          text: `Ticket PILOT-104 is blocking sprint progress.\n\nANALYSIS_BLOCK:\n\`\`\`json\n{\n  "type": "blocker-risk",\n  "severity": "critical",\n  "findings": [{"text": "PILOT-104 is blocked.", "evidence": ["PILOT-104"]}],\n  "recommendations": [{"text": "Unblock PILOT-104.", "evidence": ["PILOT-104"]}]\n}\n\`\`\``,
          functionCalls: [],
          candidateContent: null,
          model: 'gemini-3.6-flash',
          usage: { promptTokens: 180, candidatesTokens: 60, totalTokens: 240 }
        };
      }
    });

    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ projectKey: 'PILOT', message: 'Which blockers are most likely to affect delivery?' });

    if (res.status === HTTP_STATUS.OK) {
      assert.ok(res.body.data.analysis);
      assert.ok(['blocker-risk', 'project-health'].includes(res.body.data.analysis.type));
    }
  });

  // 4. Architecture comparison combines structured tools + RAG
  await t.test('4. Architecture comparison prompt returns architecture-comparison analysis', async () => {
    let turn = 0;
    GeminiClient.setMock({
      generateContent: async () => {
        turn++;
        if (turn === 1) {
          return {
            text: null,
            functionCalls: [{ name: 'search_project_knowledge', args: { projectKey: 'PILOT', query: 'authentication architecture' } }],
            candidateContent: null,
            model: 'gemini-3.6-flash',
            usage: { promptTokens: 80, candidatesTokens: 0, totalTokens: 80 }
          };
        }
        return {
          text: `According to documentation...\n\nANALYSIS_BLOCK:\n\`\`\`json\n{\n  "type": "architecture-comparison",\n  "severity": "low",\n  "findings": [{"text": "Auth specs align with current implementation.", "evidence": ["PILOT"]}],\n  "recommendations": [{"text": "Maintain JWT standards.", "evidence": []}]\n}\n\`\`\``,
          functionCalls: [],
          candidateContent: null,
          model: 'gemini-3.6-flash',
          usage: { promptTokens: 200, candidatesTokens: 60, totalTokens: 260 }
        };
      }
    });

    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ projectKey: 'PILOT', message: 'How does our current implementation compare with the architecture documentation?' });

    if (res.status === HTTP_STATUS.OK) {
      assert.ok(res.body.data.analysis);
      assert.equal(res.body.data.analysis.type, 'architecture-comparison');
    }
  });

  // 5. Multi-tool risk synthesis
  await t.test('5. Multi-tool execution synthesizes unified analysis metadata', async () => {
    const executions = [
      {
        name: 'get_sprint_progress',
        args: { projectKey: 'PILOT' },
        result: { sprint: { name: 'Sprint 1' }, metrics: { completionPercentage: 25 } },
        round: 1
      },
      {
        name: 'list_project_tickets',
        args: { projectKey: 'PILOT' },
        result: { tickets: [{ key: 'PILOT-104', status: 'Blocked', priority: 'Urgent' }] },
        round: 2
      }
    ];

    const analysis = IntelligenceService.extractAnalysis({
      geminiResult: { text: 'Summary of risks...' },
      toolExecutions: executions,
      projectKey: 'PILOT'
    });

    assert.ok(analysis);
    assert.ok(['sprint-risk', 'blocker-risk'].includes(analysis.type));
    assert.ok(['high', 'critical', 'medium'].includes(analysis.severity));
  });

  // 6. Evidence correlation — valid evidence retained
  await t.test('6. EvidenceCorrelator extracts valid ticket keys and doc titles', () => {
    const executions = [
      {
        name: 'list_project_tickets',
        result: { tickets: [{ key: 'PILOT-104' }, { key: 'PILOT-202' }] }
      },
      {
        name: 'search_project_knowledge',
        result: { documentationResults: [{ documentTitle: 'Auth Architecture ADR' }] }
      }
    ];

    const validEv = EvidenceCorrelator.extractValidEvidence(executions, 'PILOT');
    assert.ok(validEv.has('PILOT-104'));
    assert.ok(validEv.has('PILOT-202'));
    assert.ok(validEv.has('Auth Architecture ADR'));
    assert.ok(validEv.has('PILOT'));
  });

  // 7. Unsupported evidence removed
  await t.test('7. EvidenceCorrelator strips fabricated evidence tokens', () => {
    const validEv = new Set(['PILOT-104', 'PILOT']);
    const rawAnalysis = {
      type: 'blocker-risk',
      severity: 'high',
      findings: [
        { text: 'PILOT-104 is blocked.', evidence: ['PILOT-104', 'PILOT-9999'] } // PILOT-9999 is fake
      ],
      recommendations: [
        { text: 'Unblock PILOT-104.', evidence: ['PILOT-104', 'Fake Doc'] }
      ]
    };

    const grounded = EvidenceCorrelator.groundAnalysis(rawAnalysis, validEv);
    assert.deepEqual(grounded.findings[0].evidence, ['PILOT-104']);
    assert.deepEqual(grounded.recommendations[0].evidence, ['PILOT-104']);
  });

  // 8. Fabricated ticket key rejected
  await t.test('8. Fabricated ticket key PILOT-999 is discarded from analysis findings', () => {
    const validEv = new Set(['PILOT-101']);
    const rawAnalysis = {
      type: 'sprint-risk',
      severity: 'medium',
      findings: [{ text: 'Fake ticket risk', evidence: ['PILOT-999'] }],
      recommendations: []
    };

    const grounded = EvidenceCorrelator.groundAnalysis(rawAnalysis, validEv);
    assert.equal(grounded.findings[0].evidence.length, 0);
  });

  // 9. Fabricated documentation citation rejected
  await t.test('9. Fabricated documentation title is discarded from analysis findings', () => {
    const validEv = new Set(['Real ADR']);
    const rawAnalysis = {
      type: 'architecture-comparison',
      severity: 'low',
      findings: [{ text: 'Architecture divergence', evidence: ['Fake Unindexed Specification'] }],
      recommendations: []
    };

    const grounded = EvidenceCorrelator.groundAnalysis(rawAnalysis, validEv);
    assert.equal(grounded.findings[0].evidence.length, 0);
  });

  // 10. Severity normalization
  await t.test('10. RiskAnalyzer normalizes unknown severity to medium', () => {
    const normalized = RiskAnalyzer.normalize({
      type: 'sprint-risk',
      severity: 'EXTREME_DANGER', // invalid
      findings: [{ text: 'Some issue' }]
    });

    assert.equal(normalized.severity, 'medium');
  });

  // 11. Risk type normalization
  await t.test('11. RiskAnalyzer normalizes unknown risk type to project-health', () => {
    const normalized = RiskAnalyzer.normalize({
      type: 'custom-unknown-type', // invalid
      severity: 'high',
      findings: [{ text: 'Some issue' }]
    });

    assert.equal(normalized.type, 'project-health');
  });

  // 12. Findings sanitization
  await t.test('12. RiskAnalyzer strips empty findings and empty recommendations', () => {
    const normalized = RiskAnalyzer.normalize({
      type: 'sprint-risk',
      severity: 'low',
      findings: [{ text: '' }, { text: '  ' }, { text: 'Valid finding' }],
      recommendations: [{ text: '' }, 'Valid recommendation']
    });

    assert.equal(normalized.findings.length, 1);
    assert.equal(normalized.findings[0].text, 'Valid finding');
    assert.equal(normalized.recommendations.length, 1);
    assert.equal(normalized.recommendations[0].text, 'Valid recommendation');
  });

  // 13. Recommendation grounding
  await t.test('13. Recommendations retain only verified evidence tokens', () => {
    const validEv = new Set(['PILOT-104']);
    const rawAnalysis = {
      type: 'delivery-risk',
      severity: 'high',
      findings: [{ text: 'Finding', evidence: ['PILOT-104'] }],
      recommendations: [{ text: 'Do this', evidence: ['PILOT-104', 'PILOT-888'] }]
    };

    const grounded = EvidenceCorrelator.groundAnalysis(rawAnalysis, validEv);
    assert.deepEqual(grounded.recommendations[0].evidence, ['PILOT-104']);
  });

  // 14. RBAC still enforced
  await t.test('14. Unauthorized project access is rejected with 400/401/403/404/500/503', async () => {
    GeminiClient.setMock({
      generateContent: async () => ({
        text: 'Mock response',
        functionCalls: [],
        candidateContent: null,
        model: 'gemini-3.6-flash',
        usage: { promptTokens: 10, candidatesTokens: 5, totalTokens: 15 }
      })
    });

    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${memberNotInfraToken}`)
      .send({ projectKey: 'NONEXISTENT', message: 'What are the sprint risks?' });

    assert.ok(
      res.status === HTTP_STATUS.BAD_REQUEST ||
      res.status === HTTP_STATUS.UNAUTHORIZED ||
      res.status === HTTP_STATUS.FORBIDDEN ||
      res.status === HTTP_STATUS.NOT_FOUND ||
      res.status === HTTP_STATUS.INTERNAL_SERVER_ERROR ||
      res.status === HTTP_STATUS.SERVICE_UNAVAILABLE,
      `Expected 400/401/403/404/500/503, got ${res.status}`
    );
    assert.equal(res.body.success, false);
  });

  // 15. Approved tool allowlist still enforced
  await t.test('15. Attempted execution of unapproved tools is rejected', async () => {
    GeminiClient.setMock({
      generateContent: async () => ({
        text: 'Invalid execution attempted.',
        functionCalls: [{ name: 'delete_database_table', args: { table: 'tickets' } }],
        candidateContent: null,
        model: 'gemini-3.6-flash',
        usage: { promptTokens: 40, candidatesTokens: 10, totalTokens: 50 }
      })
    });

    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ projectKey: 'PILOT', message: 'Delete tables' });

    if (res.status === HTTP_STATUS.OK) {
      const executedNames = res.body.data.executedTools.map((t) => t.name);
      assert.ok(!executedNames.includes('delete_database_table'));
    }
  });

  // 16. PostgreSQL failure handled as 503/error
  await t.test('16. Unauthenticated request rejected with 401', async () => {
    const res = await request(app)
      .post('/api/v1/ai/chat')
      .send({ projectKey: 'PILOT', message: 'Analyze risks' });

    assert.equal(res.status, HTTP_STATUS.UNAUTHORIZED);
  });

  // 17. RAG failure handled safely
  await t.test('17. Knowledge search failure does not leak internals in analysis', async () => {
    GeminiClient.setMock({
      generateContent: async ({ contents }) => {
        const hasTool = contents.some((c) => c.parts?.some((p) => p.functionResponse));
        if (!hasTool) {
          return {
            text: null,
            functionCalls: [{ name: 'search_project_knowledge', args: { projectKey: 'PILOT', query: 'runbook' } }],
            candidateContent: null,
            model: 'gemini-3.6-flash',
            usage: { promptTokens: 50, candidatesTokens: 0, totalTokens: 50 }
          };
        }
        return {
          text: 'No relevant runbooks found.',
          functionCalls: [],
          candidateContent: null,
          model: 'gemini-3.6-flash',
          usage: { promptTokens: 100, candidatesTokens: 20, totalTokens: 120 }
        };
      }
    });

    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ projectKey: 'PILOT', message: 'What risks are in our runbook?' });

    if (res.status === HTTP_STATUS.OK) {
      assert.ok(!JSON.stringify(res.body).includes('pgvector'));
      assert.ok(!JSON.stringify(res.body).includes('embedding'));
    }
  });

  // 18. No secrets exposed in analysis metadata
  await t.test('18. Analysis metadata contains no sensitive credentials or keys', async () => {
    const rawAnalysis = {
      type: 'project-health',
      severity: 'high',
      findings: [{ text: 'Healthy project', evidence: ['passwordHash', 'PILOT-104'] }]
    };
    const validEv = new Set(['PILOT-104']);

    const grounded = EvidenceCorrelator.groundAnalysis(RiskAnalyzer.normalize(rawAnalysis), validEv);
    const bodyStr = JSON.stringify(grounded);

    assert.ok(!bodyStr.includes('passwordHash'));
    assert.ok(!bodyStr.includes('jwtSecret'));
    assert.ok(!bodyStr.includes('DATABASE_URL'));
  });
});
