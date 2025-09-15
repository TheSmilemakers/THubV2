'use client';

import dynamic from 'next/dynamic';
import { useIntersectionObserver } from '@/lib/hooks/use-intersection-observer';
import { Signal } from '@/types/signals.types';
import { cn } from '@/lib/utils';

// Lazy load the convergence radar with loading fallback
const ConvergenceRadar = dynamic(
  () => import('./convergence-radar').then(mod => ({ default: mod.ConvergenceRadar })),
  {
    loading: () => <ConvergenceRadarSkeleton />,
    ssr: false // This component is expensive, don't SSR it
  }
);

// Lightweight skeleton for the radar while loading
function ConvergenceRadarSkeleton({ size = 200 }: { size?: number }) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Radar skeleton */}
      <div 
        className="relative flex items-center justify-center glass-light rounded-full animate-pulse"
        style={{ width: size, height: size }}
      >
        {/* Center circle skeleton */}
        <div className="w-10 h-10 bg-gray-600/30 rounded-full animate-pulse" />
        
        {/* Grid lines skeleton */}
        <svg 
          width={size} 
          height={size} 
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0 opacity-30"
        >
          <defs>
            <pattern id="skeleton-grid" patternUnits="userSpaceOnUse" width="40" height="40">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#skeleton-grid)" className="text-gray-500/20" />
        </svg>
      </div>
      
      {/* Legend skeleton */}
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-lg glass-light animate-pulse"
          >
            <div className="w-3 h-3 bg-gray-600/30 rounded-full" />
            <div className="w-16 h-3 bg-gray-600/30 rounded" />
            <div className="w-8 h-3 bg-gray-600/30 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export interface LazyConvergenceRadarProps {
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
  // Intersection observer options
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Lazy-loaded Convergence Radar with intersection observer optimization
 * Only renders the expensive radar chart when it's visible
 */
export function LazyConvergenceRadar({
  threshold = 0.1,
  rootMargin = '100px', // Load earlier for better UX
  triggerOnce = true,
  ...radarProps
}: LazyConvergenceRadarProps) {
  const { elementRef, shouldRender } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce,
  });

  if (!shouldRender) {
    return (
      <div ref={elementRef as React.RefObject<HTMLDivElement>} className={cn("min-h-[280px]", radarProps.className)}>
        <ConvergenceRadarSkeleton size={radarProps.size} />
      </div>
    );
  }

  return (
    <div ref={elementRef as React.RefObject<HTMLDivElement>}>
      <ConvergenceRadar {...radarProps} />
    </div>
  );
}