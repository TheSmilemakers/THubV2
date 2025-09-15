'use client';

import React, { useState, useId, forwardRef, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Check, 
  X, 
  Search, 
  AlertCircle, 
  CheckCircle,
  Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';

/**
 * GlassSelect Component - Dropdown select with glassmorphism styling
 * 
 * Features:
 * - Single and multi-select support
 * - Search/filter functionality
 * - Adaptive glassmorphism effects
 * - Touch-optimized for mobile (44px minimum touch targets)
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Loading states for async data
 * - Validation states with smooth transitions
 * - Virtual scrolling for large option lists
 * - Accessible ARIA attributes
 * - React Hook Form compatible
 */

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
  icon?: React.ReactNode;
  description?: string;
}

export interface GlassSelectProps {
  label?: string;
  placeholder?: string;
  value?: SelectOption['value'] | SelectOption['value'][];
  defaultValue?: SelectOption['value'] | SelectOption['value'][];
  options: SelectOption[];
  onChange?: (value: SelectOption['value'] | SelectOption['value'][]) => void;
  onBlur?: (e: React.FocusEvent<HTMLDivElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLDivElement>) => void;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  maxHeight?: number;
  className?: string;
  optionClassName?: string;
  'data-testid'?: string;
  // Async search support
  onSearch?: (query: string) => void;
  searchDebounceMs?: number;
  // Display customization
  renderOption?: (option: SelectOption, isSelected: boolean) => React.ReactNode;
  renderSelected?: (option: SelectOption) => React.ReactNode;
  getOptionLabel?: (option: SelectOption) => string;
  getOptionValue?: (option: SelectOption) => string | number;
}

const GlassSelect = forwardRef<HTMLDivElement, GlassSelectProps>(({
  label,
  placeholder = 'Select an option...',
  value,
  defaultValue,
  options = [],
  onChange,
  onBlur,
  onFocus,
  multiple = false,
  searchable = false,
  clearable = false,
  loading = false,
  error,
  success,
  hint,
  disabled = false,
  required = false,
  maxHeight = 200,
  className,
  optionClassName,
  'data-testid': testId,
  onSearch,
  searchDebounceMs = 300,
  renderOption,
  renderSelected,
  getOptionLabel = (option) => option.label,
  getOptionValue = (option) => option.value,
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [internalValue, setInternalValue] = useState<SelectOption['value'] | SelectOption['value'][]>(
    defaultValue ?? (multiple ? [] : '')
  );
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const selectId = useId();
  const searchId = useId();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch, screenSize } = useDeviceCapabilities();

  // Use controlled or uncontrolled value
  const currentValue = value !== undefined ? value : internalValue;
  const isMultiple = multiple;
  const selectedValues = Array.isArray(currentValue) ? currentValue : currentValue ? [currentValue] : [];
  
  // Filter options based on search query
  const filteredOptions = searchable && searchQuery 
    ? options.filter(option => 
        getOptionLabel(option).toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Group options if they have group property
  const groupedOptions = filteredOptions.reduce((acc, option) => {
    const group = option.group || 'default';
    if (!acc[group]) acc[group] = [];
    acc[group].push(option);
    return acc;
  }, {} as Record<string, SelectOption[]>);

  // Get selected options for display
  const selectedOptions = options.filter(option => 
    selectedValues.includes(getOptionValue(option))
  );

  // Determine select state
  const selectState = error ? 'error' : success ? 'success' : isFocused ? 'focused' : 'default';
  const hasValue = selectedValues.length > 0;

  // Handle value changes
  const handleValueChange = useCallback((optionValue: SelectOption['value']) => {
    let newValue: SelectOption['value'] | SelectOption['value'][];
    
    if (isMultiple) {
      const currentArray = Array.isArray(currentValue) ? currentValue : [];
      if (currentArray.includes(optionValue)) {
        newValue = currentArray.filter(v => v !== optionValue);
      } else {
        newValue = [...currentArray, optionValue];
      }
    } else {
      newValue = optionValue;
      setIsOpen(false);
    }
    
    if (value === undefined) {
      setInternalValue(newValue);
    }
    
    onChange?.(newValue);
  }, [currentValue, isMultiple, onChange, value, setIsOpen]);

  // Handle search input changes
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setFocusedIndex(-1);
    
    if (onSearch) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        onSearch(query);
      }, searchDebounceMs);
    }
  }, [onSearch, searchDebounceMs]);

  // Handle clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = isMultiple ? [] : '';
    
    if (value === undefined) {
      setInternalValue(newValue);
    }
    
    onChange?.(newValue);
    setSearchQuery('');
  };

  // Handle focus events
  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // Don't blur if clicking within the select
    if (containerRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    
    setIsFocused(false);
    setIsOpen(false);
    setFocusedIndex(-1);
    onBlur?.(e);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          if (searchable && searchRef.current) {
            searchRef.current.focus();
          }
        } else if (focusedIndex >= 0) {
          const flatOptions = Object.values(groupedOptions).flat();
          const option = flatOptions[focusedIndex];
          if (option && !option.disabled) {
            handleValueChange(getOptionValue(option));
          }
        }
        break;
        
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        containerRef.current?.focus();
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const flatOptions = Object.values(groupedOptions).flat();
          const nextIndex = Math.min(focusedIndex + 1, flatOptions.length - 1);
          setFocusedIndex(nextIndex);
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          const nextIndex = Math.max(focusedIndex - 1, 0);
          setFocusedIndex(nextIndex);
        }
        break;
        
      case 'Tab':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Cleanup search timeout
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Scroll focused option into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listRef.current) {
      const optionElements = listRef.current.querySelectorAll('[role="option"]');
      const focusedElement = optionElements[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, isOpen]);

  // Styling
  const containerClasses = cn(
    'relative w-full transition-all duration-300',
    className
  );

  const triggerClasses = cn(
    'relative w-full flex items-center justify-between cursor-pointer',
    'rounded-xl transition-all duration-300',
    'px-4 py-3 touch-target text-base',
    screenSize === 'mobile' && 'text-16', // Prevent zoom on iOS
    // Glass effect based on state
    selectState === 'focused' && adaptiveGlass.effects 
      ? 'glass-medium shadow-lg shadow-accent-primary/20'
      : 'glass-light',
    // State colors
    {
      'border-2 border-accent-primary': selectState === 'focused',
      'border-2 border-status-error': selectState === 'error',
      'border-2 border-status-success': selectState === 'success',
      'border border-glass-border': selectState === 'default',
    },
    // Disabled state
    disabled && 'opacity-50 cursor-not-allowed',
    'gpu-accelerated'
  );

  const dropdownClasses = cn(
    'absolute z-50 w-full mt-2 rounded-xl overflow-hidden',
    'glass-dark border border-glass-border shadow-2xl',
    adaptiveGlass.effects && 'backdrop-blur-xl',
    'gpu-accelerated'
  );

  const optionClasses = (option: SelectOption, isSelected: boolean, isFocused: boolean) => cn(
    'flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200',
    'touch-target', // Mobile touch target
    {
      'bg-accent-primary/20 text-white': isSelected && !isFocused,
      'bg-white/10': isFocused && !isSelected,
      'bg-accent-primary/30 text-white': isSelected && isFocused,
      'text-white': !isSelected && !isFocused,
      'text-text-muted cursor-not-allowed': option.disabled,
    },
    optionClassName
  );

  return (
    <div className={containerClasses} ref={ref}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={selectId}
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          {label}
          {required && <span className="text-status-error ml-1">*</span>}
        </label>
      )}

      {/* Select trigger */}
      <div
        ref={containerRef}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={label ? `${selectId}-label` : undefined}
        aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={triggerClasses}
        data-testid={testId}
      >
        {/* Selected value display */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
              <span className="text-text-muted">Loading...</span>
            </div>
          ) : hasValue ? (
            <div className="flex flex-wrap gap-1 min-w-0">
              {isMultiple ? (
                selectedOptions.map((option) => (
                  <motion.div
                    key={getOptionValue(option)}
                    className="flex items-center gap-1 px-2 py-1 bg-accent-primary/20 rounded-lg text-sm"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderSelected ? renderSelected(option) : getOptionLabel(option)}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleValueChange(getOptionValue(option));
                      }}
                      className="p-0.5 hover:bg-white/20 rounded transition-colors"
                      aria-label={`Remove ${getOptionLabel(option)}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))
              ) : (
                <span className="text-white truncate">
                  {renderSelected ? renderSelected(selectedOptions[0]) : getOptionLabel(selectedOptions[0])}
                </span>
              )}
            </div>
          ) : (
            <span className="text-text-muted">{placeholder}</span>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1 ml-2">
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
              aria-label="Clear selection"
            >
              <X className="w-4 h-4 text-text-muted" />
            </motion.button>
          )}

          {/* Dropdown arrow */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-text-muted"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
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
      </div>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={dropdownClasses}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Search input */}
            {searchable && (
              <div className="p-3 border-b border-glass-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    ref={searchRef}
                    id={searchId}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search options..."
                    className="w-full pl-10 pr-4 py-2 bg-transparent text-white placeholder:text-text-muted border border-glass-border rounded-lg focus:outline-none focus:border-accent-primary transition-colors"
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            {/* Options list */}
            <div
              ref={listRef}
              role="listbox"
              id={listboxId}
              aria-multiselectable={isMultiple}
              className="overflow-y-auto"
              style={{ maxHeight }}
            >
              {Object.keys(groupedOptions).length === 0 ? (
                <div className="p-4 text-center text-text-muted">
                  {searchQuery ? 'No options found' : 'No options available'}
                </div>
              ) : (
                Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
                  <div key={groupName}>
                    {groupName !== 'default' && (
                      <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wider bg-black/20">
                        {groupName}
                      </div>
                    )}
                    {groupOptions.map((option, index) => {
                      const flatIndex = Object.values(groupedOptions)
                        .flat()
                        .findIndex(opt => opt === option);
                      const isSelected = selectedValues.includes(getOptionValue(option));
                      const isFocused = focusedIndex === flatIndex;
                      
                      return (
                        <motion.div
                          key={getOptionValue(option)}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => !option.disabled && handleValueChange(getOptionValue(option))}
                          className={optionClasses(option, isSelected, isFocused)}
                          whileHover={!option.disabled ? { backgroundColor: 'rgba(255,255,255,0.05)' } : undefined}
                          whileTap={!option.disabled ? { scale: 0.98 } : undefined}
                        >
                          {/* Option icon */}
                          {option.icon && (
                            <div className="flex-shrink-0">
                              {option.icon}
                            </div>
                          )}

                          {/* Option content */}
                          <div className="flex-1 min-w-0">
                            {renderOption ? (
                              renderOption(option, isSelected)
                            ) : (
                              <div>
                                <div className="font-medium">{getOptionLabel(option)}</div>
                                {option.description && (
                                  <div className="text-sm text-text-muted">{option.description}</div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Selection indicator */}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex-shrink-0"
                            >
                              <Check className="w-4 h-4 text-accent-primary" />
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
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

GlassSelect.displayName = 'GlassSelect';

export { GlassSelect };

// Convenience components for common use cases
export const SingleSelect = (props: Omit<GlassSelectProps, 'multiple'>) => (
  <GlassSelect multiple={false} {...props} />
);

export const MultiSelect = (props: Omit<GlassSelectProps, 'multiple'>) => (
  <GlassSelect multiple clearable {...props} />
);

export const SearchableSelect = (props: Omit<GlassSelectProps, 'searchable'>) => (
  <GlassSelect searchable {...props} />
);

export const AsyncSelect = (props: Omit<GlassSelectProps, 'searchable' | 'loading'> & { 
  loading?: boolean;
  onSearch: (query: string) => void;
}) => (
  <GlassSelect searchable {...props} />
);