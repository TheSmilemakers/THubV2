# Master Orchestrator Implementation Prompt

## CRITICAL: STRICT QUALITY IMPLEMENTATION REQUIRED

Use master-orchestrator to coordinate the implementation of the INITIALIZE button flow with **ZERO TOLERANCE** for quality issues.

## Implementation Document
Review and implement: `/INITIALIZE-BUTTON-IMPLEMENTATION-PLAN.md`

## MANDATORY REQUIREMENTS

### 1. STRICT CODING RULEBOOK ENFORCEMENT
**ALL work MUST follow**: `/Users/rajan/Documents/Claude/STRICT-CODING-RULEBOOK.md`

**ABSOLUTE RULES:**
- **NEVER ASSUME - ALWAYS VERIFY**: Every claim must show exact file:line references
- **FULL RESPONSIBILITY CHAIN**: Listen → Plan → Gain Context → Implement → Verify → Score
- **Each phase must score 8/10+ before proceeding**
- **NO SHORTCUTS, NO EXCEPTIONS**

### 2. QUALITY GATES (MANDATORY)

#### Pre-Implementation Verification
- [ ] Read and confirm understanding of INITIALIZE-BUTTON-IMPLEMENTATION-PLAN.md
- [ ] Verify all current file states match the document's evidence
- [ ] Run `npx pnpm type-check` - MUST show 0 errors before starting
- [ ] Test current deployment at thub.rajanmaher.com
- [ ] Document current FPS performance baseline

#### During Implementation
- [ ] After EVERY file change:
  - Run `npx pnpm type-check` - MUST maintain 0 errors
  - Test locally with both themes
  - Measure actual FPS (not theoretical)
  - Document any deviations from plan

#### Post-Implementation Verification
- [ ] All TypeScript errors: 0
- [ ] Performance test results: Actual FPS measurements
- [ ] Visual regression test: Screenshots before/after
- [ ] Memory leak test: Monitor for 5 minutes
- [ ] Mobile test: Real device or accurate simulation

### 3. SUB-AGENT ASSIGNMENTS

Assign these specialized agents with explicit requirements:

#### glassmorphism-ui-expert
**Task**: Implement button animations and visual effects
**Requirements**:
- Maintain 60fps on iPhone 12+
- Preserve existing aesthetic exactly
- Test with actual performance measurements
- NO theoretical claims without evidence

#### typescript-pro
**Task**: Implement state management and type safety
**Requirements**:
- Zero TypeScript errors throughout
- Proper type definitions for all props/states
- No use of 'any' type
- Document all type decisions

#### performance-engineer
**Task**: Optimize Canvas rendering and animations
**Requirements**:
- Implement all MDN best practices from plan
- Measure actual performance metrics
- Test memory usage over time
- Provide optimization evidence

#### test-automator
**Task**: Verify implementation quality
**Requirements**:
- Test all user flows
- Measure actual performance
- Document with screenshots/recordings
- Report issues honestly

### 4. IMPLEMENTATION SEQUENCE

1. **State Management Setup** (typescript-pro)
   - Implement hero-section.tsx changes
   - Verify with type checking
   - Test state transitions

2. **Visual Effects** (glassmorphism-ui-expert)
   - Implement button animations
   - Add loading sequences
   - Ensure smooth transitions

3. **Performance Optimization** (performance-engineer)
   - Optimize Canvas contexts
   - Implement proper cleanup
   - Measure and verify 60fps

4. **Integration Testing** (test-automator)
   - Test complete flow
   - Verify on multiple devices
   - Document all findings

### 5. HONESTY REQUIREMENTS

**MANDATORY REPORTING:**
- If something doesn't work as specified, REPORT IT
- If performance is below 60fps, DOCUMENT ACTUAL FPS
- If there are TypeScript errors, SHOW THEM
- If visual quality degraded, PROVIDE EVIDENCE
- If you're unsure about implementation, ASK FOR CLARIFICATION

**FORBIDDEN:**
- Claiming "should work" without testing
- Theoretical performance claims
- Hiding errors or warnings
- Implementing differently than specified without discussion
- Skipping any verification step

### 6. EVIDENCE REQUIREMENTS

For EVERY implementation step, provide:

```markdown
## Step: [What you're implementing]

### Pre-Implementation Check
- Current state: [file:line references]
- Type check result: [actual command output]
- Current behavior: [description/screenshot]

### Implementation
- Exact changes made: [diff format]
- Reason for any deviations: [if any]

### Post-Implementation Verification
- Type check result: [actual command output]
- Performance measurement: [actual FPS/metrics]
- Visual result: [screenshot/description]
- Test result: [what you actually tested and saw]

### Honesty Assessment
- What works: [specific list]
- What doesn't work: [honest list]
- Concerns: [any potential issues]
- Quality score: X/10 [with justification]
```

### 7. BUILD CONTEXT AND ETHOS

**Project Vision**: Premium trading intelligence platform with exceptional UX
**Quality Standard**: Banking-grade reliability with gaming-grade performance
**User Experience**: Smooth, intuitive, delightful
**Technical Excellence**: Clean code, proper patterns, no shortcuts

**This implementation is critical because:**
- First impression for users
- Sets quality standard for entire app
- Demonstrates technical competence
- Must work flawlessly on all devices

### 8. FINAL CHECKLIST

Before marking complete:
- [ ] All code matches implementation plan exactly (or deviations documented)
- [ ] Zero TypeScript errors
- [ ] 60fps verified on target devices
- [ ] Memory leaks tested and confirmed absent
- [ ] Both themes work perfectly
- [ ] All transitions are smooth
- [ ] INITIALIZE → Loading → LOGIN flow works flawlessly
- [ ] Code follows all THub V2 patterns
- [ ] Documentation updated if needed
- [ ] Honest assessment provided

## INVOCATION

Master orchestrator must:
1. Acknowledge all requirements
2. Assign sub-agents with specific quality gates
3. Enforce verification at each step
4. Report honestly on all findings
5. Not proceed if quality gates fail
6. Provide complete evidence for all claims

**NO EXCUSES. NO SHORTCUTS. NO INFLATED CLAIMS.**

The user expects honesty, quality, and attention to detail. Deliver exactly what's specified, test everything claimed, and report the truth about what works and what doesn't.