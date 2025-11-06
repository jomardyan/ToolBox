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

  // For single-column data or delimiter detection issues, gracefully handle
  // by returning what we have - Papa often produces results even with errors
  if (result.errors && result.errors.length > 0) {
    // Log but don't throw for delimiter detection errors
    const isDelimiterError = result.errors.some(e => 
      e.message && e.message.includes('auto-detect')
    );
    
    if (!isDelimiterError) {
      throw new Error(`CSV Parse Error: ${result.errors[0].message}`);
    }
    // For delimiter errors, use what Papa gave us anyway
  }

  const headers = result.meta.fields || [];
  const rows = (result.data as Record<string, any>[]).filter(row => Object.keys(row).length > 0 && Object.values(row).some(v => v !== ''));

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
