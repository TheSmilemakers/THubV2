'use client';

import React, { useMemo, useState, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';
import type { IntradayData } from '@/lib/hooks';

/**
 * VolumeChart Component - Volume bars with gradient fills and glass effects
 * 
 * Features:
 * - Volume visualization with price-correlated coloring
 * - Gradient fills and glassmorphism overlays
 * - Touch-optimized interactions and hover states
 * - Moving average volume overlay (MAVOL)
 * - Volume spike detection and highlighting
 * - Responsive design with adaptive performance
 * - Support for different aggregation periods
 * - Real-time volume updates with smooth transitions
 */

export interface VolumeDataPoint extends IntradayData {
  volumeMA?: number; // Volume moving average
  priceChange?: number; // Price change for coloring
  isVolumeSpike?: boolean; // High volume indicator
  relativeVolume?: number; // Relative to average volume
}

export interface VolumeChartProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  data: VolumeDataPoint[];
  symbol?: string;
  width?: number;
  height?: number;
  showMovingAverage?: boolean;
  showSpikes?: boolean;
  colorByPrice?: boolean;
  aggregationPeriod?: '1m' | '5m' | '15m' | '1h' | '1d';
  onVolumeBarClick?: (volume: VolumeDataPoint) => void;
  onVolumeBarHover?: (volume: VolumeDataPoint | null) => void;
  showTooltip?: boolean;
  showGrid?: boolean;
  className?: string;
  'data-testid'?: string;
}

const VolumeChart = forwardRef<HTMLDivElement, VolumeChartProps>(({
  data,
  symbol,
  width,
  height = 200,
  showMovingAverage = false,
  showSpikes = true,
  colorByPrice = true,
  aggregationPeriod = '5m',
  onVolumeBarClick,
  onVolumeBarHover,
  showTooltip = true,
  showGrid = true,
  className,
  'data-testid': testId,
  ...motionProps
}, ref) => {
  const [hoveredBar, setHoveredBar] = useState<VolumeDataPoint | null>(null);
  
  // Hooks
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch } = useDeviceCapabilities();

  // Process and enhance volume data
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Sort data by timestamp
    const sorted = [...data].sort((a, b) => 
      new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );
    
    // Calculate price changes for coloring
    const withPriceChanges = sorted.map((point, index) => {
      const prevPoint = index > 0 ? sorted[index - 1] : null;
      const priceChange = prevPoint ? point.close - prevPoint.close : 0;
      
      return {
        ...point,
        priceChange,
        relativeVolume: 1 // Will be calculated below
      };
    });
    
    // Calculate moving average volume if requested
    if (showMovingAverage) {
      const windowSize = Math.min(20, Math.max(5, Math.floor(sorted.length / 10)));
      
      withPriceChanges.forEach((point, index) => {
        const start = Math.max(0, index - windowSize + 1);
        const window = withPriceChanges.slice(start, index + 1);
        const avgVolume = window.reduce((sum, p) => sum + p.volume, 0) / window.length;
        point.volumeMA = avgVolume;
      });
    }
    
    // Detect volume spikes
    if (showSpikes) {
      const avgVolume = withPriceChanges.reduce((sum, p) => sum + p.volume, 0) / withPriceChanges.length;
      const spikeThreshold = avgVolume * 2; // 200% of average
      
      withPriceChanges.forEach(point => {
        point.isVolumeSpike = point.volume >= spikeThreshold;
        point.relativeVolume = point.volume / avgVolume;
      });
    }
    
    // Performance optimization for low-end devices
    if (performanceTier === 'low' && withPriceChanges.length > 100) {
      const step = Math.ceil(withPriceChanges.length / 100);
      return withPriceChanges.filter((_, index) => index % step === 0);
    }
    
    return withPriceChanges;
  }, [data, showMovingAverage, showSpikes, performanceTier]);

  // Get bar colors based on configuration
  const getBarColor = (dataPoint: VolumeDataPoint, index: number) => {
    if (colorByPrice) {
      return (dataPoint.priceChange || 0) >= 0 ? '#22C55E' : '#EF4444';
    }
    
    // Volume intensity coloring
    const intensity = Math.min(1, (dataPoint.relativeVolume || 1) / 3);
    const baseOpacity = 0.6 + (intensity * 0.4);
    
    return `rgba(139, 92, 246, ${baseOpacity})`;
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload[0]) return null;
    
    const data = payload[0].payload as VolumeDataPoint;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          "rounded-lg p-3 shadow-xl min-w-[160px]",
          "glass-medium",
          adaptiveGlass.blur
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-secondary">
            {new Date(data.datetime).toLocaleString()}
          </span>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary">Volume:</span>
            <span className="text-xs font-medium text-text-primary">
              {(data.volume / 1000000).toFixed(1)}M
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary">Price:</span>
            <span className="text-xs text-text-primary">
              ${data.close.toFixed(2)}
            </span>
          </div>
          
          {data.priceChange !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Change:</span>
              <span className={cn(
                "text-xs font-medium",
                data.priceChange >= 0 ? "text-status-success" : "text-status-error"
              )}>
                {data.priceChange >= 0 ? '+' : ''}${data.priceChange.toFixed(2)}
              </span>
            </div>
          )}
          
          {data.volumeMA && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Avg Vol:</span>
              <span className="text-xs text-text-primary">
                {(data.volumeMA / 1000000).toFixed(1)}M
              </span>
            </div>
          )}
          
          {data.isVolumeSpike && (
            <div className="mt-2 pt-1 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-status-warning font-medium">
                Volume Spike ({data.relativeVolume?.toFixed(1)}x avg)
              </span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const handleBarClick = (data: any) => {
    if (onVolumeBarClick) {
      onVolumeBarClick(data);
    }
  };

  const handleMouseEnter = (data: any) => {
    setHoveredBar(data);
    onVolumeBarHover?.(data);
  };

  const handleMouseLeave = () => {
    setHoveredBar(null);
    onVolumeBarHover?.(null);
  };

  // Format volume for display
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(0)}K`;
    }
    return volume.toFixed(0);
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative w-full rounded-xl",
        "glass-light",
        adaptiveGlass.blur,
        className
      )}
      data-testid={testId}
      {...motionProps}
    >
      {/* Chart header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text-primary">
            Volume {symbol && `- ${symbol}`}
          </h3>
          <span className="text-xs text-text-secondary">
            {aggregationPeriod}
          </span>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          {colorByPrice && (
            <>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-status-success rounded" />
                <span className="text-text-secondary">Up</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-status-error rounded" />
                <span className="text-text-secondary">Down</span>
              </div>
            </>
          )}
          
          {showSpikes && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-status-warning rounded animate-pulse" />
              <span className="text-text-secondary">Spike</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Main chart */}
      <div className="px-4 pb-4" style={{ height: height - 60 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedData}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <defs>
              {/* Gradient definitions for enhanced visual effects */}
              <linearGradient id="volumeGradientUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C55E" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#22C55E" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="volumeGradientDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="volumeGradientNeutral" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.4" />
              </linearGradient>
              
              {/* Glow filter for high-end devices */}
              {adaptiveGlass.effects && performanceTier === 'high' && (
                <filter id="volumeGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              )}
            </defs>
            
            {/* Grid */}
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(156, 163, 175, 0.2)"
                className="opacity-50"
              />
            )}
            
            {/* Axes */}
            <XAxis
              dataKey="datetime"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'rgb(107, 114, 128)' }}
              tickFormatter={(value) => new Date(value).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'rgb(107, 114, 128)' }}
              tickFormatter={formatVolume}
              width={40}
            />
            
            {/* Tooltip */}
            {showTooltip && <RechartsTooltip content={<CustomTooltip />} />}
            
            {/* Volume bars */}
            <Bar
              dataKey="volume"
              cursor="pointer"
              animationDuration={performanceTier === 'low' ? 0 : 600}
              onClick={handleBarClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {processedData.map((entry, index) => {
                const baseColor = getBarColor(entry, index);
                let fillColor = baseColor;
                
                // Use gradients for enhanced visual appeal
                if (colorByPrice && adaptiveGlass.effects) {
                  fillColor = (entry.priceChange || 0) >= 0 
                    ? 'url(#volumeGradientUp)' 
                    : 'url(#volumeGradientDown)';
                } else if (!colorByPrice && adaptiveGlass.effects) {
                  fillColor = 'url(#volumeGradientNeutral)';
                }
                
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={fillColor}
                    stroke={entry.isVolumeSpike ? '#F59E0B' : 'none'}
                    strokeWidth={entry.isVolumeSpike ? 1 : 0}
                    filter={adaptiveGlass.effects && performanceTier === 'high' ? 'url(#volumeGlow)' : undefined}
                    opacity={hoveredBar === entry ? 0.8 : 1}
                  />
                );
              })}
            </Bar>
            
            {/* Moving average overlay */}
            {showMovingAverage && (
              <Bar
                dataKey="volumeMA"
                fill="rgba(139, 92, 246, 0.3)"
                stroke="#8B5CF6"
                strokeWidth={1}
                strokeDasharray="3,3"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Performance indicator */}
      {touch && performanceTier === 'low' && (
        <div className="absolute bottom-2 right-2 text-xs text-text-secondary opacity-50">
          Optimized
        </div>
      )}
      
      {/* Glass glow effect for high-end devices */}
      {adaptiveGlass.effects && performanceTier !== 'low' && (
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none rounded-xl"
          style={{
            background: 'radial-gradient(circle at 50% 80%, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
            filter: 'blur(15px)',
          }}
        />
      )}
    </motion.div>
  );
});

VolumeChart.displayName = 'VolumeChart';

export { VolumeChart };

// Convenience variants for different use cases
export const PriceVolumeChart = (props: Omit<VolumeChartProps, 'colorByPrice' | 'showGrid'>) => (
  <VolumeChart 
    colorByPrice={true} 
    showGrid={true} 
    {...props} 
  />
);

export const SimpleVolumeChart = (props: Omit<VolumeChartProps, 'showMovingAverage' | 'showSpikes' | 'showGrid'>) => (
  <VolumeChart 
    showMovingAverage={false} 
    showSpikes={false} 
    showGrid={false} 
    {...props} 
  />
);

export const DetailedVolumeChart = (props: Omit<VolumeChartProps, 'showMovingAverage' | 'showSpikes' | 'colorByPrice'>) => (
  <VolumeChart 
    showMovingAverage={true} 
    showSpikes={true} 
    colorByPrice={true} 
    {...props} 
  />
);