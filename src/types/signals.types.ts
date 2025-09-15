/**
 * Signal-related type definitions for THub V2
 * 
 * These types extend the database types with UI-specific fields
 * and provide proper type safety throughout the application
 */

import type { Database } from './supabase.generated'

// Database types
export type DbSignal = Database['public']['Tables']['signals']['Row']
export type DbSignalInsert = Database['public']['Tables']['signals']['Insert']
export type DbSignalUpdate = Database['public']['Tables']['signals']['Update']

// Enum types matching database
export type MarketType = 'stocks_us' | 'crypto' | 'forex'
export type SignalStrength = 'VERY_STRONG' | 'STRONG' | 'MODERATE' | 'WEAK'

// Map database signal strength to UI-friendly values
export const SIGNAL_STRENGTH_MAP: Record<SignalStrength, string> = {
  VERY_STRONG: 'strong_buy',
  STRONG: 'buy',
  MODERATE: 'hold',
  WEAK: 'sell'
} as const

export type UISignalStrength = 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'

// Extended Signal type for UI components
export interface Signal extends Omit<DbSignal, 'signal_strength'> {
  // Override signal_strength with UI-friendly type
  signal_strength: UISignalStrength
  
  // Additional UI fields
  company_name: string
  price_change_24h: number
  price_change_percent_24h: number
  volume_24h: number
  market_cap: number
  price_history: number[]
  
  // Computed fields
  score_zone: 'hot' | 'warm' | 'cool' | 'cold'
  time_since_created: string
  is_expired: boolean
}

// Signal filters for API queries
export interface SignalFilters {
  market?: MarketType
  signal_strength?: SignalStrength[]
  min_score?: number
  max_score?: number
  symbol?: string
  saved?: boolean
  viewed?: boolean
  active?: boolean
}

// Signal sort options
export type SignalSortBy = 'score' | 'created_at' | 'price_change' | 'volume'
export type SignalSortOrder = 'asc' | 'desc'

export interface SignalSort {
  by: SignalSortBy
  order: SignalSortOrder
}

// Query options for fetching signals
export interface SignalQueryOptions {
  filters?: SignalFilters
  sort?: SignalSort
  limit?: number
  offset?: number
}

// Response types
export interface SignalResponse {
  data: Signal[]
  count: number
  hasMore: boolean
}

// Analytics types
export interface SignalAnalytics {
  total_signals: number
  active_signals: number
  success_rate: number
  average_return: number
  by_strength: Record<UISignalStrength, number>
  by_market: Record<MarketType, number>
}

// WebSocket event types
export interface SignalEvent {
  type: 'created' | 'updated' | 'expired'
  signal: Signal
  timestamp: string
}

// Helper functions
export function mapDbSignalToUI(dbSignal: DbSignal, additionalData?: Partial<Signal>): Signal {
  const uiStrength = SIGNAL_STRENGTH_MAP[dbSignal.signal_strength as SignalStrength] || 'hold'
  
  return {
    ...dbSignal,
    signal_strength: uiStrength as UISignalStrength,
    company_name: additionalData?.company_name || '',
    price_change_24h: additionalData?.price_change_24h || 0,
    price_change_percent_24h: additionalData?.price_change_percent_24h || 0,
    volume_24h: additionalData?.volume_24h || 0,
    market_cap: additionalData?.market_cap || 0,
    price_history: additionalData?.price_history || [],
    score_zone: getScoreZone(dbSignal.convergence_score),
    time_since_created: getTimeSince(dbSignal.created_at),
    is_expired: isSignalExpired(dbSignal.expires_at),
    ...additionalData
  }
}

export function getScoreZone(score: number): Signal['score_zone'] {
  if (score >= 80) return 'hot'
  if (score >= 70) return 'warm'
  if (score >= 60) return 'cool'
  return 'cold'
}

export function getTimeSince(date: string | null): string {
  if (!date) return 'Unknown'
  
  const now = new Date()
  const created = new Date(date)
  const diffMs = now.getTime() - created.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  return `${Math.floor(diffMins / 1440)}d ago`
}

export function isSignalExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

// Validation schemas (using type guards instead of runtime validation for now)
export function isValidSignalStrength(value: string): value is UISignalStrength {
  return ['strong_buy', 'buy', 'hold', 'sell', 'strong_sell'].includes(value)
}

export function isValidMarketType(value: string): value is MarketType {
  return ['stocks_us', 'crypto', 'forex'].includes(value)
}

// Mock data factory for development
export function createMockSignal(overrides?: Partial<Signal>): Signal {
  const baseSignal: DbSignal = {
    id: crypto.randomUUID(),
    symbol: 'AAPL',
    market: 'stocks_us' as MarketType,
    technical_score: 35,
    sentiment_score: 25,
    liquidity_score: 25,
    convergence_score: 85,
    signal_strength: 'STRONG' as SignalStrength,
    current_price: 182.45,
    entry_price: 181.20,
    stop_loss: 178.50,
    take_profit: 186.80,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    technical_data: {},
    analysis_notes: [],
    viewed_by: [],
    saved_by: []
  }
  
  return mapDbSignalToUI(baseSignal, {
    company_name: 'Apple Inc.',
    price_change_24h: 2.34,
    price_change_percent_24h: 1.3,
    volume_24h: 45200000,
    market_cap: 2800000000000,
    price_history: Array(20).fill(0).map(() => 180 + Math.random() * 5),
    ...overrides
  })
}