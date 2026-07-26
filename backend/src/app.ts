import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';

/**
 * Express application instance.
 * Configures global middleware: CORS, security headers, compression, logging, error handling.
 */
const app: Application = express();

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

// API routes placeholder — modules will be mounted here in later phases
// app.use('/api/auth', authRoutes);

// Global error handler — must be last
app.use(errorHandler);

export default app;
