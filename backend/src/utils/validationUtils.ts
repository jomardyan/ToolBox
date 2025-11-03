/**
 * Validation utilities for CSV data and application inputs
 */

export interface ValidationRule {
  type: 'required' | 'email' | 'url' | 'phone' | 'number' | 'date' | 'regex' | 'length' | 'enum';
  value?: any;
  message?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate email address
 */
export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate URL
 */
export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate phone number (basic international format)
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return regex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate date string (ISO 8601 or common formats)
 */
export const validateDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Validate number
 */
export const validateNumber = (value: any): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * Validate string length
 */
export const validateLength = (str: string, min: number, max: number): boolean => {
  return str.length >= min && str.length <= max;
};

/**
 * Validate enum value
 */
export const validateEnum = (value: any, allowedValues: any[]): boolean => {
  return allowedValues.includes(value);
};

/**
 * Validate regex pattern
 */
export const validatePattern = (value: string, pattern: string): boolean => {
  try {
    const regex = new RegExp(pattern);
    return regex.test(value);
  } catch {
    return false;
  }
};

/**
 * Validate CSV delimiter
 */
export const validateDelimiter = (delimiter: string): boolean => {
  const validDelimiters = [',', ';', '\t', '|', ':'];
  return validDelimiters.includes(delimiter);
};

/**
 * Validate CSV encoding
 */
export const validateEncoding = (encoding: string): boolean => {
  const validEncodings = ['utf-8', 'utf8', 'ascii', 'latin1', 'iso-8859-1', 'utf-16'];
  return validEncodings.includes(encoding.toLowerCase());
};

/**
 * Validate CSV file format
 */
export const validateCSVFormat = (csvContent: string): ValidationResult => {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  if (!csvContent || csvContent.trim().length === 0) {
    result.valid = false;
    result.errors.push('CSV content is empty');
    return result;
  }

  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    result.valid = false;
    result.errors.push('No data rows found in CSV');
    return result;
  }

  // Check header line
  const headerLine = lines[0];
  if (!headerLine || headerLine.trim().length === 0) {
    result.valid = false;
    result.errors.push('CSV header is empty');
    return result;
  }

  const headerCount = headerLine.split(',').length;

  // Check data consistency
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const columnCount = line.split(',').length;

    if (columnCount !== headerCount) {
      result.warnings.push(
        `Row ${i + 1}: Column count mismatch (expected ${headerCount}, got ${columnCount})`
      );
    }
  }

  if (result.warnings.length > 0) {
    result.valid = false;
  }

  return result;
};

/**
 * Validate headers
 */
export const validateHeaders = (headers: string[]): ValidationResult => {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  if (!headers || headers.length === 0) {
    result.valid = false;
    result.errors.push('Headers cannot be empty');
    return result;
  }

  // Check for duplicate headers
  const duplicates = headers.filter((header, index) => headers.indexOf(header) !== index);
  if (duplicates.length > 0) {
    result.valid = false;
    result.errors.push(`Duplicate headers found: ${duplicates.join(', ')}`);
  }

  // Check for empty headers
  const emptyHeaders = headers.filter(h => !h || h.trim().length === 0);
  if (emptyHeaders.length > 0) {
    result.warnings.push('Some headers are empty or contain only whitespace');
  }

  return result;
};

/**
 * Validate data row
 */
export const validateDataRow = (row: string[], headers: string[]): ValidationResult => {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  if (row.length !== headers.length) {
    result.valid = false;
    result.errors.push(
      `Row has ${row.length} columns but expected ${headers.length} (${headers.join(', ')})`
    );
  }

  // Check for empty cells
  const emptyCells = row.filter(cell => cell === null || cell === undefined || cell.trim() === '');
  if (emptyCells.length > 0) {
    result.warnings.push(`Row contains ${emptyCells.length} empty cell(s)`);
  }

  return result;
};

/**
 * Validate conversion request
 */
export const validateConversionRequest = (data: any): ValidationResult => {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  if (!data.csvContent || data.csvContent.trim().length === 0) {
    result.errors.push('CSV content is required');
  }

  if (!data.targetFormat) {
    result.errors.push('Target format is required');
  }

  if (data.sourceDelimiter && !validateDelimiter(data.sourceDelimiter)) {
    result.errors.push(`Invalid source delimiter: ${data.sourceDelimiter}`);
  }

  if (data.targetDelimiter && !validateDelimiter(data.targetDelimiter)) {
    result.errors.push(`Invalid target delimiter: ${data.targetDelimiter}`);
  }

  if (data.encoding && !validateEncoding(data.encoding)) {
    result.errors.push(`Invalid encoding: ${data.encoding}`);
  }

  result.valid = result.errors.length === 0;

  return result;
};

/**
 * Validate transformation options
 */
export const validateTransformOptions = (options: any): ValidationResult => {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const allowedOptions = [
    'trimWhitespace',
    'removeEmptyRows',
    'normalizeHeaders',
    'convertNumbers',
    'removeDuplicates',
  ];

  for (const key in options) {
    if (!allowedOptions.includes(key)) {
      result.warnings.push(`Unknown transformation option: ${key}`);
    }

    if (typeof options[key] !== 'boolean') {
      result.errors.push(`Option ${key} must be a boolean`);
    }
  }

  result.valid = result.errors.length === 0;

  return result;
};

/**
 * Validate preset object
 */
export const validatePreset = (preset: any): ValidationResult => {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  if (!preset.name || typeof preset.name !== 'string') {
    result.errors.push('Preset name is required and must be a string');
  }

  if (!preset.sourceFormat || typeof preset.sourceFormat !== 'string') {
    result.errors.push('Source format is required and must be a string');
  }

  if (!preset.targetFormat || typeof preset.targetFormat !== 'string') {
    result.errors.push('Target format is required and must be a string');
  }

  if (preset.options && typeof preset.options !== 'object') {
    result.errors.push('Options must be an object');
  }

  result.valid = result.errors.length === 0;

  return result;
};

/**
 * Validate column mapping
 */
export const validateColumnMapping = (
  sourceColumns: string[],
  targetColumns: string[],
  mapping: Record<string, string>
): ValidationResult => {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Check that all mapped source columns exist
  for (const sourceCol in mapping) {
    if (!sourceColumns.includes(sourceCol)) {
      result.errors.push(`Source column not found: ${sourceCol}`);
    }
  }

  // Check that all mapped target columns exist
  for (const sourceCol in mapping) {
    const targetCol = mapping[sourceCol];
    if (!targetColumns.includes(targetCol)) {
      result.errors.push(`Target column not found: ${targetCol}`);
    }
  }

  // Warn about unmapped source columns
  const mappedSource = Object.keys(mapping);
  const unmappedSource = sourceColumns.filter(col => !mappedSource.includes(col));
  if (unmappedSource.length > 0) {
    result.warnings.push(`Unmapped source columns: ${unmappedSource.join(', ')}`);
  }

  result.valid = result.errors.length === 0;

  return result;
};

/**
 * Sanitize input string
 */
export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove potentially harmful characters (basic protection)
  sanitized = sanitized.replace(/[<>\"'`]/g, '');

  return sanitized.trim();
};

/**
 * Validate data types in CSV
 */
export const validateDataTypes = (
  data: string[][],
  columnTypes: Record<string, string>
): ValidationResult => {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  if (!data || data.length === 0) {
    return result;
  }

  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    headers.forEach((header, index) => {
      const expectedType = columnTypes[header];
      const value = row[index];

      if (!expectedType || !value) return;

      let isValid = true;

      switch (expectedType.toLowerCase()) {
        case 'number':
          isValid = validateNumber(value);
          break;
        case 'date':
          isValid = validateDate(value);
          break;
        case 'email':
          isValid = validateEmail(value);
          break;
        case 'url':
          isValid = validateURL(value);
          break;
        case 'phone':
          isValid = validatePhoneNumber(value);
          break;
      }

      if (!isValid) {
        result.warnings.push(
          `Row ${i + 1}, Column "${header}": Invalid ${expectedType} value: "${value}"`
        );
      }
    });
  }

  return result;
};

/**
 * General validation runner
 */
export const validate = (value: any, rules: ValidationRule[]): ValidationResult => {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!value || (typeof value === 'string' && value.trim().length === 0)) {
          result.errors.push(rule.message || 'This field is required');
        }
        break;

      case 'email':
        if (value && !validateEmail(value)) {
          result.errors.push(rule.message || 'Invalid email address');
        }
        break;

      case 'url':
        if (value && !validateURL(value)) {
          result.errors.push(rule.message || 'Invalid URL');
        }
        break;

      case 'phone':
        if (value && !validatePhoneNumber(value)) {
          result.errors.push(rule.message || 'Invalid phone number');
        }
        break;

      case 'number':
        if (value && !validateNumber(value)) {
          result.errors.push(rule.message || 'Must be a number');
        }
        break;

      case 'date':
        if (value && !validateDate(value)) {
          result.errors.push(rule.message || 'Invalid date');
        }
        break;

      case 'length':
        if (value && !validateLength(value, rule.value.min, rule.value.max)) {
          result.errors.push(
            rule.message || `Must be between ${rule.value.min} and ${rule.value.max} characters`
          );
        }
        break;

      case 'enum':
        if (value && !validateEnum(value, rule.value)) {
          result.errors.push(rule.message || `Must be one of: ${rule.value.join(', ')}`);
        }
        break;

      case 'regex':
        if (value && !validatePattern(value, rule.value)) {
          result.errors.push(rule.message || 'Invalid format');
        }
        break;
    }
  }

  result.valid = result.errors.length === 0;

  return result;
};
