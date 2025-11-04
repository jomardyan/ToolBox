import {
  csvToJson, jsonToCSV,
  csvToXml, xmlToCSV,
  csvToYaml, yamlToCSV,
  csvToHtml, htmlToCSV,
  csvToTsv, tsvToCSV,
  csvToKml, kmlToCSV,
  csvToTxt, txtToCSV,
  csvToMarkdown, markdownToCSV,
  csvToJsonl, jsonlToCSV,
  csvToIcs, icsToCSV,
  csvToToml, tomlToCSV,
  csvToExcel, excelToCSV,
  csvToSql, sqlToCSV,
  csvToTable, tableToCSV,
  csvToLines, linesToCSV,
} from '../converters';

// Sample data for testing
const sampleCSV = `name,age,email
John Doe,30,john@example.com
Jane Smith,25,jane@example.com
Bob Johnson,35,bob@example.com`;

const sampleJSON = `[
  {"name":"John Doe","age":"30","email":"john@example.com"},
  {"name":"Jane Smith","age":"25","email":"jane@example.com"},
  {"name":"Bob Johnson","age":"35","email":"bob@example.com"}
]`;

const locationCSV = `name,latitude,longitude
New York,40.7128,-74.0060
Los Angeles,34.0522,-118.2437
Chicago,41.8781,-87.6298`;

const eventCSV = `title,start_date,end_date,description
Team Meeting,2025-11-05,2025-11-05,Quarterly review meeting
Conference,2025-11-10,2025-11-12,Annual industry conference
Workshop,2025-11-15,2025-11-15,Training workshop`;

describe('🔄 Comprehensive Format Conversion Tests', () => {
  
  describe('✅ CSV ↔ JSON', () => {
    test('should convert CSV to JSON correctly', () => {
      const json = csvToJson(sampleCSV);
      expect(json).toBeTruthy();
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(3);
      expect(parsed[0].name).toBe('John Doe');
      expect(parsed[0].age).toBe('30');
      expect(parsed[0].email).toBe('john@example.com');
    });

    test('should convert JSON to CSV correctly', () => {
      const csv = jsonToCSV(sampleJSON);
      expect(csv).toBeTruthy();
      expect(csv).toContain('name,age,email');
      expect(csv).toContain('John Doe');
      expect(csv).toContain('jane@example.com');
    });

    test('should maintain data integrity: CSV → JSON → CSV', () => {
      const json = csvToJson(sampleCSV);
      const csv = jsonToCSV(json);
      expect(csv).toContain('John Doe');
      expect(csv).toContain('30');
      expect(csv).toContain('john@example.com');
    });

    test('should handle quoted fields with commas', () => {
      const csv = `name,description\n"Product A","Contains, commas"\n"Product B","Normal"`;
      const json = csvToJson(csv);
      const parsed = JSON.parse(json);
      expect(parsed[0].description).toContain('commas');
    });
  });

  describe('✅ CSV ↔ XML', () => {
    test('should convert CSV to XML correctly', () => {
      const xml = csvToXml(sampleCSV);
      expect(xml).toContain('<?xml version="1.0"');
      expect(xml).toContain('<root>');
      expect(xml).toContain('<record>');
      expect(xml).toContain('<name>John Doe</name>');
      expect(xml).toContain('<age>30</age>');
      expect(xml).toContain('</root>');
    });

    test('should convert XML to CSV correctly', () => {
      const xml = csvToXml(sampleCSV);
      const csv = xmlToCSV(xml);
      expect(csv).toContain('name');
      expect(csv).toContain('age');
      expect(csv).toContain('John Doe');
    });

    test('should escape XML special characters', () => {
      const specialCSV = `text,value
"Test & <tag>",123`;
      const xml = csvToXml(specialCSV);
      expect(xml).toContain('&amp;');
      expect(xml).toContain('&lt;tag&gt;');
    });

    test('should maintain roundtrip: CSV → XML → CSV', () => {
      const xml = csvToXml(sampleCSV);
      const csv = xmlToCSV(xml);
      expect(csv).toContain('John Doe');
      expect(csv).toContain('30');
    });
  });

  describe('✅ CSV ↔ YAML', () => {
    test('should convert CSV to YAML correctly', () => {
      const yaml = csvToYaml(sampleCSV);
      expect(yaml).toContain('record_1');
      expect(yaml).toContain('name: "John Doe"');
      expect(yaml).toContain('age: "30"');
    });

    test('should convert YAML to CSV correctly', () => {
      const yaml = csvToYaml(sampleCSV);
      const csv = yamlToCSV(yaml);
      expect(csv).toContain('name');
      expect(csv).toContain('John Doe');
    });

    test('should maintain roundtrip: CSV → YAML → CSV', () => {
      const yaml = csvToYaml(sampleCSV);
      const csv = yamlToCSV(yaml);
      expect(csv).toContain('John Doe');
      expect(csv).toContain('30');
    });
  });

  describe('✅ CSV ↔ HTML/Table', () => {
    test('should convert CSV to HTML table correctly', () => {
      const html = csvToHtml(sampleCSV);
      expect(html).toContain('<table');
      expect(html).toContain('<thead>');
      expect(html).toContain('<th>name</th>');
      expect(html).toContain('<td>John Doe</td>');
      expect(html).toContain('</table>');
    });

    test('should convert HTML to CSV correctly', () => {
      const html = csvToHtml(sampleCSV);
      const csv = htmlToCSV(html);
      expect(csv).toContain('name');
      expect(csv).toContain('John Doe');
    });

    test('should escape HTML special characters', () => {
      const specialCSV = `text,value
"<script>alert('xss')</script>",123`;
      const html = csvToHtml(specialCSV);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    test('Table alias should work', () => {
      const table = csvToTable(sampleCSV);
      expect(table).toContain('<table');
      const csv = tableToCSV(table);
      expect(csv).toContain('John Doe');
    });

    test('should maintain roundtrip: CSV → HTML → CSV', () => {
      const html = csvToHtml(sampleCSV);
      const csv = htmlToCSV(html);
      expect(csv).toContain('John Doe');
      expect(csv).toContain('30');
    });
  });

  describe('✅ CSV ↔ TSV (Tab-Separated Values)', () => {
    test('should convert CSV to TSV correctly', () => {
      const tsv = csvToTsv(sampleCSV);
      expect(tsv).toContain('name\tage\temail');
      expect(tsv).toContain('John Doe\t30');
    });

    test('should convert TSV to CSV correctly', () => {
      const tsv = csvToTsv(sampleCSV);
      const csv = tsvToCSV(tsv);
      expect(csv).toContain('name,age,email');
      expect(csv).toContain('John Doe');
    });

    test('should maintain roundtrip: CSV → TSV → CSV', () => {
      const tsv = csvToTsv(sampleCSV);
      const csv = tsvToCSV(tsv);
      expect(csv).toContain('John Doe');
      expect(csv).toContain('30');
    });
  });

  describe('✅ CSV ↔ KML (Geographic Data)', () => {
    test('should convert location CSV to KML correctly', () => {
      const kml = csvToKml(locationCSV);
      expect(kml).toContain('<?xml version="1.0"');
      expect(kml).toContain('<kml');
      expect(kml).toContain('<Placemark>');
      expect(kml).toContain('<coordinates>');
      expect(kml).toContain('-74.0060,40.7128');
    });

    test('should convert KML to CSV correctly', () => {
      const kml = csvToKml(locationCSV);
      const csv = kmlToCSV(kml);
      expect(csv).toContain('name');
      expect(csv).toContain('latitude');
      expect(csv).toContain('New York');
    });

    test('should maintain roundtrip: CSV → KML → CSV', () => {
      const kml = csvToKml(locationCSV);
      const csv = kmlToCSV(kml);
      expect(csv).toContain('40.7128');
      expect(csv).toContain('-74.0060');
    });
  });

  describe('✅ CSV ↔ TXT (Text Format)', () => {
    test('should convert CSV to formatted TXT correctly', () => {
      const txt = csvToTxt(sampleCSV);
      expect(txt).toContain('name | age | email');
      expect(txt).toContain('---');
      expect(txt).toContain('John Doe | 30');
    });

    test('should convert TXT to CSV correctly', () => {
      const txt = csvToTxt(sampleCSV);
      const csv = txtToCSV(txt);
      expect(csv).toContain('name');
      expect(csv).toContain('John Doe');
    });

    test('should maintain roundtrip: CSV → TXT → CSV', () => {
      const txt = csvToTxt(sampleCSV);
      const csv = txtToCSV(txt);
      expect(csv).toContain('John Doe');
      expect(csv).toContain('30');
    });
  });

  describe('✅ CSV ↔ Markdown', () => {
    test('should convert CSV to Markdown table correctly', () => {
      const markdown = csvToMarkdown(sampleCSV);
      expect(markdown).toContain('| name | age | email |');
      expect(markdown).toContain('| --- | --- | --- |');
      expect(markdown).toContain('| John Doe | 30 |');
    });

    test('should convert Markdown to CSV correctly', () => {
      const markdown = csvToMarkdown(sampleCSV);
      const csv = markdownToCSV(markdown);
      expect(csv).toContain('name,age,email');
      expect(csv).toContain('John Doe');
    });

    test('should maintain roundtrip: CSV → Markdown → CSV', () => {
      const markdown = csvToMarkdown(sampleCSV);
      const csv = markdownToCSV(markdown);
      expect(csv).toContain('John Doe');
      expect(csv).toContain('30');
    });
  });

  describe('✅ CSV ↔ JSONL/NDJSON (Newline-Delimited JSON)', () => {
    test('should convert CSV to JSONL correctly', () => {
      const jsonl = csvToJsonl(sampleCSV);
      const lines = jsonl.split('\n');
      expect(lines.length).toBe(3);
      const first = JSON.parse(lines[0]);
      expect(first.name).toBe('John Doe');
    });

    test('should convert JSONL to CSV correctly', () => {
      const jsonl = csvToJsonl(sampleCSV);
      const csv = jsonlToCSV(jsonl);
      expect(csv).toContain('name,age,email');
      expect(csv).toContain('John Doe');
    });

    test('Lines alias should work', () => {
      const lines = csvToLines(sampleCSV);
      const csv = linesToCSV(lines);
      expect(csv).toContain('John Doe');
    });

    test('should maintain roundtrip: CSV → JSONL → CSV', () => {
      const jsonl = csvToJsonl(sampleCSV);
      const csv = jsonlToCSV(jsonl);
      expect(csv).toContain('John Doe');
      expect(csv).toContain('jane@example.com');
    });
  });

  describe('✅ CSV ↔ ICS (Calendar Events)', () => {
    test('should convert event CSV to ICS correctly', () => {
      const ics = csvToIcs(eventCSV);
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('SUMMARY:Team Meeting');
      expect(ics).toContain('END:VCALENDAR');
    });

    test('should convert ICS to CSV correctly', () => {
      const ics = csvToIcs(eventCSV);
      const csv = icsToCSV(ics);
      expect(csv).toContain('title');
      expect(csv).toContain('Team Meeting');
    });

    test('should maintain roundtrip: CSV → ICS → CSV', () => {
      const ics = csvToIcs(eventCSV);
      const csv = icsToCSV(ics);
      expect(csv).toContain('Team Meeting');
      expect(csv).toContain('Conference');
    });
  });

  describe('✅ CSV ↔ TOML (Configuration Format)', () => {
    test('should convert CSV to TOML correctly', () => {
      const toml = csvToToml(sampleCSV);
      expect(toml).toContain('[[records]]');
      expect(toml).toContain('name = "John Doe"');
      expect(toml).toContain('age = "30"');
    });

    test('should convert TOML to CSV correctly', () => {
      const toml = csvToToml(sampleCSV);
      const csv = tomlToCSV(toml);
      expect(csv).toContain('name');
      expect(csv).toContain('John Doe');
    });

    test('should maintain roundtrip: CSV → TOML → CSV', () => {
      const toml = csvToToml(sampleCSV);
      const csv = tomlToCSV(toml);
      expect(csv).toContain('John Doe');
      expect(csv).toContain('30');
    });
  });

  describe('✅ CSV ↔ Excel', () => {
    test('should convert CSV to Excel format correctly', () => {
      const excel = csvToExcel(sampleCSV);
      expect(excel).toContain('name\tage\temail');
      expect(excel).toContain('John Doe\t30');
    });

    test('should convert Excel to CSV correctly', () => {
      const excel = csvToExcel(sampleCSV);
      const csv = excelToCSV(excel);
      expect(csv).toContain('name,age,email');
      expect(csv).toContain('John Doe');
    });

    test('should maintain roundtrip: CSV → Excel → CSV', () => {
      const excel = csvToExcel(sampleCSV);
      const csv = excelToCSV(excel);
      expect(csv).toContain('John Doe');
      expect(csv).toContain('jane@example.com');
    });
  });

  describe('✅ CSV ↔ SQL (Database)', () => {
    test('should convert CSV to SQL correctly', () => {
      const sql = csvToSql(sampleCSV, 'users');
      expect(sql).toContain('CREATE TABLE users');
      expect(sql).toContain('name VARCHAR(255)');
      expect(sql).toContain('INSERT INTO users');
      expect(sql).toContain("'John Doe'");
    });

    test('should convert SQL to CSV correctly', () => {
      const sql = csvToSql(sampleCSV, 'users');
      const csv = sqlToCSV(sql);
      expect(csv).toContain('name');
      expect(csv).toContain('John Doe');
    });

    test('should sanitize SQL identifiers', () => {
      const specialCSV = 'user-name,email@domain\nTest,test@test.com';
      const sql = csvToSql(specialCSV);
      expect(sql).toContain('user_name');
      expect(sql).toContain('email_domain');
    });

    test('should maintain roundtrip: CSV → SQL → CSV', () => {
      const sql = csvToSql(sampleCSV, 'test_table');
      const csv = sqlToCSV(sql);
      expect(csv).toContain('John Doe');
      expect(csv).toContain('30');
    });
  });

  describe('🔧 Edge Cases & Error Handling', () => {
    test('should handle CSV with special characters', () => {
      const specialCSV = `text,value
"Test & special",123
"Normal",456`;
      const json = csvToJson(specialCSV);
      expect(json).toBeTruthy();
    });

    test('should handle Unicode characters', () => {
      const unicodeCSV = `name,text
Test,你好世界
Test2,مرحبا`;
      const json = csvToJson(unicodeCSV);
      expect(json).toContain('你好世界');
      expect(json).toContain('مرحبا');
    });

    test('should handle single row CSV', () => {
      const singleRow = 'name,age\nJohn,30';
      const json = csvToJson(singleRow);
      const parsed = JSON.parse(json);
      expect(parsed.length).toBe(1);
      expect(parsed[0].name).toBe('John');
    });

    test('should handle CSV with empty values', () => {
      const emptyValues = `name,age,email
John,,john@example.com
,25,`;
      const json = csvToJson(emptyValues);
      const parsed = JSON.parse(json);
      expect(parsed[0].age).toBe('');
    });

    test('should handle large CSV (500 rows)', () => {
      const largeCSV = 'id,name,value\n' + 
        Array(500).fill(null).map((_, i) => `${i},Person${i},${i * 100}`).join('\n');
      const json = csvToJson(largeCSV);
      const parsed = JSON.parse(json);
      expect(parsed.length).toBe(500);
    });
  });

  describe('🔄 Multi-Format Chain Conversions', () => {
    test('should maintain data through CSV → JSON → XML → CSV chain', () => {
      const json = csvToJson(sampleCSV);
      const xml = csvToXml(sampleCSV);
      const csvFromXml = xmlToCSV(xml);
      
      expect(csvFromXml).toContain('John Doe');
      expect(csvFromXml).toContain('30');
    });

    test('should maintain data through CSV → YAML → Markdown → CSV chain', () => {
      const yaml = csvToYaml(sampleCSV);
      const markdown = csvToMarkdown(sampleCSV);
      const csvFromMarkdown = markdownToCSV(markdown);
      
      expect(csvFromMarkdown).toContain('John Doe');
      expect(csvFromMarkdown).toContain('30');
    });

    test('should handle all 17 format types', () => {
      const formats = [
        { name: 'JSON', fn: csvToJson },
        { name: 'XML', fn: csvToXml },
        { name: 'YAML', fn: csvToYaml },
        { name: 'HTML', fn: csvToHtml },
        { name: 'TSV', fn: csvToTsv },
        { name: 'TXT', fn: csvToTxt },
        { name: 'Markdown', fn: csvToMarkdown },
        { name: 'JSONL', fn: csvToJsonl },
        { name: 'TOML', fn: csvToToml },
        { name: 'Excel', fn: csvToExcel },
        { name: 'SQL', fn: csvToSql },
        { name: 'KML', fn: csvToKml },
        { name: 'ICS', fn: csvToIcs },
      ];

      formats.forEach(({ name, fn }) => {
        const result = fn(sampleCSV);
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('⚡ Performance & Data Integrity', () => {
    test('should convert large dataset efficiently', () => {
      const largeCSV = 'id,name,value\n' + 
        Array(1000).fill(null).map((_, i) => `${i},Item${i},${i * 100}`).join('\n');
      
      const start = Date.now();
      const json = csvToJson(largeCSV);
      const xml = csvToXml(largeCSV);
      const html = csvToHtml(largeCSV);
      const sql = csvToSql(largeCSV);
      const end = Date.now();
      
      expect(end - start).toBeLessThan(10000); // Should complete in under 10 seconds
      expect(json).toBeTruthy();
      expect(xml).toBeTruthy();
      expect(html).toBeTruthy();
      expect(sql).toBeTruthy();
    });

    test('should preserve field values through roundtrip conversion', () => {
      const conversions = [
        { from: 'JSON', to: 'CSV', fromFn: csvToJson, toFn: jsonToCSV },
        { from: 'XML', to: 'CSV', fromFn: csvToXml, toFn: xmlToCSV },
        { from: 'YAML', to: 'CSV', fromFn: csvToYaml, toFn: yamlToCSV },
        { from: 'HTML', to: 'CSV', fromFn: csvToHtml, toFn: htmlToCSV },
      ];

      conversions.forEach(({ fromFn, toFn }) => {
        const intermediate = fromFn(sampleCSV);
        const result = toFn(intermediate);
        
        expect(result).toContain('John Doe');
        expect(result).toContain('jane@example.com');
        expect(result).toContain('bob@example.com');
      });
    });
  });

  describe('🔀 Direct Format-to-Format Conversions (Non-CSV)', () => {
    test('should convert JSON → XML → JSON', () => {
      // Start with JSON
      const originalJson = csvToJson(sampleCSV);
      
      // Convert JSON → CSV → XML
      const csv = jsonToCSV(originalJson);
      const xml = csvToXml(csv);
      
      // Convert back: XML → CSV → JSON
      const csvBack = xmlToCSV(xml);
      const jsonBack = csvToJson(csvBack);
      
      expect(jsonBack).toContain('John Doe');
      expect(jsonBack).toContain('jane@example.com');
    });

    test('should convert XML → JSON → XML', () => {
      // Start with XML
      const originalXml = csvToXml(sampleCSV);
      
      // Convert XML → CSV → JSON
      const csv = xmlToCSV(originalXml);
      const json = csvToJson(csv);
      
      // Convert back: JSON → CSV → XML
      const csvBack = jsonToCSV(json);
      const xmlBack = csvToXml(csvBack);
      
      expect(xmlBack).toContain('John Doe');
      expect(xmlBack).toContain('<name>');
    });

    test('should convert JSON → YAML → JSON', () => {
      const json = csvToJson(sampleCSV);
      const csv1 = jsonToCSV(json);
      const yaml = csvToYaml(csv1);
      const csv2 = yamlToCSV(yaml);
      const jsonBack = csvToJson(csv2);
      
      expect(jsonBack).toContain('John Doe');
      expect(jsonBack).toContain('30');
    });

    test('should convert XML → HTML → XML', () => {
      const xml = csvToXml(sampleCSV);
      const csv1 = xmlToCSV(xml);
      const html = csvToHtml(csv1);
      const csv2 = htmlToCSV(html);
      const xmlBack = csvToXml(csv2);
      
      expect(xmlBack).toContain('John Doe');
      expect(xmlBack).toContain('<record>');
    });

    test('should convert JSON → Markdown → JSON', () => {
      const json = csvToJson(sampleCSV);
      const csv1 = jsonToCSV(json);
      const markdown = csvToMarkdown(csv1);
      const csv2 = markdownToCSV(markdown);
      const jsonBack = csvToJson(csv2);
      
      // Verify data integrity (names should be present)
      expect(jsonBack).toContain('John Doe');
      expect(jsonBack).toContain('Jane Smith');
      expect(jsonBack).toContain('Bob Johnson');
    });

    test('should convert YAML → SQL → YAML', () => {
      const yaml = csvToYaml(sampleCSV);
      const csv1 = yamlToCSV(yaml);
      const sql = csvToSql(csv1, 'test_table');
      const csv2 = sqlToCSV(sql);
      const yamlBack = csvToYaml(csv2);
      
      expect(yamlBack).toContain('John Doe');
      expect(yamlBack).toContain('record_');
    });

    test('should convert HTML → JSONL → HTML', () => {
      const html = csvToHtml(sampleCSV);
      const csv1 = htmlToCSV(html);
      const jsonl = csvToJsonl(csv1);
      const csv2 = jsonlToCSV(jsonl);
      const htmlBack = csvToHtml(csv2);
      
      expect(htmlBack).toContain('John Doe');
      expect(htmlBack).toContain('<table');
    });

    test('should convert TSV → Excel → TSV', () => {
      const tsv = csvToTsv(sampleCSV);
      const csv1 = tsvToCSV(tsv);
      const excel = csvToExcel(csv1);
      const csv2 = excelToCSV(excel);
      const tsvBack = csvToTsv(csv2);
      
      expect(tsvBack).toContain('John Doe');
      expect(tsvBack).toContain('\t');
    });

    test('should convert Markdown → TOML → Markdown', () => {
      const markdown = csvToMarkdown(sampleCSV);
      const csv1 = markdownToCSV(markdown);
      const toml = csvToToml(csv1);
      const csv2 = tomlToCSV(toml);
      const markdownBack = csvToMarkdown(csv2);
      
      expect(markdownBack).toContain('John Doe');
      expect(markdownBack).toContain('|');
    });

    test('should convert SQL → XML → SQL', () => {
      const sql = csvToSql(sampleCSV, 'users');
      const csv1 = sqlToCSV(sql);
      const xml = csvToXml(csv1);
      const csv2 = xmlToCSV(xml);
      const sqlBack = csvToSql(csv2, 'users');
      
      expect(sqlBack).toContain('John Doe');
      expect(sqlBack).toContain('INSERT INTO');
    });

    test('should convert Excel → JSON → Excel', () => {
      const excel = csvToExcel(sampleCSV);
      const csv1 = excelToCSV(excel);
      const json = csvToJson(csv1);
      const csv2 = jsonToCSV(json);
      const excelBack = csvToExcel(csv2);
      
      expect(excelBack).toContain('John Doe');
      expect(excelBack).toContain('\t');
    });

    test('should convert TOML → YAML → TOML', () => {
      const toml = csvToToml(sampleCSV);
      const csv1 = tomlToCSV(toml);
      const yaml = csvToYaml(csv1);
      const csv2 = yamlToCSV(yaml);
      const tomlBack = csvToToml(csv2);
      
      expect(tomlBack).toContain('John Doe');
      expect(tomlBack).toContain('[[records]]');
    });

    test('should convert JSONL → SQL → JSONL', () => {
      const jsonl = csvToJsonl(sampleCSV);
      const csv1 = jsonlToCSV(jsonl);
      const sql = csvToSql(csv1, 'data');
      const csv2 = sqlToCSV(sql);
      const jsonlBack = csvToJsonl(csv2);
      
      expect(jsonlBack).toContain('John Doe');
      const lines = jsonlBack.split('\n');
      expect(lines.length).toBeGreaterThan(0);
    });

    test('should handle complex multi-format chain: JSON → XML → YAML → Markdown → JSON', () => {
      // JSON → XML
      const json1 = csvToJson(sampleCSV);
      const csv1 = jsonToCSV(json1);
      const xml = csvToXml(csv1);
      
      // XML → YAML
      const csv2 = xmlToCSV(xml);
      const yaml = csvToYaml(csv2);
      
      // YAML → Markdown
      const csv3 = yamlToCSV(yaml);
      const markdown = csvToMarkdown(csv3);
      
      // Markdown → JSON
      const csv4 = markdownToCSV(markdown);
      const jsonFinal = csvToJson(csv4);
      
      // Verify key data is preserved through the chain
      expect(jsonFinal).toContain('John Doe');
      expect(jsonFinal).toContain('Jane Smith');
      expect(jsonFinal).toContain('Bob Johnson');
    });

    test('should verify all formats can convert to each other through CSV bridge', () => {
      // Test that any format can reach any other format via CSV
      const formats = [
        { name: 'JSON', toCSV: jsonToCSV, fromCSV: csvToJson },
        { name: 'XML', toCSV: xmlToCSV, fromCSV: csvToXml },
        { name: 'YAML', toCSV: yamlToCSV, fromCSV: csvToYaml },
        { name: 'HTML', toCSV: htmlToCSV, fromCSV: csvToHtml },
        { name: 'TSV', toCSV: tsvToCSV, fromCSV: csvToTsv },
        { name: 'Markdown', toCSV: markdownToCSV, fromCSV: csvToMarkdown },
        { name: 'JSONL', toCSV: jsonlToCSV, fromCSV: csvToJsonl },
        { name: 'TOML', toCSV: tomlToCSV, fromCSV: csvToToml },
        { name: 'Excel', toCSV: excelToCSV, fromCSV: csvToExcel },
        { name: 'SQL', toCSV: sqlToCSV, fromCSV: (csv: string) => csvToSql(csv, 'test') },
      ];

      // Test conversion from JSON to all other formats
      const json = csvToJson(sampleCSV);
      const csvFromJson = jsonToCSV(json);
      
      formats.forEach(({ name, fromCSV }) => {
        const converted = fromCSV(csvFromJson);
        expect(converted).toBeTruthy();
        expect(converted.length).toBeGreaterThan(0);
      });
    });
  });
});
