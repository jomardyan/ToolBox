/**
 * General helper utilities
 */

/**
 * Sleep/delay function
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T;
  }

  if (obj instanceof Object) {
    const cloned = {} as T;
    for (const key in obj) {
      cloned[key] = deepClone(obj[key]);
    }
    return cloned;
  }

  return obj;
};

/**
 * Merge objects
 */
export const mergeObjects = <T extends Record<string, any>>(
  target: T,
  ...sources: (Partial<T> | undefined | null)[]
): T => {
  const result: any = { ...target };

  for (const source of sources) {
    if (source) {
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          result[key] = source[key];
        }
      }
    }
  }

  return result;
};

/**
 * Pick properties from object
 */
export const pick = <T extends Record<string, any>>(
  obj: T,
  ...keys: (keyof T)[]
): Partial<T> => {
  const result: Partial<T> = {};

  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }

  return result;
};

/**
 * Omit properties from object
 */
export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Partial<T> => {
  const result = { ...obj };

  for (const key of keys) {
    delete result[key];
  }

  return result;
};

/**
 * Group array items by key
 */
export const groupBy = <T extends Record<string, any>, K extends keyof T>(
  items: T[],
  key: K
): Record<string, T[]> => {
  const result: Record<string, T[]> = {};

  for (const item of items) {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
  }

  return result;
};

/**
 * Flatten nested array
 */
export const flatten = <T>(arr: (T | T[])[]): T[] => {
  return arr.reduce((result: T[], item) => {
    if (Array.isArray(item)) {
      result.push(...flatten(item as (T | T[])[]) as T[]);
    } else {
      result.push(item);
    }
    return result;
  }, [] as T[]);
};

/**
 * Unique items in array
 */
export const unique = <T>(arr: T[], key?: (item: T) => any): T[] => {
  if (!key) {
    return [...new Set(arr)];
  }

  const seen = new Set<any>();
  const result: T[] = [];

  for (const item of arr) {
    const itemKey = key(item);
    if (!seen.has(itemKey)) {
      seen.add(itemKey);
      result.push(item);
    }
  }

  return result;
};

/**
 * Chunk array into smaller arrays
 */
export const chunk = <T>(arr: T[], size: number): T[][] => {
  const result: T[][] = [];

  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }

  return result;
};

/**
 * Sum array items
 */
export const sum = <T>(
  items: T[],
  selector: (item: T) => number = (item: any) => item
): number => {
  return items.reduce((total, item) => total + selector(item), 0);
};

/**
 * Average of array items
 */
export const average = <T>(
  items: T[],
  selector: (item: T) => number = (item: any) => item
): number => {
  if (items.length === 0) return 0;
  return sum(items, selector) / items.length;
};

/**
 * Min value in array
 */
export const min = <T>(
  items: T[],
  selector: (item: T) => number = (item: any) => item
): number | undefined => {
  if (items.length === 0) return undefined;
  return Math.min(...items.map(selector));
};

/**
 * Max value in array
 */
export const max = <T>(
  items: T[],
  selector: (item: T) => number = (item: any) => item
): number | undefined => {
  if (items.length === 0) return undefined;
  return Math.max(...items.map(selector));
};

/**
 * Generate range of numbers
 */
export const range = (start: number, end: number, step: number = 1): number[] => {
  const result: number[] = [];

  if (step > 0) {
    for (let i = start; i < end; i += step) {
      result.push(i);
    }
  } else if (step < 0) {
    for (let i = start; i > end; i += step) {
      result.push(i);
    }
  }

  return result;
};

/**
 * Capitalize string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * CamelCase to snake_case
 */
export const toSnakeCase = (str: string): string => {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
};

/**
 * snake_case to camelCase
 */
export const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
};

/**
 * Convert string to Title Case
 */
export const toTitleCase = (str: string): string => {
  return str
    .split(/[\s_-]+/)
    .map(word => capitalize(word.toLowerCase()))
    .join(' ');
};

/**
 * Truncate string
 */
export const truncate = (str: string, length: number, suffix: string = '...'): string => {
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
};

/**
 * Repeat string
 */
export const repeat = (str: string, times: number): string => {
  return Array(times).fill(str).join('');
};

/**
 * Pad string
 */
export const padStart = (str: string, length: number, fill: string = ' '): string => {
  return str.padStart(length, fill);
};

export const padEnd = (str: string, length: number, fill: string = ' '): string => {
  return str.padEnd(length, fill);
};

/**
 * Compare version strings
 */
export const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
};

/**
 * Memoize function
 */
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();

  return ((...args: any[]) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);

    return result;
  }) as T;
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): T => {
  let timeoutId: NodeJS.Timeout | null = null;

  return ((...args: any[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delayMs);
  }) as T;
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): T => {
  let lastCall = 0;

  return ((...args: any[]) => {
    const now = Date.now();

    if (now - lastCall >= delayMs) {
      fn(...args);
      lastCall = now;
    }
  }) as T;
};

/**
 * Parse CSV line
 */
export const parseCSVLine = (line: string, delimiter: string = ','): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim().replace(/^"|"$/g, ''));

  return result;
};

/**
 * Generate CSV line
 */
export const generateCSVLine = (fields: any[], delimiter: string = ','): string => {
  return fields
    .map(field => {
      const str = String(field || '');
      const needsQuotes = str.includes(delimiter) || str.includes('"') || str.includes('\n');
      const escaped = str.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    })
    .join(delimiter);
};

/**
 * Get environment variable
 */
export const getEnv = (key: string, defaultValue?: string): string => {
  return process.env[key] || defaultValue || '';
};

/**
 * Check if value is empty
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Partition array into two based on predicate
 */
export const partition = <T>(
  items: T[],
  predicate: (item: T) => boolean
): [T[], T[]] => {
  const truthy: T[] = [];
  const falsy: T[] = [];

  for (const item of items) {
    if (predicate(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  }

  return [truthy, falsy];
};

/**
 * Create map from array
 */
export const toMap = <T extends Record<string, any>, K extends keyof T>(
  items: T[],
  key: K
): Map<T[K], T> => {
  const result = new Map<T[K], T>();

  for (const item of items) {
    result.set(item[key], item);
  }

  return result;
};

/**
 * Find index of item matching predicate
 */
export const findIndex = <T>(items: T[], predicate: (item: T) => boolean): number => {
  for (let i = 0; i < items.length; i++) {
    if (predicate(items[i])) {
      return i;
    }
  }
  return -1;
};

/**
 * Generate UUID v4
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Format timestamp
 */
export const formatTimestamp = (date: Date = new Date()): string => {
  return date.toISOString();
};

/**
 * Parse timestamp
 */
export const parseTimestamp = (timestamp: string): Date => {
  return new Date(timestamp);
};

/**
 * Get time elapsed
 */
export const getTimeElapsed = (startTime: Date, endTime: Date = new Date()): string => {
  const ms = endTime.getTime() - startTime.getTime();
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${seconds} second${seconds > 1 ? 's' : ''}`;
};
