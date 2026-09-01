/**
 * Request Validation Middleware Helper
 */
import { ApiError } from '../utils/apiError.js';

export function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    // Validate params
    if (schema.params) {
      const paramErrors = schema.params(req.params);
      if (paramErrors && paramErrors.length > 0) {
        errors.push(...paramErrors);
      }
    }

    // Validate query
    if (schema.query) {
      const queryErrors = schema.query(req.query);
      if (queryErrors && queryErrors.length > 0) {
        errors.push(...queryErrors);
      }
    }

    // Validate body
    if (schema.body) {
      const bodyErrors = schema.body(req.body);
      if (bodyErrors && bodyErrors.length > 0) {
        errors.push(...bodyErrors);
      }
    }

    if (errors.length > 0) {
      return next(ApiError.badRequest('Validation failed', errors));
    }

    next();
  };
}
