/**
 * EODHD Options Data Types
 * Types for options chains, Greeks, and options-related data
 */

import { DateString, Symbol } from './common.types';

/**
 * Option Contract Details
 */
export interface OptionContract {
  contractName: string;
  contractSize: string;
  currency: string;
  type: 'Call' | 'Put';
  inTheMoney: boolean;
  lastTradeDateTime: DateString;
  expirationDate: DateString;
  strike: number;
  lastPrice: number;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
  theoretical?: number;
  intrinsicValue?: number;
  timeValue?: number;
  updatedAt?: DateString;
}

/**
 * Options Chain
 */
export interface OptionsChain {
  code: string;
  exchange: string;
  lastTradeDate: DateString;
  lastTradePrice: number;
  data: Array<{
    expirationDate: DateString;
    impliedVolatility?: number;
    putVolume?: number;
    callVolume?: number;
    putCallVolumeRatio?: number;
    putOpenInterest?: number;
    callOpenInterest?: number;
    putCallOpenInterestRatio?: number;
    optionsCount?: number;
    options: {
      [strike: string]: {
        c?: OptionContract; // Call option
        p?: OptionContract; // Put option
      };
    };
  }>;
}

/**
 * Options Statistics
 */
export interface OptionsStatistics {
  symbol: Symbol;
  date: DateString;
  putCallRatio: number;
  totalVolume: number;
  totalOpenInterest: number;
  volatilitySkew: number;
  termStructure: Array<{
    expirationDate: DateString;
    daysToExpiration: number;
    impliedVolatility: number;
    atmVolatility: number;
  }>;
}

/**
 * Greeks Summary
 */
export interface GreeksSummary {
  symbol: Symbol;
  date: DateString;
  netDelta: number;
  netGamma: number;
  netTheta: number;
  netVega: number;
  netRho: number;
}

/**
 * Options Flow
 */
export interface OptionsFlow {
  timestamp: DateString;
  symbol: Symbol;
  contractName: string;
  type: 'Call' | 'Put';
  strike: number;
  expirationDate: DateString;
  tradeType: 'Buy' | 'Sell' | 'Unknown';
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  volume: number;
  openInterest: number;
  premium: number;
  spotPrice: number;
  moneyness: 'ITM' | 'ATM' | 'OTM';
  unusualActivity: boolean;
}

/**
 * Options Parameters
 */
export interface OptionsParams {
  from?: DateString;
  to?: DateString;
  trade_date_from?: DateString;
  trade_date_to?: DateString;
  contract_name?: string;
}

/**
 * Options Chain Response
 */
export type OptionsChainResponse = OptionsChain;

/**
 * Historical Options Data
 */
export interface HistoricalOptionsData {
  symbol: Symbol;
  data: Array<{
    date: DateString;
    putVolume: number;
    callVolume: number;
    putCallVolumeRatio: number;
    putOpenInterest: number;
    callOpenInterest: number;
    putCallOpenInterestRatio: number;
    totalVolume: number;
    totalOpenInterest: number;
  }>;
}