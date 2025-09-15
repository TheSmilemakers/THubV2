/**
 * Screen Reader Only Component
 * Content that is only visible to screen readers
 * 
 * Features:
 * - Visually hidden but accessible to screen readers
 * - Maintains proper focus behavior
 * - Supports both inline and block content
 * - Optional focus visibility for debugging
 */
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  focusable?: boolean;
  showOnFocus?: boolean;
  className?: string;
  id?: string;
}

export function ScreenReaderOnly({
  children,
  as: Component = 'span',
  focusable = false,
  showOnFocus = false,
  className,
  id,
}: ScreenReaderOnlyProps) {
  return (
    <Component
      id={id}
      className={cn(
        // Standard screen reader only classes
        'absolute w-px h-px p-0 -m-px overflow-hidden',
        'clip-[rect(0,0,0,0)] border-0',
        // Show on focus if requested
        showOnFocus && 'focus:static focus:w-auto focus:h-auto focus:p-2',
        showOnFocus && 'focus:m-0 focus:overflow-visible focus:clip-auto',
        showOnFocus && 'focus:bg-background-primary focus:border focus:border-accent-primary',
        className
      )}
      tabIndex={focusable ? 0 : -1}
    >
      {children}
    </Component>
  );
}

// Convenience component for skip links
export interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <ScreenReaderOnly
      as="a"
      focusable
      showOnFocus
      className={cn(
        'z-50 font-medium text-accent-primary',
        'focus:top-4 focus:left-4 focus:rounded-lg',
        className
      )}
    >
      <a href={href}>{children}</a>
    </ScreenReaderOnly>
  );
}

// Component for announcing dynamic content changes
export interface LiveRegionProps {
  children: React.ReactNode;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
  className?: string;
}

export function LiveRegion({ 
  children, 
  priority = 'polite', 
  atomic = true,
  className 
}: LiveRegionProps) {
  return (
    <div
      aria-live={priority}
      aria-atomic={atomic}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
}