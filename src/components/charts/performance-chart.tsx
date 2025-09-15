'use client';

import React, { useMemo, useState, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceLine,
  Legend
} from 'recharts';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';

/**
 * PerformanceChart Component - Portfolio performance tracking with glassmorphism
 * 
 * Features:
 * - Portfolio performance visualization with percentage returns
 * - Benchmark comparison (S&P 500, custom benchmarks)
 * - Drawdown analysis with underwater charts
 * - Time period filtering (1D, 1W, 1M, 3M, 1Y, YTD, ALL)
 * - Performance metrics overlay (Sharpe, Max DD, CAGR)
 * - Interactive tooltips with detailed performance data
 * - Glassmorphism effects and premium styling
 * - Mobile-optimized touch interactions
 */

export interface PerformanceDataPoint {
  timestamp: string;
  portfolioValue: number;
  portfolioReturn: number; // Percentage return
  benchmarkReturn?: number; // Benchmark comparison
  drawdown?: number; // Drawdown percentage
  cumulativeReturn: number;
  benchmark?: string;
}

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  bestDay: number;
  worstDay: number;
}

export interface PerformanceChartProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  data: PerformanceDataPoint[];
  metrics?: PerformanceMetrics;
  showBenchmark?: boolean;
  showDrawdown?: boolean;
  showMetrics?: boolean;
  timePeriod?: '1D' | '1W' | '1M' | '3M' | '1Y' | 'YTD' | 'ALL';
  onTimePeriodChange?: (period: '1D' | '1W' | '1M' | '3M' | '1Y' | 'YTD' | 'ALL') => void;
  width?: number;
  height?: number;
  portfolioName?: string;
  benchmarkName?: string;
  className?: string;
  'data-testid'?: string;
}

const PerformanceChart = forwardRef<HTMLDivElement, PerformanceChartProps>(({
  data,
  metrics,
  showBenchmark = true,
  showDrawdown = false,
  showMetrics = true,
  timePeriod = '1M',
  onTimePeriodChange,
  width,
  height = 400,
  portfolioName = 'Portfolio',
  benchmarkName = 'S&P 500',
  className,
  'data-testid': testId,
  ...motionProps
}, ref) => {
  const [hoveredData, setHoveredData] = useState<PerformanceDataPoint | null>(null);
  
  // Hooks
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch } = useDeviceCapabilities();

  // Time period options
  const timePeriods = [
    { key: '1D' as const, label: '1D' },
    { key: '1W' as const, label: '1W' },
    { key: '1M' as const, label: '1M' },
    { key: '3M' as const, label: '3M' },
    { key: '1Y' as const, label: '1Y' },
    { key: 'YTD' as const, label: 'YTD' },
    { key: 'ALL' as const, label: 'ALL' },
  ];

  // Process and filter data based on time period
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Sort data by timestamp
    const sorted = [...data].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Filter based on time period
    const now = new Date();
    let startDate: Date;
    
    switch (timePeriod) {
      case '1D':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '1W':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1M':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3M':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1Y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'YTD':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }
    
    const filtered = sorted.filter(point => 
      new Date(point.timestamp).getTime() >= startDate.getTime()
    );
    
    // Performance optimization for low-end devices
    if (performanceTier === 'low' && filtered.length > 200) {
      const step = Math.ceil(filtered.length / 200);
      return filtered.filter((_, index) => index % step === 0);
    }
    
    return filtered;
  }, [data, timePeriod, performanceTier]);

  // Calculate current performance metrics
  const currentMetrics = useMemo(() => {
    if (processedData.length === 0) return null;
    
    const latest = processedData[processedData.length - 1];
    const first = processedData[0];
    
    return {
      currentReturn: latest.portfolioReturn,
      benchmarkReturn: latest.benchmarkReturn || 0,
      periodReturn: latest.cumulativeReturn - first.cumulativeReturn,
      outperformance: latest.benchmarkReturn 
        ? latest.portfolioReturn - latest.benchmarkReturn 
        : null
    };
  }, [processedData]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload[0]) return null;
    
    const data = payload[0].payload as PerformanceDataPoint;
    
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
            Performance
          </span>
          <span className="text-xs text-text-secondary">
            {new Date(data.timestamp).toLocaleDateString()}
          </span>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary">{portfolioName}:</span>
            <span className={cn(
              "text-xs font-medium",
              data.portfolioReturn >= 0 ? "text-status-success" : "text-status-error"
            )}>
              {data.portfolioReturn >= 0 ? '+' : ''}{data.portfolioReturn.toFixed(2)}%
            </span>
          </div>
          
          {showBenchmark && data.benchmarkReturn !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">{benchmarkName}:</span>
              <span className={cn(
                "text-xs font-medium",
                data.benchmarkReturn >= 0 ? "text-status-success" : "text-status-error"
              )}>
                {data.benchmarkReturn >= 0 ? '+' : ''}{data.benchmarkReturn.toFixed(2)}%
              </span>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary">Value:</span>
            <span className="text-xs text-text-primary">
              ${data.portfolioValue.toLocaleString()}
            </span>
          </div>
          
          {data.drawdown && showDrawdown && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Drawdown:</span>
              <span className="text-xs text-status-error">
                {data.drawdown.toFixed(2)}%
              </span>
            </div>
          )}
          
          {showBenchmark && data.benchmarkReturn !== undefined && (
            <div className="mt-2 pt-1 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary">Outperformance:</span>
                <span className={cn(
                  "text-xs font-medium",
                  (data.portfolioReturn - data.benchmarkReturn) >= 0 
                    ? "text-status-success" 
                    : "text-status-error"
                )}>
                  {(data.portfolioReturn - data.benchmarkReturn) >= 0 ? '+' : ''}
                  {(data.portfolioReturn - data.benchmarkReturn).toFixed(2)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Format percentage for display
  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
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
      {/* Chart header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-3 sm:mb-0">
          <h3 className="text-lg font-semibold text-text-primary">
            {portfolioName} Performance
          </h3>
          
          {currentMetrics && (
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-medium",
                currentMetrics.currentReturn >= 0 
                  ? "text-status-success" 
                  : "text-status-error"
              )}>
                {formatPercent(currentMetrics.currentReturn)}
              </span>
              
              {currentMetrics.outperformance !== null && (
                <span className="text-xs text-text-secondary">
                  ({formatPercent(currentMetrics.outperformance)} vs {benchmarkName})
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Time period selector */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {timePeriods.map((period) => (
            <button
              key={period.key}
              onClick={() => onTimePeriodChange?.(period.key)}
              className={cn(
                "px-2 py-1 text-xs rounded font-medium transition-all",
                timePeriod === period.key
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Performance metrics panel */}
      {showMetrics && metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-xs text-text-secondary mb-1">Total Return</div>
            <div className={cn(
              "text-sm font-semibold",
              metrics.totalReturn >= 0 ? "text-status-success" : "text-status-error"
            )}>
              {formatPercent(metrics.totalReturn)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-text-secondary mb-1">Sharpe Ratio</div>
            <div className="text-sm font-semibold text-text-primary">
              {metrics.sharpeRatio.toFixed(2)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-text-secondary mb-1">Max Drawdown</div>
            <div className="text-sm font-semibold text-status-error">
              {metrics.maxDrawdown.toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-text-secondary mb-1">Win Rate</div>
            <div className="text-sm font-semibold text-text-primary">
              {metrics.winRate.toFixed(1)}%
            </div>
          </div>
        </div>
      )}
      
      {/* Main chart */}
      <div className="p-4" style={{ height: height - (showMetrics && metrics ? 140 : 80) }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={processedData}
            margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          >
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            
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
              tickFormatter={(value) => {
                const date = new Date(value);
                if (timePeriod === '1D') {
                  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
                return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
              }}
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'rgb(107, 114, 128)' }}
              tickFormatter={(value) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`}
            />
            
            <RechartsTooltip content={<CustomTooltip />} />
            
            {/* Zero line */}
            <ReferenceLine y={0} stroke="rgba(156, 163, 175, 0.5)" strokeDasharray="2 2" />
            
            {/* Benchmark area (if shown) */}
            {showBenchmark && (
              <Area
                type="monotone"
                dataKey="benchmarkReturn"
                stroke="#F59E0B"
                fill="url(#benchmarkGradient)"
                strokeWidth={1.5}
                animationDuration={performanceTier === 'low' ? 0 : 800}
              />
            )}
            
            {/* Portfolio area */}
            <Area
              type="monotone"
              dataKey="portfolioReturn"
              stroke="#8B5CF6"
              fill="url(#portfolioGradient)"
              strokeWidth={2}
              animationDuration={performanceTier === 'low' ? 0 : 800}
            />
            
            {/* Legend */}
            <Legend
              verticalAlign="top"
              height={36}
              iconType="line"
              wrapperStyle={{ fontSize: '12px' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Drawdown chart overlay */}
      {showDrawdown && (
        <div className="absolute inset-x-4 bottom-4 h-16 opacity-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedData}>
              <Area
                type="monotone"
                dataKey="drawdown"
                stroke="#EF4444"
                fill="rgba(239, 68, 68, 0.2)"
                strokeWidth={1}
              />
            </AreaChart>
          </ResponsiveContainer>
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
            background: 'radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
      )}
    </motion.div>
  );
});

PerformanceChart.displayName = 'PerformanceChart';

export { PerformanceChart };

// Convenience variants for different use cases
export const SimplePerformanceChart = (props: Omit<PerformanceChartProps, 'showBenchmark' | 'showMetrics' | 'showDrawdown'>) => (
  <PerformanceChart 
    showBenchmark={false} 
    showMetrics={false} 
    showDrawdown={false} 
    {...props} 
  />
);

export const DetailedPerformanceChart = (props: Omit<PerformanceChartProps, 'showBenchmark' | 'showMetrics' | 'showDrawdown'>) => (
  <PerformanceChart 
    showBenchmark={true} 
    showMetrics={true} 
    showDrawdown={true} 
    {...props} 
  />
);

export const BenchmarkPerformanceChart = (props: Omit<PerformanceChartProps, 'showBenchmark' | 'showMetrics'>) => (
  <PerformanceChart 
    showBenchmark={true} 
    showMetrics={false} 
    {...props} 
  />
);