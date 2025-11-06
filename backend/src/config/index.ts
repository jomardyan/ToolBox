// backend/src/config/index.ts

import logger from '../utils/logger';

/**
 * Application configuration
 * Validates and provides typed access to environment variables
 */
class Config {
  // Server
  readonly PORT: number;
  readonly NODE_ENV: string;
  readonly LOG_LEVEL: string;

  // Security
  readonly JWT_SECRET: string;
  readonly JWT_REFRESH_SECRET: string;
  readonly JWT_EXPIRATION: string;
  readonly JWT_REFRESH_EXPIRATION: string;

  // Database
  readonly DATABASE_URL: string;
  readonly DATABASE_POOL_SIZE: number;

  // Redis (optional)
  readonly REDIS_URL?: string;
  readonly REDIS_ENABLED: boolean;

  // CORS
  readonly CORS_ORIGINS: string[];
  readonly FRONTEND_URL: string;

  // Email/SMTP
  readonly SMTP_HOST?: string;
  readonly SMTP_PORT?: number;
  readonly SMTP_USER?: string;
  readonly SMTP_PASSWORD?: string;
  readonly SMTP_FROM?: string;
  readonly SMTP_ENABLED: boolean;

  // Stripe
  readonly STRIPE_SECRET_KEY?: string;
  readonly STRIPE_PUBLISHABLE_KEY?: string;
  readonly STRIPE_WEBHOOK_SECRET?: string;
  readonly STRIPE_ENABLED: boolean;

  // OAuth
  readonly GOOGLE_CLIENT_ID?: string;
  readonly GOOGLE_CLIENT_SECRET?: string;
  readonly GITHUB_CLIENT_ID?: string;
  readonly GITHUB_CLIENT_SECRET?: string;

  // Monitoring
  readonly SENTRY_DSN?: string;
  readonly SENTRY_ENABLED: boolean;

  // Rate Limiting
  readonly RATE_LIMIT_WINDOW_MS: number;
  readonly RATE_LIMIT_MAX_REQUESTS: number;

  // File Upload
  readonly MAX_FILE_SIZE: number;

  constructor() {
    // Server configuration
    this.PORT = parseInt(process.env.PORT || '3000', 10);
    this.NODE_ENV = process.env.NODE_ENV || 'development';
    this.LOG_LEVEL = process.env.LOG_LEVEL || 'info';

    // Security - REQUIRED in production
    this.JWT_SECRET = this.getRequired('JWT_SECRET');
    this.JWT_REFRESH_SECRET = this.getRequired('JWT_REFRESH_SECRET');
    this.JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m';
    this.JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

    // Database - REQUIRED
    this.DATABASE_URL = this.getRequired('DATABASE_URL');
    this.DATABASE_POOL_SIZE = parseInt(process.env.DATABASE_POOL_SIZE || '20', 10);

    // Redis
    this.REDIS_URL = process.env.REDIS_URL;
    this.REDIS_ENABLED = !!this.REDIS_URL;

    // CORS
    this.CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',');
    this.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Email/SMTP
    this.SMTP_HOST = process.env.SMTP_HOST;
    this.SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
    this.SMTP_USER = process.env.SMTP_USER;
    this.SMTP_PASSWORD = process.env.SMTP_PASSWORD;
    this.SMTP_FROM = process.env.SMTP_FROM;
    this.SMTP_ENABLED = !!(this.SMTP_HOST && this.SMTP_USER && this.SMTP_PASSWORD);

    // Stripe
    this.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    this.STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;
    this.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
    this.STRIPE_ENABLED = !!(this.STRIPE_SECRET_KEY && this.STRIPE_WEBHOOK_SECRET);

    // OAuth
    this.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    this.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    this.GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    this.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

    // Monitoring
    this.SENTRY_DSN = process.env.SENTRY_DSN;
    this.SENTRY_ENABLED = !!this.SENTRY_DSN;

    // Rate Limiting
    this.RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
    this.RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

    // File Upload
    this.MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '104857600', 10); // 100MB default

    // Validate configuration
    this.validate();
  }

  /**
   * Get required environment variable or throw error
   */
  private getRequired(key: string): string {
    const value = process.env[key];
    
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }

    // Check for placeholder values
    const placeholders = ['change-in-prod', 'your-secret', 'your-key', 'placeholder'];
    if (this.NODE_ENV === 'production' && placeholders.some(p => value.includes(p))) {
      throw new Error(`Environment variable ${key} contains placeholder value in production`);
    }

    return value;
  }

  /**
   * Validate configuration
   */
  private validate(): void {
    const errors: string[] = [];

    // Validate JWT secrets are different
    if (this.JWT_SECRET === this.JWT_REFRESH_SECRET) {
      errors.push('JWT_SECRET and JWT_REFRESH_SECRET must be different');
    }

    // Validate JWT secret strength in production
    if (this.NODE_ENV === 'production') {
      if (this.JWT_SECRET.length < 32) {
        errors.push('JWT_SECRET must be at least 32 characters in production');
      }
      if (this.JWT_REFRESH_SECRET.length < 32) {
        errors.push('JWT_REFRESH_SECRET must be at least 32 characters in production');
      }
    }

    // Validate database URL format
    if (!this.DATABASE_URL.startsWith('postgresql://') && !this.DATABASE_URL.startsWith('file:')) {
      errors.push('DATABASE_URL must be a valid PostgreSQL or SQLite connection string');
    }

    // Validate port range
    if (this.PORT < 1 || this.PORT > 65535) {
      errors.push('PORT must be between 1 and 65535');
    }

    // Warn about missing optional but recommended configs in production
    if (this.NODE_ENV === 'production') {
      const warnings: string[] = [];

      if (!this.SMTP_ENABLED) {
        warnings.push('SMTP is not configured - email notifications will not work');
      }

      if (!this.STRIPE_ENABLED) {
        warnings.push('Stripe is not configured - payment processing will not work');
      }

      if (!this.REDIS_ENABLED) {
        warnings.push('Redis is not configured - using in-memory cache (not recommended for production)');
      }

      if (!this.SENTRY_ENABLED) {
        warnings.push('Sentry is not configured - error tracking will not be available');
      }

      warnings.forEach(warning => logger.warn(`⚠️  ${warning}`));
    }

    // Throw if there are errors
    if (errors.length > 0) {
      logger.error('Configuration validation failed:');
      errors.forEach(error => logger.error(`  ❌ ${error}`));
      throw new Error('Invalid configuration');
    }

    // Log successful validation
    logger.info('✅ Configuration validated successfully');
  }

  /**
   * Get configuration summary (safe for logging)
   */
  getSummary(): Record<string, any> {
    return {
      environment: this.NODE_ENV,
      port: this.PORT,
      logLevel: this.LOG_LEVEL,
      features: {
        redis: this.REDIS_ENABLED,
        smtp: this.SMTP_ENABLED,
        stripe: this.STRIPE_ENABLED,
        sentry: this.SENTRY_ENABLED,
        googleOAuth: !!(this.GOOGLE_CLIENT_ID && this.GOOGLE_CLIENT_SECRET),
        githubOAuth: !!(this.GITHUB_CLIENT_ID && this.GITHUB_CLIENT_SECRET)
      },
      limits: {
        maxFileSize: this.MAX_FILE_SIZE,
        rateLimitWindow: this.RATE_LIMIT_WINDOW_MS,
        rateLimitMax: this.RATE_LIMIT_MAX_REQUESTS
      }
    };
  }

  /**
   * Check if running in production
   */
  get isProduction(): boolean {
    return this.NODE_ENV === 'production';
  }

  /**
   * Check if running in development
   */
  get isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  }

  /**
   * Check if running in test
   */
  get isTest(): boolean {
    return this.NODE_ENV === 'test';
  }
}

// Singleton instance
let configInstance: Config;

try {
  configInstance = new Config();
} catch (error: any) {
  logger.error('Failed to initialize configuration:', error.message);
  process.exit(1);
}

export default configInstance;
