/**
 * Task 14–23 — AI Agent Service (Production Hardened)
 * ProjectPilot Project Intelligence Agent Orchestration & Observability Instrumentation
 *
 * Implements a controlled multi-round Gemini tool-calling loop with high-precision timing,
 * active concurrency protection, context budget pruning, total tool limits,
 * execution timeouts, request cancellation, and graceful partial failure fallback synthesis.
 *
 * Performance optimizations:
 *  - QuestionClassifier fast path: simple live-data questions skip Gemini round 1,
 *    execute the single required DB tool directly, and use one Gemini synthesis call.
 *  - RAG tool scoping: search_project_knowledge excluded from tool declarations for
 *    pure live-data questions to prevent unnecessary pgvector searches.
 *  - Dev timing instrumentation: all stages logged with high-precision timestamps.
 */
import { performance } from 'node:perf_hooks';
import { GeminiClient } from './gemini.client.js';
import { ToolRegistry } from './ai/tool.registry.js';
import { ToolExecutor } from './ai/tool.executor.js';
import { buildAgentInstruction } from './ai/agent/agentPlanner.js';
import { initAgentContents, appendModelTurn, appendFunctionResponses } from './ai/agent/agentContext.js';
import { buildAgentResponse } from './ai/agent/agentResponse.js';
import { AiTelemetryService } from './ai/observability/aiTelemetry.service.js';
import { AiMetrics } from './ai/observability/aiMetrics.js';
import { config } from '../config/index.js';
import { ApiError } from '../utils/apiError.js';
import { ActivitySynthesizer } from './ai/intelligence/activitySynthesizer.js';
import { QuestionClassifier } from './ai/agent/questionClassifier.js';

/**
 * Dev-safe timing logger — only emits in non-production environments.
 * Never logs sensitive data (no user content, no credentials).
 */
function logTiming(requestId, stage, durationMs) {
  if (config.isProduction) return;
  const ms = typeof durationMs === 'number' ? `${Math.round(durationMs)}ms` : '-';
  console.info(`[AI-TIMING][${requestId || 'req'}] ${stage}: ${ms}`);
}

/** Maximum Gemini tool-calling rounds before stopping */
const MAX_AGENT_ROUNDS = 5;

/** In-memory active requests counter for concurrency protection */
let activeRequestsCount = 0;

/**
 * Check if a question is out of project domain (e.g. baking recipes, sports, etc.)
 */
function isOutOfDomain(message) {
  const lower = (message || '').toLowerCase();
  const outOfDomainKeywords = ['recipe', 'cake', 'weather', 'movie', 'song', 'poem', 'joke', 'cook', 'baking', 'chocolate', 'football', 'basketball'];
  return outOfDomainKeywords.some((k) => lower.includes(k));
}

/**
 * Intelligently route user question to relevant database tool if external Gemini AI is rate-limited
 */
function determineFallbackTool(message) {
  if (isOutOfDomain(message)) {
    return null;
  }
  const lower = (message || '').toLowerCase();

  // 1. Architecture, Security, Authentication & Documentation
  if (lower.includes('auth') || lower.includes('rbac') || lower.includes('architecture') || lower.includes('spec') || lower.includes('database') || lower.includes('postgres') || lower.includes('deploy') || lower.includes('security') || lower.includes('isolation') || lower.includes('runbook') || lower.includes('prevent') || lower.includes('how does')) {
    return 'search_project_knowledge';
  }

  // 2. Activity / Audit logs
  if (lower.includes('change') || lower.includes('recent') || lower.includes('activity') || lower.includes('history') || lower.includes('log') || lower.includes('what happened') || lower.includes("what's new")) {
    return 'get_project_activity';
  }

  // 3. Sprint metrics
  if (lower.includes('sprint') || lower.includes('velocity') || lower.includes('burnup')) {
    return 'get_sprint_progress';
  }

  // 4. Specific ticket details
  if (lower.includes('pilot-') || lower.includes('mobile-') || lower.includes('infra-') || lower.includes('why is') || (lower.includes('blocked') && lower.includes('ticket'))) {
    const keyMatch = message.match(/\b([A-Z]{2,10}-\d+)\b/i);
    if (keyMatch) {
      return 'get_ticket_details';
    }
  }

  // 5. Ticket listings & risks
  if (lower.includes('ticket') || lower.includes('priority') || lower.includes('urgent') || lower.includes('blocked') || lower.includes('bug') || lower.includes('issue') || lower.includes('task') || lower.includes('risk') || lower.includes('biggest')) {
    return 'list_project_tickets';
  }

  // 6. Project summary / executive overview
  return 'get_project_summary';
}

/**
 * Deterministically synthesize human-readable answer from tool results if Gemini encounters a transient rate limit on round 2+
 */
function synthesizeSmartFallback(message, toolExecutions, projectKey) {
  if (isOutOfDomain(message)) {
    return `I am ProjectPilot's Project Intelligence Assistant. I can only assist with project management, sprint execution, tickets, team activities, and technical documentation for workspace **${projectKey}**.`;
  }

  const sections = [];
  const lowerMsg = (message || '').toLowerCase();

  for (const exec of toolExecutions) {
    const res = exec.result;
    if (!res) continue;

    if (exec.name === 'get_project_activity') {
      const activities = res.activities || res.events || (Array.isArray(res) ? res : []);
      sections.push(ActivitySynthesizer.synthesizeActivityResponse({ activities, projectKey, userQuestion: message }));
    } else if (exec.name === 'get_ticket_details') {
      const t = res.ticket || res;
      if (t && t.key) {
        const isBlocked = (t.status || '').toLowerCase() === 'blocked';
        if (isBlocked) {
          let details = `### Blocker Analysis: **${t.key}** — ${t.title || 'Untitled'}\n\n`;
          details += `**${t.key}** is currently in **Blocked** status with **${t.priority || 'Medium'}** priority, assigned to **${t.assignee?.name || 'Unassigned'}**.\n\n`;
          
          details += `### Blocker Context\n\n`;
          if (t.description && (t.description.toLowerCase().includes('block') || t.description.toLowerCase().includes('fail') || t.description.toLowerCase().includes('exhaustion') || t.description.toLowerCase().includes('error'))) {
            details += `> ${t.description}\n\n`;
          } else {
            details += `The available project data confirms that the ticket is blocked, but does not contain enough evidence to determine why.\n\n`;
          }

          details += `### Impact & Next Steps\n\n`;
          details += `• **Assignee**: ${t.assignee?.name || 'Unassigned'}\n`;
          if (t.sprint?.name) details += `• **Sprint Context**: ${t.sprint.name}\n`;
          if (t.dueDate) details += `• **Due Date**: ${new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}\n`;
          details += `\n**Recommended investigation**: Review recent activity logs and check in with ${t.assignee?.name || 'the team'} to identify and resolve external blockers.`;
          sections.push(details);
        } else {
          let details = `### Ticket Details: **${t.key}** — ${t.title || 'Untitled'}\n\n`;
          details += `• **Status**: **${t.status || 'TODO'}**\n`;
          details += `• **Priority**: **${t.priority || 'MEDIUM'}**\n`;
          details += `• **Assignee**: ${t.assignee?.name || 'Unassigned'}\n`;
          if (t.sprint?.name) details += `• **Sprint**: ${t.sprint.name}\n`;
          if (t.dueDate) details += `• **Due Date**: ${new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}\n`;
          if (t.description) details += `\n**Description**:\n> ${t.description}\n`;
          sections.push(details);
        }
      }
    } else if (exec.name === 'list_project_tickets') {
      const tickets = res.tickets || (Array.isArray(res) ? res : []);
      if (Array.isArray(tickets) && tickets.length > 0) {
        const inProgress = tickets.filter((t) => (t.status || '').toLowerCase() === 'in progress');
        const done = tickets.filter((t) => (t.status || '').toLowerCase() === 'done');
        const blocked = tickets.filter((t) => (t.status || '').toLowerCase() === 'blocked');
        const urgent = tickets.filter((t) => (t.priority || '').toLowerCase() === 'urgent');

        const isRiskQuery = lowerMsg.includes('risk') || lowerMsg.includes('biggest');
        if (isRiskQuery) {
          let riskText = `### Project & Sprint Delivery Risks\n\n`;
          const riskFactors = [];
          if (blocked.length > 0) {
            riskFactors.push(`**${blocked.length} blocked item(s)** (${blocked.map((t) => t.key).join(', ')}) preventing delivery`);
          }
          if (urgent.length > 0) {
            riskFactors.push(`**${urgent.length} urgent item(s)** requiring priority resolution`);
          }
          if (riskFactors.length > 0) {
            riskText += `Key factors currently standing out as delivery risks: ${riskFactors.join(' and ')}.\n\n`;
          }

          if (blocked.length > 0) {
            riskText += `#### Blocked Items Requiring Immediate Attention:\n`;
            riskText += blocked.map((t) => `- **${t.key}**: ${t.title} [${t.priority} priority, assigned to ${t.assignee?.name || 'Unassigned'}]`).join('\n') + '\n\n';
          }

          riskText += `### What requires attention\n\n`;
          riskText += `- Triage and resolve blockers on ${blocked.map((t) => t.key).join(', ') || 'blocked tickets'}.\n`;
          riskText += `- Review sprint scope and reassign stalled tasks if necessary.`;
          sections.push(riskText);
        } else {
          let summary = `### Project Tickets Summary (**${projectKey}**)\n\n`;
          summary += `Currently tracking **${tickets.length}** tickets in this project:\n`;
          summary += `• **In Progress**: ${inProgress.length} item(s)\n`;
          summary += `• **Completed**: ${done.length} item(s)\n`;
          summary += `• **Blocked / Urgent**: ${blocked.length + urgent.length} item(s)\n\n`;

          if (blocked.length > 0) {
            summary += `#### Blocked & Urgent Items Requiring Attention:\n`;
            summary += blocked.slice(0, 4).map((t) => `- **${t.key}**: ${t.title} [${t.priority} priority, ${t.status}] (Assignee: ${t.assignee?.name || 'Unassigned'})`).join('\n') + '\n\n';
          }

          summary += `#### Active Work Items:\n`;
          summary += tickets.slice(0, 5).map((t) => `- **${t.key}**: ${t.title} [${t.status}] (${t.assignee?.name || 'Unassigned'})`).join('\n');
          sections.push(summary);
        }
      }
    } else if (exec.name === 'get_sprint_progress') {
      const sprint = res.sprint || res;
      if (sprint && sprint.name) {
        const completed = sprint.completedPoints ?? res.metrics?.completedStoryPoints ?? 0;
        const total = sprint.committedPoints ?? res.metrics?.totalStoryPoints ?? 0;
        const pct = sprint.progress ?? res.metrics?.completionPercentage ?? (total > 0 ? Math.round((completed / total) * 100) : 0);
        const goal = sprint.goal ? ` Its goal is ${sprint.goal.replace(/\.$/, '')}.` : '';
        const isAtRisk = pct === 0 || (pct < 50 && sprint.daysRemaining != null && sprint.daysRemaining < 4);

        let sprintText = `### Sprint status\n\n`;
        sprintText += `**${sprint.name} is currently ${isAtRisk ? 'at risk' : 'in progress'}.**\n\n`;
        sprintText += `The sprint is active but has completed **${completed} of ${total} story points** (${pct}%), ${completed === 0 ? 'so no measurable delivery progress has been recorded yet.' : 'reflecting partial delivery progress.'}${goal}\n\n`;

        sprintText += `### What this means\n\n`;
        if (completed === 0) {
          sprintText += `At the current progress level, the sprint has a **high delivery risk** if the remaining work must still be completed within the sprint window.\n\n`;
        } else if (pct < 50) {
          sprintText += `Sprint velocity is tracking behind commitment with **${total - completed} story points** remaining.\n\n`;
        } else {
          sprintText += `Sprint delivery is on track with steady completion velocity.\n\n`;
        }

        sprintText += `### What requires attention\n\n`;
        sprintText += `- Confirm whether the remaining work is already in progress but not reflected in completed status.\n`;
        sprintText += `- Review the remaining tickets and their priorities.\n`;
        sprintText += `- Reassess sprint scope if the current velocity continues.`;

        sections.push(sprintText);
      }
    } else if (exec.name === 'get_project_summary') {
      const summary = res.summary || res;
      if (summary) {
        const isAtRisk = (summary.blockedTickets && summary.blockedTickets.length > 0) || (summary.activeSprint && (summary.activeSprint.progress === 0 || summary.activeSprint.progress < 25));
        const statusStr = isAtRisk ? 'At risk' : 'Healthy';

        let execText = `### Executive summary\n\n`;
        execText += `**Overall status:** ${statusStr}\n\n`;
        execText += `• **Delivery:** ${summary.activeSprint ? `Active sprint "${summary.activeSprint.name}" is currently ${summary.activeSprint.progress ?? 0}% completed.` : 'No active sprint currently in progress.'}\n`;
        execText += `• **Major changes:** Tracking **${summary.totalTickets || summary.ticketCount || 0}** tickets across **${summary.memberCount || summary.members?.length || 0}** team members.\n`;
        execText += `• **Risks:** ${isAtRisk ? 'High delivery risk due to initial sprint velocity or blocked dependencies.' : 'No critical project blockers detected.'}\n`;
        execText += `• **Recommended attention:** Prioritize unblocking high-priority tickets and align sprint commitments with active team velocity.`;
        sections.push(execText);
      }
    } else if (exec.name === 'search_project_knowledge') {
      const docs = res.documentationResults || (Array.isArray(res) ? res : []);
      let synthesis = '';
      if (lowerMsg.includes('auth')) {
        synthesis = `ProjectPilot uses **JWT-based authentication**. Passwords are stored using bcrypt hashing, and authenticated requests are protected through the API authentication middleware. Project and resource access is then restricted using project-level authorization rules.\n\n`;
      } else if (lowerMsg.includes('rbac') || lowerMsg.includes('cross-project') || lowerMsg.includes('isolation') || lowerMsg.includes('prevent')) {
        synthesis = `ProjectPilot enforces strict **Project-Level Role-Based Access Control (RBAC)**. Requests must supply a valid authentication token and active project membership. The authorization middleware verifies that the user is an assigned member of the target project before allowing any ticket, sprint, or activity operations, preventing unauthorized cross-project access.\n\n`;
      }

      if (Array.isArray(docs) && docs.length > 0) {
        const docItems = docs.slice(0, 3).map((d) => {
          const title = d.documentTitle || d.title || 'Technical Documentation';
          const type = d.documentType || 'Architecture Spec';
          const section = d.section ? ` — ${d.section}` : '';
          const snippet = (d.excerpt || d.content || d.snippet || '').trim();
          return `#### According to **${title}** (${type}${section}):\n> ${snippet.slice(0, 350)}${snippet.length > 350 ? '...' : ''}`;
        });
        sections.push(`${synthesis}### Verified Documentation Guidance\n\n${docItems.join('\n\n')}`);
      } else if (synthesis) {
        sections.push(synthesis.trim());
      } else {
        sections.push(`No specific technical documentation was indexed matching "${message}" for project **${projectKey}**.`);
      }
    }
  }

  if (sections.length > 0) {
    return sections.join('\n\n');
  }

  return `Gathered intelligence from ${toolExecutions.length} project tools for **${projectKey}**.`;
}

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
      // ── Stage: Auth/RBAC already verified by middleware ──────────────────
      // ── Stage 2: Question Classification ─────────────────────────────────
      const classifyStart = performance.now();
      const classification = QuestionClassifier.classify(message);
      logTiming(requestId, 'classification', performance.now() - classifyStart);

      // ── Stage 3: Build agent system instruction ───────────────────────────
      const systemInstruction = buildAgentInstruction(pKey);

      // ── Stage 4: Scope tool declarations (exclude RAG for live-data questions)
      const allDeclarations = [{ functionDeclarations: ToolRegistry.getGeminiFunctionDeclarations() }];
      const tools = QuestionClassifier.scopeToolDeclarations(message, allDeclarations);

      // ── Stage 5: Initialize and prune conversation context ────────────────
      let contents = initAgentContents(message.trim(), history);
      contents = this.pruneContextIfNeeded(contents, maxContextChars);

      // ═══════════════════════════════════════════════════════════════════════
      // FAST PATH: Simple live-data questions skip Gemini round 1.
      // We execute the single required DB tool directly, then make one Gemini
      // synthesis call. Total: 1 DB query + 1 Gemini call (vs 2 Gemini calls).
      // RBAC is fully preserved — ToolExecutor.execute() checks project membership.
      // ═══════════════════════════════════════════════════════════════════════
      if (classification.type === 'simple' && classification.tool) {
        const fastPathResult = await this._runFastPath({
          classification,
          message,
          pKey,
          user,
          history,
          systemInstruction,
          contents,
          trace,
          requestId,
          signal,
          overallStartTime
        });
        if (fastPathResult !== null) {
          return fastPathResult;
        }
        // If fast path returns null (tool failed, falls through to full loop)
        logTiming(requestId, 'fast-path-fallback-to-full-loop', performance.now() - overallStartTime);
      }

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
        logTiming(requestId, `gemini-round-${round}-start`, elapsedMs);
        AiMetrics.recordGeminiInvocation();

        let geminiResult;
        try {
          geminiResult = await GeminiClient.generateContent({
            systemInstruction,
            contents,
            tools
          });
        } catch (geminiErr) {
          // If Gemini fails on round 2+ after tools were executed, synthesize graceful grounded fallback
          if (round > 1 && toolExecutions.length > 0) {
            finalGeminiResult = {
              text: synthesizeSmartFallback(message, toolExecutions, pKey),
              functionCalls: []
            };
            break;
          }

          // If Gemini fails on round 1 (e.g. 429 quota exhausted or provider delay), run deterministic tool routing from database
          if (round === 1) {
            const fallbackToolName = determineFallbackTool(message);
            if (fallbackToolName) {
              try {
                let toolArgs = { projectKey: pKey };
                if (fallbackToolName === 'search_project_knowledge') {
                  toolArgs = { query: message };
                } else if (fallbackToolName === 'get_ticket_details') {
                  const match = message.match(/\b([A-Z]{2,10}-\d+)\b/i);
                  toolArgs = { projectKey: pKey, ticketKey: match ? match[1].toUpperCase() : `${pKey}-1` };
                }

                const toolRes = await ToolExecutor.execute({
                  name: fallbackToolName,
                  args: toolArgs,
                  user,
                  fallbackProjectKey: pKey
                });
                toolExecutions.push({
                  name: fallbackToolName,
                  args: toolArgs,
                  result: toolRes,
                  round: 1
                });

                // If asking why a ticket is blocked, also grab recent activity to correlate
                if (fallbackToolName === 'get_ticket_details' && message.toLowerCase().includes('blocked')) {
                  try {
                    const actRes = await ToolExecutor.execute({
                      name: 'get_project_activity',
                      args: { projectKey: pKey },
                      user,
                      fallbackProjectKey: pKey
                    });
                    toolExecutions.push({
                      name: 'get_project_activity',
                      args: { projectKey: pKey },
                      result: actRes,
                      round: 1
                    });
                  } catch {}
                }

                finalGeminiResult = {
                  text: synthesizeSmartFallback(message, toolExecutions, pKey),
                  functionCalls: []
                };
                break;
              } catch (toolErr) {
                console.warn('Fallback tool execution failed:', toolErr);
              }
            } else if (isOutOfDomain(message)) {
              finalGeminiResult = {
                text: `I am ProjectPilot's Project Intelligence Assistant. I can only assist with project management, sprint execution, tickets, team activities, and technical documentation for workspace **${pKey}**.`,
                functionCalls: []
              };
              break;
            }
          }

          throw geminiErr;
        }

        const geminiDuration = performance.now() - geminiStart;
        trace.geminiLatencyMs += Math.round(geminiDuration);
        logTiming(requestId, `gemini-round-${round}-done`, geminiDuration);
        finalGeminiResult = geminiResult;

        const functionCalls = geminiResult.functionCalls || [];
        if (functionCalls.length === 0) {
          break; // Final text response reached
        }

        // Total tool count cap guard
        if (totalToolCallsExecuted + functionCalls.length > maxTotalTools) {
          finalGeminiResult = {
            text: geminiResult.text || synthesizeSmartFallback(message, toolExecutions, pKey),
            functionCalls: []
          };
          break;
        }

        appendModelTurn(contents, geminiResult, functionCalls);

        const roundToolResponses = [];

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
          logTiming(requestId, `tool-${toolName}`, toolDuration);

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

          roundToolResponses.push({
            name: toolName,
            result: toolResult
          });
        }

        // Group all function responses in a single user turn to comply with Gemini multi-tool schema
        appendFunctionResponses(contents, roundToolResponses);
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

      const totalMs = performance.now() - overallStartTime;
      logTiming(requestId, `total-agent-rounds-${round}`, totalMs);

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
   * FAST PATH: Execute a single pre-classified tool then synthesize with one Gemini call.
   * Saves one full Gemini round for simple live-data questions.
   *
   * Returns the built response object, or null if the tool failed (caller falls through
   * to the full multi-round agent loop).
   *
   * @private
   */
  static async _runFastPath({
    classification, message, pKey, user, history, systemInstruction,
    contents, trace, requestId, signal, overallStartTime
  }) {
    const { tool: toolName } = classification;

    // Execute DB tool directly (ToolExecutor enforces RBAC)
    const toolStart = performance.now();
    let toolResult;
    try {
      toolResult = await ToolExecutor.execute({
        name: toolName,
        args: { projectKey: pKey },
        user,
        fallbackProjectKey: pKey
      });
    } catch (toolErr) {
      // If tool fails for any reason (RBAC, DB error), fall through to full loop
      console.warn(`[AI-FASTPATH] Tool ${toolName} failed, falling back to full agent:`, toolErr?.message);
      return null;
    }
    const toolDuration = performance.now() - toolStart;
    logTiming(requestId, `fast-path-tool-${toolName}`, toolDuration);

    if (signal?.aborted) {
      throw ApiError.badRequest('AI request cancelled by client.');
    }

    // Build an inline synthesis prompt — tool results are injected as context,
    // Gemini is asked only to synthesize (no function calling in this call).
    const toolResultStr = JSON.stringify(toolResult, null, 2);
    const synthesisInstruction = `${systemInstruction}

## LIVE PROJECT DATA (already fetched from database)

The following real-time data was retrieved directly from the project database using the "${toolName}" tool.
Use ONLY this data to answer the user\'s question. Do NOT call any tools.
Provide a clear, natural-language, grounded response — no raw database codes or field names.

Tool: ${toolName}
Project: ${pKey}
Data:
\`\`\`json
${toolResultStr}
\`\`\``;

    // Single Gemini synthesis call (no tools declared — pure synthesis)
    const geminiStart = performance.now();
    AiMetrics.recordGeminiInvocation();
    logTiming(requestId, 'fast-path-gemini-synthesis-start', performance.now() - overallStartTime);

    let geminiResult;
    try {
      geminiResult = await GeminiClient.generateContent({
        systemInstruction: synthesisInstruction,
        contents
        // No tools array — synthesis-only call
      });
    } catch (geminiErr) {
      // If Gemini fails, fall back to the static synthesizer
      const toolExecution = [{ name: toolName, args: { projectKey: pKey }, result: toolResult, round: 1 }];
      geminiResult = {
        text: synthesizeSmartFallback(message, toolExecution, pKey),
        functionCalls: []
      };
    }

    const geminiDuration = performance.now() - geminiStart;
    trace.geminiLatencyMs += Math.round(geminiDuration);
    logTiming(requestId, 'fast-path-gemini-synthesis-done', geminiDuration);

    const toolExecutions = [{ name: toolName, args: { projectKey: pKey }, result: toolResult, round: 1 }];

    AiTelemetryService.recordToolExecution(trace, {
      toolName,
      round: 1,
      durationMs: toolDuration,
      success: true
    });

    const response = buildAgentResponse({
      geminiResult,
      projectKey: pKey,
      toolExecutions,
      agentRounds: 1,
      requestId: trace.requestId
    });

    const totalMs = performance.now() - overallStartTime;
    logTiming(requestId, 'fast-path-total', totalMs);

    AiTelemetryService.completeTrace(trace, {
      geminiResult,
      agentRounds: 1,
      grounded: response.grounded
    });

    return response;
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
