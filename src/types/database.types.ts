import { Database } from './supabase.generated';

// Re-export generated types for consistency
export type MarketType = Database['public']['Enums']['market_type'];
export type SignalStrength = Database['public']['Enums']['signal_strength'];

// Database row types
export type SignalRow = Database['public']['Tables']['signals']['Row'];
export type IndicatorCacheRow = Database['public']['Tables']['indicator_cache']['Row'];
export type TestUserRow = Database['public']['Tables']['test_users']['Row'];
// Note: These tables don't exist in the current schema but are referenced in code
// TODO: Add these tables to the database schema
export type MarketScanQueueRow = any;
export type MarketScanHistoryRow = any;

// Application-level interfaces with proper numeric types
export interface Signal {
  id: string;
  symbol: string;
  market: MarketType;
  
  // 3-layer scores (0-100 range, validated by DB constraints)
  technical_score: number | null;
  sentiment_score: number | null;
  liquidity_score: number | null;
  
  // Overall metrics
  convergence_score: number; // 0-100, required
  signal_strength: SignalStrength;
  
  // Price data using proper numeric type (not string)
  current_price: number | null;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  
  // Timestamps
  created_at: string | Date;
  expires_at: string | Date;
  
  // Analysis data
  technical_data: TechnicalData;
  analysis_notes: string[] | null;
  
  // MVP: Engagement tracking
  viewed_by: string[];
  saved_by: string[];
}

// MVP: Test user for friend testing phase
export interface TestUser {
  id: string;
  name: string;
  email: string;
  access_token: string | null;
  created_at: string | Date;
}

export interface IndicatorCache {
  id: string;
  symbol: string;
  indicator: string;
  timeframe: string;
  period: number;
  data: Record<string, any>;
  api_calls_used: number;
  created_at: string;
  expires_at: string;
}

// Input types for database operations
export type CreateSignalInput = Database['public']['Tables']['signals']['Insert'];
export type UpdateSignalInput = Database['public']['Tables']['signals']['Update'];

// Type for creating a cache entry
export type CreateCacheInput = Database['public']['Tables']['indicator_cache']['Insert'];
export type UpdateCacheInput = Database['public']['Tables']['indicator_cache']['Update'];

// Market scan types
export interface MarketScanQueue {
  id: string;
  symbol: string;
  scan_timestamp: string | Date;
  scan_reason: string | null;
  opportunity_score: number | null; // 0-100
  filters_matched: Record<string, any>;
  priority: number; // 0-100
  processed: boolean;
  processed_at: string | Date | null;
  analysis_result: AnalysisResult | null;
  created_at: string | Date;
}

export interface AnalysisResult {
  technical: {
    score: number;
    indicators: Record<string, any>;
    patterns: string[];
  };
  sentiment: {
    score: number;
    sources: Record<string, any>;
  };
  liquidity: {
    score: number;
    metrics: Record<string, any>;
  };
  convergence: {
    score: number;
    strength: SignalStrength;
  };
  recommendation: {
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    entry?: number;
    stopLoss?: number;
    takeProfit?: number;
  };
}

// Technical data structure stored in JSONB
export interface TechnicalData {
  indicators: {
    rsi?: number;
    macd?: {
      value: number;
      signal: number;
      histogram: number;
    };
    sma?: {
      sma20: number;
      sma50: number;
      sma200?: number;
    };
    ema?: {
      ema12: number;
      ema26: number;
      ema50?: number;
    };
    bollinger?: {
      upper: number;
      middle: number;
      lower: number;
      bandwidth: number;
    };
    atr?: number;
    adx?: number;
    stochastic?: {
      k: number;
      d: number;
    };
  };
  patterns?: string[];
  trend?: 'bullish' | 'bearish' | 'neutral';
  volume?: {
    current: number;
    average: number;
    ratio: number;
    obv?: number; // On-Balance Volume
  };
  priceAction?: {
    support: number[];
    resistance: number[];
    pivotPoints?: {
      r3: number;
      r2: number;
      r1: number;
      pivot: number;
      s1: number;
      s2: number;
      s3: number;
    };
  };
}

// API Response types with proper error handling
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  meta?: {
    timestamp: string;
    requestId?: string;
    [key: string]: any;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
  };
  error: ApiError | null;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap?: number;
  pe?: number;
  eps?: number;
  dividend?: number;
  beta?: number;
  week52High?: number;
  week52Low?: number;
}

// Type guards
export const isSignal = (data: any): data is Signal => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.symbol === 'string' &&
    typeof data.convergence_score === 'number' &&
    ['stocks_us', 'crypto', 'forex'].includes(data.market) &&
    ['WEAK', 'MODERATE', 'STRONG', 'VERY_STRONG'].includes(data.signal_strength)
  );
};

export const isApiError = (error: any): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof error.code === 'string' &&
    typeof error.message === 'string'
  );
};

// Conversion utilities
export const convertSignalRowToSignal = (row: SignalRow): Signal => {
  return {
    ...row,
    technical_data: (row.technical_data as unknown as TechnicalData) || {},
    viewed_by: row.viewed_by || [],
    saved_by: row.saved_by || [],
    created_at: new Date(row.created_at || ''),
    expires_at: new Date(row.expires_at || ''),
  };
};