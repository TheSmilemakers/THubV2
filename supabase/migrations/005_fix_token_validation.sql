-- Fix token validation for client-side authentication
-- This adds a new function that accepts token as a parameter

-- Create a function that validates token and returns user data in a single call
CREATE OR REPLACE FUNCTION validate_token_and_get_user(token_value TEXT)
RETURNS TABLE(
  authenticated BOOLEAN,
  id UUID,
  name TEXT,
  email TEXT,
  error TEXT
) AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Check if token is provided
  IF token_value IS NULL OR token_value = '' THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN as authenticated,
      NULL::UUID as id, 
      NULL::TEXT as name, 
      NULL::TEXT as email, 
      'No token provided'::TEXT as error;
    RETURN;
  END IF;
  
  -- Look up user by token
  SELECT tu.id, tu.name, tu.email INTO user_record
  FROM test_users tu
  WHERE tu.access_token = token_value;
  
  -- Check if user was found
  IF user_record.id IS NULL THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN as authenticated,
      NULL::UUID as id, 
      NULL::TEXT as name, 
      NULL::TEXT as email, 
      'Invalid token'::TEXT as error;
    RETURN;
  END IF;
  
  -- Return authenticated user data
  RETURN QUERY SELECT 
    TRUE::BOOLEAN as authenticated,
    user_record.id, 
    user_record.name, 
    user_record.email, 
    NULL::TEXT as error;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION validate_token_and_get_user TO anon;
GRANT EXECUTE ON FUNCTION validate_token_and_get_user TO authenticated;

-- Add comment
COMMENT ON FUNCTION validate_token_and_get_user IS 'Validates access token and returns user data in a single call for client-side authentication';