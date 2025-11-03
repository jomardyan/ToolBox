import { SupportedFormat } from '../types';

/**
 * Database utility functions for optional PostgreSQL integration
 */

export interface ConversionRecord {
  id?: string;
  sourceFormat: string;
  targetFormat: string;
  inputDataHash: string;
  outputDataSize: number;
  status: 'success' | 'failed';
  errorMessage?: string;
  timestamp: Date;
  executionTime: number;
  ipAddress?: string;
}

export interface PresetRecord {
  id?: string;
  name: string;
  description?: string;
  sourceFormat: string;
  targetFormat: string;
  options?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

/**
 * Hash function for input data (for storage reference without storing full data)
 */
export const hashInputData = (data: string): string => {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

/**
 * Generate unique ID for records
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validate conversion record before storage
 */
export const validateConversionRecord = (record: Partial<ConversionRecord>): boolean => {
  return (
    !!record.sourceFormat &&
    !!record.targetFormat &&
    typeof record.sourceFormat === 'string' &&
    typeof record.targetFormat === 'string' &&
    !!record.timestamp &&
    typeof record.executionTime === 'number'
  );
};

/**
 * Validate preset record before storage
 */
export const validatePresetRecord = (record: Partial<PresetRecord>): boolean => {
  return (
    !!record.name &&
    record.name.length >= 1 &&
    record.name.length <= 100 &&
    !!record.sourceFormat &&
    !!record.targetFormat &&
    typeof record.sourceFormat === 'string' &&
    typeof record.targetFormat === 'string'
  );
};

/**
 * Format conversion record for display
 */
export const formatConversionRecord = (record: ConversionRecord): any => {
  return {
    id: record.id,
    from: record.sourceFormat.toUpperCase(),
    to: record.targetFormat.toUpperCase(),
    status: record.status,
    time: record.executionTime,
    timestamp: record.timestamp.toISOString(),
    error: record.errorMessage,
  };
};

/**
 * Get statistics from conversion records
 */
export const getConversionStats = (records: ConversionRecord[]): any => {
  if (records.length === 0) {
    return {
      total: 0,
      successful: 0,
      failed: 0,
      averageTime: 0,
      successRate: 0,
    };
  }

  const successful = records.filter((r) => r.status === 'success').length;
  const failed = records.filter((r) => r.status === 'failed').length;
  const averageTime = records.reduce((sum, r) => sum + r.executionTime, 0) / records.length;

  return {
    total: records.length,
    successful,
    failed,
    averageTime: Math.round(averageTime * 100) / 100,
    successRate: Math.round((successful / records.length) * 100),
  };
};

/**
 * Get most used format pairs
 */
export const getMostUsedPairs = (records: ConversionRecord[], limit = 5): any[] => {
  const pairs: Record<string, number> = {};

  records.forEach((record) => {
    const key = `${record.sourceFormat}->${record.targetFormat}`;
    pairs[key] = (pairs[key] || 0) + 1;
  });

  return Object.entries(pairs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([pair, count]) => ({
      pair,
      count,
    }));
};

/**
 * Cleanup old records (for maintenance)
 */
export const cleanupOldRecords = (records: ConversionRecord[], daysOld = 30): ConversionRecord[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return records.filter((record) => new Date(record.timestamp) > cutoffDate);
};

/**
 * Export records in CSV format
 */
export const exportRecordsAsCSV = (records: ConversionRecord[]): string => {
  if (records.length === 0) {
    return 'id,sourceFormat,targetFormat,status,executionTime,timestamp\n';
  }

  const headers = ['id', 'sourceFormat', 'targetFormat', 'status', 'executionTime', 'timestamp'];
  const rows = records.map((r) => [r.id, r.sourceFormat, r.targetFormat, r.status, r.executionTime, r.timestamp].join(','));

  return [headers.join(','), ...rows].join('\n');
};

/**
 * SQL migration queries for PostgreSQL
 */
export const getMigrationQueries = (): string[] => {
  return [
    `
      CREATE TABLE IF NOT EXISTS conversions (
        id VARCHAR(50) PRIMARY KEY,
        sourceFormat VARCHAR(20) NOT NULL,
        targetFormat VARCHAR(20) NOT NULL,
        inputDataHash VARCHAR(50),
        outputDataSize INT,
        status VARCHAR(20),
        errorMessage TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        executionTime INT,
        ipAddress VARCHAR(50),
        FOREIGN KEY (userId) REFERENCES users(id)
      );
    `,
    `
      CREATE TABLE IF NOT EXISTS presets (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        sourceFormat VARCHAR(20) NOT NULL,
        targetFormat VARCHAR(20) NOT NULL,
        options JSONB,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        userId VARCHAR(50),
        FOREIGN KEY (userId) REFERENCES users(id)
      );
    `,
    `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(100),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
    `CREATE INDEX idx_conversions_timestamp ON conversions(timestamp);`,
    `CREATE INDEX idx_presets_userId ON presets(userId);`,
    `CREATE INDEX idx_conversions_userId ON conversions(userId);`,
  ];
};
