/**
 * Task 17 — Conversation Request Validators
 */

export const createConversationSchema = {
  body: (body) => {
    const errors = [];
    if (body.title !== undefined) {
      if (typeof body.title !== 'string') {
        errors.push('title must be a string');
      } else if (body.title.trim().length > 100) {
        errors.push('title cannot exceed 100 characters');
      }
    }
    if (body.initialMessage !== undefined) {
      if (typeof body.initialMessage !== 'string') {
        errors.push('initialMessage must be a string');
      } else if (body.initialMessage.trim().length > 2000) {
        errors.push('initialMessage cannot exceed 2000 characters');
      }
    }
    return errors;
  }
};

export const sendMessageSchema = {
  body: (body) => {
    const errors = [];
    if (!body || typeof body !== 'object') {
      errors.push('Request body must be a valid JSON object');
      return errors;
    }
    if (!body.message || typeof body.message !== 'string' || !body.message.trim()) {
      errors.push('message is required and cannot be empty');
    } else if (body.message.trim().length > 2000) {
      errors.push('message cannot exceed 2000 characters');
    }
    return errors;
  }
};
