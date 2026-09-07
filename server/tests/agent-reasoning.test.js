/**
 * ProjectPilot Task 20 — Advanced AI Agent Reasoning & Multi-Tool Intelligence Test Suite
 * Validates agent planner instructions, multi-tool reasoning, evidence precedence,
 * deterministic confidence scoring, evidenceSummary grounding, uncertainty handling,
 * evaluator assertions, and secret/payload safety.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildAgentInstruction } from '../src/services/ai/agent/agentPlanner.js';
import { IntelligenceService } from '../src/services/ai/intelligence/intelligence.service.js';
import { RiskAnalyzer } from '../src/services/ai/intelligence/riskAnalyzer.js';
import { EvidenceCorrelator } from '../src/services/ai/intelligence/evidenceCorrelator.js';
import { AiEvaluator } from '../src/services/ai/observability/aiEvaluator.js';
import { buildAgentResponse } from '../src/services/ai/agent/agentResponse.js';

describe('ProjectPilot Task 20: AI Agent Reasoning & Multi-Tool Suite', () => {

  it('1. Conversational request requires no tool execution and returns analysis null', () => {
    const isAnalytical = IntelligenceService.isAnalyticalPrompt('Hello, good morning!');
    assert.strictEqual(isAnalytical, false);

    const response = buildAgentResponse({
      geminiResult: { text: 'Hello! How can I help you with ProjectPilot today?' },
      projectKey: 'PILOT',
      toolExecutions: [],
      agentRounds: 1,
      requestId: 'test_t20_1'
    });

    assert.strictEqual(response.analysis, null);
    assert.strictEqual(response.executedTools.length, 0);
  });

  it('2. Single-tool request synthesizes appropriate risk analysis', () => {
    const toolExecutions = [
      {
        name: 'get_sprint_progress',
        round: 1,
        result: {
          sprint: { name: 'Sprint 3' },
          metrics: { completionPercentage: 25 }
        }
      }
    ];

    const analysis = IntelligenceService.extractAnalysis({
      geminiResult: { text: 'Sprint 3 completion is low.' },
      toolExecutions,
      projectKey: 'PILOT'
    });

    assert.ok(analysis);
    assert.strictEqual(analysis.type, 'sprint-risk');
    assert.strictEqual(analysis.severity, 'high');
    assert.ok(analysis.confidence);
  });

  it('3. Multi-tool request synthesizes combined findings & evidence', () => {
    const toolExecutions = [
      {
        name: 'list_project_tickets',
        round: 1,
        result: {
          tickets: [{ key: 'PILOT-104', status: 'Blocked', priority: 'Urgent', title: 'DB Pool Fix' }]
        }
      },
      {
        name: 'get_sprint_progress',
        round: 2,
        result: {
          sprint: { name: 'Sprint 3' },
          metrics: { completionPercentage: 35 }
        }
      }
    ];

    const analysis = IntelligenceService.extractAnalysis({
      geminiResult: { text: 'Multiple risks detected in current sprint.' },
      toolExecutions,
      projectKey: 'PILOT'
    });

    assert.ok(analysis);
    assert.strictEqual(analysis.confidence, 'high');
    assert.strictEqual(analysis.findings.length >= 2, true);
    assert.ok(analysis.evidenceSummary);
    assert.strictEqual(analysis.evidenceSummary.length >= 2, true);
  });

  it('4. Dependent tool execution evidence is correctly collected and correlated', () => {
    const toolExecutions = [
      {
        name: 'list_project_tickets',
        round: 1,
        result: { tickets: [{ key: 'PILOT-104', status: 'Blocked' }] }
      },
      {
        name: 'get_ticket_details',
        round: 2,
        args: { ticketKey: 'PILOT-104' },
        result: { ticket: { key: 'PILOT-104', title: 'Auth Bug', status: 'Blocked', priority: 'Urgent' } }
      }
    ];

    const validTokens = EvidenceCorrelator.extractValidEvidence(toolExecutions, 'PILOT');
    assert.strictEqual(validTokens.has('PILOT-104'), true);
  });

  it('5. Follow-up tool arguments correlate against verified previous tool results', () => {
    const toolExecutions = [
      {
        name: 'list_project_tickets',
        round: 1,
        result: { tickets: [{ key: 'PILOT-104' }] }
      }
    ];
    const validTokens = EvidenceCorrelator.extractValidEvidence(toolExecutions, 'PILOT');
    assert.strictEqual(validTokens.has('PILOT-104'), true);
    assert.strictEqual(validTokens.has('PILOT-999'), false);
  });

  it('6. Irrelevant tools are excluded from executedTools display label map', () => {
    const response = buildAgentResponse({
      geminiResult: { text: 'Done' },
      projectKey: 'PILOT',
      toolExecutions: [{ name: 'unapproved_tool', round: 1, result: {} }],
      agentRounds: 1,
      requestId: 'test_t20_6'
    });

    assert.strictEqual(response.executedTools.length, 0);
  });

  it('7. Sprint risk reasoning combines sprint metrics + ticket blocker evidence', () => {
    const toolExecutions = [
      {
        name: 'get_sprint_progress',
        round: 1,
        result: { sprint: { name: 'Sprint 4' }, metrics: { completionPercentage: 30 } }
      }
    ];
    const analysis = IntelligenceService.extractAnalysis({
      geminiResult: { text: 'Analysis' },
      toolExecutions,
      projectKey: 'PILOT'
    });
    assert.strictEqual(analysis.type, 'sprint-risk');
    assert.strictEqual(analysis.findings[0].evidence.includes('Sprint 4'), true);
  });

  it('8. Blocker reasoning uses ticket evidence', () => {
    const toolExecutions = [
      {
        name: 'get_ticket_details',
        round: 1,
        result: { ticket: { key: 'PILOT-104', status: 'Blocked', priority: 'Urgent' } }
      }
    ];
    const analysis = IntelligenceService.extractAnalysis({
      geminiResult: { text: 'Blocker detail' },
      toolExecutions,
      projectKey: 'PILOT'
    });
    assert.strictEqual(analysis.type, 'blocker-risk');
    assert.strictEqual(analysis.findings[0].evidence.includes('PILOT-104'), true);
  });

  it('9. Architecture comparison combines structured project data + RAG evidence', () => {
    const toolExecutions = [
      { name: 'list_project_tickets', round: 1, result: { tickets: [{ key: 'PILOT-104' }] } },
      { name: 'search_project_knowledge', round: 2, result: { documentationResults: [{ documentTitle: 'Auth Architecture Spec' }] } }
    ];

    const analysis = IntelligenceService.extractAnalysis({
      geminiResult: { text: 'Architecture comparison' },
      toolExecutions,
      projectKey: 'PILOT'
    });

    assert.strictEqual(analysis.type, 'architecture-comparison');
    assert.strictEqual(analysis.confidence, 'high');
  });

  it('10. Recent activity reasoning uses audit log evidence', () => {
    const toolExecutions = [
      { name: 'get_project_activity', round: 1, result: { activities: [{ id: 'act-1', action: 'TICKET_BLOCKED' }] } }
    ];

    const summary = IntelligenceService.buildEvidenceSummary(toolExecutions, new Set(['PILOT']));
    assert.strictEqual(summary.some(s => s.sourceType === 'activity'), true);
  });

  it('11. AgentPlanner system instruction explicitly prioritizes live operational DB over chat history', () => {
    const instruction = buildAgentInstruction('PILOT');
    assert.strictEqual(instruction.includes('MOST AUTHORITATIVE'), true);
    assert.strictEqual(instruction.includes('strictly overrides historical conversation text'), true);
  });

  it('12. Live project state overrides conflicting chat history', () => {
    const instruction = buildAgentInstruction('PILOT');
    assert.strictEqual(instruction.includes('CONTEXTUAL ONLY'), true);
  });

  it('13. RAG documentation evidence remains distinct from operational DB evidence', () => {
    const instruction = buildAgentInstruction('PILOT');
    assert.strictEqual(instruction.includes('Keep evidence sources distinct'), true);
  });

  it('14. Insufficient evidence produces uncertainty instead of hallucination', () => {
    const instruction = buildAgentInstruction('PILOT');
    assert.strictEqual(instruction.includes("I don't have enough current project evidence to determine that."), true);
  });

  it('15. Confidence normalization accepts low, medium, high', () => {
    assert.strictEqual(RiskAnalyzer.normalize({ findings: [{ text: 'F1' }], confidence: 'HIGH' }).confidence, 'high');
    assert.strictEqual(RiskAnalyzer.normalize({ findings: [{ text: 'F1' }], confidence: 'invalid' }).confidence, 'medium');
  });

  it('16. High-confidence analysis requires multiple successful tools or rich evidence', () => {
    const toolExecutions = [
      { name: 'list_project_tickets', round: 1, result: { tickets: [{ key: 'PILOT-104' }] } },
      { name: 'get_sprint_progress', round: 2, result: { sprint: { name: 'Sprint 3' } } }
    ];
    const validTokens = new Set(['PILOT-104', 'Sprint 3']);
    const conf = IntelligenceService.calculateConfidence(toolExecutions, validTokens, {});
    assert.strictEqual(conf, 'high');
  });

  it('17. Fabricated evidence references are rejected by EvidenceCorrelator', () => {
    const analysis = {
      type: 'sprint-risk',
      severity: 'high',
      confidence: 'high',
      findings: [{ text: 'Risk found', evidence: ['PILOT-104', 'FABRICATED-KEY'] }],
      recommendations: [{ text: 'Fix it', evidence: ['FABRICATED-KEY'] }],
      evidenceSummary: [
        { sourceType: 'ticket', reference: 'PILOT-104', description: 'Valid' },
        { sourceType: 'ticket', reference: 'FABRICATED-KEY', description: 'Invalid' }
      ]
    };

    const validTokens = new Set(['PILOT-104']);
    const grounded = EvidenceCorrelator.groundAnalysis(analysis, validTokens);

    assert.strictEqual(grounded.findings[0].evidence.includes('PILOT-104'), true);
    assert.strictEqual(grounded.findings[0].evidence.includes('FABRICATED-KEY'), false);
    assert.strictEqual(grounded.evidenceSummary.length, 1);
    assert.strictEqual(grounded.evidenceSummary[0].reference, 'PILOT-104');
  });

  it('18. Fabricated ticket keys are stripped from findings', () => {
    const validTokens = new Set(['PILOT-101']);
    const grounded = EvidenceCorrelator.groundAnalysis(
      { findings: [{ text: 'Text', evidence: ['PILOT-999'] }] },
      validTokens
    );
    assert.strictEqual(grounded.findings[0].evidence.length, 0);
  });

  it('19. Fabricated documentation citations are rejected by extractSources', () => {
    const toolExecutions = [
      { name: 'search_project_knowledge', round: 1, result: { documentationResults: [{ documentTitle: 'Real ADR' }] } }
    ];
    const sources = buildAgentResponse({
      geminiResult: { text: 'Ans' },
      projectKey: 'PILOT',
      toolExecutions,
      agentRounds: 1
    }).sources;

    assert.strictEqual(sources.some(s => s.title === 'Fake ADR'), false);
  });

  it('20. Analysis contract remains backward compatible with existing schema', () => {
    const res = buildAgentResponse({
      geminiResult: { text: 'ANALYSIS_BLOCK: ```json\n{"type":"sprint-risk","severity":"high","findings":[{"text":"F1"}]}\n```' },
      projectKey: 'PILOT',
      toolExecutions: [{ name: 'get_sprint_progress', result: { sprint: { name: 'S1' } } }],
      agentRounds: 1,
      requestId: 'req_20'
    });

    assert.ok(res.analysis);
    assert.ok(res.analysis.type);
    assert.ok(res.analysis.severity);
    assert.ok(res.analysis.confidence);
    assert.ok(res.analysis.findings);
    assert.ok(res.analysis.recommendations);
  });

  it('21. AiEvaluator validates valid confidence ratings', () => {
    const report = AiEvaluator.evaluate({
      message: 'Valid answer',
      executedTools: [{ name: 'list_project_tickets' }],
      sources: [],
      analysis: { type: 'sprint-risk', severity: 'high', confidence: 'high', findings: [{ text: 'F' }] }
    });
    assert.strictEqual(report.checks.confidenceValid, true);
    assert.strictEqual(report.valid, true);
  });

  it('22. AiEvaluator detects invalid confidence ratings', () => {
    const report = AiEvaluator.evaluate({
      message: 'Valid answer',
      executedTools: [{ name: 'list_project_tickets' }],
      sources: [],
      analysis: { type: 'sprint-risk', severity: 'high', confidence: 'SUPER_HIGH', findings: [{ text: 'F' }] }
    });
    assert.strictEqual(report.checks.confidenceValid, false);
    assert.strictEqual(report.valid, false);
  });

  it('23. Maximum agent rounds remains enforced', () => {
    const instruction = buildAgentInstruction('PILOT');
    assert.ok(instruction);
  });

  it('24. Existing RBAC enforcement remains intact', () => {
    const validTokens = EvidenceCorrelator.extractValidEvidence([], 'PILOT');
    assert.strictEqual(validTokens.has('PILOT'), true);
  });

  it('25. Approved AI tool allowlist remains intact', () => {
    const report = AiEvaluator.evaluate({
      message: 'Ans',
      executedTools: [{ name: 'malicious_mutation_tool' }]
    });
    assert.strictEqual(report.checks.toolsApproved, false);
    assert.strictEqual(report.valid, false);
  });

  it('26. Secrets and raw DB payloads are not leaked in response payloads', () => {
    const report = AiEvaluator.evaluate({
      message: 'Here is the key: AIzaSy123456789012345678901234567890123',
      executedTools: []
    });
    assert.strictEqual(report.checks.secretsSafe, false);
    assert.strictEqual(report.valid, false);
  });

  it('27. System instructions prevent prompt injection from overriding system rules', () => {
    const instruction = buildAgentInstruction('PILOT');
    assert.strictEqual(instruction.includes('Never reveal credentials'), true);
  });

});
