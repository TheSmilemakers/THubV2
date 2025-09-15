// Mock data for testing
import { MarketType, SignalStrength, TestUser, TechnicalData } from '@/types';
import { Signal as DbSignal } from '@/types';
import { Signal as UISignal, UISignalStrength } from '@/types/signals.types';
import { User } from '@supabase/supabase-js';

export const mockUser: User = {
  id: 'test-user-123',
  email: 'test@example.com',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
};

const mockTechnicalData: TechnicalData = {
  indicators: {
    rsi: 65,
    macd: { value: 1.2, signal: 0.8, histogram: 0.4 },
    ema: {
      ema12: 189.50,
      ema26: 188.25,
      ema50: 185.50,
    },
    sma: {
      sma20: 188.00,
      sma50: 185.00,
      sma200: 180.00,
    },
  },
  patterns: ['ascending_triangle', 'bullish_flag'],
  trend: 'bullish',
  volume: {
    current: 52145600,
    average: 50000000,
    ratio: 1.04,
  },
  priceAction: {
    support: [185.00, 182.50, 180.00],
    resistance: [192.00, 195.00, 198.00],
  },
};

// Mock DB Signal for database operations
export const mockDbSignal: DbSignal = {
  id: 'signal-123',
  symbol: 'AAPL',
  market: 'US' as MarketType,
  technical_score: 90,
  sentiment_score: 80,
  liquidity_score: 85,
  convergence_score: 85,
  signal_strength: 'STRONG' as SignalStrength,
  current_price: 190.25,
  entry_price: 189.50,
  stop_loss: 185.00,
  take_profit: 195.50,
  created_at: '2024-01-19T10:00:00Z',
  expires_at: '2024-01-20T10:00:00Z',
  technical_data: mockTechnicalData as any,
  analysis_notes: ['Strong momentum', 'Breaking resistance'],
  viewed_by: [],
  saved_by: [],
};

// Mock UI Signal for components
export const mockSignal = {
  ...mockDbSignal,
  created_at: '2024-01-19T10:00:00Z',
  expires_at: '2024-01-20T10:00:00Z',
  signal_strength: 'buy' as UISignalStrength,
  company_name: 'Apple Inc.',
  price_change_24h: 2.45,
  price_change_percent_24h: 1.30,
  volume_24h: 52145600,
  market_cap: 3100000000000,
  price_history: [188.00, 189.50, 190.25],
  score_zone: 'hot' as const,
  time_since_created: '2 hours ago',
  is_expired: false,
} as any;

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: string;
}

export const mockMarketData: MarketData = {
  symbol: 'AAPL',
  name: 'Apple Inc.',
  price: 190.25,
  change: 2.45,
  changePercent: 1.30,
  volume: 52145600,
  marketCap: 3100000000000,
  high: 191.50,
  low: 188.25,
  open: 189.00,
  previousClose: 187.80,
  timestamp: '2024-01-19T16:00:00Z',
};

export const createMockSignals = (count: number) => {
  const signals: any[] = [];
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM'];
  const companies = ['Apple Inc.', 'Alphabet Inc.', 'Microsoft Corp.', 'Amazon.com Inc.', 'Tesla Inc.', 'Meta Platforms', 'NVIDIA Corp.', 'JPMorgan Chase'];
  const uiStrengths: UISignalStrength[] = ['buy', 'hold', 'sell'];

  for (let i = 0; i < count; i++) {
    const symbol = symbols[i % symbols.length];
    const companyName = companies[i % companies.length];
    const convergenceScore = 70 + Math.random() * 30;
    const currentPrice = 100 + Math.random() * 200;
    
    signals.push({
      id: `signal-${i}`,
      symbol,
      market: 'US' as MarketType,
      convergence_score: Math.round(convergenceScore),
      technical_score: Math.round(70 + Math.random() * 30),
      sentiment_score: Math.round(70 + Math.random() * 30),
      liquidity_score: Math.round(70 + Math.random() * 30),
      signal_strength: uiStrengths[Math.floor(Math.random() * uiStrengths.length)],
      current_price: currentPrice,
      entry_price: currentPrice * 0.99,
      stop_loss: currentPrice * 0.95,
      take_profit: currentPrice * 1.05,
      created_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      technical_data: mockTechnicalData as any,
      analysis_notes: ['Generated for testing'],
      viewed_by: [],
      saved_by: [],
      // UI-specific fields
      company_name: companyName,
      price_change_24h: (Math.random() - 0.5) * 10,
      price_change_percent_24h: (Math.random() - 0.5) * 5,
      volume_24h: Math.floor(Math.random() * 100000000),
      market_cap: Math.floor(Math.random() * 1000000000000),
      price_history: Array.from({ length: 5 }, () => currentPrice + (Math.random() - 0.5) * 10),
      score_zone: convergenceScore >= 70 ? 'hot' : convergenceScore >= 50 ? 'warm' : 'cool',
      time_since_created: '2 hours ago',
      is_expired: false,
    });
  }

  return signals;
};

export const mockAuthResponse = {
  access_token: 'mock-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh-token',
  user: mockUser,
};

export const mockSupabaseError = {
  message: 'Invalid credentials',
  status: 400,
};