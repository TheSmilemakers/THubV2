'use client';

import React, { useState, useId, forwardRef, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks/use-device-capabilities';

/**
 * GlassInput Component - Form input with glassmorphism styling and validation
 * 
 * Features:
 * - Adaptive glassmorphism effects based on device performance
 * - Touch-optimized for mobile devices (44px minimum height)
 * - Floating label animation
 * - Built-in validation states with smooth transitions
 * - Password visibility toggle
 * - Search input with clear functionality
 * - Accessible keyboard navigation
 * - Real-time validation feedback
 */

export interface GlassInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';
  error?: string;
  success?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  clearable?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  className?: string;
  inputClassName?: string;
  'data-testid'?: string;
}

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(({
  label,
  placeholder,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  type = 'text',
  error,
  success,
  hint,
  disabled = false,
  required = false,
  icon,
  iconPosition = 'left',
  clearable = false,
  autoComplete,
  autoFocus = false,
  maxLength,
  minLength,
  pattern,
  className,
  inputClassName,
  'data-testid': testId,
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch, screenSize } = useDeviceCapabilities();

  // Use controlled or uncontrolled value
  const currentValue = value !== undefined ? value : internalValue;
  const hasValue = currentValue && currentValue.length > 0;
  const hasFloatingLabel = Boolean(label);

  // Determine input state
  const inputState = error ? 'error' : success ? 'success' : isFocused ? 'focused' : 'default';

  // Handle value changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (value === undefined) {
      setInternalValue(newValue);
    }
    
    onChange?.(newValue);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleClear = () => {
    const newValue = '';
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
    inputRef.current?.focus();
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Auto-focus handling
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // State-based styling
  const containerClasses = cn(
    'relative w-full transition-all duration-300',
    className
  );

  const inputContainerClasses = cn(
    'relative flex items-center',
    'rounded-xl transition-all duration-300',
    // Glass effect based on state
    inputState === 'focused' && adaptiveGlass.effects 
      ? 'glass-medium shadow-lg shadow-accent-primary/20'
      : 'glass-light',
    // State colors
    {
      'border-2 border-accent-primary': inputState === 'focused',
      'border-2 border-status-error': inputState === 'error',
      'border-2 border-status-success': inputState === 'success',
      'border border-glass-border': inputState === 'default',
    },
    // Disabled state
    disabled && 'opacity-50 cursor-not-allowed',
    // Performance optimizations
    'gpu-accelerated'
  );

  const inputClasses = cn(
    'w-full bg-transparent text-white placeholder:text-text-muted',
    'focus:outline-none transition-all duration-300',
    // Sizing with mobile-first approach
    'px-4 py-3 touch-target text-base',
    screenSize === 'mobile' && 'text-16', // Prevent zoom on iOS
    // Icon spacing
    icon && iconPosition === 'left' && 'pl-11',
    icon && iconPosition === 'right' && 'pr-11',
    // Additional right padding for password toggle or clear button
    (type === 'password' || (clearable && hasValue)) && 'pr-11',
    (type === 'password' && clearable && hasValue) && 'pr-16',
    // Floating label spacing
    hasFloatingLabel && 'pt-6 pb-2',
    // Disabled state
    disabled && 'cursor-not-allowed',
    inputClassName
  );

  const labelClasses = cn(
    'absolute left-4 transition-all duration-300 pointer-events-none',
    'text-text-secondary',
    // Floating label animation
    hasFloatingLabel && (isFocused || hasValue) 
      ? 'top-2 text-xs font-medium'
      : 'top-1/2 -translate-y-1/2 text-base',
    // Icon spacing for floating labels
    icon && iconPosition === 'left' && 'left-11',
    // State colors
    inputState === 'focused' && 'text-accent-primary',
    inputState === 'error' && 'text-status-error',
    inputState === 'success' && 'text-status-success',
  );

  return (
    <div className={containerClasses}>
      {/* Static label */}
      {label && !hasFloatingLabel && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          {label}
          {required && <span className="text-status-error ml-1">*</span>}
        </label>
      )}

      {/* Input container */}
      <motion.div 
        className={inputContainerClasses}
        animate={performanceTier === 'high' ? {
          scale: isFocused ? 1.01 : 1,
        } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Left icon */}
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <motion.div
              animate={performanceTier === 'high' ? {
                scale: isFocused ? 1.1 : 1,
                color: isFocused ? 'rgb(var(--accent-primary))' : 'rgb(var(--text-muted))'
              } : undefined}
              transition={{ duration: 0.2 }}
            >
              {icon}
            </motion.div>
          </div>
        )}

        {/* Main input */}
        <input
          ref={ref || inputRef}
          id={inputId}
          type={type === 'password' && isPasswordVisible ? 'text' : type}
          value={currentValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={hasFloatingLabel ? '' : placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          className={inputClasses}
          data-testid={testId}
          // Mobile optimizations
          inputMode={type === 'number' ? 'numeric' : undefined}
          autoCapitalize={type === 'email' ? 'none' : undefined}
          autoCorrect={type === 'email' || type === 'password' ? 'off' : undefined}
          spellCheck={type === 'email' || type === 'password' ? false : undefined}
        />

        {/* Floating label */}
        {hasFloatingLabel && (
          <label 
            htmlFor={inputId}
            className={labelClasses}
          >
            {label}
            {required && (
              <motion.span
                className="text-status-error ml-1"
                animate={{ opacity: isFocused || hasValue ? 1 : 0.7 }}
                transition={{ duration: 0.2 }}
              >
                *
              </motion.span>
            )}
          </label>
        )}

        {/* Right side controls */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Clear button */}
          {clearable && hasValue && !disabled && (
            <motion.button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-white/10 transition-colors touch-target-min"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              aria-label="Clear input"
            >
              <X className="w-4 h-4 text-text-muted" />
            </motion.button>
          )}

          {/* Password visibility toggle */}
          {type === 'password' && (
            <motion.button
              type="button"
              onClick={togglePasswordVisibility}
              className="p-1 rounded-full hover:bg-white/10 transition-colors touch-target-min"
              whileTap={{ scale: 0.95 }}
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            >
              {isPasswordVisible ? (
                <EyeOff className="w-4 h-4 text-text-muted" />
              ) : (
                <Eye className="w-4 h-4 text-text-muted" />
              )}
            </motion.button>
          )}

          {/* Right icon */}
          {icon && iconPosition === 'right' && (
            <div className="text-text-muted">
              <motion.div
                animate={performanceTier === 'high' ? {
                  scale: isFocused ? 1.1 : 1,
                  color: isFocused ? 'rgb(var(--accent-primary))' : 'rgb(var(--text-muted))'
                } : undefined}
                transition={{ duration: 0.2 }}
              >
                {icon}
              </motion.div>
            </div>
          )}
        </div>

        {/* Focus glow effect */}
        {adaptiveGlass.effects && performanceTier === 'high' && isFocused && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, transparent 100%)',
              filter: 'blur(10px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>

      {/* Helper text */}
      <AnimatePresence mode="wait">
        {(error || success || hint) && (
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

GlassInput.displayName = 'GlassInput';

export { GlassInput };

// Convenience components for common input types
export const SearchInput = (props: Omit<GlassInputProps, 'type' | 'icon'>) => (
  <GlassInput 
    type="search" 
    icon={<Search className="w-5 h-5" />} 
    clearable
    {...props} 
  />
);

export const EmailInput = (props: Omit<GlassInputProps, 'type'>) => (
  <GlassInput 
    type="email" 
    autoComplete="email"
    {...props} 
  />
);

export const PasswordInput = (props: Omit<GlassInputProps, 'type'>) => (
  <GlassInput 
    type="password" 
    autoComplete="current-password"
    {...props} 
  />
);

export const NumberInput = (props: Omit<GlassInputProps, 'type'>) => (
  <GlassInput 
    type="number"
    {...props} 
  />
);