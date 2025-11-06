// backend/src/middleware/rateLimitByTier.ts

import { Request, Response, NextFunction } from 'express';
import rateLimit, { RateLimitRequestHandler, ipKeyGenerator } from 'express-rate-limit';
import { AuthRequest } from '../types/auth';
import logger from '../utils/logger';

/**
 * Rate limit configurations by subscription tier
 * NOTE: Must be pre-created at app initialization, NOT dynamically per request
 */
const isDevelopment = process.env.NODE_ENV === 'development';

const getRateLimitKey = (req: Request): string => {
  const authReq = req as AuthRequest;

  if (authReq.user?.userId) {
    return `user:${authReq.user.userId}`;
  }

  const apiKeyHeader = req.headers['x-api-key'];
  if (typeof apiKeyHeader === 'string' && apiKeyHeader.length > 0) {
    return `apiKey:${apiKeyHeader}`;
  }

  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    const [firstIp] = forwardedFor.split(',');
    if (firstIp) {
      return firstIp.trim();
    }
  }

  return ipKeyGenerator(req.ip || req.socket.remoteAddress || '127.0.0.1');
};

const RATE_LIMITS = {
  FREE: {
    windowMs: 60 * 1000, // 1 minute
    max: isDevelopment ? 10000 : 10, // Very high in development (100x higher)
    message: 'Free tier rate limit exceeded. Upgrade for higher limits.'
  },
  STARTER: {
    windowMs: 60 * 1000,
    max: isDevelopment ? 10000 : 30, // Very high in development (100x higher)
    message: 'Starter tier rate limit exceeded. Upgrade for higher limits.'
  },
  PROFESSIONAL: {
    windowMs: 60 * 1000,
    max: isDevelopment ? 10000 : 60, // Very high in development (100x higher)
    message: 'Professional tier rate limit exceeded. Upgrade for higher limits.'
  },
  BUSINESS: {
    windowMs: 60 * 1000,
    max: isDevelopment ? 10000 : 120, // Very high in development (100x higher)
    message: 'Business tier rate limit exceeded. Contact support for custom limits.'
  },
  ENTERPRISE: {
    windowMs: 60 * 1000,
    max: 10000, // Already high, match others in dev
    message: 'Enterprise tier rate limit exceeded. Contact your account manager.'
  }
};

/**
 * Pre-create rate limiters for each tier at app initialization
 */
type TierLimiterKey = keyof typeof RATE_LIMITS;

type RateLimiterWithReset = RateLimitRequestHandler & {
  store?: {
    resetAll?: () => void;
  };
};

const tierLimiters: Record<TierLimiterKey, RateLimiterWithReset> = {
  FREE: rateLimit({
    windowMs: RATE_LIMITS.FREE.windowMs,
    max: RATE_LIMITS.FREE.max,
    message: RATE_LIMITS.FREE.message,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getRateLimitKey,
    skip: (req: Request) => {
      // Skip if authenticated with higher tier (will be checked in middleware)
      const authReq = req as AuthRequest;
      return !!authReq.user?.userId;
    }
  }),
  STARTER: rateLimit({
    windowMs: RATE_LIMITS.STARTER.windowMs,
    max: RATE_LIMITS.STARTER.max,
    message: RATE_LIMITS.STARTER.message,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getRateLimitKey,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  }),
  PROFESSIONAL: rateLimit({
    windowMs: RATE_LIMITS.PROFESSIONAL.windowMs,
    max: RATE_LIMITS.PROFESSIONAL.max,
    message: RATE_LIMITS.PROFESSIONAL.message,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getRateLimitKey,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  }),
  BUSINESS: rateLimit({
    windowMs: RATE_LIMITS.BUSINESS.windowMs,
    max: RATE_LIMITS.BUSINESS.max,
    message: RATE_LIMITS.BUSINESS.message,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getRateLimitKey,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  }),
  ENTERPRISE: rateLimit({
    windowMs: RATE_LIMITS.ENTERPRISE.windowMs,
    max: RATE_LIMITS.ENTERPRISE.max,
    message: RATE_LIMITS.ENTERPRISE.message,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getRateLimitKey,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  })
};

/**
 * Static rate limiting middleware for unauthenticated requests
 */
const unauthenticatedLimiter: RateLimiterWithReset = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Rate limit exceeded. Please authenticate or sign up for higher limits.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: getRateLimitKey,
  skip: (req: Request) => {
    // Skip if authenticated
    const authReq = req as AuthRequest;
    return !!authReq.user?.userId;
  }
});

/**
 * Tier-based rate limiting middleware
 * Routes requests to appropriate pre-created limiter based on subscription tier
 */
export const rateLimitByTier = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  const requestId = (req as any).requestId || 'unknown';
  
  try {
    // If no authenticated user, apply default unauthenticated limit
    if (!authReq.user?.userId) {
      return unauthenticatedLimiter(req, res, next);
    }

    // For authenticated users, check their subscription tier
    let tier = 'FREE';
    
    try {
      const { prisma } = await import('../config/database');
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: authReq.user.userId,
          status: 'ACTIVE'
        },
        include: {
          plan: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (subscription && subscription.plan) {
        const planName = subscription.plan.name.toUpperCase();
        if (planName.includes('STARTER')) tier = 'STARTER';
        else if (planName.includes('PROFESSIONAL') || planName.includes('PRO')) tier = 'PROFESSIONAL';
        else if (planName.includes('BUSINESS')) tier = 'BUSINESS';
        else if (planName.includes('ENTERPRISE')) tier = 'ENTERPRISE';
      }
    } catch (error: any) {
      logger.debug(`[${requestId}] Could not fetch subscription, using FREE tier:`, error.message);
      tier = 'FREE';
    }

    // Use the appropriate pre-created limiter for this tier
    const selectedLimiter = tierLimiters[tier as keyof typeof tierLimiters] || tierLimiters.FREE;
    return selectedLimiter(req, res, next);
  } catch (error: any) {
    logger.error(`[${requestId}] Rate limit middleware error:`, error.message);
    // Fallback to unauthenticated limiter on error
    return unauthenticatedLimiter(req, res, next);
  }
};

export const resetTierLimiters = () => {
  Object.values(tierLimiters).forEach(limiter => {
    limiter.store?.resetAll?.();
  });
  unauthenticatedLimiter.store?.resetAll?.();
};

export default rateLimitByTier;
