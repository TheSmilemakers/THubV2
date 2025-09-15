'use client';

import { useTheme } from '@/lib/themes/use-theme';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex items-center justify-center",
        "w-12 h-12 rounded-xl transition-all duration-300",
        "touch-target-min",
        theme === 'synthwave' 
          ? "bg-glass-surface border border-neon-pink text-terminal-green hover:shadow-neon" 
          : "glass-card hover:bg-white/15 hover:-translate-y-1 hover:shadow-glass-lg text-text-primary",
        className
      )}
      aria-label={`Switch to ${theme === 'professional' ? 'synthwave' : 'professional'} theme`}
    >
      <div className="relative w-6 h-6">
        {theme === 'professional' ? (
          // Professional theme icon (glass/crystal)
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-6 h-6"
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
            className="w-6 h-6"
          >
            <polyline points="4,17 10,11 4,5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
        )}
        
        {/* Theme indicator dot */}
        <div
          className={cn(
            "absolute -top-1 -right-1 w-3 h-3 rounded-full transition-all duration-300",
            theme === 'synthwave'
              ? "bg-neon-pink shadow-neon animate-pulse"
              : "bg-gradient-to-r from-primary to-secondary shadow-glass-sm"
          )}
        />
      </div>
      
      {/* Hover tooltip */}
      <div className={cn(
        "absolute -top-12 left-1/2 -translate-x-1/2",
        "px-3 py-1 rounded-lg text-xs font-medium",
        "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
        "pointer-events-none whitespace-nowrap z-50",
        theme === 'synthwave'
          ? "bg-glass-surface border border-neon-cyan text-neon-cyan"
          : "glass-card text-text-primary"
      )}>
        Switch to {theme === 'professional' ? 'Synthwave' : 'Professional'}
      </div>
    </button>
  );
}