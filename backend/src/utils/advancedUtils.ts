/**
 * Advanced conversion utilities for enhanced data processing
 */

import { parseCSV, generateCSV } from './csvUtils';
import logger from './logger';

/**
 * Data transformation options
 */
export interface TransformOptions {
  trimWhitespace?: boolean;
  removeEmptyRows?: boolean;
  normalizeHeaders?: boolean;
  convertNumbers?: boolean;
  removeDuplicates?: boolean;
}

/**
 * Normalize CSV headers (remove spaces, special characters)
 */
export const normalizeHeaders = (headers: string[]): string[] => {
  return headers.map((header) =>
    header
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
  );
};

/**
 * Transform CSV data based on options
 */
export const transformCSVData = (csvData: string, options: TransformOptions = {}): string => {
  const { rows, headers } = parseCSV(csvData);

  let transformedRows = rows;

  // Trim whitespace
  if (options.trimWhitespace) {
    transformedRows = transformedRows.map((row) => {
      const trimmedRow: Record<string, any> = {};
      Object.entries(row).forEach(([key, value]) => {
        trimmedRow[key] = typeof value === 'string' ? value.trim() : value;
      });
      return trimmedRow;
    });
  }

  // Remove empty rows
  if (options.removeEmptyRows) {
    transformedRows = transformedRows.filter((row) => {
      return Object.values(row).some((value) => value !== null && value !== undefined && value !== '');
    });
  }

  // Convert string numbers to actual numbers
  if (options.convertNumbers) {
    transformedRows = transformedRows.map((row) => {
      const convertedRow: Record<string, any> = {};
      Object.entries(row).forEach(([key, value]) => {
        if (typeof value === 'string' && !isNaN(Number(value)) && value !== '') {
          convertedRow[key] = Number(value);
        } else {
          convertedRow[key] = value;
        }
      });
      return convertedRow;
    });
  }

  // Remove duplicates
  if (options.removeDuplicates) {
    const seen = new Set();
    transformedRows = transformedRows.filter((row) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Normalize headers
  const finalHeaders = options.normalizeHeaders ? normalizeHeaders(headers) : headers;

  // Reconstruct CSV with transformed data
  const resultRows = transformedRows.map((row) => {
    const newRow: Record<string, any> = {};
    finalHeaders.forEach((header, index) => {
      const originalHeader = headers[index];
      newRow[header] = row[originalHeader];
    });
    return newRow;
  });

  return generateCSV(resultRows, finalHeaders);
};

/**
 * Detect delimiter in text data
 */
export const detectDelimiter = (data: string): string => {
  const delimiters = [',', ';', '\t', '|'];
  const firstLine = data.split('\n')[0];

  let maxCount = 0;
  let detectedDelimiter = ',';

  delimiters.forEach((delimiter) => {
    const count = firstLine.split(delimiter).length;
    if (count > maxCount) {
      maxCount = count;
      detectedDelimiter = delimiter;
    }
  });

  return detectedDelimiter;
};

/**
 * Detect data type of a column
 */
export const detectColumnType = (values: any[]): string => {
  const nonEmptyValues = values.filter((v) => v !== null && v !== undefined && v !== '');

  if (nonEmptyValues.length === 0) return 'string';

  const allNumbers = nonEmptyValues.every((v) => !isNaN(Number(v)) && v !== '');
  if (allNumbers) return 'number';

  const allBooleans = nonEmptyValues.every((v) => v === 'true' || v === 'false' || v === '1' || v === '0');
  if (allBooleans) return 'boolean';

  const allDates = nonEmptyValues.every((v) => !isNaN(Date.parse(v)));
  if (allDates) return 'date';

  return 'string';
};

/**
 * Generate schema from CSV data
 */
export const generateSchema = (csvData: string): Record<string, string> => {
  const { rows, headers } = parseCSV(csvData);

  const schema: Record<string, string> = {};

  headers.forEach((header) => {
    const values = rows.map((row) => row[header]);
    schema[header] = detectColumnType(values);
  });

  return schema;
};

/**
 * Get data statistics
 */
export const getDataStatistics = (csvData: string): any => {
  const { rows, headers } = parseCSV(csvData);

  const stats: Record<string, any> = {
    rowCount: rows.length,
    columnCount: headers.length,
    columns: {},
  };

  headers.forEach((header) => {
    const values = rows.map((row) => row[header]);
    const nonEmptyCount = values.filter((v) => v !== null && v !== undefined && v !== '').length;

    stats.columns[header] = {
      type: detectColumnType(values),
      nonEmpty: nonEmptyCount,
      empty: rows.length - nonEmptyCount,
      fillRate: Math.round((nonEmptyCount / rows.length) * 100),
      unique: new Set(values).size,
    };

    if (stats.columns[header].type === 'number') {
      const numbers = values.filter((v) => !isNaN(Number(v))).map(Number);
      if (numbers.length > 0) {
        stats.columns[header].min = Math.min(...numbers);
        stats.columns[header].max = Math.max(...numbers);
        stats.columns[header].avg = Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 100) / 100;
      }
    }
  });

  return stats;
};

/**
 * Validate data consistency
 */
export const validateDataConsistency = (csvData: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  const { rows, headers } = parseCSV(csvData);

  if (rows.length === 0) {
    errors.push('No data rows found');
  }

  if (headers.length === 0) {
    errors.push('No headers found');
  }

  // Check for inconsistent column counts
  rows.forEach((row, index) => {
    if (Object.keys(row).length !== headers.length) {
      errors.push(`Row ${index + 1} has inconsistent column count`);
    }
  });

  // Check for missing values in key columns
  if (headers.length > 0) {
    headers.forEach((header) => {
      const emptyCount = rows.filter((row) => !row[header] || row[header] === '').length;
      if (emptyCount > 0 && emptyCount === rows.length) {
        errors.push(`Column "${header}" is completely empty`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Merge multiple CSV datasets
 */
export const mergeCSVData = (csvDataArray: string[]): string => {
  if (csvDataArray.length === 0) return '';
  if (csvDataArray.length === 1) return csvDataArray[0];

  const allRows: Record<string, any>[] = [];
  let commonHeaders: string[] = [];

  csvDataArray.forEach((csvData, index) => {
    const { rows, headers } = parseCSV(csvData);

    if (index === 0) {
      commonHeaders = headers;
    } else {
      // Merge headers
      commonHeaders = Array.from(new Set([...commonHeaders, ...headers]));
    }

    allRows.push(...rows);
  });

  return generateCSV(allRows, commonHeaders);
};

/**
 * Split CSV data by column value
 */
export const splitCSVByColumn = (
  csvData: string,
  columnName: string
): Record<string, string> => {
  const { rows, headers } = parseCSV(csvData);

  if (!headers.includes(columnName)) {
    throw new Error(`Column "${columnName}" not found`);
  }

  const groupedData: Record<string, Record<string, any>[]> = {};

  rows.forEach((row) => {
    const key = String(row[columnName]);
    if (!groupedData[key]) {
      groupedData[key] = [];
    }
    groupedData[key].push(row);
  });

  const result: Record<string, string> = {};
  Object.entries(groupedData).forEach(([key, groupRows]) => {
    result[key] = generateCSV(groupRows, headers);
  });

  return result;
};

/**
 * Sample data from CSV
 */
export const sampleCSVData = (csvData: string, sampleSize: number = 100): string => {
  const { rows, headers } = parseCSV(csvData);

  const sampledRows = rows.slice(0, sampleSize);
  return generateCSV(sampledRows, headers);
};

/**
 * Paginate CSV data
 */
export const paginateCSVData = (
  csvData: string,
  pageNumber: number = 1,
  pageSize: number = 50
): { data: string; totalPages: number; currentPage: number } => {
  const { rows, headers } = parseCSV(csvData);

  const totalPages = Math.ceil(rows.length / pageSize);
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedRows = rows.slice(startIndex, endIndex);
  const data = generateCSV(paginatedRows, headers);

  return {
    data,
    totalPages,
    currentPage: pageNumber,
  };
};

/**
 * Search in CSV data
 */
export const searchCSVData = (csvData: string, searchTerm: string, columnNames?: string[]): Record<string, any>[] => {
  const { rows, headers } = parseCSV(csvData);

  const searchColumns = columnNames || headers;
  const lowerSearchTerm = searchTerm.toLowerCase();

  return rows.filter((row) => {
    return searchColumns.some((col) => {
      const value = String(row[col] || '').toLowerCase();
      return value.includes(lowerSearchTerm);
    });
  });
};
