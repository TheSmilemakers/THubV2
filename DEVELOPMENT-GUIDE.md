# THub V2 Development Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Development Workflow](#development-workflow)
3. [Code Patterns](#code-patterns)
4. [Component Guidelines](#component-guidelines)
5. [Service Layer](#service-layer)
6. [State Management](#state-management)
7. [Real-time Features](#real-time-features)
8. [Testing Strategy](#testing-strategy)
9. [Performance Guidelines](#performance-guidelines)
10. [Troubleshooting](#troubleshooting)

## Architecture Overview

### System Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│   Supabase DB   │◀────│  n8n Workflows  │
│   (Frontend)    │     │  (PostgreSQL)   │     │  (Automation)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                        │
         │                       ▼                        │
         │              ┌─────────────────┐              │
         └─────────────▶│   EODHD API     │◀─────────────┘
                        │ (Market Data)   │
                        └─────────────────┘
```

### Data Flow Pipeline
1. **Market Scanning** (n8n) → Webhook → Analysis Queue
2. **3-Layer Analysis** → Technical (40%) + Sentiment (30%) + Liquidity (30%)
3. **Signal Generation** → Score ≥ 70 → Database Insert
4. **Real-time Updates** → WebSocket → UI Components

### Frontend Architecture
```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Protected routes
│   ├── (auth)/           # Auth routes
│   └── api/              # API endpoints
├── components/           # React components (49/58 complete)
│   ├── ui/              # Base UI components ✅
│   ├── auth/            # Authentication (6/6) ✅
│   ├── charts/          # Trading charts (8/8) ✅
│   ├── forms/           # Form library (10/10) ✅
│   ├── data/            # Data display (8/8) ✅
│   ├── dashboard/       # Dashboard features ✅
│   └── signals/         # Signal components ✅
├── lib/                 # Core libraries
│   ├── services/       # Business logic ✅
│   ├── hooks/         # Custom hooks
│   └── utils/         # Utilities & validation ✅
└── types/            # TypeScript types ✅
```

## Development Workflow

### 1. Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd trading-hub-v2

# Install dependencies (ALWAYS use pnpm via npx)
npx pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
npx pnpm db:migrate

# Generate TypeScript types
npx pnpm db:types

# Start development server
npx pnpm dev
```

### 2. Feature Development Flow
```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Implement feature following patterns
# 3. Run type checking
npx pnpm type-check

# 4. Test locally
npx pnpm dev

# 5. Build for production
npx pnpm build

# 6. Commit with conventional commits
git commit -m "feat: add new signal filtering"
```

### 3. Database Changes
```bash
# 1. Create migration file
supabase migration new your_migration_name

# 2. Write SQL in generated file

# 3. Apply migration locally
supabase db push

# 4. Generate new types
npx pnpm db:types

# 5. Update services/components with new types
```

## Code Patterns

### 1. Component Structure
```tsx
// components/dashboard/signal-card.tsx
'use client';

import { motion } from 'framer-motion';
import { Signal } from '@/types';
import { cn } from '@/lib/utils';

interface SignalCardProps {
  signal: Signal;
  onSelect?: (signal: Signal) => void;
  className?: string;
}

export function SignalCard({ signal, onSelect, className }: SignalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('glass-morphism', className)}
    >
      {/* Component content */}
    </motion.div>
  );
}
```

### 2. Service Pattern
```typescript
// lib/services/signals.service.ts
import { supabase } from '@/lib/supabase/client';
import { Signal, SignalQueryOptions } from '@/types';
import { logger } from '@/lib/logger';

export class SignalsService {
  async getSignals(options?: SignalQueryOptions): Promise<Signal[]> {
    try {
      const query = supabase
        .from('signals')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (options?.type) {
        query.eq('signal_type', options.type);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch signals', { error });
      throw error;
    }
  }
}

export const signalsService = new SignalsService();
```

### 3. Custom Hook Pattern
```typescript
// lib/hooks/use-signals.ts
import { useQuery } from '@tanstack/react-query';
import { signalsService } from '@/lib/services/signals.service';
import { SignalQueryOptions } from '@/types';

export function useSignals(options?: SignalQueryOptions) {
  return useQuery({
    queryKey: ['signals', options],
    queryFn: () => signalsService.getSignals(options),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  });
}
```

### 4. API Route Pattern
```typescript
// app/api/signals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { signalsService } from '@/lib/services/signals.service';
import { withAuth } from '@/lib/auth/middleware';

const querySchema = z.object({
  type: z.enum(['buy', 'sell']).optional(),
  strength: z.enum(['strong', 'moderate', 'weak']).optional(),
});

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));
    
    const signals = await signalsService.getSignals(query);
    
    return NextResponse.json({ signals });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch signals' },
      { status: 500 }
    );
  }
});
```

## Component Guidelines

### UI Component Library (Week 1 Complete - 32/32 Components)

The project includes a comprehensive component library with premium quality standards:

#### Authentication Components (6/6)
- **LoginForm**: Multi-provider OAuth, biometric support, remember me
- **RegisterForm**: Multi-step wizard, real-time validation, password strength
- **ForgotPasswordForm**: Secure recovery with rate limiting
- **ResetPasswordForm**: Token-based password reset
- **TwoFactorForm**: TOTP/SMS verification support
- **BiometricPrompt**: Touch/Face ID integration

#### Chart Components (8/8)
- **TradingChart**: Professional candlestick with indicators
- **SignalChart**: Signal overlays and annotations
- **PerformanceChart**: Portfolio performance tracking
- **HeatmapChart**: Market sector visualization
- **CorrelationMatrix**: Asset correlation analysis
- **VolumeProfile**: Volume distribution charts
- **DepthChart**: Order book visualization
- **SparklineChart**: Inline trend indicators

#### Form Components (10/10)
- **Form**: Base form with Zod validation
- **Input**: 15+ variants (text, password, search, etc.)
- **Select**: Searchable, grouped, multi-select
- **DatePicker**: Range selection, time support
- **Slider**: Multi-handle, stepped values
- **Switch**: Animated toggle states
- **RadioGroup**: Custom styled radio options
- **Checkbox**: Tri-state support
- **FileUpload**: Drag & drop with preview
- **ColorPicker**: HSL/RGB/HEX support

#### Data Display Components (8/8)
- **DataTable**: Virtual scrolling for 100k+ rows
- **VirtualList**: Infinite scroll with dynamic heights
- **Timeline**: Activity feed with timestamps
- **StatCard**: Animated metric displays
- **ProgressRing**: Circular progress indicators
- **Badge**: Status and category indicators
- **Tag**: Removable tag components
- **Tooltip**: Context-aware tooltips

### 1. Glassmorphism Effects
```css
/* Base glass effect */
.glass-morphism {
  @apply relative overflow-hidden rounded-xl border border-white/10;
  background: rgba(30, 30, 40, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* Multi-layer glass */
.glass-morphism-multi {
  @apply glass-morphism;
  box-shadow: 
    0 8px 32px 0 rgba(31, 38, 135, 0.37),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

/* Performance optimization for mobile */
@media (max-width: 768px) {
  .glass-morphism {
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
}
```

### 2. Animation Guidelines
```typescript
// Shared animation variants
export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Usage in component
<motion.div
  variants={staggerContainer}
  initial="hidden"
  animate="visible"
>
  {items.map((item) => (
    <motion.div key={item.id} variants={fadeInUp}>
      {/* Content */}
    </motion.div>
  ))}
</motion.div>
```

### 3. Responsive Design
```tsx
// Mobile-first approach
<div className="
  grid grid-cols-1 gap-4
  sm:grid-cols-2 sm:gap-6
  lg:grid-cols-3 lg:gap-8
  xl:grid-cols-4
">
  {/* Grid items */}
</div>

// Touch-optimized buttons
<button className="
  min-h-[44px] min-w-[44px] 
  px-6 py-3
  tap-highlight-transparent
  active:scale-95 transition-transform
">
  Click Me
</button>
```

## Service Layer

### 1. Service Structure
```typescript
// Base service class
export abstract class BaseService {
  protected async handleError(error: unknown, context: string) {
    logger.error(`${context} error`, { error });
    if (error instanceof Error) {
      throw new AppError(error.message, context);
    }
    throw new AppError('Unknown error', context);
  }
}

// Concrete service
export class MarketDataService extends BaseService {
  private cache = new CacheService();
  
  async getMarketData(symbol: string) {
    const cached = await this.cache.get(`market:${symbol}`);
    if (cached) return cached;
    
    try {
      const data = await this.fetchFromAPI(symbol);
      await this.cache.set(`market:${symbol}`, data, 60); // 1 minute
      return data;
    } catch (error) {
      await this.handleError(error, 'getMarketData');
    }
  }
}
```

### 2. Error Handling
```typescript
// Custom error classes
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'AUTH_ERROR', 401);
  }
}
```

## State Management

### 1. Client State (UI)
```typescript
// Use local state for UI-only concerns
const [isOpen, setIsOpen] = useState(false);
const [filter, setFilter] = useState<FilterOptions>({});

// Use context for shared UI state
const ThemeContext = createContext<ThemeContextType>();
```

### 2. Server State (Data)
```typescript
// React Query for server state
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

// Optimistic updates
const mutation = useMutation({
  mutationFn: signalsService.updateSignal,
  onMutate: async (newSignal) => {
    await queryClient.cancelQueries({ queryKey: ['signals'] });
    const previous = queryClient.getQueryData(['signals']);
    queryClient.setQueryData(['signals'], (old) => [...old, newSignal]);
    return { previous };
  },
  onError: (err, newSignal, context) => {
    queryClient.setQueryData(['signals'], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['signals'] });
  },
});
```

## Real-time Features

### 1. WebSocket Setup
```typescript
// lib/services/realtime.service.ts
export class RealtimeService {
  private channel: RealtimeChannel | null = null;

  subscribeToSignals(callback: (signal: Signal) => void) {
    this.channel = supabase
      .channel('signals')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'signals' },
        (payload) => callback(payload.new as Signal)
      )
      .subscribe();
  }

  unsubscribe() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }
  }
}
```

### 2. Real-time Hook
```typescript
// lib/hooks/use-realtime-signals.ts
export function useRealtimeSignals() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const realtime = new RealtimeService();
    
    realtime.subscribeToSignals((newSignal) => {
      queryClient.setQueryData(['signals'], (old: Signal[]) => {
        return [newSignal, ...old];
      });
      
      // Show notification
      toast.success(`New ${newSignal.signal_type} signal for ${newSignal.symbol}`);
    });
    
    return () => realtime.unsubscribe();
  }, [queryClient]);
}
```

## Testing Strategy

### 1. Unit Tests
```typescript
// lib/services/__tests__/signals.service.test.ts
describe('SignalsService', () => {
  it('should fetch signals with filters', async () => {
    const signals = await signalsService.getSignals({ type: 'buy' });
    expect(signals).toBeInstanceOf(Array);
    expect(signals.every(s => s.signal_type === 'buy')).toBe(true);
  });
});
```

### 2. Integration Tests
```typescript
// app/api/signals/__tests__/route.test.ts
describe('GET /api/signals', () => {
  it('should return signals for authenticated user', async () => {
    const response = await fetch('/api/signals', {
      headers: { Authorization: 'Bearer token' },
    });
    expect(response.status).toBe(200);
  });
});
```

### 3. E2E Tests
```typescript
// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test('dashboard shows active signals', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('Active Signals')).toBeVisible();
  await expect(page.locator('[data-testid="signal-card"]')).toHaveCount(5);
});
```

## Performance Guidelines

### Performance Validation Requirements

**CRITICAL**: All performance claims must be validated with actual measurements.

#### Testing Tools Available
1. **Performance Measurement Suite**
   - Location: `/src/lib/utils/performance-measurement.ts`
   - Provides real-time FPS tracking and frame analysis
   
2. **Mobile Testing Utilities**
   - Location: `/src/lib/utils/mobile-testing.ts`
   - Device-specific performance validation

3. **Developer Testing Interface**
   - URL: `http://localhost:3000/dev/testing`
   - Manual performance validation with visual feedback

4. **CI/CD Performance Tests**
   ```bash
   npm run test:performance     # Local testing
   npm run test:performance:ci  # CI/CD integration
   ```

#### Validation Process
1. Before claiming any performance metric, measure it
2. Use the `/dev/testing` interface for manual validation
3. Document actual FPS measurements, not theoretical limits
4. Test on real devices or accurate emulation
5. Run performance tests in CI/CD pipeline

#### Performance Standards
- Desktop: 60fps minimum
- Mobile high-end: 60fps target
- Mobile mid-range: 30fps minimum
- Touch latency: <50ms
- No performance claims without measurement data

### 1. Code Splitting
```typescript
// Dynamic imports for heavy components
const ChartComponent = dynamic(() => import('@/components/charts/chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
```

### 2. Image Optimization
```tsx
import Image from 'next/image';

<Image
  src="/hero-image.jpg"
  alt="Trading dashboard"
  width={1200}
  height={600}
  priority
  placeholder="blur"
  blurDataURL={blurDataUrl}
/>
```

### 3. Bundle Optimization
```javascript
// next.config.ts
module.exports = {
  experimental: {
    optimizePackageImports: ['framer-motion', '@heroicons/react'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};
```

## Troubleshooting

### Common Issues

1. **TypeScript Errors**
   ```bash
   # Regenerate types
   npx pnpm db:types
   # Clear TypeScript cache
   rm -rf tsconfig.tsbuildinfo
   npx pnpm type-check
   ```

2. **Database Connection Issues**
   ```bash
   # Check Supabase status
   supabase status
   # Reset local database
   supabase db reset
   ```

3. **Build Failures**
   ```bash
   # Clear all caches
   rm -rf .next node_modules
   npx pnpm install
   npx pnpm build
   ```

4. **WebSocket Connection Issues**
   - Check Supabase Realtime is enabled
   - Verify authentication token is valid
   - Check browser console for connection errors

### Debug Mode
```typescript
// Enable debug logging
if (process.env.NODE_ENV === 'development') {
  localStorage.setItem('debug', 'app:*');
}
```

### Performance Profiling
```typescript
// Use React DevTools Profiler
import { Profiler } from 'react';

<Profiler id="SignalsList" onRender={onRenderCallback}>
  <SignalsList />
</Profiler>
```

## Best Practices

1. **Always use TypeScript** - No `any` types
2. **Follow mobile-first design** - Test on real devices
3. **Optimize for performance** - Lazy load, memoize, virtualize
4. **Handle errors gracefully** - Show user-friendly messages
5. **Write meaningful commits** - Use conventional commits
6. **Document complex logic** - Add JSDoc comments
7. **Test critical paths** - Focus on user journeys
8. **Monitor performance** - Use analytics and monitoring

---

*For more specific guides, see the documentation in the `/docs` directory.*