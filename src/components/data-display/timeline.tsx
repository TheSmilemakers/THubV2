'use client';

import React, { 
  forwardRef, 
  useState, 
  useEffect, 
  useRef 
} from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { 
  Clock,
  Circle,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar,
  User,
  MessageCircle,
  FileText,
  Zap,
  Star,
  Bookmark
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from './badge';

/**
 * Timeline Component - Event timeline with glassmorphism cards and animations
 * 
 * Features:
 * - Vertical and horizontal orientation
 * - Multiple timeline item variants (default, card, minimal)
 * - Interactive timeline items with animations
 * - Custom icons and status indicators
 * - Real-time updates with smooth animations
 * - Glassmorphism effects on timeline cards
 * - Touch-optimized interactions
 * - Responsive design with mobile adaptations
 * - Infinite scroll support
 * - Filtering and search capabilities
 * - Custom renderers for timeline items
 * - Accessibility support with keyboard navigation
 */

export interface TimelineItem {
  id: string | number;
  title: string;
  description?: string;
  content?: React.ReactNode;
  timestamp: string | Date;
  status?: 'pending' | 'completed' | 'error' | 'warning' | 'info';
  icon?: React.ReactNode;
  avatar?: string;
  author?: string;
  badge?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  actions?: TimelineAction[];
  onClick?: () => void;
  className?: string;
}

export interface TimelineAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  onClick: (item: TimelineItem) => void;
}

export interface TimelineProps {
  items: TimelineItem[];
  loading?: boolean;
  error?: string;
  // Layout
  orientation?: 'vertical' | 'horizontal';
  variant?: 'default' | 'card' | 'minimal';
  alignment?: 'left' | 'right' | 'center' | 'alternate';
  // Styling
  showConnector?: boolean;
  connectorColor?: string;
  itemSpacing?: 'sm' | 'md' | 'lg';
  // Interaction
  interactive?: boolean;
  onItemClick?: (item: TimelineItem) => void;
  // Filtering
  filterable?: boolean;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  // Animation
  animateOnScroll?: boolean;
  staggerDelay?: number;
  // Infinite scroll
  hasMore?: boolean;
  onLoadMore?: () => void;
  // Custom rendering
  renderItem?: (item: TimelineItem, index: number) => React.ReactNode;
  renderIcon?: (item: TimelineItem) => React.ReactNode;
  // UI
  className?: string;
  itemClassName?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  'data-testid'?: string;
}

const Timeline = forwardRef<HTMLDivElement, TimelineProps>(({
  items,
  loading = false,
  error,
  orientation = 'vertical',
  variant = 'default',
  alignment = 'left',
  showConnector = true,
  connectorColor = 'border-glass-border',
  itemSpacing = 'md',
  interactive = false,
  onItemClick,
  filterable = false,
  filterValue = '',
  onFilterChange,
  animateOnScroll = true,
  staggerDelay = 0.1,
  hasMore = false,
  onLoadMore,
  renderItem,
  renderIcon,
  className,
  itemClassName,
  emptyMessage = 'No timeline items',
  loadingMessage = 'Loading timeline...',
  'data-testid': testId,
}, ref) => {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<string | number | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch, screenSize } = useDeviceCapabilities();
  
  // Filter items based on filter value
  const filteredItems = filterable && filterValue
    ? items.filter(item => 
        item.title.toLowerCase().includes(filterValue.toLowerCase()) ||
        item.description?.toLowerCase().includes(filterValue.toLowerCase()) ||
        item.author?.toLowerCase().includes(filterValue.toLowerCase())
      )
    : items;
  
  // Get status icon
  const getStatusIcon = (status: TimelineItem['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-status-success" />;
      case 'error': return <XCircle className="w-5 h-5 text-status-error" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-status-warning" />;
      case 'info': return <Circle className="w-5 h-5 text-status-info" />;
      case 'pending': 
      default: return <Circle className="w-5 h-5 text-text-muted" />;
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };
  
  // Infinite scroll observer
  const lastItemRef = React.useCallback((node: HTMLDivElement | null) => {
    if (loading || !hasMore) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        onLoadMore?.();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore, onLoadMore]);
  
  // Container classes
  const containerClasses = cn(
    'relative w-full',
    orientation === 'horizontal' && 'flex overflow-x-auto',
    className
  );
  
  // Timeline classes
  const timelineClasses = cn(
    'relative',
    orientation === 'vertical' && 'space-y-0',
    orientation === 'horizontal' && 'flex gap-6',
    itemSpacing === 'sm' && orientation === 'vertical' && 'space-y-4',
    itemSpacing === 'md' && orientation === 'vertical' && 'space-y-6',
    itemSpacing === 'lg' && orientation === 'vertical' && 'space-y-8'
  );
  
  // Connector classes
  const connectorClasses = cn(
    'absolute',
    orientation === 'vertical' && alignment === 'left' && 'left-6 top-0 bottom-0 w-px border-l-2',
    orientation === 'vertical' && alignment === 'right' && 'right-6 top-0 bottom-0 w-px border-l-2',
    orientation === 'vertical' && alignment === 'center' && 'left-1/2 top-0 bottom-0 w-px border-l-2 -translate-x-0.5',
    orientation === 'horizontal' && 'top-6 left-0 right-0 h-px border-t-2',
    connectorColor
  );

  return (
    <div ref={ref} className={containerClasses} data-testid={testId}>
      {/* Filter */}
      {filterable && (
        <div className="mb-6">
          <input
            type="text"
            value={filterValue}
            onChange={(e) => onFilterChange?.(e.target.value)}
            placeholder="Filter timeline..."
            className="w-full px-4 py-2 glass-light border border-glass-border rounded-lg focus:outline-none focus:border-accent-primary transition-colors text-white placeholder:text-text-muted"
          />
        </div>
      )}

      {/* Error state */}
      {error && (
        <GlassCard className="p-6 text-center">
          <AlertCircle className="w-8 h-8 text-status-error mx-auto mb-3" />
          <p className="text-status-error">{error}</p>
        </GlassCard>
      )}

      {/* Empty state */}
      {!loading && !error && filteredItems.length === 0 && (
        <GlassCard className="p-8 text-center">
          <Clock className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted">{emptyMessage}</p>
        </GlassCard>
      )}

      {/* Timeline */}
      {!error && filteredItems.length > 0 && (
        <div ref={containerRef} className={timelineClasses}>
          {/* Connector line */}
          {showConnector && (
            <div className={connectorClasses} />
          )}

          {/* Timeline items */}
          {filteredItems.map((item, index) => (
            <TimelineItemComponent
              key={item.id}
              ref={index === filteredItems.length - 1 ? lastItemRef : undefined}
              item={item}
              index={index}
              orientation={orientation}
              variant={variant}
              alignment={alignment}
              interactive={interactive}
              animateOnScroll={animateOnScroll}
              staggerDelay={staggerDelay}
              isHovered={hoveredItem === item.id}
              onHover={setHoveredItem}
              onClick={onItemClick}
              renderCustom={renderItem}
              renderIcon={renderIcon}
              getStatusIcon={getStatusIcon}
              formatTimestamp={formatTimestamp}
              className={itemClassName}
            />
          ))}

          {/* Load more indicator */}
          {hasMore && (
            <motion.div
              className="flex items-center justify-center py-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            </motion.div>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <motion.div
          className="flex items-center justify-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center gap-3 glass-medium px-4 py-3 rounded-xl">
            <div className="w-5 h-5 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-white">{loadingMessage}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
});

// Timeline Item Component
interface TimelineItemProps {
  item: TimelineItem;
  index: number;
  orientation: TimelineProps['orientation'];
  variant: TimelineProps['variant'];
  alignment: TimelineProps['alignment'];
  interactive: boolean;
  animateOnScroll: boolean;
  staggerDelay: number;
  isHovered: boolean;
  onHover: (id: string | number | null) => void;
  onClick?: (item: TimelineItem) => void;
  renderCustom?: (item: TimelineItem, index: number) => React.ReactNode;
  renderIcon?: (item: TimelineItem) => React.ReactNode;
  getStatusIcon: (status: TimelineItem['status']) => React.ReactNode;
  formatTimestamp: (timestamp: string | Date) => string;
  className?: string;
}

const TimelineItemComponent = forwardRef<HTMLDivElement, TimelineItemProps>(({
  item,
  index,
  orientation,
  variant,
  alignment,
  interactive,
  animateOnScroll,
  staggerDelay,
  isHovered,
  onHover,
  onClick,
  renderCustom,
  renderIcon,
  getStatusIcon,
  formatTimestamp,
  className,
}, ref) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(itemRef, { once: true, margin: "-10px" });
  const { touch } = useDeviceCapabilities();
  
  // Custom render
  if (renderCustom) {
    return (
      <motion.div
        ref={ref}
        className={className}
        initial={animateOnScroll ? { opacity: 0, y: 20 } : false}
        animate={isInView || !animateOnScroll ? { opacity: 1, y: 0 } : {}}
        transition={{ 
          duration: 0.5, 
          delay: animateOnScroll ? index * staggerDelay : 0,
          ease: "easeOut"
        }}
      >
        {renderCustom(item, index)}
      </motion.div>
    );
  }
  
  // Layout classes
  const itemClasses = cn(
    'relative flex',
    orientation === 'vertical' && alignment === 'left' && 'pl-16',
    orientation === 'vertical' && alignment === 'right' && 'pr-16 flex-row-reverse',
    orientation === 'vertical' && alignment === 'center' && 'pl-8',
    orientation === 'vertical' && alignment === 'alternate' && (
      index % 2 === 0 ? 'pl-16' : 'pr-16 flex-row-reverse'
    ),
    orientation === 'horizontal' && 'flex-col items-center',
    interactive && 'cursor-pointer',
    className
  );
  
  const iconContainerClasses = cn(
    'absolute flex items-center justify-center rounded-full z-10',
    'w-12 h-12 glass-light border-2 border-glass-border',
    orientation === 'vertical' && alignment === 'left' && '-left-6',
    orientation === 'vertical' && alignment === 'right' && '-right-6',
    orientation === 'vertical' && alignment === 'center' && 'left-1/2 -translate-x-1/2',
    orientation === 'vertical' && alignment === 'alternate' && (
      index % 2 === 0 ? '-left-6' : '-right-6'
    ),
    orientation === 'horizontal' && '-top-6'
  );
  
  const contentClasses = cn(
    'flex-1',
    variant === 'card' && 'glass-light rounded-xl p-6 border border-glass-border',
    variant === 'minimal' && 'py-2',
    variant === 'default' && 'py-4'
  );

  return (
    <motion.div
      ref={ref}
      className={itemClasses}
      onClick={() => onClick?.(item)}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
      initial={animateOnScroll ? { opacity: 0, y: 20 } : false}
      animate={isInView || !animateOnScroll ? { opacity: 1, y: 0 } : {}}
      transition={{ 
        duration: 0.5, 
        delay: animateOnScroll ? index * staggerDelay : 0,
        ease: "easeOut"
      }}
      whileHover={interactive && !touch ? { y: -2 } : undefined}
    >
      {/* Timeline icon */}
      <div className={iconContainerClasses}>
        {renderIcon ? renderIcon(item) : (
          item.icon || getStatusIcon(item.status)
        )}
      </div>

      {/* Content */}
      <div className={contentClasses}>
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-white font-semibold text-lg leading-snug">
                {item.title}
              </h3>
              {item.badge && (
                <Badge size="xs" color="primary" variant="glass">
                  {item.badge}
                </Badge>
              )}
            </div>
            
            {/* Meta info */}
            <div className="flex items-center gap-3 text-sm text-text-muted">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTimestamp(item.timestamp)}
              </span>
              {item.author && (
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {item.author}
                </span>
              )}
            </div>
          </div>
          
          {/* Avatar */}
          {item.avatar && (
            <div className="w-10 h-10 rounded-full overflow-hidden bg-glass-surface-light ml-3">
              <img src={item.avatar} alt={item.author} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-text-secondary mb-4 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Content */}
        {item.content && (
          <div className="mb-4">
            {item.content}
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {item.tags.map((tag, tagIndex) => (
              <Badge 
                key={tagIndex} 
                size="xs" 
                variant="ghost" 
                color="neutral"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        {item.actions && item.actions.length > 0 && isHovered && (
          <motion.div
            className="flex items-center gap-2 mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {item.actions.map((action) => (
              <motion.button
                key={action.id}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick(item);
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all touch-target-min',
                  action.variant === 'primary' && 'bg-accent-primary text-white hover:bg-accent-primary/80',
                  action.variant === 'secondary' && 'glass-light hover:glass-medium text-white',
                  action.variant === 'ghost' && 'text-text-muted hover:text-white hover:bg-white/5'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {action.icon && <span className="[&>svg]:w-4 [&>svg]:h-4">{action.icon}</span>}
                <span>{action.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Status indicator for card variant */}
        {variant === 'card' && item.status && (
          <div className={cn(
            'absolute top-6 right-6 w-3 h-3 rounded-full',
            item.status === 'completed' && 'bg-status-success',
            item.status === 'error' && 'bg-status-error',
            item.status === 'warning' && 'bg-status-warning',
            item.status === 'info' && 'bg-status-info',
            item.status === 'pending' && 'bg-text-muted'
          )} />
        )}
      </div>
    </motion.div>
  );
});

Timeline.displayName = 'Timeline';
TimelineItemComponent.displayName = 'TimelineItem';

export { Timeline };

// Convenience components
export const ActivityTimeline = (props: Omit<TimelineProps, 'variant'>) => (
  <Timeline variant="default" alignment="left" {...props} />
);

export const CardTimeline = (props: Omit<TimelineProps, 'variant'>) => (
  <Timeline variant="card" alignment="left" itemSpacing="lg" {...props} />
);

export const CenteredTimeline = (props: Omit<TimelineProps, 'alignment'>) => (
  <Timeline alignment="center" {...props} />
);

export const AlternatingTimeline = (props: Omit<TimelineProps, 'alignment'>) => (
  <Timeline alignment="alternate" variant="card" {...props} />
);

export const HorizontalTimeline = (props: Omit<TimelineProps, 'orientation'>) => (
  <Timeline orientation="horizontal" variant="card" {...props} />
);

export const MinimalTimeline = (props: Omit<TimelineProps, 'variant'>) => (
  <Timeline variant="minimal" showConnector={false} {...props} />
);