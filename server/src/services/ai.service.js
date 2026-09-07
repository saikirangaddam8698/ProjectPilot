/**
 * Task 14–23 — AI Agent Service (Production Hardened)
 * ProjectPilot Project Intelligence Agent Orchestration & Observability Instrumentation
 *
 * Implements a controlled multi-round Gemini tool-calling loop with high-precision timing,
 * active concurrency protection, context budget pruning, total tool limits,
 * execution timeouts, request cancellation, and graceful partial failure fallback synthesis.
 */
import { performance } from 'node:perf_hooks';
import { GeminiClient } from './gemini.client.js';
import { ToolRegistry } from './ai/tool.registry.js';
import { ToolExecutor } from './ai/tool.executor.js';
import { buildAgentInstruction } from './ai/agent/agentPlanner.js';
import { initAgentContents, appendModelTurn, appendFunctionResponse } from './ai/agent/agentContext.js';
import { buildAgentResponse } from './ai/agent/agentResponse.js';
import { AiTelemetryService } from './ai/observability/aiTelemetry.service.js';
import { AiMetrics } from './ai/observability/aiMetrics.js';
import { config } from '../config/index.js';
import { ApiError } from '../utils/apiError.js';

/** Maximum Gemini tool-calling rounds before stopping */
const MAX_AGENT_ROUNDS = 5;

/** In-memory active requests counter for concurrency protection */
let activeRequestsCount = 0;

export class AiAgentService {
  /**
   * Run the ProjectPilot AI Agent for a user request.
   *
   * @param {object} params
   * @param {string} params.projectKey - Active workspace project key
   * @param {string} params.message - User question
   * @param {Array<object>} [params.history] - Conversation history
   * @param {object} params.user - Authenticated user
   * @param {string} [params.requestId] - Correlation request ID
   * @param {AbortSignal} [params.signal] - Optional request cancellation signal
   * @returns {Promise<object>} Agent response with sanitized metadata and observability indicators
   */
  static async chat({ projectKey, message, history = [], user, requestId, signal = null }) {
    if (!projectKey) {
      throw ApiError.badRequest('projectKey is required');
    }
    if (!message || !message.trim()) {
      throw ApiError.badRequest('message cannot be empty');
    }

    const hardening = config.ai.hardening || {};
    const maxConcurrent = hardening.MAX_CONCURRENT_REQUESTS || 10;
    const maxContextChars = hardening.MAX_CONTEXT_CHARACTERS || 24000;
    const maxTotalTools = hardening.MAX_TOTAL_TOOL_CALLS || 10;
    const agentTimeoutMs = hardening.AGENT_EXECUTION_TIMEOUT_MS || 30000;

    // 1. Concurrency Limiter Guard
    if (activeRequestsCount >= maxConcurrent) {
      throw ApiError.tooManyRequests('Too many concurrent AI requests. Please try again in a moment.');
    }

    activeRequestsCount++;
    const pKey = projectKey.toUpperCase();
    const trace = AiTelemetryService.startTrace({ requestId, projectKey: pKey, user });
    const overallStartTime = performance.now();

    try {
      // 2. Build agent system instruction
      const systemInstruction = buildAgentInstruction(pKey);

      // 3. Get approved tool declarations
      const tools = [{ functionDeclarations: ToolRegistry.getGeminiFunctionDeclarations() }];

      // 4. Initialize and prune conversation contents if context budget exceeded
      let contents = initAgentContents(message.trim(), history);
      contents = this.pruneContextIfNeeded(contents, maxContextChars);

      let round = 0;
      let totalToolCallsExecuted = 0;
      let finalGeminiResult = null;
      const toolExecutions = [];

      while (round < MAX_AGENT_ROUNDS) {
        // Request cancellation check
        if (signal?.aborted) {
          throw ApiError.badRequest('AI request cancelled by client.');
        }

        // Agent execution total wall-clock timeout check
        const elapsedMs = performance.now() - overallStartTime;
        if (elapsedMs >= agentTimeoutMs) {
          throw ApiError.serviceUnavailable(`AI Agent overall execution timed out after ${Math.round(elapsedMs)}ms.`);
        }

        round++;
        const geminiStart = performance.now();
        AiMetrics.recordGeminiInvocation();

        let geminiResult;
        try {
          geminiResult = await GeminiClient.generateContent({
            systemInstruction,
            contents,
            tools
          });
        } catch (geminiErr) {
          // If Gemini fails on round 2+ after tools were executed, attempt graceful fallback synthesis
          if (round > 1 && toolExecutions.length > 0) {
            finalGeminiResult = {
              text: `Based on current project evidence collected (executed ${toolExecutions.length} tools), the system encountered a transient provider delay. Here is the available intelligence gathered so far.`,
              functionCalls: []
            };
            break;
          }
          throw geminiErr;
        }

        const geminiDuration = performance.now() - geminiStart;
        trace.geminiLatencyMs += Math.round(geminiDuration);
        finalGeminiResult = geminiResult;

        const functionCalls = geminiResult.functionCalls || [];
        if (functionCalls.length === 0) {
          break; // Final text response reached
        }

        // Total tool count cap guard
        if (totalToolCallsExecuted + functionCalls.length > maxTotalTools) {
          finalGeminiResult = {
            text: geminiResult.text || `Executed max allowed tool limit (${maxTotalTools}). Synthesizing response from gathered evidence.`,
            functionCalls: []
          };
          break;
        }

        appendModelTurn(contents, geminiResult, functionCalls);

        for (const call of functionCalls) {
          if (signal?.aborted) {
            throw ApiError.badRequest('AI request cancelled by client.');
          }

          const toolName = call.name;
          const toolArgs = call.args || {};
          totalToolCallsExecuted++;

          const toolStart = performance.now();
          let toolResult;
          let toolSuccess = true;

          try {
            toolResult = await ToolExecutor.execute({
              name: toolName,
              args: toolArgs,
              user,
              fallbackProjectKey: pKey
            });
          } catch (err) {
            toolSuccess = false;
            toolResult = { error: err.message || 'Tool execution failed' };
          }

          const toolDuration = performance.now() - toolStart;

          AiTelemetryService.recordToolExecution(trace, {
            toolName,
            round,
            durationMs: toolDuration,
            success: toolSuccess
          });

          toolExecutions.push({
            name: toolName,
            args: toolArgs,
            result: toolResult,
            round
          });

          appendFunctionResponse(contents, toolName, toolResult);
        }
      }

      if (!finalGeminiResult || (!finalGeminiResult.text && toolExecutions.length === 0)) {
        throw ApiError.internal('Agent failed to generate a response from Gemini AI.');
      }

      // Build sanitized response (runs AiEvaluator inside agentResponse)
      const response = buildAgentResponse({
        geminiResult: finalGeminiResult,
        projectKey: pKey,
        toolExecutions,
        agentRounds: round,
        requestId: trace.requestId
      });

      AiTelemetryService.completeTrace(trace, {
        geminiResult: finalGeminiResult,
        agentRounds: round,
        grounded: response.grounded
      });

      return response;
    } catch (err) {
      AiTelemetryService.failTrace(trace, err);
      throw err;
    } finally {
      activeRequestsCount = Math.max(0, activeRequestsCount - 1);
    }
  }

  /**
   * Helper: Prune oldest conversation history turns if total character budget exceeded
   * @param {Array<object>} contents
   * @param {number} maxChars
   * @returns {Array<object>}
   */
  static pruneContextIfNeeded(contents, maxChars) {
    if (!Array.isArray(contents) || contents.length <= 1) {
      return contents;
    }

    const calcLength = (items) =>
      items.reduce((acc, turn) => {
        const partsText = turn.parts ? turn.parts.map(p => p.text || '').join('') : '';
        return acc + partsText.length;
      }, 0);

    if (calcLength(contents) <= maxChars) {
      return contents;
    }

    const userTurn = contents[contents.length - 1];
    let historyTurns = contents.slice(0, contents.length - 1);

    while (historyTurns.length > 0 && calcLength([...historyTurns, userTurn]) > maxChars) {
      historyTurns.shift();
    }

    return [...historyTurns, userTurn];
  }
}

/** Backward-compatible export alias */
export const AiService = AiAgentService;
