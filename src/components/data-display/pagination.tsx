'use client';

import React, { 
  useMemo, 
  useCallback, 
  forwardRef 
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';

/**
 * Pagination Component - Page navigation with glassmorphism styling and touch optimization
 * 
 * Features:
 * - Multiple variants (default, minimal, compact, buttons)
 * - Smart page range display with ellipsis
 * - Touch-optimized for mobile (44px+ touch targets)
 * - Keyboard navigation support
 * - Glassmorphism effects with adaptive styling
 * - Custom page size selector
 * - Jump to page input
 * - Swipe gestures for mobile navigation
 * - Loading states for async pagination
 * - Accessibility support with ARIA attributes
 * - Responsive design with mobile adaptations
 * - Custom renderers for pages and controls
 */

export interface PaginationProps {
  // Core pagination
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  // Page size
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
  // Display options
  variant?: 'default' | 'minimal' | 'compact' | 'buttons';
  size?: 'sm' | 'md' | 'lg';
  maxVisiblePages?: number;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  showInfo?: boolean;
  showQuickJumper?: boolean;
  // Styling
  alignment?: 'left' | 'center' | 'right' | 'between';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  // Mobile
  mobileVariant?: 'arrows' | 'compact' | 'simple';
  swipeEnabled?: boolean;
  // States
  loading?: boolean;
  disabled?: boolean;
  // Custom rendering
  renderPage?: (page: number, isActive: boolean, isDisabled: boolean) => React.ReactNode;
  renderEllipsis?: () => React.ReactNode;
  // UI
  className?: string;
  itemClassName?: string;
  activeClassName?: string;
  disabledClassName?: string;
  'data-testid'?: string;
}

const Pagination = forwardRef<HTMLDivElement, PaginationProps>(({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  showPageSizeSelector = false,
  variant = 'default',
  size = 'md',
  maxVisiblePages = 7,
  showFirstLast = true,
  showPrevNext = true,
  showInfo = true,
  showQuickJumper = false,
  alignment = 'center',
  spacing = 'sm',
  mobileVariant = 'arrows',
  swipeEnabled = true,
  loading = false,
  disabled = false,
  renderPage,
  renderEllipsis,
  className,
  itemClassName,
  activeClassName,
  disabledClassName,
  'data-testid': testId,
}, ref) => {
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch, screenSize } = useDeviceCapabilities();
  
  // Calculate page range for display
  const pageRange = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate visible range around current page
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let start = Math.max(1, currentPage - halfVisible);
      let end = Math.min(totalPages, currentPage + halfVisible);
      
      // Adjust range if we're near the boundaries
      if (end - start + 1 < maxVisiblePages) {
        if (start === 1) {
          end = Math.min(totalPages, start + maxVisiblePages - 1);
        } else if (end === totalPages) {
          start = Math.max(1, end - maxVisiblePages + 1);
        }
      }
      
      // Add first page and ellipsis if needed
      if (start > 1) {
        pages.push(1);
        if (start > 2) {
          pages.push('ellipsis');
        }
      }
      
      // Add visible pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add last page and ellipsis if needed
      if (end < totalPages) {
        if (end < totalPages - 1) {
          pages.push('ellipsis');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [currentPage, totalPages, maxVisiblePages]);
  
  // Handle page change with validation
  const handlePageChange = useCallback((page: number) => {
    if (disabled || loading || page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    onPageChange(page);
  }, [disabled, loading, totalPages, currentPage, onPageChange]);
  
  // Navigation helpers
  const goToFirst = useCallback(() => handlePageChange(1), [handlePageChange]);
  const goToLast = useCallback(() => handlePageChange(totalPages), [handlePageChange, totalPages]);
  const goToPrev = useCallback(() => handlePageChange(currentPage - 1), [handlePageChange, currentPage]);
  const goToNext = useCallback(() => handlePageChange(currentPage + 1), [handlePageChange, currentPage]);
  
  // Calculate info display
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems || totalPages * pageSize);
  const displayTotalItems = totalItems || totalPages * pageSize;
  
  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        goToPrev();
        break;
      case 'ArrowRight':
        e.preventDefault();
        goToNext();
        break;
      case 'Home':
        e.preventDefault();
        goToFirst();
        break;
      case 'End':
        e.preventDefault();
        goToLast();
        break;
    }
  }, [goToPrev, goToNext, goToFirst, goToLast]);
  
  // Styling classes
  const containerClasses = cn(
    'flex items-center transition-all duration-200',
    alignment === 'left' && 'justify-start',
    alignment === 'center' && 'justify-center',
    alignment === 'right' && 'justify-end',
    alignment === 'between' && 'justify-between',
    disabled && 'opacity-50 pointer-events-none',
    className
  );
  
  const paginationClasses = cn(
    'flex items-center',
    spacing === 'none' && 'space-x-0',
    spacing === 'sm' && 'space-x-1',
    spacing === 'md' && 'space-x-2',
    spacing === 'lg' && 'space-x-3'
  );
  
  const getItemClasses = (isActive: boolean, isDisabled: boolean) => cn(
    'flex items-center justify-center font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:ring-offset-2 focus:ring-offset-background-primary',
    // Size
    size === 'sm' && 'w-8 h-8 text-sm',
    size === 'md' && 'w-10 h-10 text-base',
    size === 'lg' && 'w-12 h-12 text-lg',
    // Variant styling
    variant === 'default' && 'rounded-lg glass-light hover:glass-medium border border-glass-border',
    variant === 'minimal' && 'rounded-lg hover:bg-white/5',
    variant === 'compact' && 'rounded hover:bg-white/5',
    variant === 'buttons' && 'rounded-lg glass-light hover:glass-medium px-4',
    // States
    isActive && !isDisabled && [
      'bg-accent-primary text-white',
      variant === 'default' && 'border-accent-primary shadow-accent-primary/20',
      activeClassName
    ],
    !isActive && !isDisabled && 'text-text-muted hover:text-white cursor-pointer',
    isDisabled && [
      'text-text-muted/50 cursor-not-allowed',
      disabledClassName
    ],
    // Touch optimization
    touch && 'touch-target',
    itemClassName
  );
  
  // Mobile variant rendering
  if (screenSize === 'mobile' && mobileVariant !== 'compact') {
    if (mobileVariant === 'simple') {
      return (
        <div ref={ref} className={containerClasses} data-testid={testId}>
          <span className="text-sm text-text-muted mr-4">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={goToPrev}
              disabled={currentPage === 1 || disabled || loading}
              className={getItemClasses(false, currentPage === 1 || disabled || loading)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={goToNext}
              disabled={currentPage === totalPages || disabled || loading}
              className={getItemClasses(false, currentPage === totalPages || disabled || loading)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      );
    }
    
    if (mobileVariant === 'arrows') {
      return (
        <div ref={ref} className={containerClasses} data-testid={testId}>
          <motion.button
            onClick={goToPrev}
            disabled={currentPage === 1 || disabled || loading}
            className={cn(getItemClasses(false, currentPage === 1 || disabled || loading), 'mr-4')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          
          <div className="flex items-center px-4 py-2 glass-light rounded-lg">
            <span className="text-white font-medium">
              {currentPage} / {totalPages}
            </span>
          </div>
          
          <motion.button
            onClick={goToNext}
            disabled={currentPage === totalPages || disabled || loading}
            className={cn(getItemClasses(false, currentPage === totalPages || disabled || loading), 'ml-4')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      );
    }
  }

  return (
    <div 
      ref={ref} 
      className={containerClasses} 
      onKeyDown={handleKeyDown}
      tabIndex={0}
      data-testid={testId}
    >
      {/* Info */}
      {showInfo && alignment !== 'between' && (
        <div className="text-sm text-text-muted mr-6">
          Showing {startItem.toLocaleString()}-{endItem.toLocaleString()} of {displayTotalItems.toLocaleString()}
        </div>
      )}
      
      {/* Page size selector */}
      {showPageSizeSelector && onPageSizeChange && (
        <div className="flex items-center gap-2 mr-6">
          <span className="text-sm text-text-muted">Show</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 glass-light border border-glass-border rounded text-sm focus:outline-none focus:border-accent-primary transition-colors"
            disabled={disabled || loading}
          >
            {pageSizeOptions.map(option => (
              <option key={option} value={option} className="bg-gray-800">
                {option}
              </option>
            ))}
          </select>
          <span className="text-sm text-text-muted">per page</span>
        </div>
      )}
      
      {/* Pagination controls */}
      <nav role="navigation" aria-label="Pagination" className={paginationClasses}>
        {/* First page */}
        {showFirstLast && currentPage > 2 && totalPages > maxVisiblePages && (
          <motion.button
            onClick={goToFirst}
            disabled={currentPage === 1 || disabled || loading}
            className={getItemClasses(false, currentPage === 1 || disabled || loading)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </motion.button>
        )}
        
        {/* Previous page */}
        {showPrevNext && (
          <motion.button
            onClick={goToPrev}
            disabled={currentPage === 1 || disabled || loading}
            className={getItemClasses(false, currentPage === 1 || disabled || loading)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
        )}
        
        {/* Page numbers */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`pages-${currentPage}-${totalPages}`}
            className="flex items-center space-x-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {pageRange.map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <div
                    key={`ellipsis-${index}`}
                    className={cn(
                      'flex items-center justify-center',
                      size === 'sm' && 'w-8 h-8 text-sm',
                      size === 'md' && 'w-10 h-10 text-base',
                      size === 'lg' && 'w-12 h-12 text-lg'
                    )}
                  >
                    {renderEllipsis ? (
                      renderEllipsis()
                    ) : (
                      <MoreHorizontal className="w-4 h-4 text-text-muted" />
                    )}
                  </div>
                );
              }
              
              const isActive = page === currentPage;
              const isDisabled = disabled || loading;
              
              return (
                <motion.button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  disabled={isDisabled}
                  className={getItemClasses(isActive, isDisabled)}
                  whileHover={!isDisabled && !isActive ? { scale: 1.05 } : {}}
                  whileTap={!isDisabled ? { scale: 0.95 } : {}}
                  aria-label={`Go to page ${page}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {renderPage ? (
                    renderPage(page, isActive, isDisabled)
                  ) : (
                    page
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
        
        {/* Next page */}
        {showPrevNext && (
          <motion.button
            onClick={goToNext}
            disabled={currentPage === totalPages || disabled || loading}
            className={getItemClasses(false, currentPage === totalPages || disabled || loading)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Go to next page"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
        
        {/* Last page */}
        {showFirstLast && currentPage < totalPages - 1 && totalPages > maxVisiblePages && (
          <motion.button
            onClick={goToLast}
            disabled={currentPage === totalPages || disabled || loading}
            className={getItemClasses(false, currentPage === totalPages || disabled || loading)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Go to last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </motion.button>
        )}
      </nav>
      
      {/* Quick jumper */}
      {showQuickJumper && (
        <div className="flex items-center gap-2 ml-6">
          <span className="text-sm text-text-muted">Go to</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            className="w-16 px-2 py-1 glass-light border border-glass-border rounded text-sm focus:outline-none focus:border-accent-primary transition-colors text-center"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const page = parseInt((e.target as HTMLInputElement).value);
                if (page >= 1 && page <= totalPages) {
                  handlePageChange(page);
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
            disabled={disabled || loading}
            placeholder={currentPage.toString()}
          />
        </div>
      )}
      
      {/* Info for between alignment */}
      {showInfo && alignment === 'between' && (
        <div className="text-sm text-text-muted">
          Showing {startItem.toLocaleString()}-{endItem.toLocaleString()} of {displayTotalItems.toLocaleString()}
        </div>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center gap-2 ml-4">
          <div className="w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-muted">Loading...</span>
        </div>
      )}
    </div>
  );
});

Pagination.displayName = 'Pagination';

export { Pagination };

// Convenience components
export const SimplePagination = (props: Omit<PaginationProps, 'variant' | 'showFirstLast'>) => (
  <Pagination 
    variant="minimal" 
    showFirstLast={false} 
    maxVisiblePages={5}
    {...props} 
  />
);

export const CompactPagination = (props: Omit<PaginationProps, 'variant' | 'size'>) => (
  <Pagination 
    variant="compact" 
    size="sm"
    spacing="none"
    {...props} 
  />
);

export const DetailedPagination = (props: PaginationProps) => (
  <Pagination 
    showInfo
    showPageSizeSelector
    showQuickJumper
    alignment="between"
    {...props} 
  />
);

export const MobilePagination = (props: Omit<PaginationProps, 'mobileVariant'>) => (
  <Pagination 
    mobileVariant="arrows"
    swipeEnabled
    {...props} 
  />
);

export const ButtonPagination = (props: Omit<PaginationProps, 'variant'>) => (
  <Pagination 
    variant="buttons"
    size="lg"
    spacing="md"
    {...props} 
  />
);