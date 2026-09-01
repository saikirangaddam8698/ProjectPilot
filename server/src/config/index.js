import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const env = process.env.NODE_ENV || 'development';

export const config = {
  env,
  isProduction: env === 'production',
  isDevelopment: env === 'development',
  isTest: env === 'test',
  port: parseInt(process.env.PORT, 10) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/projectpilot?schema=public&connection_limit=10&pool_timeout=10'
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'projectpilot-dev-jwt-super-secret-key-32-chars-minimum',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieName: 'projectpilot_token',
    cookieMaxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 mins
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100 // 100 requests per window
  },
  logLevel: process.env.LOG_LEVEL || (env === 'test' ? 'error' : 'info')
};
