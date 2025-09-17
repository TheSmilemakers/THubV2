/**
 * Progressive Enhancement Provider
 * Global context provider for progressive enhancement configuration
 * 
 * Features:
 * - Automatic tier detection and updates
 * - Manual user overrides with persistence
 * - Performance monitoring integration
 * - Accessibility compliance
 * - Debug mode for development
 */
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useProgressiveEnhancement, ProgressiveEnhancementConfig, EnhancementTier, UserPreferences } from '@/lib/hooks/use-progressive-enhancement';

interface ProgressiveEnhancementContextValue {
  // Current state
  currentTier: EnhancementTier;
  config: ProgressiveEnhancementConfig;
  isAutoMode: boolean;
  
  // Controls
  setTier: (tierName: 'minimal' | 'standard' | 'enhanced' | 'premium') => void;
  updateConfig: (updates: Partial<ProgressiveEnhancementConfig>) => void;
  setUserPreferences: (preferences: Partial<UserPreferences>) => void;
  toggleAutoMode: () => void;
  resetToAuto: () => void;
  
  // Utilities
  isFeatureEnabled: (feature: keyof ProgressiveEnhancementConfig) => boolean;
  getOptimalImageSize: (baseWidth: number, baseHeight: number) => { width: number; height: number };
  shouldLoadContent: (priority: 'high' | 'medium' | 'low') => boolean;
  
  // Debug information
  debugInfo: {
    deviceScore: number;
    networkScore: number;
    totalScore: number;
    autoTier: string;
    overrides: string[];
  };
}

const ProgressiveEnhancementContext = createContext<ProgressiveEnhancementContextValue | null>(null);

interface ProgressiveEnhancementProviderProps {
  children: React.ReactNode;
  debugMode?: boolean;
  persistPreferences?: boolean;
}

// Debounce helper
function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]) as T;

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

export function ProgressiveEnhancementProvider({
  children,
  debugMode = false,
  persistPreferences = true,
}: ProgressiveEnhancementProviderProps) {
  const enhancement = useProgressiveEnhancement();
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [manualTier, setManualTier] = useState<string | null>(null);
  
  // Use refs for values that shouldn't trigger re-renders
  const lastSavedPrefs = useRef<string>('');
  const isLoadingPrefs = useRef(true);
  const userPreferencesRef = useRef(enhancement.userPreferences);

  // Store enhancement methods in refs to avoid circular dependencies
  const enhancementMethodsRef = useRef({
    setTier: enhancement.setTier,
    setUserPreferences: enhancement.setUserPreferences,
  });

  // Update refs when methods change
  useEffect(() => {
    enhancementMethodsRef.current = {
      setTier: enhancement.setTier,
      setUserPreferences: enhancement.setUserPreferences,
    };
  }, [enhancement.setTier, enhancement.setUserPreferences]);

  // Load persisted preferences on mount
  useEffect(() => {
    if (!persistPreferences) {
      isLoadingPrefs.current = false;
      return;
    }

    try {
      const saved = localStorage.getItem('progressive-enhancement-preferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        if (prefs.manualTier) {
          setManualTier(prefs.manualTier);
          setIsAutoMode(false);
          enhancementMethodsRef.current.setTier(prefs.manualTier);
        }
        if (prefs.userPreferences) {
          enhancementMethodsRef.current.setUserPreferences(prefs.userPreferences);
        }
        lastSavedPrefs.current = saved;
      }
    } catch (error) {
      console.warn('Failed to load progressive enhancement preferences:', error);
    } finally {
      isLoadingPrefs.current = false;
    }
  }, [persistPreferences]); // Remove enhancement from dependencies

  // Debounced save function
  const savePreferences = useDebounce(() => {
    if (!persistPreferences || isLoadingPrefs.current) return;

    const prefs = {
      manualTier,
      userPreferences: userPreferencesRef.current, // Use ref instead
      isAutoMode,
    };

    const prefsString = JSON.stringify(prefs);
    
    // Only save if preferences actually changed
    if (prefsString !== lastSavedPrefs.current) {
      try {
        localStorage.setItem('progressive-enhancement-preferences', prefsString);
        lastSavedPrefs.current = prefsString;
      } catch (error) {
        console.warn('Failed to save progressive enhancement preferences:', error);
      }
    }
  }, 500);

  // Track userPreferences changes using ref
  useEffect(() => {
    userPreferencesRef.current = enhancement.userPreferences;
    savePreferences(); // Trigger save when userPreferences change
  }, [enhancement.userPreferences, savePreferences]);

  // Save preferences when they change (debounced)
  useEffect(() => {
    savePreferences();
  }, [manualTier, isAutoMode, savePreferences]); // Remove enhancement.userPreferences from deps

  // Memoized debug info calculation
  const debugInfo = useMemo(() => {
    if (!debugMode) {
      return {
        deviceScore: 0,
        networkScore: 0,
        totalScore: 0,
        autoTier: 'standard',
        overrides: [],
      };
    }

    const deviceCapabilities = enhancement.deviceCapabilities;
    const networkCapabilities = enhancement.networkCapabilities;
    
    // Calculate device score (0-10)
    let deviceScore = 0;
    if (deviceCapabilities.gpu === 'high-end') deviceScore += 3;
    else if (deviceCapabilities.gpu === 'mid-range') deviceScore += 2;
    else if (deviceCapabilities.gpu === 'low-end') deviceScore += 1;

    // WebGL and backdrop filter support
    if (deviceCapabilities.supportsWebGL) deviceScore += 2;
    if (deviceCapabilities.supportsBackdropFilter) deviceScore += 1;

    if (deviceCapabilities.screenSize === 'desktop') deviceScore += 1;
    else if (deviceCapabilities.screenSize === 'mobile') deviceScore -= 1;

    // Calculate network score (-5 to +5)
    let networkScore = 0;
    if (networkCapabilities.type === '5g' || networkCapabilities.type === 'wifi') networkScore += 2;
    else if (networkCapabilities.type === '4g') networkScore += 1;
    else if (networkCapabilities.type === '3g') networkScore -= 1;
    else if (networkCapabilities.type === '2g' || networkCapabilities.type === 'slow-2g') networkScore -= 2;

    if (networkCapabilities.saveData) networkScore -= 2;
    if (networkCapabilities.downlink < 1) networkScore -= 1;
    if (networkCapabilities.rtt > 300) networkScore -= 1;

    const totalScore = deviceScore + networkScore;
    
    // Determine overrides
    const overrides: string[] = [];
    if (enhancement.userPreferences.prefersReducedMotion) overrides.push('Reduced Motion');
    if (enhancement.userPreferences.prefersHighContrast) overrides.push('High Contrast');
    if (enhancement.userPreferences.dataUsageMode !== 'unlimited') overrides.push('Data Saving');
    if (!isAutoMode) overrides.push('Manual Override');

    return {
      deviceScore,
      networkScore,
      totalScore,
      autoTier: enhancement.currentTier.name,
      overrides,
    };
  }, [
    debugMode,
    enhancement.currentTier.name,
    enhancement.deviceCapabilities,
    enhancement.networkCapabilities,
    enhancement.userPreferences,
    isAutoMode
  ]);

  // Control methods
  const setTier = useCallback((tierName: 'minimal' | 'standard' | 'enhanced' | 'premium') => {
    setManualTier(tierName);
    setIsAutoMode(false);
    enhancement.setTier(tierName);
  }, [enhancement]);

  const updateConfig = useCallback((updates: Partial<ProgressiveEnhancementConfig>) => {
    enhancement.updateConfig(updates);
  }, [enhancement]);

  const setUserPreferences = useCallback((preferences: Partial<UserPreferences>) => {
    enhancement.setUserPreferences(prev => ({ ...prev, ...preferences }));
  }, [enhancement]);

  const toggleAutoMode = useCallback(() => {
    setIsAutoMode(prev => !prev);
    if (!isAutoMode) {
      // Switching to auto mode - let the hook determine the tier
      setManualTier(null);
    }
  }, [isAutoMode]);

  const resetToAuto = useCallback(() => {
    setIsAutoMode(true);
    setManualTier(null);
    // Clear any manual config overrides
    // The hook will automatically recalculate the optimal tier
  }, []);

  // Utility methods
  const isFeatureEnabled = useCallback((feature: keyof ProgressiveEnhancementConfig) => {
    const value = enhancement.config[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value !== 'none' && value !== 'disabled';
    return true;
  }, [enhancement.config]);

  const getOptimalImageSize = useCallback((baseWidth: number, baseHeight: number) => {
    const { screenSize } = enhancement.deviceCapabilities;
    const { saveData } = enhancement.networkCapabilities;
    const { dataUsageMode } = enhancement.userPreferences;
    
    let multiplier = 1;
    
    // Adjust based on screen size
    if (screenSize === 'mobile') multiplier = 0.5;
    else if (screenSize === 'tablet') multiplier = 0.75;
    else if (screenSize === 'desktop') multiplier = 1;
    
    // Adjust based on data usage preferences
    if (saveData) multiplier *= 0.5;
    if (dataUsageMode === 'conservative') multiplier *= 0.75;
    if (dataUsageMode === 'minimal') multiplier *= 0.5;
    
    // Ensure minimum readable size
    const minWidth = 100;
    const minHeight = 100;
    
    return {
      width: Math.max(Math.round(baseWidth * multiplier), minWidth),
      height: Math.max(Math.round(baseHeight * multiplier), minHeight),
    };
  }, [
    enhancement.deviceCapabilities.screenSize,
    enhancement.networkCapabilities.saveData,
    enhancement.userPreferences.dataUsageMode
  ]);

  const shouldLoadContent = useCallback((priority: 'high' | 'medium' | 'low') => {
    const { config, networkCapabilities, userPreferences } = enhancement;
    
    // Always load high priority content
    if (priority === 'high') return true;
    
    // Check data usage preferences
    if (userPreferences.dataUsageMode === 'minimal') {
      return false; // Only high priority already handled above
    }
    
    if (userPreferences.dataUsageMode === 'conservative') {
      return priority !== 'low';
    }
    
    // Check network conditions
    if (networkCapabilities.saveData) {
      return false; // Only high priority already handled above
    }
    
    if (networkCapabilities.type === '2g' || networkCapabilities.type === 'slow-2g') {
      return priority !== 'low';
    }
    
    // Check if prefetching is disabled
    if (!config.prefetching && priority === 'low') {
      return false;
    }
    
    return true;
  }, [enhancement]);

  const contextValue: ProgressiveEnhancementContextValue = {
    currentTier: enhancement.currentTier,
    config: enhancement.config,
    isAutoMode,
    setTier,
    updateConfig,
    setUserPreferences,
    toggleAutoMode,
    resetToAuto,
    isFeatureEnabled,
    getOptimalImageSize,
    shouldLoadContent,
    debugInfo,
  };

  return (
    <ProgressiveEnhancementContext.Provider value={contextValue}>
      {children}
      
      {/* Debug overlay */}
      {debugMode && (
        <div className="fixed bottom-4 right-4 z-50 bg-background-primary/90 backdrop-blur-sm border border-border-primary rounded-lg p-4 text-xs font-mono max-w-xs">
          <div className="text-text-primary font-bold mb-2">Progressive Enhancement Debug</div>
          <div className="space-y-1 text-text-secondary">
            <div>Tier: <span className="text-accent-primary">{enhancement.currentTier.name}</span></div>
            <div>Mode: <span className="text-accent-secondary">{isAutoMode ? 'Auto' : 'Manual'}</span></div>
            <div>Device Score: <span className="text-text-primary">{debugInfo.deviceScore}/10</span></div>
            <div>Network Score: <span className="text-text-primary">{debugInfo.networkScore}/5</span></div>
            <div>Total Score: <span className="text-text-primary">{debugInfo.totalScore}</span></div>
            {debugInfo.overrides.length > 0 && (
              <div>Overrides: <span className="text-status-warning">{debugInfo.overrides.join(', ')}</span></div>
            )}
          </div>
        </div>
      )}
    </ProgressiveEnhancementContext.Provider>
  );
}

export function useProgressiveEnhancementContext() {
  const context = useContext(ProgressiveEnhancementContext);
  
  // Return SSR-safe defaults if context is not available
  if (!context) {
    // During SSR or when provider is missing, return safe defaults
    if (typeof window === 'undefined') {
      // Server-side: return minimal defaults
      return {
        currentTier: { 
          name: 'standard' as const, 
          description: 'Balanced experience - good performance with essential enhancements',
          config: {
            animations: 'reduced' as const,
            glassmorphism: 'light' as const,
            interactions: 'enhanced' as const,
            particleEffects: false,
            advancedShaders: false,
            highRefreshRate: false,
            hardwareAcceleration: false,
            autoRefresh: true,
            backgroundUpdates: false,
            imageOptimization: 'webp' as const,
            prefetching: false,
            reducedMotion: false,
            highContrast: false,
            largeText: false,
            focusIndicators: 'standard' as const,
          }
        },
        config: {
          animations: 'reduced' as const,
          glassmorphism: 'light' as const,
          interactions: 'enhanced' as const,
          particleEffects: false,
          advancedShaders: false,
          highRefreshRate: false,
          hardwareAcceleration: false,
          autoRefresh: true,
          backgroundUpdates: false,
          imageOptimization: 'webp' as const,
          prefetching: false,
          reducedMotion: false,
          highContrast: false,
          largeText: false,
          focusIndicators: 'standard' as const,
        },
        isAutoMode: true,
        setTier: () => {},
        setUserPreferences: () => {},
        toggleAutoMode: () => {},
        resetToAuto: () => {},
        isFeatureEnabled: () => false,
        getOptimalImageSize: () => ({ width: 800, height: 600, quality: 80 }),
        shouldLoadContent: () => true,
        debugInfo: {
          deviceScore: 5,
          networkScore: 2.5,
          totalScore: 5,
          overrides: [],
        },
      };
    }
    
    // Client-side without provider - this is an error
    console.error('useProgressiveEnhancementContext must be used within a ProgressiveEnhancementProvider');
    throw new Error('useProgressiveEnhancementContext must be used within a ProgressiveEnhancementProvider');
  }
  
  return context;
}

/**
 * Higher-order component for progressive enhancement
 */
export function withProgressiveEnhancement<T extends object>(
  Component: React.ComponentType<T>,
  options?: {
    fallback?: React.ComponentType<T>;
    requiredFeatures?: (keyof ProgressiveEnhancementConfig)[];
  }
) {
  return function EnhancedComponent(props: T) {
    const { isFeatureEnabled } = useProgressiveEnhancementContext();
    
    // Check if all required features are enabled
    if (options?.requiredFeatures) {
      const hasAllFeatures = options.requiredFeatures.every(feature => isFeatureEnabled(feature));
      if (!hasAllFeatures && options.fallback) {
        return <options.fallback {...props} />;
      }
    }
    
    return <Component {...props} />;
  };
}