'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/themes/use-theme';
import type { IntradayData } from '@/lib/hooks';
import {
  CandlestickChart,
  TradingChart,
  VolumeChart,
  PerformanceChart,
  ComparisonChart,
  MarketHeatmap,
  MiniChart,
  SparklineChart,
  type CandlestickDataPoint,
  type TradingChartDataPoint,
  type VolumeDataPoint,
  type PerformanceDataPoint,
  type ComparisonSymbol,
  type HeatmapDataPoint,
} from '@/components/charts';

/**
 * ChartsShowcase Component - Demonstrates trading charts and technical indicators
 * 
 * Features:
 * - Multiple chart types (candlestick, line, volume, heatmap)
 * - Technical indicators (RSI, MACD, Bollinger Bands)
 * - Theme-aware styling
 * - Static mock data for demonstration
 */

// Generate mock OHLC data
const generateOHLCData = (days: number = 30, basePrice: number = 185): CandlestickDataPoint[] => {
  const data: CandlestickDataPoint[] = [];
  let currentPrice = basePrice;
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate realistic price movements
    const change = (Math.random() - 0.5) * 5;
    const open = currentPrice;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    const volume = Math.floor(30000000 + Math.random() * 20000000);
    
    // Moving averages
    const sma20 = currentPrice + (Math.random() - 0.5) * 2;
    const sma50 = currentPrice + (Math.random() - 0.5) * 3;
    
    // Generate signal based on price movement
    let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
    let signalStrength = 0;
    
    if (close > sma20 && close > sma50) {
      signal = 'buy';
      signalStrength = 0.7 + Math.random() * 0.3;
    } else if (close < sma20 && close < sma50) {
      signal = 'sell';
      signalStrength = 0.7 + Math.random() * 0.3;
    }
    
    data.push({
      datetime: date.toISOString(),
      open,
      high,
      low,
      close,
      volume,
      sma20,
      sma50,
      signal,
      signalStrength
    });
    
    currentPrice = close;
  }
  
  return data;
};

// Generate volume data
const generateVolumeData = (days: number = 30): VolumeDataPoint[] => {
  const data: VolumeDataPoint[] = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const volume = Math.floor(30000000 + Math.random() * 20000000);
    const price = 180 + Math.random() * 10;
    const open = price - Math.random() * 2;
    const close = price + Math.random() * 2;
    const high = Math.max(open, close) + Math.random();
    const low = Math.min(open, close) - Math.random();
    
    data.push({
      datetime: date.toISOString(),
      volume,
      open,
      high,
      low,
      close,
      isVolumeSpike: volume > 45000000 // High volume spike
    });
  }
  
  return data;
};

// Generate technical indicators data
const generateTechnicalIndicators = () => {
  const days = 30;
  const data: any[] = [];
  const now = new Date();
  
  // RSI oscillates between 30 and 70
  let rsi = 50;
  
  // MACD values
  let macd = 0;
  let macdSignal = 0;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // RSI calculation (simplified)
    rsi = Math.max(20, Math.min(80, rsi + (Math.random() - 0.5) * 10));
    
    // MACD calculation (simplified)
    macd += (Math.random() - 0.5) * 0.5;
    macdSignal = macd * 0.9;
    const macdHist = macd - macdSignal;
    
    // Bollinger Bands (simplified)
    const price = 185 + (Math.random() - 0.5) * 10;
    const upperBand = price + 2;
    const lowerBand = price - 2;
    
    data.push({
      timestamp: date.toISOString(),
      rsi,
      macd,
      macdSignal,
      macdHist,
      upperBand,
      middleBand: price,
      lowerBand,
      overbought: rsi > 70,
      oversold: rsi < 30
    });
  }
  
  return data;
};

// Generate comparison data for multiple symbols
const generateComparisonData = (): ComparisonSymbol[] => {
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN'];
  const baseDate = new Date();
  
  return symbols.map((symbol, index) => {
    const basePrice = 100 + index * 50;
    const data: IntradayData[] = [];
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      
      const price = basePrice + (Math.random() - 0.5) * 20 + (30 - i) * (Math.random() - 0.45);
      const open = price - Math.random() * 2;
      const close = price + Math.random() * 2;
      const high = Math.max(open, close) + Math.random();
      const low = Math.min(open, close) - Math.random();
      
      data.push({
        datetime: date.toISOString(),
        open,
        high,
        low,
        close,
        volume: Math.floor(10000000 + Math.random() * 5000000)
      });
    }
    
    return {
      symbol,
      name: symbol,
      data,
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index],
      visible: true
    };
  });
};

// Generate heatmap data
const generateHeatmapData = (): HeatmapDataPoint[] => {
  const sectors = [
    { name: 'Technology', symbols: ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA'] },
    { name: 'Healthcare', symbols: ['JNJ', 'PFE', 'UNH', 'CVS', 'ABT'] },
    { name: 'Finance', symbols: ['JPM', 'BAC', 'WFC', 'GS', 'MS'] },
    { name: 'Consumer', symbols: ['AMZN', 'WMT', 'HD', 'NKE', 'SBUX'] }
  ];
  
  const data: HeatmapDataPoint[] = [];
  let id = 1;
  
  sectors.forEach(sector => {
    sector.symbols.forEach(symbol => {
      const changePercent = (Math.random() - 0.5) * 10;
      const price = 100 + Math.random() * 400;
      const marketCap = Math.random() * 1000000000000;
      data.push({
        id: `heatmap-${id++}`,
        symbol,
        name: symbol,
        sector: sector.name,
        price,
        change: price * changePercent / 100,
        changePercent,
        marketCap,
        volume: Math.random() * 50000000,
        size: marketCap / 1000000000, // Size relative to market cap
        color: changePercent > 0 ? '#22C55E' : '#EF4444'
      });
    });
  });
  
  return data;
};

export function ChartsShowcase() {
  const { theme } = useTheme();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '1W' | '1M' | '3M'>('1M');
  const [selectedIndicator, setSelectedIndicator] = useState<'rsi' | 'macd' | 'bollinger'>('rsi');
  
  // Mock data
  const ohlcData = useMemo(() => generateOHLCData(30), []);
  const volumeData = useMemo(() => generateVolumeData(30), []);
  const technicalData = useMemo(() => generateTechnicalIndicators(), []);
  const comparisonData = useMemo(() => generateComparisonData(), []);
  const heatmapData = useMemo(() => generateHeatmapData(), []);
  
  const timeframes = [
    { value: '1D', label: theme === 'synthwave' ? '[1D]' : '1 Day' },
    { value: '1W', label: theme === 'synthwave' ? '[1W]' : '1 Week' },
    { value: '1M', label: theme === 'synthwave' ? '[1M]' : '1 Month' },
    { value: '3M', label: theme === 'synthwave' ? '[3M]' : '3 Months' }
  ];
  
  const indicators = [
    { value: 'rsi', label: theme === 'synthwave' ? 'RSI' : 'Relative Strength Index' },
    { value: 'macd', label: theme === 'synthwave' ? 'MACD' : 'MACD' },
    { value: 'bollinger', label: theme === 'synthwave' ? 'BB' : 'Bollinger Bands' }
  ];

  return (
    <div className="space-y-8">
      {/* Main Trading Chart */}
      <section className="space-y-4">
        <h2 className={cn(
          "text-2xl font-semibold text-center",
          theme === 'synthwave' ? "font-mono text-terminal-green" : "text-text-primary"
        )}>
          {theme === 'synthwave' ? '> TRADING CHARTS' : 'Trading Charts & Analysis'}
        </h2>
        
        {/* Timeframe Selector */}
        <div className="flex justify-center gap-2">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setSelectedTimeframe(tf.value as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                selectedTimeframe === tf.value
                  ? theme === 'synthwave'
                    ? "bg-neon-pink text-bg-primary font-mono"
                    : "bg-accent-primary text-white"
                  : theme === 'synthwave'
                    ? "bg-glass-surface border border-neon-cyan/30 text-neon-cyan font-mono hover:bg-neon-cyan/10"
                    : "bg-glass-light text-text-secondary hover:text-text-primary hover:bg-white/10"
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>
        
        {/* Candlestick Chart */}
        <div className={cn(
          "p-6 rounded-xl",
          theme === 'synthwave' 
            ? "bg-glass-surface border border-neon-pink/30"
            : "glass-medium"
        )}>
          <h3 className={cn(
            "text-lg font-medium mb-4",
            theme === 'synthwave' ? "font-mono text-neon-cyan" : "text-text-primary"
          )}>
            {theme === 'synthwave' ? '> AAPL PRICE ACTION' : 'AAPL - Price Action'}
          </h3>
          <div className="h-96">
            <CandlestickChart
              data={ohlcData}
              symbol="AAPL"
              height={384}
              showVolume={true}
              showMovingAverages={true}
              showSignals={true}
              enableZoom={false}
              enablePan={false}
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Technical Indicators */}
      <section className="space-y-4">
        <h2 className={cn(
          "text-2xl font-semibold text-center",
          theme === 'synthwave' ? "font-mono text-terminal-green" : "text-text-primary"
        )}>
          {theme === 'synthwave' ? '> TECHNICAL INDICATORS' : 'Technical Indicators'}
        </h2>
        
        {/* Indicator Selector */}
        <div className="flex justify-center gap-2">
          {indicators.map((ind) => (
            <button
              key={ind.value}
              onClick={() => setSelectedIndicator(ind.value as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                selectedIndicator === ind.value
                  ? theme === 'synthwave'
                    ? "bg-neon-purple text-bg-primary font-mono"
                    : "bg-accent-secondary text-white"
                  : theme === 'synthwave'
                    ? "bg-glass-surface border border-neon-cyan/30 text-neon-cyan font-mono hover:bg-neon-cyan/10"
                    : "bg-glass-light text-text-secondary hover:text-text-primary hover:bg-white/10"
              )}
            >
              {ind.label}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RSI Indicator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: selectedIndicator === 'rsi' ? 1 : 0.3, y: 0 }}
            className={cn(
              "p-6 rounded-xl",
              theme === 'synthwave' 
                ? "bg-glass-surface border border-neon-pink/30"
                : "glass-light"
            )}
          >
            <h3 className={cn(
              "text-lg font-medium mb-2",
              theme === 'synthwave' ? "font-mono text-neon-cyan" : "text-text-primary"
            )}>
              RSI (14)
            </h3>
            <p className={cn(
              "text-sm mb-4",
              theme === 'synthwave' ? "font-mono text-terminal-green/70" : "text-text-secondary"
            )}>
              {theme === 'synthwave' ? '> MOMENTUM OSCILLATOR' : 'Momentum Oscillator - Overbought/Oversold'}
            </p>
            <div className="h-32">
              <TradingChart
                data={technicalData.map(d => ({
                  datetime: d.timestamp,
                  open: d.rsi,
                  high: d.rsi,
                  low: d.rsi,
                  close: d.rsi,
                  volume: 0
                }))}
                symbol="RSI"
                height={128}
                chartType="line"
                enableZoom={false}
                enablePan={false}
                enableBrush={false}
                showVolume={false}
              />
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <span className={cn(
                theme === 'synthwave' ? "text-neon-cyan font-mono" : "text-text-secondary"
              )}>
                Current: {technicalData[technicalData.length - 1]?.rsi.toFixed(2)}
              </span>
              <span className={cn(
                technicalData[technicalData.length - 1]?.overbought 
                  ? "text-error-primary" 
                  : technicalData[technicalData.length - 1]?.oversold 
                    ? "text-success-primary" 
                    : theme === 'synthwave' ? "text-terminal-green" : "text-text-tertiary"
              )}>
                {technicalData[technicalData.length - 1]?.overbought 
                  ? 'Overbought' 
                  : technicalData[technicalData.length - 1]?.oversold 
                    ? 'Oversold' 
                    : 'Neutral'}
              </span>
            </div>
          </motion.div>
          
          {/* MACD Indicator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: selectedIndicator === 'macd' ? 1 : 0.3, y: 0 }}
            className={cn(
              "p-6 rounded-xl",
              theme === 'synthwave' 
                ? "bg-glass-surface border border-neon-pink/30"
                : "glass-light"
            )}
          >
            <h3 className={cn(
              "text-lg font-medium mb-2",
              theme === 'synthwave' ? "font-mono text-neon-cyan" : "text-text-primary"
            )}>
              MACD (12, 26, 9)
            </h3>
            <p className={cn(
              "text-sm mb-4",
              theme === 'synthwave' ? "font-mono text-terminal-green/70" : "text-text-secondary"
            )}>
              {theme === 'synthwave' ? '> TREND FOLLOWING' : 'Trend Following - Moving Average Convergence'}
            </p>
            <div className="h-32">
              <VolumeChart
                data={technicalData.map((d, i) => ({
                  datetime: d.timestamp,
                  volume: Math.abs(d.macdHist) * 1000000,
                  open: d.macd - 0.1,
                  high: d.macd + 0.1,
                  low: d.macd - 0.2,
                  close: d.macd,
                  priceChange: d.macdHist > 0 ? 1 : -1
                }))}
                height={128}
                colorByPrice={true}
              />
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <span className={cn(
                theme === 'synthwave' ? "text-neon-cyan font-mono" : "text-text-secondary"
              )}>
                MACD: {technicalData[technicalData.length - 1]?.macd.toFixed(3)}
              </span>
              <span className={cn(
                technicalData[technicalData.length - 1]?.macdHist > 0 
                  ? "text-success-primary" 
                  : "text-error-primary"
              )}>
                {technicalData[technicalData.length - 1]?.macdHist > 0 ? 'Bullish' : 'Bearish'}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Volume Analysis */}
      <section className="space-y-4">
        <h2 className={cn(
          "text-2xl font-semibold text-center",
          theme === 'synthwave' ? "font-mono text-terminal-green" : "text-text-primary"
        )}>
          {theme === 'synthwave' ? '> VOLUME ANALYSIS' : 'Volume Analysis'}
        </h2>
        
        <div className={cn(
          "p-6 rounded-xl",
          theme === 'synthwave' 
            ? "bg-glass-surface border border-neon-pink/30"
            : "glass-medium"
        )}>
          <div className="h-48">
            <VolumeChart
              data={volumeData}
              height={192}
              showSpikes={true}
              colorByPrice={true}
            />
          </div>
        </div>
      </section>

      {/* Market Comparison */}
      <section className="space-y-4">
        <h2 className={cn(
          "text-2xl font-semibold text-center",
          theme === 'synthwave' ? "font-mono text-terminal-green" : "text-text-primary"
        )}>
          {theme === 'synthwave' ? '> MARKET COMPARISON' : 'Market Comparison'}
        </h2>
        
        <div className={cn(
          "p-6 rounded-xl",
          theme === 'synthwave' 
            ? "bg-glass-surface border border-neon-pink/30"
            : "glass-medium"
        )}>
          <ComparisonChart
            symbols={comparisonData}
            height={300}
            showLegend={true}
          />
        </div>
      </section>

      {/* Market Heatmap */}
      <section className="space-y-4">
        <h2 className={cn(
          "text-2xl font-semibold text-center",
          theme === 'synthwave' ? "font-mono text-terminal-green" : "text-text-primary"
        )}>
          {theme === 'synthwave' ? '> SECTOR HEATMAP' : 'Sector Performance Heatmap'}
        </h2>
        
        <div className={cn(
          "p-6 rounded-xl",
          theme === 'synthwave' 
            ? "bg-glass-surface border border-neon-pink/30"
            : "glass-medium"
        )}>
          <MarketHeatmap
            data={heatmapData}
            height={400}
            viewMode="sectors"
          />
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="space-y-4">
        <h2 className={cn(
          "text-2xl font-semibold text-center",
          theme === 'synthwave' ? "font-mono text-terminal-green" : "text-text-primary"
        )}>
          {theme === 'synthwave' ? '> PERFORMANCE METRICS' : 'Performance Metrics'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Win Rate */}
          <div className={cn(
            "p-6 rounded-xl text-center",
            theme === 'synthwave' 
              ? "bg-glass-surface border border-neon-pink/30"
              : "glass-light"
          )}>
            <h3 className={cn(
              "text-lg font-medium mb-2",
              theme === 'synthwave' ? "font-mono text-neon-cyan" : "text-text-primary"
            )}>
              {theme === 'synthwave' ? 'WIN_RATE' : 'Win Rate'}
            </h3>
            <div className={cn(
              "text-3xl font-bold mb-2",
              theme === 'synthwave' ? "text-terminal-green font-mono" : "gradient-text"
            )}>
              73.8%
            </div>
            <div className="h-16">
              <MiniChart
                data={[
                  { datetime: '2024-01-01T00:00:00Z', open: 65, high: 65, low: 65, close: 65, volume: 0 },
                  { datetime: '2024-01-02T00:00:00Z', open: 68, high: 68, low: 68, close: 68, volume: 0 },
                  { datetime: '2024-01-03T00:00:00Z', open: 70, high: 70, low: 70, close: 70, volume: 0 },
                  { datetime: '2024-01-04T00:00:00Z', open: 72, high: 72, low: 72, close: 72, volume: 0 },
                  { datetime: '2024-01-05T00:00:00Z', open: 73.8, high: 73.8, low: 73.8, close: 73.8, volume: 0 }
                ]}
                height={64}
                color={theme === 'synthwave' ? '#10B981' : '#22C55E'}
                showTrend={true}
              />
            </div>
          </div>
          
          {/* Average Return */}
          <div className={cn(
            "p-6 rounded-xl text-center",
            theme === 'synthwave' 
              ? "bg-glass-surface border border-neon-pink/30"
              : "glass-light"
          )}>
            <h3 className={cn(
              "text-lg font-medium mb-2",
              theme === 'synthwave' ? "font-mono text-neon-cyan" : "text-text-primary"
            )}>
              {theme === 'synthwave' ? 'AVG_RETURN' : 'Avg Return'}
            </h3>
            <div className={cn(
              "text-3xl font-bold mb-2",
              theme === 'synthwave' ? "text-terminal-green font-mono" : "gradient-text"
            )}>
              +4.2%
            </div>
            <div className="h-16">
              <MiniChart
                data={[
                  { datetime: '2024-01-01T00:00:00Z', open: 2.1, high: 2.1, low: 2.1, close: 2.1, volume: 0 },
                  { datetime: '2024-01-02T00:00:00Z', open: 3.5, high: 3.5, low: 3.5, close: 3.5, volume: 0 },
                  { datetime: '2024-01-03T00:00:00Z', open: 3.8, high: 3.8, low: 3.8, close: 3.8, volume: 0 },
                  { datetime: '2024-01-04T00:00:00Z', open: 4.0, high: 4.0, low: 4.0, close: 4.0, volume: 0 },
                  { datetime: '2024-01-05T00:00:00Z', open: 4.2, high: 4.2, low: 4.2, close: 4.2, volume: 0 }
                ]}
                height={64}
                color={theme === 'synthwave' ? '#F59E0B' : '#3B82F6'}
                chartType="area"
              />
            </div>
          </div>
          
          {/* Sharpe Ratio */}
          <div className={cn(
            "p-6 rounded-xl text-center",
            theme === 'synthwave' 
              ? "bg-glass-surface border border-neon-pink/30"
              : "glass-light"
          )}>
            <h3 className={cn(
              "text-lg font-medium mb-2",
              theme === 'synthwave' ? "font-mono text-neon-cyan" : "text-text-primary"
            )}>
              {theme === 'synthwave' ? 'SHARPE' : 'Sharpe Ratio'}
            </h3>
            <div className={cn(
              "text-3xl font-bold mb-2",
              theme === 'synthwave' ? "text-terminal-green font-mono" : "gradient-text"
            )}>
              1.85
            </div>
            <div className="h-16">
              <MiniChart
                data={[
                  { datetime: '2024-01-01T00:00:00Z', open: 1.2, high: 1.2, low: 1.2, close: 1.2, volume: 0 },
                  { datetime: '2024-01-02T00:00:00Z', open: 1.5, high: 1.5, low: 1.5, close: 1.5, volume: 0 },
                  { datetime: '2024-01-03T00:00:00Z', open: 1.7, high: 1.7, low: 1.7, close: 1.7, volume: 0 },
                  { datetime: '2024-01-04T00:00:00Z', open: 1.8, high: 1.8, low: 1.8, close: 1.8, volume: 0 },
                  { datetime: '2024-01-05T00:00:00Z', open: 1.85, high: 1.85, low: 1.85, close: 1.85, volume: 0 }
                ]}
                height={64}
                color={theme === 'synthwave' ? '#EF4444' : '#8B5CF6'}
                showTrend={true}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}