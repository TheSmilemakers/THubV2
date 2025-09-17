# AGENT-QUICK-REFERENCE.md - Quick Command Reference

## 🚀 Essential Commands

### Development
```bash
npx pnpm dev              # Start dev server (http://localhost:3000)
npx pnpm build            # Production build
npx pnpm start            # Start production server
```

### Validation (RUN THESE CONSTANTLY)
```bash
npx pnpm type-check       # TypeScript validation - MUST be 0 errors
npx pnpm lint             # Linting
npm run test:performance  # Performance tests
```

### Database
```bash
npx pnpm db:migrate       # Run migrations
npx pnpm db:types         # Generate TypeScript types
supabase gen types typescript --local > src/types/supabase.ts
```

### Testing
```bash
# Performance testing
npm run test:performance     # Local performance tests
npm run test:performance:ci  # CI performance tests

# Manual testing
http://localhost:3000/dev/testing  # Developer testing interface
```

## 📁 Key File Locations

### Documentation
- `README.md` - Project overview
- `DEVELOPMENT-GUIDE.md` - Architecture patterns
- `DEVELOPMENT-LOG.md` - Current status
- `AGENT-HANDOVER.md` - Task handover
- `AGENT-RULES.md` - Mandatory procedures
- `docs/PERFORMANCE-VALIDATION.md` - Performance testing guide

### Performance Tools
- `/src/lib/utils/performance-measurement.ts` - FPS measurement
- `/src/lib/utils/mobile-testing.ts` - Mobile testing
- `/src/lib/utils/performance-regression.ts` - CI/CD tests
- `/src/components/dev/performance-validator.tsx` - Testing UI

### Core Services
- `/src/lib/services/signals.service.ts` - Signal operations
- `/src/lib/services/analysis-coordinator.service.ts` - Analysis pipeline
- `/src/lib/services/eodhd.service.ts` - Market data

### Components (Week 1 Complete - 32/32)
- `/src/components/ui/` - Base UI components ✅
- `/src/components/auth/` - Authentication (6/6) ✅
- `/src/components/charts/` - Trading charts (8/8) ✅
- `/src/components/forms/` - Form library (10/10) ✅
- `/src/components/data/` - Data display (8/8) ✅
- `/src/components/dashboard/` - Dashboard components ✅
- `/src/components/signals/` - Signal components ✅

## ✅ Validation Checklist

### After EVERY Change
```bash
npx pnpm type-check  # MUST show 0 errors
```

### Before Claiming Complete
```bash
npx pnpm build                # Must succeed
npm run test:performance      # Must pass thresholds
# Navigate to /dev/testing   # Manual validation
```

## 🔍 Quick Debugging

### TypeScript Errors
```bash
# Clear cache and rebuild
rm -rf tsconfig.tsbuildinfo
npx pnpm type-check

# Regenerate Supabase types
npx pnpm db:types
```

### Build Failures
```bash
# Clean build
rm -rf .next
npx pnpm build
```

### Performance Issues
```bash
# Check current performance
http://localhost:3000/dev/testing

# Run automated tests
npm run test:performance
```

## 📊 Performance Targets

### Desktop
- FPS: 60 minimum
- Frame time: <16.67ms
- Smoothness: >90%

### Mobile
- High-end (iPhone 12+): 60fps
- Mid-range: 30fps minimum
- Touch response: <50ms

## 🎯 Common Tasks

### Add New Component
1. Create in appropriate directory
2. Add 'use client' if needed
3. Run `npx pnpm type-check`
4. Test performance impact

### Update Service
1. Modify service file
2. Update TypeScript interfaces
3. Run `npx pnpm type-check`
4. Test with real data

### Fix TypeScript Error
1. Read the actual error message
2. Fix the root cause (no `any`)
3. Run `npx pnpm type-check`
4. Verify 0 errors

## ⚡ Quick Wins

### Performance
- Use `lazy()` for heavy components
- Add `loading.tsx` files
- Implement error boundaries
- Use React Query for caching

### TypeScript
- Define interfaces first
- Use generics properly
- Avoid type assertions
- Enable strict mode

### Mobile
- Test touch targets (44px min)
- Reduce blur effects
- Optimize animations
- Test on real viewports

## 🚨 Emergency Fixes

### App Won't Build
```bash
rm -rf node_modules .next
npx pnpm install
npx pnpm build
```

### TypeScript Errors Everywhere
```bash
npx pnpm db:types
rm tsconfig.tsbuildinfo
npx pnpm type-check
```

### Performance Degraded
1. Check `/dev/testing`
2. Profile with Chrome DevTools
3. Reduce animation complexity
4. Implement `shouldReduceAnimations`

---

**Remember**: Always validate before claiming complete!