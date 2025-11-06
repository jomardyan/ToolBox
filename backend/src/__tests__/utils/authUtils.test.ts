// backend/src/__tests__/utils/authUtils.test.ts

import {
  validateEmail,
  validatePasswordStrength,
  generateApiKey,
  isValidApiKey,
  generateRefreshToken,
  sanitizeUser,
  validateUserRegistration,
  validateUserLogin,
  generateRateLimitKey,
  generateSessionId,
  User,
} from '../../utils/authUtils';

describe('Auth Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user+tag@domain.co.uk')).toBe(true);
      expect(validateEmail('firstname.lastname@company.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test @example.com')).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const result = validatePasswordStrength('Strong@Pass123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password that is too short', () => {
      const result = validatePasswordStrength('Sh0rt!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should reject password without uppercase', () => {
      const result = validatePasswordStrength('password123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain uppercase letter');
    });

    it('should reject password without lowercase', () => {
      const result = validatePasswordStrength('PASSWORD123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain lowercase letter');
    });

    it('should reject password without digit', () => {
      const result = validatePasswordStrength('Password!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain digit');
    });

    it('should reject password without special character', () => {
      const result = validatePasswordStrength('Password123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain special character (!@#$%^&*)');
    });

    it('should return multiple errors for weak password', () => {
      const result = validatePasswordStrength('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('generateApiKey', () => {
    it('should generate a valid API key', () => {
      const apiKey = generateApiKey();
      expect(apiKey).toBeDefined();
      expect(typeof apiKey).toBe('string');
      expect(apiKey.length).toBeGreaterThan(0);
    });

    it('should generate unique API keys', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('isValidApiKey', () => {
    it('should validate correctly formatted API key', () => {
      const apiKey = generateApiKey();
      expect(isValidApiKey(apiKey)).toBe(true);
    });

    it('should reject empty API key', () => {
      expect(isValidApiKey('')).toBe(false);
    });

    it('should reject invalid API key format', () => {
      expect(isValidApiKey('invalid-key')).toBe(false);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', () => {
      const token = generateRefreshToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate unique refresh tokens', () => {
      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('sanitizeUser', () => {
    it('should remove password from user object', () => {
      const user: User = {
        id: 'user123',
        email: 'test@example.com',
        password: 'hashed_password',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const sanitized = sanitizeUser(user);
      expect((sanitized as any).password).toBeUndefined();
      expect(sanitized.id).toBe(user.id);
      expect(sanitized.email).toBe(user.email);
      expect(sanitized.name).toBe(user.name);
    });
  });

  describe('validateUserRegistration', () => {
    it('should validate correct registration data', () => {
      const data = {
        email: 'test@example.com',
        password: 'Strong@Pass123',
        name: 'Test User',
      };
      const result = validateUserRegistration(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject registration without email', () => {
      const data = {
        password: 'Strong@Pass123',
        name: 'Test User',
      };
      const result = validateUserRegistration(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should reject registration with invalid email', () => {
      const data = {
        email: 'invalid-email',
        password: 'Strong@Pass123',
        name: 'Test User',
      };
      const result = validateUserRegistration(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('email'))).toBe(true);
    });

    it('should reject registration without password', () => {
      const data = {
        email: 'test@example.com',
        name: 'Test User',
      };
      const result = validateUserRegistration(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });
  });

  describe('validateUserLogin', () => {
    it('should validate correct login data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
      };
      const result = validateUserLogin(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject login without email', () => {
      const data = {
        password: 'password123',
      };
      const result = validateUserLogin(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should reject login without password', () => {
      const data = {
        email: 'test@example.com',
      };
      const result = validateUserLogin(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });
  });

  describe('generateRateLimitKey', () => {
    it('should generate rate limit key from user ID and endpoint', () => {
      const key = generateRateLimitKey('user123', '/api/convert');
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key).toContain('user123');
      expect(key).toContain('/api/convert');
    });

    it('should generate consistent keys for same inputs', () => {
      const key1 = generateRateLimitKey('user123', '/api/convert');
      const key2 = generateRateLimitKey('user123', '/api/convert');
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different inputs', () => {
      const key1 = generateRateLimitKey('user123', '/api/convert');
      const key2 = generateRateLimitKey('user456', '/api/convert');
      expect(key1).not.toBe(key2);
    });
  });

  describe('generateSessionId', () => {
    it('should generate a session ID', () => {
      const sessionId = generateSessionId();
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('should generate unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      expect(id1).not.toBe(id2);
    });
  });
});
