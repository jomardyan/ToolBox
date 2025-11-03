/**
 * Error handling and logging utilities
 */

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER_ERROR = 'SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  DATABASE_ERROR = 'DATABASE_ERROR',
  FILE_ERROR = 'FILE_ERROR',
  CONVERSION_ERROR = 'CONVERSION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  statusCode: number;
  details?: any;
  timestamp: Date;
  context?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    type: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * Create application error
 */
export const createError = (
  type: ErrorType,
  message: string,
  statusCode: number = 500,
  details?: any,
  context?: string
): AppError => {
  return {
    type,
    message,
    statusCode,
    details,
    timestamp: new Date(),
    context,
  };
};

/**
 * Get HTTP status code for error type
 */
export const getStatusCode = (errorType: ErrorType): number => {
  const statusMap: Record<ErrorType, number> = {
    [ErrorType.VALIDATION_ERROR]: 400,
    [ErrorType.NOT_FOUND]: 404,
    [ErrorType.UNAUTHORIZED]: 401,
    [ErrorType.FORBIDDEN]: 403,
    [ErrorType.CONFLICT]: 409,
    [ErrorType.RATE_LIMIT]: 429,
    [ErrorType.SERVER_ERROR]: 500,
    [ErrorType.BAD_REQUEST]: 400,
    [ErrorType.DATABASE_ERROR]: 500,
    [ErrorType.FILE_ERROR]: 400,
    [ErrorType.CONVERSION_ERROR]: 422,
    [ErrorType.UNKNOWN_ERROR]: 500,
  };

  return statusMap[errorType];
};

/**
 * Format error response
 */
export const formatErrorResponse = (error: AppError): ErrorResponse => {
  return {
    success: false,
    error: {
      type: error.type,
      message: error.message,
      ...(error.details && { details: error.details }),
    },
    timestamp: error.timestamp.toISOString(),
  };
};

/**
 * Common error creators
 */
export const ValidationError = (message: string, details?: any, context?: string): AppError => {
  return createError(ErrorType.VALIDATION_ERROR, message, 400, details, context);
};

export const NotFoundError = (message: string = 'Resource not found', context?: string): AppError => {
  return createError(ErrorType.NOT_FOUND, message, 404, undefined, context);
};

export const UnauthorizedError = (message: string = 'Unauthorized', context?: string): AppError => {
  return createError(ErrorType.UNAUTHORIZED, message, 401, undefined, context);
};

export const ForbiddenError = (message: string = 'Forbidden', context?: string): AppError => {
  return createError(ErrorType.FORBIDDEN, message, 403, undefined, context);
};

export const ConflictError = (message: string, details?: any, context?: string): AppError => {
  return createError(ErrorType.CONFLICT, message, 409, details, context);
};

export const RateLimitError = (message: string = 'Rate limit exceeded', context?: string): AppError => {
  return createError(ErrorType.RATE_LIMIT, message, 429, undefined, context);
};

export const ServerError = (message: string = 'Internal server error', details?: any, context?: string): AppError => {
  return createError(ErrorType.SERVER_ERROR, message, 500, details, context);
};

export const BadRequestError = (message: string, details?: any, context?: string): AppError => {
  return createError(ErrorType.BAD_REQUEST, message, 400, details, context);
};

export const DatabaseError = (message: string, details?: any, context?: string): AppError => {
  return createError(ErrorType.DATABASE_ERROR, message, 500, details, context);
};

export const FileError = (message: string, details?: any, context?: string): AppError => {
  return createError(ErrorType.FILE_ERROR, message, 400, details, context);
};

export const ConversionError = (message: string, details?: any, context?: string): AppError => {
  return createError(ErrorType.CONVERSION_ERROR, message, 422, details, context);
};

export const UnknownError = (message: string, details?: any, context?: string): AppError => {
  return createError(ErrorType.UNKNOWN_ERROR, message, 500, details, context);
};

/**
 * Try-catch wrapper for async functions
 */
export const asyncHandler = (fn: Function) => {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw handleError(error);
    }
  };
};

/**
 * Handle unknown errors
 */
export const handleError = (error: any): AppError => {
  // If it's already an AppError, return it
  if (error && typeof error === 'object' && 'type' in error && 'statusCode' in error) {
    return error as AppError;
  }

  // If it's an Error object
  if (error instanceof Error) {
    return ServerError(error.message, { originalError: error.stack });
  }

  // If it's a string
  if (typeof error === 'string') {
    return ServerError(error);
  }

  // Unknown type
  return ServerError('An unknown error occurred', { error });
};

/**
 * Logging levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  error?: any;
}

/**
 * Simple logger
 */
export class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  log(level: LogLevel, message: string, context?: string, data?: any, error?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      data,
      error,
    };

    this.logs.push(entry);

    // Keep logs bounded
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output based on level
    const prefix = `[${entry.timestamp.toISOString()}] [${level}]${context ? ` [${context}]` : ''}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, data);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, data);
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, error || data);
        break;
      case LogLevel.FATAL:
        console.error(prefix, 'FATAL:', message, error || data);
        break;
    }
  }

  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  error(message: string, error?: any, context?: string, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data, error);
  }

  fatal(message: string, error?: any, context?: string, data?: any): void {
    this.log(LogLevel.FATAL, message, context, data, error);
  }

  getLogs(level?: LogLevel, context?: string, limit: number = 100): LogEntry[] {
    let filtered = [...this.logs];

    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }

    if (context) {
      filtered = filtered.filter(log => log.context === context);
    }

    return filtered.slice(-limit);
  }

  clearLogs(): void {
    this.logs = [];
  }

  getStats(): {
    total: number;
    byLevel: Record<string, number>;
    byContext: Record<string, number>;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<string, number>,
      byContext: {} as Record<string, number>,
    };

    for (const log of this.logs) {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      if (log.context) {
        stats.byContext[log.context] = (stats.byContext[log.context] || 0) + 1;
      }
    }

    return stats;
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Error tracking and reporting
 */
export class ErrorTracker {
  private errors: AppError[] = [];
  private maxErrors: number = 500;

  track(error: AppError): void {
    this.errors.push(error);

    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
  }

  getErrors(type?: ErrorType, limit: number = 100): AppError[] {
    let filtered = [...this.errors];

    if (type) {
      filtered = filtered.filter(err => err.type === type);
    }

    return filtered.slice(-limit);
  }

  getStats(): {
    total: number;
    byType: Record<string, number>;
    recent: AppError[];
  } {
    const stats = {
      total: this.errors.length,
      byType: {} as Record<string, number>,
      recent: this.errors.slice(-5),
    };

    for (const error of this.errors) {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    }

    return stats;
  }

  clear(): void {
    this.errors = [];
  }
}

/**
 * Global error tracker instance
 */
export const errorTracker = new ErrorTracker();

/**
 * Error retry logic
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError || new Error('Retry failed after all attempts');
};

/**
 * Circuit breaker pattern
 */
export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;

  constructor(failureThreshold: number = 5, resetTimeout: number = 60000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();

      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
      }

      throw error;
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}
