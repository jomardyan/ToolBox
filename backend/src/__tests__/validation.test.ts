import {
  validateDataLength,
  isValidFormat,
  validateColumns,
  validateFilterOptions,
  sanitizeInput,
} from '../utils/validation';

describe('Validation Utilities', () => {
  describe('validateDataLength', () => {
    test('should return true for valid data length', () => {
      const data = 'x'.repeat(1000);
      expect(validateDataLength(data)).toBe(true);
    });

    test('should return false for data exceeding max length', () => {
      const data = 'x'.repeat(6 * 1024 * 1024);
      expect(validateDataLength(data)).toBe(false);
    });

    test('should return false for non-string input', () => {
      expect(validateDataLength({} as any)).toBe(false);
    });
  });

  describe('isValidFormat', () => {
    test('should accept all 17 valid formats', () => {
      const validFormats = [
        'csv', 'json', 'xml', 'yaml', 'html', 'table', 'tsv', 'kml', 
        'txt', 'markdown', 'jsonl', 'ndjson', 'lines', 'ics', 'toml', 
        'excel', 'sql'
      ];
      validFormats.forEach(fmt => {
        expect(isValidFormat(fmt)).toBe(true);
      });
    });

    test('should accept all format aliases', () => {
      // Test HTML/Table alias
      expect(isValidFormat('html')).toBe(true);
      expect(isValidFormat('table')).toBe(true);
      
      // Test JSONL/NDJSON/Lines aliases
      expect(isValidFormat('jsonl')).toBe(true);
      expect(isValidFormat('ndjson')).toBe(true);
      expect(isValidFormat('lines')).toBe(true);
    });

    test('should be case-insensitive', () => {
      expect(isValidFormat('CSV')).toBe(true);
      expect(isValidFormat('Json')).toBe(true);
      expect(isValidFormat('YAML')).toBe(true);
      expect(isValidFormat('Html')).toBe(true);
      expect(isValidFormat('SQL')).toBe(true);
      expect(isValidFormat('MARKDOWN')).toBe(true);
    });

    test('should reject invalid formats', () => {
      expect(isValidFormat('exe')).toBe(false);
      expect(isValidFormat('xyz')).toBe(false);
      expect(isValidFormat('pdf')).toBe(false);
      expect(isValidFormat('doc')).toBe(false);
      expect(isValidFormat('random')).toBe(false);
    });

    test('should reject non-string input', () => {
      expect(isValidFormat(null as any)).toBe(false);
      expect(isValidFormat(undefined as any)).toBe(false);
      expect(isValidFormat(123 as any)).toBe(false);
      expect(isValidFormat({} as any)).toBe(false);
      expect(isValidFormat([] as any)).toBe(false);
    });

    test('should reject empty string', () => {
      expect(isValidFormat('')).toBe(false);
    });

    test('should validate all backend-supported formats', () => {
      // Core formats
      expect(isValidFormat('csv')).toBe(true);
      expect(isValidFormat('json')).toBe(true);
      expect(isValidFormat('xml')).toBe(true);
      expect(isValidFormat('yaml')).toBe(true);
      
      // Table formats
      expect(isValidFormat('html')).toBe(true);
      expect(isValidFormat('table')).toBe(true);
      expect(isValidFormat('tsv')).toBe(true);
      expect(isValidFormat('markdown')).toBe(true);
      
      // Data formats
      expect(isValidFormat('jsonl')).toBe(true);
      expect(isValidFormat('ndjson')).toBe(true);
      expect(isValidFormat('lines')).toBe(true);
      expect(isValidFormat('toml')).toBe(true);
      
      // Specialized formats
      expect(isValidFormat('kml')).toBe(true);
      expect(isValidFormat('ics')).toBe(true);
      expect(isValidFormat('sql')).toBe(true);
      expect(isValidFormat('excel')).toBe(true);
      expect(isValidFormat('txt')).toBe(true);
    });
  });

  describe('validateColumns', () => {
    test('should accept valid column array', () => {
      expect(validateColumns(['name', 'age', 'email'])).toBe(true);
    });

    test('should reject non-array input', () => {
      expect(validateColumns('name,age')).toBe(false);
    });

    test('should reject empty array', () => {
      expect(validateColumns([])).toBe(false);
    });

    test('should reject columns with empty strings', () => {
      expect(validateColumns(['name', '', 'age'])).toBe(false);
    });

    test('should reject non-string column values', () => {
      expect(validateColumns(['name', 123, 'email'])).toBe(false);
    });
  });

  describe('validateFilterOptions', () => {
    test('should allow undefined filter options', () => {
      expect(validateFilterOptions(undefined)).toBe(true);
    });

    test('should accept array of valid filter objects', () => {
      const filters = [
        { column: 'status', value: 'active', operator: 'equals' },
        { column: 'email', value: '@example.com', operator: 'contains' },
      ];
      expect(validateFilterOptions(filters)).toBe(true);
    });

    test('should default operator when omitted', () => {
      const filters = [{ column: 'status', value: 'active' }];
      expect(validateFilterOptions(filters)).toBe(true);
    });

    test('should reject non-array input', () => {
      expect(validateFilterOptions({ column: 'status', value: 'active' } as any)).toBe(false);
    });

    test('should reject invalid operator', () => {
      const filters = [{ column: 'status', value: 'active', operator: 'invalid' }];
      expect(validateFilterOptions(filters)).toBe(false);
    });

    test('should reject filters missing column', () => {
      const filters = [{ value: 'active' } as any];
      expect(validateFilterOptions(filters)).toBe(false);
    });

    test('should reject filters with non-string value', () => {
      const filters = [{ column: 'status', value: 42 as any }];
      expect(validateFilterOptions(filters)).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    test('should escape HTML special characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeInput(input);
      expect(result).toContain('&lt;');
      expect(result).not.toContain('<script>');
    });

    test('should escape quotes', () => {
      const input = 'Test "quoted"';
      const result = sanitizeInput(input);
      expect(result).toContain('&quot;');
    });

    test('should limit length to 1000 chars', () => {
      const input = 'x'.repeat(2000);
      const result = sanitizeInput(input);
      expect(result.length).toBeLessThanOrEqual(1000);
    });

    test('should return empty string for non-string input', () => {
      expect(sanitizeInput(null as any)).toBe('');
    });
  });
});
