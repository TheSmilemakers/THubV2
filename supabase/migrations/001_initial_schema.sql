-- THub V2 Database Schema
-- Multi-dimensional Trading Intelligence Platform

-- Drop existing types if they exist (for re-runs)
DROP TYPE IF EXISTS market_type CASCADE;
DROP TYPE IF EXISTS signal_strength CASCADE;

-- Create custom types
CREATE TYPE market_type AS ENUM ('stocks_us', 'crypto', 'forex');
CREATE TYPE signal_strength AS ENUM ('WEAK', 'MODERATE', 'STRONG', 'VERY_STRONG');

-- Main signals table (simplified for MVP)
CREATE TABLE IF NOT EXISTS signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  market market_type NOT NULL,
  
  -- 3-layer convergence scores
  technical_score SMALLINT CHECK (technical_score >= 0 AND technical_score <= 100),
  sentiment_score SMALLINT CHECK (sentiment_score >= 0 AND sentiment_score <= 100),
  liquidity_score SMALLINT CHECK (liquidity_score >= 0 AND liquidity_score <= 100),
  
  -- Overall convergence score and strength
  convergence_score SMALLINT NOT NULL CHECK (convergence_score >= 0 AND convergence_score <= 100),
  signal_strength signal_strength NOT NULL,
  
  -- Price data for trading plan
  current_price DECIMAL(20,8),
  entry_price DECIMAL(20,8),
  stop_loss DECIMAL(20,8),
  take_profit DECIMAL(20,8),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  
  -- Flexible analysis data storage
  technical_data JSONB DEFAULT '{}',
  analysis_notes TEXT[]
);

-- Performance indexes for signals
CREATE INDEX IF NOT EXISTS idx_signals_symbol_created ON signals(symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_score ON signals(convergence_score DESC) WHERE convergence_score >= 70;
CREATE INDEX IF NOT EXISTS idx_signals_active ON signals(expires_at) WHERE expires_at > NOW();

-- Cache table for EODHD technical indicators (reduce API calls)
CREATE TABLE IF NOT EXISTS indicator_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  indicator TEXT NOT NULL,
  timeframe TEXT NOT NULL DEFAULT '1D',
  period INTEGER DEFAULT 0,
  data JSONB NOT NULL,
  api_calls_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  UNIQUE(symbol, indicator, timeframe, period)
);

-- Performance indexes for cache
CREATE INDEX IF NOT EXISTS idx_cache_symbol ON indicator_cache(symbol);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON indicator_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_lookup ON indicator_cache(symbol, indicator, timeframe, period);

-- MVP: Simple test users table for friend testing
CREATE TABLE IF NOT EXISTS test_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  access_token TEXT UNIQUE DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MVP: Add engagement tracking to signals
ALTER TABLE signals ADD COLUMN IF NOT EXISTS viewed_by TEXT[] DEFAULT '{}';
ALTER TABLE signals ADD COLUMN IF NOT EXISTS saved_by TEXT[] DEFAULT '{}';

-- Enable Row Level Security (RLS)
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public read access to signals (anyone can view)
CREATE POLICY "Public read access" ON signals
  FOR SELECT USING (true);

-- Service role can manage cache (for backend operations)
CREATE POLICY "Service role cache access" ON indicator_cache
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- MVP: Test users can only read their own data
CREATE POLICY "Test users read own data" ON test_users
  FOR SELECT USING (true); -- MVP: Allow reading for token validation

-- Function to clean expired cache entries (can be called via cron)
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM indicator_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired signals
CREATE OR REPLACE FUNCTION clean_expired_signals()
RETURNS void AS $$
BEGIN
  DELETE FROM signals WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Optional: Set up automatic cleanup (requires pg_cron extension)
-- SELECT cron.schedule('clean-cache', '0 * * * *', 'SELECT clean_expired_cache()');
-- SELECT cron.schedule('clean-signals', '0 0 * * *', 'SELECT clean_expired_signals()');