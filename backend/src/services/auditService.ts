// backend/src/services/auditService.ts

import { prisma } from '../config/database';
import logger from '../utils/logger';

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'SUSPEND' | 'REACTIVATE' | 'LOGIN' | 'LOGOUT' | 'PAYMENT_PROCESSED' | 'SUBSCRIPTION_CREATED' | 'SUBSCRIPTION_CANCELLED' | 'API_KEY_CREATED' | 'API_KEY_REVOKED' | 'PROFILE_UPDATE' | 'AVATAR_UPDATE' | 'EMAIL_CHANGE_REQUESTED' | 'PASSWORD_CHANGED' | 'ACCOUNT_DELETED';

export interface AuditLogInput {
  userId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit logging service for compliance and debugging
 */
export class AuditService {
  /**
   * Log an action
   */
  static async log(input: AuditLogInput): Promise<any> {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          userId: input.userId,
          action: input.action,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          changes: input.changes ? JSON.stringify(input.changes) : null,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          timestamp: new Date()
        }
      });

      logger.info(`[AUDIT] ${input.action} ${input.resourceType}`, {
        userId: input.userId,
        resourceId: input.resourceId
      });

      return auditLog;
    } catch (error) {
      logger.error('Audit log error:', error);
      // Don't throw - audit failures shouldn't break operations
      return null;
    }
  }

  /**
   * Log user login
   */
  static async logLogin(userId: string, ipAddress?: string, userAgent?: string) {
    return this.log({
      userId,
      action: 'LOGIN',
      resourceType: 'USER',
      resourceId: userId,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log user logout
   */
  static async logLogout(userId: string, ipAddress?: string, userAgent?: string) {
    return this.log({
      userId,
      action: 'LOGOUT',
      resourceType: 'USER',
      resourceId: userId,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log user registration
   */
  static async logRegistration(userId: string, ipAddress?: string, userAgent?: string) {
    return this.log({
      userId,
      action: 'CREATE',
      resourceType: 'USER',
      resourceId: userId,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log API key creation
   */
  static async logApiKeyCreated(userId: string, apiKeyId: string, keyName: string, ipAddress?: string) {
    return this.log({
      userId,
      action: 'API_KEY_CREATED',
      resourceType: 'API_KEY',
      resourceId: apiKeyId,
      changes: { name: keyName },
      ipAddress
    });
  }

  /**
   * Log API key revocation
   */
  static async logApiKeyRevoked(userId: string, apiKeyId: string, ipAddress?: string) {
    return this.log({
      userId,
      action: 'API_KEY_REVOKED',
      resourceType: 'API_KEY',
      resourceId: apiKeyId,
      ipAddress
    });
  }

  /**
   * Log subscription creation
   */
  static async logSubscriptionCreated(userId: string, subscriptionId: string, planId: string, amount: number) {
    return this.log({
      userId,
      action: 'SUBSCRIPTION_CREATED',
      resourceType: 'SUBSCRIPTION',
      resourceId: subscriptionId,
      changes: { planId, amount }
    });
  }

  /**
   * Log subscription cancellation
   */
  static async logSubscriptionCancelled(userId: string, subscriptionId: string, reason?: string) {
    return this.log({
      userId,
      action: 'SUBSCRIPTION_CANCELLED',
      resourceType: 'SUBSCRIPTION',
      resourceId: subscriptionId,
      changes: { reason }
    });
  }

  /**
   * Log payment processed
   */
  static async logPaymentProcessed(userId: string, amount: number, invoiceId: string) {
    return this.log({
      userId,
      action: 'PAYMENT_PROCESSED',
      resourceType: 'BILLING_RECORD',
      resourceId: invoiceId,
      changes: { amount }
    });
  }

  /**
   * Log user suspension (admin action)
   */
  static async logUserSuspended(adminId: string, userId: string, reason?: string, ipAddress?: string) {
    return this.log({
      userId: adminId,
      action: 'SUSPEND',
      resourceType: 'USER',
      resourceId: userId,
      changes: { reason },
      ipAddress
    });
  }

  /**
   * Log user reactivation (admin action)
   */
  static async logUserReactivated(adminId: string, userId: string, ipAddress?: string) {
    return this.log({
      userId: adminId,
      action: 'REACTIVATE',
      resourceType: 'USER',
      resourceId: userId,
      ipAddress
    });
  }

  /**
   * Log plan created (admin action)
   */
  static async logPlanCreated(adminId: string, planId: string, planName: string, ipAddress?: string) {
    return this.log({
      userId: adminId,
      action: 'CREATE',
      resourceType: 'PLAN',
      resourceId: planId,
      changes: { name: planName },
      ipAddress
    });
  }

  /**
   * Log plan updated (admin action)
   */
  static async logPlanUpdated(adminId: string, planId: string, changes: Record<string, any>, ipAddress?: string) {
    return this.log({
      userId: adminId,
      action: 'UPDATE',
      resourceType: 'PLAN',
      resourceId: planId,
      changes,
      ipAddress
    });
  }

  /**
   * Log plan deleted (admin action)
   */
  static async logPlanDeleted(adminId: string, planId: string, ipAddress?: string) {
    return this.log({
      userId: adminId,
      action: 'DELETE',
      resourceType: 'PLAN',
      resourceId: planId,
      ipAddress
    });
  }

  /**
   * Get audit logs for a user
   */
  static async getUserLogs(userId: string, limit: number = 50) {
    try {
      return await prisma.auditLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit
      });
    } catch (error) {
      logger.error('Get user audit logs error:', error);
      return [];
    }
  }

  /**
   * Get audit logs for a resource
   */
  static async getResourceLogs(resourceType: string, resourceId: string, limit: number = 50) {
    try {
      return await prisma.auditLog.findMany({
        where: { resourceType, resourceId },
        orderBy: { timestamp: 'desc' },
        take: limit
      });
    } catch (error) {
      logger.error('Get resource audit logs error:', error);
      return [];
    }
  }

  /**
   * Get recent audit logs (admin)
   */
  static async getRecentLogs(limit: number = 100) {
    try {
      return await prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true }
          }
        }
      });
    } catch (error) {
      logger.error('Get recent audit logs error:', error);
      return [];
    }
  }
}

export default AuditService;
