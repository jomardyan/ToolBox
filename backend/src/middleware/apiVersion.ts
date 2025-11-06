// backend/src/middleware/apiVersion.ts

import { Request, Response, NextFunction } from 'express';

/**
 * API versioning middleware
 * Supports version in URL path (/api/v1/...) or Accept header
 */
export const apiVersionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Extract version from URL path
  const pathMatch = req.path.match(/^\/api\/v(\d+)\//);
  if (pathMatch) {
    req.headers['x-api-version'] = pathMatch[1];
  }
  
  // Extract version from Accept header (e.g., application/vnd.api.v1+json)
  const acceptHeader = req.headers['accept'];
  if (acceptHeader) {
    const versionMatch = acceptHeader.match(/\.v(\d+)\+/);
    if (versionMatch) {
      req.headers['x-api-version'] = versionMatch[1];
    }
  }
  
  // Default to v1 if no version specified
  if (!req.headers['x-api-version']) {
    req.headers['x-api-version'] = '1';
  }
  
  // Add version to response header
  res.setHeader('X-API-Version', req.headers['x-api-version']);
  
  next();
};

/**
 * Middleware to enforce minimum API version
 */
export const requireApiVersion = (minVersion: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const version = parseInt(req.headers['x-api-version'] as string || '1', 10);
    
    if (version < minVersion) {
      return res.status(400).json({
        success: false,
        error: `This endpoint requires API version ${minVersion} or higher`,
        currentVersion: version,
        requiredVersion: minVersion,
        statusCode: 400
      });
    }
    
    next();
  };
};

/**
 * Middleware to deprecate old API versions
 */
export const deprecateApiVersion = (deprecatedVersion: number, sunsetDate: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const version = parseInt(req.headers['x-api-version'] as string || '1', 10);
    
    if (version === deprecatedVersion) {
      res.setHeader('Deprecation', 'true');
      res.setHeader('Sunset', sunsetDate);
      res.setHeader('Warning', `299 - "API version ${deprecatedVersion} is deprecated and will be removed on ${sunsetDate}"`);
    }
    
    next();
  };
};

export default {
  apiVersionMiddleware,
  requireApiVersion,
  deprecateApiVersion
};
