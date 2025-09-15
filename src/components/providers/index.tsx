'use client';

import { type ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { ProgressiveEnhancementProvider } from './progressive-enhancement-provider';
import { HighContrastProvider } from '@/components/accessibility/high-contrast';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <ProgressiveEnhancementProvider>
          <HighContrastProvider>
            {children}
          </HighContrastProvider>
        </ProgressiveEnhancementProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}