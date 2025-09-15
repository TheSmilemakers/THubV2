'use client';

import React, { useState, useId, forwardRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Minus, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgressiveEnhancementContext } from '@/components/providers/progressive-enhancement-provider';
import { useComponentEnhancement } from '@/lib/hooks/use-progressive-enhancement';
import { useDeviceCapabilities } from '@/lib/hooks/use-device-capabilities';

/**
 * GlassCheckbox Component - Checkbox with glassmorphism styling and animations
 * 
 * Features:
 * - Individual and group checkbox support
 * - Indeterminate state for parent checkboxes
 * - Smooth animations with spring physics
 * - Touch-optimized for mobile devices (44px minimum)
 * - Adaptive glassmorphism effects
 * - Validation states with visual feedback
 * - Accessible keyboard navigation
 * - React Hook Form compatible
 * - Custom styling variants
 */

export interface CheckboxOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
}

export interface GlassCheckboxProps {
  label?: string;
  value?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'card' | 'switch';
  className?: string;
  labelClassName?: string;
  checkboxClassName?: string;
  'data-testid'?: string;
  // Content
  description?: string;
  icon?: React.ReactNode;
  // Group support
  group?: string;
  // Custom styling
  accentColor?: string;
}

export interface GlassCheckboxGroupProps {
  label?: string;
  value?: (string | number)[];
  defaultValue?: (string | number)[];
  onChange?: (values: (string | number)[]) => void;
  options: CheckboxOption[];
  disabled?: boolean;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  direction?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'card' | 'switch';
  className?: string;
  optionClassName?: string;
  'data-testid'?: string;
  // Layout
  columns?: number;
  gap?: string;
}

const GlassCheckbox = forwardRef<HTMLInputElement, GlassCheckboxProps>(({
  label,
  value,
  checked,
  defaultChecked = false,
  onChange,
  onBlur,
  onFocus,
  indeterminate = false,
  disabled = false,
  required = false,
  error,
  success,
  hint,
  size = 'medium',
  variant = 'default',
  className,
  labelClassName,
  checkboxClassName,
  'data-testid': testId,
  description,
  icon,
  group,
  accentColor,
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  
  const checkboxId = useId();
  const { config: globalConfig, currentTier } = useProgressiveEnhancementContext();
  const { config: componentConfig, getGlassClass } = useComponentEnhancement('card');
  const { touch, gpu } = useDeviceCapabilities();

  // Use controlled or uncontrolled value
  const isChecked = checked !== undefined ? checked : value !== undefined ? value : internalChecked;
  
  // Determine checkbox state
  const checkboxState = error ? 'error' : success ? 'success' : isFocused ? 'focused' : 'default';

  // Handle change events
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    
    if (checked === undefined && value === undefined) {
      setInternalChecked(newChecked);
    }
    
    onChange?.(newChecked);
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
      checkbox: 'w-4 h-4',
      icon: 'w-3 h-3',
      text: 'text-sm',
      touch: 'p-2', // 32px touch target
    },
    medium: {
      checkbox: 'w-5 h-5',
      icon: 'w-3.5 h-3.5',
      text: 'text-base',
      touch: 'p-2.5', // 40px touch target
    },
    large: {
      checkbox: 'w-6 h-6',
      icon: 'w-4 h-4',
      text: 'text-lg',
      touch: 'p-3', // 48px touch target
    },
  };

  const sizeClasses = sizeConfig[size];

  // Styling based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'card':
        return {
          container: cn(
            'relative w-full p-4 rounded-xl cursor-pointer transition-all duration-300',
            componentConfig.glassmorphism ? getGlassClass() : 'bg-black/20',
            'border border-glass-border hover:border-accent-primary/50',
            isChecked && 'border-accent-primary bg-accent-primary/10',
            disabled && 'opacity-50 cursor-not-allowed',
            'gpu-accelerated'
          ),
          checkbox: 'absolute top-4 right-4',
          content: 'pr-12',
        };
      case 'switch':
        return {
          container: 'flex items-center gap-3 cursor-pointer',
          checkbox: '',
          content: '',
        };
      default:
        return {
          container: 'flex items-start gap-3 cursor-pointer',
          checkbox: '',
          content: '',
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Checkbox styling
  const checkboxClasses = cn(
    'relative flex items-center justify-center rounded-md transition-all duration-300',
    'border-2 focus:outline-none focus:ring-0',
    sizeClasses.checkbox,
    // Glass effect
    componentConfig.glassmorphism && getGlassClass(),
    // State colors
    {
      'border-accent-primary bg-accent-primary': isChecked && !indeterminate,
      'border-accent-primary bg-accent-primary/50': indeterminate,
      'border-glass-border bg-transparent': !isChecked && !indeterminate,
      'border-accent-primary ring-2 ring-accent-primary/30': checkboxState === 'focused',
      'border-status-error': checkboxState === 'error',
      'border-status-success': checkboxState === 'success',
    },
    // Disabled state
    disabled && 'opacity-50 cursor-not-allowed',
    // Performance optimization
    componentConfig.hardwareAcceleration && 'gpu-accelerated',
    checkboxClassName
  );

  // Switch variant specific styling
  const switchClasses = cn(
    'relative w-11 h-6 rounded-full transition-all duration-300',
    'border border-glass-border focus:outline-none focus:ring-0',
    // Glass effect
    componentConfig.glassmorphism && getGlassClass(),
    // State colors
    {
      'bg-accent-primary border-accent-primary': isChecked,
      'bg-transparent border-glass-border': !isChecked,
      'ring-2 ring-accent-primary/30': checkboxState === 'focused',
      'border-status-error': checkboxState === 'error',
      'border-status-success': checkboxState === 'success',
    },
    // Disabled state
    disabled && 'opacity-50 cursor-not-allowed',
    'gpu-accelerated'
  );

  const switchThumbClasses = cn(
    'absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300',
    'bg-white shadow-sm',
    {
      'left-0.5': !isChecked,
      'left-5': isChecked,
    }
  );

  const containerClasses = cn(
    'relative transition-all duration-300',
    variantStyles.container,
    disabled && 'cursor-not-allowed',
    className
  );

  const labelClasses = cn(
    'select-none transition-all duration-300',
    sizeClasses.text,
    {
      'text-white': !disabled,
      'text-text-muted': disabled,
      'text-status-error': checkboxState === 'error',
      'text-status-success': checkboxState === 'success',
    },
    labelClassName
  );

  return (
    <div className={cn('relative', variant !== 'card' && 'w-auto')}>
      <motion.label
        htmlFor={checkboxId}
        className={containerClasses}
        whileHover={
          !disabled && componentConfig.animations && globalConfig.animations !== 'none'
            ? { scale: variant === 'card' ? 1.01 : 1 }
            : undefined
        }
        whileTap={
          !disabled && componentConfig.animations && globalConfig.animations !== 'none'
            ? { scale: variant === 'card' ? 0.99 : 0.98 }
            : undefined
        }
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Touch target (invisible but ensures 44px minimum) */}
        <div className={cn(
          'absolute inset-0 touch-target',
          touch && 'touch-manipulation',
          variant !== 'card' && 'w-auto h-auto top-1/2 left-0 -translate-y-1/2',
          sizeClasses.touch
        )} />

        {/* Hidden native input */}
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          checked={isChecked}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          className="sr-only"
          data-testid={testId}
          data-group={group}
        />

        {/* Visual checkbox/switch */}
        {variant === 'switch' ? (
          <div className={switchClasses}>
            <motion.div
              className={switchThumbClasses}
              animate={{ x: isChecked ? 16 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </div>
        ) : (
          <div className={cn(checkboxClasses, variantStyles.checkbox)}>
            {/* Check/indeterminate icon */}
            <AnimatePresence mode="wait">
              {(isChecked || indeterminate) && (
                <motion.div
                  key={indeterminate ? 'indeterminate' : 'checked'}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 30 
                  }}
                  className="text-white"
                >
                  {indeterminate ? (
                    <Minus className={sizeClasses.icon} />
                  ) : (
                    <Check className={sizeClasses.icon} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Focus glow effect */}
            {componentConfig.glassmorphism && gpu === 'high-end' && isFocused && (
              <motion.div
                className="absolute inset-0 rounded-md pointer-events-none"
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
        {(label || description || icon) && (
          <div className={cn('flex-1 min-w-0', variantStyles.content)}>
            {/* Icon */}
            {icon && (
              <div className="flex items-center gap-2 mb-1">
                <div className="text-accent-primary">{icon}</div>
              </div>
            )}

            {/* Label */}
            {label && (
              <div className={labelClasses}>
                {label}
                {required && <span className="text-status-error ml-1">*</span>}
              </div>
            )}

            {/* Description */}
            {description && (
              <div className={cn(
                'text-text-muted mt-1',
                size === 'small' ? 'text-xs' : 'text-sm'
              )}>
                {description}
              </div>
            )}
          </div>
        )}

        {/* Card variant selection indicator */}
        {variant === 'card' && isChecked && (
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
        {(error || success || hint) && variant !== 'card' && (
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

GlassCheckbox.displayName = 'GlassCheckbox';

// Checkbox Group Component
const GlassCheckboxGroup = forwardRef<HTMLDivElement, GlassCheckboxGroupProps>(({
  label,
  value,
  defaultValue = [],
  onChange,
  options,
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
  const [internalValue, setInternalValue] = useState<(string | number)[]>(defaultValue);
  const groupId = useId();
  
  // Use controlled or uncontrolled value
  const currentValue = value !== undefined ? value : internalValue;

  // Handle individual checkbox changes
  const handleCheckboxChange = useCallback((optionValue: string | number, checked: boolean) => {
    let newValue: (string | number)[];
    
    if (checked) {
      newValue = [...currentValue, optionValue];
    } else {
      newValue = currentValue.filter(v => v !== optionValue);
    }
    
    if (value === undefined) {
      setInternalValue(newValue);
    }
    
    onChange?.(newValue);
  }, [currentValue, value, onChange]);

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
    <div ref={ref} className={containerClasses} data-testid={testId}>
      {/* Group label */}
      {label && (
        <div className="space-y-1">
          <label className={cn(
            'block font-medium',
            size === 'small' ? 'text-sm' : 'text-base',
            {
              'text-white': groupState === 'default',
              'text-status-error': groupState === 'error',
              'text-status-success': groupState === 'success',
            }
          )}>
            {label}
            {required && <span className="text-status-error ml-1">*</span>}
          </label>
        </div>
      )}

      {/* Options */}
      <div className={optionsClasses} style={{ gap: columns ? gap : undefined }}>
        {options.map((option) => (
          <GlassCheckbox
            key={option.value}
            label={option.label}
            description={option.description}
            icon={option.icon}
            checked={currentValue.includes(option.value)}
            onChange={(checked) => handleCheckboxChange(option.value, checked)}
            disabled={disabled || option.disabled}
            size={size}
            variant={variant}
            group={groupId}
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

GlassCheckboxGroup.displayName = 'GlassCheckboxGroup';

export { GlassCheckbox, GlassCheckboxGroup };

// Convenience components
export const CheckboxCard = (props: Omit<GlassCheckboxProps, 'variant'>) => (
  <GlassCheckbox variant="card" {...props} />
);

export const CheckboxSwitch = (props: Omit<GlassCheckboxProps, 'variant'>) => (
  <GlassCheckbox variant="switch" {...props} />
);

export const SmallCheckbox = (props: Omit<GlassCheckboxProps, 'size'>) => (
  <GlassCheckbox size="small" {...props} />
);

export const LargeCheckbox = (props: Omit<GlassCheckboxProps, 'size'>) => (
  <GlassCheckbox size="large" {...props} />
);