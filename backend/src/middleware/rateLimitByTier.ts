// backend/src/middleware/rateLimitByTier.ts

import { Request, Response, NextFunction } from 'express';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { AuthRequest } from '../types/auth';
import logger from '../utils/logger';

/**
 * Rate limit configurations by subscription tier
 * NOTE: Must be pre-created at app initialization, NOT dynamically per request
 */
const RATE_LIMITS = {
  FREE: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: 'Free tier rate limit exceeded. Upgrade for higher limits.'
  },
  STARTER: {
    windowMs: 60 * 1000,
    max: 30, // 30 requests per minute
    message: 'Starter tier rate limit exceeded. Upgrade for higher limits.'
  },
  PROFESSIONAL: {
    windowMs: 60 * 1000,
    max: 60, // 60 requests per minute
    message: 'Professional tier rate limit exceeded. Upgrade for higher limits.'
  },
  BUSINESS: {
    windowMs: 60 * 1000,
    max: 120, // 120 requests per minute
    message: 'Business tier rate limit exceeded. Contact support for custom limits.'
  },
  ENTERPRISE: {
    windowMs: 60 * 1000,
    max: 1000, // 1000 requests per minute (or custom)
    message: 'Enterprise tier rate limit exceeded. Contact your account manager.'
  }
};

/**
 * Pre-create rate limiters for each tier at app initialization
 */
const tierLimiters = {
  FREE: rateLimit({
    windowMs: RATE_LIMITS.FREE.windowMs,
    max: RATE_LIMITS.FREE.max,
    message: RATE_LIMITS.FREE.message,
    standardHeaders: true,
    legacyHeaders: false,
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
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  }),
  PROFESSIONAL: rateLimit({
    windowMs: RATE_LIMITS.PROFESSIONAL.windowMs,
    max: RATE_LIMITS.PROFESSIONAL.max,
    message: RATE_LIMITS.PROFESSIONAL.message,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  }),
  BUSINESS: rateLimit({
    windowMs: RATE_LIMITS.BUSINESS.windowMs,
    max: RATE_LIMITS.BUSINESS.max,
    message: RATE_LIMITS.BUSINESS.message,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  }),
  ENTERPRISE: rateLimit({
    windowMs: RATE_LIMITS.ENTERPRISE.windowMs,
    max: RATE_LIMITS.ENTERPRISE.max,
    message: RATE_LIMITS.ENTERPRISE.message,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  })
};

/**
 * Static rate limiting middleware for unauthenticated requests
 */
const unauthenticatedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Rate limit exceeded. Please authenticate or sign up for higher limits.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
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

export default rateLimitByTier;
