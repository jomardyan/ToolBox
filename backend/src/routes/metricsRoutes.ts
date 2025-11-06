// backend/src/routes/metricsRoutes.ts

import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import metricsCollector from '../utils/metricsCollector';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get application metrics (admin only)
 * GET /api/metrics
 */
router.get('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const metrics = metricsCollector.getAllMetrics();
    
    // Add system metrics
    const systemMetrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform
    };

    res.json({
      success: true,
      data: {
        application: metrics,
        system: systemMetrics
      }
    });
  } catch (error: any) {
    logger.error('Metrics endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics',
      statusCode: 500
    });
  }
});

/**
 * Get health check with detailed status
 * GET /api/metrics/health
 */
router.get('/health', async (req: Request, res: Response) => {
  const checks: any = {
    api: 'healthy',
    database: 'unknown',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  };

  let overallStatus = 'healthy';

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'healthy';
  } catch (error) {
    checks.database = 'unhealthy';
    overallStatus = 'degraded';
    logger.error('Database health check failed:', error);
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  checks.memory = {
    used: memUsage.heapUsed,
    total: memUsage.heapTotal,
    percentage: Math.round(memUsagePercent)
  };

  if (memUsagePercent > 90) {
    overallStatus = 'degraded';
  }

  const statusCode = overallStatus === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    status: overallStatus,
    checks
  });
});

/**
 * Prometheus-style metrics export
 * GET /api/metrics/prometheus
 */
router.get('/prometheus', async (req: Request, res: Response) => {
  try {
    const metrics = metricsCollector.getAllMetrics();
    let output = '';

    // Export counters
    Object.entries(metrics.counters).forEach(([key, value]) => {
      output += `# TYPE ${key} counter\n`;
      output += `${key} ${value}\n`;
    });

    // Export gauges
    Object.entries(metrics.gauges).forEach(([key, value]) => {
      output += `# TYPE ${key} gauge\n`;
      output += `${key} ${value}\n`;
    });

    // Export histograms
    Object.entries(metrics.histograms).forEach(([key, stats]: [string, any]) => {
      const baseName = key.replace(/\{.*\}/, '');
      output += `# TYPE ${baseName} histogram\n`;
      output += `${key}_count ${stats.count}\n`;
      output += `${key}_sum ${stats.avg * stats.count}\n`;
      output += `${key}_min ${stats.min}\n`;
      output += `${key}_max ${stats.max}\n`;
      output += `${key}_p50 ${stats.p50}\n`;
      output += `${key}_p95 ${stats.p95}\n`;
      output += `${key}_p99 ${stats.p99}\n`;
    });

    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.send(output);
  } catch (error: any) {
    logger.error('Prometheus metrics error:', error);
    res.status(500).send('Error generating metrics');
  }
});

/**
 * Reset metrics (admin only, for testing)
 * POST /api/metrics/reset
 */
router.post('/reset', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    metricsCollector.reset();
    res.json({
      success: true,
      message: 'Metrics reset successfully'
    });
  } catch (error: any) {
    logger.error('Metrics reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset metrics',
      statusCode: 500
    });
  }
});

export default router;
