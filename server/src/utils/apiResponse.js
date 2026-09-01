import { HTTP_STATUS } from './constants.js';

/**
 * Standardized API Response Wrapper
 */
export class ApiResponse {
  /**
   * Send a successful JSON response
   * @param {import('express').Response} res
   * @param {Object} options
   * @param {number} [options.statusCode=200]
   * @param {string} [options.message='Success']
   * @param {*} [options.data=null]
   * @param {Object} [options.meta]
   */
  static success(res, { statusCode = HTTP_STATUS.OK, message = 'Success', data = null, meta = undefined } = {}) {
    const payload = {
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    if (meta !== undefined) {
      payload.meta = meta;
    }

    return res.status(statusCode).json(payload);
  }

  /**
   * Send an error JSON response
   * @param {import('express').Response} res
   * @param {Object} options
   * @param {number} [options.statusCode=500]
   * @param {string} [options.errorCode='INTERNAL_SERVER_ERROR']
   * @param {string} [options.message='An error occurred']
   * @param {*} [options.details=null]
   * @param {string} [options.stack]
   */
  static error(res, {
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errorCode = 'INTERNAL_SERVER_ERROR',
    message = 'An unexpected error occurred',
    details = null,
    stack = undefined
  } = {}) {
    const payload = {
      success: false,
      statusCode,
      error: {
        code: errorCode,
        message,
        details
      },
      timestamp: new Date().toISOString()
    };

    if (stack !== undefined) {
      payload.error.stack = stack;
    }

    return res.status(statusCode).json(payload);
  }
}
