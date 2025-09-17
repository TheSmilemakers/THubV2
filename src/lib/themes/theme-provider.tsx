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
  defaultTheme = 'professional',
  storageKey = 'thub-theme'
}: ThemeProviderProps) {
  // Initialize theme with a stable getter function
  const [theme, setTheme] = useState<Theme>(() => {
    // Server-side: use default theme
    if (typeof window === 'undefined') {
      return defaultTheme;
    }

    // Client-side: check localStorage first, then DOM (set by SSR), then default
    const storedTheme = getStoredTheme(storageKey);
    if (storedTheme) {
      // Apply to DOM immediately to prevent flash
      document.documentElement.setAttribute('data-theme', storedTheme);
      return storedTheme;
    }

    const domTheme = document.documentElement.getAttribute('data-theme');
    if (isValidTheme(domTheme)) {
      return domTheme;
    }

    return defaultTheme;
  });

  // Track if we've done initial sync
  const hasSynced = useRef(false);

  // Sync theme on mount (only once)
  useEffect(() => {
    if (hasSynced.current) return;
    hasSynced.current = true;

    // The DOM might already have the correct theme from the script
    const currentDomTheme = document.documentElement.getAttribute('data-theme');
    
    // Update DOM if it doesn't match our state
    if (currentDomTheme !== theme) {
      document.documentElement.setAttribute('data-theme', theme);
    }

    // Ensure localStorage is in sync
    setStoredTheme(storageKey, theme);
  }, [theme, storageKey]);

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

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}