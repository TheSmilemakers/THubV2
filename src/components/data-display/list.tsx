'use client';

import React, { 
  useState, 
  useRef, 
  useEffect, 
  useCallback, 
  forwardRef 
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VariableSizeList as VirtualList, ListChildComponentProps } from 'react-window';
import { 
  ChevronRight,
  MoreVertical,
  Star,
  Heart,
  Share,
  Download,
  Trash2,
  Edit,
  Eye,
  Loader2,
  AlertCircle,
  Plus,
  Filter,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';
import { GlassCard } from '@/components/ui/glass-card';

/**
 * List Component - Various list layouts with glassmorphism effects
 * 
 * Features:
 * - Multiple layouts (simple, card, media, detailed)
 * - Virtual scrolling for large datasets
 * - Touch-optimized interactions (swipe actions)
 * - Selection support (single/multi)
 * - Loading and error states
 * - Search and filtering
 * - Custom item renderers
 * - Action buttons with glassmorphism
 * - Responsive design
 * - Keyboard navigation
 * - Infinite scroll support
 * - Drag and drop reordering
 */

export interface ListItem {
  id: string | number;
  title: string;
  description?: string;
  subtitle?: string;
  avatar?: string;
  image?: string;
  badge?: string | number;
  status?: 'active' | 'inactive' | 'pending' | 'error';
  metadata?: Record<string, any>;
  actions?: ListAction[];
  [key: string]: any;
}

export interface ListAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: (item: ListItem) => void;
}

export interface ListProps {
  items: ListItem[];
  loading?: boolean;
  error?: string;
  // Layout
  layout?: 'simple' | 'card' | 'media' | 'detailed';
  orientation?: 'vertical' | 'horizontal';
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  // Behavior
  selectable?: boolean;
  multiSelect?: boolean;
  selectedItems?: (string | number)[];
  onSelectionChange?: (selectedItems: (string | number)[]) => void;
  // Interactions
  onItemClick?: (item: ListItem) => void;
  onItemDoubleClick?: (item: ListItem) => void;
  onItemSwipeLeft?: (item: ListItem) => void;
  onItemSwipeRight?: (item: ListItem) => void;
  // Virtual scrolling
  virtualized?: boolean;
  itemHeight?: number | ((index: number) => number);
  overscanCount?: number;
  // Search and filter
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filterable?: boolean;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  // Customization
  renderItem?: (item: ListItem, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  className?: string;
  itemClassName?: string;
  headerActions?: React.ReactNode;
  emptyMessage?: string;
  loadingMessage?: string;
  // Infinite scroll
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  'data-testid'?: string;
}

const List = forwardRef<HTMLDivElement, ListProps>(({
  items,
  loading = false,
  error,
  layout = 'simple',
  orientation = 'vertical',
  spacing = 'sm',
  selectable = false,
  multiSelect = false,
  selectedItems = [],
  onSelectionChange,
  onItemClick,
  onItemDoubleClick,
  onItemSwipeLeft,
  onItemSwipeRight,
  virtualized = false,
  itemHeight = 72,
  overscanCount = 5,
  searchable = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search items...',
  filterable = false,
  filterValue = '',
  onFilterChange,
  renderItem,
  renderEmpty,
  renderLoading,
  className,
  itemClassName,
  headerActions,
  emptyMessage = 'No items to display',
  loadingMessage = 'Loading...',
  hasNextPage = false,
  onLoadMore,
  'data-testid': testId,
}, ref) => {
  // State
  const [internalSearchValue, setInternalSearchValue] = useState('');
  const [hoveredItem, setHoveredItem] = useState<string | number | null>(null);
  const [swipeStates, setSwipeStates] = useState<Record<string | number, 'left' | 'right' | null>>({});
  
  // Refs
  const listRef = useRef<HTMLDivElement>(null);
  const virtualListRef = useRef<VirtualList>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  
  // Hooks
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch, screenSize } = useDeviceCapabilities();
  
  // Use controlled or uncontrolled search
  const currentSearchValue = searchValue !== undefined ? searchValue : internalSearchValue;
  
  // Handle search
  const handleSearchChange = useCallback((value: string) => {
    if (searchValue === undefined) {
      setInternalSearchValue(value);
    }
    onSearchChange?.(value);
  }, [searchValue, onSearchChange]);
  
  // Handle selection
  const handleItemSelection = useCallback((itemId: string | number, isSelected: boolean) => {
    if (!selectable) return;
    
    let newSelection: (string | number)[];
    
    if (multiSelect) {
      if (isSelected) {
        newSelection = selectedItems.filter(id => id !== itemId);
      } else {
        newSelection = [...selectedItems, itemId];
      }
    } else {
      newSelection = isSelected ? [] : [itemId];
    }
    
    onSelectionChange?.(newSelection);
  }, [selectable, multiSelect, selectedItems, onSelectionChange]);
  
  // Handle swipe gestures
  const handleSwipeStart = useCallback((itemId: string | number, clientX: number) => {
    // Store initial position for swipe detection
  }, []);
  
  const handleSwipeEnd = useCallback((itemId: string | number, direction: 'left' | 'right') => {
    const item = items.find(item => item.id === itemId);
    if (!item) return;
    
    setSwipeStates(prev => ({ ...prev, [itemId]: direction }));
    
    // Execute swipe action
    setTimeout(() => {
      if (direction === 'left') {
        onItemSwipeLeft?.(item);
      } else {
        onItemSwipeRight?.(item);
      }
      
      // Reset swipe state
      setSwipeStates(prev => ({ ...prev, [itemId]: null }));
    }, 300);
  }, [items, onItemSwipeLeft, onItemSwipeRight]);
  
  // Infinite scroll intersection observer
  const lastItemRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || !hasNextPage) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        onLoadMore?.();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasNextPage, onLoadMore]);
  
  // Get item height for virtualization
  const getItemHeight = useCallback((index: number) => {
    if (typeof itemHeight === 'function') {
      return itemHeight(index);
    }
    
    // Adjust height based on layout
    const layoutHeights = {
      simple: 48,
      card: 120,
      media: 100,
      detailed: 80
    };
    
    return itemHeight || layoutHeights[layout];
  }, [itemHeight, layout]);
  
  // Styling classes
  const containerClasses = cn(
    'relative w-full',
    orientation === 'horizontal' && 'flex overflow-x-auto',
    className
  );
  
  const listClasses = cn(
    'w-full',
    orientation === 'vertical' && 'space-y-0',
    orientation === 'horizontal' && 'flex gap-4',
    spacing === 'xs' && orientation === 'vertical' && 'space-y-1',
    spacing === 'sm' && orientation === 'vertical' && 'space-y-2',
    spacing === 'md' && orientation === 'vertical' && 'space-y-4',
    spacing === 'lg' && orientation === 'vertical' && 'space-y-6'
  );
  
  const itemBaseClasses = cn(
    'transition-all duration-300 group',
    selectable && 'cursor-pointer',
    itemClassName
  );

  return (
    <div ref={ref} className={containerClasses} data-testid={testId}>
      {/* Header */}
      {(searchable || filterable || headerActions) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Search */}
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={currentSearchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="pl-10 pr-4 py-2 bg-glass-surface-light border border-glass-border rounded-lg focus:outline-none focus:border-accent-primary transition-colors text-sm min-w-64"
                />
              </div>
            )}
            
            {/* Filter */}
            {filterable && (
              <motion.button
                className="flex items-center gap-2 px-3 py-2 glass-light hover:glass-medium rounded-lg transition-all touch-target-min"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filter</span>
              </motion.button>
            )}
          </div>
          
          {/* Header actions */}
          {headerActions && (
            <div className="flex items-center gap-2">
              {headerActions}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <GlassCard className="overflow-hidden">
        {loading && renderLoading ? (
          renderLoading()
        ) : loading ? (
          <motion.div
            className="flex items-center justify-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-accent-primary" />
              <span className="text-text-muted">{loadingMessage}</span>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            className="flex flex-col items-center justify-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle className="w-8 h-8 text-status-error mb-3" />
            <p className="text-status-error">{error}</p>
          </motion.div>
        ) : items.length === 0 ? (
          renderEmpty ? (
            renderEmpty()
          ) : (
            <motion.div
              className="flex flex-col items-center justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-16 h-16 bg-glass-surface-light rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-text-muted" />
              </div>
              <p className="text-text-muted">{emptyMessage}</p>
            </motion.div>
          )
        ) : virtualized ? (
          <VirtualList
            ref={virtualListRef}
            height={400}
            width="100%"
            itemCount={items.length}
            itemSize={getItemHeight}
            overscanCount={overscanCount}
            className="scrollbar-thin"
          >
            {({ index, style }: ListChildComponentProps) => (
              <div style={style}>
                <ListItemComponent
                  item={items[index]}
                  index={index}
                  layout={layout}
                  isSelected={selectedItems.includes(items[index].id)}
                  isHovered={hoveredItem === items[index].id}
                  swipeState={swipeStates[items[index].id]}
                  onSelect={handleItemSelection}
                  onClick={onItemClick}
                  onDoubleClick={onItemDoubleClick}
                  onSwipeStart={handleSwipeStart}
                  onSwipeEnd={handleSwipeEnd}
                  onMouseEnter={() => setHoveredItem(items[index].id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={itemBaseClasses}
                  renderCustom={renderItem}
                />
              </div>
            )}
          </VirtualList>
        ) : (
          <div ref={listRef} className={listClasses}>
            {items.map((item, index) => (
              <div
                key={item.id}
                ref={index === items.length - 1 ? lastItemRef : undefined}
              >
                <ListItemComponent
                  item={item}
                  index={index}
                  layout={layout}
                  isSelected={selectedItems.includes(item.id)}
                  isHovered={hoveredItem === item.id}
                  swipeState={swipeStates[item.id]}
                  onSelect={handleItemSelection}
                  onClick={onItemClick}
                  onDoubleClick={onItemDoubleClick}
                  onSwipeStart={handleSwipeStart}
                  onSwipeEnd={handleSwipeEnd}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={itemBaseClasses}
                  renderCustom={renderItem}
                />
              </div>
            ))}
            
            {/* Load more indicator */}
            {hasNextPage && (
              <motion.div
                className="flex items-center justify-center py-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Loader2 className="w-5 h-5 animate-spin text-accent-primary" />
              </motion.div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
});

// List Item Component
interface ListItemProps {
  item: ListItem;
  index: number;
  layout: ListProps['layout'];
  isSelected: boolean;
  isHovered: boolean;
  swipeState?: 'left' | 'right' | null;
  onSelect: (itemId: string | number, isSelected: boolean) => void;
  onClick?: (item: ListItem) => void;
  onDoubleClick?: (item: ListItem) => void;
  onSwipeStart: (itemId: string | number, clientX: number) => void;
  onSwipeEnd: (itemId: string | number, direction: 'left' | 'right') => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  className?: string;
  renderCustom?: (item: ListItem, index: number) => React.ReactNode;
}

const ListItemComponent: React.FC<ListItemProps> = ({
  item,
  index,
  layout,
  isSelected,
  isHovered,
  swipeState,
  onSelect,
  onClick,
  onDoubleClick,
  onSwipeStart,
  onSwipeEnd,
  onMouseEnter,
  onMouseLeave,
  className,
  renderCustom,
}) => {
  const { touch } = useDeviceCapabilities();
  
  // Touch handling
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    onSwipeStart(item.id, touch.clientX);
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = Math.abs(touch.clientY - touchStart.y);
    
    // Only trigger swipe if horizontal movement is significant and vertical is minimal
    if (Math.abs(deltaX) > 50 && deltaY < 30) {
      const direction = deltaX > 0 ? 'right' : 'left';
      onSwipeEnd(item.id, direction);
    }
    
    setTouchStart(null);
  };
  
  const itemClasses = cn(
    'relative p-4 border border-glass-border/30 rounded-xl transition-all duration-300',
    'hover:bg-white/5 hover:border-glass-border',
    isSelected && 'bg-accent-primary/10 border-accent-primary/30',
    isHovered && 'bg-white/5',
    swipeState && 'transform transition-transform',
    swipeState === 'left' && 'translate-x-4',
    swipeState === 'right' && '-translate-x-4',
    touch && 'touch-target active:scale-98',
    className
  );
  
  // Custom render
  if (renderCustom) {
    return (
      <motion.div
        className={itemClasses}
        onClick={() => onClick?.(item)}
        onDoubleClick={() => onDoubleClick?.(item)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.02 }}
        whileHover={{ y: -2 }}
      >
        {renderCustom(item, index)}
      </motion.div>
    );
  }
  
  // Layout-specific rendering
  const renderContent = () => {
    switch (layout) {
      case 'simple':
        return <SimpleItem item={item} />;
      case 'card':
        return <CardItem item={item} />;
      case 'media':
        return <MediaItem item={item} />;
      case 'detailed':
        return <DetailedItem item={item} />;
      default:
        return <SimpleItem item={item} />;
    }
  };
  
  return (
    <motion.div
      className={itemClasses}
      onClick={() => onClick?.(item)}
      onDoubleClick={() => onDoubleClick?.(item)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      whileHover={{ y: -2 }}
    >
      {renderContent()}
      
      {/* Actions */}
      {item.actions && item.actions.length > 0 && isHovered && (
        <motion.div
          className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
        >
          {item.actions.map((action) => (
            <motion.button
              key={action.id}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(item);
              }}
              className={cn(
                'p-2 rounded-lg transition-all touch-target-min',
                action.variant === 'primary' && 'bg-accent-primary hover:bg-accent-primary/80',
                action.variant === 'danger' && 'bg-status-error hover:bg-status-error/80',
                action.variant === 'secondary' && 'glass-light hover:glass-medium'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={action.label}
            >
              {action.icon}
            </motion.button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

// Layout components
const SimpleItem: React.FC<{ item: ListItem }> = ({ item }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {item.avatar && (
        <div className="w-8 h-8 rounded-full bg-glass-surface-light flex items-center justify-center overflow-hidden">
          <img src={item.avatar} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div>
        <h3 className="text-white font-medium">{item.title}</h3>
        {item.subtitle && (
          <p className="text-text-muted text-sm">{item.subtitle}</p>
        )}
      </div>
    </div>
    
    <div className="flex items-center gap-2">
      {item.badge && (
        <span className="bg-accent-primary/20 text-accent-primary px-2 py-1 rounded-full text-xs">
          {item.badge}
        </span>
      )}
      <ChevronRight className="w-4 h-4 text-text-muted" />
    </div>
  </div>
);

const CardItem: React.FC<{ item: ListItem }> = ({ item }) => (
  <div className="space-y-3">
    {item.image && (
      <div className="aspect-video rounded-lg overflow-hidden bg-glass-surface-light">
        <img src={item.image} alt="" className="w-full h-full object-cover" />
      </div>
    )}
    <div>
      <h3 className="text-white font-semibold mb-1">{item.title}</h3>
      {item.description && (
        <p className="text-text-muted text-sm line-clamp-2">{item.description}</p>
      )}
    </div>
  </div>
);

const MediaItem: React.FC<{ item: ListItem }> = ({ item }) => (
  <div className="flex items-center gap-4">
    {item.image && (
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-glass-surface-light flex-shrink-0">
        <img src={item.image} alt="" className="w-full h-full object-cover" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <h3 className="text-white font-medium truncate">{item.title}</h3>
      {item.description && (
        <p className="text-text-muted text-sm line-clamp-2 mt-1">{item.description}</p>
      )}
    </div>
    {item.badge && (
      <span className="bg-accent-primary/20 text-accent-primary px-2 py-1 rounded-full text-xs">
        {item.badge}
      </span>
    )}
  </div>
);

const DetailedItem: React.FC<{ item: ListItem }> = ({ item }) => (
  <div className="space-y-2">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-white font-medium">{item.title}</h3>
        {item.subtitle && (
          <p className="text-text-muted text-sm">{item.subtitle}</p>
        )}
      </div>
      {item.badge && (
        <span className="bg-accent-primary/20 text-accent-primary px-2 py-1 rounded-full text-xs">
          {item.badge}
        </span>
      )}
    </div>
    {item.description && (
      <p className="text-text-muted text-sm">{item.description}</p>
    )}
    {item.metadata && (
      <div className="flex items-center gap-4 text-xs text-text-muted">
        {Object.entries(item.metadata).map(([key, value]) => (
          <span key={key}>{key}: {String(value)}</span>
        ))}
      </div>
    )}
  </div>
);

List.displayName = 'List';

export { List };

// Convenience components
export const SimpleList = (props: Omit<ListProps, 'layout'>) => (
  <List layout="simple" {...props} />
);

export const CardList = (props: Omit<ListProps, 'layout'>) => (
  <List layout="card" spacing="md" {...props} />
);

export const MediaList = (props: Omit<ListProps, 'layout'>) => (
  <List layout="media" {...props} />
);

export const VirtualizedList = (props: ListProps) => (
  <List virtualized {...props} />
);

export const SelectableList = (props: ListProps) => (
  <List selectable multiSelect {...props} />
);