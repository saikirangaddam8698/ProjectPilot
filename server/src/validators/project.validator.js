/**
 * Project Request Validators
 */
const VALID_PROJECT_STATUSES = ['ACTIVE', 'PLANNING', 'COMPLETED', 'ARCHIVED'];

export const createProjectSchema = {
  body: (body) => {
    const errors = [];
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      errors.push('Project name is required and must be a non-empty string');
    }
    if (body.key && (typeof body.key !== 'string' || body.key.trim().length < 2)) {
      errors.push('Project key must be at least 2 characters');
    }
    if (body.status && !VALID_PROJECT_STATUSES.includes(body.status.toUpperCase())) {
      errors.push(`Status must be one of: ${VALID_PROJECT_STATUSES.join(', ')}`);
    }
    return errors;
  }
};

export const updateProjectSchema = {
  body: (body) => {
    const errors = [];
    if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim())) {
      errors.push('Project name must be a non-empty string');
    }
    if (body.status && !VALID_PROJECT_STATUSES.includes(body.status.toUpperCase())) {
      errors.push(`Status must be one of: ${VALID_PROJECT_STATUSES.join(', ')}`);
    }
    return errors;
  }
};

export const addProjectMemberSchema = {
  body: (body) => {
    const errors = [];
    if (!body.memberId && (!body.name || !body.email)) {
      errors.push('Either memberId or member name and email are required');
    }
    if (body.email && !body.email.includes('@')) {
      errors.push('A valid email address is required');
    }
    return errors;
  }
};
