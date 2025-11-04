// backend/src/routes/billingRoutes.ts

import { Router, Response } from 'express';
import { prisma } from '../config/database';
import StripeService from '../services/stripeService';
import { authenticateToken, requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types/auth';
import logger from '../utils/logger';

const router = Router();

/**
 * Get invoices
 * GET /api/user/billing/invoices
 */
router.get('/invoices', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const skip = (page - 1) * pageSize;

    const [invoices, total] = await Promise.all([
      prisma.billingRecord.findMany({
        where: { userId: req.user.userId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.billingRecord.count({
        where: { userId: req.user.userId }
      })
    ]);

    res.json({
      success: true,
      data: {
        invoices,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      },
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get invoices',
      statusCode: 500
    });
  }
});

/**
 * Get payment methods
 * GET /api/user/billing/payment-methods
 */
router.get('/payment-methods', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: paymentMethods,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get payment methods',
      statusCode: 500
    });
  }
});

/**
 * Add payment method
 * POST /api/user/billing/payment-methods
 */
router.post('/payment-methods', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const { stripePaymentMethodId, type, lastFour, brand, expiryMonth, expiryYear } = req.body;

    if (!stripePaymentMethodId || !type) {
      return res.status(400).json({
        success: false,
        error: 'Payment method ID and type required',
        statusCode: 400
      });
    }

    // Check if already exists
    const existing = await prisma.paymentMethod.findUnique({
      where: { stripePaymentMethodId }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Payment method already exists',
        statusCode: 400
      });
    }

    // Create payment method
    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        userId: req.user.userId,
        stripePaymentMethodId,
        type: type as any,
        lastFour,
        brand,
        expiryMonth,
        expiryYear,
        isDefault: true // First payment method is default
      }
    });

    res.status(201).json({
      success: true,
      data: paymentMethod,
      statusCode: 201
    });
  } catch (error: any) {
    logger.error('Add payment method error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to add payment method',
      statusCode: 400
    });
  }
});

/**
 * Delete payment method
 * DELETE /api/user/billing/payment-methods/:id
 */
router.delete('/payment-methods/:id', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const { id } = req.params;

    // Verify ownership
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: { id, userId: req.user.userId }
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found',
        statusCode: 404
      });
    }

    await prisma.paymentMethod.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Payment method deleted',
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Delete payment method error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete payment method',
      statusCode: 500
    });
  }
});

/**
 * Set default payment method
 * POST /api/user/billing/payment-methods/:id/set-default
 */
router.post('/payment-methods/:id/set-default', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const { id } = req.params;

    // Verify ownership
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: { id, userId: req.user.userId }
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found',
        statusCode: 404
      });
    }

    // Update all payment methods for user
    await prisma.paymentMethod.updateMany({
      where: { userId: req.user.userId },
      data: { isDefault: false }
    });

    // Set this one as default
    const updated = await prisma.paymentMethod.update({
      where: { id },
      data: { isDefault: true }
    });

    res.json({
      success: true,
      data: updated,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Set default payment method error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to set default payment method',
      statusCode: 500
    });
  }
});

/**
 * Get billing overview
 * GET /api/user/billing/overview
 */
router.get('/overview', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.user.userId, status: 'ACTIVE' },
      include: { plan: true }
    });

    const [totalSpent, pendingAmount, lastInvoice] = await Promise.all([
      prisma.billingRecord.aggregate({
        where: { userId: req.user.userId, status: 'PAID' },
        _sum: { amount: true }
      }),
      prisma.billingRecord.aggregate({
        where: { userId: req.user.userId, status: 'PENDING' },
        _sum: { amount: true }
      }),
      prisma.billingRecord.findFirst({
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({
      success: true,
      data: {
        subscription,
        totalSpent: totalSpent._sum.amount || 0,
        pendingAmount: pendingAmount._sum.amount || 0,
        lastInvoice
      },
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Get billing overview error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get billing overview',
      statusCode: 500
    });
  }
});

export default router;
