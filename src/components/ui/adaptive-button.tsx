/**
 * Adaptive Button Component
 * Automatically adapts interactions and effects based on progressive enhancement tier
 * 
 * Features:
 * - Touch-optimized for mobile devices
 * - Ripple effects on capable devices
 * - Morphing states for premium experience
 * - Haptic feedback integration
 * - Accessibility-first design
 */
'use client';

import React, { useState, useRef, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useProgressiveEnhancementContext } from '@/components/providers/progressive-enhancement-provider';
import { useComponentEnhancement } from '@/lib/hooks/use-progressive-enhancement';

export interface AdaptiveButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  hapticFeedback?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  'data-testid'?: string;
}

const AdaptiveButton = forwardRef<HTMLButtonElement, AdaptiveButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  hapticFeedback = true,
  className,
  onClick,
  'data-testid': testId,
  ...motionProps
}, ref) => {
  const { config } = useProgressiveEnhancementContext();
  const { config: componentConfig, getAnimationClass } = useComponentEnhancement('button');
  const buttonConfig = componentConfig as any; // Type assertion for enhanced button features
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleId = useRef(0);

  // Handle ripple effect
  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonConfig.rippleEffect) return;

    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = {
      id: rippleId.current++,
      x,
      y,
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  // Handle click with haptic feedback
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Haptic feedback on touch devices
    if (hapticFeedback && 'vibrate' in navigator && buttonConfig.rippleEffect) {
      navigator.vibrate(1); // Ultra-short vibration
    }

    createRipple(e);
    onClick?.(e);
  };

  // Touch handlers for mobile optimization
  const handleTouchStart = () => {
    setIsPressed(true);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  // Variant styling
  const getVariantClasses = () => {
    const baseClasses = 'font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (variant) {
      case 'primary':
        return cn(
          baseClasses,
          'bg-accent-primary text-white',
          !disabled && !loading && 'hover:bg-accent-primary/90',
          'focus:ring-accent-primary/50',
          config.highContrast && 'forced-colors:bg-Highlight forced-colors:text-HighlightText'
        );
      
      case 'secondary':
        return cn(
          baseClasses,
          'bg-accent-secondary text-white',
          !disabled && !loading && 'hover:bg-accent-secondary/90',
          'focus:ring-accent-secondary/50'
        );
      
      case 'outline':
        return cn(
          baseClasses,
          'border-2 border-accent-primary text-accent-primary bg-transparent',
          !disabled && !loading && 'hover:bg-accent-primary hover:text-white',
          'focus:ring-accent-primary/50'
        );
      
      case 'ghost':
        return cn(
          baseClasses,
          'text-text-primary bg-transparent',
          !disabled && !loading && 'hover:bg-background-tertiary',
          'focus:ring-text-primary/50'
        );
      
      case 'destructive':
        return cn(
          baseClasses,
          'bg-status-error text-white',
          !disabled && !loading && 'hover:bg-status-error/90',
          'focus:ring-status-error/50'
        );
      
      default:
        return baseClasses;
    }
  };

  // Size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm rounded-md touch-target-sm';
      case 'md':
        return 'px-4 py-2 text-sm rounded-lg touch-target';
      case 'lg':
        return 'px-6 py-3 text-base rounded-lg touch-target';
      case 'xl':
        return 'px-8 py-4 text-lg rounded-xl touch-target';
      default:
        return 'px-4 py-2 text-sm rounded-lg touch-target';
    }
  };

  // State classes
  const getStateClasses = () => {
    return cn(
      disabled && 'opacity-50 cursor-not-allowed',
      loading && 'cursor-wait',
      isPressed && 'scale-95',
      config.reducedMotion && 'transition-none'
    );
  };

  // Animation configuration
  const animationConfig = {
    whileHover: !disabled && !loading && buttonConfig.animations ? {
      scale: 1.02,
      transition: { duration: 0.2 }
    } : undefined,
    whileTap: !disabled && !loading && buttonConfig.animations ? {
      scale: 0.98,
      transition: { duration: 0.1 }
    } : undefined,
  };

  // Morphing state for premium buttons
  const morphingVariants = {
    idle: { borderRadius: '0.5rem' },
    hover: { borderRadius: '1rem' },
    tap: { borderRadius: '0.25rem' },
  };

  const baseClasses = cn(
    'relative overflow-hidden',
    'flex items-center justify-center gap-2',
    getSizeClasses(),
    getVariantClasses(),
    getStateClasses(),
    buttonConfig.hardwareAcceleration && 'gpu-accelerated',
    className
  );

  const ButtonComponent = buttonConfig.animations ? motion.button : 'button';

  return (
    <ButtonComponent
      ref={buttonRef}
      className={baseClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-testid={testId}
      type="button"
      {...(buttonConfig.animations ? {
        ...animationConfig,
        variants: buttonConfig.morphingStates ? morphingVariants : undefined,
        initial: buttonConfig.morphingStates ? 'idle' : undefined,
        whileHover: buttonConfig.morphingStates ? 'hover' : animationConfig.whileHover,
        whileTap: buttonConfig.morphingStates ? 'tap' : animationConfig.whileTap,
      } as any : {})}
      {...motionProps}
    >
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className={cn(
              'w-4 h-4 border-2 border-current border-t-transparent rounded-full',
              config.animations !== 'none' ? 'animate-spin' : ''
            )}
          />
        </div>
      )}

      {/* Button content */}
      <span className={cn('flex items-center gap-2', loading && 'opacity-0')}>
        {children}
      </span>

      {/* Ripple effects */}
      {buttonConfig.rippleEffect && ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span
            className={cn(
              'block w-0 h-0 rounded-full bg-white/30',
              config.animations !== 'none' && 'animate-ping'
            )}
            style={{
              animation: config.animations !== 'none' 
                ? 'ripple 0.6s cubic-bezier(0, 0, 0.2, 1)' 
                : undefined,
            }}
          />
        </span>
      ))}

      {/* Premium glow effect */}
      {buttonConfig.morphingStates && variant === 'primary' && (
        <div className="absolute inset-0 opacity-0 hover:opacity-20 transition-opacity duration-300">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-tertiary"
            style={{
              filter: 'blur(8px)',
              backgroundSize: '200% 200%',
              animation: config.animations === 'enhanced' ? 'gradient-shift 2s ease infinite' : undefined,
            }}
          />
        </div>
      )}
    </ButtonComponent>
  );
});

AdaptiveButton.displayName = 'AdaptiveButton';

export { AdaptiveButton };

// Convenience variants
export const PrimaryButton = (props: Omit<AdaptiveButtonProps, 'variant'>) => (
  <AdaptiveButton variant="primary" {...props} />
);

export const SecondaryButton = (props: Omit<AdaptiveButtonProps, 'variant'>) => (
  <AdaptiveButton variant="secondary" {...props} />
);

export const OutlineButton = (props: Omit<AdaptiveButtonProps, 'variant'>) => (
  <AdaptiveButton variant="outline" {...props} />
);

export const GhostButton = (props: Omit<AdaptiveButtonProps, 'variant'>) => (
  <AdaptiveButton variant="ghost" {...props} />
);

export const DestructiveButton = (props: Omit<AdaptiveButtonProps, 'variant'>) => (
  <AdaptiveButton variant="destructive" {...props} />
);