'use client';

import React, { useMemo, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SignalSparkline, type SignalSparklineProps, type SparklineDataPoint } from '@/components/signals/signal-sparkline';
import type { IntradayData } from '@/lib/hooks';

/**
 * SparklineChart Component - Tiny trend indicators extending SignalSparkline
 * 
 * Features:
 * - Extends existing SignalSparkline with additional chart functionality
 * - Multiple display modes for different contexts
 * - Ultra-compact design for inline usage
 * - Enhanced color schemes for different data types
 * - Batch processing for multiple sparklines
 * - Real-time update optimization
 */

export interface SparklineChartDataPoint {
  value: number;
  timestamp: string;
  label?: string;
  volume?: number;
  change?: number;
}

export interface SparklineChartProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  data: SparklineChartDataPoint[] | IntradayData[];
  width?: number;
  height?: number;
  mode?: 'line' | 'area' | 'bars';
  variant?: 'default' | 'volume' | 'performance' | 'sentiment';
  showValue?: boolean;
  showChange?: boolean;
  showTooltip?: boolean;
  color?: string;
  label?: string;
  animated?: boolean;
  className?: string;
  'data-testid'?: string;
}

const SparklineChart = forwardRef<HTMLDivElement, SparklineChartProps>(({
  data,
  width = 80,
  height = 24,
  mode = 'area',
  variant = 'default',
  showValue = false,
  showChange = false,
  showTooltip = false,
  color,
  label,
  animated = true,
  className,
  'data-testid': testId,
  ...motionProps
}, ref) => {
  // Convert IntradayData to SparklineDataPoint format
  const sparklineData: SparklineDataPoint[] = useMemo(() => {
    return data.map(point => {
      if ('close' in point) {
        // IntradayData format
        return {
          value: point.close,
          timestamp: point.datetime,
          label: new Date(point.datetime).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        };
      } else {
        // Already in SparklineDataPoint format
        return point as SparklineDataPoint;
      }
    });
  }, [data]);

  // Get variant-specific configurations
  const getVariantConfig = () => {
    switch (variant) {
      case 'volume':
        return {
          color: color || '#F59E0B',
          mode: 'bars' as const,
          strokeWidth: 1
        };
      case 'performance':
        return {
          color: color || '#8B5CF6',
          mode: 'area' as const,
          strokeWidth: 1.5
        };
      case 'sentiment':
        return {
          color: color || '#06B6D4',
          mode: 'line' as const,
          strokeWidth: 2
        };
      default:
        return {
          color: color || '#22C55E',
          mode: mode,
          strokeWidth: 1.5
        };
    }
  };

  const variantConfig = getVariantConfig();

  // Calculate current value and change
  const currentValue = useMemo(() => {
    if (sparklineData.length === 0) return 0;
    return sparklineData[sparklineData.length - 1].value;
  }, [sparklineData]);

  const changePercent = useMemo(() => {
    if (sparklineData.length < 2) return 0;
    const first = sparklineData[0].value;
    const last = sparklineData[sparklineData.length - 1].value;
    return ((last - first) / first) * 100;
  }, [sparklineData]);

  const trend = changePercent >= 0 ? 'up' : 'down';

  // Format value based on variant
  const formatValue = (value: number) => {
    switch (variant) {
      case 'volume':
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
        return value.toFixed(0);
      case 'performance':
        return `${value.toFixed(1)}%`;
      case 'sentiment':
        return value.toFixed(2);
      default:
        return `$${value.toFixed(2)}`;
    }
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        "flex items-center gap-2",
        className
      )}
      data-testid={testId}
      {...motionProps}
    >
      {/* Optional label */}
      {label && (
        <span className="text-xs text-text-secondary font-medium min-w-max">
          {label}
        </span>
      )}
      
      {/* Sparkline chart */}
      <div className="flex-shrink-0">
        <SignalSparkline
          data={sparklineData}
          width={width}
          height={height}
          mode={variantConfig.mode}
          color={variantConfig.color}
          strokeWidth={variantConfig.strokeWidth}
          showDots={variant === 'sentiment'}
          showTooltip={showTooltip}
          animationDuration={animated ? 600 : 0}
          trend={trend}
          data-testid={`${testId}-sparkline`}
        />
      </div>
      
      {/* Value and change display */}
      {(showValue || showChange) && (
        <div className="flex flex-col items-end min-w-max">
          {showValue && (
            <span className="text-xs font-medium text-text-primary">
              {formatValue(currentValue)}
            </span>
          )}
          
          {showChange && (
            <span className={cn(
              "text-xs font-medium",
              trend === 'up' && "text-status-success",
              trend === 'down' && "text-status-error"
            )}>
              {changePercent >= 0 ? '+' : ''}{(Number(changePercent) || 0).toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
});

SparklineChart.displayName = 'SparklineChart';

export { SparklineChart };

// Specialized variants for different use cases
export const PriceSparkline = (props: Omit<SparklineChartProps, 'variant' | 'showValue'>) => (
  <SparklineChart 
    variant="default" 
    showValue={true}
    {...props} 
  />
);

export const VolumeSparkline = (props: Omit<SparklineChartProps, 'variant' | 'mode'>) => (
  <SparklineChart 
    variant="volume" 
    mode="bars"
    {...props} 
  />
);

export const PerformanceSparkline = (props: Omit<SparklineChartProps, 'variant' | 'showChange'>) => (
  <SparklineChart 
    variant="performance" 
    showChange={true}
    {...props} 
  />
);

export const SentimentSparkline = (props: Omit<SparklineChartProps, 'variant' | 'showTooltip'>) => (
  <SparklineChart 
    variant="sentiment" 
    showTooltip={true}
    {...props} 
  />
);

// Batch sparkline component for rendering multiple sparklines efficiently
export interface BatchSparklineProps {
  sparklines: Array<{
    id: string;
    label: string;
    data: SparklineChartDataPoint[] | IntradayData[];
    variant?: SparklineChartProps['variant'];
    color?: string;
  }>;
  width?: number;
  height?: number;
  showValues?: boolean;
  showChanges?: boolean;
  className?: string;
}

export const BatchSparklines: React.FC<BatchSparklineProps> = ({
  sparklines,
  width = 60,
  height = 20,
  showValues = false,
  showChanges = false,
  className
}) => {
  return (
    <div className={cn("space-y-1", className)}>
      {sparklines.map((sparkline) => (
        <SparklineChart
          key={sparkline.id}
          data={sparkline.data}
          width={width}
          height={height}
          variant={sparkline.variant}
          color={sparkline.color}
          label={sparkline.label}
          showValue={showValues}
          showChange={showChanges}
          data-testid={`batch-sparkline-${sparkline.id}`}
        />
      ))}
    </div>
  );
};

// Inline sparkline for text integration
export interface InlineSparklineProps extends Omit<SparklineChartProps, 'width' | 'height' | 'showValue' | 'showChange' | 'label'> {
  size?: 'sm' | 'md';
}

export const InlineSparkline = forwardRef<HTMLDivElement, InlineSparklineProps>(({
  size = 'sm',
  className,
  ...props
}, ref) => {
  const dimensions = size === 'sm' ? { width: 40, height: 16 } : { width: 60, height: 20 };
  
  return (
    <SparklineChart
      ref={ref}
      width={dimensions.width}
      height={dimensions.height}
      showValue={false}
      showChange={false}
      animated={false}
      className={cn("inline-flex", className)}
      {...props}
    />
  );
});

InlineSparkline.displayName = 'InlineSparkline';