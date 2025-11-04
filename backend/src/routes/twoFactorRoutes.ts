// backend/src/routes/twoFactorRoutes.ts

import { Router, Request, Response } from 'express';
import { TwoFactorService } from '../services/twoFactorService';
import { authenticateToken } from '../middleware/auth';
import CryptoUtils from '../utils/cryptoUtils';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /2fa/setup
 * Generate 2FA setup (secret + QR code)
 */
router.get('/setup', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const email = (req as any).user.email;

    const setup = await TwoFactorService.generateSecret(userId, email);

    res.json(setup);
  } catch (error: any) {
    logger.error('2FA setup error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /2fa/enable
 * Enable 2FA for user (verify TOTP first)
 */
router.post('/enable', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { secret, token, backupCodes } = req.body;

    if (!secret || !token || !backupCodes || !Array.isArray(backupCodes)) {
      return res.status(400).json({ error: 'Secret, token, and backup codes required' });
    }

    // Verify TOTP token matches secret
    const isValid = require('speakeasy').totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token.replace(/\s/g, ''),
      window: 1,
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    await TwoFactorService.enableTwoFactor(userId, secret, backupCodes);

    res.json({
      message: '2FA enabled successfully',
      backupCodes, // Show backup codes only on enable
    });
  } catch (error: any) {
    logger.error('Enable 2FA error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /2fa/verify
 * Verify TOTP token
 */
router.post('/verify', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'TOTP token required' });
    }

    const result = await TwoFactorService.verifyToken(userId, token);

    if (!result.valid) {
      return res.status(400).json({ error: result.message });
    }

    res.json({ message: result.message });
  } catch (error: any) {
    logger.error('Verify 2FA error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /2fa/backup-code
 * Verify backup code
 */
router.post('/backup-code', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Backup code required' });
    }

    const result = await TwoFactorService.verifyBackupCode(userId, code);

    if (!result.valid) {
      return res.status(400).json({ error: result.message });
    }

    res.json({ message: result.message });
  } catch (error: any) {
    logger.error('Verify backup code error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /2fa/disable
 * Disable 2FA for user
 */
router.post('/disable', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required to disable 2FA' });
    }

    const user = await require('../config/database').prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await CryptoUtils.comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    await TwoFactorService.disableTwoFactor(userId);

    res.json({ message: '2FA disabled successfully' });
  } catch (error: any) {
    logger.error('Disable 2FA error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /2fa/regenerate-backup-codes
 * Generate new backup codes
 */
router.post('/regenerate-backup-codes', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    const user = await require('../config/database').prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await CryptoUtils.comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const backupCodes = await TwoFactorService.regenerateBackupCodes(userId);

    res.json({
      message: 'Backup codes regenerated',
      backupCodes,
    });
  } catch (error: any) {
    logger.error('Regenerate backup codes error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /2fa/status
 * Get 2FA status for user
 */
router.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const status = await TwoFactorService.getTwoFactorStatus(userId);

    res.json(status);
  } catch (error: any) {
    logger.error('Get 2FA status error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
