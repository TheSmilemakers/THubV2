/**
 * EODHD Bonds Data Types
 * Types for government and corporate bonds
 */

import { DateString, Currency } from './common.types';

/**
 * Government Bond
 */
export interface GovernmentBond {
  country: string;
  name: string;
  symbol?: string;
  maturity: string; // e.g., "10Y", "30Y"
  yield: number;
  yieldChange: number;
  yieldChangePercent: number;
  price?: number;
  priceChange?: number;
  previousClose?: number;
  coupon?: number;
  frequency?: number; // Payments per year
  updated: DateString;
}

/**
 * Corporate Bond
 */
export interface CorporateBond {
  isin: string;
  cusip?: string;
  name: string;
  issuer: string;
  currency: Currency;
  maturityDate: DateString;
  couponRate: number;
  couponFrequency: number;
  price: number;
  yield: number;
  yieldToMaturity: number;
  duration: number;
  modifiedDuration: number;
  convexity: number;
  rating?: BondRating;
  sector?: string;
  callableDate?: DateString;
  callPrice?: number;
  updated: DateString;
}

/**
 * Bond Rating
 */
export interface BondRating {
  agency: 'Moody' | 'S&P' | 'Fitch';
  rating: string; // e.g., "AAA", "BBB+", "Baa1"
  outlook: 'Positive' | 'Stable' | 'Negative';
  lastUpdate: DateString;
}

/**
 * Yield Curve Point
 */
export interface YieldCurvePoint {
  maturity: string;
  years: number;
  yield: number;
}

/**
 * Government Yield Curve
 */
export interface GovernmentYieldCurve {
  country: string;
  date: DateString;
  currency: Currency;
  curve: YieldCurvePoint[];
  spread2s10s?: number; // 2-year vs 10-year spread
  spread3m10y?: number; // 3-month vs 10-year spread
  inverted: boolean;
}

/**
 * Bond Price Data
 */
export interface BondPriceData {
  date: DateString;
  open: number;
  high: number;
  low: number;
  close: number;
  yield: number;
  volume?: number;
}

/**
 * Bond Analytics
 */
export interface BondAnalytics {
  symbol: string;
  price: number;
  yield: number;
  duration: number;
  modifiedDuration: number;
  convexity: number;
  dv01: number; // Dollar value of 1 basis point
  spread?: number; // Spread to benchmark
  zSpread?: number; // Zero-volatility spread
  optionAdjustedSpread?: number;
  assetSwapSpread?: number;
}

/**
 * Credit Spread
 */
export interface CreditSpread {
  date: DateString;
  rating: string;
  maturity: string;
  spread: number; // Basis points over treasury
  change: number;
  changePercent: number;
}

/**
 * Bond Index
 */
export interface BondIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  yield: number;
  duration: number;
  constituents?: number;
  updated: DateString;
}

/**
 * Bond Search Parameters
 */
export interface BondSearchParams {
  country?: string;
  issuer?: string;
  rating?: string;
  minRating?: string;
  maxRating?: string;
  minMaturity?: DateString;
  maxMaturity?: DateString;
  minCoupon?: number;
  maxCoupon?: number;
  minYield?: number;
  maxYield?: number;
  currency?: Currency;
  sector?: string;
  callable?: boolean;
  convertible?: boolean;
}

/**
 * Bond Issuance
 */
export interface BondIssuance {
  date: DateString;
  issuer: string;
  amount: number;
  currency: Currency;
  maturity: DateString;
  coupon: number;
  yield: number;
  rating?: string;
  use: string; // Use of proceeds
  bookrunners: string[];
  status: 'Announced' | 'Priced' | 'Completed' | 'Cancelled';
}