'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '@/lib/themes/use-theme';
import { cn } from '@/lib/utils';
import { HeroBackground } from './hero-background';
import { HeroContent } from './hero-content';
import { LoadingSequence } from './loading-sequence';
import { RotatingDisc } from './rotating-disc';
import { RotatingDiscCss } from './rotating-disc-css';
import { TerminalWindow } from '@/components/landing/shared/terminal-window';
import { ThemeToggle } from '@/components/landing/shared/theme-toggle';
import { LightningGenerator } from '@/components/effects/lightning-generator';

export function HeroSection() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [componentKey, setComponentKey] = useState(0);
  const reinitTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const errorTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  // Set mounted state for hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Check if we've already initialized (persists across theme changes)
  useEffect(() => {
    const initialized = sessionStorage.getItem('thub-initialized');
    if (initialized === 'true') {
      // Set initialized immediately to ensure effects show
      setIsInitialized(true);
      // Then force re-mount after a brief delay for proper rendering
      setTimeout(() => {
        setComponentKey(prev => prev + 1);
      }, 50);
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reinitTimeoutRef.current) {
        clearTimeout(reinitTimeoutRef.current);
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);
  
  const handleInitialize = () => {
    // Clear any existing error
    setHasError(false);
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    
    // Reset states if re-initializing
    if (isInitialized) {
      setIsInitialized(false);
      sessionStorage.removeItem('thub-initialized');
      // Small delay to allow exit animations
      reinitTimeoutRef.current = setTimeout(() => {
        setIsInitializing(true);
        startErrorTimeout();
      }, 100);
    } else {
      setIsInitializing(true);
      startErrorTimeout();
    }
  };
  
  const startErrorTimeout = () => {
    // 10 second timeout fallback
    errorTimeoutRef.current = setTimeout(() => {
      if (isInitializing && !isInitialized) {
        setHasError(true);
        setIsInitialized(true);
        setIsInitializing(false);
      }
    }, 10000);
  };
  
  const handleLoadingComplete = () => {
    // Clear error timeout if loading completes successfully
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    setIsInitialized(true);
    setIsInitializing(false);
    setHasError(false);
    // Force re-mount of components to ensure proper rendering
    setComponentKey(prev => prev + 1);
    // Save initialized state to persist across theme changes
    sessionStorage.setItem('thub-initialized', 'true');
  };
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Render HeroBackground for animated themes */}
      <AnimatePresence mode="wait">
        {(theme === 'synthwave' || theme === 'professional') && (
          <motion.div
            key={`hero-background-${theme}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <HeroBackground />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* CSS-based particles for professional theme */}
      {theme === 'professional' && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Mesh gradient overlay */}
          <div className="mesh-gradient-professional" />
          
          {/* Floating particles - reduced from 20 to 8 for performance */}
          <div className="particles-professional">
            {[...Array(8)].map((_, i) => (
              <div
                key={`particle-${i}`}
                className="particle-orb"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 1.2}s`,
                  animationDuration: `${20 + Math.random() * 10}s`,
                }}
              />
            ))}
          </div>
          
          {/* Binary characters - reduced from 15 to 6 for performance */}
          {isInitialized && (
            <div className="absolute inset-0">
              {[...Array(12)].map((_, i) => (
                <div
                  key={`binary-${i}`}
                  className="binary-char"
                  style={{
                    left: `${Math.random() * 100}%`,
                    fontSize: `${14 + Math.random() * 6}px`,
                    animationDelay: `${i * 1.5}s`,
                    animationDuration: `${10 + Math.random() * 5}s`,
                  }}
                >
                  {Math.random() > 0.5 ? '1' : '0'}
                </div>
              ))}
            </div>
          )}
          
          {/* Lightning effects - only show after initialization */}
          {isInitialized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute inset-0 pointer-events-none"
            >
              <LightningGenerator
                className="absolute inset-0"
                config={{
                  // Professional theme: subtle and elegant
                  maxSegmentLength: 60,
                  minSegmentLength: 15,
                  chaosFactor: Math.PI / 8, // Less chaotic, more elegant
                  displacementFactor: 0.2, // Less displacement for smoother bolts
                  branchProbability: 0.25, // Fewer branches
                  maxBranchDepth: 3,
                  branchAngleVariation: Math.PI / 10, // Smaller angle variation
                  branchLengthDecay: 0.6,
                  branchIntensityDecay: 0.5,
                  baseWidth: 2,
                  widthDecay: 0.85,
                  glowIntensity: 1.5
                }}
                strikeInterval={6000} // Even less frequent for better performance
                strikeDuration={120} // Shorter duration for less GPU load
                maxConcurrentStrikes={1} // Only one strike at a time
                colorCore="#ffffff"
                colorGlow="#e0e7ff"
                colorOuter="#c7d2fe"
                glowRadius={15}
                enabled={theme === 'professional'}
              />
            </motion.div>
          )}
        </div>
      )}
      
      {/* Rotating disc effect during and after initialization */}
      <AnimatePresence>
        {(isInitializing || isInitialized) && theme === 'synthwave' && (
          <motion.div 
            key={`rotating-disc-${componentKey}`}
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-full h-2/3 flex items-center justify-center">
              <RotatingDisc />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Professional theme loading animation */}
      <AnimatePresence>
        {isInitializing && theme === 'professional' && (
          <motion.div 
            className="absolute inset-0 z-20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Radial pulse effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-96 h-96 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl animate-pulse" />
            </div>
            
            {/* Scanning lines effect */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-scan-vertical" />
              <div className="absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-secondary/50 to-transparent animate-scan-horizontal" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Theme Toggle for Professional theme - smaller and mobile responsive */}
      {theme !== 'synthwave' && (
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-30">
          <ThemeToggle disabled={isInitializing} />
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8 md:py-0 z-10">
        {theme === 'synthwave' ? (
          <TerminalWindow 
            title="THUB://V2.0" 
            className="max-w-5xl mx-auto"
            animated={true}
            themeToggle={<ThemeToggle disabled={isInitializing} size="sm" />}
          >
            {isInitializing && <LoadingSequence onComplete={handleLoadingComplete} />}
            <HeroContent 
              onInitialize={handleInitialize}
              isInitializing={isInitializing}
              isInitialized={isInitialized}
              hasError={hasError}
            />
          </TerminalWindow>
        ) : (
          <div className={cn("glass-hero max-w-5xl mx-auto p-6 md:p-12 rounded-3xl", {
            "initialized": isInitialized
          })}>
            {isInitializing && (
              <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20">
                <LoadingSequence onComplete={handleLoadingComplete} />
              </div>
            )}
            <HeroContent 
              onInitialize={handleInitialize}
              isInitializing={isInitializing}
              isInitialized={isInitialized}
              hasError={hasError}
            />
          </div>
        )}
      </div>
      
      {/* Scroll indicator - only show in professional theme when not initializing */}
      {theme !== 'synthwave' && !isInitializing && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex flex-col items-center gap-2 opacity-70">
            <div className="w-5 h-8 border border-text-secondary/30 rounded-full flex justify-center">
              <div className="w-1 h-2 bg-text-secondary/50 rounded-full mt-2 animate-bounce" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}