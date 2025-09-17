-- Create user_settings table for storing user preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE, -- From test_users.id
  settings JSONB NOT NULL DEFAULT '{
    "theme": "dark",
    "notifications": {
      "email": true,
      "push": true,
      "sms": false,
      "signalAlerts": true,
      "marketUpdates": true
    },
    "display": {
      "currency": "USD",
      "timezone": "UTC",
      "language": "en",
      "chartType": "candlestick"
    },
    "trading": {
      "defaultTimeframe": "1h",
      "riskLevel": "moderate",
      "autoRefresh": true,
      "refreshInterval": 30
    }
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);

-- Add RLS policies
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only view and update their own settings
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (true); -- In production, this would check auth.uid()

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (true); -- In production, this would check auth.uid()

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (true); -- In production, this would check auth.uid()

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.user_settings TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated;

-- Insert default settings for existing test users
INSERT INTO public.user_settings (user_id)
SELECT id FROM public.test_users
ON CONFLICT (user_id) DO NOTHING;