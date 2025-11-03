import {
  validateDataLength,
  isValidFormat,
  validateColumns,
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
    test('should accept all valid formats', () => {
      const validFormats = ['csv', 'json', 'xml', 'yaml', 'html', 'tsv', 'kml', 'txt'];
      validFormats.forEach(fmt => {
        expect(isValidFormat(fmt)).toBe(true);
      });
    });

    test('should be case-insensitive', () => {
      expect(isValidFormat('CSV')).toBe(true);
      expect(isValidFormat('Json')).toBe(true);
    });

    test('should reject invalid formats', () => {
      expect(isValidFormat('exe')).toBe(false);
      expect(isValidFormat('xyz')).toBe(false);
    });

    test('should reject non-string input', () => {
      expect(isValidFormat(null as any)).toBe(false);
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
