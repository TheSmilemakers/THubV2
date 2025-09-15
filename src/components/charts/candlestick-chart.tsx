'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect, forwardRef } from 'react';
import { motion, HTMLMotionProps, PanInfo } from 'framer-motion';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';
import { 
  useAdaptiveGlass, 
  usePerformanceTier, 
  useDeviceCapabilities,
  useGestureConfig 
} from '@/lib/hooks';
import type { IntradayData } from '@/lib/hooks';

/**
 * CandlestickChart Component - OHLC data visualization with mobile gestures
 * 
 * Features:
 * - Interactive candlestick visualization with touch gestures
 * - Pinch-to-zoom and pan support for mobile devices
 * - Real-time data updates with smooth animations
 * - Volume overlay with synchronized scaling
 * - Technical analysis support (SMA, EMA overlays)
 * - Performance-optimized rendering with viewport culling
 * - Glassmorphism tooltips and overlays
 * - Support for different timeframes and aggregation
 */

export interface CandlestickDataPoint extends IntradayData {
  sma20?: number;
  sma50?: number;
  ema12?: number;
  ema26?: number;
  signal?: 'buy' | 'sell' | 'neutral';
  signalStrength?: number;
}

export interface CandlestickChartProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  data: CandlestickDataPoint[];
  symbol: string;
  width?: number;
  height?: number;
  showVolume?: boolean;
  showMovingAverages?: boolean;
  showSignals?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  timeframe?: '1m' | '5m' | '15m' | '1h' | '1d';
  onCandleClick?: (candle: CandlestickDataPoint) => void;
  onSignalClick?: (signal: { timestamp: string; type: 'buy' | 'sell'; strength: number }) => void;
  isLive?: boolean;
  className?: string;
  'data-testid'?: string;
}

const CandlestickChart = forwardRef<HTMLDivElement, CandlestickChartProps>(({
  data,
  symbol,
  width,
  height = 400,
  showVolume = true,
  showMovingAverages = false,
  showSignals = false,
  enableZoom = true,
  enablePan = true,
  timeframe = '5m',
  onCandleClick,
  onSignalClick,
  isLive = false,
  className,
  'data-testid': testId,
  ...motionProps
}, ref) => {
  // State management
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [hoveredCandle, setHoveredCandle] = useState<CandlestickDataPoint | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  
  // Refs for gesture handling
  const chartRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lastPinchDistance = useRef<number | null>(null);
  
  // Hooks
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch } = useDeviceCapabilities();
  const gestureConfig = useGestureConfig();

  // Process and optimize data for candlestick rendering
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    let processed = [...data].sort((a, b) => 
      new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );
    
    // Viewport culling for performance
    if (performanceTier === 'low' && processed.length > 100) {
      const step = Math.ceil(processed.length / 100);
      processed = processed.filter((_, index) => index % step === 0);
    } else if (processed.length > 500) {
      // Even on high-end devices, limit for smooth interaction
      const step = Math.ceil(processed.length / 500);
      processed = processed.filter((_, index) => index % step === 0);
    }
    
    return processed;
  }, [data, performanceTier]);

  // Calculate chart dimensions and scales
  const chartDimensions = useMemo(() => {
    if (processedData.length === 0) return { priceMin: 0, priceMax: 100, volumeMax: 1000, candleWidth: 8 };
    
    const prices = processedData.flatMap(d => [d.high, d.low]);
    const volumes = processedData.map(d => d.volume);
    
    const priceMin = Math.min(...prices);
    const priceMax = Math.max(...prices);
    const volumeMax = Math.max(...volumes);
    
    // Calculate candle width based on available space and data points
    const availableWidth = (width || 800) - 80; // Account for margins
    const candleWidth = Math.max(2, Math.min(12, availableWidth / processedData.length * 0.8));
    
    return {
      priceMin: priceMin * 0.995, // 0.5% padding
      priceMax: priceMax * 1.005, // 0.5% padding
      volumeMax,
      candleWidth
    };
  }, [processedData, width]);

  // Touch gesture handlers
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

  // Mouse and touch handlers for candle interaction
  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || processedData.length === 0) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Find nearest candle based on x position
    const chartWidth = rect.width - 80; // Account for margins
    const candleIndex = Math.floor((x - 40) / (chartWidth / processedData.length));
    
    if (candleIndex >= 0 && candleIndex < processedData.length) {
      setHoveredCandle(processedData[candleIndex]);
      setHoveredPosition({ x, y });
    } else {
      setHoveredCandle(null);
      setHoveredPosition(null);
    }
  }, [processedData]);

  const handleMouseLeave = useCallback(() => {
    setHoveredCandle(null);
    setHoveredPosition(null);
  }, []);

  // Render individual candlestick
  const renderCandle = useCallback((candle: CandlestickDataPoint, index: number) => {
    const isGreen = candle.close >= candle.open;
    const candleColor = isGreen ? '#22C55E' : '#EF4444';
    
    // Calculate positions
    const chartWidth = (width || 800) - 80;
    const chartHeight = showVolume ? height * 0.7 : height - 80;
    const x = 40 + (index * (chartWidth / processedData.length));
    
    const priceRange = chartDimensions.priceMax - chartDimensions.priceMin;
    const highY = 40 + ((chartDimensions.priceMax - candle.high) / priceRange) * chartHeight;
    const lowY = 40 + ((chartDimensions.priceMax - candle.low) / priceRange) * chartHeight;
    const openY = 40 + ((chartDimensions.priceMax - candle.open) / priceRange) * chartHeight;
    const closeY = 40 + ((chartDimensions.priceMax - candle.close) / priceRange) * chartHeight;
    
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.max(2, Math.abs(closeY - openY));
    
    return (
      <g key={index}>
        {/* Wick */}
        <line
          x1={x}
          y1={highY}
          x2={x}
          y2={lowY}
          stroke={candleColor}
          strokeWidth={1}
          opacity={0.8}
        />
        
        {/* Body */}
        <rect
          x={x - chartDimensions.candleWidth / 2}
          y={bodyTop}
          width={chartDimensions.candleWidth}
          height={bodyHeight}
          fill={isGreen ? candleColor : 'white'}
          stroke={candleColor}
          strokeWidth={1}
          opacity={hoveredCandle === candle ? 0.8 : 1}
          className="cursor-pointer transition-opacity"
          onClick={() => onCandleClick?.(candle)}
        />
        
        {/* Signal indicators */}
        {showSignals && candle.signal && candle.signal !== 'neutral' && (
          <circle
            cx={x}
            cy={candle.signal === 'buy' ? lowY + 10 : highY - 10}
            r={3}
            fill={candle.signal === 'buy' ? '#22C55E' : '#EF4444'}
            className="cursor-pointer"
            onClick={() => onSignalClick?.({
              timestamp: candle.datetime,
              type: candle.signal as 'buy' | 'sell',
              strength: candle.signalStrength || 0
            })}
          />
        )}
      </g>
    );
  }, [width, height, showVolume, chartDimensions, processedData.length, hoveredCandle, showSignals, onCandleClick, onSignalClick]);

  // Render moving averages
  const renderMovingAverages = useCallback(() => {
    if (!showMovingAverages || processedData.length === 0) return null;
    
    const chartWidth = (width || 800) - 80;
    const chartHeight = showVolume ? height * 0.7 : height - 80;
    const priceRange = chartDimensions.priceMax - chartDimensions.priceMin;
    
    const sma20Path = processedData
      .filter(d => d.sma20)
      .map((d, i) => {
        const x = 40 + (i * (chartWidth / processedData.length));
        const y = 40 + ((chartDimensions.priceMax - d.sma20!) / priceRange) * chartHeight;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
    
    const sma50Path = processedData
      .filter(d => d.sma50)
      .map((d, i) => {
        const x = 40 + (i * (chartWidth / processedData.length));
        const y = 40 + ((chartDimensions.priceMax - d.sma50!) / priceRange) * chartHeight;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
    
    return (
      <g>
        {sma20Path && (
          <path
            d={sma20Path}
            fill="none"
            stroke="#F59E0B"
            strokeWidth={1.5}
            strokeDasharray="3,3"
            opacity={0.8}
          />
        )}
        {sma50Path && (
          <path
            d={sma50Path}
            fill="none"
            stroke="#8B5CF6"
            strokeWidth={1.5}
            strokeDasharray="3,3"
            opacity={0.8}
          />
        )}
      </g>
    );
  }, [showMovingAverages, processedData, width, height, showVolume, chartDimensions]);

  // Render volume bars
  const renderVolume = useCallback(() => {
    if (!showVolume || processedData.length === 0) return null;
    
    const chartWidth = (width || 800) - 80;
    const volumeHeight = height * 0.25;
    const volumeY = height * 0.75;
    
    return (
      <g>
        {processedData.map((candle, index) => {
          const x = 40 + (index * (chartWidth / processedData.length));
          const barHeight = (candle.volume / chartDimensions.volumeMax) * volumeHeight;
          const isGreen = candle.close >= candle.open;
          
          return (
            <rect
              key={`volume-${index}`}
              x={x - chartDimensions.candleWidth / 2}
              y={volumeY + volumeHeight - barHeight}
              width={chartDimensions.candleWidth}
              height={barHeight}
              fill={isGreen ? '#22C55E' : '#EF4444'}
              opacity={0.6}
            />
          );
        })}
      </g>
    );
  }, [showVolume, processedData, width, height, chartDimensions]);

  // Custom tooltip component
  const renderTooltip = () => {
    if (!hoveredCandle || !hoveredPosition) return null;
    
    const tooltipX = hoveredPosition.x > (width || 800) / 2 
      ? hoveredPosition.x - 200 
      : hoveredPosition.x + 10;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          "absolute z-50 rounded-lg p-3 shadow-xl min-w-[180px]",
          "glass-medium",
          adaptiveGlass.blur
        )}
        style={{
          left: tooltipX,
          top: hoveredPosition.y - 10
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-primary">
            {symbol}
          </span>
          <span className="text-xs text-text-secondary">
            {new Date(hoveredCandle.datetime).toLocaleString()}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-text-secondary">Open:</span>
            <span className="ml-1 text-text-primary">${hoveredCandle.open.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-text-secondary">High:</span>
            <span className="ml-1 text-status-success">${hoveredCandle.high.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-text-secondary">Low:</span>
            <span className="ml-1 text-status-error">${hoveredCandle.low.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-text-secondary">Close:</span>
            <span className="ml-1 text-text-primary font-medium">${hoveredCandle.close.toFixed(2)}</span>
          </div>
        </div>
        
        {hoveredCandle.volume && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-text-secondary">Volume: </span>
            <span className="text-xs text-text-primary">
              {(hoveredCandle.volume / 1000000).toFixed(1)}M
            </span>
          </div>
        )}
        
        {hoveredCandle.signal && hoveredCandle.signal !== 'neutral' && (
          <div className="mt-1">
            <span className="text-xs text-text-secondary">Signal: </span>
            <span className={cn(
              "text-xs font-medium capitalize",
              hoveredCandle.signal === 'buy' && "text-status-success",
              hoveredCandle.signal === 'sell' && "text-status-error"
            )}>
              {hoveredCandle.signal}
            </span>
          </div>
        )}
      </motion.div>
    );
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
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-text-primary">
            {symbol}
          </h3>
          <span className="text-sm text-text-secondary">
            {timeframe}
          </span>
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
      </div>
      
      {/* Main chart area */}
      <motion.div
        ref={chartRef}
        className="relative overflow-hidden"
        style={{ height }}
        drag={enablePan}
        onPan={handlePan}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.1}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair"
        >
          {/* Grid lines */}
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(156, 163, 175, 0.2)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Candlesticks */}
          {processedData.map((candle, index) => renderCandle(candle, index))}
          
          {/* Moving averages */}
          {renderMovingAverages()}
          
          {/* Volume bars */}
          {renderVolume()}
        </svg>
        
        {/* Tooltip */}
        {renderTooltip()}
        
        {/* Performance indicator for mobile */}
        {touch && performanceTier === 'low' && (
          <div className="absolute bottom-4 left-4 text-xs text-text-secondary bg-gray-900/50 px-2 py-1 rounded backdrop-blur-sm">
            Performance Mode: Optimized
          </div>
        )}
      </motion.div>
      
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

CandlestickChart.displayName = 'CandlestickChart';

export { CandlestickChart };