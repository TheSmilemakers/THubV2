/**
 * EODHD News & Sentiment Types
 * Types for financial news and sentiment analysis
 */

import { DateString, Symbol } from './common.types';

/**
 * News Article
 */
export interface NewsArticle {
  date: DateString;
  title: string;
  content: string;
  link: string;
  symbols: string[];
  tags?: string[];
  sentiment?: NewsSentiment;
  source?: string;
  author?: string;
}

/**
 * News Sentiment
 */
export interface NewsSentiment {
  polarity: number; // -1 to 1
  pos: number; // Positive sentiment score 0-1
  neu: number; // Neutral sentiment score 0-1
  neg: number; // Negative sentiment score 0-1
  compound: number; // Compound sentiment score
  confidence?: number;
}

/**
 * Aggregate Sentiment
 */
export interface AggregateSentiment {
  symbol: Symbol;
  date: DateString;
  articlesCount: number;
  averageSentiment: number;
  sentimentScores: {
    positive: number;
    neutral: number;
    negative: number;
  };
  momentum: 'Bullish' | 'Neutral' | 'Bearish';
  buzzScore: number; // News volume relative to average
}

/**
 * News Parameters
 */
export interface NewsParams {
  s?: string; // Symbol filter (comma-separated for multiple)
  t?: string; // Tag filter
  from?: DateString;
  to?: DateString;
  limit?: number;
  offset?: number;
}

/**
 * News Response
 */
export type NewsResponse = NewsArticle[];

/**
 * Sentiment Timeline
 */
export interface SentimentTimeline {
  symbol: Symbol;
  data: Array<{
    date: DateString;
    sentiment: number;
    volume: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
  }>;
}

/**
 * Trending Topics
 */
export interface TrendingTopics {
  date: DateString;
  topics: Array<{
    topic: string;
    count: number;
    sentiment: number;
    symbols: string[];
    momentum: 'Rising' | 'Stable' | 'Falling';
  }>;
}

/**
 * News Source Statistics
 */
export interface NewsSourceStats {
  source: string;
  articleCount: number;
  averageSentiment: number;
  reliability?: number;
}

/**
 * Market Sentiment Overview
 */
export interface MarketSentiment {
  date: DateString;
  overallSentiment: number;
  bullishPercent: number;
  bearishPercent: number;
  fearGreedIndex?: number;
  volatilityIndex?: number;
  topBullish: Array<{
    symbol: Symbol;
    sentiment: number;
    newsCount: number;
  }>;
  topBearish: Array<{
    symbol: Symbol;
    sentiment: number;
    newsCount: number;
  }>;
  sectorSentiment?: {
    [sector: string]: {
      sentiment: number;
      newsCount: number;
    };
  };
}