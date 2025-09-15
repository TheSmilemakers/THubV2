'use client';

import React, { useState, useId, forwardRef, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Maximize2, Minimize2, Copy, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';

/**
 * GlassTextarea Component - Multi-line text input with glassmorphism styling
 * 
 * Features:
 * - Auto-resize functionality with min/max height constraints
 * - Character and word count with visual feedback
 * - Floating label animation
 * - Touch-optimized for mobile devices
 * - Adaptive glassmorphism effects
 * - Validation states with smooth transitions
 * - Accessible keyboard navigation
 * - React Hook Form compatible
 * - Copy to clipboard functionality
 * - Fullscreen mode for large content
 * - Rich text formatting hints
 */

export interface GlassTextareaProps {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  rows?: number;
  minRows?: number;
  maxRows?: number;
  minHeight?: number;
  maxHeight?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  autoResize?: boolean;
  className?: string;
  textareaClassName?: string;
  'data-testid'?: string;
  // Character limits
  maxLength?: number;
  showCount?: boolean;
  countType?: 'characters' | 'words' | 'both';
  // Rich features
  copyable?: boolean;
  fullscreenMode?: boolean;
  spellCheck?: boolean;
  autoComplete?: string;
  // Validation
  onValidate?: (value: string) => string | null;
}

const GlassTextarea = forwardRef<HTMLTextAreaElement, GlassTextareaProps>(({
  label,
  placeholder,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  required = false,
  error,
  success,
  hint,
  rows = 3,
  minRows = 2,
  maxRows = 10,
  minHeight,
  maxHeight,
  resize = 'vertical',
  autoResize = true,
  className,
  textareaClassName,
  'data-testid': testId,
  maxLength,
  showCount = false,
  countType = 'characters',
  copyable = false,
  fullscreenMode = false,
  spellCheck = true,
  autoComplete,
  onValidate,
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const [textareaHeight, setTextareaHeight] = useState<number | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const textareaId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hiddenTextareaRef = useRef<HTMLTextAreaElement>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch, screenSize } = useDeviceCapabilities();

  // Use controlled or uncontrolled value
  const currentValue = value !== undefined ? value : internalValue;
  const hasValue = currentValue && currentValue.length > 0;
  const hasFloatingLabel = Boolean(label);

  // Calculate character and word counts
  const characterCount = currentValue.length;
  const wordCount = currentValue.trim() ? currentValue.trim().split(/\s+/).length : 0;

  // Determine textarea state
  const textareaState = error || validationError ? 'error' : success ? 'success' : isFocused ? 'focused' : 'default';

  // Auto-resize functionality
  const calculateHeight = useCallback(() => {
    if (!autoResize || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const hiddenTextarea = hiddenTextareaRef.current;

    if (hiddenTextarea) {
      // Copy styles to hidden textarea for accurate measurement
      hiddenTextarea.style.width = textarea.offsetWidth + 'px';
      hiddenTextarea.value = currentValue;

      const scrollHeight = hiddenTextarea.scrollHeight;
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
      const paddingTop = parseInt(getComputedStyle(textarea).paddingTop);
      const paddingBottom = parseInt(getComputedStyle(textarea).paddingBottom);

      let newHeight = scrollHeight;

      // Apply min/max constraints
      if (minRows) {
        const minHeight = (lineHeight * minRows) + paddingTop + paddingBottom;
        newHeight = Math.max(newHeight, minHeight);
      }

      if (maxRows) {
        const maxHeightFromRows = (lineHeight * maxRows) + paddingTop + paddingBottom;
        newHeight = Math.min(newHeight, maxHeightFromRows);
      }

      if (minHeight) {
        newHeight = Math.max(newHeight, minHeight);
      }

      if (maxHeight) {
        newHeight = Math.min(newHeight, maxHeight);
      }

      setTextareaHeight(newHeight);
    }
  }, [autoResize, currentValue, minRows, maxRows, minHeight, maxHeight]);

  // Handle value changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Apply maxLength constraint
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    
    if (value === undefined) {
      setInternalValue(newValue);
    }
    
    onChange?.(newValue);

    // Custom validation
    if (onValidate) {
      const validationResult = onValidate(newValue);
      setValidationError(validationResult);
    }
  }, [value, onChange, maxLength, onValidate]);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Copy to clipboard functionality
  const handleCopy = async () => {
    if (!currentValue) return;

    try {
      await navigator.clipboard.writeText(currentValue);
      setCopied(true);
      
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Effect for auto-resize
  useEffect(() => {
    calculateHeight();
  }, [calculateHeight]);

  // Effect for window resize
  useEffect(() => {
    if (!autoResize) return;

    const handleResize = () => {
      calculateHeight();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateHeight, autoResize]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Styling
  const containerClasses = cn(
    'relative w-full transition-all duration-300',
    isFullscreen && 'fixed inset-4 z-50 bg-background-dark/95 backdrop-blur-xl rounded-xl p-6',
    className
  );

  const textareaContainerClasses = cn(
    'relative transition-all duration-300',
    'rounded-xl',
    // Glass effect based on state
    textareaState === 'focused' && adaptiveGlass.effects 
      ? 'glass-medium shadow-lg shadow-accent-primary/20'
      : 'glass-light',
    // State colors
    {
      'border-2 border-accent-primary': textareaState === 'focused',
      'border-2 border-status-error': textareaState === 'error',
      'border-2 border-status-success': textareaState === 'success',
      'border border-glass-border': textareaState === 'default',
    },
    // Disabled state
    disabled && 'opacity-50 cursor-not-allowed',
    'gpu-accelerated'
  );

  const textareaClasses = cn(
    'w-full bg-transparent text-white placeholder:text-text-muted',
    'focus:outline-none transition-all duration-300',
    'px-4 py-3 text-base leading-relaxed',
    screenSize === 'mobile' && 'text-16', // Prevent zoom on iOS
    // Floating label spacing
    hasFloatingLabel && 'pt-6 pb-3',
    // Resize behavior
    {
      'resize-none': resize === 'none' || autoResize,
      'resize-y': resize === 'vertical' && !autoResize,
      'resize-x': resize === 'horizontal' && !autoResize,
      'resize': resize === 'both' && !autoResize,
    },
    // Disabled state
    disabled && 'cursor-not-allowed',
    textareaClassName
  );

  const labelClasses = cn(
    'absolute left-4 transition-all duration-300 pointer-events-none',
    'text-text-secondary',
    // Floating label animation
    hasFloatingLabel && (isFocused || hasValue) 
      ? 'top-2 text-xs font-medium'
      : 'top-3 text-base',
    // State colors
    textareaState === 'focused' && 'text-accent-primary',
    textareaState === 'error' && 'text-status-error',
    textareaState === 'success' && 'text-status-success',
  );

  const counterClasses = cn(
    'text-xs transition-all duration-300',
    {
      'text-text-muted': !maxLength || characterCount <= maxLength * 0.8,
      'text-yellow-400': maxLength && characterCount > maxLength * 0.8 && characterCount <= maxLength * 0.9,
      'text-orange-400': maxLength && characterCount > maxLength * 0.9 && characterCount < maxLength,
      'text-status-error': maxLength && characterCount >= maxLength,
    }
  );

  return (
    <div className={containerClasses}>
      {/* Static label */}
      {label && !hasFloatingLabel && (
        <label 
          htmlFor={textareaId}
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          {label}
          {required && <span className="text-status-error ml-1">*</span>}
        </label>
      )}

      {/* Textarea container */}
      <motion.div 
        className={textareaContainerClasses}
        animate={performanceTier === 'high' ? {
          scale: isFocused ? 1.01 : 1,
        } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Hidden textarea for height calculation */}
        {autoResize && (
          <textarea
            ref={hiddenTextareaRef}
            className={cn(textareaClasses, 'absolute opacity-0 pointer-events-none -z-10')}
            style={{ height: 'auto' }}
            tabIndex={-1}
            readOnly
          />
        )}

        {/* Main textarea */}
        <textarea
          ref={ref || textareaRef}
          id={textareaId}
          value={currentValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={hasFloatingLabel ? '' : placeholder}
          disabled={disabled}
          required={required}
          rows={autoResize ? undefined : rows}
          maxLength={maxLength}
          spellCheck={spellCheck}
          autoComplete={autoComplete}
          className={textareaClasses}
          style={autoResize ? { height: textareaHeight } : undefined}
          data-testid={testId}
        />

        {/* Floating label */}
        {hasFloatingLabel && (
          <label 
            htmlFor={textareaId}
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

        {/* Toolbar */}
        {(copyable || fullscreenMode || showCount) && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {/* Character/Word count */}
            {showCount && (
              <div className={counterClasses}>
                {countType === 'characters' && `${characterCount}${maxLength ? `/${maxLength}` : ''}`}
                {countType === 'words' && `${wordCount} words`}
                {countType === 'both' && `${characterCount}${maxLength ? `/${maxLength}` : ''} • ${wordCount} words`}
              </div>
            )}

            {/* Copy button */}
            {copyable && hasValue && (
              <motion.button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded hover:bg-white/10 transition-colors touch-target-min"
                whileTap={{ scale: 0.95 }}
                aria-label="Copy to clipboard"
              >
                <motion.div
                  animate={{ 
                    scale: copied ? [1, 1.2, 1] : 1,
                    color: copied ? 'rgb(34, 197, 94)' : 'rgb(var(--text-muted))'
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Copy className="w-4 h-4" />
                </motion.div>
              </motion.button>
            )}

            {/* Fullscreen toggle */}
            {fullscreenMode && (
              <motion.button
                type="button"
                onClick={toggleFullscreen}
                className="p-1 rounded hover:bg-white/10 transition-colors touch-target-min"
                whileTap={{ scale: 0.95 }}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 text-text-muted" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-text-muted" />
                )}
              </motion.button>
            )}
          </div>
        )}

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
        {(error || validationError || success || hint) && (
          <motion.div
            className="mt-2 flex items-start gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* State icon */}
            {((error || validationError) || success) && (
              <div className="flex-shrink-0 mt-0.5">
                {(error || validationError) && <AlertCircle className="w-4 h-4 text-status-error" />}
                {success && <CheckCircle className="w-4 h-4 text-status-success" />}
              </div>
            )}
            
            {/* Message text */}
            <p className={cn(
              'text-sm',
              (error || validationError) && 'text-status-error',
              success && 'text-status-success',
              hint && 'text-text-muted'
            )}>
              {error || validationError || success || hint}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen overlay backdrop */}
      {isFullscreen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={toggleFullscreen}
        />
      )}

      {/* Copy feedback */}
      <AnimatePresence>
        {copied && (
          <motion.div
            className="fixed top-4 right-4 z-50 px-3 py-2 bg-status-success text-white text-sm rounded-lg shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            Copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

GlassTextarea.displayName = 'GlassTextarea';

export { GlassTextarea };

// Convenience components
export const CodeTextarea = (props: Omit<GlassTextareaProps, 'spellCheck' | 'textareaClassName'>) => (
  <GlassTextarea 
    spellCheck={false}
    textareaClassName="font-mono"
    placeholder="Enter your code..."
    {...props} 
  />
);

export const MessageTextarea = (props: Omit<GlassTextareaProps, 'showCount' | 'maxLength'>) => (
  <GlassTextarea 
    showCount
    maxLength={500}
    placeholder="Write your message..."
    copyable
    {...props} 
  />
);

export const NotesTextarea = (props: Omit<GlassTextareaProps, 'autoResize' | 'fullscreenMode'>) => (
  <GlassTextarea 
    autoResize
    fullscreenMode
    placeholder="Take your notes..."
    showCount
    countType="both"
    {...props} 
  />
);