// backend/src/app.ts

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import logger from './utils/logger';
import metricsCollector from './utils/metricsCollector';
import usageTrackingMiddleware from './middleware/usageTracking';
import quotaEnforcementMiddleware from './middleware/quotaEnforcement';
import rateLimitByTier from './middleware/rateLimitByTier';

// Import routes
import authRoutes from './routes/authRoutes';
import accountRoutes from './routes/accountRoutes';
import apiKeyRoutes from './routes/apiKeyRoutes';
import usageRoutes from './routes/usageRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import billingRoutes from './routes/billingRoutes';
import adminAnalyticsRoutes from './routes/admin/analyticsRoutes';
import adminUsersRoutes from './routes/admin/usersRoutes';
import adminPlansRoutes from './routes/admin/plansRoutes';
import webhookRoutes from './routes/webhookRoutes';
import oauthRoutes from './routes/oauthRoutes';
import twoFactorRoutes from './routes/twoFactorRoutes';
import metricsRoutes from './routes/metricsRoutes';
import conversionRoutes from './routes/conversionRoutes';

const app: Express = express();

// ===== Middleware =====

// Trust proxy - needed for Codespaces and production environments with reverse proxies
app.set('trust proxy', 1);

// Security middleware with enhanced configuration
app.use(helmet({
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
app.use(compression());

// CORS configuration - Smart handling for development, strict for production
const getCorsOrigin = () => {
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  
  if (isDevelopment) {
    // In development, accept requests from common local addresses and Codespaces domains
    return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests without origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      // Check if it's localhost
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      
      // Check if it's a Codespaces domain (*.github.dev)
      if (origin.includes('.github.dev') || origin.includes('app.github.dev')) {
        return callback(null, true);
      }
      
      // Check env variable CORS_ORIGINS
      const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map((o: string) => o.trim()) || [];
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      logger.warn(`CORS rejected origin in dev mode: ${origin}`);
      return callback(null, true); // Still allow, but log it
    };
  } else {
    // In production, strictly enforce CORS_ORIGINS
    return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      
      const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map((o: string) => o.trim()) || [];
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      logger.error(`CORS rejected origin in production: ${origin}`);
      return callback(new Error('CORS policy violation'), false);
    };
  }
};

app.use(cors({
  origin: getCorsOrigin(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'Accept', 'X-Request-ID'],
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-Quota-Limit',
    'X-Quota-Used',
    'X-Quota-Remaining',
    'X-Quota-Reset'
  ],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Cookie parser
app.use(cookieParser());

// Request ID tracking middleware (must be early in chain)
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
});

// Basic IP-based rate limiting for all API routes (security layer)
const ipLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 200, // Much more generous in development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skip: (req: Request) => {
    // Skip rate limiting for health check endpoint
    return req.path === '/health' || req.path === '/api/health';
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`IP rate limit exceeded for: ${req.ip}, RequestID: ${(req as any).requestId}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later',
      statusCode: 429,
      requestId: (req as any).requestId
    });
  }
});
app.use('/api/', ipLimiter);

// Tier-based rate limiting (applied after authentication)
app.use('/api/', rateLimitByTier);

// Request logging middleware with request ID
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  logger.info(`[${(req as any).requestId}] ${req.method} ${req.path}`);
  
  // Track metrics on response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    metricsCollector.trackRequest(req.method, req.path, res.statusCode, duration);
  });
  
  next();
});

// Usage tracking middleware (for billing and analytics)
app.use('/api/user', usageTrackingMiddleware);
app.use('/api/admin', usageTrackingMiddleware);

// Quota enforcement middleware (check monthly limits) - only for user endpoints
app.use('/api/user', quotaEnforcementMiddleware);

// ===== Health Check =====
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Metrics endpoint
app.use('/api/metrics', metricsRoutes);

// ===== API Routes =====

// User routes (protected)
app.use('/api/user/account', accountRoutes);
app.use('/api/user/api-keys', apiKeyRoutes);
app.use('/api/user/usage', usageRoutes);
app.use('/api/user/subscription', subscriptionRoutes);
app.use('/api/user/billing', billingRoutes);

// Admin routes (protected & admin only)
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/plans', adminPlansRoutes);

// Public auth routes
app.use('/api/auth', authRoutes);

// OAuth routes (public)
app.use('/api/oauth', oauthRoutes);

// 2FA routes (public - auth middleware added in routes)
app.use('/api/2fa', twoFactorRoutes);

// Webhook routes (verify signature, not protected)
app.use('/api/stripe', webhookRoutes);

// Conversion routes (public - no auth required)
app.use('/api', conversionRoutes);

// ===== Error Handling =====

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    statusCode: 404
  });
});

// Global error handler - never expose stack traces
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const requestId = (req as any).requestId || 'unknown';
  
  // Log full error details internally
  logger.error(`[${requestId}] Unhandled error:`, {
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method
  });

  const statusCode = err.statusCode || 500;
  
  // Generic error messages for production
  const clientMessage = statusCode >= 500 
    ? 'An internal error occurred. Please contact support with request ID.' 
    : err.message || 'Request failed';

  res.status(statusCode).json({
    success: false,
    error: clientMessage,
    statusCode,
    requestId
    // Never include: stack, internal paths, sensitive data
  });
});

export default app;
