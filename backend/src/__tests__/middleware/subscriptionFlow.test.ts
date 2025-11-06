// backend/src/__tests__/middleware/subscriptionFlow.test.ts

import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import CryptoUtils from '../../utils/cryptoUtils';

describe('Subscription Mechanism Integration', () => {
  let testUser: any;
  let testToken: string;
  let testApiKey: string;
  let freePlan: any;
  let proPlan: any;

  beforeAll(async () => {
    // Create test plans
    freePlan = await prisma.plan.create({
      data: {
        name: 'Free',
        type: 'SUBSCRIPTION',
        price: 0,
        rateLimit: 10,
        monthlyLimit: 1000,
        maxApiKeys: 2,
        status: 'ACTIVE'
      }
    });

    proPlan = await prisma.plan.create({
      data: {
        name: 'Professional',
        type: 'SUBSCRIPTION',
        price: 29.99,
        rateLimit: 60,
        monthlyLimit: 50000,
        maxApiKeys: 10,
        status: 'ACTIVE'
      }
    });

    // Create test user
    const hashedPassword = await CryptoUtils.hashPassword('Test123!@#');
    testUser = await prisma.user.create({
      data: {
        email: 'subscription-test@example.com',
        passwordHash: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        emailVerified: true,
        status: 'ACTIVE'
      }
    });

    // Create subscription
    await prisma.subscription.create({
      data: {
        userId: testUser.id,
        planId: freePlan.id,
        billingCycleStart: new Date(),
        billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE'
      }
    });

    // Generate test token
    const tokens = CryptoUtils.generateTokens({ 
      userId: testUser.id, 
      email: testUser.email,
      role: 'user'
    });
    testToken = tokens.accessToken;

    // Create API key
    const apiKeyData = CryptoUtils.generateApiKey();
    testApiKey = apiKeyData.key;
    await prisma.apiKey.create({
      data: {
        userId: testUser.id,
        name: 'Test API Key',
        keyHash: apiKeyData.hash,
        keyPrefix: apiKeyData.prefix
      }
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.usageLog.deleteMany({ where: { userId: testUser.id } });
    await prisma.apiKey.deleteMany({ where: { userId: testUser.id } });
    await prisma.subscription.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.plan.delete({ where: { id: freePlan.id } });
    await prisma.plan.delete({ where: { id: proPlan.id } });
    await prisma.$disconnect();
  });

  describe('Authentication Integration', () => {
    it('should authenticate with JWT token', async () => {
      const response = await request(app)
        .get('/api/user/account')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should authenticate with API key', async () => {
      const response = await request(app)
        .get('/api/user/account')
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/user/account')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should reject invalid API key', async () => {
      const response = await request(app)
        .get('/api/user/account')
        .set('X-API-Key', 'sk_invalid_key');

      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting by Tier', () => {
    it('should apply tier-based rate limits', async () => {
      const response = await request(app)
        .get('/api/user/account')
        .set('Authorization', `Bearer ${testToken}`);

      // Check for rate limit headers
      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
    });

    it('should enforce rate limits for free tier', async () => {
      // Make requests up to the limit (10 for free tier)
      const requests = [];
      for (let i = 0; i < 12; i++) {
        requests.push(
          request(app)
            .get('/api/user/account')
            .set('Authorization', `Bearer ${testToken}`)
        );
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    }, 10000); // Increase timeout for multiple requests
  });

  describe('Quota Enforcement', () => {
    it('should track usage and add quota headers', async () => {
      const response = await request(app)
        .get('/api/user/account')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.headers['x-quota-limit']).toBeDefined();
      expect(response.headers['x-quota-used']).toBeDefined();
      expect(response.headers['x-quota-remaining']).toBeDefined();
      expect(response.headers['x-quota-reset']).toBeDefined();
    });

    it('should reject requests when quota exceeded', async () => {
      // Create usage logs to simulate quota usage
      const usageLogs = [];
      for (let i = 0; i < 1001; i++) { // Exceed 1000 limit
        usageLogs.push({
          userId: testUser.id,
          endpoint: '/api/test',
          method: 'GET',
          statusCode: 200,
          responseTimeMs: 100,
          timestamp: new Date()
        });
      }
      await prisma.usageLog.createMany({ data: usageLogs });

      const response = await request(app)
        .get('/api/user/account')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(429);
      expect(response.body.error).toContain('quota');
    }, 15000); // Increase timeout for bulk insert
  });

  describe('Subscription Management', () => {
    it('should get current subscription', async () => {
      const response = await request(app)
        .get('/api/user/subscription')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.plan.name).toBe('Free');
    });

    it('should list available plans', async () => {
      const response = await request(app)
        .get('/api/user/subscription/plans')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should upgrade subscription', async () => {
      const response = await request(app)
        .post('/api/user/subscription/upgrade')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ planId: proPlan.id });

      expect(response.status).toBe(200);
      expect(response.body.data.plan.name).toBe('Professional');
    });

    it('should downgrade subscription', async () => {
      const response = await request(app)
        .post('/api/user/subscription/downgrade')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ planId: freePlan.id });

      expect(response.status).toBe(200);
      expect(response.body.data.planId).toBe(freePlan.id);
    });
  });

  describe('Billing Management', () => {
    it('should get billing overview', async () => {
      const response = await request(app)
        .get('/api/user/billing/overview')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('subscription');
      expect(response.body.data).toHaveProperty('totalSpent');
      expect(response.body.data).toHaveProperty('pendingAmount');
    });

    it('should get invoices list', async () => {
      const response = await request(app)
        .get('/api/user/billing/invoices')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('invoices');
      expect(response.body.data).toHaveProperty('total');
    });

    it('should get payment methods', async () => {
      const response = await request(app)
        .get('/api/user/billing/payment-methods')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Usage Tracking', () => {
    it('should track API usage in database', async () => {
      const beforeCount = await prisma.usageLog.count({
        where: { userId: testUser.id }
      });

      await request(app)
        .get('/api/user/account')
        .set('Authorization', `Bearer ${testToken}`);

      // Wait a bit for async tracking
      await new Promise(resolve => setTimeout(resolve, 100));

      const afterCount = await prisma.usageLog.count({
        where: { userId: testUser.id }
      });

      expect(afterCount).toBeGreaterThan(beforeCount);
    });

    it('should get usage statistics', async () => {
      const response = await request(app)
        .get('/api/user/usage')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('totalCalls');
      expect(response.body.data).toHaveProperty('currentPeriodCalls');
    });
  });

  describe('Complete Flow Integration', () => {
    it('should handle complete authenticated request with all middleware', async () => {
      const response = await request(app)
        .get('/api/user/account')
        .set('Authorization', `Bearer ${testToken}`);

      // Should pass through all middleware
      expect(response.status).toBe(200);
      
      // Request ID should be added
      expect(response.headers['x-request-id']).toBeDefined();
      
      // Quota headers should be present
      expect(response.headers['x-quota-limit']).toBeDefined();
      
      // Rate limit headers should be present
      expect(response.headers['ratelimit-limit']).toBeDefined();
    });
  });
});
