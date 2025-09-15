/**
 * Progress Indicators with Adaptive Animations
 * 
 * Features:
 * - Linear and circular progress bars
 * - Indeterminate/loading states
 * - Adaptive animations based on device performance
 * - Step-based progress with custom icons
 * - Color-coded states (success, warning, error)
 * - Progressive enhancement for glass effects
 * - Touch-optimized sizing
 * - WCAG 2.1 AA accessibility
 * - Real-time value updates with smooth transitions
 */
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Clock, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgressiveEnhancementContext } from '@/components/providers/progressive-enhancement-provider';
import { useComponentEnhancement } from '@/lib/hooks/use-progressive-enhancement';
import { useDeviceCapabilities } from '@/lib/hooks/use-device-capabilities';

export interface ProgressProps {
  value?: number;
  max?: number;
  indeterminate?: boolean;
  variant?: 'linear' | 'circular' | 'stepped';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  showValue?: boolean;
  showPercentage?: boolean;
  label?: string;
  className?: string;
  'data-testid'?: string;
}

export function Progress({
  value = 0,
  max = 100,
  indeterminate = false,
  variant = 'linear',
  size = 'md',
  color = 'primary',
  showValue = false,
  showPercentage = false,
  label,
  className,
  'data-testid': testId,
}: ProgressProps) {
  const { config: globalConfig } = useProgressiveEnhancementContext();
  const { config: componentConfig, getGlassClass } = useComponentEnhancement('card');
  const { gpu } = useDeviceCapabilities();
  
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // Animate value changes
  useEffect(() => {
    if (!indeterminate && componentConfig.animations) {
      const startValue = animatedValue;
      const endValue = percentage;
      const duration = Math.abs(endValue - startValue) * 20; // 20ms per percentage point
      
      let startTime: number;
      
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic animation
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (endValue - startValue) * easedProgress;
        
        setAnimatedValue(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    } else {
      setAnimatedValue(percentage);
    }
  }, [percentage, indeterminate, componentConfig.animations, animatedValue]);

  // Get color classes
  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return {
          bg: 'bg-status-success',
          text: 'text-status-success',
          border: 'border-status-success'
        };
      case 'warning':
        return {
          bg: 'bg-status-warning',
          text: 'text-status-warning',
          border: 'border-status-warning'
        };
      case 'error':
        return {
          bg: 'bg-status-error',
          text: 'text-status-error',
          border: 'border-status-error'
        };
      case 'info':
        return {
          bg: 'bg-status-info',
          text: 'text-status-info',
          border: 'border-status-info'
        };
      case 'primary':
      default:
        return {
          bg: 'bg-accent-primary',
          text: 'text-accent-primary',
          border: 'border-accent-primary'
        };
    }
  };

  const colorClasses = getColorClasses();

  // Linear Progress Bar
  if (variant === 'linear') {
    const height = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
      xl: 'h-4'
    }[size];

    return (
      <div className={cn("w-full space-y-2", className)} data-testid={testId}>
        {(label || showValue || showPercentage) && (
          <div className="flex items-center justify-between text-sm">
            {label && (
              <span className="text-text-secondary font-medium">{label}</span>
            )}
            {(showValue || showPercentage) && (
              <span className={cn("font-mono", colorClasses.text)}>
                {showValue && `${Math.round(value)}${max !== 100 ? `/${max}` : ''}`}
                {showValue && showPercentage && ' '}
                {showPercentage && `${Math.round(percentage)}%`}
              </span>
            )}
          </div>
        )}
        
        <div
          className={cn(
            "relative w-full rounded-full overflow-hidden",
            height,
            componentConfig.glassmorphism ? getGlassClass() : "bg-background-tertiary",
            componentConfig.hardwareAcceleration && "gpu-accelerated"
          )}
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
        >
          {indeterminate ? (
            <motion.div
              className={cn(
                "absolute top-0 left-0 h-full rounded-full",
                colorClasses.bg,
                size === 'sm' ? 'w-1/4' : 'w-1/3'
              )}
              animate={{
                x: ['-100%', '400%'],
              }}
              transition={{
                duration: componentConfig.animations ? 1.5 : 0,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ) : (
            <motion.div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                colorClasses.bg
              )}
              style={{
                width: `${animatedValue}%`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${animatedValue}%` }}
              transition={{
                duration: componentConfig.animations ? 0.5 : 0,
                ease: "easeOut"
              }}
            />
          )}
          
          {/* Shimmer effect for high-performance devices */}
          {componentConfig.animations && gpu === 'high-end' && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // Circular Progress
  if (variant === 'circular') {
    const sizes = {
      sm: { size: 'w-8 h-8', stroke: 2, radius: 14 },
      md: { size: 'w-12 h-12', stroke: 2.5, radius: 18 },
      lg: { size: 'w-16 h-16', stroke: 3, radius: 24 },
      xl: { size: 'w-20 h-20', stroke: 4, radius: 30 }
    };
    
    const sizeConfig = sizes[size];
    const circumference = 2 * Math.PI * sizeConfig.radius;
    const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

    return (
      <div className={cn("relative inline-flex items-center justify-center", className)} data-testid={testId}>
        <svg
          className={cn(sizeConfig.size, componentConfig.hardwareAcceleration && "gpu-accelerated")}
          viewBox={`0 0 ${sizeConfig.radius * 2 + sizeConfig.stroke * 2} ${sizeConfig.radius * 2 + sizeConfig.stroke * 2}`}
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
        >
          {/* Background circle */}
          <circle
            cx={sizeConfig.radius + sizeConfig.stroke}
            cy={sizeConfig.radius + sizeConfig.stroke}
            r={sizeConfig.radius}
            stroke="currentColor"
            strokeWidth={sizeConfig.stroke}
            fill="none"
            className="text-background-tertiary"
          />
          
          {/* Progress circle */}
          {indeterminate ? (
            <motion.circle
              cx={sizeConfig.radius + sizeConfig.stroke}
              cy={sizeConfig.radius + sizeConfig.stroke}
              r={sizeConfig.radius}
              stroke="currentColor"
              strokeWidth={sizeConfig.stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${circumference * 0.25} ${circumference * 0.75}`}
              className={colorClasses.text}
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: componentConfig.animations ? 2 : 0,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                transformOrigin: 'center'
              }}
            />
          ) : (
            <motion.circle
              cx={sizeConfig.radius + sizeConfig.stroke}
              cy={sizeConfig.radius + sizeConfig.stroke}
              r={sizeConfig.radius}
              stroke="currentColor"
              strokeWidth={sizeConfig.stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={colorClasses.text}
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center'
              }}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{
                duration: componentConfig.animations ? 0.5 : 0,
                ease: "easeOut"
              }}
            />
          )}
        </svg>
        
        {/* Center content */}
        {!indeterminate && (showValue || showPercentage) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              "font-mono font-bold",
              colorClasses.text,
              size === 'sm' && "text-xs",
              size === 'md' && "text-sm",
              size === 'lg' && "text-base",
              size === 'xl' && "text-lg"
            )}>
              {showPercentage ? `${Math.round(percentage)}%` : Math.round(value)}
            </span>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// Stepped Progress Component
export interface StepProgressProps {
  steps: Array<{
    id: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    status: 'pending' | 'current' | 'completed' | 'error';
  }>;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'data-testid'?: string;
}

export function StepProgress({
  steps,
  orientation = 'horizontal',
  size = 'md',
  className,
  'data-testid': testId,
}: StepProgressProps) {
  const { config: componentConfig } = useComponentEnhancement('card');

  const getStatusIcon = (step: StepProgressProps['steps'][0]) => {
    if (step.icon) return step.icon;
    
    switch (step.status) {
      case 'completed':
        return <Check className="w-4 h-4" />;
      case 'error':
        return <X className="w-4 h-4" />;
      case 'current':
        return <Zap className="w-4 h-4" />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          circle: 'bg-status-success border-status-success text-white',
          text: 'text-status-success',
          line: 'bg-status-success'
        };
      case 'error':
        return {
          circle: 'bg-status-error border-status-error text-white',
          text: 'text-status-error',
          line: 'bg-text-muted'
        };
      case 'current':
        return {
          circle: 'bg-accent-primary border-accent-primary text-white ring-4 ring-accent-primary/20',
          text: 'text-accent-primary',
          line: 'bg-text-muted'
        };
      case 'pending':
      default:
        return {
          circle: 'bg-background-secondary border-text-muted text-text-muted',
          text: 'text-text-muted',
          line: 'bg-text-muted'
        };
    }
  };

  const circleSize = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }[size];

  if (orientation === 'vertical') {
    return (
      <div className={cn("space-y-0", className)} data-testid={testId}>
        {steps.map((step, index) => {
          const statusClasses = getStatusClasses(step.status);
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
              {/* Connecting line */}
              {!isLast && (
                <div className="absolute top-10 left-5 w-0.5 h-full -ml-px">
                  <div className={cn("w-full h-8", statusClasses.line)} />
                </div>
              )}
              
              {/* Step circle */}
              <motion.div
                className={cn(
                  "relative flex items-center justify-center rounded-full border-2 transition-all duration-200",
                  circleSize,
                  statusClasses.circle,
                  componentConfig.hardwareAcceleration && "gpu-accelerated"
                )}
                initial={componentConfig.animations ? { scale: 0.8, opacity: 0 } : false}
                animate={componentConfig.animations ? { scale: 1, opacity: 1 } : false}
                transition={{ delay: index * 0.1 }}
              >
                {getStatusIcon(step)}
              </motion.div>
              
              {/* Step content */}
              <div className="flex-1 min-w-0 pt-1">
                <h4 className={cn("font-medium", statusClasses.text)}>
                  {step.label}
                </h4>
                {step.description && (
                  <p className="text-sm text-text-secondary mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal layout
  return (
    <div className={cn("flex items-center", className)} data-testid={testId}>
      {steps.map((step, index) => {
        const statusClasses = getStatusClasses(step.status);
        const isLast = index === steps.length - 1;
        
        return (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step circle */}
            <motion.div
              className={cn(
                "relative flex items-center justify-center rounded-full border-2 transition-all duration-200",
                circleSize,
                statusClasses.circle,
                componentConfig.hardwareAcceleration && "gpu-accelerated"
              )}
              initial={componentConfig.animations ? { scale: 0.8, opacity: 0 } : false}
              animate={componentConfig.animations ? { scale: 1, opacity: 1 } : false}
              transition={{ delay: index * 0.1 }}
            >
              {getStatusIcon(step)}
            </motion.div>
            
            {/* Step label */}
            <div className="ml-3 min-w-0 flex-1">
              <p className={cn("text-sm font-medium", statusClasses.text)}>
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-text-secondary">
                  {step.description}
                </p>
              )}
            </div>
            
            {/* Connecting line */}
            {!isLast && (
              <div className="flex-1 mx-4">
                <div className={cn("h-0.5 w-full", statusClasses.line)} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Loading Spinner Component
export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
  'data-testid'?: string;
}

export function Spinner({
  size = 'md',
  color = 'primary',
  className,
  'data-testid': testId,
}: SpinnerProps) {
  const { config: componentConfig } = useComponentEnhancement('card');

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-accent-primary',
    success: 'text-status-success',
    warning: 'text-status-warning',
    error: 'text-status-error',
    info: 'text-status-info'
  };

  return (
    <motion.div
      className={cn(
        "inline-block border-2 border-current border-t-transparent rounded-full",
        sizeClasses[size],
        colorClasses[color],
        componentConfig.hardwareAcceleration && "gpu-accelerated",
        className
      )}
      animate={{
        rotate: componentConfig.animations ? [0, 360] : 0,
      }}
      transition={{
        duration: componentConfig.animations ? 1 : 0,
        repeat: Infinity,
        ease: "linear"
      }}
      data-testid={testId}
    />
  );
}