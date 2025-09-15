/**
 * High Contrast Mode Support
 * Provides enhanced visibility for users with visual impairments
 * 
 * Features:
 * - Automatic high contrast detection
 * - Manual high contrast toggle
 * - Enhanced focus indicators
 * - Improved color contrast ratios
 * - Pattern-based differentiation for colorblind users
 * - Border and outline enhancements
 */
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAccessibility } from '@/lib/hooks/use-accessibility';

interface HighContrastContextValue {
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  contrastLevel: 'normal' | 'high' | 'maximum';
  setContrastLevel: (level: 'normal' | 'high' | 'maximum') => void;
}

const HighContrastContext = createContext<HighContrastContextValue | null>(null);

export function useHighContrast() {
  const context = useContext(HighContrastContext);
  if (!context) {
    throw new Error('useHighContrast must be used within a HighContrastProvider');
  }
  return context;
}

export interface HighContrastProviderProps {
  children: React.ReactNode;
  persistPreference?: boolean;
}

export function HighContrastProvider({ 
  children, 
  persistPreference = true 
}: HighContrastProviderProps) {
  const { preferences } = useAccessibility();
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [contrastLevel, setContrastLevel] = useState<'normal' | 'high' | 'maximum'>('normal');

  // Initialize from system preferences and stored preferences
  useEffect(() => {
    const detectHighContrast = () => {
      // Check system preference
      const systemPreference = preferences.prefersHighContrast;
      
      // Check stored preference
      let storedPreference = false;
      let storedLevel: 'normal' | 'high' | 'maximum' = 'normal';
      
      if (persistPreference) {
        try {
          const stored = localStorage.getItem('high-contrast-preference');
          if (stored) {
            const parsed = JSON.parse(stored);
            storedPreference = parsed.enabled;
            storedLevel = parsed.level || 'high';
          }
        } catch (error) {
          console.warn('Failed to load high contrast preference:', error);
        }
      }

      // Use stored preference if available, otherwise system preference
      const shouldEnable = storedPreference || systemPreference;
      const level = storedPreference ? storedLevel : (systemPreference ? 'high' : 'normal');

      setIsHighContrast(shouldEnable);
      setContrastLevel(level);

      // Apply high contrast class to document
      document.documentElement.classList.toggle('high-contrast', shouldEnable);
      document.documentElement.classList.toggle(`contrast-${level}`, shouldEnable);
    };

    detectHighContrast();
  }, [preferences.prefersHighContrast, persistPreference]);

  // Save preference when changed
  useEffect(() => {
    if (persistPreference) {
      try {
        localStorage.setItem('high-contrast-preference', JSON.stringify({
          enabled: isHighContrast,
          level: contrastLevel,
        }));
      } catch (error) {
        console.warn('Failed to save high contrast preference:', error);
      }
    }

    // Update document classes
    document.documentElement.classList.toggle('high-contrast', isHighContrast);
    document.documentElement.classList.remove('contrast-normal', 'contrast-high', 'contrast-maximum');
    if (isHighContrast) {
      document.documentElement.classList.add(`contrast-${contrastLevel}`);
    }
  }, [isHighContrast, contrastLevel, persistPreference]);

  const toggleHighContrast = () => {
    setIsHighContrast(prev => !prev);
  };

  const handleSetContrastLevel = (level: 'normal' | 'high' | 'maximum') => {
    setContrastLevel(level);
    if (level !== 'normal') {
      setIsHighContrast(true);
    }
  };

  const contextValue: HighContrastContextValue = {
    isHighContrast,
    toggleHighContrast,
    contrastLevel,
    setContrastLevel: handleSetContrastLevel,
  };

  return (
    <HighContrastContext.Provider value={contextValue}>
      {children}
    </HighContrastContext.Provider>
  );
}

// Enhanced component wrapper for high contrast support
export interface HighContrastEnhancedProps {
  children: React.ReactNode;
  enhanceOnHighContrast?: boolean;
  className?: string;
  highContrastClassName?: string;
}

export function HighContrastEnhanced({
  children,
  enhanceOnHighContrast = true,
  className,
  highContrastClassName,
}: HighContrastEnhancedProps) {
  const { isHighContrast, contrastLevel } = useHighContrast();

  const enhancedClassName = cn(
    className,
    enhanceOnHighContrast && isHighContrast && [
      // Enhanced borders and outlines
      'border-2 border-current',
      'focus-visible:outline-4 focus-visible:outline-offset-2',
      'focus-visible:outline-current',
      
      // Level-specific enhancements
      contrastLevel === 'high' && [
        'shadow-md shadow-current/20',
      ],
      contrastLevel === 'maximum' && [
        'shadow-lg shadow-current/40',
        'ring-2 ring-current ring-offset-2 ring-offset-background-primary',
      ],
    ],
    highContrastClassName
  );

  return (
    <div className={enhancedClassName}>
      {children}
    </div>
  );
}

// High contrast toggle button
export interface HighContrastToggleProps {
  className?: string;
  children?: React.ReactNode;
}

export function HighContrastToggle({ className, children }: HighContrastToggleProps) {
  const { isHighContrast, toggleHighContrast, contrastLevel } = useHighContrast();

  return (
    <button
      onClick={toggleHighContrast}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg',
        'border border-border-primary hover:border-accent-primary',
        'bg-background-secondary hover:bg-background-tertiary',
        'text-text-primary hover:text-accent-primary',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-accent-primary/50',
        isHighContrast && [
          'border-2 border-current',
          'shadow-md shadow-current/20',
          contrastLevel === 'maximum' && 'ring-2 ring-current ring-offset-2',
        ],
        className
      )}
      aria-pressed={isHighContrast}
      aria-label={`${isHighContrast ? 'Disable' : 'Enable'} high contrast mode`}
    >
      {/* High contrast icon */}
      <svg
        className="w-4 h-4"
        fill="none"
        strokeWidth={2}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a10 10 0 0 0 0 20V2z" fill="currentColor" />
      </svg>
      
      {children || (
        <span>
          High Contrast {isHighContrast ? 'On' : 'Off'}
        </span>
      )}
    </button>
  );
}

// High contrast level selector
export interface ContrastLevelSelectorProps {
  className?: string;
}

export function ContrastLevelSelector({ className }: ContrastLevelSelectorProps) {
  const { contrastLevel, setContrastLevel, isHighContrast } = useHighContrast();

  const levels = [
    { value: 'normal' as const, label: 'Normal', description: 'Standard contrast' },
    { value: 'high' as const, label: 'High', description: 'Enhanced contrast for better visibility' },
    { value: 'maximum' as const, label: 'Maximum', description: 'Maximum contrast for accessibility' },
  ];

  return (
    <fieldset className={cn('space-y-2', className)}>
      <legend className="text-sm font-medium text-text-primary mb-3">
        Contrast Level
      </legend>
      
      {levels.map((level) => (
        <label
          key={level.value}
          className={cn(
            'flex items-start gap-3 p-3 rounded-lg border cursor-pointer',
            'hover:bg-background-tertiary transition-colors',
            contrastLevel === level.value && [
              'border-accent-primary bg-accent-primary/5',
              isHighContrast && 'border-2 border-current ring-1 ring-current ring-offset-1',
            ],
            !isHighContrast && contrastLevel === level.value && 'border-accent-primary',
            isHighContrast && 'border-current'
          )}
        >
          <input
            type="radio"
            name="contrast-level"
            value={level.value}
            checked={contrastLevel === level.value}
            onChange={() => setContrastLevel(level.value)}
            className={cn(
              'mt-0.5 w-4 h-4 border-2 border-border-primary rounded-full',
              'checked:border-accent-primary checked:bg-accent-primary',
              'focus:ring-2 focus:ring-accent-primary/50 focus:ring-offset-2',
              isHighContrast && [
                'border-current checked:border-current checked:bg-current',
                'focus:ring-current/50',
              ]
            )}
          />
          
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-text-primary">
              {level.label}
            </div>
            <div className="text-xs text-text-secondary mt-1">
              {level.description}
            </div>
          </div>
        </label>
      ))}
    </fieldset>
  );
}