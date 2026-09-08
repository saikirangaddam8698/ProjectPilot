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
 * Append function response turn(s) to the contents array.
 * If multiple tool calls occurred in a single model turn, all functionResponse parts
 * are grouped into a single user turn as required by Gemini API schema.
 *
 * @param {Array<object>} contents - Mutable contents array
 * @param {Array<{name: string, result: object}>|string} toolResponsesOrName
 * @param {object} [toolResult]
 */
export function appendFunctionResponses(contents, toolResponses) {
  if (!Array.isArray(toolResponses) || toolResponses.length === 0) return;

  const parts = toolResponses.map((tr) => ({
    functionResponse: {
      name: tr.name,
      response: { result: sanitizeForGemini(tr.result) }
    }
  }));

  contents.push({
    role: 'user',
    parts
  });
}

export function appendFunctionResponse(contents, toolName, toolResult) {
  const safeResult = sanitizeForGemini(toolResult);
  const lastTurn = contents[contents.length - 1];

  // If the last turn is already a function response user turn, append the part to it
  if (lastTurn && lastTurn.role === 'user' && lastTurn.parts && lastTurn.parts.some(p => p.functionResponse)) {
    lastTurn.parts.push({
      functionResponse: {
        name: toolName,
        response: { result: safeResult }
      }
    });
  } else {
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
