// backend/src/routes/admin/usersRoutes.ts

import { Router, Response } from 'express';
import { prisma } from '../../config/database';
import CryptoUtils from '../../utils/cryptoUtils';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { AuthRequest } from '../../types/auth';
import logger from '../../utils/logger';

const router = Router();

/**
 * List all users
 * GET /api/admin/users
 */
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;
    const search = req.query.search as string;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          companyName: true,
          status: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        users,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      },
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('List users error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list users',
      statusCode: 500
    });
  }
});

/**
 * Get user details
 * GET /api/admin/users/:id
 */
router.get('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        companyName: true,
        status: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        subscriptions: {
          include: { plan: true }
        },
        usageLogs: {
          take: 10,
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404
      });
    }

    res.json({
      success: true,
      data: user,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user',
      statusCode: 500
    });
  }
});

/**
 * Suspend user
 * POST /api/admin/users/:id/suspend
 */
router.post('/:id/suspend', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'SUSPENDED' }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'SUSPEND',
        resourceType: 'USER',
        resourceId: id,
        changes: { reason }
      }
    });

    logger.info(`User suspended by admin: ${id}, reason: ${reason}`);

    res.json({
      success: true,
      data: updated,
      message: 'User suspended',
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Suspend user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to suspend user',
      statusCode: 500
    });
  }
});

/**
 * Reactivate user
 * POST /api/admin/users/:id/reactivate
 */
router.post('/:id/reactivate', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'REACTIVATE',
        resourceType: 'USER',
        resourceId: id
      }
    });

    logger.info(`User reactivated by admin: ${id}`);

    res.json({
      success: true,
      data: updated,
      message: 'User reactivated',
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Reactivate user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reactivate user',
      statusCode: 500
    });
  }
});

/**
 * Assign admin role
 * POST /api/admin/users/:id/make-admin
 */
router.post('/:id/make-admin', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: 'ADMIN' }
    });

    logger.info(`User made admin by admin: ${id}`);

    res.json({
      success: true,
      data: updated,
      message: 'User is now admin',
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Make admin error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to make user admin',
      statusCode: 500
    });
  }
});

/**
 * Remove admin role
 * POST /api/admin/users/:id/remove-admin
 */
router.post('/:id/remove-admin', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: 'USER' }
    });

    logger.info(`Admin role removed from user by admin: ${id}`);

    res.json({
      success: true,
      data: updated,
      message: 'Admin role removed',
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Remove admin error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove admin role',
      statusCode: 500
    });
  }
});

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (id === req.user?.userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete yourself',
        statusCode: 400
      });
    }

    await prisma.user.delete({ where: { id } });

    logger.info(`User deleted by admin: ${id}`);

    res.json({
      success: true,
      message: 'User deleted',
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete user',
      statusCode: 500
    });
  }
});

export default router;
