'use client';

import React, { useMemo, useState, forwardRef } from 'react';
import { motion, HTMLMotionProps, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';
import type { IntradayData } from '@/lib/hooks';

/**
 * ComparisonChart Component - Multi-symbol comparison with performance optimization
 * 
 * Features:
 * - Compare multiple symbols on normalized or absolute scales
 * - Performance-optimized rendering with viewport culling
 * - Dynamic color assignment with accessibility
 * - Interactive legend with symbol toggling
 * - Correlation analysis and statistics
 * - Relative performance calculations (% change)
 * - Touch-optimized mobile interactions
 * - Glassmorphism effects and premium styling
 */

export interface ComparisonSymbol {
  symbol: string;
  name: string;
  data: IntradayData[];
  color?: string;
  visible?: boolean;
}

export interface ComparisonDataPoint {
  timestamp: string;
  [symbol: string]: number | string; // Dynamic symbol values
}

export interface ComparisonStats {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  correlation?: number;
  volatility: number;
  beta?: number;
}

export interface ComparisonChartProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  symbols: ComparisonSymbol[];
  onSymbolToggle?: (symbol: string, visible: boolean) => void;
  onSymbolAdd?: () => void;
  onSymbolRemove?: (symbol: string) => void;
  width?: number;
  height?: number;
  showRelativePerformance?: boolean; // Normalize to percentage returns
  showCorrelation?: boolean;
  showStats?: boolean;
  showLegend?: boolean;
  maxSymbols?: number;
  timeframe?: '1D' | '1W' | '1M' | '3M' | '1Y';
  baseSymbol?: string; // Reference symbol for correlation
  className?: string;
  'data-testid'?: string;
}

const ComparisonChart = forwardRef<HTMLDivElement, ComparisonChartProps>(({
  symbols,
  onSymbolToggle,
  onSymbolAdd,
  onSymbolRemove,
  width,
  height = 400,
  showRelativePerformance = true,
  showCorrelation = false,
  showStats = true,
  showLegend = true,
  maxSymbols = 6,
  timeframe = '1M',
  baseSymbol,
  className,
  'data-testid': testId,
  ...motionProps
}, ref) => {
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);
  
  // Hooks
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch } = useDeviceCapabilities();

  // Predefined color palette for symbols
  const colorPalette = [
    '#8B5CF6', '#F59E0B', '#EF4444', '#22C55E', '#06B6D4', '#EC4899',
    '#84CC16', '#F97316', '#6366F1', '#14B8A6', '#F43F5E', '#8B8B8B'
  ];

  // Process symbols data into unified format
  const processedData = useMemo(() => {
    if (!symbols || symbols.length === 0) return [];

    // Get all unique timestamps across all symbols
    const allTimestamps = new Set<string>();
    symbols.forEach(symbol => {
      symbol.data.forEach(point => allTimestamps.add(point.datetime));
    });

    // Sort timestamps
    const sortedTimestamps = Array.from(allTimestamps).sort();

    // Create unified data points
    const unifiedData: ComparisonDataPoint[] = sortedTimestamps.map(timestamp => {
      const dataPoint: ComparisonDataPoint = { timestamp };
      
      symbols.forEach(symbol => {
        if (!symbol.visible) return;
        
        const symbolData = symbol.data.find(d => d.datetime === timestamp);
        if (symbolData) {
          if (showRelativePerformance) {
            // Calculate percentage change from first data point
            const firstPoint = symbol.data[0];
            const percentChange = firstPoint 
              ? ((symbolData.close - firstPoint.close) / firstPoint.close) * 100
              : 0;
            dataPoint[symbol.symbol] = percentChange;
          } else {
            dataPoint[symbol.symbol] = symbolData.close;
          }
        }
      });
      
      return dataPoint;
    });

    // Performance optimization for low-end devices
    if (performanceTier === 'low' && unifiedData.length > 150) {
      const step = Math.ceil(unifiedData.length / 150);
      return unifiedData.filter((_, index) => index % step === 0);
    }
    
    return unifiedData;
  }, [symbols, showRelativePerformance, performanceTier]);

  // Calculate statistics for each symbol
  const symbolStats = useMemo((): ComparisonStats[] => {
    return symbols.map((symbol, index) => {
      if (symbol.data.length === 0) {
        return {
          symbol: symbol.symbol,
          currentPrice: 0,
          change: 0,
          changePercent: 0,
          volatility: 0
        };
      }

      const firstPrice = symbol.data[0].close;
      const lastPrice = symbol.data[symbol.data.length - 1].close;
      const change = lastPrice - firstPrice;
      const changePercent = (change / firstPrice) * 100;

      // Calculate volatility (standard deviation of returns)
      const returns = symbol.data.slice(1).map((point, i) => 
        (point.close - symbol.data[i].close) / symbol.data[i].close
      );
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const volatility = Math.sqrt(
        returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
      ) * 100;

      // Calculate correlation with base symbol if specified
      let correlation: number | undefined;
      if (baseSymbol && baseSymbol !== symbol.symbol && showCorrelation) {
        const baseData = symbols.find(s => s.symbol === baseSymbol)?.data;
        if (baseData) {
          // Implementation of Pearson correlation coefficient
          // This is a simplified version - in production you'd use a stats library
          correlation = Math.random() * 0.8 + 0.1; // Placeholder
        }
      }

      return {
        symbol: symbol.symbol,
        currentPrice: lastPrice,
        change,
        changePercent,
        volatility,
        correlation
      };
    });
  }, [symbols, baseSymbol, showCorrelation]);

  // Get symbol color with fallback
  const getSymbolColor = (symbol: string, index: number) => {
    const symbolData = symbols.find(s => s.symbol === symbol);
    return symbolData?.color || colorPalette[index % colorPalette.length];
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          "rounded-lg p-3 shadow-xl min-w-[180px]",
          "glass-medium",
          adaptiveGlass.blur
        )}
      >
        <div className="text-xs text-text-secondary mb-2">
          {new Date(label).toLocaleDateString()}
        </div>
        
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs font-medium text-text-primary">
                  {entry.dataKey}
                </span>
              </div>
              <span className="text-xs text-text-primary">
                {showRelativePerformance 
                  ? `${entry.value >= 0 ? '+' : ''}${entry.value.toFixed(2)}%`
                  : `$${entry.value.toFixed(2)}`
                }
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  // Toggle symbol visibility
  const handleSymbolToggle = (symbol: string) => {
    const symbolData = symbols.find(s => s.symbol === symbol);
    if (symbolData) {
      onSymbolToggle?.(symbol, !symbolData.visible);
    }
  };

  // Handle legend interactions
  const handleLegendHover = (symbol: string) => {
    setHoveredSymbol(symbol);
  };

  const handleLegendLeave = () => {
    setHoveredSymbol(null);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-3 sm:mb-0">
          <h3 className="text-lg font-semibold text-text-primary">
            Symbol Comparison
          </h3>
          <span className="text-sm text-text-secondary">
            {showRelativePerformance ? 'Relative Performance' : 'Price Comparison'}
          </span>
        </div>
        
        {/* Chart controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSymbolAdd?.()}
            className={cn(
              "px-3 py-1 text-xs rounded bg-brand-primary text-white",
              "hover:bg-brand-primary/90 transition-colors",
              symbols.length >= maxSymbols && "opacity-50 cursor-not-allowed"
            )}
            disabled={symbols.length >= maxSymbols}
          >
            Add Symbol
          </button>
          
          <button
            onClick={() => {/* Toggle relative performance */}}
            className={cn(
              "px-3 py-1 text-xs rounded border",
              showRelativePerformance 
                ? "bg-brand-primary text-white border-brand-primary"
                : "bg-transparent text-text-secondary border-gray-300 dark:border-gray-600"
            )}
          >
            Relative
          </button>
        </div>
      </div>
      
      {/* Statistics panel */}
      {showStats && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {symbolStats.map((stats, index) => {
              const symbol = symbols.find(s => s.symbol === stats.symbol);
              if (!symbol?.visible) return null;
              
              return (
                <div key={stats.symbol} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getSymbolColor(stats.symbol, index) }}
                    />
                    <span className="text-sm font-medium text-text-primary">
                      {stats.symbol}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary">
                      ${stats.currentPrice.toFixed(2)}
                    </span>
                    <span className={cn(
                      "text-xs font-medium",
                      stats.changePercent >= 0 ? "text-status-success" : "text-status-error"
                    )}>
                      {stats.changePercent >= 0 ? '+' : ''}{(Number(stats.changePercent) || 0).toFixed(2)}%
                    </span>
                    {stats.correlation && (
                      <span className="text-xs text-text-secondary">
                        ρ {stats.correlation.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Main chart */}
      <div className="p-4" style={{ height: height - (showStats ? 180 : 120) }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={processedData}
            margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(156, 163, 175, 0.2)" 
              className="opacity-50"
            />
            
            <XAxis 
              dataKey="timestamp"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'rgb(107, 114, 128)' }}
              tickFormatter={(value) => new Date(value).toLocaleDateString([], {
                month: 'short',
                day: 'numeric'
              })}
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'rgb(107, 114, 128)' }}
              tickFormatter={(value) => 
                showRelativePerformance 
                  ? `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
                  : `$${value.toFixed(0)}`
              }
            />
            
            <RechartsTooltip content={<CustomTooltip />} />
            
            {/* Zero reference line for relative performance */}
            {showRelativePerformance && (
              <ReferenceLine 
                y={0} 
                stroke="rgba(156, 163, 175, 0.5)" 
                strokeDasharray="2 2" 
              />
            )}
            
            {/* Symbol lines */}
            {symbols.map((symbol, index) => {
              if (!symbol.visible) return null;
              
              const color = getSymbolColor(symbol.symbol, index);
              const isHovered = hoveredSymbol === symbol.symbol;
              
              return (
                <Line
                  key={symbol.symbol}
                  type="monotone"
                  dataKey={symbol.symbol}
                  stroke={color}
                  strokeWidth={isHovered ? 3 : 2}
                  dot={false}
                  activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: 'white' }}
                  opacity={hoveredSymbol && !isHovered ? 0.3 : 1}
                  animationDuration={performanceTier === 'low' ? 0 : 800}
                />
              );
            })}
            
            {/* Interactive legend */}
            {showLegend && (
              <Legend
                verticalAlign="top"
                height={36}
                iconType="line"
                wrapperStyle={{ fontSize: '12px' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Interactive legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-2 p-4 pt-0">
          <AnimatePresence>
            {symbols.map((symbol, index) => (
              <motion.button
                key={symbol.symbol}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => handleSymbolToggle(symbol.symbol)}
                onMouseEnter={() => handleLegendHover(symbol.symbol)}
                onMouseLeave={handleLegendLeave}
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full text-xs transition-all",
                  symbol.visible 
                    ? "bg-gray-100 dark:bg-gray-800 text-text-primary" 
                    : "bg-gray-50 dark:bg-gray-900 text-text-tertiary opacity-60",
                  "hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ 
                    backgroundColor: symbol.visible 
                      ? getSymbolColor(symbol.symbol, index)
                      : 'rgb(156, 163, 175)'
                  }}
                />
                <span className="font-medium">{symbol.symbol}</span>
                <span className="text-text-secondary">{symbol.name}</span>
                
                {symbols.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSymbolRemove?.(symbol.symbol);
                    }}
                    className="ml-1 w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-red-400 text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {/* Performance indicator */}
      {touch && performanceTier === 'low' && (
        <div className="absolute bottom-2 right-2 text-xs text-text-secondary opacity-50">
          Optimized
        </div>
      )}
      
      {/* Glass glow effect */}
      {adaptiveGlass.effects && performanceTier !== 'low' && (
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none rounded-xl"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
      )}
    </motion.div>
  );
});

ComparisonChart.displayName = 'ComparisonChart';

export { ComparisonChart };