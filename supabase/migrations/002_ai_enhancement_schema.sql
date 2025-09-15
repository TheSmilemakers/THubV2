-- THub V2 AI Enhancement Schema
-- Tables for market scanning and ML model performance tracking

-- Market scan queue for discovered opportunities
CREATE TABLE IF NOT EXISTS market_scan_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  scan_timestamp TIMESTAMPTZ DEFAULT NOW(),
  scan_reason TEXT, -- 'volume_spike', 'momentum', 'technical_breakout', etc.
  opportunity_score INTEGER CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
  filters_matched JSONB DEFAULT '{}', -- Which filters the symbol passed
  priority INTEGER DEFAULT 50 CHECK (priority >= 0 AND priority <= 100),
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  analysis_result JSONB, -- Store analysis outcome
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, scan_timestamp) -- Prevent duplicate entries in same scan
);

-- Indexes for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_queue_unprocessed ON market_scan_queue(processed, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_queue_symbol ON market_scan_queue(symbol, created_at DESC);

-- Market scan history for tracking what was scanned
CREATE TABLE IF NOT EXISTS market_scan_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID NOT NULL, -- Groups all symbols from one scan
  total_symbols INTEGER NOT NULL,
  filtered_symbols INTEGER NOT NULL,
  candidates_found INTEGER NOT NULL,
  signals_generated INTEGER DEFAULT 0,
  scan_duration_ms INTEGER,
  filters_used JSONB NOT NULL,
  api_calls_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for historical analysis
CREATE INDEX IF NOT EXISTS idx_scan_history_date ON market_scan_history(created_at DESC);

-- AI model performance tracking
CREATE TABLE IF NOT EXISTS ai_model_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_version TEXT NOT NULL,
  model_type TEXT NOT NULL, -- 'random_forest', 'xgboost', 'lstm', etc.
  signal_id UUID REFERENCES signals(id) ON DELETE CASCADE,
  
  -- Predictions
  base_score INTEGER CHECK (base_score >= 0 AND base_score <= 100),
  ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 2), -- 0.5 to 1.5 multiplier
  final_score INTEGER CHECK (final_score >= 0 AND final_score <= 100),
  
  -- Features used
  features JSONB NOT NULL, -- All features at prediction time
  feature_importance JSONB, -- Which features contributed most
  
  -- Outcome tracking
  predicted_direction TEXT CHECK (predicted_direction IN ('up', 'down', 'neutral')),
  actual_outcome JSONB, -- Entry, exit, profit/loss, hold time
  outcome_recorded_at TIMESTAMPTZ,
  
  -- Metadata
  market_conditions JSONB, -- VIX, market breadth, etc. at prediction time
  inference_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for model analysis
CREATE INDEX IF NOT EXISTS idx_model_performance_version ON ai_model_performance(model_version, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_performance_signal ON ai_model_performance(signal_id);
CREATE INDEX IF NOT EXISTS idx_model_performance_outcome ON ai_model_performance(outcome_recorded_at) WHERE outcome_recorded_at IS NOT NULL;

-- Training data collection
CREATE TABLE IF NOT EXISTS ml_training_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  
  -- Features
  technical_features JSONB NOT NULL,
  sentiment_features JSONB NOT NULL,
  liquidity_features JSONB NOT NULL,
  market_features JSONB NOT NULL,
  
  -- Labels (outcomes)
  price_change_1h DECIMAL(5,2),
  price_change_4h DECIMAL(5,2),
  price_change_1d DECIMAL(5,2),
  max_gain DECIMAL(5,2),
  max_loss DECIMAL(5,2),
  
  -- Metadata
  data_quality_score INTEGER DEFAULT 100,
  is_training BOOLEAN DEFAULT TRUE, -- vs validation/test
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(symbol, timestamp)
);

-- Index for efficient training data retrieval
CREATE INDEX IF NOT EXISTS idx_training_data_symbol_time ON ml_training_data(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_training_data_training ON ml_training_data(is_training, created_at DESC);

-- Model registry for tracking deployed models
CREATE TABLE IF NOT EXISTS ml_model_registry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  model_type TEXT NOT NULL,
  
  -- Model artifacts
  model_path TEXT, -- S3/storage path
  config JSONB NOT NULL, -- Hyperparameters, features, etc.
  training_metrics JSONB, -- Accuracy, precision, recall, etc.
  
  -- Deployment info
  is_active BOOLEAN DEFAULT FALSE,
  deployed_at TIMESTAMPTZ,
  deployment_notes TEXT,
  
  -- Performance tracking
  total_predictions INTEGER DEFAULT 0,
  successful_predictions INTEGER DEFAULT 0,
  average_confidence DECIMAL(3,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(model_name, model_version)
);

-- Index for active model lookup
CREATE INDEX IF NOT EXISTS idx_model_registry_active ON ml_model_registry(is_active, model_type) WHERE is_active = TRUE;

-- A/B testing for models
CREATE TABLE IF NOT EXISTS ml_ab_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_name TEXT NOT NULL,
  model_a_id UUID REFERENCES ml_model_registry(id),
  model_b_id UUID REFERENCES ml_model_registry(id),
  
  -- Test configuration
  traffic_split DECIMAL(3,2) DEFAULT 0.5, -- Percentage to model A
  test_symbols TEXT[], -- Specific symbols, null = all
  
  -- Results
  model_a_predictions INTEGER DEFAULT 0,
  model_a_successes INTEGER DEFAULT 0,
  model_b_predictions INTEGER DEFAULT 0,
  model_b_successes INTEGER DEFAULT 0,
  
  -- Statistical significance
  p_value DECIMAL(5,4),
  confidence_interval JSONB,
  
  -- Test lifecycle
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'aborted')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  conclusion TEXT,
  
  UNIQUE(test_name)
);

-- Enable RLS on new tables
ALTER TABLE market_scan_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_model_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_ab_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies (service role has full access)
CREATE POLICY "Service role full access" ON market_scan_queue
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access" ON market_scan_history
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access" ON ai_model_performance
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access" ON ml_training_data
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access" ON ml_model_registry
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access" ON ml_ab_tests
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Function to clean old queue entries
CREATE OR REPLACE FUNCTION clean_old_queue_entries()
RETURNS void AS $$
BEGIN
  DELETE FROM market_scan_queue 
  WHERE processed = TRUE 
  AND processed_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Function to calculate model success rate
CREATE OR REPLACE FUNCTION calculate_model_success_rate(p_model_version TEXT)
RETURNS TABLE(
  total_predictions BIGINT,
  profitable_predictions BIGINT,
  success_rate DECIMAL(5,2),
  avg_profit DECIMAL(5,2),
  avg_loss DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_predictions,
    COUNT(*) FILTER (WHERE (actual_outcome->>'profit_loss')::DECIMAL > 0)::BIGINT as profitable_predictions,
    ROUND(COUNT(*) FILTER (WHERE (actual_outcome->>'profit_loss')::DECIMAL > 0)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as success_rate,
    ROUND(AVG((actual_outcome->>'profit_loss')::DECIMAL) FILTER (WHERE (actual_outcome->>'profit_loss')::DECIMAL > 0), 2) as avg_profit,
    ROUND(AVG((actual_outcome->>'profit_loss')::DECIMAL) FILTER (WHERE (actual_outcome->>'profit_loss')::DECIMAL < 0), 2) as avg_loss
  FROM ai_model_performance
  WHERE model_version = p_model_version
  AND actual_outcome IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Comment on tables for documentation
COMMENT ON TABLE market_scan_queue IS 'Queue of symbols discovered by market scanner awaiting analysis';
COMMENT ON TABLE market_scan_history IS 'Historical record of all market scans performed';
COMMENT ON TABLE ai_model_performance IS 'Tracks predictions and outcomes for ML model evaluation';
COMMENT ON TABLE ml_training_data IS 'Feature and label data for training ML models';
COMMENT ON TABLE ml_model_registry IS 'Registry of all ML models with deployment status';
COMMENT ON TABLE ml_ab_tests IS 'A/B testing framework for comparing model performance';