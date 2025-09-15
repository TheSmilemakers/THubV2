'use client';

import React, { useState, useId, forwardRef, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronUp, ChevronDown, AlertCircle, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';

/**
 * GlassTimePicker Component - Time selection with glassmorphism styling
 * 
 * Features:
 * - Wheel interface for time selection
 * - 12/24 hour format support
 * - Step controls for hours/minutes/seconds
 * - Touch-optimized wheel scrolling
 * - Adaptive glassmorphism effects
 * - Validation states with visual feedback
 * - Accessible keyboard navigation
 * - React Hook Form compatible
 * - Preset time shortcuts
 * - Time range constraints
 */

export interface TimeValue {
  hours: number;
  minutes: number;
  seconds?: number;
}

export interface GlassTimePickerProps {
  label?: string;
  placeholder?: string;
  value?: TimeValue | null;
  defaultValue?: TimeValue | null;
  onChange?: (time: TimeValue | null) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  className?: string;
  inputClassName?: string;
  'data-testid'?: string;
  // Time format
  format?: '12' | '24';
  showSeconds?: boolean;
  step?: number; // Minutes step (1, 5, 15, 30)
  // Constraints
  minTime?: TimeValue;
  maxTime?: TimeValue;
  disabledTimes?: TimeValue[];
  // Features
  clearable?: boolean;
  showNow?: boolean;
  // Presets
  presets?: { label: string; time: TimeValue }[];
  // Wheel configuration
  wheelHeight?: number;
  visibleItems?: number;
}

const GlassTimePicker = forwardRef<HTMLInputElement, GlassTimePickerProps>(({
  label,
  placeholder = 'Select time...',
  value,
  defaultValue = null,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  required = false,
  error,
  success,
  hint,
  className,
  inputClassName,
  'data-testid': testId,
  format = '12',
  showSeconds = false,
  step = 1,
  minTime,
  maxTime,
  disabledTimes = [],
  clearable = true,
  showNow = true,
  presets = [],
  wheelHeight = 200,
  visibleItems = 5,
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState<TimeValue | null>(defaultValue);
  const [tempTime, setTempTime] = useState<TimeValue>({ hours: 12, minutes: 0, seconds: 0 });
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  
  const timePickerId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch, screenSize } = useDeviceCapabilities();

  // Use controlled or uncontrolled value
  const currentValue = value !== undefined ? value : internalValue;
  
  // Determine timepicker state
  const timePickerState = error ? 'error' : success ? 'success' : isFocused ? 'focused' : 'default';

  // Time formatting utilities
  const formatTime = useCallback((time: TimeValue | null): string => {
    if (!time) return '';
    
    let hours = time.hours;
    let suffix = '';
    
    if (format === '12') {
      suffix = hours >= 12 ? ' PM' : ' AM';
      hours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    }
    
    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = time.minutes.toString().padStart(2, '0');
    
    let timeStr = `${hoursStr}:${minutesStr}`;
    
    if (showSeconds && time.seconds !== undefined) {
      timeStr += `:${time.seconds.toString().padStart(2, '0')}`;
    }
    
    return timeStr + suffix;
  }, [format, showSeconds]);

  // Parse time from string
  const parseTime = useCallback((timeStr: string): TimeValue | null => {
    const timeRegex = format === '12' 
      ? /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i
      : /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
    
    const match = timeStr.match(timeRegex);
    if (!match) return null;
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const seconds = match[3] ? parseInt(match[3]) : 0;
    const ampmMatch = match[4];
    
    if (format === '12' && ampmMatch) {
      if (ampmMatch.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      } else if (ampmMatch.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
    }
    
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
      return null;
    }
    
    return { hours, minutes, ...(showSeconds && { seconds }) };
  }, [format, showSeconds]);

  // Check if time is disabled
  const isTimeDisabled = useCallback((time: TimeValue): boolean => {
    // Check min/max constraints
    const timeMinutes = time.hours * 60 + time.minutes;
    
    if (minTime) {
      const minMinutes = minTime.hours * 60 + minTime.minutes;
      if (timeMinutes < minMinutes) return true;
    }
    
    if (maxTime) {
      const maxMinutes = maxTime.hours * 60 + maxTime.minutes;
      if (timeMinutes > maxMinutes) return true;
    }
    
    // Check disabled times
    return disabledTimes.some(disabledTime => 
      disabledTime.hours === time.hours && 
      disabledTime.minutes === time.minutes &&
      (!showSeconds || disabledTime.seconds === time.seconds)
    );
  }, [minTime, maxTime, disabledTimes, showSeconds]);

  // Generate time options
  const generateHours = () => {
    const hours = [];
    const maxHour = format === '12' ? 12 : 23;
    const minHour = format === '12' ? 1 : 0;
    
    for (let i = minHour; i <= maxHour; i++) {
      hours.push(i);
    }
    return hours;
  };

  const generateMinutes = () => {
    const minutes = [];
    for (let i = 0; i < 60; i += step) {
      minutes.push(i);
    }
    return minutes;
  };

  const generateSeconds = () => {
    const seconds = [];
    for (let i = 0; i < 60; i++) {
      seconds.push(i);
    }
    return seconds;
  };

  // Handle time selection
  const handleTimeSelect = useCallback((newTime: TimeValue) => {
    if (isTimeDisabled(newTime)) return;
    
    if (value === undefined) {
      setInternalValue(newTime);
    }
    onChange?.(newTime);
    setIsOpen(false);
  }, [isTimeDisabled, value, onChange]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const parsedTime = parseTime(inputValue);
    
    if (parsedTime && !isTimeDisabled(parsedTime)) {
      if (value === undefined) {
        setInternalValue(parsedTime);
      }
      onChange?.(parsedTime);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Don't blur if clicking within the timepicker
    if (containerRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    
    setIsFocused(false);
    setIsOpen(false);
    onBlur?.(e);
  };

  const handleClear = () => {
    if (value === undefined) {
      setInternalValue(null);
    }
    onChange?.(null);
  };

  const handleNow = () => {
    const now = new Date();
    const currentTime: TimeValue = {
      hours: now.getHours(),
      minutes: now.getMinutes(),
      ...(showSeconds && { seconds: now.getSeconds() })
    };
    handleTimeSelect(currentTime);
  };

  // Initialize temp time when opening
  useEffect(() => {
    if (isOpen) {
      if (currentValue) {
        setTempTime(currentValue);
        if (format === '12') {
          setAmpm(currentValue.hours >= 12 ? 'PM' : 'AM');
        }
      } else {
        const now = new Date();
        setTempTime({
          hours: format === '12' ? (now.getHours() % 12 || 12) : now.getHours(),
          minutes: Math.floor(now.getMinutes() / step) * step,
          ...(showSeconds && { seconds: 0 })
        });
        setAmpm(now.getHours() >= 12 ? 'PM' : 'AM');
      }
    }
  }, [isOpen, currentValue, format, showSeconds, step]);

  // Close timepicker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.focus();
        break;
    }
  };

  // Wheel component
  const TimeWheel = ({ 
    values, 
    selectedValue, 
    onChange: onWheelChange, 
    unit 
  }: { 
    values: number[], 
    selectedValue: number, 
    onChange: (value: number) => void,
    unit: string
  }) => {
    const itemHeight = wheelHeight / visibleItems;
    
    return (
      <div className="flex flex-col items-center">
        <div className="text-xs font-medium text-text-muted mb-2">{unit}</div>
        <div 
          className="relative overflow-hidden"
          style={{ height: wheelHeight }}
        >
          {/* Selection indicator */}
          <div 
            className="absolute inset-x-0 border-t border-b border-accent-primary/30 bg-accent-primary/10"
            style={{ 
              top: Math.floor(visibleItems / 2) * itemHeight,
              height: itemHeight 
            }}
          />
          
          {/* Wheel items */}
          <div className="space-y-0">
            {values.map((val) => (
              <motion.button
                key={val}
                type="button"
                onClick={() => onWheelChange(val)}
                className={cn(
                  'w-full flex items-center justify-center transition-all duration-200',
                  'hover:bg-white/5 text-sm font-medium',
                  selectedValue === val ? 'text-white' : 'text-text-muted'
                )}
                style={{ height: itemHeight }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {unit === 'Hour' && format === '12' ? val : val.toString().padStart(2, '0')}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const displayValue = formatTime(currentValue);
  const hours = generateHours();
  const minutes = generateMinutes();
  const seconds = showSeconds ? generateSeconds() : [];

  // Styling
  const containerClasses = cn(
    'relative w-full transition-all duration-300',
    className
  );

  const inputContainerClasses = cn(
    'relative flex items-center cursor-pointer',
    'rounded-xl transition-all duration-300',
    // Glass effect based on state
    timePickerState === 'focused' && adaptiveGlass.effects 
      ? 'glass-medium shadow-lg shadow-accent-primary/20'
      : 'glass-light',
    // State colors
    {
      'border-2 border-accent-primary': timePickerState === 'focused',
      'border-2 border-status-error': timePickerState === 'error',
      'border-2 border-status-success': timePickerState === 'success',
      'border border-glass-border': timePickerState === 'default',
    },
    // Disabled state
    disabled && 'opacity-50 cursor-not-allowed',
    'gpu-accelerated'
  );

  const inputClasses = cn(
    'w-full bg-transparent text-white placeholder:text-text-muted',
    'focus:outline-none transition-all duration-300',
    'px-4 py-3 pr-12 text-base touch-target',
    screenSize === 'mobile' && 'text-16',
    disabled && 'cursor-not-allowed',
    inputClassName
  );

  const pickerClasses = cn(
    'absolute z-50 mt-2 p-4 rounded-xl overflow-hidden',
    'glass-dark border border-glass-border shadow-2xl',
    adaptiveGlass.effects && 'backdrop-blur-xl',
    'w-80 max-w-[calc(100vw-2rem)]',
    'gpu-accelerated'
  );

  return (
    <div className={containerClasses} ref={containerRef}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={timePickerId}
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          {label}
          {required && <span className="text-status-error ml-1">*</span>}
        </label>
      )}

      {/* Input container */}
      <motion.div 
        className={inputContainerClasses}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        animate={performanceTier === 'high' ? {
          scale: isFocused ? 1.01 : 1,
        } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Hidden input for form compatibility */}
        <input
          ref={ref || inputRef}
          id={timePickerId}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClasses}
          data-testid={testId}
          readOnly={touch} // Prevent virtual keyboard on mobile
        />

        {/* Right side controls */}
        <div className="absolute right-3 flex items-center gap-1">
          {/* Clear button */}
          {clearable && currentValue && !disabled && (
            <motion.button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 rounded-full hover:bg-white/10 transition-colors touch-target-min"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              aria-label="Clear time"
            >
              <X className="w-4 h-4 text-text-muted" />
            </motion.button>
          )}

          {/* Clock icon */}
          <div className="text-text-muted">
            <Clock className="w-5 h-5" />
          </div>
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

      {/* Time picker overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={pickerClasses}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Time wheels */}
            <div className="flex justify-center items-start gap-4 mb-4">
              {/* Hours wheel */}
              <TimeWheel
                values={hours}
                selectedValue={format === '12' ? (tempTime.hours % 12 || 12) : tempTime.hours}
                onChange={(hour) => {
                  const newHour = format === '12' 
                    ? (hour === 12 ? (ampm === 'AM' ? 0 : 12) : (ampm === 'PM' ? hour + 12 : hour))
                    : hour;
                  setTempTime(prev => ({ ...prev, hours: newHour }));
                }}
                unit="Hour"
              />

              {/* Minutes wheel */}
              <TimeWheel
                values={minutes}
                selectedValue={tempTime.minutes}
                onChange={(minute) => setTempTime(prev => ({ ...prev, minutes: minute }))}
                unit="Min"
              />

              {/* Seconds wheel */}
              {showSeconds && (
                <TimeWheel
                  values={seconds}
                  selectedValue={tempTime.seconds || 0}
                  onChange={(second) => setTempTime(prev => ({ ...prev, seconds: second }))}
                  unit="Sec"
                />
              )}

              {/* AM/PM selector for 12-hour format */}
              {format === '12' && (
                <div className="flex flex-col items-center">
                  <div className="text-xs font-medium text-text-muted mb-2">Period</div>
                  <div className="space-y-1">
                    {['AM', 'PM'].map((period) => (
                      <motion.button
                        key={period}
                        type="button"
                        onClick={() => {
                          setAmpm(period as 'AM' | 'PM');
                          const newHour = period === 'AM' 
                            ? (tempTime.hours > 12 ? tempTime.hours - 12 : tempTime.hours === 12 ? 0 : tempTime.hours)
                            : (tempTime.hours < 12 ? tempTime.hours + 12 : tempTime.hours);
                          setTempTime(prev => ({ ...prev, hours: newHour }));
                        }}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                          ampm === period 
                            ? 'bg-accent-primary text-white' 
                            : 'text-text-muted hover:text-white hover:bg-white/10'
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {period}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {/* Now button */}
                {showNow && (
                  <motion.button
                    type="button"
                    onClick={handleNow}
                    className="px-3 py-2 text-sm text-accent-primary hover:bg-accent-primary/20 rounded-lg transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Now
                  </motion.button>
                )}
              </div>

              <div className="flex gap-2">
                <motion.button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm text-text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => handleTimeSelect(tempTime)}
                  className="px-4 py-2 text-sm bg-accent-primary text-white hover:bg-accent-primary/80 rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Select
                </motion.button>
              </div>
            </div>

            {/* Presets */}
            {presets.length > 0 && (
              <div className="mt-4 pt-4 border-t border-glass-border">
                <div className="space-y-1">
                  {presets.map((preset, index) => (
                    <motion.button
                      key={index}
                      type="button"
                      onClick={() => handleTimeSelect(preset.time)}
                      className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      whileHover={{ x: 4 }}
                    >
                      {preset.label} - {formatTime(preset.time)}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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

GlassTimePicker.displayName = 'GlassTimePicker';

export { GlassTimePicker };

// Convenience components
export const Time12Picker = (props: Omit<GlassTimePickerProps, 'format'>) => (
  <GlassTimePicker format="12" {...props} />
);

export const Time24Picker = (props: Omit<GlassTimePickerProps, 'format'>) => (
  <GlassTimePicker format="24" {...props} />
);

export const SecondsPicker = (props: Omit<GlassTimePickerProps, 'showSeconds'>) => (
  <GlassTimePicker showSeconds {...props} />
);