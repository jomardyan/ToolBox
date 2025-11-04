export type SupportedFormat = 
  | 'json' | 'xml' | 'yaml' | 'sql' | 'excel' | 'html' | 'table' | 'tsv' | 'kml' | 'txt' | 'csv' | 'markdown' | 'jsonl' | 'ndjson' | 'ics' | 'toml' | 'lines';

export interface ConversionRequest {
  data: string;
  sourceFormat: SupportedFormat;
  targetFormat: SupportedFormat;
}

export interface ConversionResult {
  success: boolean;
  data?: string;
  error?: string;
  statusCode: number;
}

export interface ConversionHistory {
  id: string;
  sourceFormat: SupportedFormat;
  targetFormat: SupportedFormat;
  timestamp: Date;
  status: 'success' | 'failed';
}
