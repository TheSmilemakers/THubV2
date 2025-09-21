export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_model_performance: {
        Row: {
          actual_outcome: Json | null
          ai_confidence: number | null
          base_score: number | null
          created_at: string | null
          feature_importance: Json | null
          features: Json
          final_score: number | null
          id: string
          inference_time_ms: number | null
          market_conditions: Json | null
          model_type: string
          model_version: string
          outcome_recorded_at: string | null
          predicted_direction: string | null
          signal_id: string | null
        }
        Insert: {
          actual_outcome?: Json | null
          ai_confidence?: number | null
          base_score?: number | null
          created_at?: string | null
          feature_importance?: Json | null
          features: Json
          final_score?: number | null
          id?: string
          inference_time_ms?: number | null
          market_conditions?: Json | null
          model_type: string
          model_version: string
          outcome_recorded_at?: string | null
          predicted_direction?: string | null
          signal_id?: string | null
        }
        Update: {
          actual_outcome?: Json | null
          ai_confidence?: number | null
          base_score?: number | null
          created_at?: string | null
          feature_importance?: Json | null
          features?: Json
          final_score?: number | null
          id?: string
          inference_time_ms?: number | null
          market_conditions?: Json | null
          model_type?: string
          model_version?: string
          outcome_recorded_at?: string | null
          predicted_direction?: string | null
          signal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_model_performance_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_signals: {
        Row: {
          ath_change_percentage: number | null
          atl_change_percentage: number | null
          created_at: string | null
          current_position: number | null
          current_price: number
          expires_at: string | null
          fear_greed_classification: string | null
          fear_greed_value: number | null
          final_score: number
          id: string
          market_cap: number | null
          market_sentiment: string | null
          momentum_score: number | null
          name: string
          overall_score: number | null
          price_change_1h: number | null
          price_change_24h: number | null
          price_change_30d: number | null
          price_change_7d: number | null
          recommendation: string
          resistance_level: number | null
          risk_level: string | null
          rsi: number | null
          rsi_signal: string | null
          sentiment_alignment_score: number | null
          sentiment_score: number | null
          signals: string[] | null
          source: string | null
          suggested_entry_price: number | null
          suggested_stop_loss: number | null
          suggested_take_profit: number | null
          support_level: number | null
          symbol: string
          technical_score: number | null
          volatility_score: number | null
          volume_24h: number | null
          volume_score: number | null
          volume_to_market_cap_ratio: number | null
          whale_activity: Json | null
          workflow_version: string | null
        }
        Insert: {
          ath_change_percentage?: number | null
          atl_change_percentage?: number | null
          created_at?: string | null
          current_position?: number | null
          current_price: number
          expires_at?: string | null
          fear_greed_classification?: string | null
          fear_greed_value?: number | null
          final_score: number
          id?: string
          market_cap?: number | null
          market_sentiment?: string | null
          momentum_score?: number | null
          name: string
          overall_score?: number | null
          price_change_1h?: number | null
          price_change_24h?: number | null
          price_change_30d?: number | null
          price_change_7d?: number | null
          recommendation: string
          resistance_level?: number | null
          risk_level?: string | null
          rsi?: number | null
          rsi_signal?: string | null
          sentiment_alignment_score?: number | null
          sentiment_score?: number | null
          signals?: string[] | null
          source?: string | null
          suggested_entry_price?: number | null
          suggested_stop_loss?: number | null
          suggested_take_profit?: number | null
          support_level?: number | null
          symbol: string
          technical_score?: number | null
          volatility_score?: number | null
          volume_24h?: number | null
          volume_score?: number | null
          volume_to_market_cap_ratio?: number | null
          whale_activity?: Json | null
          workflow_version?: string | null
        }
        Update: {
          ath_change_percentage?: number | null
          atl_change_percentage?: number | null
          created_at?: string | null
          current_position?: number | null
          current_price?: number
          expires_at?: string | null
          fear_greed_classification?: string | null
          fear_greed_value?: number | null
          final_score?: number
          id?: string
          market_cap?: number | null
          market_sentiment?: string | null
          momentum_score?: number | null
          name?: string
          overall_score?: number | null
          price_change_1h?: number | null
          price_change_24h?: number | null
          price_change_30d?: number | null
          price_change_7d?: number | null
          recommendation?: string
          resistance_level?: number | null
          risk_level?: string | null
          rsi?: number | null
          rsi_signal?: string | null
          sentiment_alignment_score?: number | null
          sentiment_score?: number | null
          signals?: string[] | null
          source?: string | null
          suggested_entry_price?: number | null
          suggested_stop_loss?: number | null
          suggested_take_profit?: number | null
          support_level?: number | null
          symbol?: string
          technical_score?: number | null
          volatility_score?: number | null
          volume_24h?: number | null
          volume_score?: number | null
          volume_to_market_cap_ratio?: number | null
          whale_activity?: Json | null
          workflow_version?: string | null
        }
        Relationships: []
      }
      indicator_cache: {
        Row: {
          api_calls_used: number | null
          created_at: string | null
          data: Json
          expires_at: string | null
          id: string
          indicator: string
          period: number | null
          symbol: string
          timeframe: string
        }
        Insert: {
          api_calls_used?: number | null
          created_at?: string | null
          data: Json
          expires_at?: string | null
          id?: string
          indicator: string
          period?: number | null
          symbol: string
          timeframe?: string
        }
        Update: {
          api_calls_used?: number | null
          created_at?: string | null
          data?: Json
          expires_at?: string | null
          id?: string
          indicator?: string
          period?: number | null
          symbol?: string
          timeframe?: string
        }
        Relationships: []
      }
      market_scan_history: {
        Row: {
          api_calls_used: number | null
          candidates_found: number
          created_at: string | null
          filtered_symbols: number
          filters_used: Json
          id: string
          scan_duration_ms: number | null
          scan_id: string
          signals_generated: number | null
          total_symbols: number
        }
        Insert: {
          api_calls_used?: number | null
          candidates_found: number
          created_at?: string | null
          filtered_symbols: number
          filters_used: Json
          id?: string
          scan_duration_ms?: number | null
          scan_id: string
          signals_generated?: number | null
          total_symbols: number
        }
        Update: {
          api_calls_used?: number | null
          candidates_found?: number
          created_at?: string | null
          filtered_symbols?: number
          filters_used?: Json
          id?: string
          scan_duration_ms?: number | null
          scan_id?: string
          signals_generated?: number | null
          total_symbols?: number
        }
        Relationships: []
      }
      market_scan_queue: {
        Row: {
          analysis_result: Json | null
          created_at: string | null
          filters_matched: Json | null
          id: string
          opportunity_score: number | null
          priority: number | null
          processed: boolean | null
          processed_at: string | null
          scan_reason: string | null
          scan_timestamp: string | null
          symbol: string
        }
        Insert: {
          analysis_result?: Json | null
          created_at?: string | null
          filters_matched?: Json | null
          id?: string
          opportunity_score?: number | null
          priority?: number | null
          processed?: boolean | null
          processed_at?: string | null
          scan_reason?: string | null
          scan_timestamp?: string | null
          symbol: string
        }
        Update: {
          analysis_result?: Json | null
          created_at?: string | null
          filters_matched?: Json | null
          id?: string
          opportunity_score?: number | null
          priority?: number | null
          processed?: boolean | null
          processed_at?: string | null
          scan_reason?: string | null
          scan_timestamp?: string | null
          symbol?: string
        }
        Relationships: []
      }
      ml_ab_tests: {
        Row: {
          completed_at: string | null
          conclusion: string | null
          confidence_interval: Json | null
          id: string
          model_a_id: string | null
          model_a_predictions: number | null
          model_a_successes: number | null
          model_b_id: string | null
          model_b_predictions: number | null
          model_b_successes: number | null
          p_value: number | null
          started_at: string | null
          status: string | null
          test_name: string
          test_symbols: string[] | null
          traffic_split: number | null
        }
        Insert: {
          completed_at?: string | null
          conclusion?: string | null
          confidence_interval?: Json | null
          id?: string
          model_a_id?: string | null
          model_a_predictions?: number | null
          model_a_successes?: number | null
          model_b_id?: string | null
          model_b_predictions?: number | null
          model_b_successes?: number | null
          p_value?: number | null
          started_at?: string | null
          status?: string | null
          test_name: string
          test_symbols?: string[] | null
          traffic_split?: number | null
        }
        Update: {
          completed_at?: string | null
          conclusion?: string | null
          confidence_interval?: Json | null
          id?: string
          model_a_id?: string | null
          model_a_predictions?: number | null
          model_a_successes?: number | null
          model_b_id?: string | null
          model_b_predictions?: number | null
          model_b_successes?: number | null
          p_value?: number | null
          started_at?: string | null
          status?: string | null
          test_name?: string
          test_symbols?: string[] | null
          traffic_split?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_ab_tests_model_a_id_fkey"
            columns: ["model_a_id"]
            isOneToOne: false
            referencedRelation: "ml_model_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_ab_tests_model_b_id_fkey"
            columns: ["model_b_id"]
            isOneToOne: false
            referencedRelation: "ml_model_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_model_registry: {
        Row: {
          average_confidence: number | null
          config: Json
          created_at: string | null
          deployed_at: string | null
          deployment_notes: string | null
          id: string
          is_active: boolean | null
          model_name: string
          model_path: string | null
          model_type: string
          model_version: string
          successful_predictions: number | null
          total_predictions: number | null
          training_metrics: Json | null
          updated_at: string | null
        }
        Insert: {
          average_confidence?: number | null
          config: Json
          created_at?: string | null
          deployed_at?: string | null
          deployment_notes?: string | null
          id?: string
          is_active?: boolean | null
          model_name: string
          model_path?: string | null
          model_type: string
          model_version: string
          successful_predictions?: number | null
          total_predictions?: number | null
          training_metrics?: Json | null
          updated_at?: string | null
        }
        Update: {
          average_confidence?: number | null
          config?: Json
          created_at?: string | null
          deployed_at?: string | null
          deployment_notes?: string | null
          id?: string
          is_active?: boolean | null
          model_name?: string
          model_path?: string | null
          model_type?: string
          model_version?: string
          successful_predictions?: number | null
          total_predictions?: number | null
          training_metrics?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ml_training_data: {
        Row: {
          created_at: string | null
          data_quality_score: number | null
          id: string
          is_training: boolean | null
          liquidity_features: Json
          market_features: Json
          max_gain: number | null
          max_loss: number | null
          price_change_1d: number | null
          price_change_1h: number | null
          price_change_4h: number | null
          sentiment_features: Json
          symbol: string
          technical_features: Json
          timestamp: string
        }
        Insert: {
          created_at?: string | null
          data_quality_score?: number | null
          id?: string
          is_training?: boolean | null
          liquidity_features: Json
          market_features: Json
          max_gain?: number | null
          max_loss?: number | null
          price_change_1d?: number | null
          price_change_1h?: number | null
          price_change_4h?: number | null
          sentiment_features: Json
          symbol: string
          technical_features: Json
          timestamp: string
        }
        Update: {
          created_at?: string | null
          data_quality_score?: number | null
          id?: string
          is_training?: boolean | null
          liquidity_features?: Json
          market_features?: Json
          max_gain?: number | null
          max_loss?: number | null
          price_change_1d?: number | null
          price_change_1h?: number | null
          price_change_4h?: number | null
          sentiment_features?: Json
          symbol?: string
          technical_features?: Json
          timestamp?: string
        }
        Relationships: []
      }
      pra_assessments: {
        Row: {
          assessment_type: string | null
          clinician_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          patient_id: string | null
          status: string | null
        }
        Insert: {
          assessment_type?: string | null
          clinician_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          status?: string | null
        }
        Update: {
          assessment_type?: string | null
          clinician_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pra_assessments_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "pra_clinicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pra_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "pra_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      pra_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      pra_clinicians: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          role: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          role?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pra_clinicians_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "pra_clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      pra_clinics: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      pra_exercise_prescriptions: {
        Row: {
          assessment_id: string | null
          created_at: string | null
          exercises: Json
          id: string
          prescribed_by: string | null
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string | null
          exercises: Json
          id?: string
          prescribed_by?: string | null
        }
        Update: {
          assessment_id?: string | null
          created_at?: string | null
          exercises?: Json
          id?: string
          prescribed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pra_exercise_prescriptions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "pra_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pra_exercise_prescriptions_prescribed_by_fkey"
            columns: ["prescribed_by"]
            isOneToOne: false
            referencedRelation: "pra_clinicians"
            referencedColumns: ["id"]
          },
        ]
      }
      pra_measurements: {
        Row: {
          assessment_id: string | null
          confidence: number | null
          created_at: string | null
          id: string
          measurement_type: string
          unit: string
          value: number
          view_type: string | null
        }
        Insert: {
          assessment_id?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          measurement_type: string
          unit: string
          value: number
          view_type?: string | null
        }
        Update: {
          assessment_id?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          measurement_type?: string
          unit?: string
          value?: number
          view_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pra_measurements_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "pra_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      pra_patients: {
        Row: {
          clinic_id: string | null
          complaints: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          email: string | null
          id: string
          name: string
          patient_code: string | null
          phone: string | null
        }
        Insert: {
          clinic_id?: string | null
          complaints?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          id?: string
          name: string
          patient_code?: string | null
          phone?: string | null
        }
        Update: {
          clinic_id?: string | null
          complaints?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          id?: string
          name?: string
          patient_code?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pra_patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "pra_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pra_patients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "pra_clinicians"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_tracking: {
        Row: {
          action: string
          count: number
          first_request_at: string
          identifier: string
          last_request_at: string
          metadata: Json | null
          window_start: string
        }
        Insert: {
          action: string
          count?: number
          first_request_at?: string
          identifier: string
          last_request_at?: string
          metadata?: Json | null
          window_start: string
        }
        Update: {
          action?: string
          count?: number
          first_request_at?: string
          identifier?: string
          last_request_at?: string
          metadata?: Json | null
          window_start?: string
        }
        Relationships: []
      }
      signals: {
        Row: {
          analysis_notes: string[] | null
          convergence_score: number
          created_at: string | null
          current_price: number | null
          entry_price: number | null
          expires_at: string | null
          id: string
          liquidity_score: number | null
          market: Database["public"]["Enums"]["market_type"]
          saved_by: string[] | null
          sentiment_score: number | null
          signal_strength: Database["public"]["Enums"]["signal_strength"]
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          technical_data: Json | null
          technical_score: number | null
          viewed_by: string[] | null
        }
        Insert: {
          analysis_notes?: string[] | null
          convergence_score: number
          created_at?: string | null
          current_price?: number | null
          entry_price?: number | null
          expires_at?: string | null
          id?: string
          liquidity_score?: number | null
          market: Database["public"]["Enums"]["market_type"]
          saved_by?: string[] | null
          sentiment_score?: number | null
          signal_strength: Database["public"]["Enums"]["signal_strength"]
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          technical_data?: Json | null
          technical_score?: number | null
          viewed_by?: string[] | null
        }
        Update: {
          analysis_notes?: string[] | null
          convergence_score?: number
          created_at?: string | null
          current_price?: number | null
          entry_price?: number | null
          expires_at?: string | null
          id?: string
          liquidity_score?: number | null
          market?: Database["public"]["Enums"]["market_type"]
          saved_by?: string[] | null
          sentiment_score?: number | null
          signal_strength?: Database["public"]["Enums"]["signal_strength"]
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          technical_data?: Json | null
          technical_score?: number | null
          viewed_by?: string[] | null
        }
        Relationships: []
      }
      test_users: {
        Row: {
          access_token: string | null
          created_at: string | null
          email: string
          id: string
          name: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          id: string
          settings: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          settings?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          settings?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      array_append_unique: {
        Args: { new_element: string; target_array: string[] }
        Returns: string[]
      }
      array_remove_element: {
        Args: { element_to_remove: string; target_array: string[] }
        Returns: string[]
      }
      calculate_model_success_rate: {
        Args: { p_model_version: string }
        Returns: {
          avg_loss: number
          avg_profit: number
          profitable_predictions: number
          success_rate: number
          total_predictions: number
        }[]
      }
      clean_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clean_expired_signals: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clean_old_queue_entries: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_user: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_signal_analytics: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_signals: number
          average_score: number
          daily_signals: number
          hourly_signals: number
          performance_data: Json
          signals_by_timeframe: Json
          success_rate: number
          total_signals: number
        }[]
      }
      get_user_id_from_token: {
        Args: { token_value: string }
        Returns: string
      }
      increment_rate_limit: {
        Args: {
          p_action: string
          p_identifier: string
          p_metadata?: Json
          p_window_start: string
        }
        Returns: {
          current_count: number
        }[]
      }
      pra_clean_test_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      pra_create_test_patient_with_complaints: {
        Args: { patient_complaints?: string; patient_name?: string }
        Returns: string
      }
      set_current_token: {
        Args: { token_value: string }
        Returns: undefined
      }
      sync_crypto_to_main_signals: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_token_and_get_user: {
        Args: { token_value: string }
        Returns: {
          authenticated: boolean
          email: string
          error: string
          id: string
          name: string
        }[]
      }
    }
    Enums: {
      market_type: "stocks_us" | "crypto" | "forex"
      signal_strength: "WEAK" | "MODERATE" | "STRONG" | "VERY_STRONG"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      market_type: ["stocks_us", "crypto", "forex"],
      signal_strength: ["WEAK", "MODERATE", "STRONG", "VERY_STRONG"],
    },
  },
} as const