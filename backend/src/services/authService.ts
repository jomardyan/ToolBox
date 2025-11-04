// backend/src/services/authService.ts

import { prisma } from '../config/database';
import CryptoUtils from '../utils/cryptoUtils';
import { RegisterInput, LoginInput, JwtPayload, TokenPair } from '../types/auth';
import logger from '../utils/logger';
import { emailUtils } from '../utils/emailUtils';

export class AuthService {
  /**
   * Register a new user
   */
  static async register(input: RegisterInput): Promise<{ user: any; tokens: TokenPair }> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email }
      });

      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const passwordHash = await CryptoUtils.hashPassword(input.password);

      // Generate email verification token
      const emailVerificationToken = CryptoUtils.generateEmailVerificationToken();
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user
      const user = await prisma.user.create({
        data: {
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          companyName: input.companyName,
          emailVerificationToken,
          emailVerificationExpires,
          status: 'ACTIVE'
        }
      });

      // Generate tokens
      const tokens = CryptoUtils.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Create session
      await prisma.session.create({
        data: {
          userId: user.id,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        }
      });

      // Send verification email
      await emailUtils.sendEmailVerification(
        user.email,
        emailVerificationToken,
        user.firstName
      );

      logger.info(`User registered: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          companyName: user.companyName
        },
        tokens
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login(input: LoginInput): Promise<{ user: any; tokens: TokenPair }> {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: input.email }
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check password
      const passwordMatch = await CryptoUtils.comparePassword(input.password, user.passwordHash);
      if (!passwordMatch) {
        throw new Error('Invalid credentials');
      }

      // Check status
      if (user.status !== 'ACTIVE') {
        throw new Error('Account is not active');
      }

      // Generate tokens
      const tokens = CryptoUtils.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Create session
      await prisma.session.create({
        data: {
          userId: user.id,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        }
      });

      logger.info(`User logged in: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        tokens
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      const decoded = CryptoUtils.verifyRefreshToken(refreshToken);
      if (!decoded) {
        throw new Error('Invalid refresh token');
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const tokens = CryptoUtils.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Create new session
      await prisma.session.create({
        data: {
          userId: user.id,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        }
      });

      logger.info(`Token refreshed for user: ${user.email}`);

      return tokens;
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw error;
    }
  }

  /**
   * Verify email
   */
  static async verifyEmail(token: string): Promise<void> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          emailVerificationToken: token,
          emailVerificationExpires: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        throw new Error('Invalid or expired verification token');
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null
        }
      });

      logger.info(`Email verified for user: ${user.email}`);
    } catch (error) {
      logger.error('Email verification error:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Don't reveal if user exists
        return 'If account exists, password reset email will be sent';
      }

      const resetToken = CryptoUtils.generatePasswordResetToken();
      const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires
        }
      });

      // Send password reset email
      await emailUtils.sendPasswordReset(email, resetToken, user.firstName);

      logger.info(`Password reset requested for user: ${email}`);

      return resetToken;
    } catch (error) {
      logger.error('Password reset request error:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpires: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      const passwordHash = await CryptoUtils.hashPassword(newPassword);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpires: null
        }
      });

      logger.info(`Password reset for user: ${user.email}`);
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  static async logout(userId: string): Promise<void> {
    try {
      await prisma.session.deleteMany({
        where: { userId }
      });

      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }
}

export default AuthService;
