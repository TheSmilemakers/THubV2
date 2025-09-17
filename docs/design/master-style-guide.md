# THub V2 Master Design System & Style Guide
*Version 1.0 | Mobile-First | 60fps Performance | Premium Glassmorphism*

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography System](#typography-system)
4. [Spacing & Layout](#spacing--layout)
5. [Glassmorphism Effects System](#glassmorphism-effects-system)
6. [Animation System](#animation-system)
7. [Icon & Imagery](#icon--imagery)
8. [Mobile Adaptations](#mobile-adaptations)
9. [Performance Standards](#performance-standards)
10. [Quality Assurance](#quality-assurance)
11. [Implementation Examples](#implementation-examples)

---

## Design Philosophy

### Core Principles
- **Mobile-First Excellence**: Every design decision prioritizes mobile experience
- **60fps Performance**: Smooth animations across all supported devices
- **Institutional-Grade Polish**: Premium feel that builds trust
- **Accessibility**: WCAG AA compliance with enhanced mobile accessibility
- **Progressive Enhancement**: Gracefully adapts to device capabilities

### Brand Personality
- **Sophisticated**: Modern glassmorphism with depth
- **Trustworthy**: Institutional-grade polish and reliability
- **Cutting-Edge**: Advanced effects and interactions
- **Accessible**: Inclusive design for all users

---

## Color System

### CSS Variables Foundation
```css
:root {
  /* Base Colors */
  --color-white: 255 255 255;
  --color-black: 0 0 0;
  
  /* Background System */
  --bg-primary: 10 11 20;
  --bg-secondary: 0 0 0;
  --bg-tertiary: 15 16 25;
  --bg-overlay: 5 6 15;
  
  /* Glass System */
  --glass-surface-light: rgba(255, 255, 255, 0.05);
  --glass-surface-medium: rgba(255, 255, 255, 0.08);
  --glass-surface-heavy: rgba(255, 255, 255, 0.12);
  --glass-border-light: rgba(255, 255, 255, 0.1);
  --glass-border-medium: rgba(255, 255, 255, 0.15);
  --glass-border-heavy: rgba(255, 255, 255, 0.2);
  
  /* Text System */
  --text-primary: 255 255 255;
  --text-secondary: 209 213 219;
  --text-muted: 156 163 175;
  --text-disabled: 107 114 128;
  
  /* Accent Colors */
  --accent-primary: 139 92 246;    /* Purple #8b5cf6 */
  --accent-secondary: 59 130 246;  /* Blue #3b82f6 */
  --accent-tertiary: 34 197 94;    /* Green #22c55e */
  --accent-quaternary: 251 146 60; /* Orange #fb923c */
  
  /* Signal Colors */
  --signal-strong-buy: 34 197 94;   /* Green #22c55e */
  --signal-buy: 101 163 13;         /* Lime #65a30d */
  --signal-hold: 234 179 8;         /* Yellow #eab308 */
  --signal-sell: 251 146 60;        /* Orange #fb923c */
  --signal-strong-sell: 239 68 68;  /* Red #ef4444 */
  
  /* Status Colors */
  --status-success: 34 197 94;
  --status-warning: 234 179 8;
  --status-error: 239 68 68;
  --status-info: 59 130 246;
  
  /* Shadow System */
  --shadow-glass-sm: 0 4px 16px rgba(0, 0, 0, 0.2);
  --shadow-glass-md: 0 8px 32px rgba(0, 0, 0, 0.3);
  --shadow-glass-lg: 0 16px 64px rgba(0, 0, 0, 0.4);
  --shadow-glass-xl: 0 24px 96px rgba(0, 0, 0, 0.5);
  
  /* Gradient System */
  --gradient-primary: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  --gradient-secondary: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  --gradient-aurora: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #22c55e 100%);
  --gradient-signal-positive: linear-gradient(135deg, #22c55e 0%, #65a30d 100%);
  --gradient-signal-negative: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}
```

### Color Usage Guidelines

#### Background Hierarchy
- **Primary**: Main app background, darkest layer
- **Secondary**: Pure black for overlays and modals
- **Tertiary**: Elevated surfaces (navigation, panels)
- **Overlay**: Semi-transparent overlays

#### Glass Surface Levels
- **Light**: Subtle elements, hover states
- **Medium**: Primary cards, buttons
- **Heavy**: Active states, important elements

#### Signal Color Coding
```css
/* Signal Strength Colors */
.signal-strength-1 { color: rgb(var(--signal-strong-sell)); }
.signal-strength-2 { color: rgb(var(--signal-sell)); }
.signal-strength-3 { color: rgb(var(--signal-hold)); }
.signal-strength-4 { color: rgb(var(--signal-buy)); }
.signal-strength-5 { color: rgb(var(--signal-strong-buy)); }
```

#### Accessibility Compliance
All color combinations maintain WCAG AA contrast ratios:
- **Normal text**: 4.5:1 minimum
- **Large text**: 3:1 minimum
- **UI elements**: 3:1 minimum

---

## Typography System

### Font Stack
```css
/* Primary Font - Inter */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

/* Fallback Stack */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

/* Display Font (Optional Premium) */
@import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@400;500;600;700;800;900&display=swap');
```

### Typography Scale (Mobile-First)
```css
/* CSS Variables */
:root {
  /* Font Sizes - Mobile Base */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */
  --text-5xl: 3rem;        /* 48px */
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;
  
  /* Letter Spacing */
  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0em;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
}

/* Desktop Overrides */
@media (min-width: 768px) {
  :root {
    --text-3xl: 2.25rem;    /* 36px */
    --text-4xl: 3rem;       /* 48px */
    --text-5xl: 3.75rem;    /* 60px */
  }
}
```

### Typography Classes
```css
/* Heading Styles */
.text-display-1 {
  font-size: var(--text-5xl);
  font-weight: 800;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tighter);
}

.text-display-2 {
  font-size: var(--text-4xl);
  font-weight: 700;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

.text-heading-1 {
  font-size: var(--text-3xl);
  font-weight: 600;
  line-height: var(--leading-snug);
}

.text-heading-2 {
  font-size: var(--text-2xl);
  font-weight: 600;
  line-height: var(--leading-snug);
}

.text-heading-3 {
  font-size: var(--text-xl);
  font-weight: 500;
  line-height: var(--leading-normal);
}

/* Body Styles */
.text-body-large {
  font-size: var(--text-lg);
  font-weight: 400;
  line-height: var(--leading-relaxed);
}

.text-body {
  font-size: var(--text-base);
  font-weight: 400;
  line-height: var(--leading-normal);
}

.text-body-small {
  font-size: var(--text-sm);
  font-weight: 400;
  line-height: var(--leading-normal);
}

.text-caption {
  font-size: var(--text-xs);
  font-weight: 500;
  line-height: var(--leading-normal);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

/* Special Styles */
.text-gradient {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.text-glow {
  text-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
}
```

### Performance Optimizations
```css
/* Font Loading Optimization */
.font-display-swap { font-display: swap; }

/* Prevent Layout Shift */
.font-metrics-override {
  font-feature-settings: "kern" 1;
  text-rendering: optimizeLegibility;
}
```

---

## Spacing & Layout

### Base Unit System
```css
:root {
  /* Base Unit: 4px */
  --space-0: 0;
  --space-px: 1px;
  --space-0_5: 0.125rem;   /* 2px */
  --space-1: 0.25rem;      /* 4px */
  --space-1_5: 0.375rem;   /* 6px */
  --space-2: 0.5rem;       /* 8px */
  --space-2_5: 0.625rem;   /* 10px */
  --space-3: 0.75rem;      /* 12px */
  --space-3_5: 0.875rem;   /* 14px */
  --space-4: 1rem;         /* 16px */
  --space-5: 1.25rem;      /* 20px */
  --space-6: 1.5rem;       /* 24px */
  --space-7: 1.75rem;      /* 28px */
  --space-8: 2rem;         /* 32px */
  --space-10: 2.5rem;      /* 40px */
  --space-12: 3rem;        /* 48px */
  --space-16: 4rem;        /* 64px */
  --space-20: 5rem;        /* 80px */
  --space-24: 6rem;        /* 96px */
  --space-32: 8rem;        /* 128px */
  
  /* Component Spacing */
  --spacing-component-xs: var(--space-2);    /* 8px */
  --spacing-component-sm: var(--space-4);    /* 16px */
  --spacing-component-md: var(--space-6);    /* 24px */
  --spacing-component-lg: var(--space-8);    /* 32px */
  --spacing-component-xl: var(--space-12);   /* 48px */
  
  /* Section Spacing */
  --spacing-section-xs: var(--space-8);      /* 32px */
  --spacing-section-sm: var(--space-12);     /* 48px */
  --spacing-section-md: var(--space-16);     /* 64px */
  --spacing-section-lg: var(--space-20);     /* 80px */
  --spacing-section-xl: var(--space-24);     /* 96px */
}
```

### Grid System
```css
/* 12-Column Grid */
.grid-container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-6);
  padding: 0 var(--space-4);
}

/* Responsive Grid */
@media (min-width: 640px) {
  .grid-container {
    gap: var(--space-8);
    padding: 0 var(--space-6);
  }
}

@media (min-width: 1024px) {
  .grid-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space-8);
  }
}
```

### Breakpoint System
```css
:root {
  /* Breakpoints */
  --bp-sm: 640px;
  --bp-md: 768px;
  --bp-lg: 1024px;
  --bp-xl: 1280px;
  --bp-2xl: 1536px;
}

/* Mobile-First Media Queries */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### Touch Target Standards
```css
/* Minimum Touch Targets */
:root {
  --touch-target-min: 44px;        /* iOS HIG minimum */
  --touch-target-comfortable: 48px; /* Material Design */
  --touch-target-accessible: 56px;  /* Enhanced accessibility */
}

/* Touch Target Classes */
.touch-target-min {
  min-height: var(--touch-target-min);
  min-width: var(--touch-target-min);
}

.touch-target {
  min-height: var(--touch-target-comfortable);
  min-width: var(--touch-target-comfortable);
}

.touch-target-lg {
  min-height: var(--touch-target-accessible);
  min-width: var(--touch-target-accessible);
}
```

### Safe Areas (Mobile)
```css
/* Safe Area Support */
.safe-area-padding {
  padding-top: env(safe-area-inset-top);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
}

.safe-area-margin {
  margin-top: env(safe-area-inset-top);
  margin-right: env(safe-area-inset-right);
  margin-bottom: env(safe-area-inset-bottom);
  margin-left: env(safe-area-inset-left);
}
```

---

## Glassmorphism Effects System

### Base Glass Utilities
```css
/* Glass Foundation */
.glass-base {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  background: var(--glass-surface-light);
  border: 1px solid var(--glass-border-light);
}

/* Glass Variations */
.glass-light {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: var(--glass-surface-light);
  border: 1px solid var(--glass-border-light);
  box-shadow: var(--shadow-glass-sm);
}

.glass-medium {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  background: var(--glass-surface-medium);
  border: 1px solid var(--glass-border-medium);
  box-shadow: var(--shadow-glass-md);
}

.glass-heavy {
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
  background: var(--glass-surface-heavy);
  border: 1px solid var(--glass-border-heavy);
  box-shadow: var(--shadow-glass-lg);
}

/* Glass Enhancement Effects */
.glass-highlight {
  position: relative;
}

.glass-highlight::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(255, 255, 255, 0.2) 50%, 
    transparent 100%
  );
}

.glass-noise {
  position: relative;
}

.glass-noise::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.02;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23ffffff' fill-opacity='1' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E");
  pointer-events: none;
}
```

### Multi-Layer Glass System
```css
/* Layer Depth System */
.glass-layer-1 {
  @apply glass-light;
  z-index: 1;
}

.glass-layer-2 {
  @apply glass-medium;
  z-index: 2;
  box-shadow: var(--shadow-glass-md), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.glass-layer-3 {
  @apply glass-heavy;
  z-index: 3;
  box-shadow: var(--shadow-glass-lg), inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

/* Chromatic Aberration Effect */
.glass-chromatic {
  position: relative;
}

.glass-chromatic::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  background: linear-gradient(45deg, 
    rgba(255, 0, 0, 0.1) 0%, 
    rgba(0, 255, 0, 0.1) 50%, 
    rgba(0, 0, 255, 0.1) 100%
  );
  border-radius: inherit;
  z-index: -1;
  opacity: 0.3;
  filter: blur(1px);
}

/* Dynamic Blur (Scroll-based) */
.glass-dynamic {
  transition: backdrop-filter 0.3s ease;
}

.glass-dynamic.scrolled {
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
}
```

### Mobile Glass Optimizations
```css
/* Reduced Complexity for Mobile */
@media (max-width: 768px) {
  .glass-light {
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  
  .glass-medium {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  
  .glass-heavy {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }
  
  /* Disable expensive effects on low-end devices */
  .glass-chromatic::before {
    display: none;
  }
  
  .glass-noise::after {
    display: none;
  }
}

/* Progressive Enhancement */
@supports not (backdrop-filter: blur(20px)) {
  .glass-base,
  .glass-light,
  .glass-medium,
  .glass-heavy {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
}
```

### Glass Component Classes
```css
/* Pre-built Glass Components */
.glass-card {
  @apply glass-medium rounded-2xl p-6;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.glass-card:hover {
  background: var(--glass-surface-heavy);
  transform: translateY(-2px);
  box-shadow: var(--shadow-glass-xl);
}

.glass-button {
  @apply glass-light px-6 py-3 rounded-xl font-medium;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.glass-button:hover {
  @apply glass-medium;
  transform: translateY(-1px);
}

.glass-button:active {
  transform: translateY(0);
}

.glass-navigation {
  @apply glass-heavy;
  border-bottom: 1px solid var(--glass-border-medium);
}

.glass-modal {
  @apply glass-heavy rounded-3xl;
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
}
```

---

## Animation System

### Spring Physics Presets
```css
:root {
  /* Easing Functions */
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-out-cubic: cubic-bezier(0.33, 1, 0.68, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Duration Scale */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --duration-slower: 750ms;
  
  /* Spring Presets (Framer Motion) */
  --spring-gentle: { type: "spring", stiffness: 300, damping: 30 };
  --spring-bouncy: { type: "spring", stiffness: 400, damping: 17 };
  --spring-snappy: { type: "spring", stiffness: 500, damping: 25 };
  --spring-wobbly: { type: "spring", stiffness: 180, damping: 12 };
}
```

### Performance-Optimized Animations
```css
/* GPU-Accelerated Transforms */
.animate-gpu {
  transform: translate3d(0, 0, 0);
  will-change: transform;
}

/* Hover Animations */
.animate-hover-lift {
  transition: transform var(--duration-normal) var(--ease-out-cubic);
}

.animate-hover-lift:hover {
  transform: translateY(-4px) translateZ(0);
}

/* Magnetic Hover Effect */
.animate-magnetic {
  transition: transform var(--duration-fast) var(--ease-out-cubic);
}

.animate-magnetic:hover {
  transform: scale(1.05) translateZ(0);
}

/* Glow Animation */
@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(139, 92, 246, 0.6);
  }
}

.animate-glow {
  animation: glow-pulse 2s ease-in-out infinite;
}

/* Shimmer Loading */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.0) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.0) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s linear infinite;
}

/* Gradient Animation */
@keyframes gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
}
```

### Mobile Animation Optimizations
```css
/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Performance Budget Classes */
.performance-tier-high {
  /* Full animations */
}

.performance-tier-mid {
  /* Reduced complexity */
}

.performance-tier-mid .animate-glow,
.performance-tier-mid .animate-gradient {
  animation: none;
}

.performance-tier-low {
  /* Minimal animations */
}

.performance-tier-low * {
  animation: none !important;
  transition: none !important;
}
```

### Gesture Animation Hooks
```typescript
// TypeScript interfaces for animations
interface SpringConfig {
  type: "spring";
  stiffness: number;
  damping: number;
  mass?: number;
}

interface GestureConfig {
  drag?: boolean;
  dragElastic?: number;
  dragConstraints?: { left?: number; right?: number; top?: number; bottom?: number };
  onDragEnd?: (event: any, info: any) => void;
}

// Animation constants
export const SPRING_CONFIGS = {
  gentle: { type: "spring" as const, stiffness: 300, damping: 30 },
  bouncy: { type: "spring" as const, stiffness: 400, damping: 17 },
  snappy: { type: "spring" as const, stiffness: 500, damping: 25 },
  wobbly: { type: "spring" as const, stiffness: 180, damping: 12 },
};

export const GESTURE_CONFIGS = {
  swipeThreshold: 50,
  longPressDelay: 500,
  doubleTapWindow: 300,
  pinchScaleMin: 0.5,
  pinchScaleMax: 3,
};
```

---

## Icon & Imagery

### Icon System
```css
/* Icon Sizing Scale */
:root {
  --icon-xs: 12px;
  --icon-sm: 16px;
  --icon-md: 20px;
  --icon-lg: 24px;
  --icon-xl: 32px;
  --icon-2xl: 40px;
  --icon-3xl: 48px;
}

/* Icon Classes */
.icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
}

.icon-xs { width: var(--icon-xs); height: var(--icon-xs); }
.icon-sm { width: var(--icon-sm); height: var(--icon-sm); }
.icon-md { width: var(--icon-md); height: var(--icon-md); }
.icon-lg { width: var(--icon-lg); height: var(--icon-lg); }
.icon-xl { width: var(--icon-xl); height: var(--icon-xl); }
.icon-2xl { width: var(--icon-2xl); height: var(--icon-2xl); }
.icon-3xl { width: var(--icon-3xl); height: var(--icon-3xl); }

/* Icon Colors */
.icon-primary { color: rgb(var(--text-primary)); }
.icon-secondary { color: rgb(var(--text-secondary)); }
.icon-muted { color: rgb(var(--text-muted)); }
.icon-accent { color: rgb(var(--accent-primary)); }
.icon-success { color: rgb(var(--status-success)); }
.icon-warning { color: rgb(var(--status-warning)); }
.icon-error { color: rgb(var(--status-error)); }

/* Icon Effects */
.icon-glow {
  filter: drop-shadow(0 0 8px currentColor);
}

.icon-interactive {
  transition: all var(--duration-fast) var(--ease-out-cubic);
  cursor: pointer;
}

.icon-interactive:hover {
  transform: scale(1.1);
  color: rgb(var(--accent-primary));
}
```

### Image Optimization
```css
/* Image Base Styles */
.image-base {
  max-width: 100%;
  height: auto;
  display: block;
}

.image-cover {
  object-fit: cover;
  object-position: center;
}

.image-contain {
  object-fit: contain;
}

/* Aspect Ratios */
.aspect-square { aspect-ratio: 1 / 1; }
.aspect-video { aspect-ratio: 16 / 9; }
.aspect-wide { aspect-ratio: 21 / 9; }
.aspect-portrait { aspect-ratio: 3 / 4; }

/* Loading States */
.image-loading {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s linear infinite;
}

/* Glass Image Effects */
.image-glass {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--glass-border-light);
  box-shadow: var(--shadow-glass-md);
}

.image-glass::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  pointer-events: none;
}
```

### Performance Standards
```css
/* Image Performance */
.image-optimized {
  /* Next.js Image component handles these automatically */
  loading: lazy;
  decoding: async;
}

/* WebP Fallback */
.image-webp {
  background-image: url('image.webp');
}

.no-webp .image-webp {
  background-image: url('image.jpg');
}
```

---

## Mobile Adaptations

### Touch Interaction Standards
```css
/* Touch Feedback */
.touch-feedback {
  position: relative;
  overflow: hidden;
}

.touch-feedback::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
}

.touch-feedback:active::after {
  width: 200px;
  height: 200px;
}

/* iOS-style Bounce */
.ios-bounce {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/* Android-style Ripple */
.android-ripple {
  position: relative;
  overflow: hidden;
}

.android-ripple::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
}

.android-ripple:active::before {
  width: 300px;
  height: 300px;
}
```

### Responsive Design Patterns
```css
/* Mobile Navigation */
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: var(--glass-surface-heavy);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--glass-border-medium);
  padding: var(--space-2) var(--space-4);
  padding-bottom: calc(var(--space-2) + env(safe-area-inset-bottom));
}

/* Bottom Sheet */
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--glass-surface-heavy);
  backdrop-filter: blur(40px);
  border-radius: 24px 24px 0 0;
  transform: translateY(100%);
  transition: transform var(--duration-normal) var(--ease-out-cubic);
}

.bottom-sheet.open {
  transform: translateY(0);
}

/* Pull Handle */
.pull-handle {
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin: 12px auto 20px;
}

/* Swipe Gestures */
.swipe-container {
  touch-action: pan-y;
  user-select: none;
}

.swipe-indicator {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity var(--duration-fast);
}

.swipe-container:active .swipe-indicator {
  opacity: 1;
}
```

### Device-Specific Optimizations
```css
/* iPhone X+ Safe Area */
@supports (padding: max(0px)) {
  .safe-area-top {
    padding-top: max(16px, env(safe-area-inset-top));
  }
  
  .safe-area-bottom {
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }
}

/* High DPI Displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .retina-image {
    background-image: url('image@2x.jpg');
  }
}

/* Dark Mode Detection */
@media (prefers-color-scheme: dark) {
  /* Already dark by default */
}

@media (prefers-color-scheme: light) {
  /* Light mode overrides if implemented */
}

/* Reduced Data Mode */
@media (prefers-reduced-data: reduce) {
  .high-bandwidth-content {
    display: none;
  }
  
  .reduced-data-alternative {
    display: block;
  }
}
```

---

## Performance Standards

### Performance Budgets
```typescript
// Performance targets
export const PERFORMANCE_TARGETS = {
  desktop: {
    fps: 60,
    frameTime: 16.67, // ms
    bundleSize: 500, // KB
    loadTime: 1500, // ms
  },
  mobile: {
    high_end: {
      fps: 60,
      frameTime: 16.67,
      bundleSize: 300,
      loadTime: 2000,
    },
    mid_range: {
      fps: 30,
      frameTime: 33.33,
      bundleSize: 200,
      loadTime: 3000,
    },
    low_end: {
      fps: 24,
      frameTime: 41.67,
      bundleSize: 150,
      loadTime: 4000,
    },
  },
};

// Performance monitoring
export const PERFORMANCE_THRESHOLDS = {
  LCP: 2500, // Largest Contentful Paint
  FID: 100,  // First Input Delay
  CLS: 0.1,  // Cumulative Layout Shift
  FCP: 1800, // First Contentful Paint
  TTI: 3800, // Time to Interactive
};
```

### CSS Performance Guidelines
```css
/* GPU-Accelerated Properties */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform, opacity;
}

/* Avoid Expensive Properties */
.avoid-expensive {
  /* DON'T USE: */
  /* box-shadow: expensive */
  /* filter: expensive */
  /* backdrop-filter: very expensive */
  
  /* USE INSTEAD: */
  transform: translateZ(0);
  opacity: 0.9;
}

/* Contain Layout Thrashing */
.contain-layout {
  contain: layout style paint;
}

.contain-strict {
  contain: strict;
}

/* Optimize Animations */
.optimized-animation {
  /* Only animate transform and opacity */
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* Layer Promotion */
.promote-layer {
  transform: translate3d(0, 0, 0);
  /* or */
  will-change: transform;
}

/* Remove will-change after animation */
.animation-complete {
  will-change: auto;
}
```

### Critical CSS
```css
/* Above-the-fold critical styles */
.critical-styles {
  /* Base layout */
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
  
  /* Typography */
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  
  /* Colors */
  background: linear-gradient(to bottom, #0a0b14, #000000);
  color: rgb(255, 255, 255);
  
  /* Glass effects (minimal for critical) */
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.05);
}
```

---

## Quality Assurance

### Design System Checklist

#### Color System ✅
- [ ] All CSS variables defined
- [ ] Color contrast ratios meet WCAG AA
- [ ] Signal colors are distinct and meaningful
- [ ] Gradient definitions are performance-optimized
- [ ] Dark mode is default with light mode support

#### Typography System ✅
- [ ] Inter font properly loaded with font-display: swap
- [ ] Mobile-first responsive scales implemented
- [ ] Line height and spacing follow 4px baseline
- [ ] Text hierarchy is clear and consistent
- [ ] Performance optimizations applied

#### Spacing & Layout ✅
- [ ] 4px base unit system implemented
- [ ] Touch targets meet 44px minimum
- [ ] Safe area support for mobile devices
- [ ] Grid system is flexible and responsive
- [ ] Breakpoints follow mobile-first approach

#### Glassmorphism Effects ✅
- [ ] Multiple glass variations defined
- [ ] Performance optimizations for mobile
- [ ] Fallbacks for unsupported browsers
- [ ] Chromatic aberration effects (desktop only)
- [ ] Dynamic blur based on device capabilities

#### Animation System ✅
- [ ] Spring physics presets defined
- [ ] GPU-accelerated transforms
- [ ] Reduced motion support implemented
- [ ] Performance budgets respected
- [ ] Mobile gesture support

#### Icons & Imagery ✅
- [ ] Icon system with consistent sizing
- [ ] Image optimization standards
- [ ] Loading states for all media
- [ ] WebP support with fallbacks
- [ ] Aspect ratio utilities

#### Mobile Adaptations ✅
- [ ] Touch feedback implemented
- [ ] Bottom sheet patterns
- [ ] Swipe gesture support
- [ ] Safe area handling
- [ ] Device-specific optimizations

#### Performance Standards ✅
- [ ] Performance budgets defined
- [ ] Critical CSS identified
- [ ] GPU acceleration guidelines
- [ ] Bundle size monitoring
- [ ] Frame rate targeting

### Testing Checklist

#### Cross-Browser Testing
- [ ] Chrome (latest 3 versions)
- [ ] Safari (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Edge (latest 2 versions)

#### Mobile Device Testing
- [ ] iPhone 12/13/14 (iOS Safari)
- [ ] iPhone SE (smaller screen)
- [ ] Samsung Galaxy S21/S22 (Chrome Android)
- [ ] Pixel 6/7 (Chrome Android)
- [ ] iPad Pro (tablet layout)

#### Performance Testing
- [ ] Lighthouse scores (90+ for all metrics)
- [ ] Core Web Vitals compliance
- [ ] Frame rate monitoring
- [ ] Bundle size analysis
- [ ] Network throttling tests

#### Accessibility Testing
- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] Color contrast validation
- [ ] Touch target sizing
- [ ] Reduced motion support

---

## Implementation Examples

### Example 1: Glass Card Component
```tsx
// components/ui/glass-card.tsx
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'light' | 'medium' | 'heavy';
  className?: string;
  hover?: boolean;
}

export function GlassCard({ 
  children, 
  variant = 'medium', 
  className, 
  hover = true 
}: GlassCardProps) {
  return (
    <div 
      className={cn(
        'glass-card',
        `glass-${variant}`,
        hover && 'glass-hover',
        className
      )}
    >
      {children}
    </div>
  );
}
```

### Example 2: Animated Button
```tsx
// components/ui/animated-button.tsx
import { motion } from 'framer-motion';
import { SPRING_CONFIGS } from '@/lib/animations';

interface AnimatedButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function AnimatedButton({ 
  children, 
  variant = 'primary',
  size = 'md',
  onClick 
}: AnimatedButtonProps) {
  return (
    <motion.button
      className={cn(
        'btn-base',
        variant === 'primary' ? 'btn-primary' : 'btn-glass',
        size === 'sm' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-8 py-4 text-lg'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={SPRING_CONFIGS.snappy}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
```

### Example 3: Mobile Bottom Sheet
```tsx
// components/ui/bottom-sheet.tsx
import { motion, PanInfo } from 'framer-motion';
import { useState, useCallback } from 'react';

interface BottomSheetProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export function BottomSheet({ children, isOpen, onClose }: BottomSheetProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = useCallback((
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsDragging(false);
    
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  }, [onClose]);

  return (
    <motion.div
      className="bottom-sheet"
      initial={{ y: '100%' }}
      animate={{ y: isOpen ? 0 : '100%' }}
      transition={SPRING_CONFIGS.gentle}
      drag="y"
      dragConstraints={{ top: 0 }}
      dragElastic={{ top: 0, bottom: 0.2 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
    >
      <div className="pull-handle" />
      {children}
    </motion.div>
  );
}
```

### Example 4: Performance-Aware Glass Effect
```tsx
// hooks/use-device-capabilities.ts
import { useState, useEffect } from 'react';

export function useDeviceCapabilities() {
  const [capabilities, setCapabilities] = useState({
    tier: 'high' as 'high' | 'mid' | 'low',
    supportsBackdropFilter: false,
    preferredFrameRate: 60,
  });

  useEffect(() => {
    // Detect device capabilities
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const renderer = gl?.getParameter(gl.RENDERER) || '';
    
    // Simple tier detection based on GPU
    let tier: 'high' | 'mid' | 'low' = 'mid';
    if (renderer.includes('Apple') || renderer.includes('NVIDIA')) {
      tier = 'high';
    } else if (renderer.includes('Mali') || renderer.includes('Adreno')) {
      tier = 'low';
    }

    setCapabilities({
      tier,
      supportsBackdropFilter: CSS.supports('backdrop-filter', 'blur(20px)'),
      preferredFrameRate: tier === 'high' ? 60 : tier === 'mid' ? 30 : 24,
    });
  }, []);

  return capabilities;
}

// components/ui/adaptive-glass.tsx
export function AdaptiveGlass({ children, className }: any) {
  const { tier, supportsBackdropFilter } = useDeviceCapabilities();
  
  const glassClass = useMemo(() => {
    if (!supportsBackdropFilter) return 'glass-fallback';
    
    switch (tier) {
      case 'high': return 'glass-heavy';
      case 'mid': return 'glass-medium';
      case 'low': return 'glass-light';
      default: return 'glass-medium';
    }
  }, [tier, supportsBackdropFilter]);

  return (
    <div className={cn(glassClass, className)}>
      {children}
    </div>
  );
}
```

---

## Implementation Checklist

### Phase 1: Foundation Setup (Day 1) ✅
- [ ] Install and configure design system CSS variables
- [ ] Set up Tailwind configuration with custom colors
- [ ] Install required dependencies (Framer Motion, etc.)
- [ ] Create base utility classes
- [ ] Test on multiple devices

### Phase 2: Component Library (Day 2) ✅
- [ ] Build core glass components (Card, Button, etc.)
- [ ] Implement animation system
- [ ] Create mobile-specific components
- [ ] Add performance monitoring
- [ ] Test cross-browser compatibility

### Phase 3: Advanced Effects (Day 3) ✅
- [ ] Implement multi-layer glass system
- [ ] Add chromatic aberration effects
- [ ] Create gesture recognition system
- [ ] Build device capability detection
- [ ] Optimize for mobile performance

### Phase 4: Integration (Day 4) ✅
- [ ] Integrate with existing application
- [ ] Create signal-specific components
- [ ] Build dashboard layouts
- [ ] Add data visualization styles
- [ ] Test with real data

### Phase 5: Polish & Performance (Day 5) ✅
- [ ] Performance optimization pass
- [ ] Accessibility audit
- [ ] Final cross-device testing
- [ ] Documentation updates
- [ ] Production deployment

---

*This style guide serves as the single source of truth for all design decisions in THub V2. All components and styles must adhere to these standards to ensure consistency, performance, and accessibility across the platform.*