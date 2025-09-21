// Cryptocurrency Signal Types
// Aligned with crypto_signals database table and n8n workflow output

export interface CryptoSignal {
  id: string;
  
  // Basic Information
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number | null;
  volume_24h: number | null;
  
  // Price Changes
  price_change_1h: number | null;
  price_change_24h: number | null;
  price_change_7d: number | null;
  price_change_30d: number | null;
  
  // Technical Metrics
  volume_to_market_cap_ratio: number | null;
  volatility_score: number | null;
  support_level: number | null;
  resistance_level: number | null;
  current_position: number | null; // % between support and resistance
  
  // Historical Comparison
  ath_change_percentage: number | null;
  atl_change_percentage: number | null;
  
  // Scoring Components (0-100)
  technical_score: number | null;
  momentum_score: number | null;
  volume_score: number | null;
  sentiment_alignment_score: number | null;
  overall_score: number | null;
  final_score: number; // Required, weighted combination
  
  // Signal Analysis
  signals: string[];
  recommendation: 'STRONG BUY' | 'BUY' | 'HOLD' | 'WAIT';
  
  // Advanced Indicators
  rsi: number | null;
  rsi_signal: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT' | null;
  whale_activity: {
    score: number;
    level: 'HIGH' | 'MEDIUM' | 'LOW';
  } | null;
  
  // Sentiment Data
  market_sentiment: string | null;
  sentiment_score: number | null;
  fear_greed_value: number | null;
  fear_greed_classification: string | null;
  
  // Risk Management
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  suggested_entry_price: number | null;
  suggested_stop_loss: number | null;
  suggested_take_profit: number | null;
  
  // Metadata
  source: string;
  workflow_version: string;
  created_at: string;
  expires_at: string;
}

// Input type for webhook from n8n
export interface CryptoSignalWebhookPayload {
  signals: CryptoSignalInput[];
  metadata: {
    source: string;
    version: string;
    timestamp: string;
  };
}

// Input type for creating crypto signals
export interface CryptoSignalInput {
  symbol: string;
  name: string;
  current_price: number;
  market_cap?: number;
  volume_24h?: number;
  price_change_1h?: number;
  price_change_24h?: number;
  price_change_7d?: number;
  price_change_30d?: number;
  volume_to_market_cap_ratio?: number;
  volatility_score?: number;
  support_level?: number;
  resistance_level?: number;
  current_position?: number;
  ath_change_percentage?: number;
  atl_change_percentage?: number;
  technical_score?: number;
  momentum_score?: number;
  volume_score?: number;
  sentiment_alignment_score?: number;
  overall_score?: number;
  final_score: number;
  signals: string[];
  recommendation: 'STRONG BUY' | 'BUY' | 'HOLD' | 'WAIT';
  rsi?: number;
  rsi_signal?: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT';
  whale_activity?: string | { score: number; level: 'HIGH' | 'MEDIUM' | 'LOW' };
  market_sentiment?: string;
  sentiment_score?: number;
  fear_greed_value?: number;
  fear_greed_classification?: string;
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH';
  suggested_entry_price?: number;
  suggested_stop_loss?: number;
  suggested_take_profit?: number;
  timestamp?: string;
}

// Response types for API endpoints
export interface CryptoSignalsResponse {
  success: boolean;
  data: CryptoSignal[];
  count: number;
  error?: string;
}

export interface CryptoSignalResponse {
  success: boolean;
  data: CryptoSignal;
  error?: string;
}

// Query options for fetching crypto signals
export interface CryptoSignalQueryOptions {
  symbol?: string;
  minScore?: number;
  maxScore?: number;
  recommendation?: 'STRONG BUY' | 'BUY' | 'HOLD' | 'WAIT';
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  limit?: number;
  offset?: number;
  orderBy?: 'final_score' | 'created_at' | 'market_cap' | 'volume_24h';
  order?: 'asc' | 'desc';
  activeOnly?: boolean; // Only non-expired signals
}

// Crypto market statistics
export interface CryptoMarketStats {
  totalSignals: number;
  averageScore: number;
  topGainers: Array<{
    symbol: string;
    name: string;
    change_24h: number;
  }>;
  topVolume: Array<{
    symbol: string;
    name: string;
    volume_24h: number;
  }>;
  marketSentiment: {
    fearGreedIndex: number;
    classification: string;
  };
  signalDistribution: {
    strongBuy: number;
    buy: number;
    hold: number;
    wait: number;
  };
}