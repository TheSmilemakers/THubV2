/**
 * Adaptive Card Component
 * Automatically adapts features based on progressive enhancement tier
 * 
 * Features:
 * - Automatic glassmorphism adaptation
 * - Performance-aware animations
 * - Touch optimization for mobile
 * - Graceful degradation
 */
'use client';

import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useProgressiveEnhancementContext } from '@/components/providers/progressive-enhancement-provider';
import { useComponentEnhancement } from '@/lib/hooks/use-progressive-enhancement';

export interface AdaptiveCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  variant?: 'minimal' | 'standard' | 'premium';
  priority?: 'high' | 'medium' | 'low';
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
  'data-testid'?: string;
}

const AdaptiveCard = forwardRef<HTMLDivElement, AdaptiveCardProps>(({
  children,
  variant = 'standard',
  priority = 'medium',
  interactive = false,
  className,
  onClick,
  'data-testid': testId,
  ...motionProps
}, ref) => {
  const { config, shouldLoadContent, getOptimalImageSize } = useProgressiveEnhancementContext();
  const { config: componentConfig, getAnimationClass, getGlassClass } = useComponentEnhancement('card');
  const cardConfig = componentConfig as any; // Type assertion for enhanced card features

  // Don't render low priority content if data saving is enabled
  if (!shouldLoadContent(priority)) {
    return (
      <div 
        className="rounded-lg border border-border-primary bg-background-secondary p-4 text-center text-text-tertiary"
        data-testid={testId}
      >
        <div className="text-sm">Content hidden to save data</div>
      </div>
    );
  }

  // Determine card styling based on enhancement tier
  const getCardVariant = () => {
    if (!cardConfig.glassmorphism) {
      return 'bg-background-secondary border border-border-primary';
    }

    switch (variant) {
      case 'minimal':
        return getGlassClass();
      case 'standard':
        return cn(
          getGlassClass(),
          'border border-border-primary/50'
        );
      case 'premium':
        return cn(
          getGlassClass(),
          'border border-accent-primary/30',
          cardConfig.hoverEffects && 'hover:border-accent-primary/50'
        );
      default:
        return getGlassClass();
    }
  };

  // Animation configuration
  const animationConfig = {
    initial: cardConfig.animations ? { opacity: 0, y: 20 } : { opacity: 1 },
    animate: cardConfig.animations ? { opacity: 1, y: 0 } : { opacity: 1 },
    transition: cardConfig.animations ? { 
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] // Custom easing for premium feel
    } : undefined,
    whileHover: interactive && cardConfig.hoverEffects ? {
      scale: 1.02,
      transition: { duration: 0.2 }
    } : undefined,
    whileTap: interactive && cardConfig.animations ? {
      scale: 0.98,
      transition: { duration: 0.1 }
    } : undefined,
  };

  // Base classes
  const baseClasses = cn(
    'rounded-xl overflow-hidden',
    'touch-target', // Ensure proper touch targets
    getCardVariant(),
    // Hardware acceleration if enabled
    cardConfig.hardwareAcceleration && 'gpu-accelerated',
    // Interactive states
    interactive && [
      'cursor-pointer',
      'focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:ring-offset-2',
      config.reducedMotion && 'transition-none',
      !config.reducedMotion && 'transition-all duration-200'
    ],
    // High contrast mode support
    config.highContrast && [
      'border-2 border-text-primary',
      'bg-background-primary',
      'forced-colors:border-ButtonBorder forced-colors:bg-ButtonFace'
    ],
    className
  );

  const CardComponent = cardConfig.animations ? motion.div : 'div';

  return (
    <CardComponent
      ref={ref}
      className={baseClasses}
      onClick={onClick}
      data-testid={testId}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      {...(cardConfig.animations ? animationConfig as any : {})}
      {...motionProps}
    >
      {/* Premium enhancement effects */}
      {cardConfig.hoverEffects && variant === 'premium' && (
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-accent-primary/10 via-accent-secondary/10 to-accent-tertiary/10"
            style={{
              backgroundSize: '200% 200%',
              animation: config.animations === 'enhanced' ? 'gradient-shift 3s ease infinite' : undefined,
            }}
          />
        </div>
      )}

      {/* Magnetic effect for premium cards */}
      {cardConfig.magneticEffect && variant === 'premium' && (
        <div className="relative">
          {children}
        </div>
      )}

      {/* Standard content */}
      {(!cardConfig.magneticEffect || variant !== 'premium') && (
        <div className="relative z-10">
          {children}
        </div>
      )}

      {/* Loading shimmer for progressive loading */}
      {priority === 'low' && !shouldLoadContent('low') && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
      )}
    </CardComponent>
  );
});

AdaptiveCard.displayName = 'AdaptiveCard';

export { AdaptiveCard };

// Convenience variants
export const MinimalCard = (props: Omit<AdaptiveCardProps, 'variant'>) => (
  <AdaptiveCard variant="minimal" {...props} />
);

export const StandardCard = (props: Omit<AdaptiveCardProps, 'variant'>) => (
  <AdaptiveCard variant="standard" {...props} />
);

export const PremiumCard = (props: Omit<AdaptiveCardProps, 'variant'>) => (
  <AdaptiveCard variant="premium" {...props} />
);