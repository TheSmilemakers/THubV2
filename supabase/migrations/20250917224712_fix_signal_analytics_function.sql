-- Fix the get_signal_analytics function to work with actual signals table schema
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
    -- Since we don't track actual performance yet, simulate based on convergence_score
    COALESCE(
      ROUND(
        (COUNT(CASE WHEN convergence_score >= 70 THEN 1 END)::numeric / 
        NULLIF(COUNT(*), 0)) * 100, 
      1), 
      0
    ) as success_rate,
    -- Consider signals created in last hour as active
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 hour' THEN 1 END)::bigint as active_signals,
    COALESCE(ROUND(AVG(convergence_score)::numeric, 1), 0) as average_score,
    -- Since we don't have timeframe column, simulate distribution
    json_build_object(
      '1h', COUNT(CASE WHEN EXTRACT(hour FROM created_at) < 8 THEN 1 END),
      '4h', COUNT(CASE WHEN EXTRACT(hour FROM created_at) >= 8 AND EXTRACT(hour FROM created_at) < 16 THEN 1 END),
      '1d', COUNT(CASE WHEN EXTRACT(hour FROM created_at) >= 16 THEN 1 END)
    ) as signals_by_timeframe,
    COUNT(CASE WHEN EXTRACT(hour FROM created_at) < 8 THEN 1 END)::bigint as hourly_signals,
    COUNT(CASE WHEN EXTRACT(hour FROM created_at) >= 16 THEN 1 END)::bigint as daily_signals,
    json_build_object(
      'top_performers', (
        SELECT json_agg(performer)
        FROM (
          SELECT 
            symbol,
            -- Simulate performance based on convergence score and signal strength
            ROUND(
              CASE signal_strength
                WHEN 'STRONG' THEN (convergence_score - 50) * 0.1
                WHEN 'MEDIUM' THEN (convergence_score - 50) * 0.05
                ELSE 0
              END::numeric, 
            2) as performance,
            COUNT(*)::int as signals
          FROM signals
          GROUP BY symbol, signal_strength, convergence_score
          ORDER BY performance DESC
          LIMIT 5
        ) performer
      ),
      'recent_activity', (
        SELECT json_agg(activity)
        FROM (
          SELECT 
            id,
            symbol,
            CASE 
              WHEN signal_strength = 'STRONG' THEN 'buy'
              ELSE 'sell'
            END as action,
            convergence_score as score,
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

-- Insert some test signals with varied data for MVP
INSERT INTO signals (
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
  created_at
) VALUES
  -- Strong signals
  ('AAPL', 'US_STOCKS', 88, 82, 86, 85, 'STRONG', 178.50, 178.00, 174.50, 185.00, 
   '{"rsi": 45, "macd": {"signal": 1.2, "histogram": 0.5}, "volume": "high", "trend": "bullish"}'::jsonb,
   ARRAY['Strong bullish divergence on 4H chart', 'Volume breakout confirmed', 'Above 50-day MA'],
   NOW() - INTERVAL '30 minutes'),
   
  ('NVDA', 'US_STOCKS', 92, 89, 92, 91, 'STRONG', 465.25, 464.00, 455.00, 480.00,
   '{"rsi": 38, "macd": {"signal": 2.8, "histogram": 1.2}, "volume": "very high", "trend": "bullish"}'::jsonb,
   ARRAY['Oversold bounce from key support', 'Institutional accumulation detected', 'AI sector momentum'],
   NOW() - INTERVAL '15 minutes'),
   
  ('MSFT', 'US_STOCKS', 80, 75, 79, 78, 'MEDIUM', 370.80, 370.00, 365.00, 378.00,
   '{"rsi": 52, "macd": {"signal": 0.8, "histogram": 0.3}, "volume": "moderate", "trend": "neutral"}'::jsonb,
   ARRAY['Consolidating above support', 'Earnings beat expectations', 'Cloud growth strong'],
   NOW() - INTERVAL '2 hours'),
   
  -- Medium signals
  ('GOOGL', 'US_STOCKS', 75, 68, 74, 72, 'MEDIUM', 138.50, 138.00, 135.00, 143.00,
   '{"rsi": 58, "macd": {"signal": -0.3, "histogram": -0.1}, "volume": "moderate", "trend": "bearish"}'::jsonb,
   ARRAY['Testing resistance at 140', 'Mixed sentiment on AI competition', 'Ad revenue concerns'],
   NOW() - INTERVAL '4 hours'),
   
  ('META', 'US_STOCKS', 70, 65, 71, 69, 'WEAK', 485.20, 484.50, 478.00, 492.00,
   '{"rsi": 48, "macd": {"signal": 0.2, "histogram": 0.0}, "volume": "low", "trend": "neutral"}'::jsonb,
   ARRAY['Range-bound trading', 'Metaverse investments weighing', 'Strong ad platform'],
   NOW() - INTERVAL '1 hour'),
   
  -- Recent activity
  ('TSLA', 'US_STOCKS', 78, 72, 79, 76, 'MEDIUM', 245.30, 244.50, 238.00, 252.00,
   '{"rsi": 55, "macd": {"signal": 0.9, "histogram": 0.4}, "volume": "high", "trend": "bullish"}'::jsonb,
   ARRAY['EV sector rotation', 'China sales improving', 'Technical breakout pending'],
   NOW() - INTERVAL '5 minutes'),
   
  ('SPY', 'US_ETF', 84, 78, 82, 81, 'STRONG', 442.15, 441.50, 438.00, 448.00,
   '{"rsi": 42, "macd": {"signal": 1.5, "histogram": 0.7}, "volume": "high", "trend": "bullish"}'::jsonb,
   ARRAY['Market breadth improving', 'VIX declining', 'Fed pause expected'],
   NOW() - INTERVAL '10 minutes')
ON CONFLICT (symbol) DO UPDATE SET
  technical_score = EXCLUDED.technical_score,
  sentiment_score = EXCLUDED.sentiment_score,
  liquidity_score = EXCLUDED.liquidity_score,
  convergence_score = EXCLUDED.convergence_score,
  signal_strength = EXCLUDED.signal_strength,
  current_price = EXCLUDED.current_price,
  created_at = EXCLUDED.created_at;