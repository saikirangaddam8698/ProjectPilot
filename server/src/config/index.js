import dotenv from 'dotenv';
import { RAG_CONFIG } from './rag.config.js';
import { AI_HARDENING_CONFIG } from './ai.config.js';

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
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    cookieName: 'projectpilot_token',
    cookieMaxAge: 1 * 60 * 60 * 1000 // 1 hour in ms (3600000 ms)
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 mins
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100 // 100 requests per window
  },
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    rateLimitWindowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000, // 1 min
    rateLimitMax: parseInt(process.env.AI_RATE_LIMIT_MAX, 10) || 100, // 100 requests per min
    hardening: AI_HARDENING_CONFIG
  },
  rag: RAG_CONFIG,
  logLevel: process.env.LOG_LEVEL || (env === 'test' ? 'error' : 'info')
};

/**
 * Validate server environment configuration on startup
 * @returns {object} Validation report { valid, warnings }
 */
export function validateEnv() {
  const warnings = [];
  if (!process.env.DATABASE_URL && config.isProduction) {
    warnings.push('DATABASE_URL is not set for production environment.');
  }
  if (!process.env.JWT_SECRET && config.isProduction) {
    warnings.push('JWT_SECRET is using default fallback in production.');
  }
  if (!process.env.GEMINI_API_KEY) {
    warnings.push('GEMINI_API_KEY is not configured in current environment.');
  }
  return { valid: true, warnings };
}
