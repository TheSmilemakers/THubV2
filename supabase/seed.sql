-- Seed data for development and testing

-- Insert test users
INSERT INTO test_users (id, name, email, access_token) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Demo User', 'demo@thub.ai', 'demo_token_123'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Test Trader', 'trader@thub.ai', 'test_trader_token_456'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Premium User', 'premium@thub.ai', 'premium_token_789')
ON CONFLICT (id) DO NOTHING;

-- Note: In production, use secure random tokens and proper user management