/**
 * Accessibility Hook
 * Provides accessibility features and utilities for WCAG 2.1 AA compliance
 * 
 * Features:
 * - Screen reader detection and announcements
 * - Keyboard navigation management
 * - Focus management utilities
 * - Reduced motion preference detection
 * - High contrast mode detection
 * - Large text preference support
 * - Color contrast utilities
 * - ARIA live region management
 */
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export interface AccessibilityPreferences {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  prefersLargeText: boolean;
  prefersReducedTransparency: boolean;
  colorScheme: 'light' | 'dark' | 'auto';
}

export interface ScreenReaderInfo {
  isActive: boolean;
  type: 'nvda' | 'jaws' | 'voiceover' | 'talkback' | 'unknown';
  supportsLiveRegions: boolean;
}

export interface FocusManagement {
  focusedElement: HTMLElement | null;
  focusHistory: HTMLElement[];
  trapFocus: (container: HTMLElement) => () => void;
  restoreFocus: () => void;
  announceFocus: (element: HTMLElement) => void;
}

export function useAccessibility() {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersLargeText: false,
    prefersReducedTransparency: false,
    colorScheme: 'auto',
  });

  const [screenReader, setScreenReader] = useState<ScreenReaderInfo>({
    isActive: false,
    type: 'unknown',
    supportsLiveRegions: true,
  });

  const focusHistoryRef = useRef<HTMLElement[]>([]);
  const liveRegionRef = useRef<HTMLElement | null>(null);
  const politeRegionRef = useRef<HTMLElement | null>(null);

  // Detect accessibility preferences
  useEffect(() => {
    const detectPreferences = () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      const prefersLargeText = window.matchMedia('(min-resolution: 120dpi)').matches || 
                               window.devicePixelRatio > 1.5;
      const prefersReducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
      const colorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

      setPreferences({
        prefersReducedMotion,
        prefersHighContrast,
        prefersLargeText,
        prefersReducedTransparency,
        colorScheme,
      });
    };

    detectPreferences();

    // Listen for preference changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const colorQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => detectPreferences();

    motionQuery.addEventListener('change', handleChange);
    contrastQuery.addEventListener('change', handleChange);
    colorQuery.addEventListener('change', handleChange);

    return () => {
      motionQuery.removeEventListener('change', handleChange);
      contrastQuery.removeEventListener('change', handleChange);
      colorQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Detect screen reader
  useEffect(() => {
    const detectScreenReader = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Check for screen reader indicators
      const hasScreenReader = 
        // Check for common screen readers in user agent
        userAgent.includes('nvda') ||
        userAgent.includes('jaws') ||
        userAgent.includes('voiceover') ||
        userAgent.includes('talkback') ||
        // Check for screen reader DOM indicators
        document.querySelector('[aria-hidden="true"]') !== null ||
        // Check for accessibility APIs
        'speechSynthesis' in window;

      let type: ScreenReaderInfo['type'] = 'unknown';
      if (userAgent.includes('nvda')) type = 'nvda';
      else if (userAgent.includes('jaws')) type = 'jaws';
      else if (navigator.platform.includes('Mac')) type = 'voiceover';
      else if (userAgent.includes('android')) type = 'talkback';

      setScreenReader({
        isActive: hasScreenReader,
        type,
        supportsLiveRegions: true, // Most modern screen readers support this
      });
    };

    detectScreenReader();
  }, []);

  // Create ARIA live regions
  useEffect(() => {
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'assertive');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.setAttribute('class', 'sr-only');
      liveRegion.id = 'accessibility-live-region';
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }

    if (!politeRegionRef.current) {
      const politeRegion = document.createElement('div');
      politeRegion.setAttribute('aria-live', 'polite');
      politeRegion.setAttribute('aria-atomic', 'true');
      politeRegion.setAttribute('class', 'sr-only');
      politeRegion.id = 'accessibility-polite-region';
      document.body.appendChild(politeRegion);
      politeRegionRef.current = politeRegion;
    }

    return () => {
      if (liveRegionRef.current) {
        document.body.removeChild(liveRegionRef.current);
        liveRegionRef.current = null;
      }
      if (politeRegionRef.current) {
        document.body.removeChild(politeRegionRef.current);
        politeRegionRef.current = null;
      }
    };
  }, []);

  // Announce to screen reader
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const region = priority === 'assertive' ? liveRegionRef.current : politeRegionRef.current;
    if (region) {
      region.textContent = message;
      // Clear after announcement to allow re-announcements of the same message
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  }, []);

  // Focus management
  const getFocusableElements = useCallback((container: HTMLElement): HTMLElement[] => {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(selector));
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Store current focus to restore later
    const previousFocus = document.activeElement as HTMLElement;
    focusHistoryRef.current.push(previousFocus);

    // Focus first element
    firstElement?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [getFocusableElements]);

  const restoreFocus = useCallback(() => {
    const previousElement = focusHistoryRef.current.pop();
    if (previousElement && typeof previousElement.focus === 'function') {
      previousElement.focus();
    }
  }, []);

  // Color contrast utilities
  const getContrastRatio = useCallback((color1: string, color2: string): number => {
    // Simplified contrast ratio calculation
    // In a real implementation, you'd want a more robust color parsing library
    const getLuminance = (color: string): number => {
      // This is a simplified implementation
      // Real implementation would parse RGB/HSL/HEX values properly
      return 0.5; // Placeholder
    };

    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }, []);

  const meetsContrastRequirement = useCallback((
    foreground: string, 
    background: string, 
    level: 'AA' | 'AAA' = 'AA'
  ): boolean => {
    const ratio = getContrastRatio(foreground, background);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  }, [getContrastRatio]);

  // Keyboard navigation helpers
  const handleArrowNavigation = useCallback((
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    orientation: 'horizontal' | 'vertical' | 'both' = 'both'
  ): number => {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        }
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
    }

    if (newIndex !== currentIndex) {
      items[newIndex]?.focus();
    }

    return newIndex;
  }, []);

  // Generate accessible IDs
  const generateId = useCallback((prefix: string = 'accessibility'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // ARIA helpers
  const createAriaAttributes = useCallback((options: {
    label?: string;
    labelledBy?: string;
    describedBy?: string;
    expanded?: boolean;
    selected?: boolean;
    checked?: boolean;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    live?: 'polite' | 'assertive' | 'off';
    atomic?: boolean;
    role?: string;
  }) => {
    const attrs: Record<string, string> = {};

    if (options.label) attrs['aria-label'] = options.label;
    if (options.labelledBy) attrs['aria-labelledby'] = options.labelledBy;
    if (options.describedBy) attrs['aria-describedby'] = options.describedBy;
    if (options.expanded !== undefined) attrs['aria-expanded'] = String(options.expanded);
    if (options.selected !== undefined) attrs['aria-selected'] = String(options.selected);
    if (options.checked !== undefined) attrs['aria-checked'] = String(options.checked);
    if (options.disabled) attrs['aria-disabled'] = 'true';
    if (options.required) attrs['aria-required'] = 'true';
    if (options.invalid) attrs['aria-invalid'] = 'true';
    if (options.live) attrs['aria-live'] = options.live;
    if (options.atomic !== undefined) attrs['aria-atomic'] = String(options.atomic);
    if (options.role) attrs['role'] = options.role;

    return attrs;
  }, []);

  return {
    // State
    preferences,
    screenReader,
    
    // Announcement functions
    announce,
    
    // Focus management
    trapFocus,
    restoreFocus,
    getFocusableElements,
    
    // Color contrast
    getContrastRatio,
    meetsContrastRequirement,
    
    // Keyboard navigation
    handleArrowNavigation,
    
    // Utilities
    generateId,
    createAriaAttributes,
    
    // Convenience flags
    shouldReduceMotion: preferences.prefersReducedMotion,
    shouldUseHighContrast: preferences.prefersHighContrast,
    shouldUseLargeText: preferences.prefersLargeText,
    isScreenReaderActive: screenReader.isActive,
  };
}