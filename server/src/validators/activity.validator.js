/**
 * Activity Request Validators
 */
export const recordActivitySchema = {
  body: (body) => {
    const errors = [];
    if (!body.projectKey || typeof body.projectKey !== 'string') {
      errors.push('projectKey is required');
    }
    if (!body.message || typeof body.message !== 'string' || !body.message.trim()) {
      errors.push('Activity message is required');
    }
    return errors;
  }
};
