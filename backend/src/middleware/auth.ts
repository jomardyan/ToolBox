// backend/src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import CryptoUtils from '../utils/cryptoUtils';
import { AuthRequest } from '../types/auth';
import logger from '../utils/logger';

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
    const requestId = (req as any).requestId || 'unknown';

    if (!apiKey) {
      logger.warn(`[${requestId}] API key authentication failed: No key provided`);
      return res.status(401).json({
        success: false,
        error: 'API key required',
        statusCode: 401,
        requestId
      });
    }

    // Validate API key format (should start with sk_)
    if (!apiKey.startsWith('sk_')) {
      logger.warn(`[${requestId}] API key authentication failed: Invalid key format`);
      return res.status(401).json({
        success: false,
        error: 'Invalid API key format',
        statusCode: 401,
        requestId
      });
    }

    // Hash the API key and look it up in database
    const keyHash = CryptoUtils.hashApiKey(apiKey);
    
    // Import Prisma client dynamically to avoid circular dependencies
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      const apiKeyRecord = await prisma.apiKey.findUnique({
        where: { keyHash },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              status: true,
              role: true
            }
          }
        }
      });

      if (!apiKeyRecord) {
        logger.warn(`[${requestId}] API key authentication failed: Key not found`);
        return res.status(401).json({
          success: false,
          error: 'Invalid API key',
          statusCode: 401,
          requestId
        });
      }

      // Check if key is revoked
      if (apiKeyRecord.revokedAt) {
        logger.warn(`[${requestId}] API key authentication failed: Key revoked at ${apiKeyRecord.revokedAt}`);
        return res.status(401).json({
          success: false,
          error: 'API key has been revoked',
          statusCode: 401,
          requestId
        });
      }

      // Check if key is expired
      if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
        logger.warn(`[${requestId}] API key authentication failed: Key expired at ${apiKeyRecord.expiresAt}`);
        return res.status(401).json({
          success: false,
          error: 'API key has expired',
          statusCode: 401,
          requestId
        });
      }

      // Check if user is active
      if (apiKeyRecord.user.status !== 'ACTIVE') {
        logger.warn(`[${requestId}] API key authentication failed: User account ${apiKeyRecord.user.status}`);
        return res.status(403).json({
          success: false,
          error: 'User account is not active',
          statusCode: 403,
          requestId
        });
      }

      // Update last used timestamp (async, don't wait)
      prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: {
          lastUsedAt: new Date(),
          lastUsedIp: req.ip
        }
      }).catch(err => logger.error(`Failed to update API key last used: ${err.message}`));

      // Set API key and user info on request
      req.apiKey = {
        id: apiKeyRecord.id,
        userId: apiKeyRecord.userId,
        keyPrefix: apiKeyRecord.keyPrefix
      };

      req.user = {
        userId: apiKeyRecord.user.id,
        email: apiKeyRecord.user.email,
        role: apiKeyRecord.user.role.toLowerCase() as 'user' | 'admin'
      };

      logger.info(`[${requestId}] API key authenticated successfully for user ${apiKeyRecord.user.email}`);
      
      next();
    } finally {
      await prisma.$disconnect();
    }
  } catch (error: any) {
    const requestId = (req as any).requestId || 'unknown';
    logger.error(`[${requestId}] API key auth middleware error:`, error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
      requestId
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
