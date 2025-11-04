// backend/src/routes/apiKeyRoutes.ts

import { Router, Response } from 'express';
import ApiKeyService from '../services/apiKeyService';
import UsageService from '../services/usageService';
import { authenticateToken, requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types/auth';
import logger from '../utils/logger';

const router = Router();

/**
 * List API keys
 * GET /api/user/api-keys
 */
router.get('/', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const apiKeys = await ApiKeyService.listApiKeys(req.user.userId);

    res.json({
      success: true,
      data: apiKeys,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('List API keys error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list API keys',
      statusCode: 500
    });
  }
});

/**
 * Create API key
 * POST /api/user/api-keys
 */
router.post('/', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'API key name required',
        statusCode: 400
      });
    }

    const result = await ApiKeyService.createApiKey(req.user.userId, name);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Save your API key now. You won\'t be able to see it again!',
      statusCode: 201
    });
  } catch (error: any) {
    logger.error('Create API key error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create API key',
      statusCode: 400
    });
  }
});

/**
 * Revoke API key
 * DELETE /api/user/api-keys/:id
 */
router.delete('/:id', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const { id } = req.params;

    await ApiKeyService.revokeApiKey(req.user.userId, id);

    res.json({
      success: true,
      message: 'API key revoked',
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Revoke API key error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to revoke API key',
      statusCode: 400
    });
  }
});

/**
 * Rotate API key
 * POST /api/user/api-keys/:id/rotate
 */
router.post('/:id/rotate', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const { id } = req.params;

    const result = await ApiKeyService.rotateApiKey(req.user.userId, id);

    res.json({
      success: true,
      data: result,
      message: 'API key rotated. Your old key is now revoked.',
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Rotate API key error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to rotate API key',
      statusCode: 400
    });
  }
});

export default router;
