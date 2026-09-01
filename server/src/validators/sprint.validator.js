/**
 * Sprint Request Validators
 */
const VALID_SPRINT_STATUSES = ['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

export const createSprintSchema = {
  body: (body) => {
    const errors = [];
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      errors.push('Sprint name is required');
    }
    if (!body.projectKey && !body.projectId) {
      errors.push('projectKey or projectId is required');
    }
    if (body.capacity !== undefined && (isNaN(Number(body.capacity)) || Number(body.capacity) < 0)) {
      errors.push('Capacity must be a non-negative number');
    }
    return errors;
  }
};

export const updateSprintSchema = {
  body: (body) => {
    const errors = [];
    if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim())) {
      errors.push('Sprint name must be a non-empty string');
    }
    if (body.status && !VALID_SPRINT_STATUSES.includes(body.status.toUpperCase())) {
      errors.push(`Status must be one of: ${VALID_SPRINT_STATUSES.join(', ')}`);
    }
    if (body.capacity !== undefined && (isNaN(Number(body.capacity)) || Number(body.capacity) < 0)) {
      errors.push('Capacity must be a non-negative number');
    }
    return errors;
  }
};
