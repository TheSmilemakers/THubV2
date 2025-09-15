'use client';

import React, { Suspense } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { usePerformanceTier } from '@/lib/hooks';

/**
 * SuspenseWrapper - Combines Suspense with Error Boundary
 * 
 * Features:
 * - Wraps components with both Suspense and Error Boundary
 * - Performance-aware fallback selection
 * - Customizable loading and error states
 * - Automatic retry mechanisms
 */

export interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onRetry?: () => void;
  retryable?: boolean;
  className?: string;
  'data-testid'?: string;
}

export const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({
  children,
  fallback,
  errorFallback,
  onError,
  onRetry,
  retryable = true,
  className,
  'data-testid': testId,
}) => {
  const performanceTier = usePerformanceTier();

  // Default fallback based on performance tier
  const defaultFallback = fallback || (
    <div className={className} data-testid={testId}>
      {performanceTier === 'low' ? (
        <div className="animate-pulse bg-gray-800/50 rounded-lg h-32" />
      ) : (
        <div className="glass-light backdrop-blur-sm rounded-xl p-6 animate-pulse">
          <div className="space-y-3">
            <div className="h-4 bg-white/20 rounded w-3/4" />
            <div className="h-4 bg-white/20 rounded w-1/2" />
            <div className="h-4 bg-white/20 rounded w-5/6" />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ErrorBoundary 
      fallback={errorFallback}
      onError={onError}
    >
      <Suspense fallback={defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * Specialized suspense wrappers for different components
 */

export const SignalSuspense: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}> = ({ children, fallback, className }) => (
  <SuspenseWrapper
    fallback={fallback}
    className={className}
    onError={(error) => {
      console.error('Signal loading error:', error);
      // Track error for monitoring
    }}
    retryable={true}
  >
    {children}
  </SuspenseWrapper>
);

export const DashboardSuspense: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}> = ({ children, fallback, className }) => (
  <SuspenseWrapper
    fallback={fallback}
    className={className}
    onError={(error) => {
      console.error('Dashboard loading error:', error);
      // Track error for monitoring
    }}
    retryable={true}
  >
    {children}
  </SuspenseWrapper>
);

export const ChartSuspense: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}> = ({ children, fallback, className }) => (
  <SuspenseWrapper
    fallback={fallback}
    className={className}
    onError={(error) => {
      console.error('Chart loading error:', error);
      // Track error for monitoring
    }}
    retryable={true}
  >
    {children}
  </SuspenseWrapper>
);

/**
 * High-performance suspense for critical path components
 */
export const CriticalSuspense: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}> = ({ children, fallback, className }) => {
  const performanceTier = usePerformanceTier();

  // Optimized fallback for critical components
  const criticalFallback = fallback || (
    <div className={className}>
      {performanceTier === 'high' ? (
        <div className="glass-surface backdrop-blur-lg rounded-xl p-6 animate-pulse">
          <div className="shimmer-effect h-20 rounded-lg" />
        </div>
      ) : (
        <div className="bg-gray-800/30 rounded-lg p-6 animate-pulse">
          <div className="h-20 bg-gray-700/50 rounded" />
        </div>
      )}
    </div>
  );

  return (
    <SuspenseWrapper
      fallback={criticalFallback}
      className={className}
      onError={(error) => {
        console.error('Critical component error:', error);
        // Priority error tracking
      }}
      retryable={true}
    >
      {children}
    </SuspenseWrapper>
  );
};

/**
 * Lazy loading wrapper with intersection observer
 */
export const LazyLoadSuspense: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  threshold?: number;
}> = ({ children, fallback, className, threshold = 0.1 }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? (
        <SuspenseWrapper fallback={fallback}>
          {children}
        </SuspenseWrapper>
      ) : (
        fallback || <div className="h-32 bg-gray-800/20 rounded-lg animate-pulse" />
      )}
    </div>
  );
};