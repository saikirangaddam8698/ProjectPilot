/**
 * Auth Request Validators
 */
export const loginSchema = {
  body: (body) => {
    const errors = [];
    if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
      errors.push('A valid email address is required');
    }
    if (!body.password || typeof body.password !== 'string' || body.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
    return errors;
  }
};
