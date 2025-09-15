'use client';

import React, { useState, useId, forwardRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';

/**
 * GlassRadio Component - Radio button with glassmorphism styling
 * 
 * Features:
 * - Individual and group radio button support
 * - Smooth animations with spring physics
 * - Touch-optimized for mobile devices (44px minimum)
 * - Adaptive glassmorphism effects
 * - Validation states with visual feedback
 * - Accessible keyboard navigation
 * - React Hook Form compatible
 * - Multiple styling variants (default, card, button)
 * - Custom accent colors
 */

export interface RadioOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
}

export interface GlassRadioProps {
  label?: string;
  value?: string | number;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (value: string | number) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'card' | 'button';
  className?: string;
  labelClassName?: string;
  radioClassName?: string;
  'data-testid'?: string;
  // Content
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  // Group support
  name?: string;
  // Custom styling
  accentColor?: string;
}

export interface GlassRadioGroupProps {
  label?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
  options: RadioOption[];
  name?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  direction?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'card' | 'button';
  className?: string;
  optionClassName?: string;
  'data-testid'?: string;
  // Layout
  columns?: number;
  gap?: string;
}

const GlassRadio = forwardRef<HTMLInputElement, GlassRadioProps>(({
  label,
  value,
  checked,
  defaultChecked = false,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  required = false,
  error,
  success,
  hint,
  size = 'medium',
  variant = 'default',
  className,
  labelClassName,
  radioClassName,
  'data-testid': testId,
  description,
  icon,
  badge,
  name,
  accentColor,
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  
  const radioId = useId();
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch, screenSize } = useDeviceCapabilities();

  // Use controlled or uncontrolled value
  const isChecked = checked !== undefined ? checked : internalChecked;
  
  // Determine radio state
  const radioState = error ? 'error' : success ? 'success' : isFocused ? 'focused' : 'default';

  // Handle change events
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const isNowChecked = e.target.checked;
    
    if (checked === undefined) {
      setInternalChecked(isNowChecked);
    }
    
    if (isNowChecked && value !== undefined) {
      onChange?.(value);
    }
  }, [checked, value, onChange]);

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
      radio: 'w-4 h-4',
      dot: 'w-2 h-2',
      text: 'text-sm',
      touch: 'p-2', // 32px touch target
    },
    medium: {
      radio: 'w-5 h-5',
      dot: 'w-2.5 h-2.5',
      text: 'text-base',
      touch: 'p-2.5', // 40px touch target
    },
    large: {
      radio: 'w-6 h-6',
      dot: 'w-3 h-3',
      text: 'text-lg',
      touch: 'p-3', // 48px touch target
    },
  };

  const config = sizeConfig[size];

  // Styling based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'card':
        return {
          container: cn(
            'relative w-full p-4 rounded-xl cursor-pointer transition-all duration-300',
            adaptiveGlass.effects ? 'glass-light' : 'bg-black/20',
            'border border-glass-border hover:border-accent-primary/50',
            isChecked && 'border-accent-primary bg-accent-primary/10',
            disabled && 'opacity-50 cursor-not-allowed',
            'gpu-accelerated'
          ),
          radio: 'absolute top-4 right-4',
          content: 'pr-12',
        };
      case 'button':
        return {
          container: cn(
            'relative w-full px-4 py-3 rounded-xl cursor-pointer transition-all duration-300',
            adaptiveGlass.effects ? 'glass-light' : 'bg-black/20',
            'border border-glass-border hover:border-accent-primary/50',
            isChecked && 'border-accent-primary bg-accent-primary text-white shadow-lg',
            !isChecked && 'text-text-secondary',
            disabled && 'opacity-50 cursor-not-allowed',
            'gpu-accelerated'
          ),
          radio: 'hidden',
          content: 'text-center',
        };
      default:
        return {
          container: 'flex items-start gap-3 cursor-pointer',
          radio: '',
          content: '',
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Radio styling
  const radioClasses = cn(
    'relative flex items-center justify-center rounded-full transition-all duration-300',
    'border-2 focus:outline-none focus:ring-0',
    config.radio,
    // Glass effect
    adaptiveGlass.effects && 'glass-light backdrop-blur-sm',
    // State colors
    {
      'border-accent-primary': isChecked,
      'border-glass-border': !isChecked,
      'border-accent-primary ring-2 ring-accent-primary/30': radioState === 'focused',
      'border-status-error': radioState === 'error',
      'border-status-success': radioState === 'success',
    },
    // Disabled state
    disabled && 'opacity-50 cursor-not-allowed',
    // Performance optimization
    'gpu-accelerated',
    radioClassName
  );

  const containerClasses = cn(
    'relative transition-all duration-300',
    variantStyles.container,
    disabled && 'cursor-not-allowed',
    className
  );

  const labelClasses = cn(
    'select-none transition-all duration-300',
    config.text,
    {
      'text-white': !disabled && variant !== 'button',
      'text-text-muted': disabled && variant !== 'button',
      'text-status-error': radioState === 'error',
      'text-status-success': radioState === 'success',
      'font-medium': variant === 'button',
    },
    labelClassName
  );

  return (
    <div className={cn('relative', variant !== 'card' && variant !== 'button' && 'w-auto')}>
      <motion.label
        htmlFor={radioId}
        className={containerClasses}
        whileHover={
          !disabled && performanceTier === 'high' 
            ? { scale: variant === 'card' || variant === 'button' ? 1.01 : 1 }
            : undefined
        }
        whileTap={
          !disabled && performanceTier === 'high'
            ? { scale: variant === 'card' || variant === 'button' ? 0.99 : 0.98 }
            : undefined
        }
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Touch target (invisible but ensures 44px minimum) */}
        <div className={cn(
          'absolute inset-0 touch-target',
          touch && 'touch-manipulation',
          variant === 'default' && 'w-auto h-auto top-1/2 left-0 -translate-y-1/2',
          config.touch
        )} />

        {/* Hidden native input */}
        <input
          ref={ref}
          id={radioId}
          type="radio"
          name={name}
          value={value}
          checked={isChecked}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          className="sr-only"
          data-testid={testId}
        />

        {/* Visual radio button */}
        {variant !== 'button' && (
          <div className={cn(radioClasses, variantStyles.radio)}>
            {/* Radio dot */}
            <AnimatePresence>
              {isChecked && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 30 
                  }}
                  className={cn(
                    'rounded-full transition-all duration-300',
                    config.dot,
                    accentColor ? `bg-[${accentColor}]` : 'bg-accent-primary'
                  )}
                />
              )}
            </AnimatePresence>

            {/* Focus glow effect */}
            {adaptiveGlass.effects && performanceTier === 'high' && isFocused && (
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, ${accentColor || 'rgba(139,92,246,0.3)'} 0%, transparent 100%)`,
                  filter: 'blur(4px)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </div>
        )}

        {/* Content */}
        {(label || description || icon || badge) && (
          <div className={cn('flex-1 min-w-0', variantStyles.content)}>
            <div className="flex items-center gap-2">
              {/* Icon */}
              {icon && (
                <div className={cn(
                  'flex-shrink-0',
                  isChecked && variant === 'button' ? 'text-white' : 'text-accent-primary'
                )}>
                  {icon}
                </div>
              )}

              {/* Label */}
              {label && (
                <div className={labelClasses}>
                  {label}
                  {required && <span className="text-status-error ml-1">*</span>}
                </div>
              )}

              {/* Badge */}
              {badge && (
                <motion.span
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded-full',
                    isChecked && variant === 'button' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-accent-primary/20 text-accent-primary'
                  )}
                  animate={
                    isChecked && performanceTier === 'high'
                      ? { scale: [1, 1.05, 1] }
                      : undefined
                  }
                  transition={{ duration: 0.2 }}
                >
                  {badge}
                </motion.span>
              )}
            </div>

            {/* Description */}
            {description && (
              <div className={cn(
                'mt-1',
                size === 'small' ? 'text-xs' : 'text-sm',
                variant === 'button' && isChecked ? 'text-white/80' : 'text-text-muted'
              )}>
                {description}
              </div>
            )}
          </div>
        )}

        {/* Card/Button variant selection indicator */}
        {(variant === 'card' || variant === 'button') && isChecked && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-accent-primary pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </motion.label>

      {/* Helper text */}
      <AnimatePresence mode="wait">
        {(error || success || hint) && variant === 'default' && (
          <motion.div
            className="mt-2 flex items-start gap-2"
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

GlassRadio.displayName = 'GlassRadio';

// Radio Group Component
const GlassRadioGroup = forwardRef<HTMLDivElement, GlassRadioGroupProps>(({
  label,
  value,
  defaultValue,
  onChange,
  options,
  name: providedName,
  disabled = false,
  required = false,
  error,
  success,
  hint,
  direction = 'vertical',
  size = 'medium',
  variant = 'default',
  className,
  optionClassName,
  'data-testid': testId,
  columns,
  gap = '0.75rem',
}, ref) => {
  const [internalValue, setInternalValue] = useState<string | number | undefined>(defaultValue);
  const groupId = useId();
  const groupName = providedName || `radio-group-${groupId}`;
  
  // Use controlled or uncontrolled value
  const currentValue = value !== undefined ? value : internalValue;

  // Handle radio changes
  const handleRadioChange = useCallback((optionValue: string | number) => {
    if (value === undefined) {
      setInternalValue(optionValue);
    }
    
    onChange?.(optionValue);
  }, [value, onChange]);

  // Determine group state
  const groupState = error ? 'error' : success ? 'success' : 'default';

  // Layout classes
  const containerClasses = cn(
    'space-y-4',
    className
  );

  const optionsClasses = cn(
    'space-y-3',
    direction === 'horizontal' && 'flex flex-wrap gap-4 space-y-0',
    columns && direction === 'vertical' && 'grid gap-3',
    columns && {
      'grid-cols-2': columns === 2,
      'grid-cols-3': columns === 3,
      'grid-cols-4': columns === 4,
    }
  );

  return (
    <div ref={ref} className={containerClasses} data-testid={testId} role="radiogroup" aria-labelledby={label ? `${groupId}-label` : undefined}>
      {/* Group label */}
      {label && (
        <div className="space-y-1">
          <label 
            id={`${groupId}-label`}
            className={cn(
              'block font-medium',
              size === 'small' ? 'text-sm' : 'text-base',
              {
                'text-white': groupState === 'default',
                'text-status-error': groupState === 'error',
                'text-status-success': groupState === 'success',
              }
            )}
          >
            {label}
            {required && <span className="text-status-error ml-1">*</span>}
          </label>
        </div>
      )}

      {/* Options */}
      <div className={optionsClasses} style={{ gap: columns ? gap : undefined }}>
        {options.map((option) => (
          <GlassRadio
            key={option.value}
            name={groupName}
            value={option.value}
            label={option.label}
            description={option.description}
            icon={option.icon}
            badge={option.badge}
            checked={currentValue === option.value}
            onChange={handleRadioChange}
            disabled={disabled || option.disabled}
            size={size}
            variant={variant}
            className={optionClassName}
          />
        ))}
      </div>

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

GlassRadioGroup.displayName = 'GlassRadioGroup';

export { GlassRadio, GlassRadioGroup };

// Convenience components
export const RadioCard = (props: Omit<GlassRadioProps, 'variant'>) => (
  <GlassRadio variant="card" {...props} />
);

export const RadioButton = (props: Omit<GlassRadioProps, 'variant'>) => (
  <GlassRadio variant="button" {...props} />
);

export const SmallRadio = (props: Omit<GlassRadioProps, 'size'>) => (
  <GlassRadio size="small" {...props} />
);

export const LargeRadio = (props: Omit<GlassRadioProps, 'size'>) => (
  <GlassRadio size="large" {...props} />
);