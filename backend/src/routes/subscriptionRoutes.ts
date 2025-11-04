// backend/src/routes/subscriptionRoutes.ts

import { Router, Response } from 'express';
import { prisma } from '../config/database';
import StripeService from '../services/stripeService';
import { authenticateToken, requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Get current subscription
 * GET /api/user/subscription
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

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.userId,
        status: 'ACTIVE'
      },
      include: { plan: true }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription',
        statusCode: 404
      });
    }

    res.json({
      success: true,
      data: subscription,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get subscription',
      statusCode: 500
    });
  }
});

/**
 * Get available plans
 * GET /api/user/subscription/plans
 */
router.get('/plans', async (req: AuthRequest, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { displayOrder: 'asc' }
    });

    res.json({
      success: true,
      data: plans,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get plans',
      statusCode: 500
    });
  }
});

/**
 * Upgrade subscription
 * POST /api/user/subscription/upgrade
 */
router.post('/upgrade', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID required',
        statusCode: 400
      });
    }

    // Get new plan
    const newPlan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!newPlan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
        statusCode: 404
      });
    }

    // Get current subscription
    const currentSubscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.userId,
        status: 'ACTIVE'
      },
      include: { plan: true }
    });

    if (!currentSubscription) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription',
        statusCode: 404
      });
    }

    // Update in database
    const updated = await prisma.subscription.update({
      where: { id: currentSubscription.id },
      data: {
        planId: newPlan.id,
        billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      include: { plan: true }
    });

    logger.info(`Subscription upgraded for user: ${req.user.userId}`);

    res.json({
      success: true,
      data: updated,
      message: 'Subscription upgraded successfully',
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Upgrade subscription error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to upgrade subscription',
      statusCode: 400
    });
  }
});

/**
 * Downgrade subscription
 * POST /api/user/subscription/downgrade
 */
router.post('/downgrade', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID required',
        statusCode: 400
      });
    }

    // Get new plan
    const newPlan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!newPlan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
        statusCode: 404
      });
    }

    // Get current subscription
    const currentSubscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.userId,
        status: 'ACTIVE'
      },
      include: { plan: true }
    });

    if (!currentSubscription) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription',
        statusCode: 404
      });
    }

    // Update in database (downgrade takes effect immediately)
    const updated = await prisma.subscription.update({
      where: { id: currentSubscription.id },
      data: { planId: newPlan.id }
    });

    logger.info(`Subscription downgraded for user: ${req.user.userId}`);

    res.json({
      success: true,
      data: updated,
      message: 'Subscription downgraded successfully',
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Downgrade subscription error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to downgrade subscription',
      statusCode: 400
    });
  }
});

/**
 * Cancel subscription
 * POST /api/user/subscription/cancel
 */
router.post('/cancel', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const { reason } = req.body;

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.userId,
        status: 'ACTIVE'
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription',
        statusCode: 404
      });
    }

    // Cancel in Stripe if exists
    if (subscription.stripeSubscriptionId) {
      await StripeService.cancelSubscription(subscription.stripeSubscriptionId);
    }

    // Update in database
    const cancelled = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        cancellationDate: new Date(),
        cancellationReason: reason || 'User cancelled'
      }
    });

    logger.info(`Subscription cancelled for user: ${req.user.userId}`);

    res.json({
      success: true,
      data: cancelled,
      message: 'Subscription cancelled successfully',
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Cancel subscription error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to cancel subscription',
      statusCode: 400
    });
  }
});

export default router;
