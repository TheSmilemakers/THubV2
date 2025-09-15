'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useProgressiveEnhancementContext } from '@/components/providers/progressive-enhancement-provider';
import { useComponentEnhancement } from '@/lib/hooks/use-progressive-enhancement';

/**
 * Skeleton Component - Glassmorphic loading placeholders
 * 
 * Features:
 * - Adaptive shimmer effects based on device capabilities
 * - Glassmorphism styling that matches actual components
 * - Performance-aware animations (60fps on high-end, reduced on low-end)
 * - Customizable dimensions and variants
 */

export interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'rounded' | 'circle' | 'text';
  width?: string | number;
  height?: string | number;
  shimmer?: boolean;
  animate?: boolean;
  children?: React.ReactNode;
  'aria-label'?: string;
  'data-testid'?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'default',
  width,
  height,
  shimmer = true,
  animate = true,
  children,
  'aria-label': ariaLabel,
  'data-testid': testId,
}) => {
  const { config } = useProgressiveEnhancementContext();
  const { config: componentConfig, getGlassClass } = useComponentEnhancement('card');

  const baseClasses = cn(
    'relative overflow-hidden',
    // Progressive glass effects
    componentConfig.backdropBlur ? getGlassClass() : 'bg-background-secondary/50',
    'border border-border-primary/20',
    // Variant-specific styling
    variant === 'rounded' && 'rounded-lg',
    variant === 'circle' && 'rounded-full',
    variant === 'text' && 'rounded-md h-4',
    variant === 'default' && 'rounded-xl',
    // Accessibility
    'touch-target',
    className
  );

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const shimmerAnimation = componentConfig.animations ? {
    initial: { x: '-100%' },
    animate: { x: '100%' },
    transition: {
      duration: componentConfig.springAnimations ? 1.5 : 2,
      repeat: Infinity,
      ease: 'linear' as const,
    },
  } : {};

  const pulseAnimation = componentConfig.animations ? {
    initial: { opacity: 0.6 },
    animate: { opacity: 1 },
    transition: {
      duration: 1,
      repeat: Infinity,
      repeatType: 'reverse' as const,
      ease: 'easeInOut' as const,
    },
  } : {};

  return (
    <motion.div
      className={baseClasses}
      style={style}
      role="status"
      aria-label={ariaLabel || 'Loading content'}
      data-testid={testId}
      {...(animate && componentConfig.animations ? pulseAnimation : {})}
    >
      {/* Shimmer effect with progressive enhancement */}
      {shimmer && componentConfig.animations && componentConfig.premiumEffects && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          {...shimmerAnimation}
        />
      )}
      
      {/* Content overlay */}
      {children && (
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      )}
    </motion.div>
  );
};

/**
 * Skeleton variants for common use cases
 */

export const SkeletonText: React.FC<Omit<SkeletonProps, 'variant'> & {
  lines?: number;
  lastLineWidth?: string;
}> = ({ lines = 1, lastLineWidth = '75%', className, ...props }) => {
  if (lines === 1) {
    return <Skeleton variant="text" className={className} {...props} />;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? lastLineWidth : '100%'}
          {...props}
        />
      ))}
    </div>
  );
};

export const SkeletonButton: React.FC<Omit<SkeletonProps, 'variant'>> = ({ 
  className, 
  width = '120px', 
  height = '40px', 
  ...props 
}) => (
  <Skeleton
    variant="rounded"
    width={width}
    height={height}
    className={cn('flex items-center justify-center', className)}
    {...props}
  />
);

export const SkeletonAvatar: React.FC<Omit<SkeletonProps, 'variant'> & {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ size = 'md', className, ...props }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <Skeleton
      variant="circle"
      className={cn(sizeClasses[size], className)}
      {...props}
    />
  );
};

export const SkeletonCard: React.FC<Omit<SkeletonProps, 'variant'> & {
  padding?: string;
}> = ({ padding = 'p-6', className, children, ...props }) => (
  <Skeleton
    variant="default"
    className={cn(padding, className)}
    {...props}
  >
    {children}
  </Skeleton>
);

/**
 * Pulse animation wrapper for groups of skeletons
 */
export const SkeletonGroup: React.FC<{
  children: React.ReactNode;
  stagger?: number;
  className?: string;
}> = ({ children, stagger = 0.1, className }) => {
  const { config: componentConfig } = useComponentEnhancement('card');

  if (!componentConfig.animations) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: stagger,
          },
        },
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};