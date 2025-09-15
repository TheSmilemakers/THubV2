'use client';

import React, { useState, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useProgressiveEnhancementContext } from '@/components/providers/progressive-enhancement-provider';
import { useComponentEnhancement } from '@/lib/hooks/use-progressive-enhancement';
import { useAccessibility } from '@/lib/hooks/use-accessibility';

/**
 * GlassCard Component - Foundation component with adaptive glassmorphism effects
 * 
 * Features:
 * - Multi-layer glassmorphism with device adaptation
 * - 60fps performance targeting with fallbacks
 * - Touch-optimized interactions
 * - Progressive enhancement for legacy browsers
 * - Mobile-first responsive design
 */

export interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  variant?: 'surface' | 'elevated' | 'prominent' | 'holographic';
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
  onHover?: (isHovered: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  role?: string;
  'data-testid'?: string;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(({
  children,
  variant = 'surface',
  interactive = false,
  className,
  onClick,
  onHover,
  disabled = false,
  loading = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  role,
  'data-testid': testId,
  ...motionProps
}, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  const { config } = useProgressiveEnhancementContext();
  const { config: componentConfig, getGlassClass } = useComponentEnhancement('card');
  const { announce, getFocusableElements } = useAccessibility();

  // Glass variant mapping with progressive enhancement
  const getGlassVariant = () => {
    if (loading || disabled) return 'glass-light';
    
    // Use progressive enhancement glass class
    const baseGlass = getGlassClass();
    
    // Adapt variant based on component configuration
    if (!componentConfig.backdropBlur) {
      return 'glass-light';
    }
    
    switch (variant) {
      case 'surface': return componentConfig.glassmorphism === 'full' ? baseGlass : 'glass-light';
      case 'elevated': return componentConfig.glassmorphism !== 'disabled' ? 'glass-medium' : 'glass-light';
      case 'prominent': return componentConfig.glassmorphism === 'full' ? 'glass-heavy' : 'glass-medium';
      case 'holographic': return componentConfig.glassmorphism === 'full' && componentConfig.premiumEffects ? 'glass-heavy' : 'glass-medium';
      default: return baseGlass;
    }
  };

  const handleHoverStart = () => {
    if (disabled || loading) return;
    setIsHovered(true);
    onHover?.(true);
  };

  const handleHoverEnd = () => {
    setIsHovered(false);
    onHover?.(false);
  };

  const handleClick = () => {
    if (disabled || loading) return;
    onClick?.();
  };

  const handleKeyDownInternal = (event: React.KeyboardEvent) => {
    if (disabled || loading) return;
    
    // Handle enter and space key for interactive cards
    if (interactive && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick?.();
      announce('Card activated');
    }
  };

  // Base classes with progressive enhancement
  const baseClasses = cn(
    'relative rounded-xl overflow-hidden',
    // Progressive glass effects
    getGlassVariant(),
    // Progressive animations
    componentConfig.animations && 'transition-all duration-300 ease-out',
    // Hardware acceleration when supported
    componentConfig.hardwareAcceleration && 'gpu-accelerated',
    // Interactive states with progressive touch optimization
    interactive && !disabled && !loading && [
      'cursor-pointer',
      // Touch targets (WCAG 2.1 AA compliant)
      'touch-target',
      // Progressive focus indicators
      componentConfig.focusIndicators && [
        'focus:outline-none focus:ring-2 focus:ring-accent-primary/50',
        'focus:ring-offset-2 focus:ring-offset-background-primary'
      ],
      // Progressive hover effects
      componentConfig.animations && [
        'hover:scale-[1.02]',
        'active:scale-[0.98]'
      ]
    ],
    // States
    disabled && 'opacity-50 cursor-not-allowed',
    loading && 'cursor-wait',
    // Responsive padding
    'p-4 sm:p-6',
    className
  );

  // Animation configuration with progressive enhancement
  const animationConfig = {
    whileHover: interactive && !disabled && !loading && componentConfig.animations
      ? { scale: 1.02 }
      : undefined,
    whileTap: interactive && !disabled && !loading && componentConfig.animations
      ? { scale: 0.98 }
      : undefined,
  };

  return (
    <motion.div
      ref={ref}
      className={baseClasses}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      onClick={handleClick}
      onKeyDown={handleKeyDownInternal}
      tabIndex={interactive ? 0 : undefined}
      role={role || (interactive ? 'button' : undefined)}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled}
      data-testid={testId}
      {...animationConfig}
      {...motionProps}
    >
      {/* Enhanced Glass Effects (Progressive premium effects) */}
      {componentConfig.premiumEffects && variant === 'holographic' && componentConfig.glassmorphism === 'full' && (
        <>
          {/* Holographic shimmer layer */}
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.1) 50%, rgba(34,197,94,0.1) 100%)',
              backgroundSize: '200% 200%',
              animation: componentConfig.springAnimations ? 'gradient-shift 3s ease infinite' : undefined,
            }}
          />
          
          {/* Chromatic aberration effect */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: 'linear-gradient(45deg, rgba(255,0,0,0.05) 0%, rgba(0,255,0,0.05) 50%, rgba(0,0,255,0.05) 100%)',
              filter: 'blur(0.5px)',
              transform: isHovered ? 'translate(1px, -1px)' : 'translate(0, 0)',
              transition: componentConfig.animations ? 'transform 0.3s ease' : undefined,
            }}
          />
        </>
      )}

      {/* Border highlight (Interactive states) */}
      {interactive && isHovered && !disabled && !loading && componentConfig.animations && (
        <div 
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            backgroundSize: '200% 200%',
            animation: componentConfig.springAnimations ? 'gradient-shift 2s ease infinite' : undefined,
          }}
        />
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background-primary/20 backdrop-blur-sm flex items-center justify-center rounded-xl">
          <div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Glass noise texture (Premium effects only) */}
      {componentConfig.premiumEffects && componentConfig.glassmorphism === 'full' && (
        <div 
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23ffffff' fill-opacity='1' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
          }}
        />
      )}
    </motion.div>
  );
});

GlassCard.displayName = 'GlassCard';

export { GlassCard };

// Convenience variants for common use cases
export const GlassCardSurface = (props: Omit<GlassCardProps, 'variant'>) => (
  <GlassCard variant="surface" {...props} />
);

export const GlassCardElevated = (props: Omit<GlassCardProps, 'variant'>) => (
  <GlassCard variant="elevated" {...props} />
);

export const GlassCardProminent = (props: Omit<GlassCardProps, 'variant'>) => (
  <GlassCard variant="prominent" {...props} />
);

export const GlassCardHolographic = (props: Omit<GlassCardProps, 'variant'>) => (
  <GlassCard variant="holographic" {...props} />
);