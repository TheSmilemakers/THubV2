/**
 * THub V2 Complete Database Types
 * 
 * Comprehensive TypeScript definitions for all database tables, views, functions,
 * and custom types. Includes both current schema and Phase 1 additions.
 * 
 * Generated from schema analysis and production database inspection.
 * Last updated: September 17, 2025
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ========================================
// CORE ENUMS
// ========================================

export type MarketType = 'stocks_us' | 'crypto' | 'forex'
export type SignalStrength = 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG'
export type ActivityType = 'signal' | 'update' | 'scan' | 'success' | 'error'
export type ModelStatus = 'active' | 'completed' | 'aborted'
export type PredictedDirection = 'up' | 'down' | 'neutral'

// ========================================
// DATABASE TABLES
// ========================================

// Core Signals Table
export interface SignalsTable {
  Row: {
    id: string
    symbol: string
    market: MarketType
    
    // 3-layer convergence scores (0-100)
    technical_score: number | null
    sentiment_score: number | null
    liquidity_score: number | null
    
    // Overall metrics
    convergence_score: number // 0-100, required
    signal_strength: SignalStrength
    
    // Price data (stored as DECIMAL in DB, converted to number)
    current_price: number | null
    entry_price: number | null
    stop_loss: number | null
    take_profit: number | null
    
    // Timestamps
    created_at: string | null
    expires_at: string | null
    
    // Analysis data (JSONB)
    technical_data: Json | null
    analysis_notes: string[] | null
    
    // Engagement tracking (TEXT[] arrays)
    viewed_by: string[] | null
    saved_by: string[] | null
    
    // Phase 1 Additions (if status/return tracking needed)
    status?: 'active' | 'closed' | 'expired'
    actual_return?: number | null
  }
  Insert: {
    id?: string
    symbol: string
    market: MarketType
    technical_score?: number | null
    sentiment_score?: number | null
    liquidity_score?: number | null
    convergence_score: number
    signal_strength: SignalStrength
    current_price?: number | null
    entry_price?: number | null
    stop_loss?: number | null
    take_profit?: number | null
    created_at?: string | null
    expires_at?: string | null
    technical_data?: Json | null
    analysis_notes?: string[] | null
    viewed_by?: string[] | null
    saved_by?: string[] | null
    status?: 'active' | 'closed' | 'expired'
    actual_return?: number | null
  }
  Update: {
    id?: string
    symbol?: string
    market?: MarketType
    technical_score?: number | null
    sentiment_score?: number | null
    liquidity_score?: number | null
    convergence_score?: number
    signal_strength?: SignalStrength
    current_price?: number | null
    entry_price?: number | null
    stop_loss?: number | null
    take_profit?: number | null
    created_at?: string | null
    expires_at?: string | null
    technical_data?: Json | null
    analysis_notes?: string[] | null
    viewed_by?: string[] | null
    saved_by?: string[] | null
    status?: 'active' | 'closed' | 'expired'
    actual_return?: number | null
  }
}

// Indicator Cache Table
export interface IndicatorCacheTable {
  Row: {
    id: string
    symbol: string
    indicator: string
    timeframe: string
    period: number | null
    data: Json
    api_calls_used: number | null
    created_at: string | null
    expires_at: string | null
  }
  Insert: {
    id?: string
    symbol: string
    indicator: string
    timeframe?: string
    period?: number | null
    data: Json
    api_calls_used?: number | null
    created_at?: string | null
    expires_at?: string | null
  }
  Update: {
    id?: string
    symbol?: string
    indicator?: string
    timeframe?: string
    period?: number | null
    data?: Json
    api_calls_used?: number | null
    created_at?: string | null
    expires_at?: string | null
  }
}

// Test Users Table (MVP)
export interface TestUsersTable {
  Row: {
    id: string
    name: string
    email: string
    access_token: string | null
    created_at: string | null
  }
  Insert: {
    id?: string
    name: string
    email: string
    access_token?: string | null
    created_at?: string | null
  }
  Update: {
    id?: string
    name?: string
    email?: string
    access_token?: string | null
    created_at?: string | null
  }
}

// Market Scan Queue Table
export interface MarketScanQueueTable {
  Row: {
    id: string
    symbol: string
    scan_timestamp: string | null
    scan_reason: string | null
    opportunity_score: number | null // 0-100
    filters_matched: Json
    priority: number | null // 0-100
    processed: boolean
    processed_at: string | null
    analysis_result: Json | null
    created_at: string | null
  }
  Insert: {
    id?: string
    symbol: string
    scan_timestamp?: string | null
    scan_reason?: string | null
    opportunity_score?: number | null
    filters_matched?: Json
    priority?: number | null
    processed?: boolean
    processed_at?: string | null
    analysis_result?: Json | null
    created_at?: string | null
  }
  Update: {
    id?: string
    symbol?: string
    scan_timestamp?: string | null
    scan_reason?: string | null
    opportunity_score?: number | null
    filters_matched?: Json
    priority?: number | null
    processed?: boolean
    processed_at?: string | null
    analysis_result?: Json | null
    created_at?: string | null
  }
}

// Market Scan History Table
export interface MarketScanHistoryTable {
  Row: {
    id: string
    scan_id: string
    total_symbols: number
    filtered_symbols: number
    candidates_found: number
    signals_generated: number
    scan_duration_ms: number | null
    filters_used: Json
    api_calls_used: number | null
    created_at: string | null
  }
  Insert: {
    id?: string
    scan_id: string
    total_symbols: number
    filtered_symbols: number
    candidates_found: number
    signals_generated?: number
    scan_duration_ms?: number | null
    filters_used: Json
    api_calls_used?: number | null
    created_at?: string | null
  }
  Update: {
    id?: string
    scan_id?: string
    total_symbols?: number
    filtered_symbols?: number
    candidates_found?: number
    signals_generated?: number
    scan_duration_ms?: number | null
    filters_used?: Json
    api_calls_used?: number | null
    created_at?: string | null
  }
}

// AI Model Performance Table
export interface AiModelPerformanceTable {
  Row: {
    id: string
    model_version: string
    model_type: string
    signal_id: string | null
    base_score: number | null // 0-100
    ai_confidence: number | null // 0.5-1.5 multiplier
    final_score: number | null // 0-100
    features: Json
    feature_importance: Json | null
    predicted_direction: PredictedDirection | null
    actual_outcome: Json | null
    outcome_recorded_at: string | null
    market_conditions: Json | null
    inference_time_ms: number | null
    created_at: string | null
  }
  Insert: {
    id?: string
    model_version: string
    model_type: string
    signal_id?: string | null
    base_score?: number | null
    ai_confidence?: number | null
    final_score?: number | null
    features: Json
    feature_importance?: Json | null
    predicted_direction?: PredictedDirection | null
    actual_outcome?: Json | null
    outcome_recorded_at?: string | null
    market_conditions?: Json | null
    inference_time_ms?: number | null
    created_at?: string | null
  }
  Update: {
    id?: string
    model_version?: string
    model_type?: string
    signal_id?: string | null
    base_score?: number | null
    ai_confidence?: number | null
    final_score?: number | null
    features?: Json
    feature_importance?: Json | null
    predicted_direction?: PredictedDirection | null
    actual_outcome?: Json | null
    outcome_recorded_at?: string | null
    market_conditions?: Json | null
    inference_time_ms?: number | null
    created_at?: string | null
  }
}

// ML Training Data Table
export interface MlTrainingDataTable {
  Row: {
    id: string
    symbol: string
    timestamp: string
    technical_features: Json
    sentiment_features: Json
    liquidity_features: Json
    market_features: Json
    price_change_1h: number | null
    price_change_4h: number | null
    price_change_1d: number | null
    max_gain: number | null
    max_loss: number | null
    data_quality_score: number | null
    is_training: boolean | null
    created_at: string | null
  }
  Insert: {
    id?: string
    symbol: string
    timestamp: string
    technical_features: Json
    sentiment_features: Json
    liquidity_features: Json
    market_features: Json
    price_change_1h?: number | null
    price_change_4h?: number | null
    price_change_1d?: number | null
    max_gain?: number | null
    max_loss?: number | null
    data_quality_score?: number | null
    is_training?: boolean | null
    created_at?: string | null
  }
  Update: {
    id?: string
    symbol?: string
    timestamp?: string
    technical_features?: Json
    sentiment_features?: Json
    liquidity_features?: Json
    market_features?: Json
    price_change_1h?: number | null
    price_change_4h?: number | null
    price_change_1d?: number | null
    max_gain?: number | null
    max_loss?: number | null
    data_quality_score?: number | null
    is_training?: boolean | null
    created_at?: string | null
  }
}

// ML Model Registry Table
export interface MlModelRegistryTable {
  Row: {
    id: string
    model_name: string
    model_version: string
    model_type: string
    model_path: string | null
    config: Json
    training_metrics: Json | null
    is_active: boolean | null
    deployed_at: string | null
    deployment_notes: string | null
    total_predictions: number | null
    successful_predictions: number | null
    average_confidence: number | null
    created_at: string | null
    updated_at: string | null
  }
  Insert: {
    id?: string
    model_name: string
    model_version: string
    model_type: string
    model_path?: string | null
    config: Json
    training_metrics?: Json | null
    is_active?: boolean | null
    deployed_at?: string | null
    deployment_notes?: string | null
    total_predictions?: number | null
    successful_predictions?: number | null
    average_confidence?: number | null
    created_at?: string | null
    updated_at?: string | null
  }
  Update: {
    id?: string
    model_name?: string
    model_version?: string
    model_type?: string
    model_path?: string | null
    config?: Json
    training_metrics?: Json | null
    is_active?: boolean | null
    deployed_at?: string | null
    deployment_notes?: string | null
    total_predictions?: number | null
    successful_predictions?: number | null
    average_confidence?: number | null
    created_at?: string | null
    updated_at?: string | null
  }
}

// ML A/B Tests Table
export interface MlAbTestsTable {
  Row: {
    id: string
    test_name: string
    model_a_id: string | null
    model_b_id: string | null
    traffic_split: number | null
    test_symbols: string[] | null
    model_a_predictions: number | null
    model_a_successes: number | null
    model_b_predictions: number | null
    model_b_successes: number | null
    p_value: number | null
    confidence_interval: Json | null
    status: ModelStatus | null
    started_at: string | null
    completed_at: string | null
    conclusion: string | null
  }
  Insert: {
    id?: string
    test_name: string
    model_a_id?: string | null
    model_b_id?: string | null
    traffic_split?: number | null
    test_symbols?: string[] | null
    model_a_predictions?: number | null
    model_a_successes?: number | null
    model_b_predictions?: number | null
    model_b_successes?: number | null
    p_value?: number | null
    confidence_interval?: Json | null
    status?: ModelStatus | null
    started_at?: string | null
    completed_at?: string | null
    conclusion?: string | null
  }
  Update: {
    id?: string
    test_name?: string
    model_a_id?: string | null
    model_b_id?: string | null
    traffic_split?: number | null
    test_symbols?: string[] | null
    model_a_predictions?: number | null
    model_a_successes?: number | null
    model_b_predictions?: number | null
    model_b_successes?: number | null
    p_value?: number | null
    confidence_interval?: Json | null
    status?: ModelStatus | null
    started_at?: string | null
    completed_at?: string | null
    conclusion?: string | null
  }
}

// Phase 1 Addition: Analytics History Table
export interface AnalyticsHistoryTable {
  Row: {
    id: string
    created_at: string | null
    period_end: string
    total_signals: number
    active_signals: number
    successful_signals: number
    failed_signals: number
    average_score: number | null
    average_return: number | null
    total_return: number | null
    success_rate: number | null
  }
  Insert: {
    id?: string
    created_at?: string | null
    period_end: string
    total_signals: number
    active_signals: number
    successful_signals: number
    failed_signals: number
    average_score?: number | null
    average_return?: number | null
    total_return?: number | null
    success_rate?: number | null
  }
  Update: {
    id?: string
    created_at?: string | null
    period_end?: string
    total_signals?: number
    active_signals?: number
    successful_signals?: number
    failed_signals?: number
    average_score?: number | null
    average_return?: number | null
    total_return?: number | null
    success_rate?: number | null
  }
}

// Phase 1 Addition: Activity Feed Table
export interface ActivityFeedTable {
  Row: {
    id: string
    created_at: string | null
    user_id: string | null
    type: ActivityType
    title: string
    description: string | null
    metadata: Json
    is_public: boolean | null
  }
  Insert: {
    id?: string
    created_at?: string | null
    user_id?: string | null
    type: ActivityType
    title: string
    description?: string | null
    metadata?: Json
    is_public?: boolean | null
  }
  Update: {
    id?: string
    created_at?: string | null
    user_id?: string | null
    type?: ActivityType
    title?: string
    description?: string | null
    metadata?: Json
    is_public?: boolean | null
  }
}

// ========================================
// DATABASE FUNCTIONS (RPC)
// ========================================

// Existing Functions
export interface CleanExpiredCacheFn {
  Args: Record<PropertyKey, never>
  Returns: undefined
}

export interface CleanExpiredSignalsFn {
  Args: Record<PropertyKey, never>
  Returns: undefined
}

export interface CleanOldQueueEntriesFn {
  Args: Record<PropertyKey, never>
  Returns: undefined
}

export interface CalculateModelSuccessRateFn {
  Args: { p_model_version: string }
  Returns: {
    total_predictions: number
    profitable_predictions: number
    success_rate: number
    avg_profit: number
    avg_loss: number
  }[]
}

// Phase 1 Missing Functions (CRITICAL - Need Implementation)
export interface ArrayAppendUniqueFn {
  Args: {
    target_array: string[]
    new_element: string
  }
  Returns: string[]
}

export interface ArrayRemoveFn {
  Args: {
    target_array: string[]
    element_to_remove: string
  }
  Returns: string[]
}

export interface GetSignalAnalyticsFn {
  Args: Record<PropertyKey, never>
  Returns: {
    total_signals: number
    active_signals: number
    successful_signals: number
    failed_signals: number
    average_score: number
    average_return: number
    total_return: number
    success_rate: number
  }[]
}

// Phase 1 Enhanced Functions
export interface GetSignalAnalyticsWithChangesFn {
  Args: Record<PropertyKey, never>
  Returns: {
    total_signals: number
    active_signals: number
    successful_signals: number
    failed_signals: number
    average_score: number
    average_return: number
    total_return: number
    success_rate: number
    change_active_signals: string
    change_success_rate: string
    change_total_return: string
    change_average_return: string
  }[]
}

export interface CaptureAnalyticsSnapshotFn {
  Args: Record<PropertyKey, never>
  Returns: undefined
}

export interface LogActivityFn {
  Args: {
    p_user_id: string | null
    p_type: ActivityType
    p_title: string
    p_description?: string | null
    p_metadata?: Json
    p_is_public?: boolean
  }
  Returns: string // UUID of created activity
}

// ========================================
// COMPLETE DATABASE TYPE
// ========================================

export interface Database {
  public: {
    Tables: {
      signals: SignalsTable
      indicator_cache: IndicatorCacheTable
      test_users: TestUsersTable
      market_scan_queue: MarketScanQueueTable
      market_scan_history: MarketScanHistoryTable
      ai_model_performance: AiModelPerformanceTable
      ml_training_data: MlTrainingDataTable
      ml_model_registry: MlModelRegistryTable
      ml_ab_tests: MlAbTestsTable
      // Phase 1 Additions
      analytics_history: AnalyticsHistoryTable
      activity_feed: ActivityFeedTable
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      // Existing Functions
      clean_expired_cache: CleanExpiredCacheFn
      clean_expired_signals: CleanExpiredSignalsFn
      clean_old_queue_entries: CleanOldQueueEntriesFn
      calculate_model_success_rate: CalculateModelSuccessRateFn
      
      // Phase 1 Critical Missing Functions
      array_append_unique: ArrayAppendUniqueFn
      array_remove: ArrayRemoveFn
      get_signal_analytics: GetSignalAnalyticsFn
      
      // Phase 1 Enhanced Functions
      get_signal_analytics_with_changes: GetSignalAnalyticsWithChangesFn
      capture_analytics_snapshot: CaptureAnalyticsSnapshotFn
      log_activity: LogActivityFn
    }
    Enums: {
      market_type: MarketType
      signal_strength: SignalStrength
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ========================================
// CONVENIENCE TYPE EXPORTS
// ========================================

// Table Row Types
export type SignalRow = Database['public']['Tables']['signals']['Row']
export type IndicatorCacheRow = Database['public']['Tables']['indicator_cache']['Row']
export type TestUserRow = Database['public']['Tables']['test_users']['Row']
export type MarketScanQueueRow = Database['public']['Tables']['market_scan_queue']['Row']
export type MarketScanHistoryRow = Database['public']['Tables']['market_scan_history']['Row']
export type AiModelPerformanceRow = Database['public']['Tables']['ai_model_performance']['Row']
export type MlTrainingDataRow = Database['public']['Tables']['ml_training_data']['Row']
export type MlModelRegistryRow = Database['public']['Tables']['ml_model_registry']['Row']
export type MlAbTestsRow = Database['public']['Tables']['ml_ab_tests']['Row']
export type AnalyticsHistoryRow = Database['public']['Tables']['analytics_history']['Row']
export type ActivityFeedRow = Database['public']['Tables']['activity_feed']['Row']

// Insert Types
export type SignalInsert = Database['public']['Tables']['signals']['Insert']
export type IndicatorCacheInsert = Database['public']['Tables']['indicator_cache']['Insert']
export type TestUserInsert = Database['public']['Tables']['test_users']['Insert']
export type MarketScanQueueInsert = Database['public']['Tables']['market_scan_queue']['Insert']
export type MarketScanHistoryInsert = Database['public']['Tables']['market_scan_history']['Insert']
export type AiModelPerformanceInsert = Database['public']['Tables']['ai_model_performance']['Insert']
export type MlTrainingDataInsert = Database['public']['Tables']['ml_training_data']['Insert']
export type MlModelRegistryInsert = Database['public']['Tables']['ml_model_registry']['Insert']
export type MlAbTestsInsert = Database['public']['Tables']['ml_ab_tests']['Insert']
export type AnalyticsHistoryInsert = Database['public']['Tables']['analytics_history']['Insert']
export type ActivityFeedInsert = Database['public']['Tables']['activity_feed']['Insert']

// Update Types
export type SignalUpdate = Database['public']['Tables']['signals']['Update']
export type IndicatorCacheUpdate = Database['public']['Tables']['indicator_cache']['Update']
export type TestUserUpdate = Database['public']['Tables']['test_users']['Update']
export type MarketScanQueueUpdate = Database['public']['Tables']['market_scan_queue']['Update']
export type MarketScanHistoryUpdate = Database['public']['Tables']['market_scan_history']['Update']
export type AiModelPerformanceUpdate = Database['public']['Tables']['ai_model_performance']['Update']
export type MlTrainingDataUpdate = Database['public']['Tables']['ml_training_data']['Update']
export type MlModelRegistryUpdate = Database['public']['Tables']['ml_model_registry']['Update']
export type MlAbTestsUpdate = Database['public']['Tables']['ml_ab_tests']['Update']
export type AnalyticsHistoryUpdate = Database['public']['Tables']['analytics_history']['Update']
export type ActivityFeedUpdate = Database['public']['Tables']['activity_feed']['Update']

// ========================================
// APPLICATION-LEVEL INTERFACES
// ========================================

// Signal Analytics Response (from get_signal_analytics)
export interface SignalAnalytics {
  total_signals: number
  active_signals: number
  successful_signals: number
  failed_signals: number
  average_score: number
  average_return: number
  total_return: number
  success_rate: number
}

// Signal Analytics with Changes (from get_signal_analytics_with_changes)
export interface SignalAnalyticsWithChanges extends SignalAnalytics {
  change_active_signals: string
  change_success_rate: string
  change_total_return: string
  change_average_return: string
}

// Activity Feed Item
export interface ActivityItem {
  id: string
  created_at: string
  user_id: string | null
  type: ActivityType
  title: string
  description: string | null
  metadata: Record<string, any>
  is_public: boolean
}

// Model Performance Metrics
export interface ModelPerformanceMetrics {
  total_predictions: number
  profitable_predictions: number
  success_rate: number
  avg_profit: number
  avg_loss: number
}

// ========================================
// TYPE GUARDS
// ========================================

export const isSignalRow = (data: any): data is SignalRow => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.symbol === 'string' &&
    typeof data.convergence_score === 'number' &&
    ['stocks_us', 'crypto', 'forex'].includes(data.market) &&
    ['WEAK', 'MODERATE', 'STRONG', 'VERY_STRONG'].includes(data.signal_strength)
  )
}

export const isActivityItem = (data: any): data is ActivityItem => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.type === 'string' &&
    ['signal', 'update', 'scan', 'success', 'error'].includes(data.type) &&
    typeof data.title === 'string'
  )
}

// ========================================
// CONSTANTS
// ========================================

export const DB_CONSTANTS = {
  ENUMS: {
    MARKET_TYPES: ['stocks_us', 'crypto', 'forex'] as const,
    SIGNAL_STRENGTHS: ['WEAK', 'MODERATE', 'STRONG', 'VERY_STRONG'] as const,
    ACTIVITY_TYPES: ['signal', 'update', 'scan', 'success', 'error'] as const,
    MODEL_STATUSES: ['active', 'completed', 'aborted'] as const,
    PREDICTED_DIRECTIONS: ['up', 'down', 'neutral'] as const,
  },
  CONSTRAINTS: {
    SCORE_MIN: 0,
    SCORE_MAX: 100,
    PRIORITY_MIN: 0,
    PRIORITY_MAX: 100,
    CONFIDENCE_MIN: 0.5,
    CONFIDENCE_MAX: 1.5,
  },
  DEFAULTS: {
    TIMEFRAME: '1D',
    CACHE_DURATION_HOURS: 1,
    SIGNAL_DURATION_HOURS: 24,
    QUEUE_PRIORITY: 50,
    DATA_QUALITY_SCORE: 100,
    TRAFFIC_SPLIT: 0.5,
  },
} as const

export default Database