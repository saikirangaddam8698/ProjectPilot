/**
 * Task 15 & Task 20 — Risk Analyzer
 * Normalizes risk types, severity levels, confidence ratings, findings, recommendations, and evidence summaries.
 */

export const ALLOWED_RISK_TYPES = new Set([
  'sprint-risk',
  'blocker-risk',
  'delivery-risk',
  'priority-risk',
  'project-health',
  'architecture-comparison'
]);

export const ALLOWED_SEVERITIES = new Set([
  'low',
  'medium',
  'high',
  'critical'
]);

export const ALLOWED_CONFIDENCES = new Set([
  'low',
  'medium',
  'high'
]);

export const ALLOWED_SOURCE_TYPES = new Set([
  'ticket',
  'sprint',
  'knowledge',
  'activity',
  'project'
]);

export class RiskAnalyzer {
  /**
   * Normalize and sanitize a raw analysis object
   * @param {object} rawAnalysis
   * @returns {object|null} Sanitized analysis or null if invalid
   */
  static normalize(rawAnalysis) {
    if (!rawAnalysis || typeof rawAnalysis !== 'object') {
      return null;
    }

    const type = String(rawAnalysis.type || 'project-health').toLowerCase().trim();
    const severity = String(rawAnalysis.severity || 'medium').toLowerCase().trim();
    const confidence = String(rawAnalysis.confidence || 'medium').toLowerCase().trim();

    const normalizedType = ALLOWED_RISK_TYPES.has(type) ? type : 'project-health';
    const normalizedSeverity = ALLOWED_SEVERITIES.has(severity) ? severity : 'medium';
    const normalizedConfidence = ALLOWED_CONFIDENCES.has(confidence) ? confidence : 'medium';

    // Normalize findings array
    const rawFindings = Array.isArray(rawAnalysis.findings) ? rawAnalysis.findings : [];
    const findings = rawFindings
      .filter((f) => f && (f.text || f.title))
      .map((f) => {
        const text = String(f.text || f.title || '').trim();
        const ev = Array.isArray(f.evidence) ? f.evidence.map((e) => String(e).trim()).filter(Boolean) : [];
        return {
          text,
          evidence: Array.from(new Set(ev))
        };
      })
      .filter((f) => f.text.length > 0);

    // Normalize recommendations array
    const rawRecs = Array.isArray(rawAnalysis.recommendations) ? rawAnalysis.recommendations : [];
    const recommendations = rawRecs
      .filter((r) => r)
      .map((r) => {
        if (typeof r === 'string') {
          return { text: r.trim(), evidence: [] };
        }
        const text = String(r.text || r.recommendation || '').trim();
        const ev = Array.isArray(r.evidence) ? r.evidence.map((e) => String(e).trim()).filter(Boolean) : [];
        return {
          text,
          evidence: Array.from(new Set(ev))
        };
      })
      .filter((r) => r.text.length > 0);

    // Normalize evidenceSummary array
    const rawEvSummary = Array.isArray(rawAnalysis.evidenceSummary) ? rawAnalysis.evidenceSummary : [];
    const evidenceSummary = rawEvSummary
      .filter((e) => e && (e.reference || e.description))
      .map((e) => {
        const sType = String(e.sourceType || 'ticket').toLowerCase().trim();
        const reference = String(e.reference || '').trim();
        const description = String(e.description || reference).trim();
        return {
          sourceType: ALLOWED_SOURCE_TYPES.has(sType) ? sType : 'ticket',
          reference,
          description
        };
      })
      .filter((e) => e.reference.length > 0);

    if (findings.length === 0 && recommendations.length === 0) {
      return null;
    }

    return {
      type: normalizedType,
      severity: normalizedSeverity,
      confidence: normalizedConfidence,
      findings,
      recommendations,
      evidenceSummary
    };
  }
}
