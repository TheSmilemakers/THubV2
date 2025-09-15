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

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

export function ProgressiveEnhancementProvider({
  children,
  debugMode = false,
  persistPreferences = true,
}: ProgressiveEnhancementProviderProps) {
  const enhancement = useProgressiveEnhancement();
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [manualTier, setManualTier] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState({
    deviceScore: 0,
    networkScore: 0,
    totalScore: 0,
    autoTier: 'standard',
    overrides: [] as string[],
  });

  // Load persisted preferences on mount
  useEffect(() => {
    if (!persistPreferences) return;

    try {
      const saved = localStorage.getItem('progressive-enhancement-preferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        if (prefs.manualTier) {
          setManualTier(prefs.manualTier);
          setIsAutoMode(false);
          enhancement.setTier(prefs.manualTier);
        }
        if (prefs.userPreferences) {
          enhancement.setUserPreferences(prefs.userPreferences);
        }
      }
    } catch (error) {
      console.warn('Failed to load progressive enhancement preferences:', error);
    }
  }, [persistPreferences, enhancement]);

  // Save preferences when they change
  useEffect(() => {
    if (!persistPreferences) return;

    const prefs = {
      manualTier,
      userPreferences: enhancement.userPreferences,
      isAutoMode,
    };

    try {
      localStorage.setItem('progressive-enhancement-preferences', JSON.stringify(prefs));
    } catch (error) {
      console.warn('Failed to save progressive enhancement preferences:', error);
    }
  }, [manualTier, enhancement.userPreferences, isAutoMode, persistPreferences]);

  // Update debug info
  useEffect(() => {
    if (!debugMode) return;

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

    setDebugInfo({
      deviceScore,
      networkScore,
      totalScore,
      autoTier: enhancement.currentTier.name,
      overrides,
    });
  }, [debugMode, enhancement, isAutoMode]);

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
    const { config } = enhancement;
    
    let multiplier = 1;
    
    // Adjust based on screen size
    if (screenSize === 'mobile') multiplier = 0.5;
    else if (screenSize === 'tablet') multiplier = 0.75;
    else if (screenSize === 'desktop') multiplier = 1;
    
    // Adjust based on data usage preferences
    if (enhancement.networkCapabilities.saveData) multiplier *= 0.5;
    if (enhancement.userPreferences.dataUsageMode === 'conservative') multiplier *= 0.75;
    if (enhancement.userPreferences.dataUsageMode === 'minimal') multiplier *= 0.5;
    
    // Ensure minimum readable size
    const minWidth = 100;
    const minHeight = 100;
    
    return {
      width: Math.max(Math.round(baseWidth * multiplier), minWidth),
      height: Math.max(Math.round(baseHeight * multiplier), minHeight),
    };
  }, [enhancement]);

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
  if (!context) {
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