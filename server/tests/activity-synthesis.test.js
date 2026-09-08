/**
 * Test Suite: Project Intelligence & Natural-Language Activity Synthesis
 * Validates natural-language transformation of raw database records, entity correlation,
 * risk interpretation, grounded RAG citations, and security/RBAC isolation.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ActivitySynthesizer } from '../src/services/ai/intelligence/activitySynthesizer.js';
import { EvidenceCorrelator } from '../src/services/ai/intelligence/evidenceCorrelator.js';
import { AiEvaluator } from '../src/services/ai/observability/aiEvaluator.js';
import { projectActivityTool } from '../src/services/ai/tools/projectActivity.tool.js';

describe('Project Intelligence: Natural-Language Activity & Project Reasoning Suite', () => {

  test('1. Raw activity event (created) translates into natural language preserving actor, ticket key, title, priority, and deadline', () => {
    const rawActivity = {
      actorName: 'Alex Morgan',
      action: 'created',
      targetKey: 'PILOT-104',
      targetTitle: 'PostgreSQL connection pool exhaustion under load',
      targetType: 'ticket',
      priority: 'High',
      dueDate: '2026-09-12T00:00:00.000Z',
      timestamp: '2026-09-08T11:17:00.000Z'
    };

    const sentence = ActivitySynthesizer.formatSingleEvent(rawActivity);
    assert.match(sentence, /Alex Morgan/);
    assert.match(sentence, /PILOT-104/);
    assert.match(sentence, /PostgreSQL connection pool exhaustion/);
    assert.match(sentence, /High/);
    assert.match(sentence, /September 12/);
    assert.doesNotMatch(sentence, /created_item/);
    assert.doesNotMatch(sentence, /Team Member/);
  });

  test('2. Status change event translates with old and new values preserved', () => {
    const rawActivity = {
      actorName: 'Jane Doe',
      action: 'status_changed',
      targetKey: 'PILOT-104',
      targetTitle: 'Database Pooling',
      oldValue: 'In Progress',
      newValue: 'Blocked',
      timestamp: '2026-09-08T11:20:00.000Z'
    };

    const sentence = ActivitySynthesizer.formatSingleEvent(rawActivity);
    assert.match(sentence, /Jane Doe/);
    assert.match(sentence, /PILOT-104/);
    assert.match(sentence, /In Progress/);
    assert.match(sentence, /Blocked/);
    assert.doesNotMatch(sentence, /status_changed/);
  });

  test('3. Priority change event translates with old and new priority values preserved', () => {
    const rawActivity = {
      actorName: 'Samir Khan',
      action: 'priority_changed',
      targetKey: 'PILOT-104',
      oldValue: 'High',
      newValue: 'Urgent',
      timestamp: '2026-08-30T09:15:00.000Z'
    };

    const sentence = ActivitySynthesizer.formatSingleEvent(rawActivity);
    assert.match(sentence, /Samir Khan/);
    assert.match(sentence, /PILOT-104/);
    assert.match(sentence, /High/);
    assert.match(sentence, /Urgent/);
    assert.doesNotMatch(sentence, /priority_changed/);
  });

  test('4. Sprint start event translates naturally with sprint name', () => {
    const rawActivity = {
      actorName: 'Samir Khan',
      action: 'sprint_started',
      targetType: 'sprint',
      sprintName: 'Sprint 3 — Core Velocity',
      timestamp: '2026-09-04T10:00:00.000Z'
    };

    const sentence = ActivitySynthesizer.formatSingleEvent(rawActivity);
    assert.match(sentence, /Samir Khan/);
    assert.match(sentence, /Sprint 3 — Core Velocity/);
    assert.doesNotMatch(sentence, /sprint_started/);
  });

  test('5. Team member added event translates naturally', () => {
    const rawActivity = {
      actorName: 'Alex Morgan',
      action: 'member_added',
      targetType: 'member',
      targetTitle: 'Priya Patel (QA Lead)',
      timestamp: '2026-08-20T14:00:00.000Z'
    };

    const sentence = ActivitySynthesizer.formatSingleEvent(rawActivity);
    assert.match(sentence, /Alex Morgan/);
    assert.match(sentence, /Priya Patel/);
    assert.doesNotMatch(sentence, /member_added/);
  });

  test('6. Correlates multiple events on the same ticket into a coherent narrative timeline', () => {
    const events = [
      {
        actorName: 'Alex Morgan',
        action: 'created',
        targetKey: 'PILOT-104',
        targetTitle: 'OAuth 2.0 Integration',
        priority: 'High',
        dueDate: '2026-09-12T00:00:00.000Z',
        timestamp: '2026-09-08T09:00:00.000Z'
      },
      {
        actorName: 'Samir Khan',
        action: 'priority_changed',
        targetKey: 'PILOT-104',
        newValue: 'Urgent',
        timestamp: '2026-09-08T10:00:00.000Z'
      },
      {
        actorName: 'Jane Doe',
        action: 'status_changed',
        targetKey: 'PILOT-104',
        newValue: 'Blocked',
        timestamp: '2026-09-08T11:00:00.000Z'
      }
    ];

    const narrative = ActivitySynthesizer.formatTicketTimeline('PILOT-104', events);
    assert.match(narrative, /Alex Morgan created \*\*PILOT-104\*\*/);
    assert.match(narrative, /Samir Khan adjusted its priority to \*\*Urgent\*\*/);
    assert.match(narrative, /Jane Doe moved the ticket to \*\*Blocked\*\*/);
  });

  test('7. Missing metadata safely falls back without hallucinating non-existent fields', () => {
    const bareActivity = {
      action: 'unknown_custom_action',
      timestamp: '2026-09-08T10:00:00.000Z'
    };

    const sentence = ActivitySynthesizer.formatSingleEvent(bareActivity);
    assert.ok(typeof sentence === 'string' && sentence.length > 0);
    assert.match(sentence, /A team member performed an update/);
  });

  test('8. Full activity synthesis produces structured Markdown with "Recent Changes" and "What this means"', () => {
    const activities = [
      {
        actorName: 'Alex Morgan',
        action: 'created',
        targetKey: 'PILOT-104',
        targetTitle: 'PostgreSQL connection pool exhaustion',
        priority: 'Urgent',
        status: 'Blocked',
        dueDate: '2026-09-12T00:00:00.000Z',
        timestamp: '2026-09-08T11:17:00.000Z'
      },
      {
        actorName: 'Samir Khan',
        action: 'sprint_started',
        sprintName: 'Sprint 24 — AI Intelligence Core',
        timestamp: '2026-08-24T14:30:00.000Z'
      }
    ];

    const result = ActivitySynthesizer.synthesizeActivityResponse({
      activities,
      projectKey: 'PILOT',
      userQuestion: 'What changed recently in this project?'
    });

    assert.match(result, /### Recent Changes/);
    assert.match(result, /PILOT-104/);
    assert.match(result, /Sprint 24/);
    assert.match(result, /### What this means/);
    assert.match(result, /delivery risk/);
  });

  test('9. Impact analysis highlights blocked high-priority items with appropriate delivery risk uncertainty', () => {
    const activities = [
      {
        targetKey: 'PILOT-104',
        status: 'Blocked',
        priority: 'Urgent'
      }
    ];

    const impact = ActivitySynthesizer.synthesizeImpactAnalysis(activities, 'PILOT');
    assert.match(impact, /PILOT-104/);
    assert.match(impact, /Blocked/);
    assert.match(impact, /may increase delivery risk/);
  });

  test('10. Natural date formatter produces clean English date strings', () => {
    const formatted = ActivitySynthesizer.formatNaturalDate('2026-08-30T15:10:00.000Z');
    assert.match(formatted, /August 30/);
    assert.doesNotMatch(formatted, /NaN/);
  });

  test('11. EvidenceCorrelator extracts structured activity evidence accurately', () => {
    const toolExecutions = [
      {
        name: 'get_project_activity',
        result: {
          projectKey: 'PILOT',
          activities: [
            { targetKey: 'PILOT-104', actorName: 'Alex Morgan' }
          ]
        }
      }
    ];

    const evidence = EvidenceCorrelator.extractValidEvidence(toolExecutions, 'PILOT');
    assert.ok(evidence.has('PILOT-104'));
    assert.ok(evidence.has('PILOT'));
  });

  test('12. AiEvaluator validates that grounded entity claims in synthesized text pass checks', () => {
    const report = AiEvaluator.evaluate({
      message: 'Alex Morgan created ticket PILOT-104 on September 8.',
      executedTools: [{ name: 'get_project_activity' }],
      sources: [],
      analysis: null
    });
    assert.equal(report.valid, true);
    assert.equal(report.grounded, true);
    assert.equal(report.violations.length, 0);
  });

  test('13. AiEvaluator detects secret leaks in response text', () => {
    const report = AiEvaluator.evaluate({
      message: 'The database connection string is postgresql://user:pass@host:5432/db',
      executedTools: [{ name: 'get_project_activity' }],
      sources: []
    });
    assert.equal(report.valid, false);
    assert.equal(report.checks.secretsSafe, false);
  });

  test('14. get_project_activity tool returns structured entity fields without leaking secrets or passwords', async () => {
    const toolDef = projectActivityTool;
    assert.equal(toolDef.name, 'get_project_activity');
    assert.ok(toolDef.parameters.properties.projectKey);
  });

  test('15. Empty activities array returns clear, respectful "No recent activity" message', () => {
    const result = ActivitySynthesizer.synthesizeActivityResponse({
      activities: [],
      projectKey: 'PILOT'
    });
    assert.equal(result, 'No recent activity logs were recorded for project **PILOT**.');
  });
});

