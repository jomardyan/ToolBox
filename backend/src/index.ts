import 'dotenv/config';
import app from './app';
import logger from './utils/logger';
import { validateStartupConfig } from './utils/startup';
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Validate configuration before starting
try {
  validateStartupConfig();
  logger.info('✓ Startup configuration validated');
} catch (error: any) {
  logger.error('✗ Startup validation failed:', error);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connections
    import('./config/database').then(({ prisma }) => {
      prisma.$disconnect()
        .then(() => {
          logger.info('Database connections closed');
          process.exit(0);
        })
        .catch((err) => {
          logger.error('Error closing database connections:', err);
          process.exit(1);
        });
    });
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after 30s timeout');
    process.exit(1);
  }, 30000);
};

// Start server
const server = app.listen(PORT, HOST, () => {
  logger.info(`✓ Server running on http://${HOST}:${PORT}`);
  logger.info(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`✓ CORS origins: ${process.env.CORS_ORIGINS || 'http://localhost:3000'}`);
  logger.info(`✓ Health check: http://${HOST}:${PORT}/health`);
  
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`✓ API Docs: http://${HOST}:${PORT}/api-docs`);
  }
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

export default app;
