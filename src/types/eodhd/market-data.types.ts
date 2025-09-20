/**
 * EODHD Market Data Types
 * Types for EOD, real-time, intraday, and bulk data endpoints
 */

import { DateString, Symbol, Currency, Interval, Period, SortOrder, FormatParams, DateRangeParams } from './common.types';

/**
 * EOD Historical Data
 */
export interface EODData {
  date: DateString;
  open: number;
  high: number;
  low: number;
  close: number;
  adjusted_close: number;
  volume: number;
}

export interface EODDataParams extends DateRangeParams, FormatParams {
  period?: Period;
  order?: SortOrder;
  filter?: 'last_close' | 'last_volume';
}

/**
 * Real-time/Delayed Quote
 */
export interface RealTimeQuote {
  code: string;
  timestamp: number;
  gmtoffset: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  previousClose: number;
  change: number;
  change_p: number;
}

export interface RealTimeQuoteExtended extends RealTimeQuote {
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  dayHigh: number;
  dayLow: number;
  marketCap?: number;
  pe?: number;
  eps?: number;
  yearHigh: number;
  yearLow: number;
  shares?: number;
}

export interface RealTimeParams extends FormatParams {
  s?: string; // Multiple symbols comma-separated
}

/**
 * Intraday Data
 */
export interface IntradayData {
  datetime: DateString;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IntradayParams extends FormatParams {
  interval?: Interval;
  from?: number; // Unix timestamp
  to?: number; // Unix timestamp
}

/**
 * Live/Tick Data
 */
export interface TickData {
  timestamp: number;
  price: number;
  volume: number;
  conditions?: string[];
  exchange?: string;
}

/**
 * Bulk EOD Data
 */
export interface BulkEODData {
  code: string;
  exchange_short_name: string;
  date: DateString;
  open: number;
  high: number;
  low: number;
  close: number;
  adjusted_close: number;
  volume: number;
}

export interface BulkEODExtended extends BulkEODData {
  previousClose: number;
  change: number;
  change_p: number;
  currency: Currency;
  marketCap?: number;
  avgVolume?: number;
}

export interface BulkEODParams extends FormatParams {
  date?: DateString;
  symbols?: string; // Filter specific symbols
  filter?: 'extended';
}

/**
 * Corporate Actions
 */
export interface SplitDividend {
  date: DateString;
  split?: number;
  dividend?: number;
  currency?: Currency;
}

export interface CorporateActionsParams extends DateRangeParams, FormatParams {
  type?: 'splits' | 'dividends' | 'both';
}

/**
 * Market Data Response Types
 */
export type EODDataResponse = EODData[];
export type BulkEODResponse = BulkEODData[] | BulkEODExtended[];
export type IntradayResponse = IntradayData[];
export type CorporateActionsResponse = SplitDividend[];