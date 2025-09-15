export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clean_expired_signals: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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