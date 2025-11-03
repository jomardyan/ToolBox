/**
 * File handling and processing utilities
 */

import * as fs from 'fs';
import * as path from 'path';

export interface FileInfo {
  name: string;
  size: number;
  mimeType: string;
  createdAt: Date;
  modifiedAt: Date;
}

export interface FileScanResult {
  total: number;
  processed: number;
  errors: number;
  warnings: string[];
  info: string[];
}

/**
 * Get file info
 */
export const getFileInfo = (filePath: string): FileInfo => {
  const stats = fs.statSync(filePath);
  const name = path.basename(filePath);
  const mimeType = getMimeType(filePath);

  return {
    name,
    size: stats.size,
    mimeType,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
  };
};

/**
 * Get MIME type from file extension
 */
export const getMimeType = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase();

  const mimeTypes: Record<string, string> = {
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
    '.txt': 'text/plain',
    '.pdf': 'application/pdf',
    '.tsv': 'text/tab-separated-values',
  };

  return mimeTypes[ext] || 'application/octet-stream';
};

/**
 * Check if file is CSV
 */
export const isCSVFile = (filePath: string): boolean => {
  return path.extname(filePath).toLowerCase() === '.csv';
};

/**
 * Check if file size is within limit
 */
export const isFileSizeValid = (filePath: string, maxSizeMB: number = 10): boolean => {
  const stats = fs.statSync(filePath);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return stats.size <= maxSizeBytes;
};

/**
 * Validate file path (security check)
 */
export const isValidFilePath = (filePath: string, baseDir: string): boolean => {
  const resolved = path.resolve(filePath);
  const base = path.resolve(baseDir);
  return resolved.startsWith(base);
};

/**
 * Count lines in file
 */
export const countFileLines = (filePath: string): number => {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').length - 1; // Subtract 1 to exclude empty last line
};

/**
 * Get file extension
 */
export const getFileExtension = (filePath: string): string => {
  return path.extname(filePath).substring(1).toLowerCase();
};

/**
 * Create temp file
 */
export const createTempFile = (prefix: string = 'temp', suffix: string = ''): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const tempFileName = `${prefix}_${timestamp}_${random}${suffix}`;
  return path.join('/tmp', tempFileName);
};

/**
 * Clean up temp files
 */
export const cleanupTempFile = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

/**
 * Read file in chunks (memory efficient)
 */
export async function* readFileInChunks(
  filePath: string,
  chunkSize: number = 64 * 1024
): AsyncGenerator<Buffer> {
  const stream = fs.createReadStream(filePath, { highWaterMark: chunkSize });

  for await (const chunk of stream) {
    yield chunk;
  }
}

/**
 * Scan directory for CSV files
 */
export const scanDirectoryForCSV = (dirPath: string): string[] => {
  const csvFiles: string[] = [];

  const scan = (dir: string) => {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scan(filePath);
      } else if (isCSVFile(filePath)) {
        csvFiles.push(filePath);
      }
    }
  };

  scan(dirPath);
  return csvFiles;
};

/**
 * Backup file
 */
export const backupFile = (filePath: string, backupDir: string): string => {
  const fileName = path.basename(filePath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `${timestamp}_${fileName}`;
  const backupPath = path.join(backupDir, backupFileName);

  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  fs.copyFileSync(filePath, backupPath);
  return backupPath;
};

/**
 * Archive CSV files
 */
export const archiveCSVFile = (filePath: string, archiveDir: string): string => {
  if (!isCSVFile(filePath)) {
    throw new Error('File is not a CSV file');
  }

  return backupFile(filePath, archiveDir);
};

/**
 * Check file integrity (SHA256 hash)
 */
export const calculateFileHash = (filePath: string): string => {
  // This is a placeholder - actual implementation requires 'crypto' module
  // import { createHash } from 'crypto';
  // const hash = createHash('sha256');
  // hash.update(fs.readFileSync(filePath));
  // return hash.digest('hex');
  throw new Error('File hashing requires crypto module implementation');
};

/**
 * Validate CSV file structure
 */
export const validateCSVStructure = (filePath: string): FileScanResult => {
  const result: FileScanResult = {
    total: 0,
    processed: 0,
    errors: 0,
    warnings: [],
    info: [],
  };

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    result.total = lines.length;

    if (lines.length === 0) {
      result.errors++;
      result.warnings.push('File is empty');
      return result;
    }

    const headerLine = lines[0];
    const headerCount = headerLine.split(',').length;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const columnCount = line.split(',').length;

      if (columnCount !== headerCount) {
        result.errors++;
        result.warnings.push(`Row ${i + 1}: Column count mismatch (expected ${headerCount}, got ${columnCount})`);
      } else {
        result.processed++;
      }
    }

    if (result.errors === 0) {
      result.info.push('CSV structure is valid');
    }
  } catch (error) {
    result.errors++;
    result.warnings.push(`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
};

/**
 * Get file statistics
 */
export const getFileStatistics = (filePath: string) => {
  const stats = fs.statSync(filePath);

  return {
    name: path.basename(filePath),
    path: filePath,
    size: stats.size,
    sizeFormatted: formatFileSize(stats.size),
    lines: countFileLines(filePath),
    mimeType: getMimeType(filePath),
    extension: getFileExtension(filePath),
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
    isReadable: fs.accessSync(filePath, fs.constants.R_OK) === undefined,
  };
};

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Compare two files for differences
 */
export const compareFiles = (filePath1: string, filePath2: string): boolean => {
  try {
    const content1 = fs.readFileSync(filePath1, 'utf-8');
    const content2 = fs.readFileSync(filePath2, 'utf-8');
    return content1 === content2;
  } catch (error) {
    return false;
  }
};

/**
 * List all files in directory
 */
export const listFilesInDirectory = (dirPath: string, extension?: string): string[] => {
  const files = fs.readdirSync(dirPath);
  let result = files.map(file => path.join(dirPath, file));

  if (extension) {
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    result = result.filter(file => path.extname(file).toLowerCase() === ext);
  }

  return result;
};

/**
 * Check if file exists
 */
export const fileExists = (filePath: string): boolean => {
  return fs.existsSync(filePath);
};

/**
 * Delete file safely
 */
export const deleteFileSafely = (filePath: string, backupFirst: boolean = true): boolean => {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    if (backupFirst) {
      backupFile(filePath, '/tmp/csv-converter-backups');
    }

    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    return false;
  }
};
