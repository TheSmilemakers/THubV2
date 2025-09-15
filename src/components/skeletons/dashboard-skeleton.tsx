'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/glass-card';
import { Skeleton, SkeletonText, SkeletonGroup } from '@/components/ui/skeleton';
import { useAdaptiveGlass, usePerformanceTier } from '@/lib/hooks';

/**
 * Dashboard Skeleton Components - Loading placeholders for dashboard elements
 * 
 * Features:
 * - Exact layout match with dashboard components
 * - Adaptive glassmorphism effects
 * - Staggered animation entrance
 * - Performance-aware rendering
 */

export interface DashboardStatSkeletonProps {
  className?: string;
  animate?: boolean;
}

/**
 * Skeleton for dashboard stat cards
 */
export const DashboardStatSkeleton: React.FC<DashboardStatSkeletonProps> = ({
  className,
  animate = true,
}) => {
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();

  return (
    <motion.div
      initial={animate && performanceTier !== 'low' ? { opacity: 0, y: 20 } : false}
      animate={animate && performanceTier !== 'low' ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={className}
    >
      <GlassCard variant="elevated" className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <SkeletonText width="100px" />
            <Skeleton variant="text" width="80px" height="32px" className="mt-1" />
            <div className="flex items-center gap-1 mt-2">
              <SkeletonText width="40px" />
              <SkeletonText width="60px" />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10">
            <Skeleton variant="rounded" width="24px" height="24px" />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

/**
 * Grid of dashboard stat skeletons
 */
export const DashboardStatsSkeletonGrid: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 4, className }) => (
  <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
    {Array.from({ length: count }).map((_, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.4 }}
      >
        <DashboardStatSkeleton animate={true} />
      </motion.div>
    ))}
  </div>
);

/**
 * Skeleton for market overview charts
 */
export const MarketOverviewSkeleton: React.FC<{
  className?: string;
  animate?: boolean;
}> = ({ className, animate = true }) => {
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();

  return (
    <motion.div
      initial={animate && performanceTier !== 'low' ? { opacity: 0, y: 20 } : false}
      animate={animate && performanceTier !== 'low' ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={className}
    >
      <GlassCard variant="surface" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <SkeletonText width="80px" />
          <SkeletonText width="50px" />
        </div>
        {/* Chart area skeleton */}
        <div className="h-20 relative">
          <Skeleton 
            variant="default" 
            className="w-full h-full rounded-lg"
            shimmer={adaptiveGlass.effects}
          >
            {/* Simulate sparkline pattern */}
            <div className="absolute inset-2 flex items-end gap-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="default"
                  width="2px"
                  height={`${Math.random() * 60 + 20}px`}
                  className="rounded-sm bg-white/20"
                />
              ))}
            </div>
          </Skeleton>
        </div>
      </GlassCard>
    </motion.div>
  );
};

/**
 * Grid of market overview skeletons
 */
export const MarketOverviewSkeletonGrid: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 3, className }) => (
  <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
    {Array.from({ length: count }).map((_, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.4 }}
      >
        <MarketOverviewSkeleton animate={true} />
      </motion.div>
    ))}
  </div>
);

/**
 * Skeleton for activity feed items
 */
export const ActivityFeedSkeleton: React.FC<{
  className?: string;
  itemCount?: number;
}> = ({ className, itemCount = 4 }) => {
  const performanceTier = usePerformanceTier();

  return (
    <GlassCard variant="surface" className={cn("p-6", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Skeleton variant="circle" width="20px" height="20px" />
        <SkeletonText width="120px" height="20px" />
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: itemCount }).map((_, index) => (
          <motion.div
            key={index}
            initial={performanceTier !== 'low' ? { opacity: 0 } : false}
            animate={performanceTier !== 'low' ? { opacity: 1 } : false}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
          >
            <div className="flex items-center gap-3">
              <Skeleton variant="circle" width="8px" height="8px" />
              <SkeletonText width={`${150 + Math.random() * 100}px`} />
            </div>
            <SkeletonText width="60px" />
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
};

/**
 * Complete dashboard loading skeleton
 */
export const DashboardSkeleton: React.FC<{
  className?: string;
}> = ({ className }) => {
  const performanceTier = usePerformanceTier();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Page Header Skeleton */}
      <SkeletonGroup stagger={0.1}>
        <div>
          <SkeletonText width="200px" height="32px" />
          <SkeletonText width="300px" className="mt-1" />
        </div>

        {/* Stats Grid Skeleton */}
        <DashboardStatsSkeletonGrid />

        {/* Recent Signals Section Skeleton */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Skeleton variant="circle" width="20px" height="20px" />
              <SkeletonText width="120px" height="20px" />
            </div>
            <SkeletonText width="80px" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <motion.div
                key={index}
                initial={performanceTier !== 'low' ? { opacity: 0, x: -20 } : false}
                animate={performanceTier !== 'low' ? { opacity: 1, x: 0 } : false}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <Skeleton
                  variant="default"
                  className="h-64 p-6 bg-glass-light/30"
                  shimmer={true}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Market Overview Skeleton */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Skeleton variant="circle" width="20px" height="20px" />
            <SkeletonText width="140px" height="20px" />
          </div>
          <MarketOverviewSkeletonGrid />
        </div>

        {/* Activity Feed Skeleton */}
        <ActivityFeedSkeleton />
      </SkeletonGroup>
    </div>
  );
};

/**
 * Page header skeleton
 */
export const PageHeaderSkeleton: React.FC<{
  className?: string;
  showSubtitle?: boolean;
}> = ({ className, showSubtitle = true }) => (
  <div className={className}>
    <SkeletonText width="250px" height="32px" />
    {showSubtitle && <SkeletonText width="400px" className="mt-1" />}
  </div>
);