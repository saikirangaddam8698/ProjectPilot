/**
 * Task 16 & Task 23 — AI Error Classifier
 * Standardizes runtime AI failures into deterministic categories.
 * Prevents raw internal database or LLM errors from leaking while providing stable telemetry.
 */

export const AI_ERROR_CATEGORIES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  GEMINI_UNAVAILABLE: 'GEMINI_UNAVAILABLE',
  GEMINI_RATE_LIMITED: 'GEMINI_RATE_LIMITED',
  GEMINI_BAD_REQUEST: 'GEMINI_BAD_REQUEST',
  GEMINI_TIMEOUT: 'GEMINI_TIMEOUT',
  AGENT_TIMEOUT: 'AGENT_TIMEOUT',
  CONCURRENCY_LIMIT: 'CONCURRENCY_LIMIT',
  CLIENT_CANCELLED: 'CLIENT_CANCELLED',
  CONTEXT_OVERFLOW: 'CONTEXT_OVERFLOW',
  TOOL_VALIDATION_ERROR: 'TOOL_VALIDATION_ERROR',
  TOOL_NOT_ALLOWED: 'TOOL_NOT_ALLOWED',
  TOOL_EXECUTION_ERROR: 'TOOL_EXECUTION_ERROR',
  DATABASE_UNAVAILABLE: 'DATABASE_UNAVAILABLE',
  RAG_UNAVAILABLE: 'RAG_UNAVAILABLE',
  AGENT_MAX_ROUNDS: 'AGENT_MAX_ROUNDS',
  RESPONSE_VALIDATION_ERROR: 'RESPONSE_VALIDATION_ERROR',
  UNKNOWN: 'UNKNOWN'
};

export class AiErrorClassifier {
  /**
   * Classify an error object or message into a standardized AI error category
   * @param {Error|object|string} err
   * @returns {string} One of AI_ERROR_CATEGORIES
   */
  static classify(err) {
    if (!err) return AI_ERROR_CATEGORIES.UNKNOWN;

    const message = typeof err === 'string' ? err : err.message || '';
    const status = err.statusCode || err.status || err.code || null;

    const msgLower = message.toLowerCase();

    // 1. Timeouts & Cancellation
    if (msgLower.includes('gemini api request timed out') || msgLower.includes('gemini api call timed out')) {
      return AI_ERROR_CATEGORIES.GEMINI_TIMEOUT;
    }
    if (msgLower.includes('agent overall execution timed out') || msgLower.includes('agent execution timed out')) {
      return AI_ERROR_CATEGORIES.AGENT_TIMEOUT;
    }
    if (msgLower.includes('cancelled by client')) {
      return AI_ERROR_CATEGORIES.CLIENT_CANCELLED;
    }
    if (msgLower.includes('too many concurrent ai requests')) {
      return AI_ERROR_CATEGORIES.CONCURRENCY_LIMIT;
    }

    // 2. Max agent rounds
    if (msgLower.includes('max_agent_rounds') || msgLower.includes('exhausted all rounds')) {
      return AI_ERROR_CATEGORIES.AGENT_MAX_ROUNDS;
    }

    // 3. Auth / Access
    if (status === 401 || msgLower.includes('unauthorized') || msgLower.includes('jwt') || msgLower.includes('token')) {
      return AI_ERROR_CATEGORIES.AUTHENTICATION_ERROR;
    }
    if (status === 403 || msgLower.includes('forbidden') || msgLower.includes('access denied') || msgLower.includes('not a member')) {
      return AI_ERROR_CATEGORIES.AUTHORIZATION_ERROR;
    }

    // 4. Rate Limits
    if (status === 429 || msgLower.includes('too many requests') || msgLower.includes('rate limit')) {
      if (msgLower.includes('gemini') || msgLower.includes('google')) {
        return AI_ERROR_CATEGORIES.GEMINI_RATE_LIMITED;
      }
      return AI_ERROR_CATEGORIES.RATE_LIMITED;
    }

    // 5. Gemini SDK / API Errors
    if (msgLower.includes('gemini') || msgLower.includes('ai generation') || msgLower.includes('model')) {
      if (status === 503 || msgLower.includes('unavailable') || msgLower.includes('overloaded') || msgLower.includes('high demand')) {
        return AI_ERROR_CATEGORIES.GEMINI_UNAVAILABLE;
      }
      if (status === 400 || msgLower.includes('invalid argument')) {
        return AI_ERROR_CATEGORIES.GEMINI_BAD_REQUEST;
      }
      return AI_ERROR_CATEGORIES.GEMINI_UNAVAILABLE;
    }

    // 6. Database / PostgreSQL / Prisma
    if (msgLower.includes('prisma') || msgLower.includes('postgresql') || msgLower.includes('database') || status === 503) {
      return AI_ERROR_CATEGORIES.DATABASE_UNAVAILABLE;
    }

    // 7. RAG / Knowledge
    if (msgLower.includes('rag') || msgLower.includes('vector') || msgLower.includes('knowledge search')) {
      return AI_ERROR_CATEGORIES.RAG_UNAVAILABLE;
    }

    // 8. Tool execution & validation
    if (msgLower.includes('unapproved tool') || msgLower.includes('not allowed')) {
      return AI_ERROR_CATEGORIES.TOOL_NOT_ALLOWED;
    }
    if (msgLower.includes('tool validation') || msgLower.includes('invalid tool arguments')) {
      return AI_ERROR_CATEGORIES.TOOL_VALIDATION_ERROR;
    }
    if (msgLower.includes('tool execution failed')) {
      return AI_ERROR_CATEGORIES.TOOL_EXECUTION_ERROR;
    }

    // 9. General input validation
    if (status === 400 || msgLower.includes('required') || msgLower.includes('validation') || msgLower.includes('invalid')) {
      return AI_ERROR_CATEGORIES.VALIDATION_ERROR;
    }

    return AI_ERROR_CATEGORIES.UNKNOWN;
  }
}
