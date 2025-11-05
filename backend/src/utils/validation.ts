/**
 * Validation utilities for security and input validation
 */

// Maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Maximum data string length (5MB as string)
export const MAX_DATA_LENGTH = 5 * 1024 * 1024;

// Allowed MIME types
export const ALLOWED_MIME_TYPES = [
  'text/plain',
  'text/csv',
  'application/json',
  'application/xml',
  'text/xml',
  'application/yaml',
  'text/yaml',
  'text/html',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/sql',
  'text/sql',
  'application/x-sql',
];

/**
 * Validates file size
 */
export function validateFileSize(data: string): boolean {
  if (typeof data !== 'string') {
    return false;
  }
  
  const sizeInBytes = Buffer.byteLength(data, 'utf8');
  return sizeInBytes <= MAX_FILE_SIZE;
}

/**
 * Validates data length
 */
export function validateDataLength(data: string): boolean {
  if (typeof data !== 'string') {
    return false;
  }
  
  return data.length <= MAX_DATA_LENGTH;
}

/**
 * Validates MIME type
 */
export function validateMimeType(mimeType: string): boolean {
  if (!mimeType || typeof mimeType !== 'string') {
    return false;
  }
  
  return ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase());
}

/**
 * Sanitizes user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove any potentially dangerous characters
  return input
    .replace(/[<>\"']/g, match => {
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return escapeMap[match];
    })
    .substring(0, 1000); // Limit to 1000 chars for field values
}

/**
 * Validates format is supported
 */
export function isValidFormat(format: string): boolean {
  const validFormats = ['csv', 'json', 'xml', 'yaml', 'html', 'table', 'tsv', 'kml', 'txt', 'markdown', 'jsonl', 'ndjson', 'ics', 'toml', 'lines', 'excel', 'sql'];
  return typeof format === 'string' && validFormats.includes(format.toLowerCase());
}

/**
 * Validates array of columns
 */
export function validateColumns(columns: any): boolean {
  if (!Array.isArray(columns)) {
    return false;
  }
  
  if (columns.length === 0 || columns.length > 100) {
    return false;
  }
  
  return columns.every((col: any) => {
    return typeof col === 'string' && col.length > 0 && col.length <= 255;
  });
}

/**
 * Validates filter options
 */
export function validateFilterOptions(filterOptions: any): boolean {
  if (!filterOptions) {
    return true; // Filter options are optional
  }

  if (!Array.isArray(filterOptions)) {
    return false;
  }

  const validOperators = ['equals', 'contains', 'startsWith', 'endsWith'];

  return filterOptions.every((filter) => {
    if (!filter || typeof filter !== 'object' || Array.isArray(filter)) {
      return false;
    }

    const { column, value, operator } = filter;

    if (typeof column !== 'string' || column.length === 0 || column.length > 255) {
      return false;
    }

    if (typeof value !== 'string' || value.length > 255) {
      return false;
    }

    if (operator && !validOperators.includes(operator)) {
      return false;
    }

    return true;
  });
}

/**
 * Sanitizes error message to not leak sensitive information
 */
export function sanitizeErrorMessage(error: any): string {
  const message = (error?.message || 'Unknown error').toString();
  
  // Don't expose file paths or system info
  const sanitized = message
    .replace(/\/[a-zA-Z0-9_\-\/]+\//g, '[path]')
    .replace(/:\s*line\s+\d+/gi, '[location]')
    .substring(0, 500);
  
  return sanitized;
}

/**
 * Rate limit configuration presets
 */
export const RATE_LIMIT_CONFIG = {
  // Strict: 10 requests per minute
  strict: {
    windowMs: 60 * 1000,
    max: 10,
    message: 'Too many requests from this IP, please try again later.',
  },
  
  // Normal: 30 requests per minute
  normal: {
    windowMs: 60 * 1000,
    max: 30,
    message: 'Too many requests from this IP, please try again later.',
  },
  
  // Relaxed: 100 requests per minute
  relaxed: {
    windowMs: 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
  },
  
  // Batch operations: 5 requests per minute
  batch: {
    windowMs: 60 * 1000,
    max: 5,
    message: 'Too many batch requests from this IP, please try again later.',
  },
};
