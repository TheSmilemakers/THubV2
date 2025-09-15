/**
 * Dropdown/Menu Component with Progressive Enhancement
 * 
 * Features:
 * - Touch-optimized dropdown menu with keyboard navigation
 * - Progressive glass effects based on device capability
 * - Adaptive positioning (top/bottom/left/right)
 * - Nested submenu support
 * - Icon and action support
 * - WCAG 2.1 AA accessibility
 * - Portal rendering for proper z-index stacking
 * - Touch-friendly large targets on mobile
 */
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgressiveEnhancementContext } from '@/components/providers/progressive-enhancement-provider';
import { useComponentEnhancement } from '@/lib/hooks/use-progressive-enhancement';
import { KeyboardNavigation } from '@/components/accessibility/keyboard-navigation';
import { FocusTrap } from '@/components/accessibility/focus-trap';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  checked?: boolean;
  children?: DropdownItem[];
  onClick?: () => void;
  separator?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'left' | 'right';
  closeOnSelect?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  onOpenChange?: (open: boolean) => void;
  'data-testid'?: string;
}

export function Dropdown({
  trigger,
  items,
  placement = 'bottom-start',
  closeOnSelect = true,
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
  onOpenChange,
  'data-testid': testId,
}: DropdownProps) {
  const { config } = useProgressiveEnhancementContext();
  const { config: componentConfig, getGlassClass } = useComponentEnhancement('card');
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Calculate position
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Estimated dropdown dimensions
    const dropdownWidth = 200;
    const dropdownHeight = Math.min(items.length * 40 + 16, 300);
    
    let top = 0;
    let left = 0;

    switch (placement) {
      case 'bottom-start':
        top = triggerRect.bottom + 4;
        left = triggerRect.left;
        break;
      case 'bottom-end':
        top = triggerRect.bottom + 4;
        left = triggerRect.right - dropdownWidth;
        break;
      case 'top-start':
        top = triggerRect.top - dropdownHeight - 4;
        left = triggerRect.left;
        break;
      case 'top-end':
        top = triggerRect.top - dropdownHeight - 4;
        left = triggerRect.right - dropdownWidth;
        break;
      case 'left':
        top = triggerRect.top;
        left = triggerRect.left - dropdownWidth - 4;
        break;
      case 'right':
        top = triggerRect.top;
        left = triggerRect.right + 4;
        break;
    }

    // Viewport boundary checks
    if (left + dropdownWidth > viewportWidth) {
      left = viewportWidth - dropdownWidth - 8;
    }
    if (left < 8) {
      left = 8;
    }
    if (top + dropdownHeight > viewportHeight) {
      top = triggerRect.top - dropdownHeight - 4;
    }
    if (top < 8) {
      top = 8;
    }

    setPosition({ top, left });
  }, [placement, items.length]);

  // Open/close handlers
  const handleToggle = () => {
    if (disabled) return;
    
    const newOpen = !isOpen;
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
    
    if (newOpen) {
      calculatePosition();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setActiveItem(null);
    setSubmenuOpen(null);
    onOpenChange?.(false);
  };

  // Outside click handler
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as Node;
      if (
        isOpen &&
        !triggerRef.current?.contains(target) &&
        !contentRef.current?.contains(target)
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          handleClose();
          triggerRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          navigateItems('down');
          break;
        case 'ArrowUp':
          event.preventDefault();
          navigateItems('up');
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (activeItem) {
            const item = findItemById(activeItem);
            if (item?.children) {
              setSubmenuOpen(activeItem);
            }
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (submenuOpen) {
            setSubmenuOpen(null);
          }
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (activeItem) {
            handleItemClick(findItemById(activeItem));
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, activeItem, submenuOpen]);

  // Item navigation helpers
  const findItemById = (id: string): DropdownItem | undefined => {
    const findInItems = (items: DropdownItem[]): DropdownItem | undefined => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findInItems(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findInItems(items);
  };

  const navigateItems = (direction: 'up' | 'down') => {
    const flatItems = items.filter(item => !item.separator && !item.disabled);
    const currentIndex = activeItem ? flatItems.findIndex(item => item.id === activeItem) : -1;
    
    let nextIndex: number;
    if (direction === 'down') {
      nextIndex = currentIndex < flatItems.length - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : flatItems.length - 1;
    }
    
    setActiveItem(flatItems[nextIndex]?.id || null);
  };

  // Item click handler
  const handleItemClick = (item: DropdownItem | undefined) => {
    if (!item || item.disabled || item.separator) return;

    if (item.children) {
      setSubmenuOpen(submenuOpen === item.id ? null : item.id);
      return;
    }

    item.onClick?.();
    
    if (closeOnSelect) {
      handleClose();
    }
  };

  // Animation variants
  const contentVariants = componentConfig.springAnimations ? {
    hidden: { 
      opacity: 0, 
      scale: 0.95, 
      y: placement.includes('top') ? 10 : -10 
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: placement.includes('top') ? 10 : -10,
      transition: { duration: 0.15 }
    }
  } : {
    hidden: { opacity: 0, y: -8 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 }
  };

  const content = isOpen ? (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50"
        style={{ pointerEvents: 'none' }}
      >
        <motion.div
          ref={contentRef}
          className={cn(
            "absolute min-w-48 py-2 rounded-xl border shadow-lg",
            "focus:outline-none",
            componentConfig.glassmorphism ? getGlassClass() : "bg-background-secondary",
            "border-border-primary",
            componentConfig.hardwareAcceleration && "gpu-accelerated",
            contentClassName
          )}
          style={{
            top: position.top,
            left: position.left,
            pointerEvents: 'auto'
          }}
          variants={componentConfig.animations ? contentVariants as any : undefined}
          initial={componentConfig.animations ? "hidden" : undefined}
          animate={componentConfig.animations ? "visible" : undefined}
          exit={componentConfig.animations ? "exit" : undefined}
          data-testid={`${testId}-content`}
        >
          {items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              item={item}
              isActive={activeItem === item.id}
              isSubmenuOpen={submenuOpen === item.id}
              onMouseEnter={() => setActiveItem(item.id)}
              onClick={() => handleItemClick(item)}
              onSubmenuToggle={(open) => 
                setSubmenuOpen(open ? item.id : null)
              }
            />
          ))}
        </motion.div>
      </div>
    </AnimatePresence>
  ) : null;

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        ref={triggerRef}
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-1 touch-target",
          "focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          triggerClassName
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        data-testid={testId}
      >
        {trigger}
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {typeof document !== 'undefined' && content && 
        createPortal(content, document.body)
      }
    </div>
  );
}

// Individual dropdown item component
function DropdownMenuItem({
  item,
  isActive,
  isSubmenuOpen,
  onMouseEnter,
  onClick,
  onSubmenuToggle,
}: {
  item: DropdownItem;
  isActive: boolean;
  isSubmenuOpen: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
  onSubmenuToggle: (open: boolean) => void;
}) {
  const { config: componentConfig } = useComponentEnhancement('card');

  if (item.separator) {
    return <hr className="my-1 border-border-primary/20" />;
  }

  return (
    <div className="relative">
      <motion.button
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors text-left",
          "focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:ring-inset",
          "touch-target-sm",
          item.disabled
            ? "text-text-muted cursor-not-allowed"
            : cn(
                "text-text-secondary hover:text-text-primary",
                item.destructive
                  ? "hover:bg-status-error/10 hover:text-status-error"
                  : "hover:bg-background-tertiary",
                isActive && (
                  item.destructive
                    ? "bg-status-error/10 text-status-error"
                    : "bg-background-tertiary text-text-primary"
                )
              )
        )}
        onMouseEnter={onMouseEnter}
        onClick={onClick}
        disabled={item.disabled}
        whileHover={componentConfig.animations ? { x: 2 } : undefined}
        whileTap={componentConfig.animations ? { scale: 0.98 } : undefined}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {item.icon && (
            <span className="flex-shrink-0 [&>svg]:w-4 [&>svg]:h-4">
              {item.icon}
            </span>
          )}
          
          <span className="flex-1 truncate">{item.label}</span>
          
          {item.checked && (
            <Check className="w-4 h-4 text-accent-primary" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {item.shortcut && (
            <span className="text-xs text-text-tertiary bg-background-tertiary px-1.5 py-0.5 rounded">
              {item.shortcut}
            </span>
          )}
          
          {item.children && (
            <ChevronRight className="w-4 h-4 text-text-tertiary" />
          )}
        </div>
      </motion.button>

      {/* Submenu */}
      {item.children && isSubmenuOpen && (
        <motion.div
          className={cn(
            "absolute left-full top-0 ml-1 min-w-48 py-2 rounded-xl border shadow-lg",
            componentConfig.glassmorphism ? "glass-card" : "bg-background-secondary",
            "border-border-primary z-10"
          )}
          initial={componentConfig.animations ? { opacity: 0, x: -10 } : undefined}
          animate={componentConfig.animations ? { opacity: 1, x: 0 } : undefined}
          exit={componentConfig.animations ? { opacity: 0, x: -10 } : undefined}
        >
          {item.children.map((child) => (
            <DropdownMenuItem
              key={child.id}
              item={child}
              isActive={false}
              isSubmenuOpen={false}
              onMouseEnter={() => {}}
              onClick={() => child.onClick?.()}
              onSubmenuToggle={() => {}}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

// Convenience hook for dropdown state management
export function useDropdown(defaultOpen = false) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const openDropdown = useCallback(() => setIsOpen(true), []);
  const closeDropdown = useCallback(() => setIsOpen(false), []);
  const toggleDropdown = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    openDropdown,
    closeDropdown,
    toggleDropdown,
    onOpenChange: setIsOpen,
  };
}