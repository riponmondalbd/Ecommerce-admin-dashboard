import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { permissionRoutes } from './modules/permission/permission.routes';
import { roleRoutes } from './modules/role/role.routes';
import { userRoutes } from './modules/user/user.routes';
import { mediaRoutes } from './modules/media/media.routes';
import { categoryRoutes } from './modules/category/category.routes';
import { brandRoutes } from './modules/brand/brand.routes';
import { attributeRoutes } from './modules/attribute/attribute.routes';
import { productRoutes } from './modules/product/product.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';

/**
 * Express application instance.
 * Configures global middleware: CORS, security headers, compression, logging, error handling.
 */
const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'http://localhost:5000', 'blob:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      scriptSrc: ["'self'"],
    },
  },
}));
app.use(cors({ origin: true, credentials: true }));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression for response size reduction
app.use(compression());

// Serve static uploaded files — with cross-origin headers so browsers on other ports can load images
app.use('/uploads', (_req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// Request logging (development only)
if (env.nodeEnv === 'development') {
  app.use(requestLogger);
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rate limiter for authentication endpoints — relaxed in development
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.nodeEnv === 'production' ? 10 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.nodeEnv === 'development', // Completely bypass in dev
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});

// Apply rate limiter to auth routes
app.use('/api/auth', authLimiter);

// API routes - Mount auth routes
authRoutes(app);

// Mount permission routes (requires authentication)
permissionRoutes(app);

// Mount role routes (requires authentication and proper permissions)
roleRoutes(app);

// Mount user routes (requires authentication and proper permissions)
userRoutes(app);

// Mount media routes (upload, thumbnails, delete, filter)
mediaRoutes(app);

// Mount category routes (nested tree, cycle detection, slug validation)
categoryRoutes(app);

// Mount brand routes (CRUD, status management, logo upload with media integration)
brandRoutes(app);

// Mount attribute routes (CRUD, values, color/image types)
attributeRoutes(app);

// Mount product routes (star feature: products, variants, inventory, transactions)
productRoutes(app);

// Mount dashboard routes (aggregate stats)
dashboardRoutes(app);

// Global error handler — must be last
app.use(errorHandler);

export default app;
