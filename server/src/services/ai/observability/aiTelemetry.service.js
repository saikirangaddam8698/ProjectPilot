/**
 * Task 16 — AI Telemetry Service
 * Tracks per-request AI execution lifecycle, measures precision timing breakdown,
 * and emits structured, sanitized server-side log events.
 */
import { logger } from '../../../utils/logger.js';
import { AiMetrics } from './aiMetrics.js';
import { AiErrorClassifier } from './aiErrorClassifier.js';

export class AiTelemetryService {
  /**
   * Start a new telemetry trace for an AI request
   * @param {object} params
   * @param {string} params.requestId - Correlation ID
   * @param {string} params.projectKey - Workspace project key
   * @param {object} [params.user] - Authenticated user info (sanitized)
   * @returns {object} Telemetry instance context
   */
  static startTrace({ requestId, projectKey, user }) {
    const startTime = Date.now();
    const reqId = requestId || `ai_${Date.now().toString(36)}`;
    const pKey = (projectKey || 'UNKNOWN').toUpperCase();

    AiMetrics.recordRequest();

    logger.info('[AI Telemetry] Request Started', {
      event: 'AI_REQUEST_STARTED',
      requestId: reqId,
      projectKey: pKey,
      userId: user?.id || user?.memberId || 'anonymous'
    });

    return {
      requestId: reqId,
      projectKey: pKey,
      startTime,
      geminiLatencyMs: 0,
      toolLatencyMs: 0,
      ragLatencyMs: 0,
      geminiInvocations: 0,
      toolExecutionsCount: 0,
      ragInvocationsCount: 0,
      tokensUsed: null,
      agentRounds: 0,
      grounded: false
    };
  }

  /**
   * Record a tool execution event
   */
  static recordToolExecution(trace, { toolName, round, durationMs, success }) {
    if (!trace) return;

    trace.toolExecutionsCount++;
    trace.toolLatencyMs += Math.max(0, Math.round(durationMs || 0));
    AiMetrics.recordToolExecution();

    if (toolName === 'search_project_knowledge') {
      trace.ragInvocationsCount++;
      trace.ragLatencyMs += Math.max(0, Math.round(durationMs || 0));
      AiMetrics.recordRagInvocation();
    }

    logger.info('[AI Telemetry] Tool Executed', {
      event: toolName === 'search_project_knowledge' ? 'AI_RAG_SEARCH' : 'AI_TOOL_EXECUTED',
      requestId: trace.requestId,
      projectKey: trace.projectKey,
      tool: toolName,
      round,
      durationMs: Math.round(durationMs || 0),
      success: Boolean(success)
    });
  }

  /**
   * Complete the telemetry trace on successful response generation
   */
  static completeTrace(trace, { geminiResult, agentRounds, grounded = false }) {
    if (!trace) return;

    const totalLatencyMs = Date.now() - trace.startTime;
    trace.agentRounds = agentRounds || 1;
    trace.grounded = Boolean(grounded);

    // Record Gemini tokens if available
    const totalTokens = geminiResult?.usage?.totalTokens || null;
    if (typeof totalTokens === 'number') {
      trace.tokensUsed = totalTokens;
      AiMetrics.recordTokens(totalTokens);
    }

    AiMetrics.recordSuccess();
    AiMetrics.recordLatency(totalLatencyMs);
    AiMetrics.recordGroundedResponse(trace.grounded);

    logger.info('[AI Telemetry] Request Completed', {
      event: 'AI_REQUEST_COMPLETED',
      requestId: trace.requestId,
      projectKey: trace.projectKey,
      totalLatencyMs,
      geminiLatencyMs: trace.geminiLatencyMs,
      toolLatencyMs: trace.toolLatencyMs,
      ragLatencyMs: trace.ragLatencyMs,
      toolCount: trace.toolExecutionsCount,
      ragCount: trace.ragInvocationsCount,
      totalTokens: trace.tokensUsed,
      agentRounds: trace.agentRounds,
      grounded: trace.grounded
    });
  }

  /**
   * Fail the telemetry trace on error
   */
  static failTrace(trace, error) {
    if (!trace) return;

    const totalLatencyMs = Date.now() - trace.startTime;
    const category = AiErrorClassifier.classify(error);

    AiMetrics.recordFailure();

    logger.error('[AI Telemetry] Request Failed', {
      event: 'AI_REQUEST_FAILED',
      requestId: trace.requestId,
      projectKey: trace.projectKey,
      totalLatencyMs,
      errorCategory: category,
      errorMessage: error?.message || 'Unknown error'
    });
  }
}
