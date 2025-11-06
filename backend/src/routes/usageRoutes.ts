// backend/src/routes/usageRoutes.ts

import { Router, Response } from 'express';
import UsageService from '../services/usageService';
import { authenticateToken, requireAuth } from '../middleware/auth';
import { quotaEnforcementMiddleware } from '../middleware/quotaEnforcement';
import { usageTrackingMiddleware } from '../middleware/usageTracking';
import { AuthRequest } from '../types/auth';
import logger from '../utils/logger';

const router = Router();

// Apply authentication and tracking middleware to all routes
router.use(authenticateToken);
router.use(requireAuth);
router.use(usageTrackingMiddleware);
router.use(quotaEnforcementMiddleware);

/**
 * Get usage summary
 * GET /api/user/usage/summary
 */
router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const days = parseInt(req.query.days as string) || 30;
    const summary = await UsageService.getUserUsageSummary(req.user.userId, days);

    res.json({
      success: true,
      data: summary,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Get usage summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get usage summary',
      statusCode: 500
    });
  }
});

/**
 * Get detailed usage logs
 * GET /api/user/usage/detailed
 */
router.get('/detailed', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;
    const endpoint = req.query.endpoint as string;
    const statusCode = req.query.statusCode ? parseInt(req.query.statusCode as string) : undefined;

    const result = await UsageService.getUserDetailedUsage(
      req.user.userId,
      page,
      pageSize,
      { endpoint, statusCode }
    );

    res.json({
      success: true,
      data: result,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Get detailed usage error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get usage details',
      statusCode: 500
    });
  }
});

/**
 * Get monthly usage
 * GET /api/user/usage/monthly/:year/:month
 */
router.get('/monthly/:year/:month', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year or month',
        statusCode: 400
      });
    }

    const usage = await UsageService.getMonthlyUsage(req.user.userId, year, month);

    res.json({
      success: true,
      data: usage,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Get monthly usage error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get monthly usage',
      statusCode: 500
    });
  }
});

/**
 * Get quota status
 * GET /api/user/usage/quota
 */
router.get('/quota', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const quotaStatus = await UsageService.getQuotaStatus(req.user.userId);

    res.json({
      success: true,
      data: quotaStatus,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Get quota status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get quota status',
      statusCode: 500
    });
  }
});

/**
 * Get usage by endpoint
 * GET /api/user/usage/by-endpoint
 */
router.get('/by-endpoint', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const days = parseInt(req.query.days as string) || 30;
    const summary = await UsageService.getUserUsageSummary(req.user.userId, days);

    res.json({
      success: true,
      data: {
        endpoints: summary.topEndpoints,
        period: `Last ${days} days`
      },
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Get usage by endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get usage by endpoint',
      statusCode: 500
    });
  }
});

export default router;
