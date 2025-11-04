// backend/src/routes/authRoutes.ts

import { Router, Response } from 'express';
import AuthService from '../services/authService';
import { authenticateToken, requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types/auth';
import logger from '../utils/logger';

const router = Router();

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName, companyName } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        statusCode: 400
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
        statusCode: 400
      });
    }

    const result = await AuthService.register({
      email,
      password,
      firstName,
      lastName,
      companyName
    });

    res.status(201).json({
      success: true,
      data: result,
      statusCode: 201
    });
  } catch (error: any) {
    logger.error('Register error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Registration failed',
      statusCode: 400
    });
  }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required',
        statusCode: 400
      });
    }

    const result = await AuthService.login({ email, password });

    // Set refresh token in secure cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      data: result,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Login failed',
      statusCode: 401
    });
  }
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req: AuthRequest, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required',
        statusCode: 401
      });
    }

    const tokens = await AuthService.refreshToken(refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      data: tokens,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Refresh error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Token refresh failed',
      statusCode: 401
    });
  }
});

/**
 * Verify email
 * POST /api/auth/verify-email
 */
router.post('/verify-email', async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification token required',
        statusCode: 400
      });
    }

    await AuthService.verifyEmail(token);

    res.json({
      success: true,
      message: 'Email verified successfully',
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Email verification error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Email verification failed',
      statusCode: 400
    });
  }
});

/**
 * Request password reset
 * POST /api/auth/request-password-reset
 */
router.post('/request-password-reset', async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email required',
        statusCode: 400
      });
    }

    const message = await AuthService.requestPasswordReset(email);

    res.json({
      success: true,
      message,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process request',
      statusCode: 500
    });
  }
});

/**
 * Reset password
 * POST /api/auth/reset-password
 */
router.post('/reset-password', async (req: AuthRequest, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password required',
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

    await AuthService.resetPassword(token, newPassword);

    res.json({
      success: true,
      message: 'Password reset successfully',
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Password reset error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Password reset failed',
      statusCode: 400
    });
  }
});

/**
 * Logout
 * POST /api/auth/logout
 */
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    await AuthService.logout(req.user.userId);

    res.clearCookie('refreshToken');
    res.json({
      success: true,
      message: 'Logged out successfully',
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      statusCode: 500
    });
  }
});

/**
 * Get current user
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        statusCode: 401
      });
    }

    // You would fetch full user data from DB here
    res.json({
      success: true,
      data: req.user,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
      statusCode: 500
    });
  }
});

export default router;
