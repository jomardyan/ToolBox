export type SupportedFormat = 
  | 'json' | 'xml' | 'yaml' | 'sql' | 'excel' | 'html' | 'tsv' | 'kml' | 'txt';

export interface ConversionRequest {
  sourceFormat: SupportedFormat;
  targetFormat: SupportedFormat;
  data: string | Buffer;
  options?: Record<string, any>;
}

export interface ConversionResult {
  success: boolean;
  data?: string | Buffer;
  error?: string;
  format: SupportedFormat;
  timestamp: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export interface ColumnExtractionRequest {
  csvData: string;
  columns: string[];
  filterOptions?: {
    column: string;
    value: string;
    operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith';
  }[];
}

export interface ConversionHistory {
  id: string;
  sourceFormat: SupportedFormat;
  targetFormat: SupportedFormat;
  fileSize: number;
  timestamp: Date;
  status: 'success' | 'failed';
  errorMessage?: string;
}
