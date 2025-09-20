/**
 * EODHD Reference Data Types
 * Types for exchanges, symbols, calendars, and other reference data
 */

import { DateString, Symbol, Exchange, Currency } from './common.types';

/**
 * Exchange Information
 */
export interface ExchangeInfo {
  Code: string;
  Name: string;
  OperatingMIC?: string;
  Country: string;
  Currency: Currency;
  Timezone: string;
  isOpen?: boolean;
  TradingHours?: {
    Open: string; // HH:MM format
    Close: string; // HH:MM format
    Lunch?: {
      Start: string;
      End: string;
    };
  };
  Holidays?: ExchangeHoliday[];
}

/**
 * Exchange Holiday
 */
export interface ExchangeHoliday {
  Date: DateString;
  Name: string;
  Type: 'Full' | 'Partial';
  OpenTime?: string;
  CloseTime?: string;
}

/**
 * Symbol Information
 */
export interface SymbolInfo {
  Code: string;
  Name: string;
  Country: string;
  Exchange: Exchange;
  Currency: Currency;
  Type: SecurityType;
  ISIN?: string;
  previousClose?: number;
  previousCloseDate?: DateString;
}

/**
 * Extended Symbol Information
 */
export interface ExtendedSymbolInfo extends SymbolInfo {
  Sector?: string;
  Industry?: string;
  GicsCode?: string;
  MarketCap?: number;
  EmployeeCount?: number;
  Website?: string;
  Description?: string;
  IPODate?: DateString;
  DelistingDate?: DateString;
  Status: 'Active' | 'Delisted' | 'Suspended';
}

/**
 * Security Types
 */
export type SecurityType = 
  | 'Common Stock'
  | 'Preferred Stock'
  | 'ETF'
  | 'ETN'
  | 'Mutual Fund'
  | 'Index'
  | 'Bond'
  | 'Option'
  | 'Future'
  | 'Forex'
  | 'Crypto'
  | 'Commodity'
  | 'ADR'
  | 'GDR'
  | 'Warrant'
  | 'Right'
  | 'Unit';

/**
 * Search Result
 */
export interface SearchResult {
  Code: string;
  Exchange: Exchange;
  Name: string;
  Type: SecurityType;
  Country: string;
  Currency: Currency;
  ISIN?: string;
  previousClose?: number;
  previousCloseDate?: DateString;
}

/**
 * Exchange List Response
 */
export type ExchangeListResponse = ExchangeInfo[];

/**
 * Symbol List Response
 */
export type SymbolListResponse = SymbolInfo[];

/**
 * Search Response
 */
export type SearchResponse = SearchResult[];

/**
 * Trading Calendar
 */
export interface TradingCalendar {
  exchange: Exchange;
  year: number;
  holidays: ExchangeHoliday[];
  earlyClosures: Array<{
    date: DateString;
    closeTime: string;
    reason: string;
  }>;
}

/**
 * Exchange Market Status
 */
export interface ExchangeMarketStatus {
  exchange: Exchange;
  isOpen: boolean;
  session: 'pre-market' | 'regular' | 'after-hours' | 'closed';
  currentTime: DateString;
  nextOpen?: DateString;
  nextClose?: DateString;
  timezone: string;
}

/**
 * Symbol Changes
 */
export interface SymbolChange {
  date: DateString;
  oldSymbol: string;
  newSymbol: string;
  type: 'symbol_change' | 'merger' | 'acquisition' | 'spin_off';
  description?: string;
}

/**
 * Corporate Actions
 */
export interface CorporateAction {
  date: DateString;
  symbol: Symbol;
  type: 'split' | 'dividend' | 'merger' | 'spin_off' | 'symbol_change' | 'delisting';
  description: string;
  details?: {
    ratio?: string; // For splits
    amount?: number; // For dividends
    currency?: Currency;
    exDate?: DateString;
    payDate?: DateString;
    recordDate?: DateString;
    newSymbol?: string; // For symbol changes
    acquirer?: string; // For mergers
  };
}

/**
 * Index Components
 */
export interface IndexComponents {
  Code: string;
  Name: string;
  Exchange: Exchange;
  UpdatedAt: DateString;
  Components: Array<{
    Code: string;
    Name: string;
    Exchange: Exchange;
    Weight?: number;
    Shares?: number;
  }>;
  NumberOfComponents: number;
}

/**
 * Exchange Symbol List Parameters
 */
export interface ExchangeSymbolListParams {
  delisted?: boolean;
  tradable?: boolean;
}

/**
 * Search Parameters
 */
export interface SearchParams {
  limit?: number;
  exchange?: Exchange;
  type?: SecurityType;
}

/**
 * Exchange Details Parameters
 */
export interface ExchangeDetailsParams {
  from?: DateString;
  to?: DateString;
  holidays?: boolean;
}