// backend/src/services/usageService.ts

import { prisma } from '../config/database';
import logger from '../utils/logger';
import { UsageMetrics } from '../types/saas';

export class UsageService {
  /**
   * Log API usage
   */
  static async logUsage(data: {
    userId: string;
    apiKeyId?: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTimeMs: number;
    tokensUsed?: number;
    cost?: number;
    ipAddress?: string;
    userAgent?: string;
    errorMessage?: string;
  }) {
    try {
      const usage = await prisma.usageLog.create({
        data: {
          userId: data.userId,
          apiKeyId: data.apiKeyId,
          endpoint: data.endpoint,
          method: data.method,
          statusCode: data.statusCode,
          responseTimeMs: data.responseTimeMs,
          tokensUsed: data.tokensUsed || 1,
          cost: data.cost || 0,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          errorMessage: data.errorMessage
        }
      });

      return usage;
    } catch (error) {
      logger.error('Log usage error:', error);
      throw error;
    }
  }

  /**
   * Get usage summary for user
   */
  static async getUserUsageSummary(userId: string, days: number = 30): Promise<UsageMetrics> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get all usage logs
      const logs = await prisma.usageLog.findMany({
        where: {
          userId,
          timestamp: { gte: startDate }
        }
      });

      // Calculate metrics
      const totalRequests = logs.length;
      const totalCost = logs.reduce((sum: number, log: any) => sum + log.cost, 0);

      const requestsByEndpoint: Record<string, number> = {};
      const costByEndpoint: Record<string, number> = {};

      logs.forEach((log: any) => {
        requestsByEndpoint[log.endpoint] = (requestsByEndpoint[log.endpoint] || 0) + 1;
        costByEndpoint[log.endpoint] = (costByEndpoint[log.endpoint] || 0) + log.cost;
      });

      // Get top endpoints
      const topEndpoints = Object.entries(requestsByEndpoint)
        .map(([endpoint, requests]) => ({
          endpoint,
          requests,
          cost: costByEndpoint[endpoint]
        }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 10);

      // Get daily usage
      const dailyUsage: Record<string, { requests: number; cost: number }> = {};

      logs.forEach((log: any) => {
        const date = log.timestamp.toISOString().split('T')[0];
        if (!dailyUsage[date]) {
          dailyUsage[date] = { requests: 0, cost: 0 };
        }
        dailyUsage[date].requests += 1;
        dailyUsage[date].cost += log.cost;
      });

      const dailyUsageArray = Object.entries(dailyUsage)
        .map(([date, metrics]) => ({
          date,
          ...metrics
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalRequests,
        totalCost,
        requestsByEndpoint,
        costByEndpoint,
        topEndpoints,
        dailyUsage: dailyUsageArray
      };
    } catch (error) {
      logger.error('Get usage summary error:', error);
      throw error;
    }
  }

  /**
   * Get detailed usage logs
   */
  static async getUserDetailedUsage(
    userId: string,
    page: number = 1,
    pageSize: number = 50,
    filters?: {
      endpoint?: string;
      statusCode?: number;
      from?: Date;
      to?: Date;
    }
  ) {
    try {
      const skip = (page - 1) * pageSize;

      const where: any = { userId };

      if (filters?.endpoint) {
        where.endpoint = { contains: filters.endpoint };
      }

      if (filters?.statusCode) {
        where.statusCode = filters.statusCode;
      }

      if (filters?.from || filters?.to) {
        where.timestamp = {};
        if (filters.from) {
          where.timestamp.gte = filters.from;
        }
        if (filters.to) {
          where.timestamp.lte = filters.to;
        }
      }

      const [logs, total] = await Promise.all([
        prisma.usageLog.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { timestamp: 'desc' }
        }),
        prisma.usageLog.count({ where })
      ]);

      return {
        data: logs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
    } catch (error) {
      logger.error('Get detailed usage error:', error);
      throw error;
    }
  }

  /**
   * Get monthly usage for billing
   */
  static async getMonthlyUsage(userId: string, year: number, month: number) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const logs = await prisma.usageLog.findMany({
        where: {
          userId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalRequests = logs.length;
      const totalCost = logs.reduce((sum: number, log: any) => sum + log.cost, 0);
      const totalTokens = logs.reduce((sum: number, log: any) => sum + log.tokensUsed, 0);

      const errorCount = logs.filter((log: any) => log.statusCode >= 400).length;
      const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

      const avgResponseTime = totalRequests > 0
        ? Math.round(logs.reduce((sum: number, log: any) => sum + log.responseTimeMs, 0) / totalRequests)
        : 0;

      return {
        year,
        month,
        totalRequests,
        totalCost,
        totalTokens,
        errorCount,
        errorRate: Math.round(errorRate * 100) / 100,
        avgResponseTime
      };
    } catch (error) {
      logger.error('Get monthly usage error:', error);
      throw error;
    }
  }

  /**
   * Get usage quota status
   */
  static async getQuotaStatus(userId: string) {
    try {
      // Get user's subscription
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE'
        },
        include: { plan: true }
      });

      if (!subscription) {
        return {
          hasQuota: false,
          message: 'No active subscription'
        };
      }

      const plan = subscription.plan;

      if (!plan.monthlyLimit) {
        return {
          hasQuota: false,
          message: 'Unlimited usage',
          rateLimit: plan.rateLimit
        };
      }

      // Get current month usage
      const now = new Date();
      const monthlyUsage = await this.getMonthlyUsage(userId, now.getFullYear(), now.getMonth() + 1);

      const remaining = Math.max(0, plan.monthlyLimit - monthlyUsage.totalRequests);
      const percentageUsed = (monthlyUsage.totalRequests / plan.monthlyLimit) * 100;

      return {
        hasQuota: true,
        limit: plan.monthlyLimit,
        used: monthlyUsage.totalRequests,
        remaining,
        percentageUsed: Math.round(percentageUsed * 100) / 100,
        rateLimit: plan.rateLimit,
        resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      };
    } catch (error) {
      logger.error('Get quota status error:', error);
      throw error;
    }
  }
}

export default UsageService;
