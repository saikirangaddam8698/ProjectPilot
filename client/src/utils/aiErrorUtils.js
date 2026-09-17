/**
 * AI Error Sanitizer & Formatter
 * Translates raw backend, network, or AI errors into clean, user-friendly generic messages.
 * Prevents internal latency, stack traces, database strings, or SDK errors from leaking to users.
 */

export function formatAiError(err) {
  if (!err) {
    return 'An unexpected issue occurred with the AI assistant. Please try again.';
  }

  const rawMsg = typeof err === 'string' ? err : (err.message || '');
  const msgLower = rawMsg.toLowerCase();
  const status = err.status || err.statusCode || 0;
  const code = (err.code || '').toUpperCase();

  // 1. Timeout errors (both client and server timeouts)
  if (
    status === 504 ||
    status === 408 ||
    code === 'TIMEOUT' ||
    code === 'ETIMEDOUT' ||
    code === 'ESOCKETTIMEDOUT' ||
    code === 'AGENT_TIMEOUT' ||
    code === 'GEMINI_TIMEOUT' ||
    msgLower.includes('timed out') ||
    msgLower.includes('timeout')
  ) {
    return 'AI request timed out. Please retry.';
  }

  // 2. Rate limit / Quota / Concurrency Limit / Busy
  if (
    status === 429 ||
    code === 'RATE_LIMITED' ||
    code === 'CONCURRENCY_LIMIT' ||
    code === 'RESOURCE_EXHAUSTED' ||
    msgLower.includes('rate limit') ||
    msgLower.includes('quota') ||
    msgLower.includes('too many requests') ||
    msgLower.includes('too many concurrent') ||
    msgLower.includes('busy')
  ) {
    return 'AI assistant is currently busy. Please wait a moment and retry.';
  }

  // 3. Service Unavailable / Overloaded / Server Restarting
  if (
    status === 503 ||
    status === 502 ||
    code === 'SERVICE_UNAVAILABLE' ||
    msgLower.includes('service unavailable') ||
    msgLower.includes('overloaded') ||
    msgLower.includes('high demand') ||
    msgLower.includes('not configured')
  ) {
    return 'AI service is temporarily unavailable. Please try again shortly.';
  }

  // 4. Network / Connection errors
  if (
    code === 'NETWORK_ERROR' ||
    code === 'ECONNREFUSED' ||
    msgLower.includes('network error') ||
    msgLower.includes('failed to fetch') ||
    msgLower.includes('econnrefused') ||
    msgLower.includes('connection refused')
  ) {
    return 'Unable to reach the server. Please check your network and retry.';
  }

  // 5. Authentication / Forbidden / RBAC
  if (
    status === 401 ||
    status === 403 ||
    code === 'UNAUTHORIZED' ||
    code === 'FORBIDDEN' ||
    msgLower.includes('unauthorized') ||
    msgLower.includes('forbidden') ||
    msgLower.includes('access denied') ||
    msgLower.includes('not a member')
  ) {
    return 'You do not have permission to access AI features for this project.';
  }

  // 6. Bad request / Invalid input
  if (status === 400 || code === 'BAD_REQUEST') {
    if (msgLower.includes('empty')) {
      return 'Message cannot be empty. Please enter your question.';
    }
    return 'Invalid request. Please rephrase your question and try again.';
  }

  // 7. Generic fallback for any other error
  return 'Unable to generate AI response. Please retry.';
}
