/**
 * Keyboard Navigation Components
 * Provides keyboard navigation patterns for lists, menus, and grids
 * 
 * Features:
 * - Arrow key navigation
 * - Home/End key support
 * - Type-ahead search
 * - Multiple selection support
 * - Grid navigation (2D)
 * - Roving tabindex management
 */
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAccessibility } from '@/lib/hooks/use-accessibility';

export interface KeyboardNavigationProps {
  children: React.ReactElement[];
  orientation?: 'horizontal' | 'vertical' | 'both';
  wrap?: boolean;
  typeAhead?: boolean;
  multiSelect?: boolean;
  defaultIndex?: number;
  onSelectionChange?: (selectedIndices: number[]) => void;
  onActiveChange?: (activeIndex: number) => void;
  className?: string;
  role?: 'listbox' | 'menu' | 'tablist' | 'grid';
}

export function KeyboardNavigation({
  children,
  orientation = 'vertical',
  wrap = true,
  typeAhead = false,
  multiSelect = false,
  defaultIndex = 0,
  onSelectionChange,
  onActiveChange,
  className,
  role = 'listbox',
}: KeyboardNavigationProps) {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [typeAheadQuery, setTypeAheadQuery] = useState('');
  const typeAheadTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const { handleArrowNavigation, announce } = useAccessibility();

  // Update item refs when children change
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, children.length);
  }, [children.length]);

  // Handle active index changes
  useEffect(() => {
    onActiveChange?.(activeIndex);
    
    // Focus the active item
    const activeItem = itemRefs.current[activeIndex];
    if (activeItem && document.activeElement !== activeItem) {
      activeItem.focus();
    }
  }, [activeIndex, onActiveChange]);

  // Handle selection changes
  useEffect(() => {
    onSelectionChange?.(Array.from(selectedIndices));
  }, [selectedIndices, onSelectionChange]);

  // Type-ahead search
  const handleTypeAhead = useCallback((query: string) => {
    if (!typeAhead) return;

    const matchingIndex = children.findIndex((child, index) => {
      const text = getItemText(child);
      return text.toLowerCase().startsWith(query.toLowerCase());
    });

    if (matchingIndex !== -1) {
      setActiveIndex(matchingIndex);
      announce(`${getItemText(children[matchingIndex])} selected`);
    }
  }, [typeAhead, children, announce]);

  // Get text content from a React element
  const getItemText = useCallback((element: React.ReactElement): string => {
    const props = element.props as any;
    if (typeof props.children === 'string') {
      return props.children;
    }
    
    // Extract text from nested elements
    const extractText = (node: any): string => {
      if (typeof node === 'string') return node;
      if (Array.isArray(node)) return node.map(extractText).join('');
      if (node?.props?.children) return extractText(node.props.children);
      return '';
    };

    return extractText(props.children);
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const items = itemRefs.current.filter(Boolean) as HTMLElement[];
    
    // Arrow navigation
    const newIndex = handleArrowNavigation(event, items, activeIndex, orientation);
    
    if (newIndex !== activeIndex) {
      setActiveIndex(wrap ? newIndex : Math.max(0, Math.min(newIndex, items.length - 1)));
      return;
    }

    // Selection handling
    switch (event.key) {
      case ' ':
      case 'Enter':
        event.preventDefault();
        if (multiSelect) {
          const newSelection = new Set(selectedIndices);
          if (newSelection.has(activeIndex)) {
            newSelection.delete(activeIndex);
          } else {
            newSelection.add(activeIndex);
          }
          setSelectedIndices(newSelection);
          announce(`${getItemText(children[activeIndex])} ${newSelection.has(activeIndex) ? 'selected' : 'deselected'}`);
        } else {
          setSelectedIndices(new Set([activeIndex]));
          announce(`${getItemText(children[activeIndex])} selected`);
        }
        break;

      case 'a':
      case 'A':
        if (multiSelect && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          const allIndices = new Set(children.map((_, index) => index));
          setSelectedIndices(allIndices);
          announce('All items selected');
        }
        break;

      default:
        // Type-ahead
        if (typeAhead && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          
          clearTimeout(typeAheadTimeoutRef.current);
          const newQuery = typeAheadQuery + event.key;
          setTypeAheadQuery(newQuery);
          handleTypeAhead(newQuery);
          
          // Clear query after delay
          typeAheadTimeoutRef.current = setTimeout(() => {
            setTypeAheadQuery('');
          }, 1000);
        }
        break;
    }
  }, [
    activeIndex,
    selectedIndices,
    children,
    orientation,
    wrap,
    multiSelect,
    typeAhead,
    typeAheadQuery,
    handleArrowNavigation,
    handleTypeAhead,
    announce,
    getItemText,
  ]);

  // Attach keyboard event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

  // Create enhanced children with proper props
  const enhancedChildren = children.map((child, index) => {
    const isActive = index === activeIndex;
    const isSelected = selectedIndices.has(index);

    return React.cloneElement(child, {
      key: index,
      ref: (el: HTMLElement | null) => {
        itemRefs.current[index] = el;
        // Call original ref if it exists
        const originalRef = (child as any).ref;
        if (typeof originalRef === 'function') {
          originalRef(el);
        } else if (originalRef?.current !== undefined) {
          originalRef.current = el;
        }
      },
      tabIndex: isActive ? 0 : -1,
      'aria-selected': role === 'listbox' ? isSelected : undefined,
      'aria-current': role === 'menu' ? (isActive ? 'true' : 'false') : undefined,
      'data-active': isActive,
      'data-selected': isSelected,
      onClick: (event: React.MouseEvent) => {
        setActiveIndex(index);
        if (multiSelect && (event.ctrlKey || event.metaKey)) {
          const newSelection = new Set(selectedIndices);
          if (newSelection.has(index)) {
            newSelection.delete(index);
          } else {
            newSelection.add(index);
          }
          setSelectedIndices(newSelection);
        } else {
          setSelectedIndices(new Set([index]));
        }
        
        // Call original onClick if it exists
        const props = child.props as any;
        props.onClick?.(event);
      },
    } as any);
  });

  return (
    <div
      ref={containerRef}
      className={className}
      role={role}
      aria-orientation={orientation !== 'both' ? orientation : undefined}
      aria-multiselectable={multiSelect}
      aria-activedescendant={`item-${activeIndex}`}
    >
      {enhancedChildren}
    </div>
  );
}

// Grid navigation for 2D layouts
export interface GridNavigationProps {
  children: React.ReactElement[][];
  onActiveChange?: (row: number, col: number) => void;
  onSelectionChange?: (selectedCells: [number, number][]) => void;
  defaultPosition?: [number, number];
  className?: string;
}

export function GridNavigation({
  children,
  onActiveChange,
  onSelectionChange,
  defaultPosition = [0, 0],
  className,
}: GridNavigationProps) {
  const [activePosition, setActivePosition] = useState(defaultPosition);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLElement | null)[][]>([]);

  const [activeRow, activeCol] = activePosition;

  // Initialize cell refs
  useEffect(() => {
    cellRefs.current = children.map(row => new Array(row.length).fill(null));
  }, [children]);

  // Handle position changes
  useEffect(() => {
    onActiveChange?.(activeRow, activeCol);
    
    const activeCell = cellRefs.current[activeRow]?.[activeCol];
    if (activeCell) {
      activeCell.focus();
    }
  }, [activeRow, activeCol, onActiveChange]);

  // Handle grid navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const maxRow = children.length - 1;
    const maxCol = Math.max(...children.map(row => row.length - 1));
    
    let newRow = activeRow;
    let newCol = activeCol;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        newRow = Math.max(0, activeRow - 1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        newRow = Math.min(maxRow, activeRow + 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        newCol = Math.max(0, activeCol - 1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        newCol = Math.min(children[activeRow]?.length - 1 || 0, activeCol + 1);
        break;
      case 'Home':
        event.preventDefault();
        if (event.ctrlKey) {
          newRow = 0;
          newCol = 0;
        } else {
          newCol = 0;
        }
        break;
      case 'End':
        event.preventDefault();
        if (event.ctrlKey) {
          newRow = maxRow;
          newCol = children[maxRow]?.length - 1 || 0;
        } else {
          newCol = children[activeRow]?.length - 1 || 0;
        }
        break;
    }

    if (newRow !== activeRow || newCol !== activeCol) {
      setActivePosition([newRow, newCol]);
    }
  }, [activeRow, activeCol, children]);

  // Attach keyboard event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

  // Create enhanced grid
  const enhancedGrid = children.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      const isActive = rowIndex === activeRow && colIndex === activeCol;
      const cellKey = `${rowIndex}-${colIndex}`;
      const isSelected = selectedCells.has(cellKey);

      return React.cloneElement(cell, {
        key: cellKey,
        ref: (el: HTMLElement | null) => {
          if (!cellRefs.current[rowIndex]) {
            cellRefs.current[rowIndex] = [];
          }
          cellRefs.current[rowIndex][colIndex] = el;
        },
        tabIndex: isActive ? 0 : -1,
        'aria-selected': isSelected,
        'data-active': isActive,
        'data-position': cellKey,
        onClick: (event: React.MouseEvent) => {
          setActivePosition([rowIndex, colIndex]);
          const props = cell.props as any;
          props.onClick?.(event);
        },
      } as any);
    })
  );

  return (
    <div
      ref={containerRef}
      className={className}
      role="grid"
      aria-rowcount={children.length}
      aria-colcount={Math.max(...children.map(row => row.length))}
    >
      {enhancedGrid.map((row, index) => (
        <div key={index} role="row" aria-rowindex={index + 1}>
          {row}
        </div>
      ))}
    </div>
  );
}