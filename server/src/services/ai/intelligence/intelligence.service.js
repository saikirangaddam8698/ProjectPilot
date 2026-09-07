/**
 * Task 15 & Task 20 — Intelligence Service
 * Synthesizes, extracts, validates, and correlates risk analysis objects from tool results and Gemini AI outputs.
 * Calculates deterministic confidence ratings and structures evidence summaries.
 */
import { RiskAnalyzer } from './riskAnalyzer.js';
import { EvidenceCorrelator } from './evidenceCorrelator.js';

const ANALYTICAL_KEYWORDS = [
  'risk', 'risks', 'blocker', 'blockers', 'sprint', 'health', 'delivery',
  'priority', 'compare', 'comparison', 'architecture', 'runbook', 'focus',
  'summary', 'impediment', 'delay', 'status', 'investigate'
];

export class IntelligenceService {
  /**
   * Determine if a user prompt is analytical
   * @param {string} prompt
   * @returns {boolean}
   */
  static isAnalyticalPrompt(prompt = '') {
    if (!prompt || typeof prompt !== 'string') return false;
    const lower = prompt.toLowerCase();

    // Ignore conversational greetings
    if (/^(hello|hi|hey|greetings|good morning|good afternoon)\b/i.test(lower.trim())) {
      return false;
    }

    return ANALYTICAL_KEYWORDS.some((kw) => lower.includes(kw));
  }

  /**
   * Extract, normalize, and ground risk analysis from Gemini response and tool execution evidence
   *
   * @param {object} params
   * @param {object} params.geminiResult - Gemini response object { text, model, usage }
   * @param {Array<object>} params.toolExecutions - Executed tool results
   * @param {string} params.projectKey - Active project key
   * @returns {object|null} Structured analysis payload or null
   */
  static extractAnalysis({ geminiResult, toolExecutions = [], projectKey = '' }) {
    // 1. If no tools executed, no analysis metadata (e.g. conversational greetings)
    if (!toolExecutions || toolExecutions.length === 0) {
      return null;
    }

    const text = geminiResult?.text || '';
    let rawAnalysis = null;

    // 2. Try parsing structured JSON block from Gemini output
    const jsonMatch = text.match(/ANALYSIS_BLOCK:\s*```(?:json)?\s*([\s\S]*?)\s*```/i) ||
                      text.match(/ANALYSIS_BLOCK:\s*(\{[\s\S]*?\})/i) ||
                      text.match(/```json\s*(\{\s*"type"[\s\S]*?\})\s*```/i);

    if (jsonMatch && jsonMatch[1]) {
      try {
        rawAnalysis = JSON.parse(jsonMatch[1].trim());
      } catch {
        rawAnalysis = null;
      }
    }

    // 3. Fallback: Synthesize deterministic analysis from executed tool evidence if Gemini omitted JSON block
    if (!rawAnalysis) {
      rawAnalysis = this.synthesizeAnalysisFromTools(toolExecutions, projectKey);
    }

    if (!rawAnalysis) {
      return null;
    }

    // 4. Normalize risk type, severity, confidence, findings, recommendations, and evidenceSummary
    const normalized = RiskAnalyzer.normalize(rawAnalysis);
    if (!normalized) {
      return null;
    }

    // 5. Calculate deterministic confidence if omitted or invalid
    const validEvidenceTokens = EvidenceCorrelator.extractValidEvidence(toolExecutions, projectKey);
    normalized.confidence = this.calculateConfidence(toolExecutions, validEvidenceTokens, normalized);

    // 6. Synthesize evidenceSummary if empty
    if (!normalized.evidenceSummary || normalized.evidenceSummary.length === 0) {
      normalized.evidenceSummary = this.buildEvidenceSummary(toolExecutions, validEvidenceTokens);
    }

    // 7. Ground findings & recommendations evidence against actual tool evidence
    const grounded = EvidenceCorrelator.groundAnalysis(normalized, validEvidenceTokens);

    return grounded;
  }

  /**
   * Calculate deterministic confidence rating without calling an LLM
   */
  static calculateConfidence(toolExecutions = [], validEvidenceTokens = new Set(), normalizedAnalysis = {}) {
    const successTools = toolExecutions.filter((t) => t.result && !t.error);
    const tokenCount = validEvidenceTokens.size;

    // High confidence: multiple tools executed successfully with 2+ verified evidence tokens
    if (successTools.length >= 2 && tokenCount >= 2) {
      return 'high';
    }
    // High confidence: 1 tool with high evidence volume (e.g. 3+ verified tokens)
    if (successTools.length >= 1 && tokenCount >= 3) {
      return 'high';
    }
    // Medium confidence: at least 1 successful tool result with evidence
    if (successTools.length >= 1 && tokenCount >= 1) {
      return 'medium';
    }
    // Low confidence: sparse evidence
    return 'low';
  }

  /**
   * Build structured evidenceSummary array from tool executions
   */
  static buildEvidenceSummary(toolExecutions = [], validEvidenceTokens = new Set()) {
    const summary = [];
    const seenRefs = new Set();

    for (const tool of toolExecutions) {
      const res = tool.result;
      if (!res) continue;

      if (tool.name === 'list_project_tickets' && Array.isArray(res.tickets)) {
        const blocked = res.tickets.filter((t) => (t.status || '').toLowerCase() === 'blocked' || t.isBlocked);
        for (const b of blocked) {
          if (b.key && !seenRefs.has(b.key)) {
            seenRefs.add(b.key);
            summary.push({
              sourceType: 'ticket',
              reference: b.key,
              description: `Blocked ticket (${b.title || 'Work item'})`
            });
          }
        }
      }

      if (tool.name === 'get_ticket_details' && res.ticket && res.ticket.key) {
        const key = res.ticket.key;
        if (!seenRefs.has(key)) {
          seenRefs.add(key);
          summary.push({
            sourceType: 'ticket',
            reference: key,
            description: `Ticket details for ${key} (${res.ticket.status || 'Active'})`
          });
        }
      }

      if (tool.name === 'get_sprint_progress' && res.sprint && res.sprint.name) {
        const name = res.sprint.name;
        if (!seenRefs.has(name)) {
          seenRefs.add(name);
          summary.push({
            sourceType: 'sprint',
            reference: name,
            description: `Sprint progress metrics (${res.metrics?.completionPercentage || 0}% complete)`
          });
        }
      }

      if (tool.name === 'search_project_knowledge' && Array.isArray(res.documentationResults)) {
        for (const doc of res.documentationResults) {
          if (doc.documentTitle && !seenRefs.has(doc.documentTitle)) {
            seenRefs.add(doc.documentTitle);
            summary.push({
              sourceType: 'knowledge',
              reference: doc.documentTitle,
              description: `Technical documentation (${doc.section || 'General Spec'})`
            });
          }
        }
      }

      if (tool.name === 'get_project_activity' && Array.isArray(res.activities)) {
        const ref = 'Recent Activity Audit Log';
        if (!seenRefs.has(ref)) {
          seenRefs.add(ref);
          summary.push({
            sourceType: 'activity',
            reference: ref,
            description: `${res.activities.length} recent audit log events`
          });
        }
      }
    }

    return summary;
  }

  /**
   * Deterministically construct analysis structure directly from tool execution results
   */
  static synthesizeAnalysisFromTools(toolExecutions, projectKey) {
    const executedToolNames = toolExecutions.map((t) => t.name);

    let type = 'project-health';
    let severity = 'low';
    const findings = [];
    const recommendations = [];

    for (const tool of toolExecutions) {
      const res = tool.result;
      if (!res) continue;

      // 1. Ticket list analysis (Blockers / Priority)
      if (tool.name === 'list_project_tickets' && Array.isArray(res.tickets)) {
        const blocked = res.tickets.filter((t) => (t.status || '').toLowerCase() === 'blocked' || t.isBlocked);
        const urgent = res.tickets.filter((t) => (t.priority || '').toLowerCase() === 'urgent' && t.status !== 'Done');

        if (blocked.length > 0) {
          type = 'blocker-risk';
          severity = blocked.length >= 2 ? 'high' : 'medium';
          const keys = blocked.map((t) => t.key).filter(Boolean);
          findings.push({
            text: `${blocked.length} ticket(s) are currently blocked and preventing velocity.`,
            evidence: keys
          });
          recommendations.push({
            text: `Triage and unblock ticket(s) ${keys.join(', ')} to resume sprint momentum.`,
            evidence: keys
          });
        }

        if (urgent.length > 0) {
          if (type === 'project-health') type = 'priority-risk';
          if (severity === 'low') severity = 'medium';
          const keys = urgent.map((t) => t.key).filter(Boolean);
          findings.push({
            text: `${urgent.length} urgent priority ticket(s) require immediate engineering attention.`,
            evidence: keys
          });
        }
      }

      // 2. Sprint progress analysis
      if (tool.name === 'get_sprint_progress' && res.sprint) {
        type = 'sprint-risk';
        const sprintName = res.sprint.name || 'Current Sprint';

        if (res.metrics) {
          const completionPct = res.metrics.completionPercentage || 0;
          if (completionPct < 40) {
            severity = 'high';
            findings.push({
              text: `Sprint "${sprintName}" completion is low at ${completionPct}%.`,
              evidence: [sprintName]
            });
            recommendations.push({
              text: `Review remaining story points for "${sprintName}" and consider scope adjustment.`,
              evidence: [sprintName]
            });
          } else {
            severity = 'low';
            findings.push({
              text: `Sprint "${sprintName}" is currently ${completionPct}% complete.`,
              evidence: [sprintName]
            });
          }
        }
      }

      // 3. Knowledge / Architecture comparison analysis
      if (tool.name === 'search_project_knowledge' && Array.isArray(res.documentationResults)) {
        if (executedToolNames.some((n) => n !== 'search_project_knowledge')) {
          type = 'architecture-comparison';
        }
        for (const doc of res.documentationResults) {
          if (doc.documentTitle) {
            findings.push({
              text: `Relevant architecture guidance found in "${doc.documentTitle}".`,
              evidence: [doc.documentTitle]
            });
          }
        }
      }

      // 4. Single ticket details
      if (tool.name === 'get_ticket_details' && res.ticket) {
        const t = res.ticket;
        if (t.status === 'Blocked' || t.priority === 'Urgent') {
          type = 'blocker-risk';
          severity = 'high';
          findings.push({
            text: `Ticket ${t.key} ("${t.title}") is marked ${t.status} with ${t.priority} priority.`,
            evidence: [t.key]
          });
          recommendations.push({
            text: `Assign a senior engineer to resolve dependencies for ${t.key}.`,
            evidence: [t.key]
          });
        }
      }
    }

    if (findings.length === 0 && recommendations.length === 0) {
      return null;
    }

    return {
      type,
      severity,
      confidence: 'medium',
      findings,
      recommendations
    };
  }
}
