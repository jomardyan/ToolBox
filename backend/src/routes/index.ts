import { Router, Request, Response, NextFunction } from 'express';
import { convertFormat, extractColumns } from '../services/conversionService';
import { SupportedFormat } from '../types';
import logger from '../utils/logger';
import {
  validateFileSize,
  validateDataLength,
  isValidFormat,
  validateColumns,
  validateFilterOptions,
  sanitizeErrorMessage,
} from '../utils/validation';
import authRoutes from './authRoutes';
import apiKeyRoutes from './apiKeyRoutes';
import usageRoutes from './usageRoutes';
import subscriptionRoutes from './subscriptionRoutes';
import billingRoutes from './billingRoutes';
import accountRoutes from './accountRoutes';
import adminUsersRoutes from './admin/usersRoutes';
import adminPlansRoutes from './admin/plansRoutes';
import adminAnalyticsRoutes from './admin/analyticsRoutes';

const router = Router();

// Mount auth routes
router.use('/auth', authRoutes);

// Mount user routes (protected)
router.use('/user', apiKeyRoutes);
router.use('/user/usage', usageRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/billing', billingRoutes);
router.use('/account', accountRoutes);

// Mount admin routes (protected + admin role required)
router.use('/admin/users', adminUsersRoutes);
router.use('/admin/plans', adminPlansRoutes);
router.use('/admin/analytics', adminAnalyticsRoutes);

/**
 * @swagger
 * /api/convert:
 *   post:
 *     summary: Convert data between formats
 *     description: Converts data from one format to another. Supports CSV, JSON, XML, YAML, HTML, Table, TSV, KML, TXT, Markdown, JSONL, NDJSON, Lines, ICS, TOML, Excel, and SQL formats.
 *     tags:
 *       - Conversion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConversionRequest'
 *     responses:
 *       200:
 *         description: Conversion successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConversionResponse'
 *       400:
 *         description: Invalid request or format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       413:
 *         description: Data too large (max 5MB)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/convert', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, sourceFormat, targetFormat, options } = req.body;

    // Validation
    if (!data || !sourceFormat || !targetFormat) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: data, sourceFormat, targetFormat',
        statusCode: 400,
      });
    }

    if (typeof data !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Data must be a string',
        statusCode: 400,
      });
    }

    if (!validateDataLength(data)) {
      return res.status(413).json({
        success: false,
        error: 'Data too large. Maximum size is 5MB.',
        statusCode: 413,
      });
    }

    if (!isValidFormat(sourceFormat) || !isValidFormat(targetFormat)) {
      return res.status(400).json({
        success: false,
        error: `Invalid format. Supported formats: csv, json, xml, yaml, html, table, tsv, kml, txt, markdown, jsonl, ndjson, lines, ics, toml, excel, sql`,
        statusCode: 400,
      });
    }

    const result = convertFormat(data, sourceFormat as SupportedFormat, targetFormat as SupportedFormat);

    res.json({
      success: true,
      data: result,
      statusCode: 200,
    });
  } catch (error) {
    logger.error('Conversion error:', error);
    next(error);
  }
});

// POST /api/batch-convert - Batch conversion of multiple items
/**
 * @swagger
 * /api/batch-convert:
 *   post:
 *     summary: Batch convert multiple items
 *     description: Convert multiple data items in a single request. Maximum 100 items per batch.
 *     tags:
 *       - Conversion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchConversionRequest'
 *     responses:
 *       200:
 *         description: Batch conversion completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BatchConversionResponse'
 *       400:
 *         description: Invalid batch request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/batch-convert', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: items (non-empty array)',
        statusCode: 400,
      });
    }

    if (items.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 100 items per batch',
        statusCode: 400,
      });
    }

    const results = items.map((item: any, index: number) => {
      try {
        const { data, sourceFormat, targetFormat } = item;
        
        if (!data || !sourceFormat || !targetFormat) {
          return {
            index,
            success: false,
            error: 'Missing required fields: data, sourceFormat, targetFormat',
          };
        }

        if (typeof data !== 'string') {
          return {
            index,
            success: false,
            error: 'Data must be a string',
          };
        }

        if (!validateDataLength(data)) {
          return {
            index,
            success: false,
            error: 'Data too large',
          };
        }

        if (!isValidFormat(sourceFormat) || !isValidFormat(targetFormat)) {
          return {
            index,
            success: false,
            error: 'Invalid format',
          };
        }

        const result = convertFormat(
          data,
          sourceFormat as SupportedFormat,
          targetFormat as SupportedFormat
        );

        return {
          index,
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          index,
          success: false,
          error: sanitizeErrorMessage(error),
        };
      }
    });

    const successCount = results.filter((r: any) => r.success).length;
    const failureCount = results.filter((r: any) => !r.success).length;

    logger.info(`Batch conversion completed: ${successCount} success, ${failureCount} failed`);

    res.json({
      success: failureCount === 0,
      data: {
        results,
        summary: {
          total: items.length,
          successful: successCount,
          failed: failureCount,
        },
      },
      statusCode: 200,
    });
  } catch (error) {
    logger.error('Batch conversion error:', error);
    next(error);
  }
});

// POST /api/extract/csv-columns - Extract specific columns from CSV
/**
 * @swagger
 * /api/extract/csv-columns:
 *   post:
 *     summary: Extract specific columns from CSV
 *     description: Extract and filter specific columns from CSV data
 *     tags:
 *       - Extraction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ColumnExtractionRequest'
 *     responses:
 *       200:
 *         description: Column extraction successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConversionResponse'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       413:
 *         description: CSV data too large
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/extract/csv-columns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { csvData, columns, filterOptions } = req.body;

    // Validation
    if (!csvData || !columns || !Array.isArray(columns)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: csvData (string), columns (array)',
        statusCode: 400,
      });
    }

    if (typeof csvData !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'csvData must be a string',
        statusCode: 400,
      });
    }

    if (!validateDataLength(csvData)) {
      return res.status(413).json({
        success: false,
        error: 'CSV data too large. Maximum size is 5MB.',
        statusCode: 413,
      });
    }

    if (!validateColumns(columns)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid columns array. Each column must be a non-empty string.',
        statusCode: 400,
      });
    }

    if (!validateFilterOptions(filterOptions)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filter options',
        statusCode: 400,
      });
    }

    const result = extractColumns(csvData, columns, filterOptions);

    res.json({
      success: true,
      data: result,
      statusCode: 200,
    });
  } catch (error) {
    logger.error('Column extraction error:', error);
    next(error);
  }
});

// POST /api/presets - Save conversion preset
/**
 * @swagger
 * /api/presets:
 *   post:
 *     summary: Create a conversion preset
 *     description: Save a named conversion preset for quick access to frequently used conversions
 *     tags:
 *       - Presets
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PresetRequest'
 *     responses:
 *       200:
 *         description: Preset created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Preset'
 *                 statusCode:
 *                   type: integer
 *       400:
 *         description: Invalid preset data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     summary: Get all conversion presets
 *     description: Retrieve all saved conversion presets
 *     tags:
 *       - Presets
 *     responses:
 *       200:
 *         description: Presets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Preset'
 *                 statusCode:
 *                   type: integer
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/presets', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, sourceFormat, targetFormat, description } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.length === 0 || name.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Preset name must be a string between 1-100 characters',
        statusCode: 400,
      });
    }

    if (!isValidFormat(sourceFormat) || !isValidFormat(targetFormat)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid format',
        statusCode: 400,
      });
    }

    const preset = {
      id: Date.now().toString(),
      name,
      sourceFormat,
      targetFormat,
      description: description || '',
      createdAt: new Date(),
    };

    // In a real app, this would be saved to database
    logger.info(`Preset created: ${name}`);

    res.json({
      success: true,
      data: preset,
      statusCode: 200,
    });
  } catch (error) {
    logger.error('Preset creation error:', error);
    next(error);
  }
});

// GET /api/presets - Get saved presets (mock data)
router.get('/presets', (req: Request, res: Response) => {
  // In a real app, this would fetch from database
  const mockPresets = [
    {
      id: '1',
      name: 'CSV to JSON',
      sourceFormat: 'csv',
      targetFormat: 'json',
      description: 'Convert CSV data to JSON format',
      createdAt: new Date(),
    },
    {
      id: '2',
      name: 'CSV to Excel',
      sourceFormat: 'csv',
      targetFormat: 'excel',
      description: 'Convert CSV to Excel spreadsheet',
      createdAt: new Date(),
    },
  ];

  res.json({
    success: true,
    data: mockPresets,
    statusCode: 200,
  });
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the API server is running and healthy
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
    },
    statusCode: 200,
  });
});

export default router;
