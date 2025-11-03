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

const router = Router();

// POST /api/convert - Generic conversion endpoint
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
        error: `Invalid format. Supported formats: csv, json, xml, yaml, html, tsv, kml, txt`,
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

// Health check endpoint
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
