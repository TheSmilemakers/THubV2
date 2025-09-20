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
          
          {/* Floating particles */}
          <div className="particles-professional">
            {[...Array(20)].map((_, i) => (
              <div
                key={`particle-${i}`}
                className="particle-orb"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${15 + Math.random() * 10}s`,
                }}
              />
            ))}
          </div>
          
          {/* Binary characters - only show after initialization */}
          {isInitialized && (
            <div className="absolute inset-0">
              {[...Array(15)].map((_, i) => (
                <div
                  key={`binary-${i}`}
                  className="binary-char"
                  style={{
                    left: `${Math.random() * 100}%`,
                    fontSize: `${12 + Math.random() * 8}px`,
                    animationDelay: `${i * 0.8}s`,
                    animationDuration: `${8 + Math.random() * 4}s`,
                  }}
                >
                  {Math.random() > 0.5 ? '1' : '0'}
                </div>
              ))}
            </div>
          )}
          
          {/* Lightning effects - only show after initialization */}
          {isInitialized && (
            <div className="lightning-container">
              {/* Lightning Strike 1 - Complex zigzag from top-left */}
              <svg className="lightning-svg lightning-strike-1" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path 
                  className="lightning-path"
                  d="M 8 3 L 12 15 L 18 12 L 22 28 L 28 24 L 32 42 L 38 38 L 45 55 L 52 50 L 58 68 L 65 64 L 72 82 L 78 78 L 85 95"
                />
                <path 
                  className="lightning-branch"
                  d="M 22 28 L 30 32 L 35 38 L 42 44"
                />
                <path 
                  className="lightning-branch"
                  d="M 45 55 L 40 62 L 35 68"
                />
                <path 
                  className="lightning-branch"
                  d="M 65 64 L 72 70 L 75 78"
                />
              </svg>
              
              {/* Lightning Strike 2 - Intricate center strike */}
              <svg className="lightning-svg lightning-strike-2" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path 
                  className="lightning-path"
                  d="M 45 1 L 48 12 L 52 8 L 55 22 L 60 18 L 62 35 L 58 32 L 65 48 L 70 44 L 75 62 L 80 58 L 85 76 L 90 72 L 95 88 L 92 95"
                />
                <path 
                  className="lightning-branch"
                  d="M 55 22 L 48 28 L 42 35 L 38 42"
                />
                <path 
                  className="lightning-branch"
                  d="M 62 35 L 55 42 L 50 48"
                />
                <path 
                  className="lightning-branch"
                  d="M 75 62 L 82 68 L 88 75"
                />
              </svg>
              
              {/* Lightning Strike 3 - Dense branching from top-right */}
              <svg className="lightning-svg lightning-strike-3" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path 
                  className="lightning-path"
                  d="M 92 5 L 88 18 L 82 15 L 78 32 L 72 28 L 68 45 L 62 42 L 55 58 L 48 55 L 42 72 L 35 68 L 28 85 L 22 82 L 15 95"
                />
                <path 
                  className="lightning-branch"
                  d="M 78 32 L 85 38 L 90 45"
                />
                <path 
                  className="lightning-branch"
                  d="M 68 45 L 75 52 L 80 58"
                />
                <path 
                  className="lightning-branch"
                  d="M 55 58 L 62 65 L 68 72"
                />
                <path 
                  className="lightning-branch"
                  d="M 42 72 L 35 78 L 28 85"
                />
              </svg>
              
              {/* Lightning Strike 4 - Horizontal web pattern */}
              <svg className="lightning-svg lightning-strike-4" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path 
                  className="lightning-path"
                  d="M 2 28 L 12 32 L 8 35 L 18 38 L 22 42 L 32 45 L 28 48 L 38 52 L 42 55 L 52 58 L 48 62 L 58 65 L 62 68 L 72 72 L 68 75 L 78 78 L 82 82 L 92 85 L 98 88"
                />
                <path 
                  className="lightning-branch"
                  d="M 18 38 L 22 48 L 28 55 L 32 62"
                />
                <path 
                  className="lightning-branch"
                  d="M 42 55 L 45 65 L 50 72"
                />
                <path 
                  className="lightning-branch"
                  d="M 62 68 L 68 78 L 72 85"
                />
              </svg>
              
              {/* Lightning Strike 5 - Complex vertical with multiple branches */}
              <svg className="lightning-svg lightning-strike-5" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path 
                  className="lightning-path"
                  d="M 50 2 L 48 15 L 52 12 L 49 28 L 53 25 L 47 42 L 51 38 L 46 55 L 54 52 L 52 68 L 48 65 L 51 82 L 47 78 L 50 95"
                />
                <path 
                  className="lightning-branch"
                  d="M 49 28 L 38 35 L 32 42 L 25 48"
                />
                <path 
                  className="lightning-branch"
                  d="M 53 25 L 62 32 L 68 38 L 75 45"
                />
                <path 
                  className="lightning-branch"
                  d="M 47 42 L 35 48 L 28 55"
                />
                <path 
                  className="lightning-branch"
                  d="M 51 38 L 65 45 L 72 52"
                />
                <path 
                  className="lightning-branch"
                  d="M 46 55 L 32 62 L 25 68"
                />
                <path 
                  className="lightning-branch"
                  d="M 54 52 L 68 58 L 75 65"
                />
              </svg>
              
              {/* Screen flash effect */}
              <div className="lightning-screen-flash"></div>
            </div>
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
      
      <div className="container mx-auto px-4 z-10">
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
          <div className={cn("glass-hero max-w-5xl mx-auto p-12 rounded-3xl", {
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