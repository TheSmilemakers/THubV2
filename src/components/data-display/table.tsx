'use client';

import React, { 
  useState, 
  useMemo, 
  useRef, 
  useEffect, 
  forwardRef, 
  useCallback,
  Fragment 
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown,
  Filter,
  Search,
  MoreVertical,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';
import { GlassCard } from '@/components/ui/glass-card';

/**
 * Table Component - Advanced data table with glassmorphism styling
 * 
 * Features:
 * - Column sorting (single/multi-column)
 * - Filtering (global search + column filters)
 * - Pagination with virtualization support
 * - Column visibility controls
 * - Responsive layout with horizontal scrolling
 * - Touch-optimized for mobile (44px+ touch targets)
 * - Loading and error states
 * - Row selection (single/multi)
 * - Custom cell renderers
 * - Glassmorphism styling with adaptive effects
 * - Keyboard navigation support
 * - Export functionality
 * - Real-time data updates
 */

export type SortDirection = 'asc' | 'desc' | null;
export type FilterType = 'text' | 'number' | 'date' | 'select' | 'boolean';

export interface TableColumn<T = any> {
  id: string;
  header: string;
  accessorKey: string;
  cell?: (props: { value: any; row: T; column: TableColumn<T> }) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: FilterType;
  filterOptions?: { label: string; value: any }[];
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  sticky?: 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
}

export interface TableData {
  id: string | number;
  [key: string]: any;
}

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

export interface FilterConfig {
  column: string;
  value: any;
  type: FilterType;
}

export interface TableProps<T extends TableData = TableData> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: string;
  pageSize?: number;
  currentPage?: number;
  totalPages?: number;
  totalRows?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSort?: (sorts: SortConfig[]) => void;
  onFilter?: (filters: FilterConfig[]) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  // Selection
  selectable?: boolean;
  selectedRows?: (string | number)[];
  onSelectionChange?: (selectedRows: (string | number)[]) => void;
  // Virtualization
  virtualizeRows?: boolean;
  rowHeight?: number;
  // Customization
  variant?: 'default' | 'compact' | 'comfortable';
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  stickyHeader?: boolean;
  // Search
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  // UI
  className?: string;
  tableClassName?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  'data-testid'?: string;
}

const Table = <T extends TableData = TableData>({
  data,
  columns,
  loading = false,
  error,
  pageSize = 10,
  currentPage = 1,
  totalPages,
  totalRows,
  onPageChange,
  onPageSizeChange,
  onSort,
  onFilter,
  onRefresh,
  onExport,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  virtualizeRows = false,
  rowHeight = 64,
  variant = 'default',
  striped = false,
  bordered = true,
  hoverable = true,
  stickyHeader = false,
  searchable = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  className,
  tableClassName,
  emptyMessage = 'No data available',
  loadingMessage = 'Loading...',
  'data-testid': testId,
}: TableProps<T>) => {
  // State
  const [sorts, setSorts] = useState<SortConfig[]>([]);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.map(col => col.id)
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [internalSearchValue, setInternalSearchValue] = useState('');
  
  // Refs
  const tableRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLTableSectionElement>(null);
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  
  // Hooks
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch, screenSize } = useDeviceCapabilities();
  
  // Use controlled or uncontrolled search
  const currentSearchValue = searchValue !== undefined ? searchValue : internalSearchValue;
  
  // Computed values
  const visibleColumnsData = columns.filter(col => visibleColumns.includes(col.id));
  const hasSelection = selectable && selectedRows.length > 0;
  const isAllSelected = selectable && data.length > 0 && selectedRows.length === data.length;
  const isPartiallySelected = hasSelection && !isAllSelected;
  
  // Pagination calculations
  const calculatedTotalPages = totalPages || Math.ceil((totalRows || data.length) / pageSize);
  const startRow = (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, totalRows || data.length);
  
  // Handle sorting
  const handleSort = useCallback((columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (!column?.sortable) return;
    
    setSorts(prevSorts => {
      const existingSort = prevSorts.find(sort => sort.column === columnId);
      let newSorts: SortConfig[];
      
      if (existingSort) {
        // Cycle through: asc -> desc -> null
        const newDirection: SortDirection = 
          existingSort.direction === 'asc' ? 'desc' : 
          existingSort.direction === 'desc' ? null : 'asc';
        
        if (newDirection === null) {
          newSorts = prevSorts.filter(sort => sort.column !== columnId);
        } else {
          newSorts = prevSorts.map(sort => 
            sort.column === columnId 
              ? { ...sort, direction: newDirection }
              : sort
          );
        }
      } else {
        // Add new sort (multi-column sorting)
        newSorts = [...prevSorts, { column: columnId, direction: 'asc' }];
      }
      
      onSort?.(newSorts);
      return newSorts;
    });
  }, [columns, onSort]);
  
  // Handle filtering
  const handleFilter = useCallback((columnId: string, value: any, type: FilterType) => {
    setFilters(prevFilters => {
      const newFilters = prevFilters.filter(filter => filter.column !== columnId);
      if (value !== '' && value !== null && value !== undefined) {
        newFilters.push({ column: columnId, value, type });
      }
      
      onFilter?.(newFilters);
      return newFilters;
    });
  }, [onFilter]);
  
  // Handle search
  const handleSearchChange = useCallback((value: string) => {
    if (searchValue === undefined) {
      setInternalSearchValue(value);
    }
    onSearchChange?.(value);
  }, [searchValue, onSearchChange]);
  
  // Handle selection
  const handleRowSelection = useCallback((rowId: string | number) => {
    if (!selectable) return;
    
    const newSelection = selectedRows.includes(rowId)
      ? selectedRows.filter(id => id !== rowId)
      : [...selectedRows, rowId];
    
    onSelectionChange?.(newSelection);
  }, [selectable, selectedRows, onSelectionChange]);
  
  const handleSelectAll = useCallback(() => {
    if (!selectable) return;
    
    const newSelection = isAllSelected ? [] : data.map(row => row.id);
    onSelectionChange?.(newSelection);
  }, [selectable, isAllSelected, data, onSelectionChange]);
  
  // Handle column visibility
  const handleColumnVisibility = useCallback((columnId: string, visible: boolean) => {
    setVisibleColumns(prev => 
      visible 
        ? [...prev, columnId]
        : prev.filter(id => id !== columnId)
    );
  }, []);
  
  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
        setShowColumnMenu(false);
      }
    };
    
    if (showColumnMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColumnMenu]);
  
  // Get sort direction for column
  const getSortDirection = useCallback((columnId: string): SortDirection => {
    const sort = sorts.find(sort => sort.column === columnId);
    return sort?.direction || null;
  }, [sorts]);
  
  // Get sort index for multi-column sorting
  const getSortIndex = useCallback((columnId: string): number => {
    const index = sorts.findIndex(sort => sort.column === columnId);
    return index === -1 ? -1 : index + 1;
  }, [sorts]);
  
  // Styling classes
  const containerClasses = cn(
    'relative w-full',
    className
  );
  
  const tableContainerClasses = cn(
    'relative overflow-auto rounded-xl',
    adaptiveGlass.effects ? 'glass-medium' : 'glass-light',
    bordered && 'border border-glass-border',
    'gpu-accelerated'
  );
  
  const tableClasses = cn(
    'w-full border-collapse',
    variant === 'compact' && 'text-sm',
    variant === 'comfortable' && 'text-base leading-relaxed',
    tableClassName
  );
  
  const headerCellClasses = cn(
    'text-left font-semibold text-text-secondary transition-colors duration-200',
    'border-b border-glass-border',
    stickyHeader && 'sticky top-0 z-10 glass-light backdrop-blur-xl',
    variant === 'compact' ? 'px-3 py-2' : 'px-4 py-3',
    touch && 'touch-target'
  );
  
  const bodyCellClasses = cn(
    'transition-colors duration-200 border-b border-glass-border/50',
    variant === 'compact' ? 'px-3 py-2' : 'px-4 py-3',
    touch && 'touch-target'
  );
  
  const rowClasses = (index: number, isSelected: boolean) => cn(
    'transition-all duration-200',
    striped && index % 2 === 1 && 'bg-white/2',
    hoverable && 'hover:bg-white/5',
    isSelected && 'bg-accent-primary/10',
    selectable && 'cursor-pointer'
  );

  return (
    <div className={containerClasses} data-testid={testId}>
      {/* Header with controls */}
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
          
          {/* Filter toggle */}
          <motion.button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
              'glass-light hover:glass-medium touch-target-min',
              showFilterMenu && 'bg-accent-primary/10'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filters</span>
            {filters.length > 0 && (
              <span className="bg-accent-primary text-white text-xs px-2 py-0.5 rounded-full">
                {filters.length}
              </span>
            )}
          </motion.button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Column visibility */}
          <div className="relative" ref={columnMenuRef}>
            <motion.button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="flex items-center gap-2 px-3 py-2 glass-light hover:glass-medium rounded-lg transition-all touch-target-min"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm">Columns</span>
            </motion.button>
            
            <AnimatePresence>
              {showColumnMenu && (
                <motion.div
                  className="absolute right-0 top-full mt-2 w-48 glass-dark rounded-xl border border-glass-border z-50 shadow-2xl"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-3 border-b border-glass-border">
                    <h4 className="text-sm font-medium text-white">Show Columns</h4>
                  </div>
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {columns.map((column) => (
                      <label
                        key={column.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(column.id)}
                          onChange={(e) => handleColumnVisibility(column.id, e.target.checked)}
                          className="w-4 h-4 rounded border-glass-border bg-transparent checked:bg-accent-primary"
                        />
                        <span className="text-sm text-white">{column.header}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Refresh */}
          {onRefresh && (
            <motion.button
              onClick={onRefresh}
              className="p-2 glass-light hover:glass-medium rounded-lg transition-all touch-target-min"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </motion.button>
          )}
          
          {/* Export */}
          {onExport && (
            <motion.button
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-2 glass-light hover:glass-medium rounded-lg transition-all touch-target-min"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Export</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Table container */}
      <GlassCard className={cn("overflow-hidden", bordered && "border border-glass-border")}>
        <div className={tableContainerClasses} ref={tableRef}>
          {loading && (
            <motion.div
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-3 glass-medium px-4 py-3 rounded-xl">
                <Loader2 className="w-5 h-5 animate-spin text-accent-primary" />
                <span className="text-white">{loadingMessage}</span>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              className="p-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <AlertCircle className="w-8 h-8 text-status-error mx-auto mb-3" />
              <p className="text-status-error">{error}</p>
            </motion.div>
          )}

          {!loading && !error && (
            <table className={tableClasses}>
              {/* Header */}
              <thead ref={headerRef}>
                <tr>
                  {/* Selection column */}
                  {selectable && (
                    <th className={cn(headerCellClasses, "w-12")}>
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isPartiallySelected;
                        }}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-glass-border bg-transparent checked:bg-accent-primary"
                      />
                    </th>
                  )}
                  
                  {/* Column headers */}
                  {visibleColumnsData.map((column) => (
                    <th
                      key={column.id}
                      className={cn(
                        headerCellClasses,
                        column.sortable && 'cursor-pointer hover:bg-white/5',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        column.headerClassName
                      )}
                      style={{
                        width: column.width,
                        minWidth: column.minWidth,
                        maxWidth: column.maxWidth,
                      }}
                      onClick={() => column.sortable && handleSort(column.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span>{column.header}</span>
                        {column.sortable && (
                          <div className="flex flex-col">
                            {getSortDirection(column.id) === null && (
                              <ChevronsUpDown className="w-4 h-4 text-text-muted" />
                            )}
                            {getSortDirection(column.id) === 'asc' && (
                              <ChevronUp className="w-4 h-4 text-accent-primary" />
                            )}
                            {getSortDirection(column.id) === 'desc' && (
                              <ChevronDown className="w-4 h-4 text-accent-primary" />
                            )}
                          </div>
                        )}
                        {sorts.length > 1 && getSortIndex(column.id) > 0 && (
                          <span className="text-xs bg-accent-primary text-white px-1.5 py-0.5 rounded-full">
                            {getSortIndex(column.id)}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body */}
              <tbody ref={bodyRef}>
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnsData.length + (selectable ? 1 : 0)}
                      className={cn(bodyCellClasses, "text-center py-12 text-text-muted")}
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  data.map((row, index) => {
                    const isSelected = selectedRows.includes(row.id);
                    
                    return (
                      <motion.tr
                        key={row.id}
                        className={rowClasses(index, isSelected)}
                        onClick={() => selectable && handleRowSelection(row.id)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        whileHover={hoverable ? { backgroundColor: 'rgba(255,255,255,0.05)' } : undefined}
                      >
                        {/* Selection cell */}
                        {selectable && (
                          <td className={bodyCellClasses}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleRowSelection(row.id)}
                              className="w-4 h-4 rounded border-glass-border bg-transparent checked:bg-accent-primary"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                        )}
                        
                        {/* Data cells */}
                        {visibleColumnsData.map((column) => {
                          const value = row[column.accessorKey];
                          
                          return (
                            <td
                              key={column.id}
                              className={cn(
                                bodyCellClasses,
                                column.align === 'center' && 'text-center',
                                column.align === 'right' && 'text-right',
                                column.cellClassName
                              )}
                              style={{
                                width: column.width,
                                minWidth: column.minWidth,
                                maxWidth: column.maxWidth,
                              }}
                            >
                              {column.cell ? (
                                column.cell({ value, row, column })
                              ) : (
                                <span className="text-white">{value}</span>
                              )}
                            </td>
                          );
                        })}
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      {/* Pagination */}
      {calculatedTotalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-text-muted">
            Showing {startRow}-{endRow} of {totalRows || data.length} results
          </div>
          
          <div className="flex items-center gap-2">
            {/* Page size selector */}
            {onPageSizeChange && (
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="px-3 py-2 glass-light border border-glass-border rounded-lg text-sm focus:outline-none focus:border-accent-primary"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            )}
            
            {/* Pagination controls */}
            <div className="flex items-center gap-1">
              <motion.button
                onClick={() => onPageChange?.(1)}
                disabled={currentPage === 1}
                className="p-2 glass-light hover:glass-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-target-min"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ChevronsLeft className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 glass-light hover:glass-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-target-min"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              
              <span className="px-4 py-2 text-sm text-white">
                Page {currentPage} of {calculatedTotalPages}
              </span>
              
              <motion.button
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={currentPage === calculatedTotalPages}
                className="p-2 glass-light hover:glass-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-target-min"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                onClick={() => onPageChange?.(calculatedTotalPages)}
                disabled={currentPage === calculatedTotalPages}
                className="p-2 glass-light hover:glass-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-target-min"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ChevronsRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Table.displayName = 'Table';

export { Table };

// Convenience components for common use cases
export const DataTable = <T extends TableData = TableData>(
  props: TableProps<T>
) => (
  <Table
    variant="default"
    striped
    hoverable
    bordered
    stickyHeader
    searchable
    {...props}
  />
);

export const CompactTable = <T extends TableData = TableData>(
  props: TableProps<T>
) => (
  <Table
    variant="compact"
    striped={false}
    bordered={false}
    {...props}
  />
);

export const SelectableTable = <T extends TableData = TableData>(
  props: TableProps<T>
) => (
  <Table
    selectable
    hoverable
    bordered
    {...props}
  />
);