// backend/src/routes/admin/plansRoutes.ts

import { Router, Response } from 'express';
import { prisma } from '../../config/database';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { AuthRequest } from '../../types/auth';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * List all plans
 * GET /api/admin/plans
 */
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { displayOrder: 'asc' }
    });

    res.json({
      success: true,
      data: plans,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('List plans error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list plans',
      statusCode: 500
    });
  }
});

/**
 * Get plan details
 * GET /api/admin/plans/:id
 */
router.get('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: { select: { subscriptions: true } }
      }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
        statusCode: 404
      });
    }

    res.json({
      success: true,
      data: plan,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Get plan error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get plan',
      statusCode: 500
    });
  }
});

/**
 * Create plan
 * POST /api/admin/plans
 */
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      type,
      price,
      currency,
      billingPeriod,
      features,
      rateLimit,
      monthlyLimit,
      maxApiKeys,
      supportLevel
    } = req.body;

    if (!name || type === undefined || price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, price',
        statusCode: 400
      });
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        type,
        price,
        currency: currency || 'usd',
        billingPeriod: billingPeriod || 'monthly',
        features: features || {},
        rateLimit: rateLimit || 1000,
        monthlyLimit,
        maxApiKeys: maxApiKeys || 5,
        supportLevel: supportLevel || 'community',
        status: 'ACTIVE'
      }
    });

    logger.info(`Plan created: ${plan.id}`);

    res.status(201).json({
      success: true,
      data: plan,
      statusCode: 201
    });
  } catch (error: any) {
    logger.error('Create plan error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create plan',
      statusCode: 400
    });
  }
});

/**
 * Update plan
 * PUT /api/admin/plans/:id
 */
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      currency,
      billingPeriod,
      features,
      rateLimit,
      monthlyLimit,
      maxApiKeys,
      supportLevel,
      status,
      displayOrder
    } = req.body;

    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
        statusCode: 404
      });
    }

    const updated = await prisma.plan.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(currency && { currency }),
        ...(billingPeriod && { billingPeriod }),
        ...(features && { features }),
        ...(rateLimit !== undefined && { rateLimit }),
        ...(monthlyLimit !== undefined && { monthlyLimit }),
        ...(maxApiKeys !== undefined && { maxApiKeys }),
        ...(supportLevel && { supportLevel }),
        ...(status && { status }),
        ...(displayOrder !== undefined && { displayOrder })
      }
    });

    logger.info(`Plan updated: ${id}`);

    res.json({
      success: true,
      data: updated,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Update plan error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update plan',
      statusCode: 400
    });
  }
});

/**
 * Archive plan
 * DELETE /api/admin/plans/:id
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
        statusCode: 404
      });
    }

    // Archive instead of delete
    const updated = await prisma.plan.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });

    logger.info(`Plan archived: ${id}`);

    res.json({
      success: true,
      data: updated,
      message: 'Plan archived',
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Archive plan error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to archive plan',
      statusCode: 400
    });
  }
});

export default router;
