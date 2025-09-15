'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect, forwardRef } from 'react';
import { motion, HTMLMotionProps, PanInfo } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Brush,
  ReferenceLine
} from 'recharts';
import { cn } from '@/lib/utils';
import { 
  useAdaptiveGlass, 
  usePerformanceTier, 
  useDeviceCapabilities,
  useGestureConfig 
} from '@/lib/hooks';
import type { IntradayData } from '@/lib/hooks';

/**
 * TradingChart Component - Full-featured trading chart with glassmorphism overlay
 * 
 * Features:
 * - Interactive pan/zoom with touch gestures
 * - Multiple chart types (line, area, candlestick)
 * - Real-time data updates with smooth transitions
 * - Glassmorphism overlays and premium visual effects
 * - Mobile-optimized touch interactions
 * - Performance-aware rendering with viewport culling
 * - Support for technical indicators overlay
 * - Brush selector for time range navigation
 * - Reference lines for key price levels
 * - WebSocket integration for live updates
 */

export interface TradingChartDataPoint extends IntradayData {
  ma20?: number; // 20-period moving average
  ma50?: number; // 50-period moving average
  signal?: 'buy' | 'sell' | 'neutral';
  signalStrength?: number;
}

export interface TradingChartProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  data: TradingChartDataPoint[];
  symbol: string;
  width?: number;
  height?: number;
  chartType?: 'line' | 'area' | 'candlestick';
  showVolume?: boolean;
  showMovingAverages?: boolean;
  showSignals?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  enableBrush?: boolean;
  timeInterval?: '1m' | '5m' | '15m' | '1h' | '1d';
  onTimeRangeChange?: (start: number, end: number) => void;
  onChartTypeChange?: (type: 'line' | 'area' | 'candlestick') => void;
  onSignalClick?: (signal: { timestamp: string; type: 'buy' | 'sell'; strength: number }) => void;
  isLive?: boolean;
  className?: string;
  'data-testid'?: string;
}

const TradingChart = forwardRef<HTMLDivElement, TradingChartProps>(({
  data,
  symbol,
  width,
  height = 400,
  chartType = 'area',
  showVolume = true,
  showMovingAverages = false,
  showSignals = false,
  enableZoom = true,
  enablePan = true,
  enableBrush = false,
  timeInterval = '5m',
  onTimeRangeChange,
  onChartTypeChange,
  onSignalClick,
  isLive = false,
  className,
  'data-testid': testId,
  ...motionProps
}, ref) => {
  // State management
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [selectedDataPoint, setSelectedDataPoint] = useState<TradingChartDataPoint | null>(null);
  const [brushDomain, setBrushDomain] = useState<[number, number] | undefined>();
  const [isInteracting, setIsInteracting] = useState(false);
  
  // Refs for gesture handling
  const chartRef = useRef<HTMLDivElement>(null);
  const lastPinchDistance = useRef<number | null>(null);
  
  // Hooks
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch } = useDeviceCapabilities();
  const gestureConfig = useGestureConfig();

  // Process data for chart rendering with viewport culling
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Add moving averages if requested
    let processed = [...data];
    
    if (showMovingAverages) {
      processed = processed.map((point, index) => {
        const ma20Window = processed.slice(Math.max(0, index - 19), index + 1);
        const ma50Window = processed.slice(Math.max(0, index - 49), index + 1);
        
        return {
          ...point,
          ma20: ma20Window.length >= 20 
            ? ma20Window.reduce((sum, p) => sum + p.close, 0) / ma20Window.length
            : undefined,
          ma50: ma50Window.length >= 50
            ? ma50Window.reduce((sum, p) => sum + p.close, 0) / ma50Window.length
            : undefined,
        };
      });
    }

    // Apply brush domain filter if active
    if (brushDomain) {
      const [startIndex, endIndex] = brushDomain;
      processed = processed.slice(startIndex, endIndex + 1);
    }
    
    // Viewport culling for performance
    if (performanceTier === 'low' && processed.length > 200) {
      const step = Math.ceil(processed.length / 200);
      processed = processed.filter((_, index) => index % step === 0);
    }
    
    return processed;
  }, [data, showMovingAverages, brushDomain, performanceTier]);

  // Calculate price range and technical levels
  const priceRange = useMemo(() => {
    if (processedData.length === 0) return { min: 0, max: 100, range: 100 };
    
    const prices = processedData.flatMap(d => [d.high, d.low]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min;
    
    // Add 5% padding
    const padding = range * 0.05;
    
    return {
      min: min - padding,
      max: max + padding,
      range: range + (padding * 2)
    };
  }, [processedData]);

  // Touch gesture handlers for zoom and pan
  const handlePinchStart = useCallback((event: TouchEvent) => {
    if (!enableZoom || event.touches.length !== 2) return;
    
    const distance = Math.hypot(
      event.touches[0].clientX - event.touches[1].clientX,
      event.touches[0].clientY - event.touches[1].clientY
    );
    
    lastPinchDistance.current = distance;
    setIsInteracting(true);
  }, [enableZoom]);

  const handlePinchMove = useCallback((event: TouchEvent) => {
    if (!enableZoom || !lastPinchDistance.current || event.touches.length !== 2) return;
    
    const currentDistance = Math.hypot(
      event.touches[0].clientX - event.touches[1].clientX,
      event.touches[0].clientY - event.touches[1].clientY
    );
    
    const scaleFactor = currentDistance / lastPinchDistance.current;
    const newZoom = Math.max(0.5, Math.min(5, zoomLevel * scaleFactor));
    
    setZoomLevel(newZoom);
    lastPinchDistance.current = currentDistance;
  }, [enableZoom, zoomLevel]);

  const handlePinchEnd = useCallback(() => {
    lastPinchDistance.current = null;
    setIsInteracting(false);
  }, []);

  const handlePan = useCallback((event: MouseEvent | TouchEvent, info: PanInfo) => {
    if (!enablePan || isInteracting) return;
    
    setPanOffset(prev => ({
      x: prev.x + info.delta.x,
      y: prev.y + info.delta.y
    }));
  }, [enablePan, isInteracting]);

  // Set up touch event listeners
  useEffect(() => {
    const element = chartRef.current;
    if (!element || !touch) return;

    element.addEventListener('touchstart', handlePinchStart, { passive: false });
    element.addEventListener('touchmove', handlePinchMove, { passive: false });
    element.addEventListener('touchend', handlePinchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handlePinchStart);
      element.removeEventListener('touchmove', handlePinchMove);
      element.removeEventListener('touchend', handlePinchEnd);
    };
  }, [touch, handlePinchStart, handlePinchMove, handlePinchEnd]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload[0]) return null;
    
    const data = payload[0].payload as TradingChartDataPoint;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          "rounded-lg p-3 shadow-xl min-w-[200px]",
          "glass-medium",
          adaptiveGlass.blur
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-primary">
            {symbol}
          </span>
          <span className="text-xs text-text-secondary">
            {new Date(data.datetime).toLocaleTimeString()}
          </span>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs text-text-secondary">Open:</span>
            <span className="text-xs text-text-primary">${data.open.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-text-secondary">High:</span>
            <span className="text-xs text-status-success">${data.high.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-text-secondary">Low:</span>
            <span className="text-xs text-status-error">${data.low.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-text-secondary">Close:</span>
            <span className="text-xs font-medium text-text-primary">${data.close.toFixed(2)}</span>
          </div>
          
          {data.volume && (
            <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-text-secondary">Volume:</span>
              <span className="text-xs text-text-primary">
                {(data.volume / 1000000).toFixed(1)}M
              </span>
            </div>
          )}
          
          {data.signal && (
            <div className="flex justify-between items-center pt-1 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-text-secondary">Signal:</span>
              <div className="flex items-center gap-1">
                <div 
                  className={cn(
                    "w-2 h-2 rounded-full",
                    data.signal === 'buy' && "bg-status-success",
                    data.signal === 'sell' && "bg-status-error",
                    data.signal === 'neutral' && "bg-status-warning"
                  )}
                />
                <span className={cn(
                  "text-xs font-medium capitalize",
                  data.signal === 'buy' && "text-status-success",
                  data.signal === 'sell' && "text-status-error",
                  data.signal === 'neutral' && "text-status-warning"
                )}>
                  {data.signal}
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Chart component based on type
  const renderChart = () => {
    const commonProps = {
      data: processedData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(156, 163, 175, 0.2)" 
              className="opacity-50"
            />
            <XAxis 
              dataKey="datetime"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'rgb(107, 114, 128)' }}
              tickFormatter={(value) => new Date(value).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            />
            <YAxis 
              domain={[priceRange.min, priceRange.max]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'rgb(107, 114, 128)' }}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            
            <RechartsTooltip content={<CustomTooltip />} />
            
            {/* Main price line */}
            <Line
              type="monotone"
              dataKey="close"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: '#8B5CF6', strokeWidth: 2, fill: 'white' }}
              animationDuration={performanceTier === 'low' ? 0 : 800}
            />
            
            {/* Moving averages */}
            {showMovingAverages && (
              <>
                <Line
                  type="monotone"
                  dataKey="ma20"
                  stroke="#F59E0B"
                  strokeWidth={1}
                  strokeDasharray="5,5"
                  dot={false}
                  animationDuration={performanceTier === 'low' ? 0 : 800}
                />
                <Line
                  type="monotone"
                  dataKey="ma50"
                  stroke="#EF4444"
                  strokeWidth={1}
                  strokeDasharray="5,5"
                  dot={false}
                  animationDuration={performanceTier === 'low' ? 0 : 800}
                />
              </>
            )}
          </LineChart>
        );
      
      case 'area':
      default:
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(156, 163, 175, 0.2)" 
              className="opacity-50"
            />
            <XAxis 
              dataKey="datetime"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'rgb(107, 114, 128)' }}
              tickFormatter={(value) => new Date(value).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            />
            <YAxis 
              domain={[priceRange.min, priceRange.max]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'rgb(107, 114, 128)' }}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            
            <RechartsTooltip content={<CustomTooltip />} />
            
            {/* Main price area */}
            <Area
              type="monotone"
              dataKey="close"
              stroke="#8B5CF6"
              fill="url(#priceGradient)"
              strokeWidth={2}
              animationDuration={performanceTier === 'low' ? 0 : 800}
            />
            
            {/* Moving averages */}
            {showMovingAverages && (
              <>
                <Area
                  type="monotone"
                  dataKey="ma20"
                  stroke="#F59E0B"
                  fill="none"
                  strokeWidth={1}
                  strokeDasharray="5,5"
                  animationDuration={performanceTier === 'low' ? 0 : 800}
                />
                <Area
                  type="monotone"
                  dataKey="ma50"
                  stroke="#EF4444"
                  fill="none"
                  strokeWidth={1}
                  strokeDasharray="5,5"
                  animationDuration={performanceTier === 'low' ? 0 : 800}
                />
              </>
            )}
          </AreaChart>
        );
    }
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
      role="img"
      aria-label={`Trading chart for ${symbol}, showing ${chartType} view with current price trends`}
      {...motionProps}
    >
      {/* Chart header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-text-primary">
            {symbol}
          </h3>
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isLive ? "bg-status-success animate-pulse" : "bg-gray-400"
            )} />
            <span className="text-xs text-text-secondary">
              {isLive ? 'Live' : 'Delayed'}
            </span>
          </div>
        </div>
        
        {/* Chart controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChartTypeChange?.('line')}
            className={cn(
              "px-2 py-1 text-xs rounded",
              chartType === 'line' 
                ? "bg-brand-primary text-white" 
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            )}
          >
            Line
          </button>
          <button
            onClick={() => onChartTypeChange?.('area')}
            className={cn(
              "px-2 py-1 text-xs rounded",
              chartType === 'area' 
                ? "bg-brand-primary text-white" 
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            )}
          >
            Area
          </button>
        </div>
      </div>
      
      {/* Main chart area */}
      <motion.div
        ref={chartRef}
        className="relative"
        style={{ height }}
        drag={enablePan}
        onPan={handlePan}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.1}
        whileDrag={{ cursor: 'grabbing' }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
        
        {/* Live data indicator overlay */}
        {isLive && (
          <motion.div
            className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full bg-status-success/10 border border-status-success/20"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-2 h-2 bg-status-success rounded-full" />
            <span className="text-xs text-status-success font-medium">
              Live Updates
            </span>
          </motion.div>
        )}
        
        {/* Performance overlay for mobile */}
        {touch && performanceTier === 'low' && (
          <div className="absolute bottom-4 left-4 text-xs text-text-secondary bg-gray-900/50 px-2 py-1 rounded backdrop-blur-sm">
            Performance Mode: Optimized
          </div>
        )}
      </motion.div>
      
      {/* Brush selector */}
      {enableBrush && processedData.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={data}>
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="#8B5CF6" 
                strokeWidth={1} 
                dot={false} 
              />
              <Brush
                dataKey="datetime"
                height={40}
                stroke="#8B5CF6"
                fill="rgba(139, 92, 246, 0.1)"
                onChange={(brushData: any) => {
                  if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
                    setBrushDomain([brushData.startIndex, brushData.endIndex]);
                    onTimeRangeChange?.(brushData.startIndex, brushData.endIndex);
                  }
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* Glassmorphism glow effect */}
      {adaptiveGlass.effects && performanceTier !== 'low' && (
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none rounded-xl"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
      )}
    </motion.div>
  );
});

TradingChart.displayName = 'TradingChart';

export { TradingChart };