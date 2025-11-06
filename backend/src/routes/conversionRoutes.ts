// backend/src/routes/conversionRoutes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { convertFormat, extractColumns } from '../services/conversionService';
import { SupportedFormat } from '../types';
import logger from '../utils/logger';
import {
  validateFileSize,
  validateDataLength,
  isValidFormat,
  sanitizeErrorMessage,
} from '../utils/validation';

const router = Router();

// Supported formats list
const SUPPORTED_FORMATS: SupportedFormat[] = [
  'csv', 'json', 'xml', 'yaml', 'html', 'table', 'tsv', 'kml', 'txt',
  'markdown', 'jsonl', 'ndjson', 'ics', 'toml', 'excel', 'sql', 'lines'
];

// POST /api/convert - Single format conversion
router.post('/convert', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, sourceFormat, targetFormat } = req.body;

    // Validation
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Data is required',
        statusCode: 400,
      });
    }

    if (!sourceFormat || !targetFormat) {
      return res.status(400).json({
        success: false,
        error: 'Source and target formats are required',
        statusCode: 400,
      });
    }

    // Validate formats
    if (!isValidFormat(sourceFormat) || !isValidFormat(targetFormat)) {
      return res.status(400).json({
        success: false,
        error: `Invalid format. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`,
        statusCode: 400,
      });
    }

    // Validate data size (max 5MB)
    const dataSize = Buffer.byteLength(data, 'utf8');
    if (dataSize > 5 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        error: 'Data too large. Maximum size is 5MB',
        statusCode: 413,
      });
    }

    logger.debug(`Converting from ${sourceFormat} to ${targetFormat}, size: ${dataSize} bytes`);

    try {
      const result = convertFormat(data, sourceFormat as SupportedFormat, targetFormat as SupportedFormat);
      
      res.json({
        success: true,
        data: result,
        statusCode: 200,
      });
    } catch (conversionError: any) {
      logger.error('Conversion error:', conversionError);
      res.status(400).json({
        success: false,
        error: sanitizeErrorMessage(conversionError.message),
        statusCode: 400,
      });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/convert/batch - Batch conversion
router.post('/convert/batch', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Items must be an array',
        statusCode: 400,
      });
    }

    if (items.length === 0 || items.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Batch must contain between 1 and 100 items',
        statusCode: 400,
      });
    }

    const results = items.map((item: any) => {
      try {
        const { data, sourceFormat, targetFormat } = item;

        if (!data || !sourceFormat || !targetFormat) {
          return {
            success: false,
            error: 'Missing required fields: data, sourceFormat, targetFormat',
          };
        }

        if (!isValidFormat(sourceFormat) || !isValidFormat(targetFormat)) {
          return {
            success: false,
            error: `Invalid format. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`,
          };
        }

        const dataSize = Buffer.byteLength(data, 'utf8');
        if (dataSize > 5 * 1024 * 1024) {
          return {
            success: false,
            error: 'Data too large (max 5MB per item)',
          };
        }

        const result = convertFormat(data, sourceFormat as SupportedFormat, targetFormat as SupportedFormat);
        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        return {
          success: false,
          error: sanitizeErrorMessage(error.message),
        };
      }
    });

    res.json({
      success: true,
      data: {
        results,
        totalItems: items.length,
        successCount: results.filter((r: any) => r.success).length,
        failureCount: results.filter((r: any) => !r.success).length,
      },
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/convert/presets - Get available presets (stub)
router.get('/convert/presets', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 'csv-to-json',
        name: 'CSV to JSON',
        sourceFormat: 'csv',
        targetFormat: 'json',
      },
      {
        id: 'json-to-csv',
        name: 'JSON to CSV',
        sourceFormat: 'json',
        targetFormat: 'csv',
      },
      {
        id: 'csv-to-xml',
        name: 'CSV to XML',
        sourceFormat: 'csv',
        targetFormat: 'xml',
      },
      {
        id: 'csv-to-yaml',
        name: 'CSV to YAML',
        sourceFormat: 'csv',
        targetFormat: 'yaml',
      },
    ],
    statusCode: 200,
  });
});

// GET /api/health - Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'conversion-api',
    timestamp: new Date().toISOString(),
  });
});

export default router;
