// backend/src/__tests__/utils/validationUtils.test.ts

import {
  validateEmail,
  validateURL,
  validatePhoneNumber,
  validateDate,
  validateNumber,
  validateLength,
  validateEnum,
  validatePattern,
  validateDelimiter,
  validateEncoding,
} from '../../utils/validationUtils';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user+tag@domain.co.uk')).toBe(true);
      expect(validateEmail('firstname.lastname@company.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test @example.com')).toBe(false);
    });
  });

  describe('validateURL', () => {
    it('should validate correct URLs', () => {
      expect(validateURL('https://example.com')).toBe(true);
      expect(validateURL('http://localhost:3000')).toBe(true);
      expect(validateURL('https://sub.domain.com/path?query=value')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateURL('not-a-url')).toBe(false);
      expect(validateURL('htp://invalid')).toBe(false);
      expect(validateURL('')).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhoneNumber('123-456-7890')).toBe(true);
      expect(validatePhoneNumber('(123) 456-7890')).toBe(true);
      expect(validatePhoneNumber('+1234567890')).toBe(true);
      expect(validatePhoneNumber('123.456.7890')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('123')).toBe(false);
      expect(validatePhoneNumber('abc-def-ghij')).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should validate correct date strings', () => {
      expect(validateDate('2024-01-15')).toBe(true);
      expect(validateDate('2024/01/15')).toBe(true);
      expect(validateDate('January 15, 2024')).toBe(true);
      expect(validateDate('2024-01-15T10:30:00Z')).toBe(true);
    });

    it('should reject invalid date strings', () => {
      expect(validateDate('not-a-date')).toBe(false);
      expect(validateDate('2024-13-45')).toBe(false);
      expect(validateDate('')).toBe(false);
    });
  });

  describe('validateNumber', () => {
    it('should validate correct numbers', () => {
      expect(validateNumber(42)).toBe(true);
      expect(validateNumber('42')).toBe(true);
      expect(validateNumber(3.14)).toBe(true);
      expect(validateNumber('-10')).toBe(true);
    });

    it('should reject invalid numbers', () => {
      expect(validateNumber('abc')).toBe(false);
      expect(validateNumber(NaN)).toBe(false);
      expect(validateNumber(Infinity)).toBe(false);
    });
  });

  describe('validateLength', () => {
    it('should validate strings within length range', () => {
      expect(validateLength('hello', 1, 10)).toBe(true);
      expect(validateLength('test', 4, 4)).toBe(true);
      expect(validateLength('', 0, 5)).toBe(true);
    });

    it('should reject strings outside length range', () => {
      expect(validateLength('hello', 10, 20)).toBe(false);
      expect(validateLength('test', 1, 3)).toBe(false);
      expect(validateLength('toolong', 1, 5)).toBe(false);
    });
  });

  describe('validateEnum', () => {
    it('should validate values in enum', () => {
      expect(validateEnum('red', ['red', 'green', 'blue'])).toBe(true);
      expect(validateEnum(1, [1, 2, 3])).toBe(true);
      expect(validateEnum('active', ['active', 'inactive'])).toBe(true);
    });

    it('should reject values not in enum', () => {
      expect(validateEnum('yellow', ['red', 'green', 'blue'])).toBe(false);
      expect(validateEnum(4, [1, 2, 3])).toBe(false);
    });
  });

  describe('validatePattern', () => {
    it('should validate strings matching regex pattern', () => {
      expect(validatePattern('abc123', '^[a-z]+[0-9]+$')).toBe(true);
      expect(validatePattern('ABC', '^[A-Z]+$')).toBe(true);
      expect(validatePattern('test@example.com', '.+@.+\\..+')).toBe(true);
    });

    it('should reject strings not matching pattern', () => {
      expect(validatePattern('123abc', '^[a-z]+[0-9]+$')).toBe(false);
      expect(validatePattern('abc', '^[0-9]+$')).toBe(false);
    });

    it('should handle invalid regex patterns', () => {
      expect(validatePattern('test', '[')).toBe(false);
    });
  });

  describe('validateDelimiter', () => {
    it('should validate correct delimiters', () => {
      expect(validateDelimiter(',')).toBe(true);
      expect(validateDelimiter(';')).toBe(true);
      expect(validateDelimiter('\t')).toBe(true);
      expect(validateDelimiter('|')).toBe(true);
      expect(validateDelimiter(':')).toBe(true);
    });

    it('should reject invalid delimiters', () => {
      expect(validateDelimiter('x')).toBe(false);
      expect(validateDelimiter('')).toBe(false);
      expect(validateDelimiter(' ')).toBe(false);
    });
  });

  describe('validateEncoding', () => {
    it('should validate correct encodings', () => {
      expect(validateEncoding('utf-8')).toBe(true);
      expect(validateEncoding('UTF-8')).toBe(true);
      expect(validateEncoding('utf8')).toBe(true);
      expect(validateEncoding('ascii')).toBe(true);
      expect(validateEncoding('latin1')).toBe(true);
    });

    it('should reject invalid encodings', () => {
      expect(validateEncoding('invalid')).toBe(false);
      expect(validateEncoding('utf-32')).toBe(false);
    });
  });
});
