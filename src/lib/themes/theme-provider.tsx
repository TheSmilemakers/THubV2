'use client';

import { useState, useEffect, useCallback } from 'react';
import { ThemeContext, Theme } from './theme-context';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'professional',
  storageKey = 'thub-theme'
}: ThemeProviderProps) {
  // Always initialize with defaultTheme to match server
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Read theme from localStorage/DOM after mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem(storageKey) as Theme;
    const currentTheme = document.documentElement.getAttribute('data-theme') as Theme;
    const themeToUse = savedTheme || currentTheme || defaultTheme;
    
    if (themeToUse !== theme) {
      setTheme(themeToUse);
      document.documentElement.setAttribute('data-theme', themeToUse);
    }
  }, [storageKey, defaultTheme]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'professional' ? 'synthwave' : 'professional';
    setTheme(newTheme);
    localStorage.setItem(storageKey, newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }, [theme, storageKey]);

  // Sync with localStorage changes (for multi-tab support)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        const newTheme = e.newValue as Theme;
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey]);

  // Prevent flash by using default theme until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: defaultTheme, toggleTheme: () => {} }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}