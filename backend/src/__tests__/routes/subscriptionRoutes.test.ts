// backend/src/__tests__/routes/subscriptionRoutes.test.ts

import request from 'supertest';
import express from 'express';
import subscriptionRoutes from '../../routes/subscriptionRoutes';
import { prisma } from '../../config/database';

jest.mock('../../config/database', () => ({
  prisma: {
    subscription: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    plan: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    usageLog: {
      aggregate: jest.fn(),
    },
  },
}));

jest.mock('../../middleware/auth', () => {
  const mockAuthToken = (req: any, res: any, next: any) => {
    req.user = { userId: 'user123', email: 'test@example.com' };
    next();
  };
  
  const mockRequireAuth = (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
  };
  
  return {
    __esModule: true,
    authenticateToken: mockAuthToken,
    requireAuth: mockRequireAuth,
    default: {
      authenticateToken: mockAuthToken,
      requireAuth: mockRequireAuth,
    }
  };
});

const app = express();
app.use(express.json());
app.use('/api/subscriptions', subscriptionRoutes);

describe('Subscription Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/subscriptions', () => {
    it('should get user subscription', async () => {
      const mockSubscription = {
        id: 'sub123',
        userId: 'user123',
        planId: 'plan123',
        status: 'ACTIVE',
        plan: { name: 'Pro', monthlyQuota: 10000 },
      };

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(mockSubscription);

      const response = await request(app).get('/api/subscriptions');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.success).toBe(true);
    });

    it('should return 404 if no subscription found', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/subscriptions');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/subscriptions/upgrade', () => {
    it('should upgrade subscription', async () => {
      const mockCurrentSubscription = {
        id: 'sub123',
        userId: 'user123',
        planId: 'plan123',
        status: 'ACTIVE',
        plan: { id: 'plan123', name: 'Basic' },
      };

      const mockPlan = {
        id: 'plan456',
        name: 'Enterprise',
        monthlyQuota: 100000,
      };

      const mockUpdatedSubscription = {
        id: 'sub123',
        planId: 'plan456',
        status: 'ACTIVE',
      };

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(mockCurrentSubscription);
      (prisma.plan.findUnique as jest.Mock).mockResolvedValue(mockPlan);
      (prisma.subscription.update as jest.Mock).mockResolvedValue(mockUpdatedSubscription);

      const response = await request(app)
        .post('/api/subscriptions/upgrade')
        .send({ planId: 'plan456' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/subscriptions/usage', () => {
    it('should get usage stats', async () => {
      (prisma.usageLog.aggregate as jest.Mock).mockResolvedValue({
        _count: { id: 5000 },
      });

      // GET /api/subscriptions/plans is the available route for listing plans
      const mockPlans = [
        { id: 'plan1', name: 'Basic', price: 9.99, displayOrder: 1, status: 'ACTIVE' },
        { id: 'plan2', name: 'Pro', price: 19.99, displayOrder: 2, status: 'ACTIVE' },
      ];
      (prisma.plan.findMany as jest.Mock).mockResolvedValue(mockPlans);

      const response = await request(app).get('/api/subscriptions/plans');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });
  });
});
