// backend/src/services/twoFactorService.ts

import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { prisma } from '../config/database';
import logger from '../utils/logger';

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface VerificationResult {
  valid: boolean;
  message: string;
}

export class TwoFactorService {
  /**
   * Generate TOTP secret and QR code for user
   */
  static async generateSecret(userId: string, email: string): Promise<TwoFactorSetup> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `ToolBox (${email})`,
        issuer: 'ToolBox',
        length: 32,
      });

      if (!secret.otpauth_url) {
        throw new Error('Failed to generate TOTP secret');
      }

      // Generate QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url);

      // Generate backup codes (10 codes for recovery)
      const backupCodes = this.generateBackupCodes();

      logger.info(`2FA secret generated for user ${userId}`);

      return {
        secret: secret.base32,
        qrCode,
        backupCodes,
      };
    } catch (error) {
      logger.error('Generate 2FA secret error:', error);
      throw error;
    }
  }

  /**
   * Enable 2FA for user
   */
  static async enableTwoFactor(
    userId: string,
    secret: string,
    backupCodes: string[]
  ): Promise<void> {
    try {
      // Hash backup codes
      const hashedBackupCodes = backupCodes.map((code) =>
        require('crypto').createHash('sha256').update(code).digest('hex')
      );

      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorSecret: secret,
          twoFactorEnabled: true,
          twoFactorBackupCodes: hashedBackupCodes,
        },
      });

      logger.info(`2FA enabled for user ${userId}`);
    } catch (error) {
      logger.error('Enable 2FA error:', error);
      throw error;
    }
  }

  /**
   * Verify TOTP token
   */
  static async verifyToken(userId: string, token: string): Promise<VerificationResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        return {
          valid: false,
          message: '2FA not enabled',
        };
      }

      // Verify token (allow 30-second window)
      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token.replace(/\s/g, ''),
        window: 1,
      });

      if (!isValid) {
        return {
          valid: false,
          message: 'Invalid 2FA code',
        };
      }

      logger.info(`2FA token verified for user ${userId}`);
      return {
        valid: true,
        message: 'Valid 2FA code',
      };
    } catch (error) {
      logger.error('Verify 2FA token error:', error);
      return {
        valid: false,
        message: 'Error verifying 2FA code',
      };
    }
  }

  /**
   * Verify backup code
   */
  static async verifyBackupCode(userId: string, code: string): Promise<VerificationResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.twoFactorEnabled) {
        return {
          valid: false,
          message: '2FA not enabled',
        };
      }

      const codeHash = require('crypto')
        .createHash('sha256')
        .update(code.replace(/\s/g, ''))
        .digest('hex');

      const backupCodes = user.twoFactorBackupCodes || [];
      const codeIndex = backupCodes.indexOf(codeHash);

      if (codeIndex === -1) {
        return {
          valid: false,
          message: 'Invalid backup code',
        };
      }

      // Remove used backup code
      backupCodes.splice(codeIndex, 1);

      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorBackupCodes: backupCodes },
      });

      logger.info(`Backup code used for user ${userId}`);
      return {
        valid: true,
        message: 'Valid backup code',
      };
    } catch (error) {
      logger.error('Verify backup code error:', error);
      return {
        valid: false,
        message: 'Error verifying backup code',
      };
    }
  }

  /**
   * Disable 2FA for user
   */
  static async disableTwoFactor(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: [],
        },
      });

      logger.info(`2FA disabled for user ${userId}`);
    } catch (error) {
      logger.error('Disable 2FA error:', error);
      throw error;
    }
  }

  /**
   * Generate new backup codes
   */
  static async regenerateBackupCodes(userId: string): Promise<string[]> {
    try {
      const backupCodes = this.generateBackupCodes();

      // Hash backup codes
      const hashedBackupCodes = backupCodes.map((code) =>
        require('crypto').createHash('sha256').update(code).digest('hex')
      );

      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorBackupCodes: hashedBackupCodes },
      });

      logger.info(`Backup codes regenerated for user ${userId}`);
      return backupCodes;
    } catch (error) {
      logger.error('Regenerate backup codes error:', error);
      throw error;
    }
  }

  /**
   * Get 2FA status for user
   */
  static async getTwoFactorStatus(userId: string): Promise<{
    enabled: boolean;
    backupCodesRemaining: number;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      return {
        enabled: user?.twoFactorEnabled || false,
        backupCodesRemaining: user?.twoFactorBackupCodes?.length || 0,
      };
    } catch (error) {
      logger.error('Get 2FA status error:', error);
      throw error;
    }
  }

  /**
   * Generate 10 backup codes
   */
  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = require('crypto')
        .randomBytes(4)
        .toString('hex')
        .toUpperCase();
      codes.push(`${code.substring(0, 4)}-${code.substring(4)}`);
    }
    return codes;
  }
}
