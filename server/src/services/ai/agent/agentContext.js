/**
 * Task 14 — Agent Context Manager
 * Manages the Gemini multi-turn contents[] conversation structure.
 * Handles: initial history, user message, model tool-call turns, function responses.
 */

const MAX_HISTORY_TURNS = 10;

/**
 * Initialize the contents[] array for a new agent invocation.
 * @param {string} userMessage - The current user message
 * @param {Array<object>} history - Prior conversation turns [{role, content}]
 * @returns {Array<object>} Gemini-compatible contents array
 */
export function initAgentContents(userMessage, history = []) {
  const contents = [];

  // Append bounded conversation history (last N turns, no error messages)
  if (Array.isArray(history) && history.length > 0) {
    const boundedHistory = history
      .filter((t) => t.content && typeof t.content === 'string')
      .slice(-MAX_HISTORY_TURNS);

    for (const turn of boundedHistory) {
      const role = turn.role === 'assistant' || turn.role === 'model' ? 'model' : 'user';
      contents.push({
        role,
        parts: [{ text: turn.content.slice(0, 8000) }] // bound individual turns
      });
    }
  }

  // Append current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage.trim() }]
  });

  return contents;
}

/**
 * Append a model turn (with function calls) to the contents array.
 * @param {Array<object>} contents - Mutable contents array
 * @param {object} geminiResult - Result from GeminiClient.generateContent
 * @param {Array<object>} functionCalls - Parsed function calls from the result
 */
export function appendModelTurn(contents, geminiResult, functionCalls) {
  if (geminiResult.candidateContent) {
    // Use actual candidate content from API (preserves thought signatures)
    contents.push(geminiResult.candidateContent);
  } else {
    // Fallback for mock environments or when candidateContent is absent
    contents.push({
      role: 'model',
      parts: functionCalls.map((fc) => ({
        functionCall: { name: fc.name, args: fc.args }
      }))
    });
  }
}

/**
 * Append a function response turn to the contents array.
 * Only the data Gemini needs is included — raw DB results are summarized.
 * @param {Array<object>} contents - Mutable contents array
 * @param {string} toolName - The tool name
 * @param {object} toolResult - The tool execution result
 */
export function appendFunctionResponse(contents, toolName, toolResult) {
  // Sanitize: remove any internal error stacks and sensitive fields before feeding back to Gemini
  const safeResult = sanitizeForGemini(toolResult);

  contents.push({
    role: 'user',
    parts: [
      {
        functionResponse: {
          name: toolName,
          response: { result: safeResult }
        }
      }
    ]
  });
}

/**
 * Remove potentially sensitive fields from tool results before feeding to Gemini.
 * Gemini only needs the data — not stack traces, DB internals, or credentials.
 * @param {*} result
 * @returns {*} Sanitized result
 */
function sanitizeForGemini(result) {
  if (!result || typeof result !== 'object') return result;

  // If the result is an error object
  if (result.error) {
    return { error: 'Tool execution failed or returned no data.' };
  }

  // Deep clone and strip sensitive keys
  const SENSITIVE_KEYS = new Set([
    'passwordHash', 'password', 'token', 'jwtSecret', 'apiKey', 'DATABASE_URL',
    'secret', 'credentials', 'connectionString', 'embedding', 'embeddings'
  ]);

  function stripSensitive(obj) {
    if (Array.isArray(obj)) return obj.map(stripSensitive);
    if (obj && typeof obj === 'object') {
      const clean = {};
      for (const [k, v] of Object.entries(obj)) {
        if (SENSITIVE_KEYS.has(k)) continue;
        clean[k] = stripSensitive(v);
      }
      return clean;
    }
    return obj;
  }

  return stripSensitive(result);
}
