/**
 * Common EODHD API Types
 * Shared types used across multiple endpoints
 */

/**
 * API Authentication
 */
export interface EODHDConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  enableWebSocket?: boolean;
}

/**
 * Common Response Wrapper
 */
export interface EODHDResponse<T> {
  data: T;
  meta?: {
    requested: number;
    returned: number;
    status: string;
  };
}

/**
 * Error Response
 */
export interface EODHDError {
  error: {
    code: number;
    message: string;
    details?: string;
  };
}

/**
 * Rate Limit Information
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Date Formats
 */
export type DateString = string; // YYYY-MM-DD
export type DateTimeString = string; // YYYY-MM-DD HH:mm:ss
export type UnixTimestamp = number;

/**
 * Common Parameters
 */
export interface DateRangeParams {
  from?: DateString;
  to?: DateString;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface FormatParams {
  fmt?: 'json' | 'csv';
}

/**
 * Symbol Formats
 */
export type Symbol = string; // e.g., "AAPL.US"
export type Exchange = string; // e.g., "US", "LSE", "TSX"
export type Currency = string; // e.g., "USD", "EUR", "GBP"

/**
 * Time Intervals
 */
export type Interval = '1m' | '5m' | '15m' | '30m' | '1h' | '1d';
export type Period = 'd' | 'w' | 'm'; // daily, weekly, monthly

/**
 * Sort Orders
 */
export type SortOrder = 'asc' | 'desc' | 'a' | 'd';

/**
 * API Plans
 */
export type APITier = 'free' | 'basic' | 'professional' | 'enterprise';

/**
 * Market Status
 */
export interface MarketStatus {
  isOpen: boolean;
  session: 'pre' | 'regular' | 'post' | 'closed';
  nextOpen?: DateTimeString;
  nextClose?: DateTimeString;
}