'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ThemeContext, Theme } from './theme-context';

// Supported themes - easily extensible
const SUPPORTED_THEMES: readonly Theme[] = ['professional', 'synthwave'] as const;

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

// Theme validation
function isValidTheme(value: unknown): value is Theme {
  return typeof value === 'string' && SUPPORTED_THEMES.includes(value as Theme);
}

// Safe localStorage operations
function getStoredTheme(key: string): Theme | null {
  try {
    const stored = localStorage.getItem(key);
    return isValidTheme(stored) ? stored : null;
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error);
    return null;
  }
}

function setStoredTheme(key: string, theme: Theme): void {
  try {
    localStorage.setItem(key, theme);
  } catch (error) {
    console.warn('Failed to save theme to localStorage:', error);
  }
}

export function ThemeProvider({
  children,
  defaultTheme = 'synthwave',
  storageKey = 'thub-theme'
}: ThemeProviderProps) {
  // Initialize with default theme for hydration consistency
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [isHydrated, setIsHydrated] = useState(false);

  // Track if we've done initial sync
  const hasSynced = useRef(false);

  // Sync theme on mount (only once) - AFTER hydration
  useEffect(() => {
    if (hasSynced.current) return;
    hasSynced.current = true;

    // Check for stored theme preference
    const storedTheme = getStoredTheme(storageKey);
    if (storedTheme && storedTheme !== theme) {
      setTheme(storedTheme);
      document.documentElement.setAttribute('data-theme', storedTheme);
    } else {
      // Apply default theme to DOM
      document.documentElement.setAttribute('data-theme', theme);
      setStoredTheme(storageKey, theme);
    }
    
    // Mark as hydrated
    setIsHydrated(true);
  }, []);

  // Theme toggle function with proper state updates
  const toggleTheme = useCallback(() => {
    setTheme(currentTheme => {
      // Find current theme index
      const currentIndex = SUPPORTED_THEMES.indexOf(currentTheme);
      // Get next theme (wrap around to first if at end)
      const nextIndex = (currentIndex + 1) % SUPPORTED_THEMES.length;
      const newTheme = SUPPORTED_THEMES[nextIndex];
      
      // Update DOM immediately for instant feedback
      document.documentElement.setAttribute('data-theme', newTheme);
      
      // Persist to localStorage
      setStoredTheme(storageKey, newTheme);
      
      return newTheme;
    });
  }, [storageKey]);

  // Sync with localStorage changes (for multi-tab support)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only handle our storage key
      if (e.key !== storageKey) return;
      
      // Validate the new value
      if (isValidTheme(e.newValue)) {
        setTheme(e.newValue);
        document.documentElement.setAttribute('data-theme', e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey]);

  // Ensure theme changes are reflected in DOM
  useEffect(() => {
    const currentDomTheme = document.documentElement.getAttribute('data-theme');
    if (currentDomTheme !== theme) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // During SSR and initial hydration, always use default theme
  // to prevent hydration mismatches
  const contextValue = {
    theme: typeof window === 'undefined' || !isHydrated ? defaultTheme : theme,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}