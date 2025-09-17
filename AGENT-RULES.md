# AGENT-RULES.md - Mandatory Operating Procedures for AI Agents

## 🚨 CRITICAL: These Rules Are MANDATORY

All AI agents working on THub V2 MUST follow these rules without exception. Violation of these rules indicates substandard work quality.

## 📋 Pre-Work Requirements

### Before Starting ANY Task

1. **Read Project Documentation**
   ```bash
   # MANDATORY reading order:
   1. README.md - Project overview
   2. DEVELOPMENT-GUIDE.md - Architecture patterns
   3. DEVELOPMENT-LOG.md - Current status
   4. AGENT-HANDOVER.md - Immediate tasks
   5. This file (AGENT-RULES.md)
   ```

2. **Verify Build Status**
   ```bash
   npx pnpm type-check  # MUST show 0 errors
   npx pnpm build       # MUST succeed
   ```

3. **Check Performance Baseline**
   ```bash
   # Navigate to /dev/testing and run performance tests
   # Document current FPS baseline before making changes
   ```

## ✅ Validation-First Development

### The Golden Rule
**"No claim without validation, no feature without test, no completion without compilation"**

### 🏆 WEEK 1 SUCCESS PROVEN
This methodology successfully delivered:
- **32/32 UI Components** completed with premium quality
- **0 TypeScript Errors** maintained throughout
- **60fps Performance** validated with real measurements
- **Frontend Progress** jumped from 55% to 85%

**This is now the proven standard for THub V2 development.**

### Mandatory Validation Steps

1. **TypeScript Compilation Gate**
   - Run `npx pnpm type-check` after EVERY change
   - NEVER proceed with TypeScript errors
   - 0 errors is the only acceptable state

2. **Performance Validation**
   - All performance claims MUST have FPS measurements
   - Use `/dev/testing` for manual validation
   - Run `npm run test:performance` for automated tests
   - Document actual measured performance, not theoretical

3. **Mobile Testing Requirements**
   - Test on actual viewport sizes (not just browser resize)
   - Use Chrome DevTools device emulation at minimum
   - Document which devices were tested
   - Never claim "mobile-optimized" without testing

## 🔄 Quality Coding Methodology

### Step-by-Step Implementation

After EVERY change, provide this assessment:

```markdown
## STEP X.X ASSESSMENT: [Action Taken]

**What I Changed:**
- Specific files modified
- Exact changes made

**Validation Performed:**
- ✅ TypeScript check: 0 errors
- ✅ Build successful: Yes/No
- ✅ Performance tested: XX fps measured
- ✅ Mobile tested: Device/viewport used

**Impact Assessment:**
✅ POSITIVE: [Specific improvements]
⚠️ CONCERNS: [Any issues or risks]

**Quality Metrics:**
- Compilation: ⭐⭐⭐⭐⭐ (0 errors)
- Performance: ⭐⭐⭐⭐ (XX fps)
- Code Quality: ⭐⭐⭐⭐
- Documentation: ⭐⭐⭐⭐

**Next Step:** [Clear recommendation]
```

## 🛡️ Development Standards

### Code Quality Standards

1. **TypeScript Strict Mode**
   - NO `any` types ever
   - NO `@ts-ignore` comments
   - Define interfaces for ALL data structures
   - Use proper generics

2. **Error Handling**
   - Try-catch ALL async operations
   - Provide user-friendly error messages
   - Log errors with context
   - Never swallow errors silently

3. **Performance Standards**
   - Desktop: 60fps minimum
   - Mobile high-end: 60fps target
   - Mobile mid-range: 30fps minimum
   - Touch response: <50ms
   - Initial load: <2s on 4G

### Testing Requirements

1. **Before Claiming Feature Complete**
   - Unit tests written (if applicable)
   - Manual testing performed
   - Performance validated
   - TypeScript compilation successful
   - Documentation updated

2. **Performance Testing**
   ```bash
   # Local testing
   npm run test:performance
   
   # CI testing
   npm run test:performance:ci
   
   # Manual testing
   Navigate to /dev/testing
   ```

## 📊 Measurement Over Claims

### Unacceptable Claims
❌ "Optimized for mobile" (without FPS data)
❌ "High performance" (without measurements)
❌ "Works perfectly" (without testing)
❌ "TypeScript compliant" (with compilation errors)
❌ "Ready for production" (without validation)

### Required Evidence
✅ "Mobile: 45fps on iPhone 12 (tested via /dev/testing)"
✅ "Performance: 60fps desktop, 35fps mobile (measured)"
✅ "TypeScript: 0 errors on type-check"
✅ "Tested on: Chrome 120, Safari 17, Firefox 121"
✅ "Load time: 1.8s on simulated 4G"

## 🚧 CI/CD Gates

### Mandatory Checks Before Merge

1. **TypeScript Compilation**
   ```bash
   npx pnpm type-check  # Must pass with 0 errors
   ```

2. **Build Success**
   ```bash
   npx pnpm build  # Must complete successfully
   ```

3. **Performance Tests**
   ```bash
   npm run test:performance:ci  # Must meet thresholds
   ```

## 📝 Documentation Requirements

### When to Update Documentation

1. **DEVELOPMENT-LOG.md**
   - After completing any significant task
   - When encountering/fixing major issues
   - After performance improvements
   - When learning important lessons

2. **AGENT-HANDOVER.md**
   - Before switching to another task
   - When blocked on something
   - After completing assigned work
   - When discovering new requirements

3. **Code Comments**
   - Complex algorithms need explanation
   - Performance optimizations need justification
   - Workarounds need context
   - API contracts need documentation

## ⚠️ Common Violations to Avoid

### Technical Violations
1. ❌ Committing code with TypeScript errors
2. ❌ Making performance claims without measurements
3. ❌ Using `any` type to bypass TypeScript
4. ❌ Ignoring error handling
5. ❌ Skipping validation steps

### Process Violations
1. ❌ Not running type-check before claiming completion
2. ❌ Not testing on mobile viewports
3. ❌ Not documenting breaking changes
4. ❌ Making multiple changes without assessment
5. ❌ Claiming features work without testing

### Documentation Violations
1. ❌ Not updating DEVELOPMENT-LOG.md
2. ❌ Making false or exaggerated claims
3. ❌ Not documenting known issues
4. ❌ Leaving outdated information
5. ❌ Not providing reproduction steps for bugs

## 🎯 Success Criteria

A task is ONLY complete when:

1. ✅ TypeScript compilation: 0 errors
2. ✅ Build process: Successful
3. ✅ Performance: Measured and documented
4. ✅ Mobile: Tested and validated
5. ✅ Documentation: Updated and accurate
6. ✅ Code quality: Follows all standards
7. ✅ Tests: Written and passing (where applicable)

## 🔧 Tools and Commands

### Essential Commands
```bash
# TypeScript validation (run after EVERY change)
npx pnpm type-check

# Build validation
npx pnpm build

# Performance testing
npm run test:performance

# Development server
npx pnpm dev

# Access testing interface
http://localhost:3000/dev/testing
```

### Performance Validation Tools
- `/src/lib/utils/performance-measurement.ts` - FPS measurement
- `/src/lib/utils/mobile-testing.ts` - Mobile-specific tests
- `/src/lib/utils/performance-regression.ts` - CI/CD tests
- `/dev/testing` - Manual testing interface

## 🚨 Escalation Process

If you encounter situations where these rules cannot be followed:

1. Document the specific issue
2. Explain why the rule cannot be followed
3. Propose an alternative approach
4. Get approval before proceeding
5. Document the exception in DEVELOPMENT-LOG.md

## 📋 Final Checklist

Before marking ANY task complete:

- [ ] TypeScript check passes with 0 errors
- [ ] Build completes successfully
- [ ] Performance tested and measured
- [ ] Mobile functionality validated
- [ ] Documentation updated
- [ ] Known issues documented
- [ ] Next steps clearly defined
- [ ] Handover notes written

---

**Remember**: These rules exist to maintain the high quality standards of THub V2. Following them ensures we deliver a premium product that actually works as claimed, not just in theory but in reality.

**The goal is excellence through validation, not speed through assumptions.**