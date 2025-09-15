'use client';

import React, { useState, useRef, forwardRef } from 'react';
import { motion, HTMLMotionProps, useMotionValue, useTransform, animate } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useProgressiveEnhancementContext } from '@/components/providers/progressive-enhancement-provider';
import { useComponentEnhancement } from '@/lib/hooks/use-progressive-enhancement';
import { useDeviceCapabilities } from '@/lib/hooks/use-device-capabilities';
import { Signal, UISignalStrength } from '@/types/signals.types';
import { GlassCard } from '@/components/ui/glass-card';

/**
 * SignalCard Component - Premium trading signal display with glassmorphism effects
 * 
 * Features:
 * - 3-layer convergence score visualization (Technical/Sentiment/Liquidity)
 * - Dynamic glassmorphism effects based on signal strength
 * - Touch-optimized gestures (swipe, tap, long-press)
 * - Real-time score updates with smooth animations
 * - Color-coded scoring system (Red/Yellow/Green)
 * - Performance-aware rendering for 60fps on modern devices
 * - Mobile-first responsive design with 44px touch targets
 */

export interface SignalCardProps extends Omit<HTMLMotionProps<'div'>, 'children' | 'onClick' | 'onTap'> {
  signal: Signal;
  onTap?: (signal: Signal) => void;
  onLongPress?: (signal: Signal) => void;
  onSwipe?: (signal: Signal, direction: 'left' | 'right') => void;
  onScoreUpdate?: (signal: Signal, newScore: number) => void;
  variant?: 'compact' | 'detailed' | 'minimal';
  showConvergenceBreakdown?: boolean;
  interactive?: boolean;
  className?: string;
  'data-testid'?: string;
}

interface ScoreZone {
  color: string;
  glow: string;
  background: string;
  border: string;
  variant: 'prominent' | 'elevated' | 'surface';
}

const SignalCard = forwardRef<HTMLDivElement, SignalCardProps>(({
  signal,
  onTap,
  onLongPress,
  onSwipe,
  onScoreUpdate,
  variant = 'detailed',
  showConvergenceBreakdown = true,
  interactive = true,
  className,
  'data-testid': testId,
  ...motionProps
}, ref) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const { config } = useProgressiveEnhancementContext();
  const { config: componentConfig, getGlassClass } = useComponentEnhancement('card');
  const { touch, screenSize, gpu } = useDeviceCapabilities();
  
  // Gesture configuration based on device capabilities
  const gestureConfig = {
    longPressDelay: touch ? 500 : 600,
    swipeThreshold: touch ? 50 : 30,
  };
  
  // Motion values for magnetic effects (desktop only for performance)
  const x = useMotionValue(touch ? 0 : 0);
  const y = useMotionValue(touch ? 0 : 0);
  const scale = useMotionValue(1);
  
  // Transform motion values (only create transforms for non-touch devices)
  const magneticX = useTransform(x, value => touch ? 0 : value * 0.1);
  const magneticY = useTransform(y, value => touch ? 0 : value * 0.1);
  
  // Score zone configuration based on convergence score
  const getScoreZone = (score: number): ScoreZone => {
    if (score >= 70) {
      return {
        color: 'text-status-success',
        glow: 'shadow-status-success/30',
        background: 'bg-status-success/10',
        border: 'border-status-success/30',
        variant: 'prominent'
      };
    } else if (score >= 40) {
      return {
        color: 'text-status-warning',
        glow: 'shadow-status-warning/25',
        background: 'bg-status-warning/10',
        border: 'border-status-warning/30',
        variant: 'elevated'
      };
    } else {
      return {
        color: 'text-status-error',
        glow: 'shadow-status-error/25',
        background: 'bg-status-error/10',
        border: 'border-status-error/30',
        variant: 'surface'
      };
    }
  };

  const scoreZone = getScoreZone(signal.convergence_score);

  // Signal strength to display priority mapping
  const getSignalPriority = (strength: UISignalStrength): number => {
    const priorities: Record<UISignalStrength, number> = { 
      'strong_sell': 0,
      'sell': 1, 
      'hold': 2, 
      'buy': 3, 
      'strong_buy': 4 
    };
    return priorities[strength];
  };

  // Touch and gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!interactive) return;
    
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    setIsPressed(true);
    
    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      onLongPress?.(signal);
      // Haptic feedback on supported devices
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, gestureConfig.longPressDelay) as NodeJS.Timeout;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!interactive || !startPos.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startPos.current.x;
    const deltaY = touch.clientY - startPos.current.y;
    
    // Clear long press if moved too much
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = undefined;
      }
    }
    
    // Detect swipe direction
    if (Math.abs(deltaX) > gestureConfig.swipeThreshold) {
      const direction = deltaX > 0 ? 'right' : 'left';
      setSwipeDirection(direction);
      
      // Animate card based on swipe
      if (componentConfig.animations) {
        x.set(deltaX * 0.3);
        scale.set(0.95);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!interactive) return;
    
    setIsPressed(false);
    
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = undefined;
    }
    
    // Handle swipe completion
    if (swipeDirection) {
      onSwipe?.(signal, swipeDirection);
      setSwipeDirection(null);
    } else if (!isLongPress) {
      // Regular tap
      onTap?.(signal);
    }
    
    setIsLongPress(false);
    
    // Reset animations
    if (componentConfig.animations) {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
      animate(y, 0, { type: "spring", stiffness: 300, damping: 25 });
      animate(scale, 1, { type: "spring", stiffness: 400, damping: 30 });
    }
  };

  // Mouse handlers for desktop
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!interactive || touch || !componentConfig.animations) return;
    
    const card = cardRef.current;
    if (!card) return;
    
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) * 0.1;
    const deltaY = (e.clientY - centerY) * 0.1;
    
    x.set(deltaX);
    y.set(deltaY);
  };

  const handleMouseLeave = () => {
    if (componentConfig.animations) {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
      animate(y, 0, { type: "spring", stiffness: 300, damping: 25 });
    }
  };

  // Score visualization components
  const ConvergenceScore = () => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 sm:gap-0">
      <div className="flex flex-col">
        <span className="text-sm text-text-tertiary font-medium">Convergence Score</span>
        <div className="flex items-baseline gap-2">
          <span className={cn("text-2xl sm:text-3xl font-bold", scoreZone.color)}>
            {signal.convergence_score}
          </span>
          <span className="text-xs text-text-secondary">/ 100</span>
        </div>
      </div>
      
      {/* Circular progress indicator */}
      <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          {/* Background circle */}
          <path
            className="text-text-tertiary/20"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          {/* Progress circle */}
          <path
            className={scoreZone.color}
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${signal.convergence_score}, 100`}
            style={{
              filter: componentConfig.glassmorphism ? `drop-shadow(0 0 8px ${scoreZone.glow.replace('/30', '/60')})` : undefined
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-xs font-bold", scoreZone.color)}>
            {signal.convergence_score}
          </span>
        </div>
      </div>
    </div>
  );

  const LayerBreakdown = () => {
    if (!showConvergenceBreakdown || variant === 'minimal') return null;
    
    const layers = [
      { name: 'Technical', score: signal.technical_score, weight: 40, color: 'text-accent-primary' },
      { name: 'Sentiment', score: signal.sentiment_score, weight: 30, color: 'text-accent-secondary' },
      { name: 'Liquidity', score: signal.liquidity_score, weight: 30, color: 'text-accent-tertiary' }
    ];

    return (
      <div className="space-y-2 sm:space-y-3">
        <span className="text-xs text-text-tertiary font-medium uppercase tracking-wider">
          Layer Breakdown
        </span>
        {layers.map((layer) => (
          <div key={layer.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-2 h-2 rounded-full", layer.color.replace('text-', 'bg-'))} />
              <span className="text-sm text-text-secondary">{layer.name}</span>
              <span className="text-xs text-text-tertiary">({layer.weight}%)</span>
            </div>
            <span className={cn("text-sm font-medium", layer.color)}>
              {layer.score ?? '--'}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const SignalHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3 sm:gap-0">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-base sm:text-lg font-bold text-text-primary">{signal.symbol}</span>
          <span className="text-xs px-2 py-1 rounded-full bg-accent-primary/20 text-accent-primary font-medium uppercase tracking-wider">
            {signal.market}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">
            {signal.signal_strength.replace('_', ' ')}
          </span>
          {/* Priority indicators */}
          <div className="flex gap-1">
            {Array.from({ length: getSignalPriority(signal.signal_strength) }).map((_, i) => (
              <div
                key={i}
                className={cn("w-1 h-3 rounded-full", scoreZone.color.replace('text-', 'bg-'))}
              />
            ))}
          </div>
        </div>
      </div>
      
      {signal.current_price && (
        <div className="text-right">
          <div className="text-base sm:text-lg font-bold text-text-primary">
            ${signal.current_price.toFixed(2)}
          </div>
          {signal.entry_price && (
            <div className="text-xs text-text-tertiary">
              Entry: ${signal.entry_price.toFixed(2)}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Animation configuration
  const animationConfig = {
    style: componentConfig.animations ? {
      x: magneticX,
      y: magneticY,
      scale,
    } : undefined,
    whileHover: interactive && !touch && componentConfig.animations ? {
      scale: 1.02,
      transition: { type: "spring" as const, stiffness: 400, damping: 25 }
    } : undefined,
    whileTap: interactive && componentConfig.animations ? {
      scale: 0.98,
      transition: { type: "spring" as const, stiffness: 600, damping: 30 }
    } : undefined,
  };

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "relative touch-target cursor-pointer",
        swipeDirection && "transform transition-transform duration-300",
        swipeDirection === 'left' && "translate-x-4",
        swipeDirection === 'right' && "-translate-x-4",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-testid={testId}
      role="button"
      aria-label={`Trading signal for ${signal.symbol}: ${signal.signal_strength} signal with ${signal.convergence_score}% convergence score`}
      tabIndex={0}
      {...animationConfig}
      {...motionProps}
    >
      <GlassCard
        ref={ref}
        variant={scoreZone.variant}
        interactive={interactive}
        className={cn(
          "p-4 sm:p-6 border transition-all duration-300",
          // Glass effects based on component configuration
          componentConfig.glassmorphism && getGlassClass(),
          // Scoring zone styling
          scoreZone.border,
          scoreZone.background,
          componentConfig.glassmorphism && gpu === 'high-end' && scoreZone.glow,
          // Performance-aware GPU acceleration
          componentConfig.hardwareAcceleration && 'gpu-accelerated',
          // Interactive states
          isPressed && "scale-95",
          isLongPress && "ring-2 ring-accent-primary/50 ring-offset-2 ring-offset-background-primary"
        )}
      >
        {/* Enhanced glow for high-performance devices */}
        {componentConfig.glassmorphism && gpu === 'high-end' && (
          <div 
            className="absolute inset-0 rounded-xl opacity-20 pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${scoreZone.glow.replace('/30', '/40')} 0%, transparent 70%)`,
              filter: 'blur(20px)',
            }}
          />
        )}

        {/* Main content */}
        <div className="relative z-10">
          <SignalHeader />
          
          {variant !== 'minimal' && <ConvergenceScore />}
          
          {variant === 'detailed' && <LayerBreakdown />}
          
          {/* Metadata footer */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-text-tertiary/20">
            <span className="text-xs text-text-tertiary">
              {signal.created_at ? new Date(signal.created_at).toLocaleDateString() : 'Unknown'}
            </span>
            <span className="text-xs text-text-tertiary">
              Expires: {signal.expires_at ? new Date(signal.expires_at).toLocaleTimeString() : 'Unknown'}
            </span>
          </div>
        </div>

        {/* Touch feedback overlay */}
        {touch && isPressed && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 50%)',
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}

        {/* Swipe indicators */}
        {swipeDirection && componentConfig.glassmorphism && (
          <div className={cn(
            "absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center",
            "bg-accent-primary/80 text-white",
            swipeDirection === 'left' ? 'right-4' : 'left-4'
          )}>
            <span className="text-xs">
              {swipeDirection === 'left' ? '→' : '←'}
            </span>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
});

SignalCard.displayName = 'SignalCard';

export { SignalCard };

// Convenience variants for different use cases
export const CompactSignalCard = (props: Omit<SignalCardProps, 'variant'>) => (
  <SignalCard variant="compact" showConvergenceBreakdown={false} {...props} />
);

export const DetailedSignalCard = (props: Omit<SignalCardProps, 'variant'>) => (
  <SignalCard variant="detailed" showConvergenceBreakdown={true} {...props} />
);

export const MinimalSignalCard = (props: Omit<SignalCardProps, 'variant'>) => (
  <SignalCard variant="minimal" showConvergenceBreakdown={false} {...props} />
);