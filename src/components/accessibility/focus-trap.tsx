/**
 * Focus Trap Component
 * Traps focus within a container for modal dialogs and dropdowns
 * 
 * Features:
 * - Automatic focus trapping with Tab/Shift+Tab
 * - Restoration of focus when deactivated
 * - Support for initial focus element
 * - Escape key handling
 * - Multiple trap support with proper stacking
 */
'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from '@/lib/hooks/use-accessibility';

export interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  restoreFocus?: boolean;
  initialFocus?: React.RefObject<HTMLElement>;
  onEscape?: () => void;
  className?: string;
}

export function FocusTrap({
  children,
  active = true,
  restoreFocus = true,
  initialFocus,
  onEscape,
  className,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { trapFocus, restoreFocus: restorePreviousFocus, getFocusableElements } = useAccessibility();
  const cleanupRef = useRef<(() => void) | null>(null);

  const activateTrap = useCallback(() => {
    if (!containerRef.current || !active) return;

    // Clean up previous trap
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    // Set up new trap
    cleanupRef.current = trapFocus(containerRef.current);

    // Focus initial element if specified
    if (initialFocus?.current) {
      setTimeout(() => {
        initialFocus.current?.focus();
      }, 0);
    } else {
      // Focus first focusable element
      const focusableElements = getFocusableElements(containerRef.current!);
      if (focusableElements.length > 0) {
        setTimeout(() => {
          focusableElements[0].focus();
        }, 0);
      }
    }
  }, [active, initialFocus, trapFocus, getFocusableElements]);

  const deactivateTrap = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if (restoreFocus) {
      restorePreviousFocus();
    }
  }, [restoreFocus, restorePreviousFocus]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && active && onEscape) {
        event.preventDefault();
        event.stopPropagation();
        onEscape();
      }
    };

    if (active) {
      document.addEventListener('keydown', handleKeyDown, true);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [active, onEscape]);

  // Activate/deactivate trap when active state changes
  useEffect(() => {
    if (active) {
      activateTrap();
    } else {
      deactivateTrap();
    }

    return () => {
      deactivateTrap();
    };
  }, [active, activateTrap, deactivateTrap]);

  return (
    <div
      ref={containerRef}
      className={className}
      // Add hidden attribute when not active to help screen readers
      hidden={!active}
    >
      {children}
    </div>
  );
}

// Hook for easier focus trap management
export function useFocusTrap() {
  const [isActive, setIsActive] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activate = useCallback(() => setIsActive(true), []);
  const deactivate = useCallback(() => setIsActive(false), []);
  const toggle = useCallback(() => setIsActive(prev => !prev), []);

  return {
    isActive,
    activate,
    deactivate,
    toggle,
    containerRef,
    FocusTrapComponent: React.forwardRef<HTMLDivElement, Omit<FocusTrapProps, 'active'>>(
      (props, ref) => (
        <div ref={ref}>
          <FocusTrap
            {...props}
            active={isActive}
          />
        </div>
      )
    ),
  };
}