// backend/src/services/twoFactorService.ts

import * as speakeasy from 'speakeasy';
import { prisma } from '../config/database';
import logger from '../utils/logger';

const QRCode = require('qrcode');

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
   * Note: Backup codes are generated but not stored (requires separate model).
   * Only the TOTP secret is stored.
   */
  static async enableTwoFactor(
    userId: string,
    secret: string,
    backupCodes: string[]
  ): Promise<void> {
    try {
      // Store only the TOTP secret (backup codes need a separate model)
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorSecret: secret,
          twoFactorEnabled: true
        }
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
   * Note: Backup code verification disabled - codes not persisted in schema
   */
  static async verifyBackupCode(userId: string, code: string): Promise<VerificationResult> {
    try {
      // Backup code storage not available - requires separate model
      return {
        valid: false,
        message: 'Backup code verification not available. Please use TOTP code.',
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
          twoFactorSecret: null
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
   * Note: Backup codes not persisted in current schema
   */
  static async regenerateBackupCodes(userId: string): Promise<string[]> {
    try {
      // Generate codes but don't store (no field in User model)
      const backupCodes = this.generateBackupCodes();

      logger.info(`Backup codes generated for user ${userId} (not persisted)`);
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
        backupCodesRemaining: 0, // Not persisted in schema
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
