-- Rate Limit Tracking Table
-- Optimized for high-frequency updates and window-based queries

-- Create table for rate limit tracking
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
  -- Composite primary key for efficient upserts
  identifier TEXT NOT NULL,           -- e.g., 'ip:192.168.1.1', 'user:uuid', 'key:api_key_id'
  action TEXT NOT NULL,               -- e.g., '/api/signals', '/auth/signin'
  window_start TIMESTAMPTZ NOT NULL,  -- Start of the time window
  
  -- Counter and metadata
  count INT NOT NULL DEFAULT 1,       -- Number of requests in this window
  first_request_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_request_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Additional tracking data
  metadata JSONB DEFAULT '{}',        -- Store IP, user agent, etc.
  
  -- Composite primary key for conflict resolution
  PRIMARY KEY (identifier, action, window_start)
);

-- Performance indexes
-- Index for efficient window queries
CREATE INDEX idx_rate_limit_window ON rate_limit_tracking(window_start DESC);

-- Index for identifier lookups (covers user, IP, and API key queries)
CREATE INDEX idx_rate_limit_identifier ON rate_limit_tracking(identifier, window_start DESC);

-- Index for action-based queries
CREATE INDEX idx_rate_limit_action ON rate_limit_tracking(action, window_start DESC);

-- Partial index for active windows (last 24 hours)
CREATE INDEX idx_rate_limit_active ON rate_limit_tracking(window_start) 
WHERE window_start > NOW() - INTERVAL '24 hours';

-- Function to clean up old rate limit entries
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  -- Delete entries older than 24 hours
  DELETE FROM rate_limit_tracking
  WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old entries (requires pg_cron extension)
-- This should be run daily to prevent table bloat
-- SELECT cron.schedule('cleanup-rate-limits', '0 2 * * *', 'SELECT cleanup_old_rate_limits();');

-- Optimized upsert function for better performance
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_window_start TIMESTAMPTZ,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(current_count INT) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO rate_limit_tracking (
    identifier,
    action,
    window_start,
    count,
    metadata,
    last_request_at
  )
  VALUES (
    p_identifier,
    p_action,
    p_window_start,
    1,
    p_metadata,
    NOW()
  )
  ON CONFLICT (identifier, action, window_start)
  DO UPDATE SET
    count = rate_limit_tracking.count + 1,
    last_request_at = NOW(),
    metadata = rate_limit_tracking.metadata || p_metadata
  RETURNING rate_limit_tracking.count;
END;
$$ LANGUAGE plpgsql;

-- Performance optimization: Table partitioning by day
-- This is optional but recommended for high-traffic systems
-- Uncomment if you expect millions of requests per day

-- Enable partitioning
-- ALTER TABLE rate_limit_tracking SET (
--   autovacuum_vacuum_scale_factor = 0.01,
--   autovacuum_analyze_scale_factor = 0.01
-- );

-- Create partitioned table (alternative approach for very high traffic)
-- CREATE TABLE rate_limit_tracking_partitioned (
--   LIKE rate_limit_tracking INCLUDING ALL
-- ) PARTITION BY RANGE (window_start);

-- Create partitions for the next 7 days
-- DO $$
-- DECLARE
--   start_date date := CURRENT_DATE;
--   end_date date;
-- BEGIN
--   FOR i IN 0..7 LOOP
--     end_date := start_date + INTERVAL '1 day';
--     EXECUTE format(
--       'CREATE TABLE IF NOT EXISTS rate_limit_tracking_%s PARTITION OF rate_limit_tracking_partitioned
--        FOR VALUES FROM (%L) TO (%L)',
--       to_char(start_date, 'YYYY_MM_DD'),
--       start_date,
--       end_date
--     );
--     start_date := end_date;
--   END LOOP;
-- END $$;

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON rate_limit_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rate_limit_tracking TO service_role;

-- Add RLS policies
ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role has full access" ON rate_limit_tracking
  FOR ALL TO service_role
  USING (true);

-- Authenticated users can only view their own rate limits
CREATE POLICY "Users can view own rate limits" ON rate_limit_tracking
  FOR SELECT TO authenticated
  USING (
    identifier = 'user:' || auth.uid()::text
    OR identifier = 'ip:' || current_setting('request.headers')::json->>'x-forwarded-for'
  );

-- Add helpful views for monitoring
CREATE OR REPLACE VIEW rate_limit_summary AS
SELECT 
  identifier,
  action,
  window_start,
  count,
  last_request_at,
  EXTRACT(EPOCH FROM (window_start + INTERVAL '1 hour' - NOW()))::INT as seconds_until_reset
FROM rate_limit_tracking
WHERE window_start > NOW() - INTERVAL '1 hour'
ORDER BY count DESC;

-- View for current rate limit status by identifier
CREATE OR REPLACE VIEW current_rate_limits AS
SELECT 
  identifier,
  action,
  SUM(count) as total_requests,
  MAX(last_request_at) as last_request,
  array_agg(DISTINCT window_start ORDER BY window_start DESC) as active_windows
FROM rate_limit_tracking
WHERE window_start > NOW() - INTERVAL '1 hour'
GROUP BY identifier, action;

-- Add comment documentation
COMMENT ON TABLE rate_limit_tracking IS 'Tracks API rate limits for users, IPs, and API keys with window-based counting';
COMMENT ON COLUMN rate_limit_tracking.identifier IS 'Prefixed identifier: ip:address, user:uuid, or key:api_key_id';
COMMENT ON COLUMN rate_limit_tracking.action IS 'The API endpoint or action being rate limited';
COMMENT ON COLUMN rate_limit_tracking.window_start IS 'Start timestamp of the rate limit window';
COMMENT ON COLUMN rate_limit_tracking.count IS 'Number of requests in this window';
COMMENT ON COLUMN rate_limit_tracking.metadata IS 'Additional request metadata (user agent, origin, etc)';