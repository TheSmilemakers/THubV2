'use client';

import React, { 
  useState, 
  useRef, 
  useEffect, 
  useCallback, 
  forwardRef 
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';
import { GlassCard } from '@/components/ui/glass-card';

/**
 * Tabs Component - Tab navigation with glassmorphism effects and mobile optimization
 * 
 * Features:
 * - Horizontal and vertical orientations
 * - Multiple variants (line, pills, cards, glass)
 * - Scrollable tabs for overflow
 * - Closable tabs with smooth animations
 * - Touch-optimized swipe gestures (mobile)
 * - Keyboard navigation (Arrow keys, Enter, Space)
 * - Glassmorphism styling with adaptive effects
 * - Custom tab renderers
 * - Loading states for async content
 * - Badge support for notifications
 * - Responsive design with mobile adaptations
 * - Accessibility support with ARIA attributes
 */

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  closable?: boolean;
  loading?: boolean;
  className?: string;
  contentClassName?: string;
  onClose?: () => void;
}

export interface TabsProps {
  items: TabItem[];
  // Behavior
  activeTab?: string;
  defaultActiveTab?: string;
  onTabChange?: (tabId: string) => void;
  // Layout
  orientation?: 'horizontal' | 'vertical';
  variant?: 'line' | 'pills' | 'cards' | 'glass';
  position?: 'top' | 'bottom' | 'left' | 'right';
  alignment?: 'start' | 'center' | 'end' | 'stretch';
  // Scrolling
  scrollable?: boolean;
  scrollButtons?: boolean;
  // Gestures (mobile)
  swipeEnabled?: boolean;
  // Customization
  size?: 'sm' | 'md' | 'lg';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  // Animation
  animateContent?: boolean;
  tabIndicatorAnimation?: boolean;
  // Custom rendering
  renderTab?: (item: TabItem, isActive: boolean, index: number) => React.ReactNode;
  renderContent?: (item: TabItem, isActive: boolean) => React.ReactNode;
  // Events
  onTabAdd?: () => void;
  onTabClose?: (tabId: string) => void;
  // UI
  addButton?: boolean;
  className?: string;
  tabListClassName?: string;
  tabClassName?: string;
  contentClassName?: string;
  'data-testid'?: string;
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(({
  items,
  activeTab: controlledActiveTab,
  defaultActiveTab,
  onTabChange,
  orientation = 'horizontal',
  variant = 'line',
  position = 'top',
  alignment = 'start',
  scrollable = true,
  scrollButtons = false,
  swipeEnabled = true,
  size = 'md',
  spacing = 'none',
  animateContent = true,
  tabIndicatorAnimation = true,
  renderTab,
  renderContent,
  onTabAdd,
  onTabClose,
  addButton = false,
  className,
  tabListClassName,
  tabClassName,
  contentClassName,
  'data-testid': testId,
}, ref) => {
  // State
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultActiveTab || items[0]?.id || ''
  );
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  // Refs
  const tabListRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Touch handling
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Hooks
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch, screenSize } = useDeviceCapabilities();
  
  // Use controlled or uncontrolled active tab
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const currentItem = items.find(item => item.id === activeTab);
  
  // Handle tab change
  const handleTabChange = useCallback((tabId: string) => {
    const item = items.find(item => item.id === tabId);
    if (item?.disabled) return;
    
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId);
    }
    
    onTabChange?.(tabId);
  }, [items, controlledActiveTab, onTabChange]);
  
  // Handle tab close
  const handleTabClose = useCallback((e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onTabClose?.(tabId);
  }, [onTabClose]);
  
  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, tabId: string) => {
    const currentIndex = items.findIndex(item => item.id === tabId);
    let targetIndex = currentIndex;
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleTabChange(tabId);
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          e.preventDefault();
          targetIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          e.preventDefault();
          targetIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical') {
          e.preventDefault();
          targetIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical') {
          e.preventDefault();
          targetIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        }
        break;
    }
    
    if (targetIndex !== currentIndex && !items[targetIndex]?.disabled) {
      handleTabChange(items[targetIndex].id);
      // Focus the target tab
      setTimeout(() => {
        const targetTab = tabListRef.current?.querySelector(`[data-tab-id="${items[targetIndex].id}"]`) as HTMLButtonElement;
        targetTab?.focus();
      }, 0);
    }
  }, [items, orientation, handleTabChange]);
  
  // Swipe handling for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!swipeEnabled || !touch) return;
    
    const touchPoint = e.touches[0];
    setTouchStart({ x: touchPoint.clientX, y: touchPoint.clientY });
    setIsDragging(true);
  }, [swipeEnabled, touch]);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swipeEnabled || !touch || !touchStart) return;
    
    const touchEnd = e.changedTouches[0];
    const deltaX = touchEnd.clientX - touchStart.x;
    const deltaY = Math.abs(touchEnd.clientY - touchStart.y);
    
    // Only trigger swipe if horizontal movement is significant and vertical is minimal
    if (Math.abs(deltaX) > 50 && deltaY < 30) {
      const currentIndex = items.findIndex(item => item.id === activeTab);
      let targetIndex = currentIndex;
      
      if (deltaX > 0 && currentIndex > 0) {
        // Swipe right - go to previous tab
        targetIndex = currentIndex - 1;
      } else if (deltaX < 0 && currentIndex < items.length - 1) {
        // Swipe left - go to next tab
        targetIndex = currentIndex + 1;
      }
      
      if (targetIndex !== currentIndex && !items[targetIndex]?.disabled) {
        handleTabChange(items[targetIndex].id);
      }
    }
    
    setTouchStart(null);
    setIsDragging(false);
  }, [swipeEnabled, touch, touchStart, items, activeTab, handleTabChange]);
  
  // Update tab indicator position
  useEffect(() => {
    if (!tabIndicatorAnimation || variant === 'pills' || variant === 'cards') return;
    
    const activeTabElement = tabListRef.current?.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement;
    if (!activeTabElement || !tabListRef.current) return;
    
    const tabListRect = tabListRef.current.getBoundingClientRect();
    const activeTabRect = activeTabElement.getBoundingClientRect();
    
    if (orientation === 'horizontal') {
      setIndicatorStyle({
        width: activeTabRect.width,
        left: activeTabRect.left - tabListRect.left,
        transform: 'translateY(0)',
      });
    } else {
      setIndicatorStyle({
        height: activeTabRect.height,
        top: activeTabRect.top - tabListRect.top,
        transform: 'translateX(0)',
      });
    }
  }, [activeTab, items, orientation, variant, tabIndicatorAnimation]);
  
  // Check scroll state
  const checkScrollState = useCallback(() => {
    const tabList = tabListRef.current;
    if (!tabList || !scrollable) return;
    
    if (orientation === 'horizontal') {
      setCanScrollLeft(tabList.scrollLeft > 0);
      setCanScrollRight(tabList.scrollLeft < tabList.scrollWidth - tabList.clientWidth);
    } else {
      setCanScrollLeft(tabList.scrollTop > 0);
      setCanScrollRight(tabList.scrollTop < tabList.scrollHeight - tabList.clientHeight);
    }
  }, [scrollable, orientation]);
  
  // Scroll functions
  const scrollTabs = useCallback((direction: 'left' | 'right') => {
    const tabList = tabListRef.current;
    if (!tabList) return;
    
    const scrollAmount = 200;
    
    if (orientation === 'horizontal') {
      tabList.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    } else {
      tabList.scrollBy({
        top: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, [orientation]);
  
  // Setup scroll listener
  useEffect(() => {
    const tabList = tabListRef.current;
    if (!tabList || !scrollable) return;
    
    checkScrollState();
    tabList.addEventListener('scroll', checkScrollState);
    
    return () => tabList.removeEventListener('scroll', checkScrollState);
  }, [checkScrollState, scrollable]);
  
  // Container classes
  const containerClasses = cn(
    'w-full',
    orientation === 'horizontal' && position === 'bottom' && 'flex flex-col-reverse',
    orientation === 'vertical' && 'flex',
    orientation === 'vertical' && position === 'right' && 'flex-row-reverse',
    className
  );
  
  // Tab list classes
  const tabListClasses = cn(
    'relative flex',
    orientation === 'horizontal' && 'flex-row',
    orientation === 'vertical' && 'flex-col',
    // Scrolling
    scrollable && orientation === 'horizontal' && 'overflow-x-auto scrollbar-hide',
    scrollable && orientation === 'vertical' && 'overflow-y-auto scrollbar-hide',
    // Alignment
    orientation === 'horizontal' && alignment === 'center' && 'justify-center',
    orientation === 'horizontal' && alignment === 'end' && 'justify-end',
    orientation === 'horizontal' && alignment === 'stretch' && 'justify-stretch',
    // Variant styling
    variant === 'line' && orientation === 'horizontal' && 'border-b border-glass-border',
    variant === 'line' && orientation === 'vertical' && 'border-r border-glass-border',
    // Spacing
    spacing === 'sm' && 'gap-2',
    spacing === 'md' && 'gap-4',
    spacing === 'lg' && 'gap-6',
    tabListClassName
  );
  
  // Tab classes
  const getTabClasses = (item: TabItem, isActive: boolean) => cn(
    'relative flex items-center justify-center transition-all duration-200 focus:outline-none',
    'focus:ring-2 focus:ring-accent-primary/50 focus:ring-offset-2 focus:ring-offset-background-primary',
    // Size
    size === 'sm' && 'px-3 py-2 text-sm min-h-[36px]',
    size === 'md' && 'px-4 py-3 text-base min-h-[44px]',
    size === 'lg' && 'px-6 py-4 text-lg min-h-[52px]',
    // Variant styling
    variant === 'line' && 'hover:bg-white/5',
    variant === 'pills' && 'rounded-full hover:bg-white/5',
    variant === 'pills' && isActive && 'bg-accent-primary text-white',
    variant === 'cards' && 'rounded-lg hover:bg-white/5 border border-transparent',
    variant === 'cards' && isActive && 'glass-medium border-glass-border',
    variant === 'glass' && 'glass-light rounded-lg hover:glass-medium',
    variant === 'glass' && isActive && 'glass-heavy',
    // States
    item.disabled && 'opacity-50 cursor-not-allowed',
    !item.disabled && 'cursor-pointer',
    isActive && variant === 'line' && 'text-accent-primary',
    !isActive && 'text-text-muted hover:text-white',
    // Touch optimization
    touch && 'touch-target',
    // Stretch alignment
    alignment === 'stretch' && 'flex-1',
    tabClassName,
    item.className
  );
  
  // Content classes
  const getContentClasses = () => cn(
    'flex-1 focus:outline-none',
    orientation === 'vertical' && 'ml-6',
    contentClassName
  );

  return (
    <div ref={ref} className={containerClasses} data-testid={testId}>
      {/* Tab navigation */}
      <div className="relative flex items-center">
        {/* Left scroll button */}
        {scrollButtons && canScrollLeft && (
          <motion.button
            onClick={() => scrollTabs('left')}
            className="flex items-center justify-center w-8 h-8 glass-light hover:glass-medium rounded-lg mr-2 touch-target-min"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {orientation === 'horizontal' ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ArrowLeft className="w-4 h-4" />
            )}
          </motion.button>
        )}
        
        {/* Tab list */}
        <div 
          ref={tabListRef}
          role="tablist"
          aria-orientation={orientation}
          className={tabListClasses}
        >
          {/* Tab indicator */}
          {tabIndicatorAnimation && (variant === 'line' || variant === 'glass') && (
            <motion.div
              ref={indicatorRef}
              className={cn(
                'absolute bg-accent-primary z-10',
                orientation === 'horizontal' && variant === 'line' && 'bottom-0 h-0.5',
                orientation === 'vertical' && variant === 'line' && 'right-0 w-0.5',
                variant === 'glass' && 'bg-accent-primary/20 backdrop-blur-sm rounded-lg'
              )}
              style={indicatorStyle}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          
          {/* Tab items */}
          {items.map((item, index) => {
            const isActive = item.id === activeTab;
            
            return (
              <button
                key={item.id}
                data-tab-id={item.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${item.id}`}
                tabIndex={isActive ? 0 : -1}
                disabled={item.disabled}
                className={getTabClasses(item, isActive)}
                onClick={() => handleTabChange(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
              >
                {renderTab ? (
                  renderTab(item, isActive, index)
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Icon */}
                    {item.icon && (
                      <span className="flex-shrink-0 [&>svg]:w-4 [&>svg]:h-4">
                        {item.icon}
                      </span>
                    )}
                    
                    {/* Label */}
                    <span className="truncate">
                      {item.label}
                    </span>
                    
                    {/* Badge */}
                    {item.badge && (
                      <span className="bg-status-error text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                    
                    {/* Loading indicator */}
                    {item.loading && (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-50" />
                    )}
                    
                    {/* Close button */}
                    {item.closable && (
                      <motion.span
                        onClick={(e) => handleTabClose(e as any, item.id)}
                        className="flex items-center justify-center w-4 h-4 hover:bg-white/20 rounded-full transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-3 h-3" />
                      </motion.span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
          
          {/* Add button */}
          {addButton && onTabAdd && (
            <motion.button
              onClick={onTabAdd}
              className={cn(
                'flex items-center justify-center text-text-muted hover:text-white transition-colors',
                size === 'sm' && 'w-8 h-8',
                size === 'md' && 'w-10 h-10',
                size === 'lg' && 'w-12 h-12'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Add tab"
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          )}
        </div>
        
        {/* Right scroll button */}
        {scrollButtons && canScrollRight && (
          <motion.button
            onClick={() => scrollTabs('right')}
            className="flex items-center justify-center w-8 h-8 glass-light hover:glass-medium rounded-lg ml-2 touch-target-min"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {orientation === 'horizontal' ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </motion.button>
        )}
      </div>
      
      {/* Tab content */}
      <div 
        ref={contentRef}
        className={getContentClasses()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          {currentItem && (
            <motion.div
              key={activeTab}
              id={`tabpanel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              tabIndex={0}
              className={cn(
                'focus:outline-none',
                currentItem.contentClassName
              )}
              initial={animateContent ? { opacity: 0, x: 10 } : false}
              animate={animateContent ? { opacity: 1, x: 0 } : {}}
              exit={animateContent ? { opacity: 0, x: -10 } : {}}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {renderContent ? (
                renderContent(currentItem, true)
              ) : (
                currentItem.content
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Swipe indicator */}
        {swipeEnabled && touch && isDragging && (
          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 glass-dark rounded-full text-xs text-white pointer-events-none z-50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            Swipe to switch tabs
          </motion.div>
        )}
      </div>
    </div>
  );
});

Tabs.displayName = 'Tabs';

export { Tabs };

// Convenience components
export const LineTabs = (props: Omit<TabsProps, 'variant'>) => (
  <Tabs variant="line" tabIndicatorAnimation {...props} />
);

export const PillTabs = (props: Omit<TabsProps, 'variant'>) => (
  <Tabs variant="pills" {...props} />
);

export const CardTabs = (props: Omit<TabsProps, 'variant'>) => (
  <Tabs variant="cards" spacing="sm" {...props} />
);

export const GlassTabs = (props: Omit<TabsProps, 'variant'>) => (
  <Tabs variant="glass" spacing="sm" {...props} />
);

export const VerticalTabs = (props: Omit<TabsProps, 'orientation'>) => (
  <Tabs orientation="vertical" {...props} />
);

export const ScrollableTabs = (props: TabsProps) => (
  <Tabs scrollable scrollButtons {...props} />
);

export const ClosableTabs = (props: TabsProps) => (
  <Tabs 
    addButton 
    {...props}
    items={props.items.map(item => ({ ...item, closable: true }))}
  />
);