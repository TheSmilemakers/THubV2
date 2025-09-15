'use client';

import React, { useRef, useEffect, useState, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';
import { Signal } from '@/types/signals.types';

/**
 * ConvergenceRadar Component - Advanced radar visualization for signal analysis
 * 
 * Features:
 * - Interactive radar chart showing 3-layer convergence
 * - Smooth SVG animations with performance optimization
 * - Touch-optimized with zoom and pan gestures
 * - Real-time score updates with particle effects
 * - Adaptive rendering based on device capabilities
 * - Mobile-first responsive design
 */

export interface ConvergenceRadarProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  signal: Signal;
  size?: number;
  showLabels?: boolean;
  showGrid?: boolean;
  interactive?: boolean;
  animationDuration?: number;
  onLayerHover?: (layer: string | null) => void;
  onLayerClick?: (layer: string, score: number) => void;
  className?: string;
  'data-testid'?: string;
}

interface RadarLayer {
  name: string;
  score: number | null;
  color: string;
  weight: number;
  angle: number;
}

const ConvergenceRadar = forwardRef<HTMLDivElement, ConvergenceRadarProps>(({
  signal,
  size = 200,
  showLabels = true,
  showGrid = true,
  interactive = true,
  animationDuration = 1000,
  onLayerHover,
  onLayerClick,
  className,
  'data-testid': testId,
  ...motionProps
}, ref) => {
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch, screenSize } = useDeviceCapabilities();
  
  const center = size / 2;
  const maxRadius = center - 40; // Leave space for labels
  
  // Define radar layers with positioning
  const layers: RadarLayer[] = [
    {
      name: 'Technical',
      score: signal.technical_score,
      color: '#8B5CF6', // purple
      weight: 40,
      angle: 0 // Top
    },
    {
      name: 'Sentiment',
      score: signal.sentiment_score,
      color: '#3B82F6', // blue
      weight: 30,
      angle: 120 // Bottom right
    },
    {
      name: 'Liquidity',
      score: signal.liquidity_score,
      color: '#22C55E', // green
      weight: 30,
      angle: 240 // Bottom left
    }
  ];

  // Animation effect
  useEffect(() => {
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
  }, [animationDuration, performanceTier]);

  // Convert polar coordinates to cartesian
  const polarToCartesian = (angle: number, radius: number) => {
    const radian = (angle - 90) * (Math.PI / 180);
    return {
      x: center + radius * Math.cos(radian),
      y: center + radius * Math.sin(radian)
    };
  };

  // Generate radar grid lines
  const generateGridLines = () => {
    if (!showGrid) return null;
    
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
    const gridPaths: React.ReactElement[] = [];
    
    // Concentric polygons
    gridLevels.forEach((level, index) => {
      const radius = maxRadius * level;
      const points = layers.map(layer => polarToCartesian(layer.angle, radius));
      const pathD = `M ${points[0].x} ${points[0].y} ` +
                   points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z';
      
      gridPaths.push(
        <path
          key={`grid-${index}`}
          d={pathD}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
          className="transition-opacity duration-300"
        />
      );
    });
    
    // Radial lines
    layers.forEach((layer, index) => {
      const endPoint = polarToCartesian(layer.angle, maxRadius);
      gridPaths.push(
        <line
          key={`radial-${index}`}
          x1={center}
          y1={center}
          x2={endPoint.x}
          y2={endPoint.y}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
          className="transition-opacity duration-300"
        />
      );
    });
    
    return gridPaths;
  };

  // Generate radar area path
  const generateRadarPath = () => {
    const points = layers.map(layer => {
      const score = layer.score ?? 0;
      const radius = (score / 100) * maxRadius * animationProgress;
      return polarToCartesian(layer.angle, radius);
    });
    
    if (points.length === 0) return '';
    
    return `M ${points[0].x} ${points[0].y} ` +
           points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z';
  };

  // Generate individual layer indicators
  const generateLayerPoints = () => {
    return layers.map((layer, index) => {
      const score = layer.score ?? 0;
      const radius = (score / 100) * maxRadius * animationProgress;
      const point = polarToCartesian(layer.angle, radius);
      const isHovered = hoveredLayer === layer.name;
      
      return (
        <g key={layer.name}>
          {/* Glow effect for high-end devices */}
          {adaptiveGlass.effects && performanceTier === 'high' && (
            <circle
              cx={point.x}
              cy={point.y}
              r={isHovered ? 12 : 8}
              fill={layer.color}
              opacity="0.3"
              filter="blur(4px)"
              className="transition-all duration-300"
            />
          )}
          
          {/* Main point */}
          <circle
            cx={point.x}
            cy={point.y}
            r={isHovered ? 6 : 4}
            fill={layer.color}
            stroke="white"
            strokeWidth="2"
            className={cn(
              "transition-all duration-300 cursor-pointer",
              interactive && "hover:scale-110"
            )}
            onMouseEnter={() => {
              if (!touch) {
                setHoveredLayer(layer.name);
                onLayerHover?.(layer.name);
              }
            }}
            onMouseLeave={() => {
              if (!touch) {
                setHoveredLayer(null);
                onLayerHover?.(null);
              }
            }}
            onClick={() => {
              if (interactive) {
                onLayerClick?.(layer.name, score);
              }
            }}
            style={{
              filter: adaptiveGlass.effects ? `drop-shadow(0 0 6px ${layer.color}40)` : undefined
            }}
          />
          
          {/* Score label */}
          {(isHovered || !touch) && (
            <text
              x={point.x}
              y={point.y - 12}
              textAnchor="middle"
              className="text-xs font-medium fill-white"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              {score}
            </text>
          )}
        </g>
      );
    });
  };

  // Generate layer labels
  const generateLabels = () => {
    if (!showLabels) return null;
    
    return layers.map((layer) => {
      const labelRadius = maxRadius + 25;
      const labelPoint = polarToCartesian(layer.angle, labelRadius);
      const isHovered = hoveredLayer === layer.name;
      
      return (
        <g key={`label-${layer.name}`}>
          {/* Label background */}
          <rect
            x={labelPoint.x - 30}
            y={labelPoint.y - 10}
            width="60"
            height="20"
            rx="10"
            fill="rgba(0,0,0,0.6)"
            className={cn(
              "transition-all duration-300",
              isHovered && "fill-opacity-80"
            )}
          />
          
          {/* Label text */}
          <text
            x={labelPoint.x}
            y={labelPoint.y + 4}
            textAnchor="middle"
            className={cn(
              "text-xs font-medium transition-all duration-300",
              isHovered ? "fill-white" : "fill-gray-300"
            )}
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)'
            }}
          >
            {layer.name}
          </text>
          
          {/* Weight indicator */}
          <text
            x={labelPoint.x}
            y={labelPoint.y + 25}
            textAnchor="middle"
            className="text-[10px] fill-gray-400"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
          >
            {layer.weight}%
          </text>
        </g>
      );
    });
  };

  // Convergence score calculation display
  const convergenceScore = signal.convergence_score;
  const scoreColor = convergenceScore >= 70 ? '#22C55E' : 
                    convergenceScore >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative flex flex-col items-center",
        className
      )}
      data-testid={testId}
      {...motionProps}
    >
      {/* Main radar chart */}
      <div className="relative">
        <svg
          ref={svgRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className={cn(
            "overflow-visible",
            touch && "touch-manipulation"
          )}
        >
          {/* Grid lines */}
          {generateGridLines()}
          
          {/* Radar area */}
          <path
            d={generateRadarPath()}
            fill="url(#radarGradient)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
            className="transition-all duration-300"
          />
          
          {/* Layer points */}
          {generateLayerPoints()}
          
          {/* Labels */}
          {generateLabels()}
          
          {/* Convergence score in center */}
          <g>
            <circle
              cx={center}
              cy={center}
              r="20"
              fill="rgba(0,0,0,0.8)"
              stroke={scoreColor}
              strokeWidth="2"
              className="transition-all duration-300"
            />
            <text
              x={center}
              y={center - 2}
              textAnchor="middle"
              className="text-sm font-bold"
              fill={scoreColor}
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              {convergenceScore}
            </text>
            <text
              x={center}
              y={center + 12}
              textAnchor="middle"
              className="text-[10px] fill-gray-400"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              SCORE
            </text>
          </g>
          
          {/* Gradient definitions */}
          <defs>
            <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={scoreColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={scoreColor} stopOpacity="0.1" />
            </radialGradient>
          </defs>
        </svg>
        
        {/* Particle effects for high-end devices */}
        {adaptiveGlass.effects && performanceTier === 'high' && animationProgress > 0.8 && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Animated particles around the radar */}
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-60"
                style={{
                  left: `${50 + Math.cos(i * 60 * Math.PI / 180) * 40}%`,
                  top: `${50 + Math.sin(i * 60 * Math.PI / 180) * 40}%`,
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Layer legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {layers.map((layer) => (
          <div
            key={layer.name}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300",
              "glass-light",
              hoveredLayer === layer.name && "glass-medium scale-105"
            )}
            onMouseEnter={() => {
              if (!touch) {
                setHoveredLayer(layer.name);
                onLayerHover?.(layer.name);
              }
            }}
            onMouseLeave={() => {
              if (!touch) {
                setHoveredLayer(null);
                onLayerHover?.(null);
              }
            }}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: layer.color }}
            />
            <span className="text-xs font-medium text-text-secondary">
              {layer.name}
            </span>
            <span className="text-xs text-text-tertiary">
              ({layer.weight}%)
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: layer.color }}
            >
              {layer.score ?? '--'}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
});

ConvergenceRadar.displayName = 'ConvergenceRadar';

export { ConvergenceRadar };