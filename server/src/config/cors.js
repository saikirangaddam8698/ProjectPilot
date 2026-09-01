import { config } from './index.js';

/**
 * Configure CORS options based on clientOrigin and environment
 */
export const getCorsOptions = () => {
  const allowedOrigins = config.clientOrigin.split(',').map((o) => o.trim());

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin) || config.isDevelopment) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 86400 // 24 hours preflight cache
  };
};
