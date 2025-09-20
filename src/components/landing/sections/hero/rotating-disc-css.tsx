'use client';

import { cn } from '@/lib/utils';

interface RotatingDiscCssProps {
  className?: string;
  isActive?: boolean;
}

export function RotatingDiscCss({ className, isActive = true }: RotatingDiscCssProps) {
  if (!isActive) return null;
  
  return (
    <div className={cn("flex items-center justify-center pointer-events-none", className)}>
      <div className="relative w-[300px] h-[150px]">
        {/* Rotating container */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
          {/* Create dots in circular pattern */}
          {[...Array(12)].map((_, i) => {
            const angle = (i / 12) * 360;
            const x = 50 + 30 * Math.cos((angle * Math.PI) / 180);
            const y = 50 + 30 * Math.sin((angle * Math.PI) / 180);
            
            return (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-pulse"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                  background: 'radial-gradient(circle, rgba(6, 255, 165, 0.8), rgba(6, 255, 165, 0.2))',
                  boxShadow: '0 0 10px rgba(6, 255, 165, 0.6)',
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1.5s'
                }}
              >
                {/* Inner glow */}
                <div className="absolute inset-0 rounded-full animate-ping"
                  style={{
                    background: 'radial-gradient(circle, rgba(6, 255, 165, 0.4), transparent)',
                    animationDuration: '2s',
                    animationDelay: `${i * 0.15}s`
                  }}
                />
              </div>
            );
          })}
        </div>
        
        {/* Central glow effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(6, 255, 165, 0.1), transparent)',
              filter: 'blur(20px)',
              animationDuration: '2s'
            }}
          />
        </div>
        
        {/* Orbiting rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 border border-terminal-green/20 rounded-full animate-pulse"
            style={{ animationDuration: '3s' }}
          />
          <div className="absolute w-40 h-40 border border-terminal-green/10 rounded-full animate-pulse"
            style={{ animationDuration: '4s', animationDelay: '0.5s' }}
          />
        </div>
      </div>
    </div>
  );
}