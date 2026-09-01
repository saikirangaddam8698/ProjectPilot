/**
 * Member Request Validators
 */
const VALID_MEMBER_STATUSES = ['ACTIVE', 'AWAY', 'OFFLINE'];

export const createMemberSchema = {
  body: (body) => {
    const errors = [];
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      errors.push('Member name is required');
    }
    if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
      errors.push('A valid email address is required');
    }
    if (body.status && !VALID_MEMBER_STATUSES.includes(body.status.toUpperCase())) {
      errors.push(`Status must be one of: ${VALID_MEMBER_STATUSES.join(', ')}`);
    }
    if (body.capacity !== undefined && (isNaN(Number(body.capacity)) || Number(body.capacity) < 0)) {
      errors.push('Capacity must be a non-negative number');
    }
    return errors;
  }
};

export const updateMemberSchema = {
  body: (body) => {
    const errors = [];
    if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim())) {
      errors.push('Member name must be a non-empty string');
    }
    if (body.email !== undefined && (!body.email || !body.email.includes('@'))) {
      errors.push('A valid email address is required');
    }
    if (body.status && !VALID_MEMBER_STATUSES.includes(body.status.toUpperCase())) {
      errors.push(`Status must be one of: ${VALID_MEMBER_STATUSES.join(', ')}`);
    }
    if (body.capacity !== undefined && (isNaN(Number(body.capacity)) || Number(body.capacity) < 0)) {
      errors.push('Capacity must be a non-negative number');
    }
    return errors;
  }
};
