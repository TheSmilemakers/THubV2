/**
 * EODHD Error Types
 * Types for error handling and error responses
 */

/**
 * EODHD Error Codes
 */
export enum EODHDErrorCode {
  // Authentication Errors
  INVALID_API_KEY = 'INVALID_API_KEY',
  EXPIRED_API_KEY = 'EXPIRED_API_KEY',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Rate Limit Errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  DAILY_LIMIT_EXCEEDED = 'DAILY_LIMIT_EXCEEDED',
  CONCURRENT_LIMIT_EXCEEDED = 'CONCURRENT_LIMIT_EXCEEDED',
  
  // Request Errors
  INVALID_SYMBOL = 'INVALID_SYMBOL',
  INVALID_EXCHANGE = 'INVALID_EXCHANGE',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  MISSING_REQUIRED_PARAMETER = 'MISSING_REQUIRED_PARAMETER',
  INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT',
  DATE_OUT_OF_RANGE = 'DATE_OUT_OF_RANGE',
  
  // Data Errors
  NO_DATA_FOUND = 'NO_DATA_FOUND',
  SYMBOL_NOT_FOUND = 'SYMBOL_NOT_FOUND',
  EXCHANGE_NOT_SUPPORTED = 'EXCHANGE_NOT_SUPPORTED',
  FEATURE_NOT_AVAILABLE = 'FEATURE_NOT_AVAILABLE',
  
  // Server Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  
  // WebSocket Errors
  WEBSOCKET_CONNECTION_FAILED = 'WEBSOCKET_CONNECTION_FAILED',
  WEBSOCKET_AUTHENTICATION_FAILED = 'WEBSOCKET_AUTHENTICATION_FAILED',
  WEBSOCKET_SUBSCRIPTION_FAILED = 'WEBSOCKET_SUBSCRIPTION_FAILED',
  
  // Other
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Base EODHD Error
 */
export class EODHDError extends Error {
  public code: EODHDErrorCode;
  public status?: number;
  public endpoint?: string;
  public params?: any;
  public timestamp: Date;

  constructor(
    message: string,
    code: EODHDErrorCode = EODHDErrorCode.UNKNOWN_ERROR,
    status?: number
  ) {
    super(message);
    this.name = 'EODHDError';
    this.code = code;
    this.status = status;
    this.timestamp = new Date();
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends EODHDError {
  constructor(message: string = 'Authentication failed') {
    super(message, EODHDErrorCode.UNAUTHORIZED, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends EODHDError {
  public retryAfter?: number;
  public limit?: number;
  public remaining?: number;
  public reset?: Date;

  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter?: number
  ) {
    super(message, EODHDErrorCode.RATE_LIMIT_EXCEEDED, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Validation Error
 */
export class ValidationError extends EODHDError {
  public field?: string;
  public value?: any;

  constructor(
    message: string,
    field?: string,
    value?: any
  ) {
    super(message, EODHDErrorCode.INVALID_PARAMETER, 400);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * Data Not Found Error
 */
export class DataNotFoundError extends EODHDError {
  public symbol?: string;
  public dateRange?: { from: string; to: string };

  constructor(
    message: string = 'No data found',
    symbol?: string
  ) {
    super(message, EODHDErrorCode.NO_DATA_FOUND, 404);
    this.name = 'DataNotFoundError';
    this.symbol = symbol;
  }
}

/**
 * Server Error
 */
export class ServerError extends EODHDError {
  public retryable: boolean;

  constructor(
    message: string = 'Internal server error',
    retryable: boolean = true
  ) {
    super(message, EODHDErrorCode.INTERNAL_SERVER_ERROR, 500);
    this.name = 'ServerError';
    this.retryable = retryable;
  }
}

/**
 * Timeout Error
 */
export class TimeoutError extends EODHDError {
  public timeout: number;

  constructor(
    message: string = 'Request timeout',
    timeout: number
  ) {
    super(message, EODHDErrorCode.TIMEOUT, 408);
    this.name = 'TimeoutError';
    this.timeout = timeout;
  }
}

/**
 * WebSocket Error
 */
export class WebSocketError extends EODHDError {
  public closeCode?: number;
  public reason?: string;

  constructor(
    message: string,
    code: EODHDErrorCode = EODHDErrorCode.WEBSOCKET_CONNECTION_FAILED,
    closeCode?: number,
    reason?: string
  ) {
    super(message, code);
    this.name = 'WebSocketError';
    this.closeCode = closeCode;
    this.reason = reason;
  }
}

/**
 * Error Response from API
 */
export interface ErrorResponse {
  error: {
    code: string | number;
    message: string;
    details?: any;
  };
}

/**
 * Error Handler Function
 */
export type ErrorHandler = (error: EODHDError) => void | Promise<void>;

/**
 * Error Recovery Strategy
 */
export interface ErrorRecovery {
  shouldRetry: boolean;
  retryDelay?: number;
  maxRetries?: number;
  backoffMultiplier?: number;
  fallbackValue?: any;
}

/**
 * Error Statistics
 */
export interface ErrorStats {
  totalErrors: number;
  errorsByCode: Record<EODHDErrorCode, number>;
  errorsByEndpoint: Record<string, number>;
  lastError?: EODHDError;
  errorRate: number; // Errors per minute
}