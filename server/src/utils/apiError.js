import { HTTP_STATUS, ERROR_CODES } from './constants.js';

/**
 * Custom Operational API Error
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {string} [errorCode]
   * @param {*} [details=null]
   * @param {boolean} [isOperational=true]
   */
  constructor(
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message = 'Internal Server Error',
    errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR,
    details = null,
    isOperational = true
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', details = null) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, ERROR_CODES.BAD_REQUEST, details);
  }

  static validation(message = 'Validation Failed', details = null) {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, ERROR_CODES.VALIDATION_ERROR, details);
  }

  static unauthorized(message = 'Unauthorized', details = null) {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message, ERROR_CODES.UNAUTHORIZED, details);
  }

  static forbidden(message = 'Forbidden', details = null) {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message, ERROR_CODES.FORBIDDEN, details);
  }

  static notFound(message = 'Resource Not Found', details = null) {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message, ERROR_CODES.NOT_FOUND, details);
  }

  static conflict(message = 'Resource Conflict', details = null) {
    return new ApiError(HTTP_STATUS.CONFLICT, message, ERROR_CODES.CONFLICT, details);
  }

  static rateLimit(message = 'Too Many Requests', details = null) {
    return new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, message, ERROR_CODES.RATE_LIMIT_EXCEEDED, details);
  }

  static tooManyRequests(message = 'Too Many Requests', details = null) {
    return this.rateLimit(message, details);
  }

  static internal(message = 'Internal Server Error', details = null) {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, ERROR_CODES.INTERNAL_SERVER_ERROR, details, false);
  }

  static serviceUnavailable(message = 'Database service is currently unavailable. Please verify PostgreSQL is running.', details = null) {
    return new ApiError(HTTP_STATUS.SERVICE_UNAVAILABLE, message, ERROR_CODES.SERVICE_UNAVAILABLE, details, true);
  }
}

