import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { permissionRoutes } from './modules/permission/permission.routes';

/**
 * Express application instance.
 * Configures global middleware: CORS, security headers, compression, logging, error handling.
 */
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression for response size reduction
app.use(compression());

// Request logging (development only)
if (env.nodeEnv === 'development') {
  app.use(requestLogger);
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes - Mount auth routes
authRoutes(app);

// Mount permission routes (requires authentication)
permissionRoutes(app);

// Global error handler — must be last
app.use(errorHandler);

export default app;