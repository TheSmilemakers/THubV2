-- Add test signals data for MVP demonstration
-- This creates realistic-looking signals for testing and showcasing

-- Clear existing signals (if any)
TRUNCATE TABLE signals CASCADE;

-- Insert test signals with varied scores and timeframes
INSERT INTO signals (symbol, timeframe, type, score, metadata, created_at) VALUES
  -- High-performing signals (score >= 70)
  ('AAPL', '1h', 'buy', 85.5, '{"layers": {"technical": 88, "sentiment": 82, "liquidity": 86}, "indicators": {"rsi": 45, "macd": "bullish", "volume": "high"}}', NOW() - INTERVAL '2 hours'),
  ('MSFT', '4h', 'buy', 78.2, '{"layers": {"technical": 80, "sentiment": 75, "liquidity": 79}, "indicators": {"rsi": 52, "macd": "bullish", "volume": "moderate"}}', NOW() - INTERVAL '4 hours'),
  ('GOOGL', '1d', 'sell', 72.8, '{"layers": {"technical": 75, "sentiment": 68, "liquidity": 74}, "indicators": {"rsi": 68, "macd": "bearish", "volume": "high"}}', NOW() - INTERVAL '1 day'),
  ('NVDA', '1h', 'buy', 91.2, '{"layers": {"technical": 92, "sentiment": 89, "liquidity": 92}, "indicators": {"rsi": 35, "macd": "bullish", "volume": "very high"}}', NOW() - INTERVAL '30 minutes'),
  ('TSLA', '4h', 'sell', 76.5, '{"layers": {"technical": 78, "sentiment": 72, "liquidity": 79}, "indicators": {"rsi": 72, "macd": "bearish", "volume": "high"}}', NOW() - INTERVAL '6 hours'),
  
  -- Medium-performing signals (score 50-70)
  ('META', '1h', 'buy', 68.9, '{"layers": {"technical": 70, "sentiment": 65, "liquidity": 71}, "indicators": {"rsi": 48, "macd": "neutral", "volume": "moderate"}}', NOW() - INTERVAL '3 hours'),
  ('AMZN', '1d', 'buy', 65.3, '{"layers": {"technical": 68, "sentiment": 60, "liquidity": 67}, "indicators": {"rsi": 54, "macd": "bullish", "volume": "low"}}', NOW() - INTERVAL '2 days'),
  ('BRK.B', '4h', 'sell', 62.7, '{"layers": {"technical": 65, "sentiment": 58, "liquidity": 64}, "indicators": {"rsi": 62, "macd": "bearish", "volume": "moderate"}}', NOW() - INTERVAL '8 hours'),
  
  -- Lower-performing signals (score < 50) - these wouldn't trigger in production
  ('JPM', '1h', 'buy', 48.5, '{"layers": {"technical": 50, "sentiment": 45, "liquidity": 50}, "indicators": {"rsi": 50, "macd": "neutral", "volume": "low"}}', NOW() - INTERVAL '5 hours'),
  ('WMT', '1d', 'sell', 42.1, '{"layers": {"technical": 45, "sentiment": 38, "liquidity": 43}, "indicators": {"rsi": 58, "macd": "bearish", "volume": "very low"}}', NOW() - INTERVAL '3 days'),
  
  -- Recent signals for activity feed
  ('SPY', '1h', 'buy', 81.7, '{"layers": {"technical": 84, "sentiment": 78, "liquidity": 82}, "indicators": {"rsi": 42, "macd": "bullish", "volume": "high"}}', NOW() - INTERVAL '15 minutes'),
  ('QQQ', '1h', 'sell', 74.3, '{"layers": {"technical": 76, "sentiment": 70, "liquidity": 76}, "indicators": {"rsi": 65, "macd": "bearish", "volume": "moderate"}}', NOW() - INTERVAL '10 minutes'),
  ('DIA', '4h', 'buy', 79.8, '{"layers": {"technical": 82, "sentiment": 76, "liquidity": 80}, "indicators": {"rsi": 44, "macd": "bullish", "volume": "high"}}', NOW() - INTERVAL '5 minutes');

-- Update signal statuses to make some "completed" for analytics
UPDATE signals SET status = 'completed' WHERE created_at < NOW() - INTERVAL '1 hour';
UPDATE signals SET status = 'active' WHERE created_at >= NOW() - INTERVAL '1 hour';

-- Add some saved signals for test users
INSERT INTO saved_signals (user_id, signal_id)
SELECT 
  u.id,
  s.id
FROM test_users u
CROSS JOIN signals s
WHERE u.name = 'Rajan Maher' AND s.symbol IN ('AAPL', 'NVDA', 'SPY')
ON CONFLICT DO NOTHING;

-- Add performance tracking for completed signals (simulated)
UPDATE signals 
SET metadata = jsonb_set(
  metadata, 
  '{performance}', 
  CASE 
    WHEN score >= 80 THEN '{"result": "success", "return": 2.5}'::jsonb
    WHEN score >= 70 THEN '{"result": "success", "return": 1.2}'::jsonb
    WHEN score >= 60 THEN '{"result": "neutral", "return": 0.3}'::jsonb
    ELSE '{"result": "loss", "return": -0.8}'::jsonb
  END
)
WHERE status = 'completed';

-- Update the get_signal_analytics function to include performance data
CREATE OR REPLACE FUNCTION get_signal_analytics()
RETURNS TABLE(
  total_signals bigint,
  success_rate numeric,
  active_signals bigint,
  average_score numeric,
  signals_by_timeframe json,
  hourly_signals bigint,
  daily_signals bigint,
  performance_data json
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_signals,
    COALESCE(
      ROUND(
        (COUNT(CASE WHEN metadata->>'performance' IS NOT NULL 
          AND (metadata->'performance'->>'result') IN ('success') 
          THEN 1 END)::numeric / 
        NULLIF(COUNT(CASE WHEN metadata->>'performance' IS NOT NULL THEN 1 END), 0)) * 100, 
      1), 
      0
    ) as success_rate,
    COUNT(CASE WHEN status = 'active' THEN 1 END)::bigint as active_signals,
    COALESCE(ROUND(AVG(score)::numeric, 1), 0) as average_score,
    json_build_object(
      '1h', COUNT(CASE WHEN timeframe = '1h' THEN 1 END),
      '4h', COUNT(CASE WHEN timeframe = '4h' THEN 1 END),
      '1d', COUNT(CASE WHEN timeframe = '1d' THEN 1 END)
    ) as signals_by_timeframe,
    COUNT(CASE WHEN timeframe = '1h' THEN 1 END)::bigint as hourly_signals,
    COUNT(CASE WHEN timeframe = '1d' THEN 1 END)::bigint as daily_signals,
    json_build_object(
      'top_performers', (
        SELECT json_agg(performer)
        FROM (
          SELECT 
            symbol,
            ROUND(AVG(COALESCE((metadata->'performance'->>'return')::numeric, 0))::numeric, 2) as performance,
            COUNT(*)::int as signals
          FROM signals
          WHERE metadata->>'performance' IS NOT NULL
          GROUP BY symbol
          ORDER BY AVG(COALESCE((metadata->'performance'->>'return')::numeric, 0)) DESC
          LIMIT 5
        ) performer
      ),
      'recent_activity', (
        SELECT json_agg(activity)
        FROM (
          SELECT 
            id,
            symbol,
            type as action,
            score,
            created_at as timestamp
          FROM signals
          ORDER BY created_at DESC
          LIMIT 5
        ) activity
      )
    ) as performance_data
  FROM signals;
END;
$$ LANGUAGE plpgsql;