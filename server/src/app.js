import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { getCorsOptions } from './config/cors.js';
import { requestLogger } from './middleware/requestLogger.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

// 1. Security Headers Middleware
app.use(helmet());

// 2. CORS Policy Middleware
app.use(cors(getCorsOptions()));

// 3. Body Parsing Middleware with sensible limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. HTTP Request Logging Middleware
app.use(requestLogger);

// 5. Rate Limiter Middleware for API endpoints
app.use('/api', rateLimiter);

// 6. Application Routes
app.use('/', routes);

// 7. 404 Catch-All Middleware
app.use(notFoundHandler);

// 8. Global Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
