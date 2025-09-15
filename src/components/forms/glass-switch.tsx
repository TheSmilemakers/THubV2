'use client';

import React, { useState, useId, forwardRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';

/**
 * GlassSwitch Component - iOS-style toggle switch with glassmorphism
 * 
 * Features:
 * - iOS-style toggle animation with spring physics
 * - Multiple sizes (small, medium, large)
 * - Loading state with animated spinner
 * - Touch-optimized for mobile devices
 * - Adaptive glassmorphism effects
 * - Validation states with visual feedback
 * - Accessible keyboard navigation
 * - React Hook Form compatible
 * - Custom colors and icons
 * - Haptic feedback simulation
 */

export interface GlassSwitchProps {
  label?: string;
  value?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  labelClassName?: string;
  switchClassName?: string;
  'data-testid'?: string;
  // Content
  description?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftLabel?: string;
  rightLabel?: string;
  // Styling
  activeColor?: string;
  inactiveColor?: string;
  thumbColor?: string;
  // Icons for states
  checkedIcon?: React.ReactNode;
  uncheckedIcon?: React.ReactNode;
  // Haptic feedback
  hapticFeedback?: boolean;
}

const GlassSwitch = forwardRef<HTMLInputElement, GlassSwitchProps>(({
  label,
  value,
  checked,
  defaultChecked = false,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  loading = false,
  required = false,
  error,
  success,
  hint,
  size = 'medium',
  className,
  labelClassName,
  switchClassName,
  'data-testid': testId,
  description,
  leftIcon,
  rightIcon,
  leftLabel,
  rightLabel,
  activeColor,
  inactiveColor,
  thumbColor,
  checkedIcon,
  uncheckedIcon,
  hapticFeedback = true,
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  
  const switchId = useId();
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch, screenSize } = useDeviceCapabilities();

  // Use controlled or uncontrolled value
  const isChecked = checked !== undefined ? checked : value !== undefined ? value : internalChecked;
  
  // Determine switch state
  const switchState = error ? 'error' : success ? 'success' : isFocused ? 'focused' : 'default';

  // Handle change events
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    
    // Simulate haptic feedback
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    if (checked === undefined && value === undefined) {
      setInternalChecked(newChecked);
    }
    
    onChange?.(newChecked);
  }, [checked, value, onChange, hapticFeedback]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Size configurations
  const sizeConfig = {
    small: {
      track: 'w-8 h-4',
      thumb: 'w-3 h-3',
      thumbOffset: 'translate-x-4',
      icon: 'w-2 h-2',
      text: 'text-sm',
      touch: 'p-2',
    },
    medium: {
      track: 'w-11 h-6',
      thumb: 'w-4 h-4',
      thumbOffset: 'translate-x-5',
      icon: 'w-3 h-3',
      text: 'text-base',
      touch: 'p-2.5',
    },
    large: {
      track: 'w-14 h-8',
      thumb: 'w-6 h-6',
      thumbOffset: 'translate-x-6',
      icon: 'w-4 h-4',
      text: 'text-lg',
      touch: 'p-3',
    },
  };

  const config = sizeConfig[size];

  // Switch track styling
  const trackClasses = cn(
    'relative inline-flex items-center rounded-full transition-all duration-300 cursor-pointer',
    'border border-glass-border focus:outline-none focus:ring-0',
    config.track,
    // Glass effect
    adaptiveGlass.effects && 'glass-light backdrop-blur-sm',
    // State colors
    {
      'bg-accent-primary border-accent-primary': isChecked && !loading,
      'bg-transparent border-glass-border': !isChecked && !loading,
      'bg-text-muted/20 border-text-muted/30': loading,
      'ring-2 ring-accent-primary/30': switchState === 'focused',
      'border-status-error': switchState === 'error',
      'border-status-success': switchState === 'success',
    },
    // Disabled state
    disabled && 'opacity-50 cursor-not-allowed',
    'gpu-accelerated',
    switchClassName
  );

  // Switch thumb styling
  const thumbClasses = cn(
    'absolute top-0.5 left-0.5 rounded-full transition-all duration-300 flex items-center justify-center',
    'shadow-sm',
    config.thumb,
    thumbColor ? `bg-[${thumbColor}]` : 'bg-white',
    {
      [config.thumbOffset]: isChecked,
      'translate-x-0': !isChecked,
    },
    'gpu-accelerated'
  );

  const containerClasses = cn(
    'relative flex items-center gap-3',
    className
  );

  const labelClasses = cn(
    'select-none transition-all duration-300 cursor-pointer',
    config.text,
    {
      'text-white': !disabled,
      'text-text-muted': disabled,
      'text-status-error': switchState === 'error',
      'text-status-success': switchState === 'success',
    },
    labelClassName
  );

  return (
    <div className="space-y-2">
      <motion.div
        className={containerClasses}
        whileHover={
          !disabled && performanceTier === 'high' 
            ? { scale: 1.02 }
            : undefined
        }
        whileTap={
          !disabled && performanceTier === 'high'
            ? { scale: 0.98 }
            : undefined
        }
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Left icon/label */}
        {(leftIcon || leftLabel) && (
          <div className="flex items-center gap-2">
            {leftIcon && (
              <div className={cn(
                'text-text-muted transition-colors duration-300',
                !isChecked && 'text-accent-primary'
              )}>
                {leftIcon}
              </div>
            )}
            {leftLabel && (
              <span className={cn(
                'text-sm text-text-muted transition-colors duration-300',
                !isChecked && 'text-white font-medium'
              )}>
                {leftLabel}
              </span>
            )}
          </div>
        )}

        {/* Touch target wrapper */}
        <div className="relative">
          {/* Invisible touch target */}
          <div className={cn(
            'absolute inset-0 touch-target',
            'flex items-center justify-center',
            touch && 'touch-manipulation',
            config.touch
          )} />

          {/* Hidden input */}
          <input
            ref={ref}
            id={switchId}
            type="checkbox"
            checked={isChecked}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled || loading}
            required={required}
            className="sr-only"
            data-testid={testId}
          />

          {/* Switch track */}
          <label htmlFor={switchId} className={trackClasses}>
            {/* Track background with gradient */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <motion.div
                className="w-full h-full"
                animate={{
                  background: isChecked 
                    ? activeColor || 'linear-gradient(135deg, rgba(139,92,246,0.8) 0%, rgba(139,92,246,1) 100%)'
                    : inactiveColor || 'transparent'
                }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Switch thumb */}
            <motion.div
              className={thumbClasses}
              animate={{
                x: isChecked ? (size === 'small' ? 16 : size === 'medium' ? 20 : 24) : 0,
              }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 30 
              }}
            >
              {/* Loading spinner */}
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className={cn(config.icon, 'text-text-muted')}
                >
                  <div className="w-full h-full border-2 border-current border-t-transparent rounded-full" />
                </motion.div>
              ) : (
                /* State icons */
                <AnimatePresence mode="wait">
                  {(checkedIcon || uncheckedIcon) && (
                    <motion.div
                      key={isChecked ? 'checked' : 'unchecked'}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        config.icon,
                        isChecked ? 'text-accent-primary' : 'text-text-muted'
                      )}
                    >
                      {isChecked ? (checkedIcon || <Check />) : (uncheckedIcon || <X />)}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.div>

            {/* Focus glow effect */}
            {adaptiveGlass.effects && performanceTier === 'high' && isFocused && (
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, transparent 100%)',
                  filter: 'blur(4px)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </label>
        </div>

        {/* Right icon/label */}
        {(rightIcon || rightLabel) && (
          <div className="flex items-center gap-2">
            {rightIcon && (
              <div className={cn(
                'text-text-muted transition-colors duration-300',
                isChecked && 'text-accent-primary'
              )}>
                {rightIcon}
              </div>
            )}
            {rightLabel && (
              <span className={cn(
                'text-sm text-text-muted transition-colors duration-300',
                isChecked && 'text-white font-medium'
              )}>
                {rightLabel}
              </span>
            )}
          </div>
        )}

        {/* Main label */}
        {label && (
          <label htmlFor={switchId} className={labelClasses}>
            {label}
            {required && <span className="text-status-error ml-1">*</span>}
          </label>
        )}
      </motion.div>

      {/* Description */}
      {description && (
        <div className={cn(
          'text-text-muted',
          size === 'small' ? 'text-xs' : 'text-sm'
        )}>
          {description}
        </div>
      )}

      {/* Helper text */}
      <AnimatePresence mode="wait">
        {(error || success || hint) && (
          <motion.div
            className="flex items-start gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* State icon */}
            {(error || success) && (
              <div className="flex-shrink-0 mt-0.5">
                {error && <AlertCircle className="w-4 h-4 text-status-error" />}
                {success && <CheckCircle className="w-4 h-4 text-status-success" />}
              </div>
            )}
            
            {/* Message text */}
            <p className={cn(
              'text-sm',
              error && 'text-status-error',
              success && 'text-status-success',
              hint && 'text-text-muted'
            )}>
              {error || success || hint}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

GlassSwitch.displayName = 'GlassSwitch';

export { GlassSwitch };

// Convenience components
export const SmallSwitch = (props: Omit<GlassSwitchProps, 'size'>) => (
  <GlassSwitch size="small" {...props} />
);

export const LargeSwitch = (props: Omit<GlassSwitchProps, 'size'>) => (
  <GlassSwitch size="large" {...props} />
);

export const LoadingSwitch = (props: Omit<GlassSwitchProps, 'loading'>) => (
  <GlassSwitch loading {...props} />
);

// Specialized switches for common use cases
export const ToggleSwitch = (props: GlassSwitchProps) => (
  <GlassSwitch
    checkedIcon={<Check className="w-full h-full" />}
    uncheckedIcon={<X className="w-full h-full" />}
    {...props}
  />
);

export const PowerSwitch = (props: GlassSwitchProps) => (
  <GlassSwitch
    activeColor="linear-gradient(135deg, rgba(34,197,94,0.8) 0%, rgba(34,197,94,1) 100%)"
    leftLabel="Off"
    rightLabel="On"
    {...props}
  />
);

export const DarkModeSwitch = (props: GlassSwitchProps) => (
  <GlassSwitch
    leftIcon={<span className="text-yellow-400">☀️</span>}
    rightIcon={<span className="text-blue-400">🌙</span>}
    {...props}
  />
);