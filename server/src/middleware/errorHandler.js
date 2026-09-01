import { config } from '../config/index.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS, ERROR_CODES } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

/**
 * Centralized Global Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Convert non-ApiError exceptions to ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Internal Server Error';
    const errorCode = error.code || ERROR_CODES.INTERNAL_SERVER_ERROR;
    error = new ApiError(statusCode, message, errorCode, null, false);
    error.stack = err.stack;
  }

  // Log non-operational errors or 500s
  if (!error.isOperational || error.statusCode >= 500) {
    logger.error(`[Unhandled/Server Error] ${req.method} ${req.originalUrl}: ${error.message}`, {
      stack: error.stack,
      details: error.details
    });
  }

  const responsePayload = {
    statusCode: error.statusCode,
    errorCode: error.errorCode,
    message: error.message,
    details: error.details
  };

  // Include stack trace only in development and non-production environments
  if (!config.isProduction && error.stack) {
    responsePayload.stack = error.stack;
  }

  return ApiResponse.error(res, responsePayload);
};
