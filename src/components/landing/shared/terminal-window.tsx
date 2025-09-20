'use client';

import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface TerminalWindowProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
  themeToggle?: React.ReactNode;
}

export function TerminalWindow({ 
  title = "TERMINAL", 
  children, 
  className,
  animated = false,
  themeToggle 
}: TerminalWindowProps) {
  const [isTyping, setIsTyping] = useState(animated);
  
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsTyping(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [animated]);

  return (
    <div className={cn(
      "terminal-window relative overflow-hidden",
      animated && "animate-glow",
      className
    )}>
      {/* Terminal Header */}
      <div className="terminal-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Window Controls */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          
          {/* Terminal Title */}
          <div className="terminal-title text-terminal-green font-mono">
            {title}
          </div>
        </div>
        
        {/* Connection Status with optional Theme Toggle */}
        <div className="flex items-center gap-4">
          {themeToggle}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
            <span className="text-xs text-neon-cyan">CONNECTED</span>
          </div>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="p-6 font-mono text-sm">
        {animated && isTyping && (
          <div className="mb-4 text-terminal-green">
            <div className="flex items-center gap-2 mb-2">
              <span>{">"}</span>
              <span className="animate-pulse">Loading system modules...</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span>{">"}</span>
              <span className="animate-pulse">Initializing neural networks...</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span>{">"}</span>
              <span className="animate-pulse">Connecting to market feeds...</span>
            </div>
          </div>
        )}
        
        {children}
        
        {/* Cursor */}
        <div className="flex items-center mt-4">
          <span className="text-neon-cyan mr-2">{">"}</span>
          <div className="w-2 h-4 bg-terminal-green animate-pulse" />
        </div>
      </div>

      {/* Scan Line Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-terminal-green to-transparent opacity-30 animate-scan-line" />
      </div>
    </div>
  );
}