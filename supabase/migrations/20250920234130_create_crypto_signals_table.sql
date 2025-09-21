-- Create crypto_signals table for storing cryptocurrency analysis from n8n workflow
CREATE TABLE IF NOT EXISTS public.crypto_signals (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic Information (from n8n workflow)
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  current_price DECIMAL(20,8) NOT NULL,
  market_cap BIGINT,
  volume_24h BIGINT,
  
  -- Price Changes
  price_change_1h DECIMAL(10,2),
  price_change_24h DECIMAL(10,2),
  price_change_7d DECIMAL(10,2),
  price_change_30d DECIMAL(10,2),
  
  -- Technical Metrics
  volume_to_market_cap_ratio DECIMAL(10,4),
  volatility_score DECIMAL(5,2),
  support_level DECIMAL(20,8),
  resistance_level DECIMAL(20,8),
  current_position DECIMAL(5,2),
  
  -- Historical Comparison
  ath_change_percentage DECIMAL(10,2),
  atl_change_percentage DECIMAL(10,2),
  
  -- Scoring Components (aligned with existing signals table)
  technical_score SMALLINT CHECK (technical_score >= 0 AND technical_score <= 100),
  momentum_score SMALLINT CHECK (momentum_score >= 0 AND momentum_score <= 100),
  volume_score SMALLINT CHECK (volume_score >= 0 AND volume_score <= 100),
  sentiment_alignment_score SMALLINT CHECK (sentiment_alignment_score >= 0 AND sentiment_alignment_score <= 100),
  overall_score SMALLINT CHECK (overall_score >= 0 AND overall_score <= 100),
  
  -- Signal Analysis
  signals TEXT[],
  recommendation TEXT NOT NULL CHECK (recommendation IN ('STRONG BUY', 'BUY', 'HOLD', 'WAIT')),
  
  -- Advanced Indicators
  rsi DECIMAL(5,2) CHECK (rsi >= 0 AND rsi <= 100),
  rsi_signal TEXT CHECK (rsi_signal IN ('OVERSOLD', 'NEUTRAL', 'OVERBOUGHT')),
  whale_activity JSONB,
  
  -- Sentiment Data
  market_sentiment TEXT,
  sentiment_score SMALLINT CHECK (sentiment_score >= 0 AND sentiment_score <= 100),
  fear_greed_value INTEGER,
  fear_greed_classification TEXT,
  
  -- Risk Management
  risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  suggested_entry_price DECIMAL(20,8),
  suggested_stop_loss DECIMAL(20,8),
  suggested_take_profit DECIMAL(20,8),
  
  -- Final Score (for main integration)
  final_score SMALLINT NOT NULL CHECK (final_score >= 0 AND final_score <= 100),
  
  -- Metadata
  source TEXT DEFAULT 'n8n-crypto-bot',
  workflow_version TEXT DEFAULT '2.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Create indexes for performance
CREATE INDEX idx_crypto_signals_symbol ON crypto_signals(symbol);
CREATE INDEX idx_crypto_signals_final_score ON crypto_signals(final_score DESC);
CREATE INDEX idx_crypto_signals_created_at ON crypto_signals(created_at DESC);
CREATE INDEX idx_crypto_signals_recommendation ON crypto_signals(recommendation);
CREATE INDEX idx_crypto_signals_expires_at ON crypto_signals(expires_at);
CREATE INDEX idx_crypto_signals_market_cap ON crypto_signals(market_cap DESC) WHERE market_cap IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE crypto_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "crypto_signals_read_all" ON crypto_signals
  FOR SELECT USING (true);

CREATE POLICY "crypto_signals_insert_webhook" ON crypto_signals
  FOR INSERT WITH CHECK (true); -- Will be secured at API level with webhook secret

-- Add comment to table
COMMENT ON TABLE crypto_signals IS 'Stores cryptocurrency trading signals from n8n bot with technical analysis, sentiment, and risk data';

-- Add column comments for clarity
COMMENT ON COLUMN crypto_signals.symbol IS 'Cryptocurrency symbol (e.g., BTC, ETH)';
COMMENT ON COLUMN crypto_signals.current_position IS 'Percentage position between 24h support and resistance (0-100)';
COMMENT ON COLUMN crypto_signals.sentiment_alignment_score IS 'How well current price action aligns with market sentiment';
COMMENT ON COLUMN crypto_signals.whale_activity IS 'JSON object with score and level of whale trading activity';
COMMENT ON COLUMN crypto_signals.fear_greed_value IS 'Fear & Greed Index value (0-100)';
COMMENT ON COLUMN crypto_signals.final_score IS 'Weighted combination of all scoring factors';

-- Function to sync high-scoring crypto signals to main signals table
CREATE OR REPLACE FUNCTION sync_crypto_to_main_signals()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync signals with final_score >= 70 (convergence threshold)
  IF NEW.final_score >= 70 THEN
    INSERT INTO public.signals (
      symbol,
      market,
      technical_score,
      sentiment_score,
      liquidity_score,
      convergence_score,
      signal_strength,
      current_price,
      entry_price,
      stop_loss,
      take_profit,
      technical_data,
      analysis_notes,
      created_at,
      expires_at
    ) VALUES (
      NEW.symbol,
      'crypto'::market_type,
      NEW.technical_score,
      NEW.sentiment_alignment_score, -- Use sentiment alignment as sentiment score
      NEW.volume_score, -- Use volume score as liquidity score
      NEW.final_score, -- Use final score as convergence score
      CASE 
        WHEN NEW.final_score >= 85 THEN 'VERY_STRONG'::signal_strength
        WHEN NEW.final_score >= 75 THEN 'STRONG'::signal_strength
        ELSE 'MODERATE'::signal_strength
      END,
      NEW.current_price,
      NEW.suggested_entry_price,
      NEW.suggested_stop_loss,
      NEW.suggested_take_profit,
      jsonb_build_object(
        'rsi', NEW.rsi,
        'rsi_signal', NEW.rsi_signal,
        'support', NEW.support_level,
        'resistance', NEW.resistance_level,
        'position', NEW.current_position,
        'volatility', NEW.volatility_score,
        'whale_activity', NEW.whale_activity,
        'fear_greed', jsonb_build_object(
          'value', NEW.fear_greed_value,
          'classification', NEW.fear_greed_classification
        ),
        'price_changes', jsonb_build_object(
          '1h', NEW.price_change_1h,
          '24h', NEW.price_change_24h,
          '7d', NEW.price_change_7d,
          '30d', NEW.price_change_30d
        ),
        'market_cap', NEW.market_cap,
        'volume_24h', NEW.volume_24h,
        'ath_change', NEW.ath_change_percentage,
        'atl_change', NEW.atl_change_percentage
      ),
      NEW.signals,
      NEW.created_at,
      NEW.expires_at
    );
    -- Note: We don't use ON CONFLICT because the main signals table
    -- doesn't have a unique constraint on (symbol, created_at)
    -- Each crypto signal creates a new entry in the main signals table
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync crypto signals
CREATE TRIGGER sync_crypto_signals_to_main
  AFTER INSERT ON crypto_signals
  FOR EACH ROW
  EXECUTE FUNCTION sync_crypto_to_main_signals();

-- Grant permissions for the webhook user (if using service role key)
-- This is handled automatically by RLS policies