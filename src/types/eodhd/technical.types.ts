/**
 * EODHD Technical Indicators Types
 * Types for 100+ technical analysis indicators
 */

import { DateString, Symbol, FormatParams, DateRangeParams } from './common.types';

/**
 * Base Technical Indicator Response
 */
export interface TechnicalIndicatorBase {
  date: DateString;
}

/**
 * Single Value Indicators
 */
export interface SingleValueIndicator extends TechnicalIndicatorBase {
  value: number;
}

/**
 * Common Technical Parameters
 */
export interface TechnicalParams extends FormatParams, DateRangeParams {
  function: string;
}

/**
 * Moving Average Types
 */
export interface MovingAverageParams extends TechnicalParams {
  function: 'sma' | 'ema' | 'wma' | 'dema' | 'tema' | 't3' | 'kama';
  period?: number; // default: 50
  series_type?: 'close' | 'open' | 'high' | 'low';
}

export type MovingAverageResponse = SingleValueIndicator[];

/**
 * RSI (Relative Strength Index)
 */
export interface RSIParams extends TechnicalParams {
  function: 'rsi';
  period?: number; // default: 14
}

export type RSIResponse = SingleValueIndicator[];

/**
 * MACD (Moving Average Convergence Divergence)
 */
export interface MACDParams extends TechnicalParams {
  function: 'macd';
  fast_period?: number; // default: 12
  slow_period?: number; // default: 26
  signal_period?: number; // default: 9
}

export interface MACDData extends TechnicalIndicatorBase {
  macd: number;
  macd_signal: number;
  macd_hist: number;
}

export type MACDResponse = MACDData[];

/**
 * Bollinger Bands
 */
export interface BollingerBandsParams extends TechnicalParams {
  function: 'bbands';
  period?: number; // default: 20
  std_dev?: number; // default: 2
}

export interface BollingerBandsData extends TechnicalIndicatorBase {
  upper: number;
  middle: number;
  lower: number;
}

export type BollingerBandsResponse = BollingerBandsData[];

/**
 * Stochastic Oscillator
 */
export interface StochasticParams extends TechnicalParams {
  function: 'stoch';
  fast_k_period?: number; // default: 14
  slow_k_period?: number; // default: 3
  slow_d_period?: number; // default: 3
}

export interface StochasticData extends TechnicalIndicatorBase {
  slow_k: number;
  slow_d: number;
}

export type StochasticResponse = StochasticData[];

/**
 * ATR (Average True Range)
 */
export interface ATRParams extends TechnicalParams {
  function: 'atr';
  period?: number; // default: 14
}

export type ATRResponse = SingleValueIndicator[];

/**
 * CCI (Commodity Channel Index)
 */
export interface CCIParams extends TechnicalParams {
  function: 'cci';
  period?: number; // default: 20
}

export type CCIResponse = SingleValueIndicator[];

/**
 * ADX (Average Directional Index)
 */
export interface ADXParams extends TechnicalParams {
  function: 'adx';
  period?: number; // default: 14
}

export type ADXResponse = SingleValueIndicator[];

/**
 * DMI (Directional Movement Index)
 */
export interface DMIParams extends TechnicalParams {
  function: 'dmi';
  period?: number; // default: 14
}

export interface DMIData extends TechnicalIndicatorBase {
  plus_di: number;
  minus_di: number;
}

export type DMIResponse = DMIData[];

/**
 * Parabolic SAR
 */
export interface SARParams extends TechnicalParams {
  function: 'sar';
  acceleration?: number; // default: 0.02
  maximum?: number; // default: 0.2
}

export type SARResponse = SingleValueIndicator[];

/**
 * Volume Indicators
 */
export interface VolumeIndicatorParams extends TechnicalParams {
  function: 'avgvol' | 'avgvolccy' | 'obv' | 'ad' | 'adosc' | 'mfi' | 'cmf';
  period?: number;
}

/**
 * Statistical Indicators
 */
export interface StatisticalParams extends TechnicalParams {
  function: 'stddev' | 'slope' | 'beta' | 'correlation';
  period?: number;
  symbol2?: Symbol; // For beta and correlation
}

/**
 * All Technical Functions Union
 */
export type TechnicalFunction = 
  // Moving Averages
  | 'sma' | 'ema' | 'wma' | 'dema' | 'tema' | 't3' | 'kama'
  // Momentum
  | 'rsi' | 'macd' | 'stoch' | 'stochrsi' | 'willr' | 'roc' | 'rocp'
  // Volatility
  | 'bbands' | 'atr' | 'natr' | 'trange' | 'keltner' | 'donchian'
  // Trend
  | 'adx' | 'dmi' | 'sar' | 'aroon' | 'aroonosc' | 'psar'
  // Volume
  | 'avgvol' | 'avgvolccy' | 'obv' | 'ad' | 'adosc' | 'mfi' | 'cmf' | 'vwap'
  // Statistical
  | 'stddev' | 'slope' | 'beta' | 'correlation' | 'linearreg'
  // Pattern Recognition (50+ patterns)
  | 'cdl2crows' | 'cdl3blackcrows' | 'cdl3inside' | 'cdl3linestrike'
  | 'cdl3outside' | 'cdl3starsinsouth' | 'cdl3whitesoldiers' | 'cdlabandonedbaby'
  | 'cdladvanceblock' | 'cdlbelthold' | 'cdlbreakaway' | 'cdlclosingmarubozu'
  | 'cdlconcealbabyswall' | 'cdlcounterattack' | 'cdldarkcloudcover' | 'cdldoji'
  | 'cdldojistar' | 'cdldragonflydoji' | 'cdlengulfing' | 'cdleveningdojistar'
  | 'cdleveningstar' | 'cdlgapsidesidewhite' | 'cdlgravestonedoji' | 'cdlhammer'
  | 'cdlhangingman' | 'cdlharami' | 'cdlharamicross' | 'cdlhighwave'
  | 'cdlhikkake' | 'cdlhikkakemod' | 'cdlhomingpigeon' | 'cdlidentical3crows'
  | 'cdlinneck' | 'cdlinvertedhammer' | 'cdlkicking' | 'cdlkickingbylength'
  | 'cdlladderbottom' | 'cdllongleggeddoji' | 'cdllongline' | 'cdlmarubozu'
  | 'cdlmatchinglow' | 'cdlmathold' | 'cdlmorningdojistar' | 'cdlmorningstar'
  | 'cdlonneck' | 'cdlpiercing' | 'cdlrickshawman' | 'cdlrisefall3methods'
  | 'cdlseparatinglines' | 'cdlshootingstar' | 'cdlshortline' | 'cdlspinningtop'
  | 'cdlstalledpattern' | 'cdlsticksandwich' | 'cdltakuri' | 'cdltasukigap'
  | 'cdlthrusting' | 'cdltristar' | 'cdlunique3river' | 'cdlupsidegap2crows'
  | 'cdlxsidegap3methods';

/**
 * Generic Technical Indicator Params
 */
export interface GenericTechnicalParams extends TechnicalParams {
  function: TechnicalFunction;
  period?: number;
  fast_period?: number;
  slow_period?: number;
  signal_period?: number;
  acceleration?: number;
  maximum?: number;
  std_dev?: number;
  fast_k_period?: number;
  slow_k_period?: number;
  slow_d_period?: number;
  series_type?: 'close' | 'open' | 'high' | 'low';
  symbol2?: Symbol;
}

/**
 * Pattern Recognition Response
 */
export interface PatternData extends TechnicalIndicatorBase {
  pattern: -100 | -50 | 0 | 50 | 100; // Bearish to Bullish strength
}

export type PatternResponse = PatternData[];

/**
 * Technical Indicator Service Response
 */
export type TechnicalIndicatorResponse = 
  | SingleValueIndicator[]
  | MACDData[]
  | BollingerBandsData[]
  | StochasticData[]
  | DMIData[]
  | PatternData[];