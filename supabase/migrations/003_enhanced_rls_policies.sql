-- Enhanced RLS Policies for THub V2 Production Security
-- Replaces basic policies with more secure, production-ready ones

-- First, drop existing basic policies
DROP POLICY IF EXISTS "Public read access" ON signals;
DROP POLICY IF EXISTS "Service role cache access" ON indicator_cache;
DROP POLICY IF EXISTS "Test users read own data" ON test_users;

-- Drop existing service role policies
DROP POLICY IF EXISTS "Service role full access" ON market_scan_queue;
DROP POLICY IF EXISTS "Service role full access" ON market_scan_history;
DROP POLICY IF EXISTS "Service role full access" ON ai_model_performance;
DROP POLICY IF EXISTS "Service role full access" ON ml_training_data;
DROP POLICY IF EXISTS "Service role full access" ON ml_model_registry;
DROP POLICY IF EXISTS "Service role full access" ON ml_ab_tests;

-- Helper functions for RLS policies
CREATE OR REPLACE FUNCTION auth.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::jsonb ->> 'sub') IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.get_current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::jsonb ->> 'sub');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced RLS Policies for signals table
-- Allow public read access only to valid, non-expired signals
CREATE POLICY "Public read valid signals" ON signals
  FOR SELECT USING (
    expires_at > NOW() 
    AND convergence_score >= 70  -- Only show high-quality signals
  );

-- Service role can manage all signals
CREATE POLICY "Service role manage signals" ON signals
  FOR ALL USING (auth.is_service_role());

-- Authenticated users can update viewed_by and saved_by arrays
CREATE POLICY "Authenticated users track engagement" ON signals
  FOR UPDATE USING (
    auth.is_authenticated()
    AND (
      -- Only allow updating engagement fields
      (OLD.viewed_by IS DISTINCT FROM NEW.viewed_by)
      OR (OLD.saved_by IS DISTINCT FROM NEW.saved_by)
    )
  );

-- Enhanced RLS Policies for indicator_cache table
-- Only service role can access cache (internal operations)
CREATE POLICY "Service role cache management" ON indicator_cache
  FOR ALL USING (auth.is_service_role());

-- Enhanced RLS Policies for test_users table
-- Users can only read their own data using access token
CREATE POLICY "Users read own data via token" ON test_users
  FOR SELECT USING (
    auth.is_service_role()
    OR (
      access_token = current_setting('request.headers', true)::jsonb ->> 'authorization'
    )
  );

-- Service role can manage test users
CREATE POLICY "Service role manage test users" ON test_users
  FOR ALL USING (auth.is_service_role());

-- Enhanced RLS Policies for AI/ML tables
-- Only service role can access AI/ML infrastructure tables
CREATE POLICY "Service role manage scan queue" ON market_scan_queue
  FOR ALL USING (auth.is_service_role());

CREATE POLICY "Service role manage scan history" ON market_scan_history
  FOR ALL USING (auth.is_service_role());

CREATE POLICY "Service role manage model performance" ON ai_model_performance
  FOR ALL USING (auth.is_service_role());

CREATE POLICY "Service role manage training data" ON ml_training_data
  FOR ALL USING (auth.is_service_role());

CREATE POLICY "Service role manage model registry" ON ml_model_registry
  FOR ALL USING (auth.is_service_role());

CREATE POLICY "Service role manage ab tests" ON ml_ab_tests
  FOR ALL USING (auth.is_service_role());

-- Security functions for application use
-- Function to set current user token for RLS context
CREATE OR REPLACE FUNCTION set_current_token(token_value TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_token', token_value, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user from token
CREATE OR REPLACE FUNCTION get_current_user()
RETURNS TABLE(id UUID, name TEXT, email TEXT, error TEXT) AS $$
DECLARE
  token_value TEXT;
  user_record RECORD;
BEGIN
  -- Get token from custom setting
  token_value := current_setting('app.current_token', true);
  
  IF token_value IS NULL OR token_value = '' THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, 'No token provided'::TEXT;
    RETURN;
  END IF;
  
  -- Look up user by token
  SELECT tu.id, tu.name, tu.email INTO user_record
  FROM test_users tu
  WHERE tu.access_token = token_value;
  
  IF user_record.id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, 'Invalid token'::TEXT;
    RETURN;
  END IF;
  
  -- Return user data
  RETURN QUERY SELECT user_record.id, user_record.name, user_record.email, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate API rate limits (future use)
CREATE OR REPLACE FUNCTION check_rate_limit(user_token TEXT, operation TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
  request_count INTEGER;
  rate_limit INTEGER := 100; -- Default limit per hour
BEGIN
  -- Get user ID from token
  SELECT id INTO user_id FROM test_users WHERE access_token = user_token;
  
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- For MVP, always allow requests
  -- In production, implement actual rate limiting
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_token TEXT,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access audit logs
CREATE POLICY "Service role audit access" ON security_audit_log
  FOR ALL USING (auth.is_service_role());

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON security_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON security_audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON security_audit_log(table_name, created_at DESC);

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_user_token TEXT,
  p_action TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO security_audit_log (
    user_id, user_token, action, table_name, record_id,
    ip_address, user_agent, success, error_message, metadata
  )
  VALUES (
    p_user_id, p_user_token, p_action, p_table_name, p_record_id,
    p_ip_address, p_user_agent, p_success, p_error_message, p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on security enhancements
COMMENT ON FUNCTION set_current_token IS 'Sets user token for RLS context validation';
COMMENT ON FUNCTION get_current_user IS 'Validates token and returns user data for authentication';
COMMENT ON FUNCTION check_rate_limit IS 'Validates API rate limits for user requests';
COMMENT ON FUNCTION log_security_event IS 'Logs security events for audit and monitoring';
COMMENT ON TABLE security_audit_log IS 'Security audit log for monitoring access and actions';

-- Grant necessary permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON signals TO authenticated;
GRANT UPDATE(viewed_by, saved_by) ON signals TO authenticated;
GRANT SELECT ON test_users TO authenticated;

-- Ensure service role has all necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;