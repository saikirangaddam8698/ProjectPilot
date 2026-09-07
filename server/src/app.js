import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { getCorsOptions } from './config/cors.js';
import { requestLogger } from './middleware/requestLogger.js';
import { requestId } from './middleware/requestId.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

// 1. Security Headers Middleware
app.use(helmet());

// 2. Request Correlation ID Middleware
app.use(requestId);

// 3. CORS Policy Middleware
app.use(cors(getCorsOptions()));

// 4. Cookie Parsing Middleware
app.use(cookieParser());

// 5. Body Parsing Middleware with sensible limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 6. HTTP Request Logging Middleware
app.use(requestLogger);

// 6. Rate Limiter Middleware for API endpoints
app.use('/api', rateLimiter);

// 7. Application Routes
app.use('/', routes);

// 8. 404 Catch-All Middleware
app.use(notFoundHandler);

// 9. Global Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
