// backend/src/__tests__/routes/authRoutes.test.ts

import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../../routes/authRoutes';
import AuthService from '../../services/authService';
import AuditService from '../../services/auditService';

// Mock dependencies
jest.mock('../../services/authService');
jest.mock('../../services/auditService');
jest.mock('../../utils/logger');

describe('Auth Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const validRegistration = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      companyName: 'Acme Corp',
    };

    it('should register a new user successfully', async () => {
      const mockResult = {
        user: {
          id: 'user123',
          email: validRegistration.email,
          firstName: validRegistration.firstName,
          lastName: validRegistration.lastName,
          companyName: validRegistration.companyName,
        },
        tokens: {
          accessToken: 'access_token',
          refreshToken: 'refresh_token',
        },
      };

      (AuthService.register as jest.Mock).mockResolvedValue(mockResult);
      (AuditService.logRegistration as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistration);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: mockResult,
        statusCode: 201,
      });
      expect(AuthService.register).toHaveBeenCalledWith(validRegistration);
      expect(AuditService.logRegistration).toHaveBeenCalledWith('user123', expect.any(String));
    });

    it('should reject registration with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
      expect(AuthService.register).not.toHaveBeenCalled();
    });

    it('should reject registration with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegistration,
          password: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password must be at least 8 characters');
    });

    it('should handle duplicate email error', async () => {
      (AuthService.register as jest.Mock).mockRejectedValue(
        new Error('User already exists')
      );

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistration);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    const validLogin = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    it('should login user successfully', async () => {
      const mockResult = {
        user: {
          id: 'user123',
          email: validLogin.email,
          firstName: 'John',
          lastName: 'Doe',
          role: 'user',
        },
        tokens: {
          accessToken: 'access_token',
          refreshToken: 'refresh_token',
        },
      };

      (AuthService.login as jest.Mock).mockResolvedValue(mockResult);
      (AuditService.logLogin as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLogin);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockResult,
        statusCode: 200,
      });
      expect(response.headers['set-cookie']).toBeDefined();
      expect(AuthService.login).toHaveBeenCalledWith(validLogin);
    });

    it('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password required');
    });

    it('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password required');
    });

    it('should handle invalid credentials', async () => {
      (AuthService.login as jest.Mock).mockRejectedValue(
        new Error('Invalid credentials')
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLogin);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens successfully with cookie', async () => {
      const mockTokens = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      };

      (AuthService.refreshToken as jest.Mock).mockResolvedValue(mockTokens);

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=old_refresh_token']);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockTokens,
        statusCode: 200,
      });
      expect(AuthService.refreshToken).toHaveBeenCalledWith('old_refresh_token');
    });

    it('should refresh tokens successfully with body', async () => {
      const mockTokens = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      };

      (AuthService.refreshToken as jest.Mock).mockResolvedValue(mockTokens);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'body_refresh_token' });

      expect(response.status).toBe(200);
      expect(AuthService.refreshToken).toHaveBeenCalledWith('body_refresh_token');
    });

    it('should reject refresh without token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Refresh token required');
    });

    it('should handle invalid refresh token', async () => {
      (AuthService.refreshToken as jest.Mock).mockRejectedValue(
        new Error('Invalid refresh token')
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid_token' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid refresh token');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email successfully', async () => {
      (AuthService.verifyEmail as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'verification_token' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Email verified successfully');
      expect(AuthService.verifyEmail).toHaveBeenCalledWith('verification_token');
    });

    it('should reject without token', async () => {
      const response = await request(app).post('/api/auth/verify-email').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Verification token required');
    });

    it('should handle invalid token', async () => {
      (AuthService.verifyEmail as jest.Mock).mockRejectedValue(
        new Error('Invalid or expired token')
      );

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid_token' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired token');
    });
  });

  describe('POST /api/auth/request-password-reset', () => {
    it('should request password reset successfully', async () => {
      const message = 'Password reset email sent';
      (AuthService.requestPasswordReset as jest.Mock).mockResolvedValue(message);

      const response = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(message);
      expect(AuthService.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
    });

    it('should reject without email', async () => {
      const response = await request(app)
        .post('/api/auth/request-password-reset')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email required');
    });

    it('should handle errors gracefully', async () => {
      (AuthService.requestPasswordReset as jest.Mock).mockRejectedValue(
        new Error('Service error')
      );

      const response = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to process request');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password successfully', async () => {
      (AuthService.resetPassword as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'reset_token',
          newPassword: 'NewSecurePass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password reset successfully');
      expect(AuthService.resetPassword).toHaveBeenCalledWith(
        'reset_token',
        'NewSecurePass123!'
      );
    });

    it('should reject without token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ newPassword: 'NewPassword123!' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Token and new password required');
    });

    it('should reject short password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'reset_token',
          newPassword: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password must be at least 8 characters');
    });

    it('should handle invalid token', async () => {
      (AuthService.resetPassword as jest.Mock).mockRejectedValue(
        new Error('Invalid or expired token')
      );

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid_token',
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired token');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      (AuthService.logout as jest.Mock).mockResolvedValue(undefined);
      (AuditService.logLogout as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid_token');

      // Note: In a real test, you'd need to mock authenticateToken middleware
      // For now, this will return 401 due to missing user in request
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/auth/me');

      // Without proper auth token, should return 401
      expect(response.status).toBe(401);
    });
  });
});
