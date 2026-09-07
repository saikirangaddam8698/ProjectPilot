/**
 * Task 16 & Task 20 — Deterministic AI Evaluator
 * Pure rule-based evaluator that verifies response validity, tool approval, source grounding,
 * confidence levels, evidence summaries, and secret safety WITHOUT invoking any LLM API.
 */
import { APPROVED_AI_TOOLS } from '../tool.registry.js';
import { ALLOWED_CONFIDENCES } from '../intelligence/riskAnalyzer.js';

const SENSITIVE_PATTERNS = [
  /postgres(?:ql)?:\/\/[^\s]+/i,
  /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/, // JWT pattern
  /AIzaSy[A-Za-z0-9-_]{33}/, // Gemini API Key pattern
  /passwordHash/i,
  /DATABASE_URL/i,
  /JWT_SECRET/i
];

export class AiEvaluator {
  /**
   * Deterministically evaluate an AI response payload
   *
   * @param {object} params
   * @param {string} params.message - Conversational message text
   * @param {Array<object>} params.executedTools - Array of executed tool objects
   * @param {Array<object>} params.sources - Structured sources [{ title, similarity }]
   * @param {object|null} params.analysis - Optional risk analysis object
   * @returns {object} Evaluation report: { valid, grounded, checks, violations }
   */
  static evaluate({ message = '', executedTools = [], sources = [], analysis = null }) {
    const checks = {
      responseValid: false,
      toolsApproved: false,
      sourcesGrounded: false,
      analysisGrounded: false,
      confidenceValid: false,
      evidenceSummaryValid: false,
      secretsSafe: false
    };
    const violations = [];

    // 1. Response validity check
    if (typeof message === 'string' && message.trim().length > 0) {
      checks.responseValid = true;
    } else {
      violations.push('Response message is empty or invalid.');
    }

    // 2. Approved tools check
    const unapproved = (executedTools || []).filter(
      (t) => !APPROVED_AI_TOOLS.includes(t.name)
    );
    if (unapproved.length === 0) {
      checks.toolsApproved = true;
    } else {
      violations.push(`Unapproved tool(s) detected: ${unapproved.map((t) => t.name).join(', ')}.`);
    }

    // 3. Sources grounding check
    const invalidSources = (sources || []).filter((s) => !s || !s.title || typeof s.title !== 'string');
    if (invalidSources.length === 0) {
      checks.sourcesGrounded = true;
    } else {
      violations.push('Response contains invalid or malformed citation sources.');
    }

    // 4. Analysis & Confidence & Evidence Summary check
    if (!analysis) {
      checks.analysisGrounded = true;
      checks.confidenceValid = true;
      checks.evidenceSummaryValid = true;
    } else {
      let analysisValid = true;
      const findings = Array.isArray(analysis.findings) ? analysis.findings : [];
      const recs = Array.isArray(analysis.recommendations) ? analysis.recommendations : [];

      for (const f of findings) {
        if (!f.text || typeof f.text !== 'string') analysisValid = false;
      }
      for (const r of recs) {
        if (!r.text || typeof r.text !== 'string') analysisValid = false;
      }

      if (analysisValid) {
        checks.analysisGrounded = true;
      } else {
        violations.push('Analysis contains invalid finding or recommendation structures.');
      }

      // Confidence check
      if (analysis.confidence && ALLOWED_CONFIDENCES.has(String(analysis.confidence).toLowerCase())) {
        checks.confidenceValid = true;
      } else {
        violations.push(`Invalid analysis confidence rating: "${analysis.confidence}".`);
      }

      // Evidence summary check
      const evSummary = Array.isArray(analysis.evidenceSummary) ? analysis.evidenceSummary : [];
      const invalidSummaryItems = evSummary.filter((e) => !e || !e.reference || typeof e.reference !== 'string');
      if (invalidSummaryItems.length === 0) {
        checks.evidenceSummaryValid = true;
      } else {
        violations.push('Analysis contains invalid evidenceSummary items.');
      }
    }

    // 5. Secret safety check
    const payloadStr = JSON.stringify({ message, executedTools, sources, analysis });
    let secretFound = false;

    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(payloadStr)) {
        secretFound = true;
        violations.push(`Security check failed: response payload matches secret pattern ${pattern.source}`);
      }
    }

    if (!secretFound) {
      checks.secretsSafe = true;
    }

    const valid = checks.responseValid && checks.toolsApproved && checks.secretsSafe && checks.confidenceValid && checks.evidenceSummaryValid;
    const grounded = checks.sourcesGrounded && checks.analysisGrounded;

    return {
      valid,
      grounded,
      checks,
      violations
    };
  }
}
