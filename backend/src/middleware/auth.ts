// backend/src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import CryptoUtils from '../utils/cryptoUtils';
import { AuthRequest } from '../types/auth';
import { logger } from '../utils/logger';

/**
 * Middleware to verify JWT token
 */
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        statusCode: 401
      });
    }

    const decoded = CryptoUtils.verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        statusCode: 401
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500
    });
  }
};

/**
 * Middleware to verify API key (for external API calls)
 */
export const authenticateApiKey = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required',
        statusCode: 401
      });
    }

    // Hash the API key and look it up in database
    const keyHash = CryptoUtils.hashApiKey(apiKey);
    
    // You would query the database here
    // const apiKeyRecord = await db.apiKey.findUnique({ where: { keyHash } });
    
    // For now, this is a placeholder
    req.apiKey = {
      id: 'placeholder',
      userId: 'placeholder',
      keyPrefix: apiKey.slice(0, 15)
    };

    next();
  } catch (error) {
    logger.error('API key auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500
    });
  }
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      statusCode: 403
    });
  }
  next();
};

/**
 * Middleware to check if user is authenticated
 */
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      statusCode: 401
    });
  }
  next();
};

export default {
  authenticateToken,
  authenticateApiKey,
  requireAdmin,
  requireAuth
};
