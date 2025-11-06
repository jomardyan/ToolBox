/**
 * Authentication utilities for future implementation
 */

// Note: bcryptjs is optional - can be installed with: npm install bcryptjs
// import { hash, compare } from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  password?: string; // Should not be returned in responses
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Hash password using bcryptjs
 */
export const hashPassword = async (password: string, saltRounds: number = 10): Promise<string> => {
  // Placeholder: Requires 'bcryptjs' package
  // import { hash } from 'bcryptjs';
  // return hash(password, saltRounds);
  throw new Error('Password hashing requires bcryptjs package. Install with: npm install bcryptjs');
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  // Placeholder: Requires 'bcryptjs' package
  // import { compare } from 'bcryptjs';
  // return compare(password, hashedPassword);
  throw new Error('Password comparison requires bcryptjs package. Install with: npm install bcryptjs');
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain digit');
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain special character (!@#$%^&*)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Generate API key
 */
export const generateApiKey = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'sk_';

  for (let i = 0; i < 32; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
};

/**
 * Validate API key format
 */
export const isValidApiKey = (apiKey: string): boolean => {
  return /^sk_[a-zA-Z0-9]{32}$/.test(apiKey);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Create user object for response (without password)
 */
export const sanitizeUser = (user: User): Omit<User, 'password'> => {
  const { password, ...sanitized } = user;
  return sanitized;
};

/**
 * Validate user registration data
 */
export const validateUserRegistration = (
  data: any
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.email) {
    errors.push('Email is required');
  } else if (!validateEmail(data.email)) {
    errors.push('Invalid email address');
  }

  if (!data.password) {
    errors.push('Password is required');
  } else {
    const passwordValidation = validatePasswordStrength(data.password);
    if (!passwordValidation.valid) {
      errors.push(...passwordValidation.errors);
    }
  }

  if (!data.name || data.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate user login data
 */
export const validateUserLogin = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.email) {
    errors.push('Email is required');
  } else if (!validateEmail(data.email)) {
    errors.push('Invalid email address');
  }

  if (!data.password) {
    errors.push('Password is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Generate JWT token (requires jsonwebtoken library)
 * Implementation depends on your auth strategy
 */
export const createJWTToken = (
  payload: TokenPayload,
  secret: string,
  expiresIn: string = '24h'
): string => {
  // This is a placeholder - actual implementation requires 'jsonwebtoken' package
  // import jwt from 'jsonwebtoken';
  // return jwt.sign(payload, secret, { expiresIn });
  throw new Error('JWT implementation requires jsonwebtoken package');
};

/**
 * Verify JWT token
 */
export const verifyJWTToken = (token: string, secret: string): TokenPayload => {
  // This is a placeholder - actual implementation requires 'jsonwebtoken' package
  throw new Error('JWT verification requires jsonwebtoken package');
};

/**
 * Rate limiting key generator
 */
export const generateRateLimitKey = (userId: string, endpoint: string): string => {
  return `rate_limit:${userId}:${endpoint}`;
};

/**
 * Session management utilities
 */
export const generateSessionId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create session
 */
export const createSession = (
  userId: string,
  ipAddress?: string,
  userAgent?: string,
  expirationMinutes: number = 1440 // 24 hours
): Session => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expirationMinutes * 60000);

  return {
    id: generateSessionId(),
    userId,
    createdAt: now,
    expiresAt,
    ipAddress,
    userAgent,
  };
};

/**
 * Check if session is valid
 */
export const isSessionValid = (session: Session): boolean => {
  return new Date() < session.expiresAt;
};

/**
 * Logout (invalidate session)
 */
export const invalidateSession = (session: Session): Session => {
  return {
    ...session,
    expiresAt: new Date(), // Set to now, making it invalid
  };
};
