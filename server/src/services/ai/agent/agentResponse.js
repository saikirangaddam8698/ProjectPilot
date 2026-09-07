/**
 * Task 14, Task 15, Task 16, Task 18 & Task 19 — Agent Response Builder
 * Extracts, sanitizes, and structures the final agent response payload.
 * Runs deterministic AiEvaluator to verify grounding, tool approvals, and secret safety.
 * Attaches correlation requestId, grounded status indicator, and verified citation sources.
 */
import { IntelligenceService } from '../intelligence/intelligence.service.js';
import { AiEvaluator } from '../observability/aiEvaluator.js';

const TOOL_DISPLAY_LABELS = {
  list_project_tickets: 'Project Tickets',
  get_ticket_details: 'Ticket Details',
  get_sprint_progress: 'Sprint Progress',
  list_sprint_tickets: 'Sprint Tickets',
  get_project_activity: 'Recent Activity',
  get_project_summary: 'Project Summary',
  search_project_knowledge: 'Project Knowledge'
};

/**
 * Build the sanitized final agent response contract.
 *
 * @param {object} params
 * @param {object} params.geminiResult - Final Gemini response object
 * @param {string} params.projectKey - The active project key
 * @param {Array<object>} params.toolExecutions - Raw tool execution records
 * @param {number} params.agentRounds - Number of Gemini rounds completed
 * @param {string} [params.requestId] - Correlation request ID
 * @returns {object} Sanitized response: { message, projectKey, model, usage, agentRounds, executedTools, sources, analysis, requestId, grounded }
 */
export function buildAgentResponse({ geminiResult, projectKey, toolExecutions, agentRounds, requestId }) {
  const rawText = geminiResult?.text || 'Agent completed tool execution. No additional information was generated.';

  // Extract structured analysis metadata via IntelligenceService
  const analysis = IntelligenceService.extractAnalysis({
    geminiResult,
    toolExecutions,
    projectKey
  });

  // Strip raw JSON ANALYSIS_BLOCK from conversational message text for clean UI display
  const message = rawText
    .replace(/ANALYSIS_BLOCK:\s*```(?:json)?[\s\S]*?```/gi, '')
    .replace(/ANALYSIS_BLOCK:\s*\{[\s\S]*?\}/gi, '')
    .trim() || rawText.trim();

  // Build sanitized executedTools — only approved tools, NO raw results exposed to frontend
  const executedTools = toolExecutions
    .filter((t) => t.name in TOOL_DISPLAY_LABELS)
    .map((t) => ({
      name: t.name,
      label: TOOL_DISPLAY_LABELS[t.name] || t.name,
      round: t.round
    }));

  // Build structured sources from knowledge search results only
  const sources = extractSources(toolExecutions);

  // Deterministic Evaluation Check (no LLM call)
  const evalReport = AiEvaluator.evaluate({
    message,
    executedTools,
    sources,
    analysis,
    projectKey
  });

  return {
    message,
    projectKey: projectKey.toUpperCase(),
    model: geminiResult?.model || null,
    usage: geminiResult?.usage || null,
    agentRounds,
    executedTools,
    sources,
    analysis: analysis || null,
    requestId: requestId || null,
    grounded: Boolean(evalReport.grounded && evalReport.valid)
  };
}

/**
 * Extract structured citation sources from knowledge search tool executions.
 * Only includes sources actually returned by search_project_knowledge during the current turn.
 * Never fabricates citations.
 *
 * @param {Array<object>} toolExecutions - Tool execution records (with internal results)
 * @returns {Array<object>} Structured sources: [{ type, title, section, page, source, similarity }]
 */
export function extractSources(toolExecutions) {
  const sources = [];
  const seenKeys = new Set();

  for (const t of toolExecutions) {
    if (t.name !== 'search_project_knowledge') continue;

    const results = t.result?.documentationResults;
    if (!Array.isArray(results)) continue;

    for (const doc of results) {
      const title = doc.documentTitle || doc.title;
      if (!title) continue;

      const section = doc.section || 'General Content';
      const page = doc.page || (doc.sectionIndex !== undefined ? Math.floor(doc.sectionIndex / 3) + 1 : 1);
      const sourceFile = doc.source || title;
      const key = `${title}:${section}`;

      if (seenKeys.has(key)) continue;

      const similarity = typeof doc.similarityScore === 'number' ? doc.similarityScore : doc.similarity;
      if (typeof similarity === 'number' && similarity < 0.25) continue;

      seenKeys.add(key);
      sources.push({
        type: 'knowledge',
        title,
        section,
        page,
        source: sourceFile,
        similarity: typeof similarity === 'number' ? Math.round(similarity * 100) / 100 : null
      });
    }
  }

  return sources;
}
