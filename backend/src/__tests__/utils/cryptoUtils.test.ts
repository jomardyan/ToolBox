// backend/src/__tests__/utils/cryptoUtils.test.ts

import CryptoUtils from '../../utils/cryptoUtils';
import jwt from 'jsonwebtoken';

describe('CryptoUtils', () => {
  describe('generateApiKey', () => {
    it('should generate API key with correct format', () => {
      const result = CryptoUtils.generateApiKey();

      expect(result.key).toMatch(/^sk_\d+_[a-f0-9]{64}$/);
      expect(result.prefix).toMatch(/^sk_[a-f0-9]{12}$/);
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique keys on multiple calls', () => {
      const key1 = CryptoUtils.generateApiKey();
      const key2 = CryptoUtils.generateApiKey();

      expect(key1.key).not.toBe(key2.key);
      expect(key1.hash).not.toBe(key2.hash);
      expect(key1.prefix).not.toBe(key2.prefix);
    });

    it('should generate consistent hash for same key', () => {
      const apiKey = 'sk_1234567890_abcdef123456';
      const hash1 = CryptoUtils.hashApiKey(apiKey);
      const hash2 = CryptoUtils.hashApiKey(apiKey);

      expect(hash1).toBe(hash2);
    });
  });

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'mySecurePassword123!';
      const hash = await CryptoUtils.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // Bcrypt hashes are typically 60 chars
    });

    it('should generate different hashes for same password', async () => {
      const password = 'mySecurePassword123!';
      const hash1 = await CryptoUtils.hashPassword(password);
      const hash2 = await CryptoUtils.hashPassword(password);

      // Bcrypt uses random salts, so same password produces different hashes
      expect(hash1).not.toBe(hash2);
    });

    it('should hash empty string', async () => {
      const hash = await CryptoUtils.hashPassword('');
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'mySecurePassword123!';
      const hash = await CryptoUtils.hashPassword(password);
      const result = await CryptoUtils.comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'mySecurePassword123!';
      const wrongPassword = 'wrongPassword456!';
      const hash = await CryptoUtils.hashPassword(password);
      const result = await CryptoUtils.comparePassword(wrongPassword, hash);

      expect(result).toBe(false);
    });

    it('should handle invalid hash format', async () => {
      const password = 'mySecurePassword123!';
      const invalidHash = 'not-a-valid-bcrypt-hash';
      
      // bcrypt.compare may throw or return false for invalid hash
      try {
        const result = await CryptoUtils.comparePassword(password, invalidHash);
        expect(result).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle case-sensitive passwords', async () => {
      const password = 'Password123!';
      const hash = await CryptoUtils.hashPassword(password);
      
      const resultCorrect = await CryptoUtils.comparePassword('Password123!', hash);
      const resultWrong = await CryptoUtils.comparePassword('password123!', hash);

      expect(resultCorrect).toBe(true);
      expect(resultWrong).toBe(false);
    });
  });

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'user' as const,
      };

      const tokens = CryptoUtils.generateTokens(payload);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });

    it('should generate valid JWT tokens', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'user' as const,
      };

      const tokens = CryptoUtils.generateTokens(payload);

      // Tokens should have 3 parts separated by dots
      expect(tokens.accessToken.split('.')).toHaveLength(3);
      expect(tokens.refreshToken.split('.')).toHaveLength(3);
    });

    it('should include payload data in tokens', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'user' as const,
      };

      const tokens = CryptoUtils.generateTokens(payload);
      const decoded = jwt.decode(tokens.accessToken) as any;

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'user' as const,
      };

      const tokens = CryptoUtils.generateTokens(payload);
      const verified = CryptoUtils.verifyAccessToken(tokens.accessToken);

      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.email).toBe(payload.email);
      expect(verified?.role).toBe(payload.role);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const verified = CryptoUtils.verifyAccessToken(invalidToken);

      expect(verified).toBeNull();
    });

    it('should return null for expired token', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'user' as const,
      };

      // Create token that's already expired
      const expiredToken = jwt.sign(
        payload,
        process.env.JWT_SECRET!,
        { expiresIn: '-1s', algorithm: 'HS256' }
      );

      const verified = CryptoUtils.verifyAccessToken(expiredToken);
      expect(verified).toBeNull();
    });

    it('should return null for token signed with wrong secret', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'user' as const,
      };

      const wrongToken = jwt.sign(
        payload,
        'wrong-secret-key',
        { expiresIn: '15m', algorithm: 'HS256' }
      );

      const verified = CryptoUtils.verifyAccessToken(wrongToken);
      expect(verified).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'user' as const,
      };

      const tokens = CryptoUtils.generateTokens(payload);
      const verified = CryptoUtils.verifyRefreshToken(tokens.refreshToken);

      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(payload.userId);
    });

    it('should return null for invalid refresh token', () => {
      const invalidToken = 'invalid.refresh.token';
      const verified = CryptoUtils.verifyRefreshToken(invalidToken);

      expect(verified).toBeNull();
    });

    it('should not verify access token as refresh token', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'user' as const,
      };

      const tokens = CryptoUtils.generateTokens(payload);
      
      // Try to verify access token with refresh token verifier
      const verified = CryptoUtils.verifyRefreshToken(tokens.accessToken);
      expect(verified).toBeNull();
    });
  });

  describe('generateEmailVerificationToken', () => {
    it('should generate verification token', () => {
      const token = CryptoUtils.generateEmailVerificationToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique tokens', () => {
      const token1 = CryptoUtils.generateEmailVerificationToken();
      const token2 = CryptoUtils.generateEmailVerificationToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate reset token', () => {
      const token = CryptoUtils.generatePasswordResetToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64);
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique tokens', () => {
      const token1 = CryptoUtils.generatePasswordResetToken();
      const token2 = CryptoUtils.generatePasswordResetToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('hashApiKey', () => {
    it('should hash API key consistently', () => {
      const apiKey = 'sk_test_1234567890abcdef';
      const hash1 = CryptoUtils.hashApiKey(apiKey);
      const hash2 = CryptoUtils.hashApiKey(apiKey);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce different hashes for different keys', () => {
      const key1 = 'sk_test_key1';
      const key2 = 'sk_test_key2';
      const hash1 = CryptoUtils.hashApiKey(key1);
      const hash2 = CryptoUtils.hashApiKey(key2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generate2FASecret', () => {
    it('should generate 2FA secret', () => {
      const secret = CryptoUtils.generate2FASecret();

      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBe(40); // 20 bytes = 40 hex chars
      expect(secret).toMatch(/^[a-f0-9]{40}$/);
    });

    it('should generate unique secrets', () => {
      const secret1 = CryptoUtils.generate2FASecret();
      const secret2 = CryptoUtils.generate2FASecret();

      expect(secret1).not.toBe(secret2);
    });
  });

  describe('generateRandomString', () => {
    it('should generate random string with default length', () => {
      const str = CryptoUtils.generateRandomString();

      expect(str).toBeDefined();
      expect(typeof str).toBe('string');
      expect(str.length).toBe(32);
      expect(str).toMatch(/^[a-f0-9]{32}$/);
    });

    it('should generate random string with custom length', () => {
      const str = CryptoUtils.generateRandomString(64);

      expect(str).toBeDefined();
      expect(str.length).toBe(64);
      expect(str).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique strings', () => {
      const str1 = CryptoUtils.generateRandomString(16);
      const str2 = CryptoUtils.generateRandomString(16);

      expect(str1).not.toBe(str2);
    });
  });
});
