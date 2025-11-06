// backend/src/__tests__/middleware/auth.test.ts

import { Request, Response, NextFunction } from 'express';
import { authenticateToken, authenticateApiKey, requireAdmin, requireAuth } from '../../middleware/auth';
import { AuthRequest } from '../../types/auth';
import CryptoUtils from '../../utils/cryptoUtils';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
jest.mock('../../utils/cryptoUtils');
jest.mock('../../utils/logger');
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    apiKey: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockPrisma: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request, response, next
    mockRequest = {
      headers: {},
      user: undefined,
      apiKey: undefined,
      ip: '127.0.0.1',
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();

    // Get mock Prisma instance
    mockPrisma = new PrismaClient();
  });

  describe('authenticateToken', () => {
    it('should reject request with no token', () => {
      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'No token provided',
        statusCode: 401,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', () => {
      mockRequest.headers = { authorization: 'InvalidFormat' };

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'No token provided',
        statusCode: 401,
      });
    });

    it('should reject request with invalid token', () => {
      mockRequest.headers = { authorization: 'Bearer invalid_token' };
      (CryptoUtils.verifyAccessToken as jest.Mock).mockReturnValue(null);

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(CryptoUtils.verifyAccessToken).toHaveBeenCalledWith('invalid_token');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token',
        statusCode: 401,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept request with valid token', () => {
      const mockDecoded = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'user' as const,
      };

      mockRequest.headers = { authorization: 'Bearer valid_token' };
      (CryptoUtils.verifyAccessToken as jest.Mock).mockReturnValue(mockDecoded);

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(CryptoUtils.verifyAccessToken).toHaveBeenCalledWith('valid_token');
      expect(mockRequest.user).toEqual(mockDecoded);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      mockRequest.headers = { authorization: 'Bearer valid_token' };
      (CryptoUtils.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        statusCode: 500,
      });
    });
  });

  describe('authenticateApiKey', () => {
    it('should reject request with no API key', async () => {
      await authenticateApiKey(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'API key required',
          statusCode: 401,
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject API key with invalid format', async () => {
      mockRequest.headers = { 'x-api-key': 'invalid_format_key' };

      await authenticateApiKey(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid API key format',
          statusCode: 401,
        })
      );
    });

    it('should reject non-existent API key', async () => {
      mockRequest.headers = { 'x-api-key': 'sk_test_valid_format' };
      (CryptoUtils.hashApiKey as jest.Mock).mockReturnValue('hashed_key');
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);

      await authenticateApiKey(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockPrisma.apiKey.findUnique).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid API key',
          statusCode: 401,
        })
      );
    });

    it('should reject revoked API key', async () => {
      mockRequest.headers = { 'x-api-key': 'sk_test_valid_format' };
      (CryptoUtils.hashApiKey as jest.Mock).mockReturnValue('hashed_key');
      
      const revokedDate = new Date('2024-01-01');
      mockPrisma.apiKey.findUnique.mockResolvedValue({
        id: 'key123',
        keyHash: 'hashed_key',
        keyPrefix: 'sk_test',
        userId: 'user123',
        revokedAt: revokedDate,
        expiresAt: null,
        user: {
          id: 'user123',
          email: 'test@example.com',
          status: 'ACTIVE',
          role: 'USER',
        },
      });

      await authenticateApiKey(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'API key has been revoked',
          statusCode: 401,
        })
      );
    });

    it('should reject expired API key', async () => {
      mockRequest.headers = { 'x-api-key': 'sk_test_valid_format' };
      (CryptoUtils.hashApiKey as jest.Mock).mockReturnValue('hashed_key');
      
      const pastDate = new Date('2024-01-01');
      mockPrisma.apiKey.findUnique.mockResolvedValue({
        id: 'key123',
        keyHash: 'hashed_key',
        keyPrefix: 'sk_test',
        userId: 'user123',
        revokedAt: null,
        expiresAt: pastDate,
        user: {
          id: 'user123',
          email: 'test@example.com',
          status: 'ACTIVE',
          role: 'USER',
        },
      });

      await authenticateApiKey(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'API key has expired',
          statusCode: 401,
        })
      );
    });

    it('should reject API key for inactive user', async () => {
      mockRequest.headers = { 'x-api-key': 'sk_test_valid_format' };
      (CryptoUtils.hashApiKey as jest.Mock).mockReturnValue('hashed_key');
      
      mockPrisma.apiKey.findUnique.mockResolvedValue({
        id: 'key123',
        keyHash: 'hashed_key',
        keyPrefix: 'sk_test',
        userId: 'user123',
        revokedAt: null,
        expiresAt: null,
        user: {
          id: 'user123',
          email: 'test@example.com',
          status: 'SUSPENDED',
          role: 'USER',
        },
      });

      await authenticateApiKey(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'User account is not active',
          statusCode: 403,
        })
      );
    });

    it('should accept valid API key and set user info', async () => {
      mockRequest.headers = { 'x-api-key': 'sk_test_valid_format' };
      (CryptoUtils.hashApiKey as jest.Mock).mockReturnValue('hashed_key');
      
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      mockPrisma.apiKey.findUnique.mockResolvedValue({
        id: 'key123',
        keyHash: 'hashed_key',
        keyPrefix: 'sk_test',
        userId: 'user123',
        revokedAt: null,
        expiresAt: futureDate,
        user: {
          id: 'user123',
          email: 'test@example.com',
          status: 'ACTIVE',
          role: 'USER',
        },
      });

      mockPrisma.apiKey.update.mockResolvedValue({});

      await authenticateApiKey(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockRequest.apiKey).toEqual({
        id: 'key123',
        userId: 'user123',
        keyPrefix: 'sk_test',
      });
      expect(mockRequest.user).toEqual({
        userId: 'user123',
        email: 'test@example.com',
        role: 'user',
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockRequest.headers = { 'x-api-key': 'sk_test_valid_format' };
      (CryptoUtils.hashApiKey as jest.Mock).mockReturnValue('hashed_key');
      mockPrisma.apiKey.findUnique.mockRejectedValue(new Error('Database error'));

      await authenticateApiKey(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Internal server error',
          statusCode: 500,
        })
      );
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should reject request with no user', () => {
      requireAdmin(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Admin access required',
        statusCode: 403,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject non-admin user', () => {
      mockRequest.user = {
        userId: 'user123',
        email: 'user@example.com',
        role: 'user',
      };

      requireAdmin(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Admin access required',
        statusCode: 403,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept admin user', () => {
      mockRequest.user = {
        userId: 'admin123',
        email: 'admin@example.com',
        role: 'admin',
      };

      requireAdmin(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('requireAuth', () => {
    it('should reject request with no user', () => {
      requireAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
        statusCode: 401,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept authenticated user', () => {
      mockRequest.user = {
        userId: 'user123',
        email: 'user@example.com',
        role: 'user',
      };

      requireAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should accept admin user', () => {
      mockRequest.user = {
        userId: 'admin123',
        email: 'admin@example.com',
        role: 'admin',
      };

      requireAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
