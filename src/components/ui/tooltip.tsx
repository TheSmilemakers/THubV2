/**
 * Tooltip Component with Progressive Enhancement & Touch Alternatives
 * 
 * Features:
 * - Adaptive behavior for touch vs mouse devices
 * - Touch devices: Shows on tap with dismiss button
 * - Desktop: Shows on hover with delay
 * - Progressive glass effects based on device capability  
 * - Smart positioning with viewport boundary detection
 * - Keyboard accessible with escape key support
 * - WCAG 2.1 AA compliance
 * - Portal rendering for proper z-index stacking
 * - Delay and timing customization
 */
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgressiveEnhancementContext } from '@/components/providers/progressive-enhancement-provider';
import { useComponentEnhancement } from '@/lib/hooks/use-progressive-enhancement';

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
  delay?: number;
  hideDelay?: number;
  disabled?: boolean;
  variant?: 'default' | 'info' | 'warning' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  className?: string;
  contentClassName?: string;
  'data-testid'?: string;
}

export function Tooltip({
  children,
  content,
  placement = 'top',
  delay = 500,
  hideDelay = 0,
  disabled = false,
  variant = 'default',
  size = 'md',
  interactive = false,
  className,
  contentClassName,
  'data-testid': testId,
}: TooltipProps) {
  const { config } = useProgressiveEnhancementContext();
  const { config: componentConfig, getGlassClass } = useComponentEnhancement('modal');
  
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [actualPlacement, setActualPlacement] = useState(placement);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const hideTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Calculate position
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !content) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Estimated tooltip dimensions based on size
    const tooltipWidth = size === 'sm' ? 200 : size === 'md' ? 300 : 400;
    const tooltipHeight = 80; // Approximate height
    
    let top = 0;
    let left = 0;
    let finalPlacement = placement;

    // Calculate initial position based on placement
    switch (placement) {
      case 'top':
      case 'top-start':
      case 'top-end':
        top = triggerRect.top - tooltipHeight - 8;
        if (placement === 'top-start') {
          left = triggerRect.left;
        } else if (placement === 'top-end') {
          left = triggerRect.right - tooltipWidth;
        } else {
          left = triggerRect.left + (triggerRect.width - tooltipWidth) / 2;
        }
        break;
      
      case 'bottom':
      case 'bottom-start':
      case 'bottom-end':
        top = triggerRect.bottom + 8;
        if (placement === 'bottom-start') {
          left = triggerRect.left;
        } else if (placement === 'bottom-end') {
          left = triggerRect.right - tooltipWidth;
        } else {
          left = triggerRect.left + (triggerRect.width - tooltipWidth) / 2;
        }
        break;
      
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipHeight) / 2;
        left = triggerRect.left - tooltipWidth - 8;
        break;
      
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipHeight) / 2;
        left = triggerRect.right + 8;
        break;
    }

    // Viewport boundary checks and auto-repositioning
    if (top < 8) {
      // Not enough space above, try below
      if (placement.includes('top')) {
        top = triggerRect.bottom + 8;
        finalPlacement = placement.replace('top', 'bottom') as typeof placement;
      } else {
        top = 8;
      }
    }
    
    if (top + tooltipHeight > viewportHeight - 8) {
      // Not enough space below, try above
      if (placement.includes('bottom')) {
        top = triggerRect.top - tooltipHeight - 8;
        finalPlacement = placement.replace('bottom', 'top') as typeof placement;
      } else {
        top = viewportHeight - tooltipHeight - 8;
      }
    }
    
    if (left < 8) {
      left = 8;
    }
    
    if (left + tooltipWidth > viewportWidth - 8) {
      left = viewportWidth - tooltipWidth - 8;
    }

    setPosition({ top, left });
    setActualPlacement(finalPlacement);
  }, [placement, size, content]);

  // Show/hide handlers
  const showTooltip = useCallback(() => {
    if (disabled || !content) return;
    
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = undefined;
    }
    
    if (!isVisible) {
      showTimeoutRef.current = setTimeout(() => {
        calculatePosition();
        setIsVisible(true);
      }, isTouchDevice ? 0 : delay);
    }
  }, [disabled, content, isVisible, calculatePosition, isTouchDevice, delay]);

  const hideTooltip = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = undefined;
    }
    
    if (isVisible) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, hideDelay);
    }
  }, [isVisible, hideDelay]);

  // Touch device handlers
  const handleTouchInteraction = () => {
    if (isTouchDevice) {
      if (isVisible) {
        hideTooltip();
      } else {
        showTooltip();
      }
    }
  };

  // Mouse handlers for desktop
  const handleMouseEnter = () => {
    if (!isTouchDevice) {
      showTooltip();
    }
  };

  const handleMouseLeave = () => {
    if (!isTouchDevice && !interactive) {
      hideTooltip();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        hideTooltip();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, hideTooltip]);

  // Outside click handler for touch devices
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        isTouchDevice &&
        isVisible &&
        !triggerRef.current?.contains(event.target as Node) &&
        !contentRef.current?.contains(event.target as Node)
      ) {
        hideTooltip();
      }
    };

    if (isVisible && isTouchDevice) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isVisible, isTouchDevice, hideTooltip]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'info':
        return {
          background: componentConfig.glassmorphism ? getGlassClass() : 'bg-status-info',
          border: 'border-status-info/30',
          text: 'text-white',
          icon: <Info className="w-4 h-4" />
        };
      case 'warning':
        return {
          background: componentConfig.glassmorphism ? getGlassClass() : 'bg-status-warning',
          border: 'border-status-warning/30',
          text: 'text-black',
          icon: null
        };
      case 'error':
        return {
          background: componentConfig.glassmorphism ? getGlassClass() : 'bg-status-error',
          border: 'border-status-error/30',
          text: 'text-white',
          icon: null
        };
      case 'success':
        return {
          background: componentConfig.glassmorphism ? getGlassClass() : 'bg-status-success',
          border: 'border-status-success/30',
          text: 'text-white',
          icon: null
        };
      case 'default':
      default:
        return {
          background: componentConfig.glassmorphism ? getGlassClass() : 'bg-background-secondary',
          border: 'border-border-primary',
          text: 'text-text-primary',
          icon: null
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Animation variants
  const tooltipVariants = componentConfig.springAnimations ? {
    hidden: { 
      opacity: 0, 
      scale: 0.8, 
      y: actualPlacement.includes('top') ? 10 : actualPlacement.includes('bottom') ? -10 : 0,
      x: actualPlacement.includes('left') ? 10 : actualPlacement.includes('right') ? -10 : 0
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      x: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: { duration: 0.15 }
    }
  } : {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  };

  const tooltip = isVisible && content ? (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50"
        style={{ pointerEvents: 'none' }}
      >
        <motion.div
          ref={contentRef}
          className={cn(
            "absolute px-3 py-2 rounded-lg border shadow-lg",
            "focus:outline-none",
            size === 'sm' && "max-w-48 text-xs",
            size === 'md' && "max-w-72 text-sm",
            size === 'lg' && "max-w-96 text-base",
            variantStyles.background,
            variantStyles.border,
            variantStyles.text,
            componentConfig.hardwareAcceleration && "gpu-accelerated",
            contentClassName
          )}
          style={{
            top: position.top,
            left: position.left,
            pointerEvents: interactive || isTouchDevice ? 'auto' : 'none'
          }}
          variants={componentConfig.animations ? tooltipVariants as any : undefined}
          initial={componentConfig.animations ? "hidden" : undefined}
          animate={componentConfig.animations ? "visible" : undefined}
          exit={componentConfig.animations ? "exit" : undefined}
          onMouseEnter={interactive && !isTouchDevice ? showTooltip : undefined}
          onMouseLeave={interactive && !isTouchDevice ? hideTooltip : undefined}
          data-testid={`${testId}-content`}
        >
          <div className="flex items-start gap-2">
            {variantStyles.icon && (
              <span className="flex-shrink-0 mt-0.5">
                {variantStyles.icon}
              </span>
            )}
            
            <div className="flex-1 min-w-0">
              {content}
            </div>
            
            {/* Close button for touch devices */}
            {isTouchDevice && (
              <button
                onClick={hideTooltip}
                className={cn(
                  "flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-white/50",
                  "touch-target-sm"
                )}
                aria-label="Close tooltip"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Arrow pointer */}
          <div
            className={cn(
              "absolute w-2 h-2 rotate-45",
              variantStyles.background.includes('glass') ? getGlassClass() : variantStyles.background.replace('bg-', 'bg-'),
              variantStyles.border,
              // Position arrow based on placement
              actualPlacement.includes('top') && "bottom-[-5px] left-1/2 -translate-x-1/2",
              actualPlacement.includes('bottom') && "top-[-5px] left-1/2 -translate-x-1/2",
              actualPlacement.includes('left') && "right-[-5px] top-1/2 -translate-y-1/2",
              actualPlacement.includes('right') && "left-[-5px] top-1/2 -translate-y-1/2"
            )}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        className={cn("inline-block", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleTouchInteraction}
        data-testid={testId}
      >
        {children}
      </div>

      {typeof document !== 'undefined' && tooltip && 
        createPortal(tooltip, document.body)
      }
    </>
  );
}

// Convenience components for common tooltip types
export const InfoTooltip: React.FC<Omit<TooltipProps, 'variant'>> = (props) => (
  <Tooltip variant="info" {...props} />
);

export const WarningTooltip: React.FC<Omit<TooltipProps, 'variant'>> = (props) => (
  <Tooltip variant="warning" {...props} />
);

export const ErrorTooltip: React.FC<Omit<TooltipProps, 'variant'>> = (props) => (
  <Tooltip variant="error" {...props} />
);

export const SuccessTooltip: React.FC<Omit<TooltipProps, 'variant'>> = (props) => (
  <Tooltip variant="success" {...props} />
);

// HOC for adding tooltip to any component
export function withTooltip<T extends object>(
  Component: React.ComponentType<T>,
  tooltipProps: Omit<TooltipProps, 'children'>
) {
  return function TooltipWrapper(props: T) {
    return (
      <Tooltip {...tooltipProps}>
        <Component {...props} />
      </Tooltip>
    );
  };
}