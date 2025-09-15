export interface MetricData {
  id: string;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
}

export interface ConvergenceScores {
  technical: number;
  sentiment: number;
  liquidity: number;
  timestamp: number;
}

export interface SignalData {
  id: string;
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  score: number;
  price: number;
  change: number;
  volume: number;
  timestamp: number;
  layers: {
    technical: number;
    sentiment: number;
    liquidity: number;
  };
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'live' | 'beta' | 'coming_soon';
}

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'year';
  features: string[];
  highlighted?: boolean;
  cta: string;
}

export interface LiveFeedItem {
  id: string;
  type: 'signal' | 'alert' | 'analysis';
  symbol?: string;
  message: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'success' | 'error';
}

export interface HeroStats {
  signalsGenerated: number;
  accuracyRate: number;
  activeUsers: number;
  totalVolume: number;
}

// Animation and UI types
export interface AnimationConfig {
  duration: number;
  delay: number;
  easing: string;
}

export interface ThemeAwareProps {
  theme?: 'professional' | 'synthwave';
  className?: string;
  children?: React.ReactNode;
}

// WebSocket types for real-time data
export interface WebSocketMessage {
  type: 'metric_update' | 'signal_update' | 'convergence_update' | 'feed_update';
  data: any;
  timestamp: number;
}

// Performance monitoring types
export interface PerformanceMetrics {
  fps: number;
  loadTime: number;
  interactionLatency: number;
  bundleSize: number;
}