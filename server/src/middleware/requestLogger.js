import morgan from 'morgan';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// Custom morgan stream to use our structured logger
const stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Skip logging during test runs unless error
const skip = () => config.isTest;

// Use 'dev' format in development and 'combined' in production
export const requestLogger = config.isDevelopment
  ? morgan('dev', { skip })
  : morgan('combined', { stream, skip });
