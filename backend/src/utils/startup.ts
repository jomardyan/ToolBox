// backend/src/utils/startup.ts

import logger from './logger';

/**
 * Validates required environment variables at startup
 * Fails fast if critical configuration is missing
 */
export function validateEnvironment(): void {
  const required = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DATABASE_URL'
  ];

  const recommended = [
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'FRONTEND_URL',
    'REDIS_URL'
  ];

  const missing: string[] = [];
  const missingRecommended: string[] = [];

  // Check required variables
  for (const variable of required) {
    if (!process.env[variable] || process.env[variable]?.includes('change-in-prod')) {
      missing.push(variable);
    }
  }

  // Check recommended variables
  for (const variable of recommended) {
    if (!process.env[variable]) {
      missingRecommended.push(variable);
    }
  }

  // Fail if required variables are missing
  if (missing.length > 0) {
    logger.error('Missing required environment variables:', missing);
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      'Please set these in your .env file or environment.'
    );
  }

  // Warn about recommended variables
  if (missingRecommended.length > 0 && process.env.NODE_ENV === 'production') {
    logger.warn('Missing recommended environment variables:', missingRecommended);
    logger.warn('Some features may not work correctly without these variables.');
  }

  // Validate JWT secrets are strong enough
  const jwtSecret = process.env.JWT_SECRET!;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;

  if (jwtSecret.length < 32) {
    logger.warn('JWT_SECRET should be at least 32 characters for production use');
  }

  if (jwtRefreshSecret.length < 32) {
    logger.warn('JWT_REFRESH_SECRET should be at least 32 characters for production use');
  }

  if (jwtSecret === jwtRefreshSecret) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
  }

  logger.info('Environment validation passed ✓');
}

/**
 * Validates database connection at startup
 */
export async function validateDatabase(): Promise<void> {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    await prisma.$disconnect();
    
    logger.info('Database connection validated ✓');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw new Error('Could not connect to database. Please check DATABASE_URL.');
  }
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown(server: any): void {
  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      logger.warn('Shutdown already in progress...');
      return;
    }

    isShuttingDown = true;
    logger.info(`${signal} received. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        // Close database connections
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.$disconnect();
        logger.info('Database connections closed');

        // Close Redis connections if applicable
        // await redis.disconnect();

        logger.info('Graceful shutdown completed ✓');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
  });
}

export default {
  validateEnvironment,
  validateDatabase,
  setupGracefulShutdown
};
