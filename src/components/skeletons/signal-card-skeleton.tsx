'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/glass-card';
import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonGroup } from '@/components/ui/skeleton';
import { useAdaptiveGlass, usePerformanceTier } from '@/lib/hooks';

/**
 * SignalCardSkeleton - Loading placeholder that matches SignalCard layout
 * 
 * Features:
 * - Exact layout match with SignalCard component
 * - Adaptive glassmorphism effects
 * - Staggered animation entrance
 * - Performance-aware rendering
 */

export interface SignalCardSkeletonProps {
  variant?: 'compact' | 'detailed' | 'minimal';
  showConvergenceBreakdown?: boolean;
  className?: string;
  animate?: boolean;
}

export const SignalCardSkeleton: React.FC<SignalCardSkeletonProps> = ({
  variant = 'detailed',
  showConvergenceBreakdown = true,
  className,
  animate = true,
}) => {
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();

  const ConvergenceScoreSkeleton = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex flex-col space-y-2">
        <SkeletonText width="120px" />
        <div className="flex items-baseline gap-2">
          <Skeleton variant="text" width="60px" height="32px" />
          <SkeletonText width="30px" />
        </div>
      </div>
      
      {/* Circular progress skeleton */}
      <div className="relative w-16 h-16">
        <Skeleton 
          variant="circle" 
          width="64px" 
          height="64px"
          className="border-2 border-white/20"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <SkeletonText width="20px" />
        </div>
      </div>
    </div>
  );

  const LayerBreakdownSkeleton = () => {
    if (!showConvergenceBreakdown || variant === 'minimal') return null;
    
    const layers = ['Technical', 'Sentiment', 'Liquidity'];

    return (
      <div className="space-y-3">
        <SkeletonText width="100px" />
        {layers.map((layer, index) => (
          <div key={layer} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton variant="circle" width="8px" height="8px" />
              <SkeletonText width="80px" />
              <SkeletonText width="40px" />
            </div>
            <SkeletonText width="30px" />
          </div>
        ))}
      </div>
    );
  };

  const SignalHeaderSkeleton = () => (
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <SkeletonText width="60px" height="20px" />
          <Skeleton 
            variant="rounded" 
            width="50px" 
            height="20px"
            className="rounded-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonText width="80px" />
          {/* Priority indicators skeleton */}
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                width="4px"
                height="12px"
                variant="rounded"
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="text-right space-y-1">
        <SkeletonText width="80px" height="20px" />
        <SkeletonText width="70px" />
      </div>
    </div>
  );

  const MetadataFooterSkeleton = () => (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
      <SkeletonText width="80px" />
      <SkeletonText width="90px" />
    </div>
  );

  return (
    <motion.div
      className={cn("relative touch-target", className)}
      initial={animate && performanceTier !== 'low' ? { opacity: 0, y: 20 } : false}
      animate={animate && performanceTier !== 'low' ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <GlassCard
        variant="surface"
        className={cn(
          "p-6 border border-white/10",
          "bg-glass-light/30",
          adaptiveGlass.blur,
        )}
      >
        {/* Enhanced glow for high-performance devices */}
        {adaptiveGlass.effects && performanceTier === 'high' && (
          <div 
            className="absolute inset-0 rounded-xl opacity-10 pointer-events-none bg-gradient-to-br from-violet-500/20 to-blue-500/20"
            style={{ filter: 'blur(20px)' }}
          />
        )}

        {/* Main content skeleton */}
        <SkeletonGroup stagger={0.1} className="relative z-10">
          <SignalHeaderSkeleton />
          
          {variant !== 'minimal' && <ConvergenceScoreSkeleton />}
          
          {variant === 'detailed' && <LayerBreakdownSkeleton />}
          
          <MetadataFooterSkeleton />
        </SkeletonGroup>
      </GlassCard>
    </motion.div>
  );
};

/**
 * Convenience variants for different signal card skeleton types
 */
export const CompactSignalCardSkeleton = (props: Omit<SignalCardSkeletonProps, 'variant'>) => (
  <SignalCardSkeleton variant="compact" showConvergenceBreakdown={false} {...props} />
);

export const DetailedSignalCardSkeleton = (props: Omit<SignalCardSkeletonProps, 'variant'>) => (
  <SignalCardSkeleton variant="detailed" showConvergenceBreakdown={true} {...props} />
);

export const MinimalSignalCardSkeleton = (props: Omit<SignalCardSkeletonProps, 'variant'>) => (
  <SignalCardSkeleton variant="minimal" showConvergenceBreakdown={false} {...props} />
);

/**
 * Grid of signal card skeletons for loading states
 */
export const SignalCardSkeletonGrid: React.FC<{
  count?: number;
  variant?: 'compact' | 'detailed' | 'minimal';
  className?: string;
}> = ({ count = 4, variant = 'detailed', className }) => (
  <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-4", className)}>
    {Array.from({ length: count }).map((_, index) => (
      <SignalCardSkeleton
        key={index}
        variant={variant}
        animate={true}
      />
    ))}
  </div>
);