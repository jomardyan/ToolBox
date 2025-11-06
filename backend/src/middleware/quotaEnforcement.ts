// backend/src/middleware/quotaEnforcement.ts

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
import logger from '../utils/logger';

/**
 * Middleware to enforce monthly API usage quotas based on subscription plan
 */
export const quotaEnforcementMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  const requestId = (req as any).requestId || 'unknown';

  try {
    // Skip quota check for unauthenticated requests
    if (!authReq.user?.userId) {
      return next();
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Get user's active subscription
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

      // If plan has unlimited quota (explicitly null), skip check
      if (subscription?.plan?.monthlyLimit === null) {
        await prisma.$disconnect();
        return next();
      }

      // If no subscription, apply free tier limits
      const monthlyLimit = subscription?.plan?.monthlyLimit ?? 1000; // Default 1000 for free tier

      // Get current billing cycle dates
      const now = new Date();
      const cycleStart = subscription?.billingCycleStart || new Date(now.getFullYear(), now.getMonth(), 1);
      const cycleEnd = subscription?.billingCycleEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Count usage in current billing cycle
      const usageCount = await prisma.usageLog.count({
        where: {
          userId: authReq.user.userId,
          timestamp: {
            gte: cycleStart,
            lte: cycleEnd
          },
          statusCode: {
            lt: 500 // Only count successful requests (not server errors)
          }
        }
      });

      // Check if quota exceeded
      if (usageCount >= monthlyLimit) {
        logger.warn(`[${requestId}] Monthly quota exceeded for user ${authReq.user.userId}: ${usageCount}/${monthlyLimit}`);
        
        await prisma.$disconnect();
        
        return res.status(429).json({
          success: false,
          error: 'Monthly API quota exceeded',
          statusCode: 429,
          requestId,
          quota: {
            limit: monthlyLimit,
            used: usageCount,
            remaining: 0,
            resetDate: cycleEnd
          },
          upgradeUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/subscription/upgrade` : undefined
        });
      }

      // Add quota info to response headers
      res.setHeader('X-Quota-Limit', monthlyLimit.toString());
      res.setHeader('X-Quota-Used', usageCount.toString());
      res.setHeader('X-Quota-Remaining', (monthlyLimit - usageCount).toString());
      res.setHeader('X-Quota-Reset', cycleEnd.toISOString());

      await prisma.$disconnect();
      next();
    } catch (error) {
      await prisma.$disconnect();
      throw error;
    }
  } catch (error: any) {
    logger.error(`[${requestId}] Quota enforcement error:`, error);
    // On error, allow request to proceed (fail open)
    next();
  }
};

export default quotaEnforcementMiddleware;
