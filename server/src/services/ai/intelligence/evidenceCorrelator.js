/**
 * Task 15 & Task 20 — Evidence Correlator
 * Extracts ground-truth evidence tokens from executed tool results and validates findings, recommendations, and evidence summaries.
 * Prevents LLM-fabricated ticket keys, sprint names, or documentation titles.
 */

export class EvidenceCorrelator {
  /**
   * Extract set of valid evidence tokens from executed tool results
   * @param {Array<object>} toolExecutions - Array of executed tool objects { name, args, result }
   * @param {string} projectKey - Workspace project key
   * @returns {Set<string>} Set of uppercase/exact evidence tokens
   */
  static extractValidEvidence(toolExecutions = [], projectKey = '') {
    const validEvidence = new Set();

    if (projectKey) {
      validEvidence.add(projectKey.toUpperCase());
    }

    const jsonStr = JSON.stringify(toolExecutions || []);

    // 1. Extract all ticket keys (e.g., PILOT-104, INFRA-12)
    const ticketKeyRegex = /\b[A-Z]{2,10}-\d+\b/g;
    const ticketMatches = jsonStr.match(ticketKeyRegex) || [];
    for (const key of ticketMatches) {
      validEvidence.add(key.toUpperCase());
    }

    // 2. Extract documentation titles & RAG results
    for (const tool of toolExecutions) {
      if (!tool.result) continue;

      // Knowledge Search RAG titles
      if (Array.isArray(tool.result.documentationResults)) {
        for (const doc of tool.result.documentationResults) {
          if (doc.documentTitle) {
            validEvidence.add(doc.documentTitle.trim());
          }
        }
      }

      // Sprint Progress / Sprint names
      if (tool.result.sprint && tool.result.sprint.name) {
        validEvidence.add(tool.result.sprint.name.trim());
      }
      if (Array.isArray(tool.result.sprints)) {
        for (const s of tool.result.sprints) {
          if (s.name) validEvidence.add(s.name.trim());
        }
      }
    }

    return validEvidence;
  }

  /**
   * Filter and ground analysis findings, recommendations, and evidence summaries against valid evidence tokens.
   * Discards fabricated evidence references.
   *
   * @param {object} analysis - Normalized analysis object { type, severity, confidence, findings, recommendations, evidenceSummary }
   * @param {Set<string>} validEvidence - Set of verified evidence tokens
   * @returns {object} Analysis object with grounded evidence
   */
  static groundAnalysis(analysis, validEvidence) {
    if (!analysis) return null;

    const isTokenValid = (token) => {
      if (!token) return false;
      const tokenUpper = token.toUpperCase();
      if (validEvidence.has(token) || validEvidence.has(tokenUpper)) {
        return true;
      }
      for (const validItem of validEvidence) {
        if (validItem.toLowerCase() === token.toLowerCase()) {
          return true;
        }
      }
      return false;
    };

    const groundedFindings = (analysis.findings || []).map((finding) => ({
      ...finding,
      evidence: (finding.evidence || []).filter(isTokenValid)
    }));

    const groundedRecommendations = (analysis.recommendations || []).map((rec) => ({
      ...rec,
      evidence: (rec.evidence || []).filter(isTokenValid)
    }));

    const groundedEvidenceSummary = (analysis.evidenceSummary || []).filter((item) =>
      isTokenValid(item.reference)
    );

    return {
      ...analysis,
      findings: groundedFindings,
      recommendations: groundedRecommendations,
      evidenceSummary: groundedEvidenceSummary
    };
  }
}
