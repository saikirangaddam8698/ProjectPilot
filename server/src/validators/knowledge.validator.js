/**
 * Knowledge Request Validators
 */

const VALID_DOCUMENT_TYPES = [
  'ARCHITECTURE',
  'API_SPEC',
  'RUNBOOK',
  'REQUIREMENTS',
  'TROUBLESHOOTING',
  'GENERAL'
];

export const createDocumentSchema = {
  body: (body) => {
    const errors = [];

    if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 3) {
      errors.push('Document title is required and must be at least 3 characters');
    }
    if (body.title && body.title.trim().length > 200) {
      errors.push('Document title cannot exceed 200 characters');
    }

    if (!body.content || typeof body.content !== 'string' || body.content.trim().length < 10) {
      errors.push('Document content is required and must be at least 10 characters');
    }

    if (body.documentType && !VALID_DOCUMENT_TYPES.includes(body.documentType.toUpperCase())) {
      errors.push(`Document type must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}`);
    }

    return errors;
  }
};

export const updateDocumentSchema = {
  body: (body) => {
    const errors = [];

    if (body.title !== undefined && (typeof body.title !== 'string' || body.title.trim().length < 3)) {
      errors.push('Document title must be at least 3 characters');
    }
    if (body.title && body.title.trim().length > 200) {
      errors.push('Document title cannot exceed 200 characters');
    }

    if (body.content !== undefined && (typeof body.content !== 'string' || body.content.trim().length < 10)) {
      errors.push('Document content must be at least 10 characters');
    }

    if (body.documentType && !VALID_DOCUMENT_TYPES.includes(body.documentType.toUpperCase())) {
      errors.push(`Document type must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}`);
    }

    return errors;
  }
};

export const searchKnowledgeSchema = {
  body: (body) => {
    const errors = [];

    if (!body.query || typeof body.query !== 'string' || body.query.trim().length < 2) {
      errors.push('Search query is required and must be at least 2 characters');
    }
    if (body.limit !== undefined && (typeof body.limit !== 'number' || body.limit < 1 || body.limit > 20)) {
      errors.push('Limit must be an integer between 1 and 20');
    }

    return errors;
  }
};
