/**
 * EODHD Service Types
 * Types for the EODHD service layer implementation
 */

import { EODHDConfig, RateLimitInfo } from './common.types';
import { IWebSocketClient } from './websocket.types';

/**
 * EODHD Service Interface
 */
export interface IEODHDService {
  // Market Data
  marketData: IMarketDataAPI;
  
  // Technical Analysis
  technical: ITechnicalAPI;
  
  // Fundamental Data
  fundamentals: IFundamentalAPI;
  
  // Options
  options: IOptionsAPI;
  
  // News & Sentiment
  news: INewsAPI;
  
  // Screener
  screener: IScreenerAPI;
  
  // Reference Data
  reference: IReferenceAPI;
  
  // Economic Data
  economic: IEconomicAPI;
  
  // Alternative Data
  alternative: IAlternativeAPI;
  
  // Cryptocurrency
  crypto: ICryptoAPI;
  
  // Bonds
  bonds: IBondsAPI;
  
  // WebSocket
  websocket: IWebSocketClient;
  
  // Utilities
  getRateLimit(): RateLimitInfo;
  isMarketOpen(exchange?: string): boolean;
}

/**
 * Market Data API Interface
 */
export interface IMarketDataAPI {
  getEODData(symbol: string, params?: any): Promise<any>;
  getRealTimeQuote(symbol: string, params?: any): Promise<any>;
  getIntradayData(symbol: string, params?: any): Promise<any>;
  getBulkEODData(exchange: string, params?: any): Promise<any>;
  getCorporateActions(symbol: string, params?: any): Promise<any>;
}

/**
 * Technical API Interface
 */
export interface ITechnicalAPI {
  getIndicator(symbol: string, indicator: string, params?: any): Promise<any>;
  getMultipleIndicators(symbol: string, indicators: string[], params?: any): Promise<any>;
  getPatternRecognition(symbol: string, pattern: string, params?: any): Promise<any>;
}

/**
 * Fundamental API Interface
 */
export interface IFundamentalAPI {
  getFundamentals(symbol: string, params?: any): Promise<any>;
  getFinancials(symbol: string, params?: any): Promise<any>;
  getEarnings(symbol: string, params?: any): Promise<any>;
  getETFData(symbol: string): Promise<any>;
  getMutualFundData(symbol: string): Promise<any>;
  getIndexConstituents(symbol: string): Promise<any>;
}

/**
 * Options API Interface
 */
export interface IOptionsAPI {
  getOptionsChain(symbol: string, params?: any): Promise<any>;
  getOptionsFlow(params?: any): Promise<any>;
  getHistoricalOptions(symbol: string, params?: any): Promise<any>;
}

/**
 * News API Interface
 */
export interface INewsAPI {
  getNews(params?: any): Promise<any>;
  getSentiment(symbol: string, params?: any): Promise<any>;
  getMarketSentiment(params?: any): Promise<any>;
  getTrendingTopics(params?: any): Promise<any>;
}

/**
 * Screener API Interface
 */
export interface IScreenerAPI {
  screen(filters: any, params?: any): Promise<any>;
  getPredefinedScreen(name: string, params?: any): Promise<any>;
  getScreenerFields(): Promise<any>;
}

/**
 * Reference API Interface
 */
export interface IReferenceAPI {
  getExchanges(): Promise<any>;
  getExchangeSymbols(exchange: string, params?: any): Promise<any>;
  getExchangeDetails(exchange: string, params?: any): Promise<any>;
  searchSymbols(query: string, params?: any): Promise<any>;
  getMarketStatus(exchange: string): Promise<any>;
  getTradingCalendar(exchange: string, year: number): Promise<any>;
}

/**
 * Economic API Interface
 */
export interface IEconomicAPI {
  getEconomicEvents(params?: any): Promise<any>;
  getMacroIndicator(country: string, indicator: string, params?: any): Promise<any>;
  getCountryOverview(country: string): Promise<any>;
  getYieldCurve(country: string): Promise<any>;
}

/**
 * Alternative API Interface
 */
export interface IAlternativeAPI {
  getInsiderTransactions(params?: any): Promise<any>;
  getIPOCalendar(params?: any): Promise<any>;
  getEarningsCalendar(params?: any): Promise<any>;
  getShortInterest(symbol: string): Promise<any>;
  getInstitutionalHoldings(symbol: string): Promise<any>;
}

/**
 * Crypto API Interface
 */
export interface ICryptoAPI {
  getCryptoExchanges(): Promise<any>;
  getCryptoSymbols(exchange: string): Promise<any>;
  getCryptoQuote(symbol: string): Promise<any>;
  getCryptoFundamentals(symbol: string): Promise<any>;
  getCryptoHistoricalData(symbol: string, params?: any): Promise<any>;
}

/**
 * Bonds API Interface
 */
export interface IBondsAPI {
  getGovernmentBonds(country: string): Promise<any>;
  getCorporateBond(isin: string): Promise<any>;
  getYieldCurve(country: string): Promise<any>;
  searchBonds(params?: any): Promise<any>;
  getBondIssuances(params?: any): Promise<any>;
}

/**
 * Service Options
 */
export interface ServiceOptions extends EODHDConfig {
  cache?: {
    enabled: boolean;
    ttl: number; // Time to live in seconds
    maxSize?: number; // Max cache size in MB
  };
  rateLimit?: {
    maxRequestsPerMinute: number;
    maxRequestsPerDay: number;
  };
  retry?: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
  logging?: {
    level: 'debug' | 'info' | 'warn' | 'error';
    logRequests: boolean;
    logResponses: boolean;
  };
}

/**
 * Request Context
 */
export interface RequestContext {
  endpoint: string;
  params?: any;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  timeout?: number;
  retryCount?: number;
  cached?: boolean;
}

/**
 * Service Response
 */
export interface ServiceResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
  cached: boolean;
  timestamp: number;
  latency: number;
}

/**
 * Service Error
 */
export interface ServiceError extends Error {
  code: string;
  status?: number;
  endpoint?: string;
  params?: any;
  response?: any;
  retryable?: boolean;
}