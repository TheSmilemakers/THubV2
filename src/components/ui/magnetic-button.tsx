'use client';

import React, { useRef, useState, forwardRef } from 'react';
import { motion, HTMLMotionProps, useMotionValue, useTransform, animate } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks/use-device-capabilities';

/**
 * MagneticButton Component - Interactive button with magnetic hover effects and spring animations
 * 
 * Features:
 * - Magnetic attraction effect based on cursor position
 * - Spring physics for smooth interactions
 * - Touch-optimized for mobile devices
 * - Loading states with animated spinner
 * - Accessible keyboard navigation
 * - Performance-aware animations
 */

export interface MagneticButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  magneticStrength?: number;
  magneticRadius?: number;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  'data-testid'?: string;
}

const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  magneticStrength = 0.3,
  magneticRadius = 100,
  className,
  icon,
  iconPosition = 'left',
  'data-testid': testId,
  ...motionProps
}, ref) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch } = useDeviceCapabilities();
  
  // Magnetic effect motion values (desktop only for performance)
  const x = useMotionValue(touch ? 0 : 0);
  const y = useMotionValue(touch ? 0 : 0);
  
  // Transform motion values for smooth magnetic effect (disabled on touch for performance)
  const translateX = useTransform(x, value => touch ? 0 : value * magneticStrength);
  const translateY = useTransform(y, value => touch ? 0 : value * magneticStrength);

  // Size configurations with mobile-first approach
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm touch-target-min',
    md: 'px-4 py-3 text-base touch-target',
    lg: 'px-6 py-4 text-lg touch-target',
    xl: 'px-8 py-5 text-xl touch-target'
  };

  // Variant styles with glassmorphism integration
  const variantClasses = {
    primary: cn(
      'bg-gradient-primary text-white',
      'hover:shadow-lg hover:shadow-accent-primary/30',
      'focus:ring-accent-primary',
      isHovered && adaptiveGlass.effects && 'shadow-xl shadow-accent-primary/40'
    ),
    secondary: cn(
      'glass-medium text-white',
      'hover:glass-heavy',
      'focus:ring-accent-secondary',
      isHovered && 'bg-accent-secondary/10'
    ),
    ghost: cn(
      'text-accent-primary bg-transparent',
      'hover:bg-accent-primary/10',
      'focus:ring-accent-primary',
      'border border-accent-primary/20 hover:border-accent-primary/40'
    ),
    danger: cn(
      'bg-status-error text-white',
      'hover:bg-status-error/80',
      'focus:ring-status-error',
      'shadow-lg shadow-status-error/20'
    ),
    success: cn(
      'bg-status-success text-white',
      'hover:bg-status-success/80',
      'focus:ring-status-success',
      'shadow-lg shadow-status-success/20'
    )
  };

  // Handle magnetic mouse movement
  const handleMouseMove = (e: React.MouseEvent) => {
    if (disabled || loading || performanceTier === 'low' || touch) return;
    
    const button = buttonRef.current;
    if (!button) return;
    
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
    
    // Apply magnetic effect within radius
    if (distance < magneticRadius) {
      const strength = 1 - distance / magneticRadius;
      x.set(distanceX * strength);
      y.set(distanceY * strength);
    }
  };

  // Reset magnetic position
  const resetMagneticPosition = () => {
    animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
    animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
  };

  const handleMouseEnter = () => {
    if (disabled || loading) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    resetMagneticPosition();
  };

  const handleMouseDown = () => {
    if (disabled || loading) return;
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  // Touch event handlers for mobile
  const handleTouchStart = () => {
    if (disabled || loading) return;
    setIsPressed(true);
    setIsHovered(true);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    setIsHovered(false);
  };

  // Base button classes
  const baseClasses = cn(
    'relative rounded-xl font-medium transition-all duration-300',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'gpu-accelerated select-none',
    // Touch optimizations
    'touch-manipulation active:transform active:scale-95',
    // Loading state
    loading && 'cursor-wait',
    // Performance optimizations
    performanceTier !== 'low' && 'transform-gpu',
    sizeClasses[size],
    variantClasses[variant],
    className
  );

  // Animation configuration based on performance
  const animationConfig = {
    style: performanceTier !== 'low' ? {
      x: translateX,
      y: translateY,
    } : undefined,
    whileHover: performanceTier === 'high' && !disabled && !loading ? { 
      scale: 1.02,
      transition: { type: "spring" as const, stiffness: 400, damping: 25 }
    } : undefined,
    whileTap: !disabled && !loading ? { 
      scale: 0.95,
      transition: { type: "spring" as const, stiffness: 600, damping: 30 }
    } : undefined,
  };

  return (
    <motion.button
      ref={buttonRef}
      className={baseClasses}
      disabled={disabled || loading}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-testid={testId}
      {...animationConfig}
      {...motionProps}
    >
      {/* Enhanced glow effect for high-performance devices */}
      {adaptiveGlass.effects && performanceTier === 'high' && isHovered && (
        <motion.div
          className="absolute inset-0 rounded-xl opacity-50 pointer-events-none"
          style={{
            background: variant === 'primary' 
              ? 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
            filter: 'blur(10px)',
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 0.5 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Button content container */}
      <span className="relative flex items-center justify-center gap-2">
        {/* Left icon */}
        {icon && iconPosition === 'left' && (
          <motion.span
            className="flex-shrink-0"
            animate={loading ? { rotate: 360 } : {}}
            transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
          >
            {icon}
          </motion.span>
        )}

        {/* Loading spinner */}
        {loading ? (
          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </motion.div>
        ) : (
          <motion.span
            className="truncate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.span>
        )}

        {/* Right icon */}
        {icon && iconPosition === 'right' && !loading && (
          <motion.span
            className="flex-shrink-0"
            whileHover={performanceTier === 'high' ? { x: 2 } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {icon}
          </motion.span>
        )}
      </span>

      {/* Ripple effect for touch devices */}
      {touch && isPressed && (
        <motion.span
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 50%)',
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}

      {/* Focus ring for accessibility */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none border-2 border-transparent"
        style={{
          borderColor: 'transparent',
        }}
        animate={{
          borderColor: isPressed ? 'currentColor' : 'transparent',
        }}
        transition={{ duration: 0.15 }}
      />
    </motion.button>
  );
});

MagneticButton.displayName = 'MagneticButton';

export { MagneticButton };

// Convenience components for common variants
export const PrimaryButton = (props: Omit<MagneticButtonProps, 'variant'>) => (
  <MagneticButton variant="primary" {...props} />
);

export const SecondaryButton = (props: Omit<MagneticButtonProps, 'variant'>) => (
  <MagneticButton variant="secondary" {...props} />
);

export const GhostButton = (props: Omit<MagneticButtonProps, 'variant'>) => (
  <MagneticButton variant="ghost" {...props} />
);

export const DangerButton = (props: Omit<MagneticButtonProps, 'variant'>) => (
  <MagneticButton variant="danger" {...props} />
);

export const SuccessButton = (props: Omit<MagneticButtonProps, 'variant'>) => (
  <MagneticButton variant="success" {...props} />
);