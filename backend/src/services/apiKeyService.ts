// backend/src/services/apiKeyService.ts

import { prisma } from '../config/database';
import CryptoUtils from '../utils/cryptoUtils';
import { logger } from '../utils/logger';

export class ApiKeyService {
  /**
   * Create a new API key
   */
  static async createApiKey(userId: string, name: string): Promise<{ key: string; keyPrefix: string }> {
    try {
      // Check user's API key limit
      const existingKeys = await prisma.apiKey.count({
        where: {
          userId,
          revokedAt: null
        }
      });

      // Get user's plan to check limit
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE'
        },
        include: { plan: true }
      });

      const maxApiKeys = subscription?.plan.maxApiKeys || 5;
      if (existingKeys >= maxApiKeys) {
        throw new Error(`Maximum API keys (${maxApiKeys}) reached`);
      }

      // Generate API key
      const { key, prefix, hash } = CryptoUtils.generateApiKey();

      // Store hashed key
      await prisma.apiKey.create({
        data: {
          userId,
          name,
          keyHash: hash,
          keyPrefix: prefix
        }
      });

      logger.info(`API key created for user: ${userId}`);

      return { key, keyPrefix: prefix };
    } catch (error) {
      logger.error('Create API key error:', error);
      throw error;
    }
  }

  /**
   * List API keys for user
   */
  static async listApiKeys(userId: string) {
    try {
      return await prisma.apiKey.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          lastUsedAt: true,
          createdAt: true,
          expiresAt: true,
          revokedAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      logger.error('List API keys error:', error);
      throw error;
    }
  }

  /**
   * Revoke an API key
   */
  static async revokeApiKey(userId: string, apiKeyId: string): Promise<void> {
    try {
      // Verify ownership
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          id: apiKeyId,
          userId
        }
      });

      if (!apiKey) {
        throw new Error('API key not found');
      }

      await prisma.apiKey.update({
        where: { id: apiKeyId },
        data: { revokedAt: new Date() }
      });

      logger.info(`API key revoked: ${apiKeyId}`);
    } catch (error) {
      logger.error('Revoke API key error:', error);
      throw error;
    }
  }

  /**
   * Verify API key and get user info
   */
  static async verifyApiKey(apiKeyHash: string): Promise<{ userId: string; keyId: string; name: string } | null> {
    try {
      const apiKey = await prisma.apiKey.findUnique({
        where: { keyHash: apiKeyHash },
        select: {
          id: true,
          userId: true,
          name: true,
          revokedAt: true,
          expiresAt: true
        }
      });

      if (!apiKey) {
        return null;
      }

      // Check if revoked
      if (apiKey.revokedAt) {
        return null;
      }

      // Check if expired
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return null;
      }

      // Update last used
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: {
          lastUsedAt: new Date(),
          lastUsedIp: 'placeholder' // Would get from request
        }
      });

      return {
        userId: apiKey.userId,
        keyId: apiKey.id,
        name: apiKey.name
      };
    } catch (error) {
      logger.error('Verify API key error:', error);
      return null;
    }
  }

  /**
   * Rotate API key
   */
  static async rotateApiKey(userId: string, apiKeyId: string): Promise<{ key: string; keyPrefix: string }> {
    try {
      // Verify ownership
      const oldKey = await prisma.apiKey.findFirst({
        where: {
          id: apiKeyId,
          userId
        }
      });

      if (!oldKey) {
        throw new Error('API key not found');
      }

      // Generate new key
      const { key, prefix, hash } = CryptoUtils.generateApiKey();

      // Create new key and revoke old one
      await Promise.all([
        prisma.apiKey.create({
          data: {
            userId,
            name: `${oldKey.name} (rotated)`,
            keyHash: hash,
            keyPrefix: prefix
          }
        }),
        prisma.apiKey.update({
          where: { id: apiKeyId },
          data: { revokedAt: new Date() }
        })
      ]);

      logger.info(`API key rotated for user: ${userId}`);

      return { key, keyPrefix: prefix };
    } catch (error) {
      logger.error('Rotate API key error:', error);
      throw error;
    }
  }
}

export default ApiKeyService;
