/**
 * Modal/Dialog Component with Progressive Enhancement
 * 
 * Features:
 * - Full screen overlay with progressive glass effects
 * - Focus management and keyboard navigation
 * - Scroll lock and body overflow management
 * - Touch-optimized close gestures
 * - Adaptive animations based on device capabilities
 * - WCAG 2.1 AA compliance
 * - Multiple sizes and variants
 * - Portal rendering for proper z-index stacking
 */
'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgressiveEnhancementContext } from '@/components/providers/progressive-enhancement-provider';
import { useComponentEnhancement } from '@/lib/hooks/use-progressive-enhancement';
import { FocusTrap } from '@/components/accessibility/focus-trap';
import { ScreenReaderOnly } from '@/components/accessibility/screen-reader-only';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'standard' | 'glass' | 'minimal' | 'premium';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  preventBodyScroll?: boolean;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  'data-testid'?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'standard',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  preventBodyScroll = true,
  className,
  overlayClassName,
  contentClassName,
  'data-testid': testId,
}: ModalProps) {
  const { config } = useProgressiveEnhancementContext();
  const { config: componentConfig, getGlassClass } = useComponentEnhancement('modal');
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the modal after a brief delay to ensure it's rendered
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      // Restore focus to the previously focused element
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (!preventBodyScroll) return;

    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    }

    // Cleanup on unmount
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isOpen, preventBodyScroll]);

  // Keyboard event handling
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    if (event.key === 'Escape' && closeOnEscape) {
      event.preventDefault();
      onClose();
    }

    // Focus trapping
    if (event.key === 'Tab') {
      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }
  }, [isOpen, closeOnEscape, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Overlay click handler
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-full max-w-md mx-4';
      case 'md':
        return 'w-full max-w-lg mx-4';
      case 'lg':
        return 'w-full max-w-2xl mx-4';
      case 'xl':
        return 'w-full max-w-4xl mx-4';
      case 'full':
        return 'w-full h-full max-w-none mx-0';
      default:
        return 'w-full max-w-lg mx-4';
    }
  };

  // Variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'glass':
        return cn(
          componentConfig.backdropBlur ? getGlassClass() : 'bg-background-secondary',
          'border border-border-primary/50'
        );
      case 'minimal':
        return 'bg-background-primary border border-border-primary';
      case 'premium':
        return cn(
          componentConfig.backdropBlur ? 'glass-heavy' : 'bg-background-secondary',
          'border border-accent-primary/30 shadow-2xl'
        );
      case 'standard':
      default:
        return 'bg-background-secondary border border-border-primary';
    }
  };

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const contentVariants = componentConfig.springAnimations ? {
    hidden: { 
      opacity: 0, 
      scale: 0.75, 
      y: -50 
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.75, 
      y: -50,
      transition: {
        duration: 0.2
      }
    }
  } : {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  // Don't render if closed
  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4",
            size === 'full' && "p-0"
          )}
          data-testid={testId}
        >
          {/* Overlay */}
          <motion.div
            className={cn(
              "absolute inset-0",
              componentConfig.backdropBlur && config.glassmorphism !== 'disabled' 
                ? "backdrop-blur-md bg-black/20" 
                : "bg-black/50",
              overlayClassName
            )}
            variants={componentConfig.animations ? overlayVariants : undefined}
            initial={componentConfig.animations ? "hidden" : undefined}
            animate={componentConfig.animations ? "visible" : undefined}
            exit={componentConfig.animations ? "hidden" : undefined}
            onClick={handleOverlayClick}
          />

          {/* Modal Content */}
          <FocusTrap active={isOpen} onEscape={closeOnEscape ? onClose : undefined}>
            <motion.div
              ref={modalRef}
              className={cn(
                "relative z-10 flex flex-col",
                getSizeClasses(),
                size === 'full' ? "h-full" : "max-h-[90vh]",
                getVariantClasses(),
                "rounded-xl overflow-hidden",
                componentConfig.hardwareAcceleration && "gpu-accelerated",
                className
              )}
              variants={componentConfig.animations ? contentVariants : undefined}
              initial={componentConfig.animations ? "hidden" : undefined}
              animate={componentConfig.animations ? "visible" : undefined}
              exit={componentConfig.animations ? "exit" : undefined}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? "modal-title" : undefined}
              aria-describedby="modal-description"
            >
              <ScreenReaderOnly id="modal-description">
                {title ? `${title} dialog` : 'Dialog window'}. Press Escape to close.
              </ScreenReaderOnly>
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 border-b border-border-primary/20">
                {title && (
                  <h2 
                    id="modal-title" 
                    className="text-xl font-semibold text-text-primary"
                  >
                    {title}
                  </h2>
                )}
                
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg",
                      "text-text-secondary hover:text-text-primary",
                      "hover:bg-background-tertiary transition-colors",
                      "focus:outline-none focus:ring-2 focus:ring-accent-primary/50",
                      "touch-target"
                    )}
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div 
              className={cn(
                "flex-1 overflow-y-auto",
                title || showCloseButton ? "p-6" : "p-6",
                contentClassName
              )}
            >
              {children}
            </div>
          </motion.div>
          </FocusTrap>
        </div>
      )}
    </AnimatePresence>
  );

  // Use portal to render modal at body level
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}

// Convenience hook for modal state management
export function useModal(defaultOpen = false) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  const toggleModal = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
}

// Convenience components for common modal types
export const ConfirmModal: React.FC<
  Omit<ModalProps, 'children'> & {
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }
> = ({
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onClose,
  variant = 'info',
  ...props
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getVariantColors = () => {
    switch (variant) {
      case 'danger':
        return {
          confirmClass: 'bg-status-error hover:bg-status-error/90 text-white',
          icon: '⚠️'
        };
      case 'warning':
        return {
          confirmClass: 'bg-status-warning hover:bg-status-warning/90 text-black',
          icon: '⚠️'
        };
      case 'info':
      default:
        return {
          confirmClass: 'bg-accent-primary hover:bg-accent-primary/90 text-white',
          icon: 'ℹ️'
        };
    }
  };

  const { confirmClass, icon } = getVariantColors();

  return (
    <Modal size="sm" onClose={onClose} {...props}>
      <div className="text-center space-y-4">
        <div className="text-4xl">{icon}</div>
        <p className="text-text-primary">{message}</p>
        
        <div className="flex gap-3 justify-center pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded-lg transition-colors touch-target"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={cn(
              "px-4 py-2 rounded-lg transition-colors touch-target",
              confirmClass
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const AlertModal: React.FC<
  Omit<ModalProps, 'children'> & {
    message: string;
    buttonText?: string;
    variant?: 'success' | 'error' | 'warning' | 'info';
  }
> = ({
  message,
  buttonText = 'OK',
  variant = 'info',
  onClose,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return { icon: '✅', color: 'text-status-success' };
      case 'error':
        return { icon: '❌', color: 'text-status-error' };
      case 'warning':
        return { icon: '⚠️', color: 'text-status-warning' };
      case 'info':
      default:
        return { icon: 'ℹ️', color: 'text-status-info' };
    }
  };

  const { icon, color } = getVariantStyles();

  return (
    <Modal size="sm" onClose={onClose} {...props}>
      <div className="text-center space-y-4">
        <div className="text-4xl">{icon}</div>
        <p className={cn("text-lg", color)}>{message}</p>
        
        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg transition-colors touch-target"
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  );
};