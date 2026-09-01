import { ApiError } from '../utils/apiError.js';

/**
 * 404 Not Found Middleware Handler
 */
export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl} — Route not found`));
};
