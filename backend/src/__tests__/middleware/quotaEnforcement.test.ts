// backend/src/__tests__/middleware/quotaEnforcement.test.ts

import { Request, Response, NextFunction } from 'express';
import { quotaEnforcementMiddleware } from '../../middleware/quotaEnforcement';
import { AuthRequest } from '../../types/auth';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
jest.mock('../../utils/logger');
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    subscription: {
      findFirst: jest.fn(),
    },
    usageLog: {
      count: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('Quota Enforcement Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      user: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    };

    mockNext = jest.fn();
    mockPrisma = new PrismaClient();
  });

  it('should skip quota check for unauthenticated requests', async () => {
    await quotaEnforcementMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalled();
    expect(mockPrisma.subscription.findFirst).not.toHaveBeenCalled();
  });

  it('should apply free tier default limit (1000)', async () => {
    mockRequest.user = {
      userId: 'user123',
      email: 'test@example.com',
      role: 'user',
    };

    // No subscription found
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    mockPrisma.usageLog.count.mockResolvedValue(500);

    await quotaEnforcementMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockPrisma.usageLog.count).toHaveBeenCalled();
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Quota-Limit', '1000');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Quota-Used', '500');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Quota-Remaining', '500');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should enforce quota limit when exceeded', async () => {
    mockRequest.user = {
      userId: 'user123',
      email: 'test@example.com',
      role: 'user',
    };

    const now = new Date();
    const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    mockPrisma.subscription.findFirst.mockResolvedValue({
      userId: 'user123',
      planId: 'plan123',
      status: 'ACTIVE',
      billingCycleStart: new Date(now.getFullYear(), now.getMonth(), 1),
      billingCycleEnd: cycleEnd,
      plan: {
        name: 'Starter',
        monthlyLimit: 1000,
      },
    });

    // Usage at limit
    mockPrisma.usageLog.count.mockResolvedValue(1000);

    await quotaEnforcementMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(429);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Monthly API quota exceeded',
        statusCode: 429,
        quota: expect.objectContaining({
          limit: 1000,
          used: 1000,
          remaining: 0,
        }),
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should allow request when under quota', async () => {
    mockRequest.user = {
      userId: 'user123',
      email: 'test@example.com',
      role: 'user',
    };

    mockPrisma.subscription.findFirst.mockResolvedValue({
      userId: 'user123',
      planId: 'plan123',
      status: 'ACTIVE',
      plan: {
        name: 'Professional',
        monthlyLimit: 10000,
      },
    });

    mockPrisma.usageLog.count.mockResolvedValue(5000);

    await quotaEnforcementMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Quota-Limit', '10000');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Quota-Used', '5000');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Quota-Remaining', '5000');
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should allow unlimited plans without quota check', async () => {
    mockRequest.user = {
      userId: 'user123',
      email: 'test@example.com',
      role: 'user',
    };

    mockPrisma.subscription.findFirst.mockResolvedValue({
      userId: 'user123',
      planId: 'plan123',
      status: 'ACTIVE',
      plan: {
        name: 'Enterprise',
        monthlyLimit: null, // Unlimited
      },
    });

    await quotaEnforcementMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // For unlimited plans, next should be called
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully (fail open)', async () => {
    mockRequest.user = {
      userId: 'user123',
      email: 'test@example.com',
      role: 'user',
    };

    mockPrisma.subscription.findFirst.mockRejectedValue(new Error('Database error'));

    await quotaEnforcementMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Should allow request on error (fail open)
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should count only successful requests (< 500 status)', async () => {
    mockRequest.user = {
      userId: 'user123',
      email: 'test@example.com',
      role: 'user',
    };

    const now = new Date();
    mockPrisma.subscription.findFirst.mockResolvedValue({
      userId: 'user123',
      planId: 'plan123',
      status: 'ACTIVE',
      billingCycleStart: new Date(now.getFullYear(), now.getMonth(), 1),
      billingCycleEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      plan: {
        name: 'Starter',
        monthlyLimit: 1000,
      },
    });

    mockPrisma.usageLog.count.mockResolvedValue(750);

    await quotaEnforcementMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockPrisma.usageLog.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          statusCode: {
            lt: 500,
          },
        }),
      })
    );
  });
});
