// backend/src/__tests__/services/apiKeyService.test.ts

import { ApiKeyService } from '../../services/apiKeyService';
import { prisma } from '../../config/database';
import CryptoUtils from '../../utils/cryptoUtils';

// Mock dependencies
jest.mock('../../config/database', () => ({
  prisma: {
    apiKey: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    subscription: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('../../utils/cryptoUtils');
jest.mock('../../utils/logger');

describe('ApiKeyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createApiKey', () => {
    it('should create new API key', async () => {
      (prisma.apiKey.count as jest.Mock).mockResolvedValue(2);
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        userId: 'user123',
        plan: { maxApiKeys: 5 },
      });
      (CryptoUtils.generateApiKey as jest.Mock).mockReturnValue({
        key: 'sk_test_key',
        prefix: 'sk_test',
        hash: 'hashed_key',
      });
      (prisma.apiKey.create as jest.Mock).mockResolvedValue({
        id: 'key123',
        name: 'Test Key',
      });

      const result = await ApiKeyService.createApiKey('user123', 'Test Key');

      expect(result.key).toBe('sk_test_key');
      expect(result.keyPrefix).toBe('sk_test');
      expect(prisma.apiKey.create).toHaveBeenCalledWith({
        data: {
          userId: 'user123',
          name: 'Test Key',
          keyHash: 'hashed_key',
          keyPrefix: 'sk_test',
        },
      });
    });

    it('should throw error when API key limit exceeded', async () => {
      (prisma.apiKey.count as jest.Mock).mockResolvedValue(5);
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        userId: 'user123',
        plan: { maxApiKeys: 5 },
      });

      await expect(
        ApiKeyService.createApiKey('user123', 'Test Key')
      ).rejects.toThrow('Maximum API keys (5) reached');

      expect(prisma.apiKey.create).not.toHaveBeenCalled();
    });

    it('should use default limit when no subscription', async () => {
      (prisma.apiKey.count as jest.Mock).mockResolvedValue(2);
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);
      (CryptoUtils.generateApiKey as jest.Mock).mockReturnValue({
        key: 'sk_test_key',
        prefix: 'sk_test',
        hash: 'hashed_key',
      });
      (prisma.apiKey.create as jest.Mock).mockResolvedValue({});

      await ApiKeyService.createApiKey('user123', 'Test Key');

      expect(prisma.apiKey.create).toHaveBeenCalled();
    });
  });

  describe('listApiKeys', () => {
    it('should list all API keys for user', async () => {
      const mockKeys = [
        {
          id: 'key1',
          name: 'Key 1',
          keyPrefix: 'sk_key1',
          createdAt: new Date(),
          lastUsedAt: null,
          expiresAt: null,
          revokedAt: null,
        },
        {
          id: 'key2',
          name: 'Key 2',
          keyPrefix: 'sk_key2',
          createdAt: new Date(),
          lastUsedAt: new Date(),
          expiresAt: null,
          revokedAt: null,
        },
      ];

      (prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys);

      const result = await ApiKeyService.listApiKeys('user123');

      expect(result).toEqual(mockKeys);
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          lastUsedAt: true,
          createdAt: true,
          expiresAt: true,
          revokedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no keys exist', async () => {
      (prisma.apiKey.findMany as jest.Mock).mockResolvedValue([]);

      const result = await ApiKeyService.listApiKeys('user123');

      expect(result).toEqual([]);
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke API key', async () => {
      (prisma.apiKey.findFirst as jest.Mock).mockResolvedValue({
        id: 'key123',
        userId: 'user123',
        name: 'Test Key',
      });
      (prisma.apiKey.update as jest.Mock).mockResolvedValue({});

      await ApiKeyService.revokeApiKey('user123', 'key123');

      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key123' },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should throw error if key not found', async () => {
      (prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        ApiKeyService.revokeApiKey('user123', 'invalid')
      ).rejects.toThrow('API key not found');

      expect(prisma.apiKey.update).not.toHaveBeenCalled();
    });

    it('should throw error if key belongs to different user', async () => {
      (prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        ApiKeyService.revokeApiKey('user123', 'other_user_key')
      ).rejects.toThrow('API key not found');
    });
  });

  describe('rotateApiKey', () => {
    it('should rotate API key', async () => {
      (prisma.apiKey.findFirst as jest.Mock).mockResolvedValue({
        id: 'key123',
        userId: 'user123',
        name: 'Test Key',
      });
      (CryptoUtils.generateApiKey as jest.Mock).mockReturnValue({
        key: 'sk_new_key',
        prefix: 'sk_new',
        hash: 'new_hash',
      });
      (prisma.apiKey.update as jest.Mock).mockResolvedValue({});
      (prisma.apiKey.create as jest.Mock).mockResolvedValue({
        id: 'new_key123',
      });

      const result = await ApiKeyService.rotateApiKey('user123', 'key123');

      expect(result.key).toBe('sk_new_key');
      expect(result.keyPrefix).toBe('sk_new');
      expect(prisma.apiKey.update).toHaveBeenCalled(); // Revoke old key
      expect(prisma.apiKey.create).toHaveBeenCalled(); // Create new key
    });

    it('should throw error if key not found', async () => {
      (prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        ApiKeyService.rotateApiKey('user123', 'invalid')
      ).rejects.toThrow('API key not found');
    });
  });

  // Note: validateApiKey is not a public method in ApiKeyService
  // Validation is handled through middleware using auth.authenticateApiKey
});
