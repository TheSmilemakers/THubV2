'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/lib/themes/use-theme';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function ThemeToggle({ className, disabled, size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn(
        size === 'sm' ? "w-8 h-8" : "w-10 h-10 md:w-12 md:h-12",
        "rounded-xl bg-glass-surface",
        className
      )} />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      disabled={disabled}
      className={cn(
        "relative inline-flex items-center justify-center",
        size === 'sm' 
          ? "w-8 h-8 rounded-lg" 
          : "w-10 h-10 md:w-12 md:h-12 rounded-xl",
        "transition-all duration-300",
        size === 'md' && "touch-target-min",
        theme === 'synthwave' 
          ? "bg-glass-surface border border-neon-pink text-terminal-green hover:shadow-neon" 
          : "glass-card hover:bg-white/15 hover:-translate-y-1 hover:shadow-glass-lg text-text-primary",
        disabled && "opacity-50 cursor-not-allowed hover:transform-none hover:shadow-none",
        className
      )}
      aria-label={`Switch to ${theme === 'professional' ? 'synthwave' : 'professional'} theme`}
      aria-disabled={disabled}
    >
      <div className={cn("relative", size === 'sm' ? "w-4 h-4" : "w-6 h-6")}>
        {theme === 'professional' ? (
          // Professional theme icon (glass/crystal)
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className={size === 'sm' ? "w-4 h-4" : "w-6 h-6"}
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        ) : (
          // Synthwave theme icon (terminal/code)
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className={size === 'sm' ? "w-4 h-4" : "w-6 h-6"}
          >
            <polyline points="4,17 10,11 4,5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
        )}
        
        {/* Theme indicator dot */}
        <div
          className={cn(
            "absolute rounded-full transition-all duration-300",
            size === 'sm' 
              ? "-top-0.5 -right-0.5 w-2 h-2" 
              : "-top-1 -right-1 w-3 h-3",
            theme === 'synthwave'
              ? "bg-neon-pink shadow-neon animate-pulse"
              : "bg-gradient-to-r from-primary to-secondary shadow-glass-sm"
          )}
        />
      </div>
      
      {/* Loading indicator when disabled */}
      {disabled && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/10">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* Hover tooltip */}
      <div className={cn(
        "absolute -top-12 left-1/2 -translate-x-1/2",
        "px-3 py-1 rounded-lg text-xs font-medium",
        "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
        "pointer-events-none whitespace-nowrap z-50",
        theme === 'synthwave'
          ? "bg-glass-surface border border-neon-cyan text-neon-cyan"
          : "glass-card text-text-primary",
        disabled && "hidden"
      )}>
        Switch to {theme === 'professional' ? 'Synthwave' : 'Professional'}
      </div>
    </button>
  );
}