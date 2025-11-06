// backend/src/__tests__/services/authService.test.ts

import { AuthService } from '../../services/authService';
import { prisma } from '../../config/database';
import CryptoUtils from '../../utils/cryptoUtils';
import { emailUtils } from '../../utils/emailUtils';

// Mock dependencies
jest.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('../../utils/cryptoUtils');
jest.mock('../../utils/emailUtils');
jest.mock('../../utils/logger');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerInput = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      companyName: 'Acme Corp',
    };

    it('should register a new user successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (CryptoUtils.hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (CryptoUtils.generateEmailVerificationToken as jest.Mock).mockReturnValue('verification_token');
      (CryptoUtils.generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });

      const mockUser = {
        id: 'user123',
        email: registerInput.email,
        firstName: registerInput.firstName,
        lastName: registerInput.lastName,
        companyName: registerInput.companyName,
        role: 'USER',
        passwordHash: 'hashed_password',
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (prisma.session.create as jest.Mock).mockResolvedValue({});
      (emailUtils.sendEmailVerification as jest.Mock).mockResolvedValue(undefined);

      const result = await AuthService.register(registerInput);

      expect(result.user.email).toBe(registerInput.email);
      expect(result.tokens.accessToken).toBe('access_token');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerInput.email },
      });
      expect(CryptoUtils.hashPassword).toHaveBeenCalledWith(registerInput.password);
      expect(emailUtils.sendEmailVerification).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing_user',
        email: registerInput.email,
      });

      await expect(AuthService.register(registerInput)).rejects.toThrow(
        'User already exists'
      );
    });

    it('should create session for new user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (CryptoUtils.hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (CryptoUtils.generateEmailVerificationToken as jest.Mock).mockReturnValue('token');
      (CryptoUtils.generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user123',
        email: registerInput.email,
        role: 'USER',
      });
      (prisma.session.create as jest.Mock).mockResolvedValue({});
      (emailUtils.sendEmailVerification as jest.Mock).mockResolvedValue(undefined);

      await AuthService.register(registerInput);

      expect(prisma.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user123',
            token: 'access_token',
            refreshToken: 'refresh_token',
          }),
        })
      );
    });
  });

  describe('login', () => {
    const loginInput = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user123',
        email: loginInput.email,
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        role: 'USER',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (CryptoUtils.comparePassword as jest.Mock).mockResolvedValue(true);
      (CryptoUtils.generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
      (prisma.session.create as jest.Mock).mockResolvedValue({});

      const result = await AuthService.login(loginInput);

      expect(result.user.email).toBe(loginInput.email);
      expect(result.tokens.accessToken).toBe('access_token');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user123' },
          data: expect.objectContaining({
            lastLoginAt: expect.any(Date),
          }),
        })
      );
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.login(loginInput)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw error if password incorrect', async () => {
      const mockUser = {
        id: 'user123',
        email: loginInput.email,
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (CryptoUtils.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(AuthService.login(loginInput)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw error if account not active', async () => {
      const mockUser = {
        id: 'user123',
        email: loginInput.email,
        passwordHash: 'hashed_password',
        status: 'SUSPENDED',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (CryptoUtils.comparePassword as jest.Mock).mockResolvedValue(true);

      await expect(AuthService.login(loginInput)).rejects.toThrow(
        'Account is not active'
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token successfully', async () => {
      const mockPayload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'user' as const,
        iat: Date.now(),
        exp: Date.now() + 900000,
      };

      (CryptoUtils.verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
      (CryptoUtils.generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });
      (prisma.session.create as jest.Mock).mockResolvedValue({});

      const tokens = await AuthService.refreshToken('old_refresh_token');

      expect(tokens.accessToken).toBe('new_access_token');
      expect(CryptoUtils.verifyRefreshToken).toHaveBeenCalledWith('old_refresh_token');
    });

    it('should throw error for invalid refresh token', async () => {
      (CryptoUtils.verifyRefreshToken as jest.Mock).mockReturnValue(null);

      await expect(AuthService.refreshToken('invalid_token')).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should invalidate user sessions', async () => {
      (prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });

      await AuthService.logout('user123');

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user123' },
      });
    });
  });
});
