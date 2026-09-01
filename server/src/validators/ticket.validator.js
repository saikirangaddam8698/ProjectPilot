/**
 * Ticket Request Validators
 */
const VALID_TICKET_TYPES = ['TASK', 'BUG', 'STORY', 'EPIC'];
const VALID_TICKET_STATUSES = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const VALID_TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export const createTicketSchema = {
  body: (body) => {
    const errors = [];
    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      errors.push('Ticket title is required and must be a non-empty string');
    }
    if (!body.projectKey || typeof body.projectKey !== 'string') {
      errors.push('Project key is required');
    }
    if (body.type && !VALID_TICKET_TYPES.includes(body.type.toUpperCase().replace(/\s+/g, '_'))) {
      errors.push(`Type must be one of: ${VALID_TICKET_TYPES.join(', ')}`);
    }
    if (body.status && !VALID_TICKET_STATUSES.includes(body.status.toUpperCase().replace(/\s+/g, '_'))) {
      errors.push(`Status must be one of: ${VALID_TICKET_STATUSES.join(', ')}`);
    }
    if (body.priority && !VALID_TICKET_PRIORITIES.includes(body.priority.toUpperCase().replace(/\s+/g, '_'))) {
      errors.push(`Priority must be one of: ${VALID_TICKET_PRIORITIES.join(', ')}`);
    }
    if (body.storyPoints !== undefined && (isNaN(Number(body.storyPoints)) || Number(body.storyPoints) < 0)) {
      errors.push('Story points must be a non-negative number');
    }
    return errors;
  }
};

export const updateTicketSchema = {
  body: (body) => {
    const errors = [];
    if (body.title !== undefined && (typeof body.title !== 'string' || !body.title.trim())) {
      errors.push('Ticket title must be a non-empty string');
    }
    if (body.type && !VALID_TICKET_TYPES.includes(body.type.toUpperCase().replace(/\s+/g, '_'))) {
      errors.push(`Type must be one of: ${VALID_TICKET_TYPES.join(', ')}`);
    }
    if (body.status && !VALID_TICKET_STATUSES.includes(body.status.toUpperCase().replace(/\s+/g, '_'))) {
      errors.push(`Status must be one of: ${VALID_TICKET_STATUSES.join(', ')}`);
    }
    if (body.priority && !VALID_TICKET_PRIORITIES.includes(body.priority.toUpperCase().replace(/\s+/g, '_'))) {
      errors.push(`Priority must be one of: ${VALID_TICKET_PRIORITIES.join(', ')}`);
    }
    if (body.storyPoints !== undefined && (isNaN(Number(body.storyPoints)) || Number(body.storyPoints) < 0)) {
      errors.push('Story points must be a non-negative number');
    }
    return errors;
  }
};

export const updateTicketStatusSchema = {
  body: (body) => {
    const errors = [];
    if (!body.status || !VALID_TICKET_STATUSES.includes(body.status.toUpperCase().replace(/\s+/g, '_'))) {
      errors.push(`Status must be one of: ${VALID_TICKET_STATUSES.join(', ')}`);
    }
    return errors;
  }
};

export const updateTicketPrioritySchema = {
  body: (body) => {
    const errors = [];
    if (!body.priority || !VALID_TICKET_PRIORITIES.includes(body.priority.toUpperCase().replace(/\s+/g, '_'))) {
      errors.push(`Priority must be one of: ${VALID_TICKET_PRIORITIES.join(', ')}`);
    }
    return errors;
  }
};

export const reassignMemberTicketsSchema = {
  body: (body) => {
    const errors = [];
    if (!body.projectKey) {
      errors.push('projectKey is required');
    }
    if (!body.memberId) {
      errors.push('memberId is required');
    }
    return errors;
  }
};
