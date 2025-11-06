// backend/src/middleware/usageTracking.ts

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
import logger from '../utils/logger';
import { prisma } from '../config/database';

/**
 * Middleware to track API usage for billing and analytics
 */
export const usageTrackingMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const authReq = req as AuthRequest;
  const requestId = (req as any).requestId || 'unknown';

  // Skip if not authenticated
  if (!authReq.user?.userId) {
    return next();
  }

  // Prepare usage data
  const usageData = {
    userId: authReq.user.userId,
    apiKeyId: authReq.apiKey?.id,
    endpoint: req.path,
    method: req.method,
    statusCode: res.statusCode,
    responseTimeMs: 0,
    tokensUsed: 1,
    cost: 0,
    ipAddress: req.ip || '',
    userAgent: req.headers['user-agent']?.toString(),
    errorMessage: undefined as string | undefined,
    timestamp: new Date()
  };

  // Capture the original end function
  const originalEnd = res.end;
  
  // Override res.end to capture when response is sent
  res.end = function(chunk?: any, encoding?: any, callback?: any): any {
    // Restore original end
    res.end = originalEnd;
    
    // Calculate final response time
    usageData.responseTimeMs = Date.now() - startTime;
    usageData.statusCode = res.statusCode;
    
    // Add error message if needed
    if (res.statusCode >= 400) {
      usageData.errorMessage = 'Error occurred';
    }
    
    // Track usage immediately before sending response
    prisma.usageLog.create({ data: usageData })
      .catch(err => {
        logger.error(`[${requestId}] Failed to track usage:`, err);
      });
    
    // Call original end
    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
};

export default usageTrackingMiddleware;
