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

  // Detect PostgreSQL / Prisma connection & initialization failures
  const isPrismaDbUnavailable =
    err.name === 'PrismaClientInitializationError' ||
    err.name === 'PrismaClientRustPanicError' ||
    ['P1000', 'P1001', 'P1002', 'P1003', 'P1008', 'P1017'].includes(err.code) ||
    (typeof err.message === 'string' && (
      err.message.includes("Can't reach database server") ||
      err.message.includes('ECONNREFUSED') ||
      err.message.includes('Connection refused') ||
      err.message.includes('connect ECONNREFUSED')
    ));

  if (isPrismaDbUnavailable) {
    error = ApiError.serviceUnavailable(
      'Database service is currently unavailable. Please verify PostgreSQL is running at localhost:5432.'
    );
    error.stack = err.stack;
  } else if (!(error instanceof ApiError)) {
    // Convert non-ApiError exceptions to ApiError
    const statusCode = error.statusCode || error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Internal Server Error';
    const errorCode = error.code || ERROR_CODES.INTERNAL_SERVER_ERROR;
    error = new ApiError(statusCode, message, errorCode, null, false);
    error.stack = err.stack;
  }

  // Log 500s or unexpected system errors
  if (!error.isOperational || (error.statusCode >= 500 && error.statusCode !== HTTP_STATUS.SERVICE_UNAVAILABLE)) {
    logger.error(`[Unhandled/Server Error] ${req.method} ${req.originalUrl}: ${error.message}`, {
      stack: error.stack,
      details: error.details
    });
  } else if (error.statusCode === HTTP_STATUS.SERVICE_UNAVAILABLE) {
    logger.warn(`[503 Service Unavailable] ${req.method} ${req.originalUrl}: ${error.message}`);
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
