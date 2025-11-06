// backend/src/__tests__/routes/apiKeyRoutes.test.ts

import request from 'supertest';
import express, { Express } from 'express';
import apiKeyRoutes from '../../routes/apiKeyRoutes';
import ApiKeyService from '../../services/apiKeyService';
import AuditService from '../../services/auditService';
import { authenticateToken, requireAuth } from '../../middleware/auth';

// Mock dependencies
jest.mock('../../services/apiKeyService');
jest.mock('../../services/auditService');
jest.mock('../../utils/logger');

// Mock auth middleware to inject user
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { userId: 'user123', email: 'test@example.com', role: 'user' };
    next();
  },
  requireAuth: (req: any, res: any, next: any) => next(),
}));

describe('API Key Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/user/api-keys', apiKeyRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/user/api-keys', () => {
    it('should list user API keys', async () => {
      const mockKeys = [
        {
          id: 'key1',
          name: 'Production Key',
          keyPrefix: 'sk_prod_xxxx',
          createdAt: new Date(),
          lastUsedAt: null,
        },
        {
          id: 'key2',
          name: 'Development Key',
          keyPrefix: 'sk_dev_xxxx',
          createdAt: new Date(),
          lastUsedAt: new Date(),
        },
      ];

      (ApiKeyService.listApiKeys as jest.Mock).mockResolvedValue(mockKeys);

      const response = await request(app).get('/api/user/api-keys');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(ApiKeyService.listApiKeys).toHaveBeenCalledWith('user123');
    });

    it('should handle errors when listing keys', async () => {
      (ApiKeyService.listApiKeys as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/user/api-keys');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/user/api-keys', () => {
    it('should create new API key', async () => {
      const mockResult = {
        id: 'key123',
        name: 'New Key',
        key: 'sk_1234567890_abcdef',
        keyPrefix: 'sk_abcdef',
        createdAt: new Date(),
      };

      (ApiKeyService.createApiKey as jest.Mock).mockResolvedValue(mockResult);
      (AuditService.logApiKeyCreated as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/user/api-keys')
        .send({ name: 'New Key' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.key).toBe(mockResult.key);
      expect(response.body.message).toContain('Save your API key');
      expect(ApiKeyService.createApiKey).toHaveBeenCalledWith('user123', 'New Key');
      expect(AuditService.logApiKeyCreated).toHaveBeenCalled();
    });

    it('should reject request without name', async () => {
      const response = await request(app)
        .post('/api/user/api-keys')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('API key name required');
      expect(ApiKeyService.createApiKey).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      (ApiKeyService.createApiKey as jest.Mock).mockRejectedValue(
        new Error('Key limit exceeded')
      );

      const response = await request(app)
        .post('/api/user/api-keys')
        .send({ name: 'New Key' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Key limit exceeded');
    });
  });

  describe('DELETE /api/user/api-keys/:id', () => {
    it('should revoke API key', async () => {
      (ApiKeyService.revokeApiKey as jest.Mock).mockResolvedValue(undefined);
      (AuditService.logApiKeyRevoked as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).delete('/api/user/api-keys/key123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('API key revoked');
      expect(ApiKeyService.revokeApiKey).toHaveBeenCalledWith('user123', 'key123');
      expect(AuditService.logApiKeyRevoked).toHaveBeenCalled();
    });

    it('should handle errors when revoking key', async () => {
      (ApiKeyService.revokeApiKey as jest.Mock).mockRejectedValue(
        new Error('Key not found')
      );

      const response = await request(app).delete('/api/user/api-keys/invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Key not found');
    });
  });

  describe('POST /api/user/api-keys/:id/rotate', () => {
    it('should rotate API key', async () => {
      const mockResult = {
        id: 'key123',
        name: 'Rotated Key',
        key: 'sk_new_key_value',
        keyPrefix: 'sk_newkey',
        createdAt: new Date(),
      };

      (ApiKeyService.rotateApiKey as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app).post('/api/user/api-keys/key123/rotate');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.key).toBe(mockResult.key);
      expect(response.body.message).toContain('old key is now revoked');
      expect(ApiKeyService.rotateApiKey).toHaveBeenCalledWith('user123', 'key123');
    });

    it('should handle rotation errors', async () => {
      (ApiKeyService.rotateApiKey as jest.Mock).mockRejectedValue(
        new Error('Key not found')
      );

      const response = await request(app).post('/api/user/api-keys/invalid/rotate');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Key not found');
    });
  });
});
