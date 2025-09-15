'use client';

import React, { useMemo, useState, useCallback, forwardRef } from 'react';
import { motion, HTMLMotionProps, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';

/**
 * MarketHeatmap Component - Sector/market overview visualization with touch interactions
 * 
 * Features:
 * - Hierarchical heatmap visualization (sectors > companies)
 * - Size-based representation (market cap, volume, etc.)
 * - Color-coded performance with gradient intensity
 * - Touch-optimized interactions with zoom and selection
 * - Search and filtering capabilities
 * - Multiple view modes (sectors, companies, indices)
 * - Real-time updates with smooth transitions
 * - Glassmorphism effects and premium styling
 */

export interface HeatmapDataPoint {
  id: string;
  symbol: string;
  name: string;
  sector?: string;
  industry?: string;
  marketCap: number;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  size: number; // Relative size for visualization
  color: string; // Hex color based on performance
}

export interface SectorData {
  sector: string;
  totalMarketCap: number;
  avgChange: number;
  companies: HeatmapDataPoint[];
  size: number;
  color: string;
}

export interface MarketHeatmapProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  data: HeatmapDataPoint[];
  viewMode?: 'sectors' | 'companies' | 'indices';
  sizeMetric?: 'marketCap' | 'volume' | 'change';
  colorMetric?: 'change' | 'changePercent' | 'volume';
  onItemClick?: (item: HeatmapDataPoint) => void;
  onSectorClick?: (sector: string) => void;
  showLabels?: boolean;
  showPerformance?: boolean;
  searchQuery?: string;
  selectedSector?: string;
  width?: number;
  height?: number;
  className?: string;
  'data-testid'?: string;
}

const MarketHeatmap = forwardRef<HTMLDivElement, MarketHeatmapProps>(({
  data,
  viewMode = 'sectors',
  sizeMetric = 'marketCap',
  colorMetric = 'changePercent',
  onItemClick,
  onSectorClick,
  showLabels = true,
  showPerformance = true,
  searchQuery = '',
  selectedSector,
  width,
  height = 600,
  className,
  'data-testid': testId,
  ...motionProps
}, ref) => {
  const [hoveredItem, setHoveredItem] = useState<HeatmapDataPoint | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Hooks
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch } = useDeviceCapabilities();

  // Filter data based on search and sector selection
  const filteredData = useMemo(() => {
    let filtered = [...data];
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedSector && viewMode === 'companies') {
      filtered = filtered.filter(item => item.sector === selectedSector);
    }
    
    return filtered;
  }, [data, searchQuery, selectedSector, viewMode]);

  // Process data for heatmap visualization
  const processedData = useMemo(() => {
    if (filteredData.length === 0) return [];
    
    // Calculate size and color values
    const maxSize = Math.max(...filteredData.map(item => item[sizeMetric]));
    const minSize = Math.min(...filteredData.map(item => item[sizeMetric]));
    const maxColor = Math.max(...filteredData.map(item => item[colorMetric]));
    const minColor = Math.min(...filteredData.map(item => item[colorMetric]));
    
    return filteredData.map(item => {
      // Normalize size (20-100 pixel range)
      const normalizedSize = Math.max(20, 
        ((item[sizeMetric] - minSize) / (maxSize - minSize)) * 80 + 20
      );
      
      // Calculate color based on performance
      const colorValue = item[colorMetric];
      const colorIntensity = Math.abs(colorValue - minColor) / (maxColor - minColor);
      
      let color: string;
      if (colorValue > 0) {
        // Green for positive performance
        const greenIntensity = Math.min(255, 100 + colorIntensity * 155);
        color = `rgb(34, ${greenIntensity}, 94)`; // Green spectrum
      } else if (colorValue < 0) {
        // Red for negative performance  
        const redIntensity = Math.min(255, 100 + colorIntensity * 155);
        color = `rgb(${redIntensity}, 68, 68)`; // Red spectrum
      } else {
        color = 'rgb(156, 163, 175)'; // Neutral gray
      }
      
      return {
        ...item,
        size: normalizedSize,
        color
      };
    }).sort((a, b) => b.size - a.size); // Sort by size for layering
  }, [filteredData, sizeMetric, colorMetric]);

  // Group data by sectors if in sector view mode
  const sectorData = useMemo((): SectorData[] => {
    if (viewMode !== 'sectors') return [];
    
    const sectorMap = new Map<string, HeatmapDataPoint[]>();
    
    processedData.forEach(item => {
      const sector = item.sector || 'Other';
      if (!sectorMap.has(sector)) {
        sectorMap.set(sector, []);
      }
      sectorMap.get(sector)!.push(item);
    });
    
    return Array.from(sectorMap.entries()).map(([sector, companies]) => {
      const totalMarketCap = companies.reduce((sum, c) => sum + c.marketCap, 0);
      const avgChange = companies.reduce((sum, c) => sum + c.changePercent, 0) / companies.length;
      
      // Calculate sector size and color
      const maxSectorCap = Math.max(...Array.from(sectorMap.values()).map(c => 
        c.reduce((sum, item) => sum + item.marketCap, 0)
      ));
      const sectorSize = Math.max(60, (totalMarketCap / maxSectorCap) * 200 + 60);
      
      let sectorColor: string;
      if (avgChange > 0) {
        const intensity = Math.min(255, 100 + Math.abs(avgChange) * 10);
        sectorColor = `rgb(34, ${intensity}, 94)`;
      } else if (avgChange < 0) {
        const intensity = Math.min(255, 100 + Math.abs(avgChange) * 10);
        sectorColor = `rgb(${intensity}, 68, 68)`;
      } else {
        sectorColor = 'rgb(156, 163, 175)';
      }
      
      return {
        sector,
        totalMarketCap,
        avgChange,
        companies,
        size: sectorSize,
        color: sectorColor
      };
    }).sort((a, b) => b.totalMarketCap - a.totalMarketCap);
  }, [processedData, viewMode]);

  // Calculate layout positions using a simple treemap algorithm
  const layoutData = useMemo(() => {
    const containerWidth = width || 800;
    const containerHeight = height - 100; // Account for header
    
    if (viewMode === 'sectors') {
      return calculateTreemapLayout(sectorData, containerWidth, containerHeight);
    } else {
      return calculateTreemapLayout(processedData, containerWidth, containerHeight);
    }
  }, [processedData, sectorData, viewMode, width, height]);

  // Simple treemap layout algorithm
  function calculateTreemapLayout(items: any[], width: number, height: number) {
    if (items.length === 0) return [];
    
    // Sort items by size for better layout
    const sorted = [...items].sort((a, b) => b.size - a.size);
    
    const positions = [];
    let currentX = 0;
    let currentY = 0;
    let rowHeight = 0;
    const padding = 4;
    
    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      const itemWidth = Math.sqrt(item.size * 2); // Convert size to dimensions
      const itemHeight = Math.sqrt(item.size * 2);
      
      // Check if we need to wrap to next row
      if (currentX + itemWidth > width && currentX > 0) {
        currentX = 0;
        currentY += rowHeight + padding;
        rowHeight = 0;
      }
      
      positions.push({
        ...item,
        x: currentX,
        y: currentY,
        width: itemWidth,
        height: itemHeight
      });
      
      currentX += itemWidth + padding;
      rowHeight = Math.max(rowHeight, itemHeight);
    }
    
    return positions;
  }

  // Handle item interactions
  const handleItemClick = useCallback((item: any, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (viewMode === 'sectors' && 'sector' in item) {
      onSectorClick?.(item.sector);
    } else if ('symbol' in item) {
      onItemClick?.(item);
    }
  }, [viewMode, onItemClick, onSectorClick]);

  const handleMouseMove = useCallback((event: React.MouseEvent, item: any) => {
    if ('symbol' in item) {
      setHoveredItem(item);
      setHoveredPosition({ x: event.clientX, y: event.clientY });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredItem(null);
    setHoveredPosition(null);
  }, []);

  // Format numbers for display
  const formatValue = (value: number, type: string) => {
    switch (type) {
      case 'marketCap':
        if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        return `$${value.toFixed(0)}`;
      case 'volume':
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
        return value.toFixed(0);
      case 'price':
        return `$${value.toFixed(2)}`;
      case 'percent':
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
      default:
        return value.toFixed(2);
    }
  };

  // Tooltip component
  const renderTooltip = () => {
    if (!hoveredItem || !hoveredPosition) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          "fixed z-50 rounded-lg p-3 shadow-xl min-w-[200px]",
          "glass-medium",
          adaptiveGlass.blur,
          "pointer-events-none"
        )}
        style={{
          left: hoveredPosition.x + 10,
          top: hoveredPosition.y - 10
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-primary">
            {hoveredItem.symbol}
          </span>
          <span className="text-xs text-text-secondary">
            {hoveredItem.sector}
          </span>
        </div>
        
        <div className="text-xs text-text-secondary mb-1">
          {hoveredItem.name}
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-text-secondary">Price:</span>
            <span className="ml-1 text-text-primary">{formatValue(hoveredItem.price, 'price')}</span>
          </div>
          <div>
            <span className="text-text-secondary">Change:</span>
            <span className={cn(
              "ml-1 font-medium",
              hoveredItem.changePercent >= 0 ? "text-status-success" : "text-status-error"
            )}>
              {formatValue(hoveredItem.changePercent, 'percent')}
            </span>
          </div>
          <div>
            <span className="text-text-secondary">Market Cap:</span>
            <span className="ml-1 text-text-primary">{formatValue(hoveredItem.marketCap, 'marketCap')}</span>
          </div>
          <div>
            <span className="text-text-secondary">Volume:</span>
            <span className="ml-1 text-text-primary">{formatValue(hoveredItem.volume, 'volume')}</span>
          </div>
        </div>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-3 sm:mb-0">
          <h3 className="text-lg font-semibold text-text-primary">
            Market Heatmap
          </h3>
          <span className="text-sm text-text-secondary">
            {viewMode === 'sectors' ? 'By Sector' : viewMode === 'companies' ? 'By Company' : 'By Index'}
          </span>
        </div>
        
        {/* View mode controls */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {['sectors', 'companies', 'indices'].map((mode) => (
            <button
              key={mode}
              className={cn(
                "px-3 py-1 text-xs rounded font-medium transition-all capitalize",
                viewMode === mode
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      {showPerformance && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-text-secondary border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <span>Size: {sizeMetric === 'marketCap' ? 'Market Cap' : sizeMetric === 'volume' ? 'Volume' : 'Change'}</span>
            <span>Color: {colorMetric === 'changePercent' ? 'Change %' : colorMetric === 'change' ? 'Change $' : 'Volume'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-status-success rounded" />
              <span>Positive</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-status-error rounded" />
              <span>Negative</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Heatmap visualization */}
      <div 
        className="relative overflow-hidden p-4"
        style={{ height: height - 120 }}
        onMouseLeave={handleMouseLeave}
      >
        <svg
          width="100%"
          height="100%"
          className="overflow-visible"
        >
          <AnimatePresence>
            {layoutData.map((item, index) => (
              <motion.g
                key={viewMode === 'sectors' ? item.sector : item.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: index * 0.01 }}
              >
                <motion.rect
                  x={item.x}
                  y={item.y}
                  width={item.width}
                  height={item.height}
                  fill={item.color}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth={1}
                  rx={4}
                  className="cursor-pointer transition-all duration-200"
                  whileHover={{ 
                    scale: 1.05,
                    stroke: "rgba(255, 255, 255, 0.4)",
                    strokeWidth: 2
                  }}
                  onClick={(e) => handleItemClick(item, e as any)}
                  onMouseMove={(e) => handleMouseMove(e as any, item)}
                />
                
                {/* Labels */}
                {showLabels && item.width > 40 && item.height > 30 && (
                  <text
                    x={item.x + item.width / 2}
                    y={item.y + item.height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-medium fill-white pointer-events-none"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {viewMode === 'sectors' ? item.sector : item.symbol}
                  </text>
                )}
                
                {/* Performance indicator */}
                {showPerformance && item.width > 30 && item.height > 40 && (
                  <text
                    x={item.x + item.width / 2}
                    y={item.y + item.height / 2 + 12}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs fill-white/80 pointer-events-none"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {viewMode === 'sectors' 
                      ? formatValue(item.avgChange, 'percent')
                      : formatValue(item.changePercent, 'percent')
                    }
                  </text>
                )}
              </motion.g>
            ))}
          </AnimatePresence>
        </svg>
        
        {/* Empty state */}
        {layoutData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-text-secondary">
              <div className="text-lg mb-2">No data available</div>
              <div className="text-sm">Try adjusting your filters or search query</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Tooltip */}
      <AnimatePresence>
        {renderTooltip()}
      </AnimatePresence>
      
      {/* Performance indicator */}
      {touch && performanceTier === 'low' && (
        <div className="absolute bottom-2 right-2 text-xs text-text-secondary opacity-50">
          Optimized
        </div>
      )}
      
      {/* Glass glow effect */}
      {adaptiveGlass.effects && performanceTier !== 'low' && (
        <div 
          className="absolute inset-0 opacity-3 pointer-events-none rounded-xl"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
            filter: 'blur(25px)',
          }}
        />
      )}
    </motion.div>
  );
});

MarketHeatmap.displayName = 'MarketHeatmap';

export { MarketHeatmap };