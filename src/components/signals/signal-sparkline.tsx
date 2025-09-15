'use client';

import React, { useMemo, useState, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';

/**
 * SignalSparkline Component - Micro chart for signal trend visualization
 * 
 * Features:
 * - Smooth SVG path animation with gradient fills
 * - Touch-optimized hover interactions
 * - Performance-aware rendering
 * - Multiple visualization modes (line, area, bars)
 * - Real-time data updates with smooth transitions
 * - Mobile-first responsive design
 */

export interface SparklineDataPoint {
  value: number;
  timestamp: string;
  label?: string;
}

export interface SignalSparklineProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  data: SparklineDataPoint[];
  width?: number;
  height?: number;
  mode?: 'line' | 'area' | 'bars';
  color?: string;
  strokeWidth?: number;
  showDots?: boolean;
  showTooltip?: boolean;
  animationDuration?: number;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  'data-testid'?: string;
}

const SignalSparkline = forwardRef<HTMLDivElement, SignalSparklineProps>(({
  data,
  width = 120,
  height = 40,
  mode = 'area',
  color = '#8B5CF6',
  strokeWidth = 2,
  showDots = false,
  showTooltip = true,
  animationDuration = 800,
  trend,
  className,
  'data-testid': testId,
  ...motionProps
}, ref) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch } = useDeviceCapabilities();
  
  // Process data for SVG rendering
  const processedData = useMemo(() => {
    if (data.length === 0) return { points: [], min: 0, max: 100, pathD: '', areaD: '' };
    
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1; // Prevent division by zero
    
    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((point.value - min) / range) * height;
      return { x, y, ...point };
    });
    
    // Generate SVG path
    const pathD = points.length > 0 
      ? `M ${points[0].x} ${points[0].y} ` + 
        points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
      : '';
    
    // Generate area path (for filled mode)
    const areaD = points.length > 0 
      ? `M ${points[0].x} ${height} L ${points[0].x} ${points[0].y} ` +
        points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') +
        ` L ${points[points.length - 1].x} ${height} Z`
      : '';
    
    return { points, min, max, pathD, areaD };
  }, [data, width, height]);

  // Determine trend if not provided
  const calculatedTrend = useMemo(() => {
    if (trend) return trend;
    if (processedData.points.length < 2) return 'neutral';
    
    const first = processedData.points[0].value;
    const last = processedData.points[processedData.points.length - 1].value;
    const change = ((last - first) / first) * 100;
    
    if (change > 2) return 'up';
    if (change < -2) return 'down';
    return 'neutral';
  }, [trend, processedData.points]);

  // Get trend-based colors
  const getTrendColor = () => {
    switch (calculatedTrend) {
      case 'up': return '#22C55E';
      case 'down': return '#EF4444';
      default: return color;
    }
  };

  const trendColor = getTrendColor();

  // Animation effect
  React.useEffect(() => {
    if (performanceTier === 'low') {
      setAnimationProgress(1);
      return;
    }

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Ease-out cubic animation
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimationProgress(eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [animationDuration, performanceTier, data]);

  // Generate bars for bar mode
  const generateBars = () => {
    if (mode !== 'bars') return null;
    
    const barWidth = width / processedData.points.length * 0.8;
    const barSpacing = width / processedData.points.length * 0.2;
    
    return processedData.points.map((point, index) => {
      const barHeight = ((point.value - processedData.min) / (processedData.max - processedData.min)) * height;
      const x = index * (barWidth + barSpacing);
      const y = height - barHeight;
      
      return (
        <rect
          key={index}
          x={x}
          y={y}
          width={barWidth}
          height={barHeight * animationProgress}
          fill={trendColor}
          opacity={hoveredPoint === index ? 0.8 : 0.6}
          className="transition-opacity duration-200"
          onMouseEnter={() => !touch && setHoveredPoint(index)}
          onMouseLeave={() => !touch && setHoveredPoint(null)}
        />
      );
    });
  };

  // Generate dots for line/area mode
  const generateDots = () => {
    if (!showDots || mode === 'bars') return null;
    
    return processedData.points.map((point, index) => (
      <circle
        key={index}
        cx={point.x}
        cy={point.y}
        r={hoveredPoint === index ? 4 : 2}
        fill={trendColor}
        stroke="white"
        strokeWidth="1"
        opacity={animationProgress}
        className={cn(
          "transition-all duration-200",
          showTooltip && "cursor-pointer"
        )}
        onMouseEnter={() => !touch && setHoveredPoint(index)}
        onMouseLeave={() => !touch && setHoveredPoint(null)}
        onClick={() => touch && setHoveredPoint(hoveredPoint === index ? null : index)}
      />
    ));
  };

  // Tooltip component
  const Tooltip = () => {
    if (!showTooltip || hoveredPoint === null || !processedData.points[hoveredPoint]) return null;
    
    const point = processedData.points[hoveredPoint];
    const tooltipX = point.x > width / 2 ? point.x - 60 : point.x + 10;
    const tooltipY = point.y > height / 2 ? point.y - 40 : point.y + 10;
    
    return (
      <motion.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
      >
        {/* Tooltip background */}
        <rect
          x={tooltipX}
          y={tooltipY}
          width="50"
          height="25"
          rx="4"
          fill="rgba(0,0,0,0.9)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
        />
        
        {/* Tooltip text */}
        <text
          x={tooltipX + 25}
          y={tooltipY + 12}
          textAnchor="middle"
          className="text-xs font-medium fill-white"
          dominantBaseline="middle"
        >
          {point.value.toFixed(1)}
        </text>
        
        <text
          x={tooltipX + 25}
          y={tooltipY + 20}
          textAnchor="middle"
          className="text-[10px] fill-gray-300"
          dominantBaseline="middle"
        >
          {point.label || new Date(point.timestamp).toLocaleDateString()}
        </text>
      </motion.g>
    );
  };

  // Calculate trend percentage
  const trendPercentage = useMemo(() => {
    if (processedData.points.length < 2) return 0;
    
    const first = processedData.points[0].value;
    const last = processedData.points[processedData.points.length - 1].value;
    return ((last - first) / first) * 100;
  }, [processedData.points]);

  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative inline-flex flex-col",
        className
      )}
      data-testid={testId}
      {...motionProps}
    >
      {/* Sparkline chart */}
      <div className="relative">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id={`sparklineGradient-${testId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={trendColor} stopOpacity="0.6" />
              <stop offset="100%" stopColor={trendColor} stopOpacity="0.1" />
            </linearGradient>
            
            {adaptiveGlass.effects && (
              <filter id={`sparklineGlow-${testId}`}>
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            )}
          </defs>
          
          {/* Area fill */}
          {mode === 'area' && (
            <path
              d={processedData.areaD}
              fill={`url(#sparklineGradient-${testId})`}
              className="transition-all duration-300"
              style={{
                clipPath: `inset(0 ${100 - animationProgress * 100}% 0 0)`
              }}
            />
          )}
          
          {/* Line path */}
          {(mode === 'line' || mode === 'area') && (
            <path
              d={processedData.pathD}
              fill="none"
              stroke={trendColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
              style={{
                filter: adaptiveGlass.effects ? `url(#sparklineGlow-${testId})` : undefined,
                strokeDasharray: performanceTier !== 'low' ? 1 : undefined,
                strokeDashoffset: performanceTier !== 'low' ? 1 - animationProgress : 0,
              } as React.CSSProperties}
            />
          )}
          
          {/* Bars */}
          {generateBars()}
          
          {/* Data points */}
          {generateDots()}
          
          {/* Tooltip */}
          <Tooltip />
        </svg>
        
        {/* Glow effect for high-end devices */}
        {adaptiveGlass.effects && performanceTier === 'high' && (
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none rounded"
            style={{
              background: `radial-gradient(circle, ${trendColor}40 0%, transparent 70%)`,
              filter: 'blur(8px)',
            }}
          />
        )}
      </div>
      
      {/* Trend indicator */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: trendColor }}
          />
          <span className="text-xs text-text-tertiary capitalize">
            {calculatedTrend}
          </span>
        </div>
        
        <span 
          className={cn(
            "text-xs font-medium",
            calculatedTrend === 'up' && "text-status-success",
            calculatedTrend === 'down' && "text-status-error",
            calculatedTrend === 'neutral' && "text-text-secondary"
          )}
        >
          {trendPercentage > 0 ? '+' : ''}{trendPercentage.toFixed(1)}%
        </span>
      </div>
    </motion.div>
  );
});

SignalSparkline.displayName = 'SignalSparkline';

export { SignalSparkline };

// Convenience components for different modes
export const LineSparkline = (props: Omit<SignalSparklineProps, 'mode'>) => (
  <SignalSparkline mode="line" {...props} />
);

export const AreaSparkline = (props: Omit<SignalSparklineProps, 'mode'>) => (
  <SignalSparkline mode="area" {...props} />
);

export const BarSparkline = (props: Omit<SignalSparklineProps, 'mode'>) => (
  <SignalSparkline mode="bars" {...props} />
);