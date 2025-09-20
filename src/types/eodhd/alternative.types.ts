/**
 * EODHD Alternative Data Types
 * Types for insider trading, IPOs, earnings, and other alternative data
 */

import { DateString, Symbol, Currency } from './common.types';

/**
 * Insider Transaction
 */
export interface InsiderTransaction {
  date: DateString;
  transactionDate: DateString;
  reportingDate: DateString;
  ownerCik?: string;
  ownerName: string;
  ownerTitle?: string;
  transactionCode: string;
  transactionCodeDesc?: string;
  transactionAmount: number;
  transactionPrice?: number;
  transactionValue?: number;
  transactionAcquiredDisposed: 'A' | 'D';
  postTransactionAmount?: number;
  secLink?: string;
  notes?: string;
}

/**
 * IPO Calendar Entry
 */
export interface IPOEntry {
  symbol?: Symbol;
  name: string;
  exchange?: string;
  ipoDate: DateString;
  priceRange?: string;
  price?: number;
  currency?: Currency;
  shares?: number;
  marketCap?: number;
  status: 'Scheduled' | 'Priced' | 'Withdrawn' | 'Completed';
  underwriters?: string[];
  sector?: string;
  industry?: string;
  description?: string;
  prospectusUrl?: string;
}

/**
 * Earnings Calendar Entry
 */
export interface EarningsEntry {
  symbol: Symbol;
  name: string;
  reportDate: DateString;
  reportTime: 'BMO' | 'AMC' | 'TNS'; // Before Market Open, After Market Close, Time Not Supplied
  epsEstimate?: number;
  epsActual?: number;
  epsSurprise?: number;
  epsSurprisePercent?: number;
  revenueEstimate?: number;
  revenueActual?: number;
  revenueSurprise?: number;
  revenueSurprisePercent?: number;
  fiscalPeriod: string;
  fiscalYear: number;
  callTime?: string;
  callUrl?: string;
}

/**
 * Insider Trading Parameters
 */
export interface InsiderTradingParams {
  code?: Symbol;
  from?: DateString;
  to?: DateString;
  limit?: number;
}

/**
 * IPO Calendar Parameters
 */
export interface IPOCalendarParams {
  from?: DateString;
  to?: DateString;
  symbols?: string;
}

/**
 * Earnings Calendar Parameters
 */
export interface EarningsCalendarParams {
  from?: DateString;
  to?: DateString;
  symbols?: string;
}

/**
 * Insider Trading Summary
 */
export interface InsiderTradingSummary {
  symbol: Symbol;
  period: string;
  buyTransactions: number;
  sellTransactions: number;
  netTransactions: number;
  buyVolume: number;
  sellVolume: number;
  netVolume: number;
  buyValue: number;
  sellValue: number;
  netValue: number;
  insiders: Array<{
    name: string;
    title: string;
    transactions: number;
    netShares: number;
    netValue: number;
  }>;
}

/**
 * IPO Performance
 */
export interface IPOPerformance {
  symbol: Symbol;
  name: string;
  ipoDate: DateString;
  ipoPrice: number;
  currentPrice: number;
  return: number;
  returnPercent: number;
  firstDayReturn: number;
  firstWeekReturn: number;
  firstMonthReturn: number;
}

/**
 * Earnings Surprise History
 */
export interface EarningsSurpriseHistory {
  symbol: Symbol;
  data: Array<{
    reportDate: DateString;
    fiscalPeriod: string;
    epsEstimate: number;
    epsActual: number;
    epsSurprise: number;
    epsSurprisePercent: number;
    revenueEstimate?: number;
    revenueActual?: number;
    revenueSurprise?: number;
    revenueSurprisePercent?: number;
  }>;
  averageSurprise: number;
  beatRate: number; // Percentage of earnings beats
}

/**
 * Short Interest
 */
export interface ShortInterest {
  symbol: Symbol;
  date: DateString;
  shortInterest: number;
  daysTocover: number;
  shortPercentOfFloat: number;
  shortPercentOfSharesOutstanding: number;
  previousShortInterest: number;
  changeVsPreviousMonth: number;
  changePercent: number;
}

/**
 * Institutional Holdings
 */
export interface InstitutionalHoldings {
  symbol: Symbol;
  date: DateString;
  institutionalOwnershipPercent: number;
  numberofInstitutions: number;
  topHolders: Array<{
    name: string;
    shares: number;
    value: number;
    percentOfShares: number;
    changeInShares: number;
    changePercent: number;
  }>;
}