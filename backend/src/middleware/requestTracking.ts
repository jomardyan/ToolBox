// backend/src/middleware/requestTracking.ts

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Extended request with tracking metadata
 */
export interface TrackedRequest extends Request {
  requestId: string;
  startTime: number;
}

/**
 * Middleware to add request ID and timing to all requests
 */
export const requestTrackingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const trackedReq = req as TrackedRequest;
  
  // Generate or use existing request ID
  trackedReq.requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  trackedReq.startTime = Date.now();
  
  // Set response headers
  res.setHeader('X-Request-ID', trackedReq.requestId);
  
  // Add response time header when response finishes
  res.on('finish', () => {
    const duration = Date.now() - trackedReq.startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  
  next();
};

export default requestTrackingMiddleware;
