/**
 * AI Chat Request Validator
 */
export const aiChatSchema = {
  body: (body) => {
    const errors = [];

    if (!body || typeof body !== 'object') {
      errors.push('Request body must be a valid JSON object');
      return errors;
    }

    // 1. Validate projectKey
    if (!body.projectKey || typeof body.projectKey !== 'string' || !body.projectKey.trim()) {
      errors.push('projectKey is required and must be a non-empty string');
    } else if (body.projectKey.trim().length < 2 || body.projectKey.trim().length > 10) {
      errors.push('projectKey must be between 2 and 10 characters');
    }

    // 2. Validate message
    if (!body.message || typeof body.message !== 'string' || !body.message.trim()) {
      errors.push('message is required and cannot be empty');
    } else if (body.message.trim().length > 4000) {
      errors.push('message exceeds maximum allowed length of 4000 characters');
    }

    // 3. Validate history (optional array)
    if (body.history !== undefined) {
      if (!Array.isArray(body.history)) {
        errors.push('history must be an array of conversation turns');
      } else if (body.history.length > 20) {
        errors.push('history exceeds maximum allowed depth of 20 turns');
      } else {
        for (let i = 0; i < body.history.length; i++) {
          const item = body.history[i];
          if (!item || typeof item !== 'object') {
            errors.push(`history[${i}] must be an object with role and content`);
            break;
          }
          if (!item.role || !['user', 'model', 'assistant'].includes(item.role)) {
            errors.push(`history[${i}].role must be 'user', 'model', or 'assistant'`);
            break;
          }
          if (typeof item.content !== 'string' || !item.content.trim()) {
            errors.push(`history[${i}].content must be a non-empty string`);
            break;
          }
        }
      }
    }

    return errors;
  }
};
