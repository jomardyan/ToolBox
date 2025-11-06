// backend/src/middleware/usageTracking.ts

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
import logger from '../utils/logger';

/**
 * Middleware to track API usage for billing and analytics
 */
export const usageTrackingMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const authReq = req as AuthRequest;
  const requestId = (req as any).requestId || 'unknown';

  // Capture the original end function
  const originalEnd = res.end;
  
  // Override res.end to capture when response is sent
  res.end = function(chunk?: any, encoding?: any, callback?: any): any {
    // Restore original end
    res.end = originalEnd;
    
    // Call original end
    const result = res.end(chunk, encoding, callback);
    
    // Track usage asynchronously (don't block response)
    trackUsage().catch(err => {
      logger.error(`[${requestId}] Failed to track usage:`, err);
    });
    
    return result;
  };

  async function trackUsage() {
    try {
      const responseTimeMs = Date.now() - startTime;
      const userId = authReq.user?.userId;
      const apiKeyId = authReq.apiKey?.id;
      
      // Only track if user is authenticated (skip public endpoints)
      if (!userId) {
        return;
      }

      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      try {
        await prisma.usageLog.create({
          data: {
            userId,
            apiKeyId: apiKeyId || null,
            endpoint: req.path,
            method: req.method,
            statusCode: res.statusCode,
            responseTimeMs,
            tokensUsed: 1, // Could be calculated based on request/response size
            cost: 0, // Could be calculated based on pricing tier
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || null,
            errorMessage: res.statusCode >= 400 ? 'Error occurred' : null,
            timestamp: new Date()
          }
        });

        logger.debug(`[${requestId}] Usage tracked for user ${userId}: ${req.method} ${req.path} (${responseTimeMs}ms)`);
      } finally {
        await prisma.$disconnect();
      }
    } catch (error: any) {
      // Don't throw - usage tracking shouldn't break the request
      logger.error(`[${requestId}] Usage tracking error:`, error);
    }
  }

  next();
};

export default usageTrackingMiddleware;
