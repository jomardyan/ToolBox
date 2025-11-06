// backend/src/middleware/rateLimitByTier.ts

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthRequest } from '../types/auth';
import logger from '../utils/logger';

/**
 * Rate limit configurations by subscription tier
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
 * Dynamic rate limiting based on user's subscription tier
 */
export const rateLimitByTier = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  const requestId = (req as any).requestId || 'unknown';
  
  try {
    // If no authenticated user, apply default strict limit
    if (!authReq.user?.userId) {
      const defaultLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 10,
        message: 'Rate limit exceeded. Please authenticate or sign up for higher limits.',
        standardHeaders: true,
        legacyHeaders: false
      });
      return defaultLimiter(req, res, next);
    }

    // Get user's subscription tier
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
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

      let tierConfig = RATE_LIMITS.FREE;

      if (subscription && subscription.plan) {
        // Use plan's rate limit if defined
        if (subscription.plan.rateLimit) {
          tierConfig = {
            windowMs: 60 * 1000,
            max: subscription.plan.rateLimit,
            message: `${subscription.plan.name} tier rate limit exceeded.`
          };
        } else {
          // Fallback to predefined tiers based on plan name
          const planName = subscription.plan.name.toUpperCase();
          if (planName.includes('STARTER')) tierConfig = RATE_LIMITS.STARTER;
          else if (planName.includes('PROFESSIONAL') || planName.includes('PRO')) tierConfig = RATE_LIMITS.PROFESSIONAL;
          else if (planName.includes('BUSINESS')) tierConfig = RATE_LIMITS.BUSINESS;
          else if (planName.includes('ENTERPRISE')) tierConfig = RATE_LIMITS.ENTERPRISE;
        }
      }

      // Create rate limiter with tier-specific config
      const tierLimiter = rateLimit({
        ...tierConfig,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req: Request, res: Response) => {
          logger.warn(`[${requestId}] Rate limit exceeded for user ${authReq.user?.userId}`);
          res.status(429).json({
            success: false,
            error: tierConfig.message,
            statusCode: 429,
            requestId,
            retryAfter: Math.ceil(tierConfig.windowMs / 1000)
          });
        }
      });

      await prisma.$disconnect();
      return tierLimiter(req, res, next);
    } catch (error) {
      await prisma.$disconnect();
      throw error;
    }
  } catch (error: any) {
    logger.error(`[${requestId}] Rate limit tier check error:`, error);
    // Fallback to default rate limit on error
    const defaultLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false
    });
    return defaultLimiter(req, res, next);
  }
};

export default rateLimitByTier;
