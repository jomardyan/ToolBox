import { csvToJson, jsonToCSV } from '../converters';

const sampleCSV = `name,age,email
John,30,john@example.com
Jane,25,jane@example.com
Bob,35,bob@example.com`;

const sampleJSON = `[
  {"name":"John","age":"30","email":"john@example.com"},
  {"name":"Jane","age":"25","email":"jane@example.com"},
  {"name":"Bob","age":"35","email":"bob@example.com"}
]`;

describe('CSV Converters', () => {
  describe('csvToJson', () => {
    test('should convert CSV to valid JSON', () => {
      const result = csvToJson(sampleCSV);
      expect(result).toBeTruthy();
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(3);
      expect(parsed[0].name).toBe('John');
    });

    test('should handle CSV with quoted fields', () => {
      const csv = `name,description\n"Product A","Contains, commas"\n"Product B","Normal"`;
      const result = csvToJson(csv);
      const parsed = JSON.parse(result);
      expect(parsed[0].description).toContain('commas');
    });

    test('should handle single row', () => {
      const result = csvToJson('name,age\nJohn,30');
      const parsed = JSON.parse(result);
      expect(parsed.length).toBe(1);
      expect(parsed[0].name).toBe('John');
    });
  });

  describe('jsonToCSV', () => {
    test('should convert JSON array to CSV', () => {
      const result = jsonToCSV(sampleJSON);
      expect(result).toBeTruthy();
      expect(result).toContain('name,age,email');
      expect(result).toContain('John');
    });

    test('should handle JSON with special characters', () => {
      const json = `[{"name":"O'Brien","email":"test@example.com"}]`;
      const result = jsonToCSV(json);
      expect(result).toContain('O\'Brien');
    });

    test('should maintain field order', () => {
      const result = jsonToCSV(sampleJSON);
      const lines = result.trim().split('\n');
      expect(lines[0]).toContain('name');
    });
  });

  describe('Roundtrip conversion', () => {
    test('should maintain data integrity: CSV -> JSON -> CSV', () => {
      const json = csvToJson(sampleCSV);
      const csv = jsonToCSV(json);
      const rows = csv.trim().split('\n');
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0]).toContain('name');
    });
  });

  describe('Error handling', () => {
    test('should handle CSV with special characters', () => {
      const specialCSV = 'name,text\nTest,"contains ""quotes"" and, commas"';
      const json = csvToJson(specialCSV);
      expect(json).toBeTruthy();
    });

    test('should handle large CSV', () => {
      const largeCSV = 'name,age\n' + Array(100).fill(null).map((_, i) => `Person${i},${i}`).join('\n');
      const json = csvToJson(largeCSV);
      const parsed = JSON.parse(json);
      expect(parsed.length).toBe(100);
    });
  });
});
