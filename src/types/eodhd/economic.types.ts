/**
 * EODHD Economic Data Types
 * Types for economic indicators, events, and macro data
 */

import { DateString, Currency } from './common.types';

/**
 * Economic Event
 */
export interface EconomicEvent {
  date: DateString;
  time?: string;
  country: string;
  countryCode: string;
  event: string;
  importance: 'Low' | 'Medium' | 'High';
  actual?: number | string;
  forecast?: number | string;
  previous?: number | string;
  currency?: Currency;
  unit?: string;
  description?: string;
}

/**
 * Economic Indicator
 */
export interface EconomicIndicator {
  date: DateString;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
}

/**
 * Macro Indicator Types
 */
export type MacroIndicatorType =
  | 'gdp' // Gross Domestic Product
  | 'gdp_growth' // GDP Growth Rate
  | 'gdp_per_capita'
  | 'inflation_rate' // CPI
  | 'core_inflation'
  | 'unemployment_rate'
  | 'interest_rate' // Central Bank Rate
  | 'money_supply_m0'
  | 'money_supply_m1'
  | 'money_supply_m2'
  | 'money_supply_m3'
  | 'treasury_yield_10y'
  | 'treasury_yield_2y'
  | 'treasury_yield_30y'
  | 'government_debt'
  | 'government_debt_to_gdp'
  | 'current_account'
  | 'current_account_to_gdp'
  | 'trade_balance'
  | 'exports'
  | 'imports'
  | 'industrial_production'
  | 'manufacturing_pmi'
  | 'services_pmi'
  | 'composite_pmi'
  | 'retail_sales'
  | 'consumer_confidence'
  | 'business_confidence'
  | 'housing_starts'
  | 'building_permits'
  | 'construction_spending'
  | 'personal_income'
  | 'personal_spending'
  | 'personal_savings_rate';

/**
 * Macro Economic Data
 */
export interface MacroEconomicData {
  country: string;
  indicator: MacroIndicatorType;
  period: 'monthly' | 'quarterly' | 'yearly';
  data: EconomicIndicator[];
  unit?: string;
  seasonallyAdjusted?: boolean;
  source?: string;
}

/**
 * Economic Calendar Parameters
 */
export interface EconomicCalendarParams {
  from?: DateString;
  to?: DateString;
  country?: string; // ISO country code or comma-separated list
  importance?: 'Low' | 'Medium' | 'High';
  impact?: string;
}

/**
 * Macro Indicator Parameters
 */
export interface MacroIndicatorParams {
  indicator: MacroIndicatorType;
  from?: DateString;
  to?: DateString;
  period?: 'monthly' | 'quarterly' | 'yearly';
}

/**
 * Country Economic Overview
 */
export interface CountryEconomicOverview {
  country: string;
  countryCode: string;
  currency: Currency;
  gdp: number;
  gdpGrowth: number;
  inflationRate: number;
  unemploymentRate: number;
  interestRate: number;
  governmentDebtToGDP: number;
  currentAccountToGDP: number;
  population: number;
  lastUpdated: DateString;
}

/**
 * Central Bank Decision
 */
export interface CentralBankDecision {
  date: DateString;
  country: string;
  centralBank: string;
  previousRate: number;
  currentRate: number;
  change: number;
  decision: 'Hike' | 'Cut' | 'Hold';
  statement?: string;
  nextMeetingDate?: DateString;
}

/**
 * Economic Forecast
 */
export interface EconomicForecast {
  country: string;
  indicator: MacroIndicatorType;
  period: string;
  actual?: number;
  forecast: number;
  previous?: number;
  confidence?: {
    low: number;
    high: number;
  };
  source: string;
  updatedAt: DateString;
}

/**
 * Global Economic Summary
 */
export interface GlobalEconomicSummary {
  date: DateString;
  globalGDPGrowth: number;
  globalInflation: number;
  globalTradeVolume: number;
  commodityIndex: number;
  dollarIndex: number;
  regions: {
    [region: string]: {
      gdpGrowth: number;
      inflation: number;
      unemployment: number;
    };
  };
}

/**
 * Economic Surprise Index
 */
export interface EconomicSurpriseIndex {
  date: DateString;
  country: string;
  value: number; // Positive = data beating expectations
  movingAverage30d: number;
  standardDeviation: number;
}

/**
 * Treasury Yield Curve
 */
export interface YieldCurve {
  date: DateString;
  country: string;
  currency: Currency;
  yields: {
    '1m'?: number;
    '3m'?: number;
    '6m'?: number;
    '1y'?: number;
    '2y'?: number;
    '3y'?: number;
    '5y'?: number;
    '7y'?: number;
    '10y'?: number;
    '20y'?: number;
    '30y'?: number;
  };
  spread_2y10y?: number;
  spread_3m10y?: number;
  inverted?: boolean;
}