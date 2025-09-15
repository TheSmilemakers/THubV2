// Chart Components - Premium trading visualization suite
// Week 1 UI Components: Chart Components (8 components)

// Core chart components
export { TradingChart } from './trading-chart';
export type { TradingChartProps, TradingChartDataPoint } from './trading-chart';

export { MiniChart, MiniLineChart, MiniAreaChart, SignalMiniChart, CardMiniChart, DashboardMiniChart } from './mini-chart';
export type { MiniChartProps, MiniChartDataPoint } from './mini-chart';

export { 
  SparklineChart, 
  PriceSparkline, 
  VolumeSparkline, 
  PerformanceSparkline, 
  SentimentSparkline,
  BatchSparklines,
  InlineSparkline
} from './sparkline-chart';
export type { SparklineChartProps, SparklineChartDataPoint, BatchSparklineProps, InlineSparklineProps } from './sparkline-chart';

export { CandlestickChart } from './candlestick-chart';
export type { CandlestickChartProps, CandlestickDataPoint } from './candlestick-chart';

export { VolumeChart, PriceVolumeChart, SimpleVolumeChart, DetailedVolumeChart } from './volume-chart';
export type { VolumeChartProps, VolumeDataPoint } from './volume-chart';

export { PerformanceChart, SimplePerformanceChart, DetailedPerformanceChart, BenchmarkPerformanceChart } from './performance-chart';
export type { PerformanceChartProps, PerformanceDataPoint, PerformanceMetrics } from './performance-chart';

export { ComparisonChart } from './comparison-chart';
export type { ComparisonChartProps, ComparisonSymbol, ComparisonDataPoint, ComparisonStats } from './comparison-chart';

export { MarketHeatmap } from './market-heatmap';
export type { MarketHeatmapProps, HeatmapDataPoint, SectorData } from './market-heatmap';

// Chart component collections for easy imports
import { TradingChart } from './trading-chart';
import { CandlestickChart } from './candlestick-chart';
import { VolumeChart } from './volume-chart';
import { PerformanceChart } from './performance-chart';
import { ComparisonChart } from './comparison-chart';
import { MarketHeatmap } from './market-heatmap';
import { 
  MiniChart, 
  MiniLineChart, 
  MiniAreaChart, 
  SignalMiniChart, 
  CardMiniChart, 
  DashboardMiniChart 
} from './mini-chart';
import {
  SparklineChart,
  PriceSparkline,
  VolumeSparkline,
  PerformanceSparkline,
  SentimentSparkline,
  BatchSparklines,
  InlineSparkline
} from './sparkline-chart';

export const TradingCharts = {
  TradingChart,
  CandlestickChart,
  VolumeChart,
  PerformanceChart,
  ComparisonChart
};

export const MiniCharts = {
  MiniChart,
  MiniLineChart,
  MiniAreaChart,
  SignalMiniChart,
  CardMiniChart,
  DashboardMiniChart
};

export const SparklineCharts = {
  SparklineChart,
  PriceSparkline,
  VolumeSparkline,
  PerformanceSparkline,
  SentimentSparkline,
  BatchSparklines,
  InlineSparkline
};

export const OverviewCharts = {
  MarketHeatmap,
  ComparisonChart,
  PerformanceChart
};

// Component metadata for documentation and tooling
export const ChartComponents = {
  TradingChart: {
    category: 'Trading',
    complexity: 'High',
    features: ['Zoom/Pan', 'Technical Indicators', 'Real-time Updates', 'Touch Gestures'],
    mobileOptimized: true
  },
  MiniChart: {
    category: 'Display',
    complexity: 'Low',
    features: ['Compact Display', 'Touch Optimized', 'Multiple Variants'],
    mobileOptimized: true
  },
  SparklineChart: {
    category: 'Display',
    complexity: 'Low',
    features: ['Inline Display', 'Batch Processing', 'Multiple Variants'],
    mobileOptimized: true
  },
  CandlestickChart: {
    category: 'Trading',
    complexity: 'High',
    features: ['OHLC Display', 'Touch Gestures', 'Volume Overlay', 'Moving Averages'],
    mobileOptimized: true
  },
  VolumeChart: {
    category: 'Trading',
    complexity: 'Medium',
    features: ['Gradient Fills', 'Spike Detection', 'Price Correlation'],
    mobileOptimized: true
  },
  PerformanceChart: {
    category: 'Analytics',
    complexity: 'Medium',
    features: ['Benchmark Comparison', 'Time Periods', 'Portfolio Metrics'],
    mobileOptimized: true
  },
  ComparisonChart: {
    category: 'Analytics',
    complexity: 'Medium',
    features: ['Multi-symbol', 'Dynamic Management', 'Correlation Analysis'],
    mobileOptimized: true
  },
  MarketHeatmap: {
    category: 'Overview',
    complexity: 'High',
    features: ['Hierarchical Display', 'Touch Interactions', 'Multiple Views'],
    mobileOptimized: true
  }
} as const;