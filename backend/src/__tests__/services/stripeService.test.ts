// backend/src/__tests__/services/stripeService.test.ts

import { StripeService } from '../../services/stripeService';
import { prisma } from '../../config/database';

jest.mock('../../config/database', () => ({
  prisma: {
    subscription: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    plan: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_123' }),
    },
    subscriptions: {
      create: jest.fn().mockResolvedValue({ id: 'sub_123', status: 'active' }),
      retrieve: jest.fn().mockResolvedValue({ status: 'active' }),
      update: jest.fn().mockResolvedValue({ status: 'active' }),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/pay/123' }),
      },
    },
  }));
});

describe('Stripe Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCustomer', () => {
    it('should create a Stripe customer', async () => {
      const result = await StripeService.createCustomer('user123', 'test@example.com', 'Test User');
      expect(result).toBeDefined();
      expect(result.id).toBe('cus_123');
    });
  });

  describe('createSubscription', () => {
    it('should create a subscription', async () => {
      const mockPlan = {
        id: 'plan123',
        stripePriceId: 'price_123',
        name: 'Pro',
      };

      (prisma.plan.findUnique as jest.Mock).mockResolvedValue(mockPlan);
      (prisma.subscription.create as jest.Mock).mockResolvedValue({
        id: 'sub_db_123',
        userId: 'user123',
        planId: 'plan123',
        stripeSubscriptionId: 'sub_123',
        status: 'ACTIVE',
      });

      const result = await StripeService.createSubscription('cus_123', 'price_123', 'user123');
      expect(result).toBeDefined();
    });
  });

  describe('handleWebhookEvent', () => {
    it('should handle subscription created webhook', async () => {
      const event = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            status: 'active',
          },
        },
      };

      (prisma.subscription.update as jest.Mock).mockResolvedValue({});

      await expect(StripeService.handleWebhookEvent(event as any)).resolves.not.toThrow();
    });

    it('should handle subscription updated webhook', async () => {
      const event = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            status: 'active',
          },
        },
      };

      (prisma.subscription.update as jest.Mock).mockResolvedValue({});

      await expect(StripeService.handleWebhookEvent(event as any)).resolves.not.toThrow();
    });
  });
});
