/**
 * Market Scanner Types
 * Types for market scanning and opportunity discovery
 */

export interface MarketFilters {
  exchange?: string;
  minVolume?: number;
  minPrice?: number;
  maxPrice?: number;
  minDailyChange?: number;
  excludeSectors?: string[];
  limit?: number;
}

export interface MarketCandidate {
  symbol: string;
  price: number;
  volume: number;
  change: number;
  changePercent: number;
  opportunityScore: number;
  volumeRatio?: number;
  dollarVolume: number;
  scanReason?: string;
}

export interface MarketScanResult {
  totalSymbols: number;
  filteredSymbols: number;
  candidates: MarketCandidate[];
  scanTime: number;
  scanId?: string;
}

export interface MarketScanQueueEntry {
  id?: string;
  symbol: string;
  scan_timestamp?: Date;
  scan_reason?: string;
  opportunity_score: number;
  filters_matched: Record<string, any>;
  priority?: number;
  processed?: boolean;
  processed_at?: Date;
  analysis_result?: Record<string, any>;
}

export interface MarketScanHistory {
  id?: string;
  scan_id: string;
  total_symbols: number;
  filtered_symbols: number;
  candidates_found: number;
  signals_generated?: number;
  scan_duration_ms: number;
  filters_used: MarketFilters;
  api_calls_used?: number;
  created_at?: Date;
}