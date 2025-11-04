// backend/src/utils/cryptoUtils.ts

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JwtPayload, TokenPair } from '../types/auth';

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-prod';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-prod';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

export class CryptoUtils {
  /**
   * Generate a secure random API key
   */
  static generateApiKey(): { key: string; prefix: string; hash: string } {
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const key = `sk_${Date.now()}_${randomBytes}`;
    const prefix = `sk_${key.slice(-12)}`;
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    
    return { key, prefix, hash };
  }

  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT tokens
   */
  static generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRATION,
      algorithm: 'HS256'
    });

    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRATION,
      algorithm: 'HS256'
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verify JWT access token
   */
  static verifyAccessToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify JWT refresh token
   */
  static verifyRefreshToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate email verification token (short-lived)
   */
  static generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate password reset token (short-lived)
   */
  static generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash API key for storage
   */
  static hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  /**
   * Generate 2FA secret (for Google Authenticator)
   */
  static generate2FASecret(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  /**
   * Generate random string
   */
  static generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length / 2).toString('hex');
  }
}

export default CryptoUtils;
