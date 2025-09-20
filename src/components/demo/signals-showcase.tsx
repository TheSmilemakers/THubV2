'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Signal as DbSignal, SignalStrength, MarketType } from '@/types';
import { Signal, createMockSignal } from '@/types/signals.types';
import { 
  SignalCard, 
  CompactSignalCard, 
  DetailedSignalCard,
  ConvergenceRadar,
  SignalSparkline,
  SparklineDataPoint
} from '@/components/signals';
import { ChartsShowcase } from './charts-showcase';

/**
 * SignalsShowcase Component - Demonstrates all signal components with sample data
 * 
 * Features:
 * - Live preview of all signal component variants
 * - Interactive demo data with real-time updates
 * - Performance testing scenarios
 * - Mobile and desktop optimization showcase
 */

// Sample signal data for demonstration - using the UI-enhanced Signal type
const createSampleSignal = (overrides: Partial<Signal> = {}): Signal => {
  return createMockSignal({
    symbol: 'AAPL',
    convergence_score: 74,
    technical_score: 75,
    sentiment_score: 68,
    liquidity_score: 82,
    current_price: 185.32,
    entry_price: 184.50,
    stop_loss: 178.00,
    take_profit: 192.00,
    company_name: 'Apple Inc.',
    price_change_24h: 2.45,
    price_change_percent_24h: 1.34,
    volume_24h: 45000000,
    market_cap: 2850000000000,
    ...overrides
  });
};

const sampleSignals: Signal[] = [
  createSampleSignal(),
  createSampleSignal({
    id: 'demo-signal-2',
    symbol: 'TSLA',
    convergence_score: 45,
    signal_strength: 'hold' as const,
    technical_score: 52,
    sentiment_score: 38,
    liquidity_score: 45,
    current_price: 245.67,
    company_name: 'Tesla Inc.',
    price_change_24h: -3.21,
    price_change_percent_24h: -1.29
  }),
  createSampleSignal({
    id: 'demo-signal-3',
    symbol: 'NVDA',
    convergence_score: 88,
    signal_strength: 'strong_buy' as const,
    technical_score: 92,
    sentiment_score: 85,
    liquidity_score: 89,
    current_price: 486.23,
    company_name: 'NVIDIA Corporation',
    price_change_24h: 12.45,
    price_change_percent_24h: 2.63
  }),
];

// Sample sparkline data
const generateSparklineData = (trend: 'up' | 'down' | 'neutral' = 'neutral'): SparklineDataPoint[] => {
  const baseValue = 50;
  const points = 20;
  const data: SparklineDataPoint[] = [];
  
  for (let i = 0; i < points; i++) {
    let value = baseValue;
    
    if (trend === 'up') {
      value = baseValue + (i * 2) + Math.random() * 5;
    } else if (trend === 'down') {
      value = baseValue - (i * 1.5) + Math.random() * 5;
    } else {
      value = baseValue + Math.sin(i * 0.5) * 10 + Math.random() * 5;
    }
    
    data.push({
      value: Math.max(0, Math.min(100, value)),
      timestamp: new Date(Date.now() - (points - i) * 24 * 60 * 60 * 1000).toISOString(),
      label: `Day ${i + 1}`
    });
  }
  
  return data;
};

export function SignalsShowcase() {
  const [selectedSignal, setSelectedSignal] = useState<Signal>(sampleSignals[0]);
  const [activeTab, setActiveTab] = useState<'cards' | 'radar' | 'sparklines' | 'charts'>('cards');

  const handleSignalTap = (signal: Signal) => {
    console.log('Signal tapped:', signal.symbol);
    setSelectedSignal(signal);
  };

  const handleSignalLongPress = (signal: Signal) => {
    console.log('Signal long pressed:', signal.symbol);
  };

  const handleSignalSwipe = (signal: Signal, direction: 'left' | 'right') => {
    console.log('Signal swiped:', signal.symbol, direction);
  };

  const handleLayerClick = (layer: string, score: number) => {
    console.log('Radar layer clicked:', layer, score);
  };

  return (
    <div className="min-h-screen bg-background-primary p-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-text-primary">
          Signal Components Showcase
        </h1>
        <p className="text-text-secondary">
          Premium glassmorphism trading signal components with 60fps performance
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="flex glass-medium rounded-xl p-1">
          {[
            { id: 'cards', label: 'Signal Cards' },
            { id: 'radar', label: 'Convergence Radar' },
            { id: 'sparklines', label: 'Sparklines' },
            { id: 'charts', label: 'Charts & Indicators' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300",
                activeTab === tab.id
                  ? "bg-accent-primary text-white shadow-lg"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        {/* Signal Cards Tab */}
        {activeTab === 'cards' && (
          <>
            {/* Card Variants */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-text-primary text-center">
                Signal Card Variants
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Detailed Card */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-text-secondary text-center">
                    Detailed Card
                  </h3>
                  <DetailedSignalCard
                    signal={selectedSignal}
                    onTap={handleSignalTap}
                    onLongPress={handleSignalLongPress}
                    onSwipe={handleSignalSwipe}
                    data-testid="detailed-signal-card"
                  />
                </div>

                {/* Compact Card */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-text-secondary text-center">
                    Compact Card
                  </h3>
                  <CompactSignalCard
                    signal={selectedSignal}
                    onTap={handleSignalTap}
                    onLongPress={handleSignalLongPress}
                    onSwipe={handleSignalSwipe}
                    data-testid="compact-signal-card"
                  />
                </div>

                {/* Interactive Card */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-text-secondary text-center">
                    Interactive Card
                  </h3>
                  <SignalCard
                    signal={selectedSignal}
                    variant="detailed"
                    interactive={true}
                    showConvergenceBreakdown={true}
                    onTap={handleSignalTap}
                    onLongPress={handleSignalLongPress}
                    onSwipe={handleSignalSwipe}
                    data-testid="interactive-signal-card"
                  />
                </div>
              </div>
            </section>

            {/* Signal Gallery */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-text-primary text-center">
                Signal Performance Zones
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sampleSignals.map((signal) => (
                  <SignalCard
                    key={signal.id}
                    signal={signal}
                    variant="detailed"
                    onTap={handleSignalTap}
                    onLongPress={handleSignalLongPress}
                    onSwipe={handleSignalSwipe}
                    className={cn(
                      "cursor-pointer transition-all duration-300",
                      selectedSignal.id === signal.id && "ring-2 ring-accent-primary ring-offset-2 ring-offset-background-primary"
                    )}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {/* Convergence Radar Tab */}
        {activeTab === 'radar' && (
          <section className="space-y-8">
            <h2 className="text-2xl font-semibold text-text-primary text-center">
              3-Layer Convergence Analysis
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Large Interactive Radar */}
              <div className="flex justify-center">
                <ConvergenceRadar
                  signal={selectedSignal}
                  size={300}
                  interactive={true}
                  showLabels={true}
                  showGrid={true}
                  onLayerClick={handleLayerClick}
                  data-testid="main-convergence-radar"
                />
              </div>

              {/* Radar Variants */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-text-secondary">
                  Radar Size Variants
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {sampleSignals.map((signal) => (
                    <div 
                      key={signal.id}
                      className={cn(
                        "p-4 rounded-xl glass-light cursor-pointer transition-all duration-300",
                        selectedSignal.id === signal.id && "glass-medium ring-2 ring-accent-primary/50"
                      )}
                      onClick={() => setSelectedSignal(signal)}
                    >
                      <ConvergenceRadar
                        signal={signal}
                        size={150}
                        interactive={false}
                        showLabels={false}
                        showGrid={true}
                      />
                      <div className="mt-2 text-center">
                        <div className="text-sm font-medium text-text-primary">
                          {signal.symbol}
                        </div>
                        <div className="text-xs text-text-tertiary">
                          Score: {signal.convergence_score}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Sparklines Tab */}
        {activeTab === 'sparklines' && (
          <section className="space-y-8">
            <h2 className="text-2xl font-semibold text-text-primary text-center">
              Signal Trend Visualization
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sparkline Modes */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-text-secondary">
                  Visualization Modes
                </h3>
                
                <div className="space-y-4">
                  {[
                    { mode: 'area', trend: 'up', label: 'Area Chart (Bullish)' },
                    { mode: 'line', trend: 'neutral', label: 'Line Chart (Neutral)' },
                    { mode: 'bars', trend: 'down', label: 'Bar Chart (Bearish)' }
                  ].map((config) => (
                    <div key={config.mode} className="p-4 glass-light rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-text-secondary">
                          {config.label}
                        </span>
                      </div>
                      <SignalSparkline
                        data={generateSparklineData(config.trend as any)}
                        mode={config.mode as any}
                        width={200}
                        height={60}
                        showDots={config.mode !== 'bars'}
                        showTooltip={true}
                        trend={config.trend as any}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Signal Performance Grid */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-text-secondary">
                  Signal Performance Trends
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {sampleSignals.map((signal, index) => (
                    <div key={signal.id} className="p-4 glass-light rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-text-primary">
                            {signal.symbol}
                          </span>
                          <span className="text-sm text-text-tertiary">
                            Score: {signal.convergence_score}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-text-secondary">
                          ${signal.current_price?.toFixed(2)}
                        </span>
                      </div>
                      
                      <SignalSparkline
                        data={generateSparklineData(
                          signal.convergence_score >= 70 ? 'up' : 
                          signal.convergence_score >= 40 ? 'neutral' : 'down'
                        )}
                        mode="area"
                        width={300}
                        height={50}
                        showDots={true}
                        showTooltip={true}
                        color={
                          signal.convergence_score >= 70 ? '#22C55E' : 
                          signal.convergence_score >= 40 ? '#F59E0B' : '#EF4444'
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && (
          <ChartsShowcase />
        )}
      </motion.div>

      {/* Performance Info */}
      <div className="text-center p-6 glass-light rounded-xl">
        <h3 className="text-lg font-medium text-text-primary mb-2">
          Performance Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-text-secondary">
          <div>
            <strong>Target:</strong> 60fps on modern devices
          </div>
          <div>
            <strong>Touch:</strong> 44px minimum targets
          </div>
          <div>
            <strong>Responsive:</strong> Mobile-first design
          </div>
        </div>
      </div>
    </div>
  );
}