/**
 * Toast/Notification System with Progressive Enhancement
 * 
 * Features:
 * - Multiple toast types (success, error, warning, info)
 * - Auto-dismiss with configurable timeout
 * - Swipe-to-dismiss gesture support
 * - Progressive glass effects based on device capability
 * - Queue management for multiple toasts
 * - Touch-optimized interactions
 * - ARIA live regions for accessibility
 * - Position variants (top/bottom, left/center/right)
 * - Action buttons support
 */
'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Check, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgressiveEnhancementContext } from '@/components/providers/progressive-enhancement-provider';
import { useComponentEnhancement } from '@/lib/hooks/use-progressive-enhancement';

export interface ToastProps {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  dismissible?: boolean;
  actions?: ToastAction[];
  position?: ToastPosition;
  onDismiss?: (id: string) => void;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export type ToastPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface ToastContextValue {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Individual Toast Component
function Toast({ 
  id, 
  title, 
  message, 
  type = 'info', 
  dismissible = true, 
  actions = [],
  onDismiss 
}: ToastProps) {
  const { config } = useProgressiveEnhancementContext();
  const { config: componentConfig, getGlassClass } = useComponentEnhancement('card');
  const [isDragging, setIsDragging] = useState(false);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check className="w-5 h-5 text-status-success" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-status-error" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-status-warning" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-status-info" />;
    }
  };

  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'border-status-success/30 bg-status-success/10';
      case 'error':
        return 'border-status-error/30 bg-status-error/10';
      case 'warning':
        return 'border-status-warning/30 bg-status-warning/10';
      case 'info':
      default:
        return 'border-status-info/30 bg-status-info/10';
    }
  };

  const handleDismiss = () => {
    onDismiss?.(id);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    // If dragged more than 100px horizontally, dismiss the toast
    if (Math.abs(info.offset.x) > 100) {
      handleDismiss();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.3 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: {
          type: componentConfig.springAnimations ? "spring" : "tween",
          damping: 25,
          stiffness: 300
        }
      }}
      exit={{ 
        opacity: 0, 
        x: 0,
        scale: 0.75,
        transition: { duration: 0.2 }
      }}
      drag={componentConfig.animations && dismissible ? "x" : false}
      dragConstraints={{ left: -200, right: 200 }}
      dragElastic={0.7}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      className={cn(
        "relative w-full max-w-sm p-4 rounded-xl border shadow-lg",
        "transition-all duration-200",
        componentConfig.glassmorphism ? getGlassClass() : "bg-background-secondary",
        getTypeClasses(),
        componentConfig.hardwareAcceleration && "gpu-accelerated",
        isDragging && "cursor-grabbing scale-105"
      )}
      style={{
        touchAction: componentConfig.animations && dismissible ? "pan-x" : "auto"
      }}
    >
      {/* Progress bar for auto-dismiss */}
      {dismissible && (
        <motion.div
          className="absolute top-0 left-0 h-1 bg-accent-primary rounded-t-xl"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 5, ease: "linear" }}
        />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-medium text-text-primary mb-1">
              {title}
            </h4>
          )}
          <p className="text-sm text-text-secondary">
            {message}
          </p>

          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors touch-target-sm",
                    action.variant === 'primary'
                      ? "bg-accent-primary hover:bg-accent-primary/90 text-white"
                      : "bg-background-tertiary hover:bg-background-tertiary/80 text-text-primary"
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Close button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={cn(
              "flex-shrink-0 p-1 text-text-tertiary hover:text-text-primary",
              "hover:bg-background-tertiary rounded-lg transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-accent-primary/50",
              "touch-target-sm"
            )}
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Drag indicator */}
      {componentConfig.animations && dismissible && isDragging && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-accent-primary to-transparent opacity-50" />
      )}
    </motion.div>
  );
}

// Toast Container Component
function ToastContainer({ 
  toasts, 
  position = 'top-right',
  onDismiss 
}: {
  toasts: ToastProps[];
  position: ToastPosition;
  onDismiss: (id: string) => void;
}) {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-2 pointer-events-none",
        getPositionClasses()
      )}
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

// Toast Provider Component
export function ToastProvider({ 
  children,
  position = 'top-right',
  maxToasts = 5
}: {
  children: React.ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      ...toast,
      id,
      position,
      duration: toast.duration ?? 5000,
    };

    setToasts(prev => {
      const updated = [newToast, ...prev].slice(0, maxToasts);
      return updated;
    });

    // Auto-dismiss after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, [position, maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer 
        toasts={toasts} 
        position={position} 
        onDismiss={removeToast} 
      />
    </ToastContext.Provider>
  );
}

// Convenience hooks for different toast types
export function useToastHelpers() {
  const { addToast } = useToast();

  const showSuccess = useCallback((message: string, title?: string, options?: Partial<ToastProps>) => {
    return addToast({
      type: 'success',
      title,
      message,
      ...options,
    });
  }, [addToast]);

  const showError = useCallback((message: string, title?: string, options?: Partial<ToastProps>) => {
    return addToast({
      type: 'error',
      title,
      message,
      duration: 7000, // Longer duration for errors
      ...options,
    });
  }, [addToast]);

  const showWarning = useCallback((message: string, title?: string, options?: Partial<ToastProps>) => {
    return addToast({
      type: 'warning',
      title,
      message,
      ...options,
    });
  }, [addToast]);

  const showInfo = useCallback((message: string, title?: string, options?: Partial<ToastProps>) => {
    return addToast({
      type: 'info',
      title,
      message,
      ...options,
    });
  }, [addToast]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}