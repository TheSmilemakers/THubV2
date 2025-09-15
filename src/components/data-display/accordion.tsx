'use client';

import React, { 
  useState, 
  useRef, 
  useEffect, 
  forwardRef, 
  useCallback 
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Info,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Lock,
  Unlock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';
import { GlassCard } from '@/components/ui/glass-card';

/**
 * Accordion Component - Collapsible content sections with smooth animations
 * 
 * Features:
 * - Single and multiple item expansion
 * - Smooth expand/collapse animations with height calculation
 * - Glassmorphism styling with adaptive effects
 * - Touch-optimized for mobile (44px+ touch targets)
 * - Keyboard navigation (Enter, Space, Arrow keys)
 * - Custom icons and status indicators
 * - Nested accordion support
 * - Loading states for async content
 * - Accessibility support with ARIA attributes
 * - Custom triggers and content renderers
 * - Responsive design with mobile optimizations
 */

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  status?: 'default' | 'success' | 'warning' | 'error' | 'info';
  disabled?: boolean;
  loading?: boolean;
  defaultExpanded?: boolean;
  className?: string;
  contentClassName?: string;
  onExpand?: () => void;
  onCollapse?: () => void;
}

export interface AccordionProps {
  items: AccordionItem[];
  // Behavior
  allowMultiple?: boolean;
  collapsible?: boolean;
  defaultExpandedItems?: string[];
  expandedItems?: string[];
  onExpandedChange?: (expandedItems: string[]) => void;
  // Styling
  variant?: 'default' | 'bordered' | 'filled' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  // Icons
  expandIcon?: 'chevron' | 'arrow' | 'plus' | 'custom';
  customExpandIcon?: React.ReactNode;
  customCollapseIcon?: React.ReactNode;
  // Animation
  animationDuration?: number;
  animateIcons?: boolean;
  staggerDelay?: number;
  // Custom rendering
  renderTrigger?: (item: AccordionItem, isExpanded: boolean, index: number) => React.ReactNode;
  renderContent?: (item: AccordionItem, isExpanded: boolean, index: number) => React.ReactNode;
  // UI
  className?: string;
  itemClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
  'data-testid'?: string;
}

const Accordion = forwardRef<HTMLDivElement, AccordionProps>(({
  items,
  allowMultiple = false,
  collapsible = true,
  defaultExpandedItems = [],
  expandedItems: controlledExpandedItems,
  onExpandedChange,
  variant = 'default',
  size = 'md',
  spacing = 'sm',
  expandIcon = 'chevron',
  customExpandIcon,
  customCollapseIcon,
  animationDuration = 300,
  animateIcons = true,
  staggerDelay = 0.05,
  renderTrigger,
  renderContent,
  className,
  itemClassName,
  triggerClassName,
  contentClassName,
  'data-testid': testId,
}, ref) => {
  // State for uncontrolled mode
  const [internalExpandedItems, setInternalExpandedItems] = useState<string[]>(
    defaultExpandedItems
  );
  
  // Use controlled or uncontrolled state
  const expandedItems = controlledExpandedItems !== undefined 
    ? controlledExpandedItems 
    : internalExpandedItems;
  
  // Content refs for height calculation
  const contentRefs = useRef<Record<string, HTMLDivElement>>({});
  
  // Hooks
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch, screenSize } = useDeviceCapabilities();
  
  // Handle expand/collapse
  const handleToggle = useCallback((itemId: string) => {
    const item = items.find(item => item.id === itemId);
    if (item?.disabled) return;
    
    let newExpandedItems: string[];
    
    if (allowMultiple) {
      // Multiple items can be expanded
      if (expandedItems.includes(itemId)) {
        if (collapsible || expandedItems.length > 1) {
          newExpandedItems = expandedItems.filter(id => id !== itemId);
          item?.onCollapse?.();
        } else {
          return; // Cannot collapse if it's the only expanded item and collapsible is false
        }
      } else {
        newExpandedItems = [...expandedItems, itemId];
        item?.onExpand?.();
      }
    } else {
      // Only one item can be expanded
      if (expandedItems.includes(itemId)) {
        newExpandedItems = collapsible ? [] : expandedItems;
        if (collapsible) {
          item?.onCollapse?.();
        }
      } else {
        newExpandedItems = [itemId];
        item?.onExpand?.();
      }
    }
    
    if (controlledExpandedItems === undefined) {
      setInternalExpandedItems(newExpandedItems);
    }
    
    onExpandedChange?.(newExpandedItems);
  }, [
    items, 
    allowMultiple, 
    collapsible, 
    expandedItems, 
    controlledExpandedItems, 
    onExpandedChange
  ]);
  
  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle(itemId);
    }
  }, [handleToggle]);
  
  // Get expand/collapse icon
  const getIcon = (isExpanded: boolean) => {
    if (expandIcon === 'custom') {
      return isExpanded ? customCollapseIcon : customExpandIcon;
    }
    
    switch (expandIcon) {
      case 'chevron':
        return <ChevronDown className={cn(
          'w-5 h-5 transition-transform duration-200',
          isExpanded && 'rotate-180'
        )} />;
      case 'arrow':
        return isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />;
      case 'plus':
        return isExpanded ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />;
      default:
        return <ChevronDown className={cn(
          'w-5 h-5 transition-transform duration-200',
          isExpanded && 'rotate-180'
        )} />;
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: AccordionItem['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-status-success" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-status-warning" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-status-error" />;
      case 'info': return <Info className="w-4 h-4 text-status-info" />;
      default: return null;
    }
  };
  
  // Container classes
  const containerClasses = cn(
    'w-full',
    spacing === 'none' && 'space-y-0',
    spacing === 'sm' && 'space-y-1',
    spacing === 'md' && 'space-y-2',
    spacing === 'lg' && 'space-y-4',
    className
  );
  
  // Item classes
  const getItemClasses = (item: AccordionItem, index: number) => cn(
    'overflow-hidden transition-all duration-300',
    variant === 'default' && 'border border-glass-border/30 rounded-xl',
    variant === 'bordered' && 'border-2 border-glass-border rounded-xl',
    variant === 'filled' && 'glass-light rounded-xl',
    variant === 'ghost' && 'hover:bg-white/5 rounded-xl',
    item.disabled && 'opacity-50 cursor-not-allowed',
    itemClassName,
    item.className
  );
  
  // Trigger classes
  const getTriggerClasses = (item: AccordionItem, isExpanded: boolean) => cn(
    'w-full flex items-center justify-between text-left transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:ring-offset-2 focus:ring-offset-background-primary',
    size === 'sm' && 'px-4 py-3 min-h-[48px]',
    size === 'md' && 'px-6 py-4 min-h-[56px]',
    size === 'lg' && 'px-8 py-6 min-h-[64px]',
    !item.disabled && 'cursor-pointer hover:bg-white/5',
    item.disabled && 'cursor-not-allowed',
    isExpanded && variant === 'ghost' && 'bg-white/5',
    touch && 'touch-target',
    triggerClassName
  );
  
  // Content classes
  const getContentClasses = (item: AccordionItem) => cn(
    'overflow-hidden transition-all duration-300',
    size === 'sm' && 'px-4 pb-3',
    size === 'md' && 'px-6 pb-4',
    size === 'lg' && 'px-8 pb-6',
    contentClassName,
    item.contentClassName
  );

  return (
    <div ref={ref} className={containerClasses} data-testid={testId}>
      {items.map((item, index) => {
        const isExpanded = expandedItems.includes(item.id);
        
        return (
          <motion.div
            key={item.id}
            className={getItemClasses(item, index)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.3, 
              delay: index * staggerDelay,
              ease: "easeOut"
            }}
          >
            {/* Trigger */}
            <div
              role="button"
              tabIndex={item.disabled ? -1 : 0}
              className={getTriggerClasses(item, isExpanded)}
              onClick={() => !item.disabled && handleToggle(item.id)}
              onKeyDown={(e) => !item.disabled && handleKeyDown(e, item.id)}
              aria-expanded={isExpanded}
              aria-controls={`accordion-content-${item.id}`}
              aria-disabled={item.disabled}
            >
              {renderTrigger ? (
                renderTrigger(item, isExpanded, index)
              ) : (
                <>
                  {/* Left content */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Custom icon or status icon */}
                    {item.icon && (
                      <div className="flex-shrink-0 [&>svg]:w-5 [&>svg]:h-5">
                        {item.icon}
                      </div>
                    )}
                    
                    {/* Status icon */}
                    {!item.icon && item.status && item.status !== 'default' && (
                      <div className="flex-shrink-0">
                        {getStatusIcon(item.status)}
                      </div>
                    )}
                    
                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className={cn(
                          'font-semibold text-white truncate',
                          size === 'sm' && 'text-sm',
                          size === 'md' && 'text-base',
                          size === 'lg' && 'text-lg'
                        )}>
                          {item.title}
                        </h3>
                        
                        {/* Badge */}
                        {item.badge && (
                          <span className="bg-accent-primary/20 text-accent-primary px-2 py-0.5 rounded-full text-xs font-medium">
                            {item.badge}
                          </span>
                        )}
                        
                        {/* Disabled indicator */}
                        {item.disabled && (
                          <Lock className="w-4 h-4 text-text-muted" />
                        )}
                      </div>
                      
                      {/* Subtitle */}
                      {item.subtitle && (
                        <p className={cn(
                          'text-text-muted truncate',
                          size === 'sm' && 'text-xs',
                          size === 'md' && 'text-sm',
                          size === 'lg' && 'text-base'
                        )}>
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Right content */}
                  <div className="flex items-center gap-2 ml-3">
                    {/* Loading indicator */}
                    {item.loading && (
                      <div className="w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    
                    {/* Expand/collapse icon */}
                    {!item.loading && (
                      <motion.div
                        className="flex-shrink-0 text-text-muted"
                        animate={animateIcons && expandIcon === 'chevron' ? { 
                          rotate: isExpanded ? 180 : 0 
                        } : {}}
                        transition={{ duration: 0.2 }}
                      >
                        {getIcon(isExpanded)}
                      </motion.div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Content */}
            <AnimatePresence mode="wait">
              {isExpanded && (
                <motion.div
                  key={`content-${item.id}`}
                  id={`accordion-content-${item.id}`}
                  className={getContentClasses(item)}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ 
                    height: "auto", 
                    opacity: 1,
                    transition: {
                      height: { duration: animationDuration / 1000, ease: "easeOut" },
                      opacity: { duration: (animationDuration / 1000) * 0.7, delay: (animationDuration / 1000) * 0.1 }
                    }
                  }}
                  exit={{ 
                    height: 0, 
                    opacity: 0,
                    transition: {
                      height: { duration: animationDuration / 1000, ease: "easeIn" },
                      opacity: { duration: (animationDuration / 1000) * 0.3 }
                    }
                  }}
                  style={{ overflow: "hidden" }}
                >
                  <div 
                    ref={(el) => {
                      if (el) contentRefs.current[item.id] = el;
                    }}
                    className="pt-0"
                  >
                    {renderContent ? (
                      renderContent(item, isExpanded, index)
                    ) : (
                      <div className="text-text-secondary leading-relaxed">
                        {item.content}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
});

Accordion.displayName = 'Accordion';

export { Accordion };

// Convenience components for common use cases
export const FAQ = (props: Omit<AccordionProps, 'expandIcon' | 'variant'>) => (
  <Accordion 
    expandIcon="plus" 
    variant="bordered"
    collapsible
    {...props} 
  />
);

export const SettingsAccordion = (props: Omit<AccordionProps, 'variant' | 'size'>) => (
  <Accordion 
    variant="filled" 
    size="lg"
    allowMultiple
    {...props} 
  />
);

export const CompactAccordion = (props: Omit<AccordionProps, 'size' | 'spacing'>) => (
  <Accordion 
    size="sm" 
    spacing="none"
    variant="ghost"
    {...props} 
  />
);

export const HelpAccordion = (props: Omit<AccordionProps, 'expandIcon'>) => (
  <Accordion 
    expandIcon="arrow"
    {...props} 
  />
);

export const NestedAccordion = (props: AccordionProps) => (
  <Accordion 
    allowMultiple
    variant="ghost"
    spacing="sm"
    {...props} 
  />
);