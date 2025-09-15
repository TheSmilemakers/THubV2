'use client';

import React, { useState, useId, forwardRef, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';

/**
 * GlassDatePicker Component - Date picker with glassmorphism styling
 * 
 * Features:
 * - Calendar overlay with glassmorphism effects
 * - Touch-optimized for mobile devices
 * - Date range selection support
 * - Min/max date constraints
 * - Multiple date formats
 * - Keyboard navigation
 * - Adaptive glassmorphism effects
 * - Validation states with visual feedback
 * - React Hook Form compatible
 * - Preset date shortcuts
 * - Time selection integration
 */

export interface GlassDatePickerProps {
  label?: string;
  placeholder?: string;
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date | null) => void;
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
  // Date constraints
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  disabledDaysOfWeek?: number[]; // 0 = Sunday, 6 = Saturday
  // Formatting
  dateFormat?: string;
  displayFormat?: string;
  // Features
  showTime?: boolean;
  clearable?: boolean;
  showToday?: boolean;
  weekStartsOn?: 0 | 1; // 0 = Sunday, 1 = Monday
  // Presets
  presets?: { label: string; date: Date }[];
  // Range selection
  selectRange?: boolean;
  rangeValue?: [Date | null, Date | null];
  onRangeChange?: (range: [Date | null, Date | null]) => void;
}

const GlassDatePicker = forwardRef<HTMLInputElement, GlassDatePickerProps>(({
  label,
  placeholder = 'Select date...',
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
  minDate,
  maxDate,
  disabledDates = [],
  disabledDaysOfWeek = [],
  dateFormat = 'yyyy-MM-dd',
  displayFormat = 'MMM dd, yyyy',
  showTime = false,
  clearable = true,
  showToday = true,
  weekStartsOn = 0,
  presets = [],
  selectRange = false,
  rangeValue,
  onRangeChange,
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState<Date | null>(defaultValue);
  const [internalRangeValue, setInternalRangeValue] = useState<[Date | null, Date | null]>([null, null]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState({ hours: 12, minutes: 0 });
  
  const datePickerId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch, screenSize } = useDeviceCapabilities();

  // Use controlled or uncontrolled value
  const currentValue = value !== undefined ? value : internalValue;
  const currentRangeValue = rangeValue !== undefined ? rangeValue : internalRangeValue;
  
  // Determine datepicker state
  const datePickerState = error ? 'error' : success ? 'success' : isFocused ? 'focused' : 'default';

  // Date formatting utilities
  const formatDate = useCallback((date: Date | null, format: string = displayFormat): string => {
    if (!date) return '';
    
    // Simple date formatting (in a real app, use date-fns or similar)
    const options: Intl.DateTimeFormatOptions = {};
    
    if (format.includes('MMM')) {
      options.month = 'short';
    } else if (format.includes('MM')) {
      options.month = '2-digit';
    }
    
    if (format.includes('dd')) {
      options.day = '2-digit';
    } else if (format.includes('d')) {
      options.day = 'numeric';
    }
    
    if (format.includes('yyyy')) {
      options.year = 'numeric';
    } else if (format.includes('yy')) {
      options.year = '2-digit';
    }
    
    if (showTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('en-US', options);
  }, [displayFormat, showTime]);

  // Check if date is disabled
  const isDateDisabled = useCallback((date: Date): boolean => {
    // Check min/max constraints
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    
    // Check disabled dates
    if (disabledDates.some(disabledDate => 
      date.toDateString() === disabledDate.toDateString()
    )) return true;
    
    // Check disabled days of week
    if (disabledDaysOfWeek.includes(date.getDay())) return true;
    
    return false;
  }, [minDate, maxDate, disabledDates, disabledDaysOfWeek]);

  // Generate calendar days
  const generateCalendarDays = useCallback(() => {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startOfCalendar = new Date(startOfMonth);
    const endOfCalendar = new Date(endOfMonth);

    // Adjust to week start
    const startDay = (startOfMonth.getDay() - weekStartsOn + 7) % 7;
    startOfCalendar.setDate(startOfCalendar.getDate() - startDay);
    
    const endDay = (6 - endOfMonth.getDay() + weekStartsOn) % 7;
    endOfCalendar.setDate(endOfCalendar.getDate() + endDay);

    const days: Date[] = [];
    const current = new Date(startOfCalendar);
    
    while (current <= endOfCalendar) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentMonth, weekStartsOn]);

  // Handle date selection
  const handleDateSelect = useCallback((selectedDate: Date) => {
    if (isDateDisabled(selectedDate)) return;
    
    let newDate = new Date(selectedDate);
    
    // Add time if enabled
    if (showTime) {
      newDate.setHours(selectedTime.hours, selectedTime.minutes);
    }
    
    if (selectRange) {
      const [start, end] = currentRangeValue;
      let newRange: [Date | null, Date | null];
      
      if (!start || (start && end)) {
        // Start new range
        newRange = [newDate, null];
      } else {
        // Complete range
        newRange = newDate < start ? [newDate, start] : [start, newDate];
        setIsOpen(false);
      }
      
      if (rangeValue === undefined) {
        setInternalRangeValue(newRange);
      }
      onRangeChange?.(newRange);
    } else {
      if (value === undefined) {
        setInternalValue(newDate);
      }
      onChange?.(newDate);
      setIsOpen(false);
    }
  }, [isDateDisabled, showTime, selectedTime, selectRange, currentRangeValue, rangeValue, value, onChange, onRangeChange]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Try to parse the input as a date
    const parsedDate = new Date(inputValue);
    if (!isNaN(parsedDate.getTime()) && !isDateDisabled(parsedDate)) {
      if (value === undefined) {
        setInternalValue(parsedDate);
      }
      onChange?.(parsedDate);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Don't blur if clicking within the datepicker
    if (containerRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    
    setIsFocused(false);
    setIsOpen(false);
    onBlur?.(e);
  };

  const handleClear = () => {
    if (selectRange) {
      if (rangeValue === undefined) {
        setInternalRangeValue([null, null]);
      }
      onRangeChange?.([null, null]);
    } else {
      if (value === undefined) {
        setInternalValue(null);
      }
      onChange?.(null);
    }
  };

  // Navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  // Close datepicker when clicking outside
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

  // Generate display value
  const displayValue = selectRange 
    ? currentRangeValue[0] && currentRangeValue[1]
      ? `${formatDate(currentRangeValue[0])} - ${formatDate(currentRangeValue[1])}`
      : currentRangeValue[0]
        ? `${formatDate(currentRangeValue[0])} - ...`
        : ''
    : formatDate(currentValue);

  const calendarDays = generateCalendarDays();
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  if (weekStartsOn === 1) {
    weekDays.push(weekDays.shift()!);
  }

  // Styling
  const containerClasses = cn(
    'relative w-full transition-all duration-300',
    className
  );

  const inputContainerClasses = cn(
    'relative flex items-center cursor-pointer',
    'rounded-xl transition-all duration-300',
    // Glass effect based on state
    datePickerState === 'focused' && adaptiveGlass.effects 
      ? 'glass-medium shadow-lg shadow-accent-primary/20'
      : 'glass-light',
    // State colors
    {
      'border-2 border-accent-primary': datePickerState === 'focused',
      'border-2 border-status-error': datePickerState === 'error',
      'border-2 border-status-success': datePickerState === 'success',
      'border border-glass-border': datePickerState === 'default',
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

  const calendarClasses = cn(
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
          htmlFor={datePickerId}
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
          id={datePickerId}
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
          {clearable && (currentValue || (selectRange && (currentRangeValue[0] || currentRangeValue[1]))) && !disabled && (
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
              aria-label="Clear date"
            >
              <X className="w-4 h-4 text-text-muted" />
            </motion.button>
          )}

          {/* Calendar icon */}
          <div className="text-text-muted">
            <Calendar className="w-5 h-5" />
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

      {/* Calendar overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={calendarClasses}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Calendar header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => navigateMonth('prev')}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors touch-target-min"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              
              <h3 className="text-lg font-medium text-white">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              
              <button
                type="button"
                onClick={() => navigateMonth('next')}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors touch-target-min"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-text-muted py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {calendarDays.map((date, index) => {
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = selectRange 
                  ? currentRangeValue[0]?.toDateString() === date.toDateString() ||
                    currentRangeValue[1]?.toDateString() === date.toDateString()
                  : currentValue?.toDateString() === date.toDateString();
                const isInRange = selectRange && currentRangeValue[0] && currentRangeValue[1] &&
                  date >= currentRangeValue[0] && date <= currentRangeValue[1];
                const isDisabled = isDateDisabled(date);

                return (
                  <motion.button
                    key={index}
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    disabled={isDisabled}
                    className={cn(
                      'w-8 h-8 rounded-lg text-sm transition-all duration-200 touch-target-min',
                      {
                        'text-white font-medium': isCurrentMonth && !isDisabled,
                        'text-text-muted': !isCurrentMonth || isDisabled,
                        'bg-accent-primary text-white': isSelected,
                        'bg-accent-primary/20': isInRange && !isSelected,
                        'ring-2 ring-white': isToday && !isSelected,
                        'hover:bg-white/10': !isDisabled && !isSelected,
                        'cursor-not-allowed opacity-50': isDisabled,
                      }
                    )}
                    whileHover={!isDisabled ? { scale: 1.05 } : undefined}
                    whileTap={!isDisabled ? { scale: 0.95 } : undefined}
                  >
                    {date.getDate()}
                  </motion.button>
                );
              })}
            </div>

            {/* Today button */}
            {showToday && (
              <div className="flex justify-center">
                <motion.button
                  type="button"
                  onClick={() => handleDateSelect(new Date())}
                  className="px-4 py-2 text-sm text-accent-primary hover:bg-accent-primary/20 rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Today
                </motion.button>
              </div>
            )}

            {/* Presets */}
            {presets.length > 0 && (
              <div className="mt-4 pt-4 border-t border-glass-border">
                <div className="space-y-1">
                  {presets.map((preset, index) => (
                    <motion.button
                      key={index}
                      type="button"
                      onClick={() => handleDateSelect(preset.date)}
                      className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      whileHover={{ x: 4 }}
                    >
                      {preset.label}
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

GlassDatePicker.displayName = 'GlassDatePicker';

export { GlassDatePicker };

// Convenience components
export const DateRangePicker = (props: Omit<GlassDatePickerProps, 'selectRange'>) => (
  <GlassDatePicker selectRange {...props} />
);

export const DateTimePicker = (props: Omit<GlassDatePickerProps, 'showTime'>) => (
  <GlassDatePicker showTime {...props} />
);

export const BirthdatePicker = (props: Omit<GlassDatePickerProps, 'maxDate' | 'placeholder'>) => (
  <GlassDatePicker 
    maxDate={new Date()} 
    placeholder="Select birthdate..."
    {...props} 
  />
);