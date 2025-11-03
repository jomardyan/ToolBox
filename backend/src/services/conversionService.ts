import {
  csvToJson,
  jsonToCSV,
  csvToXml,
  xmlToCSV,
  csvToYaml,
  yamlToCSV,
  csvToHtml,
  htmlToCSV,
  csvToTsv,
  tsvToCSV,
  csvToKml,
  kmlToCSV,
  csvToTxt,
  txtToCSV,
} from '../converters';
import { SupportedFormat } from '../types';
import logger from '../utils/logger';

export const convertFormat = (
  data: string,
  sourceFormat: SupportedFormat,
  targetFormat: SupportedFormat
): string => {
  logger.debug(`Converting from ${sourceFormat} to ${targetFormat}`);

  // If source and target are the same, return as-is
  if (sourceFormat === targetFormat) {
    return data;
  }

  try {
    // Convert to CSV as intermediate format
    let csvData: string;

    if ((sourceFormat as string) === 'csv') {
      csvData = data;
    } else if (sourceFormat === 'json') {
      csvData = jsonToCSV(data);
    } else if (sourceFormat === 'xml') {
      csvData = xmlToCSV(data);
    } else if (sourceFormat === 'yaml') {
      csvData = yamlToCSV(data);
    } else if (sourceFormat === 'html') {
      csvData = htmlToCSV(data);
    } else if (sourceFormat === 'tsv') {
      csvData = tsvToCSV(data);
    } else if (sourceFormat === 'kml') {
      csvData = kmlToCSV(data);
    } else if (sourceFormat === 'txt') {
      csvData = txtToCSV(data);
    } else if (sourceFormat === 'sql') {
      throw new Error('SQL to CSV conversion not yet implemented');
    } else if (sourceFormat === 'excel') {
      throw new Error('Excel to CSV conversion requires file upload');
    } else {
      throw new Error(`Unknown source format: ${sourceFormat}`);
    }

    // Convert from CSV to target format
    let result: string;

    if ((targetFormat as string) === 'csv') {
      result = csvData;
    } else if (targetFormat === 'json') {
      result = csvToJson(csvData);
    } else if (targetFormat === 'xml') {
      result = csvToXml(csvData);
    } else if (targetFormat === 'yaml') {
      result = csvToYaml(csvData);
    } else if (targetFormat === 'html') {
      result = csvToHtml(csvData);
    } else if (targetFormat === 'tsv') {
      result = csvToTsv(csvData);
    } else if (targetFormat === 'kml') {
      result = csvToKml(csvData);
    } else if (targetFormat === 'txt') {
      result = csvToTxt(csvData);
    } else if (targetFormat === 'sql') {
      throw new Error('CSV to SQL conversion not yet implemented');
    } else if (targetFormat === 'excel') {
      throw new Error('CSV to Excel conversion requires multipart response');
    } else {
      throw new Error(`Unknown target format: ${targetFormat}`);
    }

    logger.debug(`Conversion successful`);
    return result;
  } catch (error) {
    logger.error(`Conversion error: ${error}`);
    throw error;
  }
};

export const extractColumns = (
  csvData: string,
  columns: string[],
  filterOptions?: {
    column: string;
    value: string;
    operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith';
  }[]
): string => {
  const Papa = require('papaparse');

  const result = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
  });

  let rows = result.data as Record<string, any>[];

  // Validate columns exist
  if (rows.length > 0) {
    const availableColumns = Object.keys(rows[0]);
    const invalidColumns = columns.filter((col) => !availableColumns.includes(col));
    if (invalidColumns.length > 0) {
      throw new Error(`Columns not found: ${invalidColumns.join(', ')}`);
    }
  }

  // Apply filters
  if (filterOptions && filterOptions.length > 0) {
    rows = rows.filter((row) => {
      return filterOptions.every((filter) => {
        const value = String(row[filter.column] || '');
        const operator = filter.operator || 'equals';

        switch (operator) {
          case 'equals':
            return value === filter.value;
          case 'contains':
            return value.includes(filter.value);
          case 'startsWith':
            return value.startsWith(filter.value);
          case 'endsWith':
            return value.endsWith(filter.value);
          default:
            return true;
        }
      });
    });
  }

  // Extract only specified columns
  const extractedRows = rows.map((row) => {
    const extracted: Record<string, any> = {};
    columns.forEach((col) => {
      extracted[col] = row[col];
    });
    return extracted;
  });

  // Generate CSV from extracted columns
  const Papa2 = require('papaparse');
  return Papa2.unparse({
    fields: columns,
    data: extractedRows,
  });
};
