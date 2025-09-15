import { logger } from './logger';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 500);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class ExternalAPIError extends AppError {
  constructor(message: string, statusCode: number = 502) {
    super(message, statusCode);
    Object.setPrototypeOf(this, ExternalAPIError.prototype);
  }
}

// Error handler for async functions
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error('Async handler error:', error);
      throw error;
    }
  }) as T;
}

// Type guard for AppError
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

// Format error for client response
export function formatErrorResponse(error: unknown) {
  if (isAppError(error)) {
    return {
      error: {
        message: error.message,
        statusCode: error.statusCode,
        timestamp: error.timestamp,
      }
    };
  }
  
  if (error instanceof Error) {
    return {
      error: {
        message: process.env.NODE_ENV === 'production' 
          ? 'An unexpected error occurred' 
          : error.message,
        statusCode: 500,
        timestamp: new Date(),
      }
    };
  }
  
  return {
    error: {
      message: 'An unexpected error occurred',
      statusCode: 500,
      timestamp: new Date(),
    }
  };
}