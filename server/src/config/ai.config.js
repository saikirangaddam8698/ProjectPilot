/**
 * Task 21 & Task 23 — AI Production Hardening & Safety Configuration
 * Defines operational parameters for Gemini API timeouts, retries, concurrency limits,
 * token context limits, and tool execution caps.
 */

export const AI_HARDENING_CONFIG = {
  /** Gemini API call timeout in ms (8s for responsive completion) */
  GEMINI_TIMEOUT_MS: parseInt(process.env.GEMINI_TIMEOUT_MS, 10) || 8000,

  /** Maximum retries for transient Gemini errors (1 retry with fast 300ms backoff) */
  MAX_RETRIES: parseInt(process.env.AI_MAX_RETRIES, 10) || 1,

  /** Initial delay for exponential backoff in ms */
  RETRY_DELAY_MS: parseInt(process.env.AI_RETRY_DELAY_MS, 10) || 300,

  /** Maximum total wall-clock time for an agent execution turn in ms (20s) */
  AGENT_EXECUTION_TIMEOUT_MS: parseInt(process.env.AGENT_EXECUTION_TIMEOUT_MS, 10) || 20000,

  /** Maximum total tool calls executed across all rounds in a single chat turn */
  MAX_TOTAL_TOOL_CALLS: parseInt(process.env.AI_MAX_TOTAL_TOOL_CALLS, 10) || 6,

  /** Maximum character budget for conversation context before pruning oldest turns */
  MAX_CONTEXT_CHARACTERS: parseInt(process.env.AI_MAX_CONTEXT_CHARACTERS, 10) || 24000,

  /** Maximum concurrent agent executions allowed across server instance */
  MAX_CONCURRENT_REQUESTS: parseInt(process.env.AI_MAX_CONCURRENT_REQUESTS, 10) || 10
};
