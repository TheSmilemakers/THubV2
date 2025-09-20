/**
 * EODHD Screener API Types
 * Types for market screening and filtering
 */

import { DateString, Symbol, Currency } from './common.types';

/**
 * Screener Filter Operators
 */
export type FilterOperator = 
  | '=' 
  | '!=' 
  | '>' 
  | '<' 
  | '>=' 
  | '<=' 
  | 'in' 
  | 'not in'
  | 'between'
  | 'not between'
  | 'like'
  | 'not like';

/**
 * Screener Filter
 */
export interface ScreenerFilter {
  field: string;
  operator: FilterOperator;
  value: string | number | Array<string | number>;
}

/**
 * Available Screener Fields
 */
export interface ScreenerFields {
  // Price & Volume
  price: number;
  volume: number;
  avgvol_50d: number;
  avgvol_200d: number;
  change: number;
  change_p: number;
  
  // Market Cap & Shares
  market_cap: number;
  shares_outstanding: number;
  shares_float: number;
  
  // Valuation Ratios
  pe_ratio: number;
  peg_ratio: number;
  ps_ratio: number;
  pb_ratio: number;
  ev_ebitda: number;
  
  // Profitability
  profit_margin: number;
  operating_margin: number;
  gross_margin: number;
  roe: number; // Return on Equity
  roa: number; // Return on Assets
  roic: number; // Return on Invested Capital
  
  // Growth
  revenue_growth_yoy: number;
  earnings_growth_yoy: number;
  revenue_growth_qoq: number;
  earnings_growth_qoq: number;
  
  // Dividends
  dividend_yield: number;
  dividend_per_share: number;
  payout_ratio: number;
  
  // Technical Indicators
  rsi_14: number;
  macd: number;
  macd_signal: number;
  macd_histogram: number;
  sma_20: number;
  sma_50: number;
  sma_200: number;
  ema_20: number;
  ema_50: number;
  ema_200: number;
  atr_14: number;
  adx_14: number;
  cci_14: number;
  stoch_k: number;
  stoch_d: number;
  bb_upper: number;
  bb_middle: number;
  bb_lower: number;
  
  // Price Levels
  high_52w: number;
  low_52w: number;
  high_52w_p: number; // % from 52w high
  low_52w_p: number; // % from 52w low
  
  // Other
  beta: number;
  short_ratio: number;
  short_percent: number;
  exchange: string;
  sector: string;
  industry: string;
  country: string;
}

/**
 * Screener Parameters
 */
export interface ScreenerParams {
  filters: string | ScreenerFilter[]; // JSON string or array
  signals?: string; // Technical signals filter
  sort?: keyof ScreenerFields;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Screener Result
 */
export interface ScreenerResult {
  code: Symbol;
  name: string;
  exchange: string;
  currency: Currency;
  price: number;
  change: number;
  change_p: number;
  volume: number;
  market_cap?: number;
  pe_ratio?: number;
  dividend_yield?: number;
  sector?: string;
  industry?: string;
  [key: string]: any; // Additional fields based on filters
}

/**
 * Screener Response
 */
export interface ScreenerResponse {
  data: ScreenerResult[];
  meta?: {
    total: number;
    returned: number;
    page: number;
  };
}

/**
 * Predefined Screens
 */
export interface PredefinedScreen {
  name: string;
  description: string;
  filters: ScreenerFilter[];
}

/**
 * Common Predefined Screens
 */
export const PREDEFINED_SCREENS: Record<string, PredefinedScreen> = {
  OVERSOLD: {
    name: 'Oversold Stocks',
    description: 'Stocks with RSI < 30',
    filters: [
      { field: 'rsi_14', operator: '<', value: 30 },
      { field: 'volume', operator: '>', value: 100000 }
    ]
  },
  BREAKOUT: {
    name: 'Breakout Candidates',
    description: 'Price near 52-week high with volume surge',
    filters: [
      { field: 'high_52w_p', operator: '>', value: 95 },
      { field: 'volume', operator: '>', value: 'avgvol_50d' }
    ]
  },
  VALUE: {
    name: 'Value Stocks',
    description: 'Low P/E with positive earnings',
    filters: [
      { field: 'pe_ratio', operator: 'between', value: [0, 15] },
      { field: 'profit_margin', operator: '>', value: 0 }
    ]
  },
  DIVIDEND: {
    name: 'Dividend Aristocrats',
    description: 'High dividend yield with sustainable payout',
    filters: [
      { field: 'dividend_yield', operator: '>', value: 3 },
      { field: 'payout_ratio', operator: '<', value: 80 }
    ]
  },
  MOMENTUM: {
    name: 'Momentum Stocks',
    description: 'Strong price momentum with technical confirmation',
    filters: [
      { field: 'change_p', operator: '>', value: 20 },
      { field: 'rsi_14', operator: 'between', value: [50, 70] },
      { field: 'price', operator: '>', value: 'sma_50' }
    ]
  }
};

/**
 * Screener Signal
 */
export type ScreenerSignal = 
  | 'golden_cross' // SMA50 crosses above SMA200
  | 'death_cross' // SMA50 crosses below SMA200
  | 'bullish_macd' // MACD crosses above signal
  | 'bearish_macd' // MACD crosses below signal
  | 'oversold_rsi' // RSI < 30
  | 'overbought_rsi' // RSI > 70
  | 'bullish_divergence' // Price vs indicator divergence
  | 'bearish_divergence'
  | 'breakout' // Price breaks resistance
  | 'breakdown' // Price breaks support
  | 'gap_up'
  | 'gap_down';