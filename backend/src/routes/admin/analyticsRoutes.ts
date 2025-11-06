// backend/src/routes/admin/analyticsRoutes.ts

import { Router, Response } from 'express';
import { prisma } from '../../config/database';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { AuthRequest } from '../../types/auth';
import logger from '../../utils/logger';
import { BillingMetrics, ApiMetrics, UserAnalytics } from '../../types/saas';

const router = Router();

/**
 * Get revenue analytics
 * GET /api/admin/analytics/revenue
 */
router.get('/revenue', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const startDate = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000);

    // Get total revenue
    const totalRevenue = await prisma.billingRecord.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: startDate }
      },
      _sum: { amount: true }
    });

    // Get MRR (current month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthRevenue = await prisma.billingRecord.aggregate({
      where: {
        status: 'PAID',
        createdAt: { gte: monthStart }
      },
      _sum: { amount: true }
    });

    // Get monthly breakdown
    const monthlyData = await prisma.billingRecord.groupBy({
      by: ['createdAt'],
      where: { status: 'PAID', paidAt: { gte: startDate } },
      _sum: { amount: true }
    });

    // Format monthly data
    const monthly: Record<string, number> = {};
    monthlyData.forEach((record: any) => {
      const month = record.createdAt.toISOString().slice(0, 7);
      monthly[month] = (monthly[month] || 0) + (record._sum.amount || 0);
    });

    const metrics: BillingMetrics = {
      mrr: monthRevenue._sum.amount || 0,
      totalRevenue: totalRevenue._sum.amount || 0,
      activeSubscriptions: await prisma.subscription.count({
        where: { status: 'ACTIVE' }
      }),
      cancelledSubscriptions: await prisma.subscription.count({
        where: { status: 'CANCELLED' }
      }),
      pendingPayments: (await prisma.billingRecord.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true }
      }))._sum.amount || 0,
      churnRate: 0 // Calculate based on cancellations
    };

    res.json({
      success: true,
      data: {
        ...metrics,
        monthly
      },
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get revenue analytics',
      statusCode: 500
    });
  }
});

/**
 * Get API usage analytics
 * GET /api/admin/analytics/api
 */
router.get('/api', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get all usage logs
    const logs = await prisma.usageLog.findMany({
      where: { timestamp: { gte: startDate } }
    });

    const totalCalls = logs.length;
    const errorCalls = logs.filter((l: any) => l.statusCode >= 400).length;
    const errorRate = totalCalls > 0 ? (errorCalls / totalCalls) * 100 : 0;

    const avgResponseTime = totalCalls > 0
      ? Math.round(logs.reduce((sum: number, l: any) => sum + l.responseTimeMs, 0) / totalCalls)
      : 0;

    const responseTimes = logs.map((l: any) => l.responseTimeMs).sort((a: number, b: number) => a - b);
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
    const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;

    // Group by status code
    const statusGroups: Record<number, number> = {};
    logs.forEach((log: any) => {
      statusGroups[log.statusCode] = (statusGroups[log.statusCode] || 0) + 1;
    });

    const topErrors = Object.entries(statusGroups)
      .filter(([status]) => parseInt(status) >= 400)
      .map(([status, count]) => ({
        statusCode: parseInt(status),
        count,
        percentage: (count / totalCalls) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const metrics: ApiMetrics = {
      totalApiCalls: totalCalls,
      errorRate: Math.round(errorRate * 100) / 100,
      avgResponseTime,
      p95ResponseTime: p95,
      p99ResponseTime: p99,
      topErrors
    };

    res.json({
      success: true,
      data: metrics,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Get API analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get API analytics',
      statusCode: 500
    });
  }
});

/**
 * Get user analytics
 * GET /api/admin/analytics/users
 */
router.get('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
    });

    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newUsersThisMonth = await prisma.user.count({
      where: { createdAt: { gte: thisMonth } }
    });

    // Get usage distribution
    const allUsers = await prisma.user.findMany({
      select: { id: true }
    });

    const usageStats = await Promise.all(
      allUsers.map(async (user: any) => {
        const count = await prisma.usageLog.count({
          where: {
            userId: user.id,
            timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        });
        return count;
      })
    );

    const heavyUsers = usageStats.filter(u => u > 1000).length;
    const mediumUsers = usageStats.filter(u => u > 100 && u <= 1000).length;
    const lightUsers = usageStats.filter(u => u > 0 && u <= 100).length;

    const analytics: UserAnalytics = {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      usuageDistribution: {
        heavyUsers,
        mediumUsers,
        lightUsers
      }
    };

    res.json({
      success: true,
      data: analytics,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user analytics',
      statusCode: 500
    });
  }
});

/**
 * Get top users by usage
 * GET /api/admin/analytics/top-users
 */
router.get('/top-users', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const topUsers = await prisma.usageLog.groupBy({
      by: ['userId'],
      where: { timestamp: { gte: startDate } },
      _count: { id: true },
      _sum: { cost: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit
    });

    // Get user details
    const users = await Promise.all(
      topUsers.map(async (record: any) => {
        const user = await prisma.user.findUnique({
          where: { id: record.userId },
          select: { id: true, email: true, firstName: true, lastName: true, companyName: true }
        });

        return {
          user,
          apiCalls: record._count.id,
          totalCost: record._sum.cost || 0
        };
      })
    );

    res.json({
      success: true,
      data: users,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Get top users error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get top users',
      statusCode: 500
    });
  }
});

export default router;
