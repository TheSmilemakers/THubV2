'use client';

import React, { useEffect, useRef, useState } from 'react';

interface IntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
  skip?: boolean;
}

/**
 * Hook for intersection observer optimization
 * Only renders expensive components when they're visible
 */
export function useIntersectionObserver(
  options: IntersectionObserverOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true,
    skip = false
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    if (skip) {
      setIsIntersecting(true);
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);

        if (isVisible && !hasIntersected) {
          setHasIntersected(true);
        }

        if (triggerOnce && isVisible) {
          observer.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, skip, hasIntersected]);

  return {
    elementRef,
    isIntersecting,
    hasIntersected,
    shouldRender: triggerOnce ? hasIntersected : isIntersecting,
  };
}

/**
 * Hook for performance-aware component rendering
 * Combines intersection observer with device capabilities
 */
export function useOptimizedRender(options: IntersectionObserverOptions = {}) {
  const intersection = useIntersectionObserver(options);
  
  return {
    ...intersection,
    // For very expensive components, only render when actually visible
    shouldRenderExpensive: intersection.isIntersecting,
    // For regular components, render when intersected once
    shouldRenderNormal: intersection.shouldRender,
  };
}

/**
 * HOC for lazy component rendering
 * Note: This should be used in .tsx files, not .ts files
 */
export function withIntersectionObserver<P extends object>(
  Component: React.ComponentType<P>,
  options: IntersectionObserverOptions & {
    fallback?: React.ComponentType<P>;
    placeholder?: React.ReactNode;
  } = {}
): React.FC<P> {
  const { fallback: Fallback, placeholder, ...observerOptions } = options;

  return function IntersectionObserverWrapper(props: P): React.ReactElement {
    const { elementRef, shouldRender } = useIntersectionObserver(observerOptions);

    if (!shouldRender) {
      return React.createElement(
        'div',
        { ref: elementRef as React.RefObject<HTMLDivElement>, style: { minHeight: '200px' } },
        Fallback ? React.createElement(Fallback, props) : placeholder
      );
    }

    return React.createElement(
      'div',
      { ref: elementRef as React.RefObject<HTMLDivElement> },
      React.createElement(Component, props)
    );
  };
}