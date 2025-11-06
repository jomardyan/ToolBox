// backend/src/__tests__/services/conversionService.test.ts

import { convertFormat, extractColumns } from '../../services/conversionService';

describe('ConversionService', () => {
  describe('convertFormat', () => {
    it('should return same data when source and target are identical', () => {
      const data = 'name,age\nJohn,30';
      const result = convertFormat(data, 'csv', 'csv');
      expect(result).toBe(data);
    });

    it('should convert CSV to JSON', () => {
      const csvData = 'name,age\nJohn,30\nJane,25';
      const result = convertFormat(csvData, 'csv', 'json');
      expect(result).toContain('John');
      expect(result).toContain('30');
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(2);
    });

    it('should convert JSON to CSV', () => {
      const jsonData = '[{"name":"John","age":30}]';
      const result = convertFormat(jsonData, 'json', 'csv');
      expect(result).toContain('name');
      expect(result).toContain('John');
    });

    it('should convert CSV to XML', () => {
      const csvData = 'name,age\nJohn,30';
      const result = convertFormat(csvData, 'csv', 'xml');
      expect(result).toContain('<?xml');
      expect(result).toContain('John');
    });

    it('should convert CSV to YAML', () => {
      const csvData = 'name,age\nJohn,30';
      const result = convertFormat(csvData, 'csv', 'yaml');
      expect(result).toContain('name');
      expect(result).toContain('John');
    });

    it('should convert CSV to HTML', () => {
      const csvData = 'name,age\nJohn,30';
      const result = convertFormat(csvData, 'csv', 'html');
      expect(result).toContain('<table');
      expect(result).toContain('John');
    });

    it('should convert CSV to TSV', () => {
      const csvData = 'name,age\nJohn,30';
      const result = convertFormat(csvData, 'csv', 'tsv');
      expect(result).toContain('name\tage');
      expect(result).toContain('John\t30');
    });

    it('should convert CSV to Markdown', () => {
      const csvData = 'name,age\nJohn,30';
      const result = convertFormat(csvData, 'csv', 'markdown');
      expect(result).toContain('|');
      expect(result).toContain('John');
    });

    it('should convert CSV to JSONL', () => {
      const csvData = 'name,age\nJohn,30\nJane,25';
      const result = convertFormat(csvData, 'csv', 'jsonl');
      expect(result).toContain('{"name":"John","age":"30"}');
      expect(result.split('\n')).toHaveLength(2);
    });

    it('should handle XML to JSON conversion', () => {
      const xmlData = '<?xml version="1.0"?><root><item><name>John</name></item></root>';
      const result = convertFormat(xmlData, 'xml', 'json');
      expect(result).toBeDefined();
    });

    it('should handle YAML to JSON conversion', () => {
      const yamlData = '- name: John\n  age: 30';
      const result = convertFormat(yamlData, 'yaml', 'json');
      expect(result).toBeDefined();
    });

    it('should throw error for invalid source format', () => {
      expect(() => {
        convertFormat('test', 'invalid' as any, 'json');
      }).toThrow();
    });

    it('should throw error for invalid target format', () => {
      expect(() => {
        convertFormat('name,age\nJohn,30', 'csv', 'invalid' as any);
      }).toThrow();
    });

    it('should handle empty data', () => {
      const result = convertFormat('', 'csv', 'json');
      expect(result).toBeDefined();
    });

    it('should convert TSV to CSV', () => {
      const tsvData = 'name\tage\nJohn\t30';
      const result = convertFormat(tsvData, 'tsv', 'csv');
      expect(result).toContain('name,age');
    });

    it('should convert JSONL to CSV', () => {
      const jsonlData = '{"name":"John","age":30}\n{"name":"Jane","age":25}';
      const result = convertFormat(jsonlData, 'jsonl', 'csv');
      expect(result).toContain('name');
      expect(result).toContain('John');
    });
  });

  describe('extractColumns', () => {
    it('should extract specified columns from CSV', () => {
      const csvData = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
      const result = extractColumns(csvData, ['name', 'city']);
      expect(result).toContain('name');
      expect(result).toContain('city');
    });

    it('should filter rows during extraction', () => {
      const csvData = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
      const result = extractColumns(csvData, ['name', 'age'], [{
        column: 'age',
        value: '30',
        operator: 'equals',
      }]);
      expect(result).toContain('John');
    });

    it('should handle empty columns array', () => {
      const csvData = 'name,age,city\nJohn,30,NYC';
      const result = extractColumns(csvData, []);
      expect(result).toBeDefined();
    });

    it('should handle non-existent columns', () => {
      const csvData = 'name,age,city\nJohn,30,NYC';
      const result = extractColumns(csvData, ['nonexistent']);
      expect(result).toBeDefined();
    });
  });
});
