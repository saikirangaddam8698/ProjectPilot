import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS, ERROR_CODES } from '../utils/constants.js';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true, // Return standard RateLimit headers in response
  legacyHeaders: false, // Disable X-RateLimit-* legacy headers
  skip: () => config.isTest, // Disable in test environment
  handler: (req, res) => {
    return ApiResponse.error(res, {
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      errorCode: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests from this IP. Please try again later.'
    });
  }
});
