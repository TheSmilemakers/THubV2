'use client';

import React, { useMemo, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';
import type { IntradayData } from '@/lib/hooks';

/**
 * MiniChart Component - Compact chart for cards and previews
 * 
 * Features:
 * - Minimal interface optimized for small spaces
 * - Touch-optimized interactions with haptic feedback
 * - Performance-aware rendering with simplified animations
 * - Glassmorphism integration with card layouts
 * - Real-time data updates with smooth transitions
 * - Mobile-first responsive design
 * - Auto-sizing based on container
 */

export interface MiniChartDataPoint extends IntradayData {
  trend?: 'up' | 'down' | 'neutral';
}

export interface MiniChartProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  data: MiniChartDataPoint[];
  symbol?: string;
  width?: number;
  height?: number;
  chartType?: 'line' | 'area';
  showTrend?: boolean;
  showChange?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  changePercent?: number;
  color?: string;
  interactive?: boolean;
  onClick?: () => void;
  onHover?: (isHovered: boolean) => void;
  className?: string;
  'data-testid'?: string;
}

const MiniChart = forwardRef<HTMLDivElement, MiniChartProps>(({
  data,
  symbol,
  width,
  height = 80,
  chartType = 'area',
  showTrend = true,
  showChange = false,
  trend,
  changePercent,
  color,
  interactive = false,
  onClick,
  onHover,
  className,
  'data-testid': testId,
  ...motionProps
}, ref) => {
  // Hooks
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch } = useDeviceCapabilities();

  // Process and optimize data for mini chart display
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    let processed = [...data];
    
    // Limit data points for performance on low-end devices
    if (performanceTier === 'low' && processed.length > 50) {
      const step = Math.ceil(processed.length / 50);
      processed = processed.filter((_, index) => index % step === 0);
    } else if (processed.length > 100) {
      // Even on mid/high tier, limit for mini charts
      const step = Math.ceil(processed.length / 100);
      processed = processed.filter((_, index) => index % step === 0);
    }
    
    return processed;
  }, [data, performanceTier]);

  // Calculate trend and change if not provided
  const calculatedTrend = useMemo(() => {
    if (trend) return trend;
    if (processedData.length < 2) return 'neutral';
    
    const first = processedData[0].close;
    const last = processedData[processedData.length - 1].close;
    const change = ((last - first) / first) * 100;
    
    if (change > 1) return 'up';
    if (change < -1) return 'down';
    return 'neutral';
  }, [trend, processedData]);

  const calculatedChangePercent = useMemo(() => {
    if (changePercent !== undefined) return changePercent;
    if (processedData.length < 2) return 0;
    
    const first = processedData[0].close;
    const last = processedData[processedData.length - 1].close;
    return ((last - first) / first) * 100;
  }, [changePercent, processedData]);

  // Get trend-based colors
  const getTrendColor = () => {
    if (color) return color;
    
    switch (calculatedTrend) {
      case 'up': return '#22C55E';
      case 'down': return '#EF4444';
      default: return '#8B5CF6';
    }
  };

  const trendColor = getTrendColor();

  // Calculate price range for chart scaling
  const priceRange = useMemo(() => {
    if (processedData.length === 0) return { min: 0, max: 100 };
    
    const prices = processedData.map(d => d.close);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    // Add minimal padding for better visual
    const range = max - min;
    const padding = range * 0.1;
    
    return {
      min: min - padding,
      max: max + padding
    };
  }, [processedData]);

  // Chart component based on type
  const renderChart = () => {
    if (processedData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-xs text-text-tertiary">
          No data
        </div>
      );
    }

    const commonProps = {
      data: processedData,
      margin: { top: 5, right: 5, left: 5, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart {...commonProps}>
              <Line
                type="monotone"
                dataKey="close"
                stroke={trendColor}
                strokeWidth={1.5}
                dot={false}
                animationDuration={performanceTier === 'low' ? 0 : 400}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'area':
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart {...commonProps}>
              <defs>
                <linearGradient id={`miniGradient-${testId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={trendColor} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={trendColor} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              
              <Area
                type="monotone"
                dataKey="close"
                stroke={trendColor}
                fill={`url(#miniGradient-${testId})`}
                strokeWidth={1.5}
                animationDuration={performanceTier === 'low' ? 0 : 400}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  };

  const handleClick = () => {
    if (!interactive) return;
    onClick?.();
  };

  const handleHoverStart = () => {
    if (!interactive) return;
    onHover?.(true);
  };

  const handleHoverEnd = () => {
    if (!interactive) return;
    onHover?.(false);
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative flex flex-col",
        interactive && "cursor-pointer",
        className
      )}
      onClick={handleClick}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      data-testid={testId}
      whileHover={interactive && performanceTier !== 'low' ? { scale: 1.02 } : undefined}
      whileTap={interactive && touch ? { scale: 0.98 } : undefined}
      {...motionProps}
    >
      {/* Chart header (optional) */}
      {(symbol || showChange) && (
        <div className="flex items-center justify-between mb-1 px-1">
          {symbol && (
            <span className="text-xs font-medium text-text-secondary">
              {symbol}
            </span>
          )}
          
          {showChange && (
            <div className="flex items-center gap-1">
              <span className={cn(
                "text-xs font-medium",
                calculatedTrend === 'up' && "text-status-success",
                calculatedTrend === 'down' && "text-status-error",
                calculatedTrend === 'neutral' && "text-text-secondary"
              )}>
                {calculatedChangePercent > 0 ? '+' : ''}{calculatedChangePercent.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Chart area */}
      <div 
        className="flex-1 min-h-0 relative"
        style={{ height: symbol || showChange ? height - 20 : height }}
      >
        {renderChart()}
        
        {/* Trend indicator overlay */}
        {showTrend && !showChange && (
          <div className="absolute bottom-1 right-1">
            <div 
              className={cn(
                "w-2 h-2 rounded-full",
                calculatedTrend === 'up' && "bg-status-success",
                calculatedTrend === 'down' && "bg-status-error",
                calculatedTrend === 'neutral' && "bg-status-warning"
              )}
            />
          </div>
        )}
        
        {/* Interactive overlay with glassmorphism */}
        {interactive && adaptiveGlass.effects && (
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div 
              className={cn(
                "absolute inset-0 rounded",
                adaptiveGlass.blur,
                "bg-gradient-to-br from-white/5 to-transparent"
              )}
            />
          </div>
        )}
        
        {/* Performance indicator for low-end devices */}
        {performanceTier === 'low' && (
          <div className="absolute top-1 left-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full opacity-30" />
          </div>
        )}
      </div>
      
      {/* Glass glow effect for high-end devices */}
      {adaptiveGlass.effects && performanceTier === 'high' && interactive && (
        <div 
          className="absolute inset-0 opacity-0 hover:opacity-20 transition-opacity duration-300 pointer-events-none rounded"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${trendColor}40 0%, transparent 70%)`,
            filter: 'blur(8px)',
          }}
        />
      )}
    </motion.div>
  );
});

MiniChart.displayName = 'MiniChart';

export { MiniChart };

// Convenience variants for common use cases
export const MiniLineChart = (props: Omit<MiniChartProps, 'chartType'>) => (
  <MiniChart chartType="line" {...props} />
);

export const MiniAreaChart = (props: Omit<MiniChartProps, 'chartType'>) => (
  <MiniChart chartType="area" {...props} />
);

// Preset configurations for different contexts
export const SignalMiniChart = (props: Omit<MiniChartProps, 'showTrend' | 'height' | 'interactive'>) => (
  <MiniChart 
    showTrend={true} 
    height={60} 
    interactive={true} 
    {...props} 
  />
);

export const CardMiniChart = (props: Omit<MiniChartProps, 'showChange' | 'height'>) => (
  <MiniChart 
    showChange={true} 
    height={80} 
    {...props} 
  />
);

export const DashboardMiniChart = (props: Omit<MiniChartProps, 'showTrend' | 'showChange' | 'height'>) => (
  <MiniChart 
    showTrend={true} 
    showChange={true} 
    height={100} 
    {...props} 
  />
);