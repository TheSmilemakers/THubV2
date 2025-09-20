/**
 * EODHD API TypeScript Type Definitions
 * Complete type coverage for all EODHD API endpoints
 */

// Export all types from each module
export type * from './common.types';
export type * from './market-data.types';
export type * from './technical.types';
export type * from './fundamental.types';
export type * from './options.types';
export type * from './news.types';
export type * from './screener.types';
export type * from './reference.types';
export type * from './economic.types';
export type * from './alternative.types';
export type * from './crypto.types';
export type * from './bonds.types';
export type * from './websocket.types';
export type * from './service.types';
export type * from './errors.types';

// Re-export specific items that might be values (classes, enums)
export { EODHDErrorCode } from './errors.types';
export { 
  EODHDError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  DataNotFoundError,
  ServerError,
  TimeoutError,
  WebSocketError as EODHDWebSocketError
} from './errors.types';

// Export predefined screens constant
export { PREDEFINED_SCREENS } from './screener.types';