// backend/src/routes/accountRoutes.ts

import { Router, Response } from 'express';
import { authenticateTokenOrApiKey, authenticateToken } from '../middleware/auth';
import { quotaEnforcementMiddleware } from '../middleware/quotaEnforcement';
import { usageTrackingMiddleware } from '../middleware/usageTracking';
import { AuthRequest } from '../types/auth';
import { prisma } from '../config/database';
import CryptoUtils from '../utils/cryptoUtils';
import { AuditService } from '../services/auditService';
import { emailUtils } from '../utils/emailUtils';
import logger from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// Apply usage tracking and quota enforcement to all routes in this router
router.use(authenticateTokenOrApiKey);
router.use(usageTrackingMiddleware);
router.use(quotaEnforcementMiddleware);

/**
 * Get user account (root - returns profile data)
 * GET /api/user/account
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
        emailVerified: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404
      });
    }

    res.json({
      success: true,
      data: user,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Get account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get account',
      statusCode: 500
    });
  }
});

/**
 * Get user profile
 * GET /api/user/account/profile
 */
router.get('/profile', authenticateTokenOrApiKey, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        companyName: true,
        avatar: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404
      });
    }

    res.json({
      success: true,
      data: user,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get profile',
      statusCode: 500
    });
  }
});

/**
 * Update user profile
 * PUT /api/user/account/profile
 * Body: { firstName, lastName, companyName, phone, address, city, state, postalCode, country }
 */
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const { firstName, lastName, companyName, phone, address, city, state, postalCode, country } = req.body;

    // Validate input
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required',
        statusCode: 400
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        firstName,
        lastName,
        companyName: companyName || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        postalCode: postalCode || null,
        country: country || null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        companyName: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true
      }
    });

    // Log audit
    await AuditService.log({
      userId: req.user.userId,
      action: 'PROFILE_UPDATE',
      resourceType: 'USER',
      resourceId: req.user.userId,
      changes: { firstName, lastName, companyName },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update profile',
      statusCode: 500
    });
  }
});

/**
 * Upload avatar
 * POST /api/user/account/avatar
 * Body: { avatarUrl } - URL to avatar image or base64 data
 */
router.post('/avatar', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({
        success: false,
        error: 'Avatar URL required',
        statusCode: 400
      });
    }

    // Validate it's a proper URL or base64
    if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('data:')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid avatar URL format',
        statusCode: 400
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: { avatar: avatarUrl },
      select: { id: true, avatar: true }
    });

    // Log audit
    await AuditService.log({
      userId: req.user.userId,
      action: 'AVATAR_UPDATE',
      resourceType: 'USER',
      resourceId: req.user.userId,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Avatar updated successfully',
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Update avatar error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update avatar',
      statusCode: 500
    });
  }
});

/**
 * Change email
 * POST /api/user/account/change-email
 * Body: { newEmail, password }
 */
router.post('/change-email', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      return res.status(400).json({
        success: false,
        error: 'New email and password required',
        statusCode: 400
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        statusCode: 400
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404
      });
    }

    // Verify password
    const passwordValid = await CryptoUtils.comparePassword(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password',
        statusCode: 401
      });
    }

    // Check if new email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already in use',
        statusCode: 400
      });
    }

    // Generate email verification token
    const emailVerificationToken = CryptoUtils.generateEmailVerificationToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        email: newEmail,
        emailVerified: false,
        emailVerificationToken,
        emailVerificationExpires
      },
      select: {
        id: true,
        email: true,
        emailVerified: true
      }
    });

    // Send verification email to new address
    await emailUtils.sendEmailVerification(
      newEmail,
      emailVerificationToken,
      user.firstName
    );

    // Log audit
    await AuditService.log({
      userId: req.user.userId,
      action: 'EMAIL_CHANGE_REQUESTED',
      resourceType: 'USER',
      resourceId: req.user.userId,
      changes: { newEmail },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Verification email sent to your new address',
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Change email error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to change email',
      statusCode: 500
    });
  }
});

/**
 * Change password
 * POST /api/user/account/change-password
 * Body: { currentPassword, newPassword, confirmPassword }
 */
router.post('/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'All password fields required',
        statusCode: 400
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'New passwords do not match',
        statusCode: 400
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
        statusCode: 400
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from current password',
        statusCode: 400
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404
      });
    }

    // Verify current password
    const passwordValid = await CryptoUtils.comparePassword(currentPassword, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
        statusCode: 401
      });
    }

    // Hash new password
    const newPasswordHash = await CryptoUtils.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { passwordHash: newPasswordHash }
    });

    // Invalidate all sessions (force re-login)
    await prisma.session.deleteMany({
      where: { userId: req.user.userId }
    });

    // Send notification email
    await emailUtils.sendPasswordChangeNotification(user.email, user.firstName);

    // Log audit
    await AuditService.log({
      userId: req.user.userId,
      action: 'PASSWORD_CHANGED',
      resourceType: 'USER',
      resourceId: req.user.userId,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to change password',
      statusCode: 500
    });
  }
});

/**
 * Delete user account
 * DELETE /api/user/account
 * Body: { password } - confirmation password
 */
router.delete('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password required to delete account',
        statusCode: 400
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404
      });
    }

    // Verify password
    const passwordValid = await CryptoUtils.comparePassword(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password',
        statusCode: 401
      });
    }

    const userEmail = user.email;
    const userFirstName = user.firstName;

    // Log audit before deletion
    await AuditService.log({
      userId: req.user.userId,
      action: 'ACCOUNT_DELETED',
      resourceType: 'USER',
      resourceId: req.user.userId,
      ipAddress: req.ip
    });

    // Delete all related data (cascade delete handled by Prisma)
    await prisma.user.delete({
      where: { id: req.user.userId }
    });

    // Send confirmation email
    await emailUtils.sendAccountDeletionConfirmation(userEmail, userFirstName);

    res.clearCookie('refreshToken');
    res.json({
      success: true,
      message: 'Account deleted successfully',
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete account',
      statusCode: 500
    });
  }
});

/**
 * Get account settings
 * GET /api/user/account/settings
 */
router.get('/settings', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404
      });
    }

    res.json({
      success: true,
      data: user,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get settings',
      statusCode: 500
    });
  }
});

export default router;
