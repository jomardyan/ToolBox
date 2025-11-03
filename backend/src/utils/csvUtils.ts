import Papa from 'papaparse';

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, any>[];
}

export const parseCSV = (csvData: string): ParsedCSV => {
  const result = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.errors.length > 0) {
    throw new Error(`CSV Parse Error: ${result.errors[0].message}`);
  }

  const headers = result.meta.fields || [];
  const rows = result.data as Record<string, any>[];

  return { headers, rows };
};

export const generateCSV = (rows: Record<string, any>[], headers?: string[]): string => {
  if (rows.length === 0) {
    return '';
  }

  const cols = headers || Object.keys(rows[0]);
  const csvData = Papa.unparse({
    fields: cols,
    data: rows,
  });

  return csvData;
};
