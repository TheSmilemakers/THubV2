/**
 * Progressive Enhancement Hook
 * Adapts UI features based on device capabilities, connection quality, and user preferences
 * 
 * Features:
 * - Automatic capability detection
 * - Graceful degradation for low-end devices
 * - Network-aware optimizations
 * - User preference overrides
 * - Accessibility-first approach
 */
import { useState, useEffect, useCallback } from 'react';
import { useDeviceCapabilities } from './use-device-capabilities';

export interface ProgressiveEnhancementConfig {
  // Core capabilities
  animations: 'none' | 'reduced' | 'standard' | 'enhanced';
  glassmorphism: 'disabled' | 'light' | 'medium' | 'heavy';
  interactions: 'basic' | 'enhanced' | 'premium';
  
  // Performance features
  particleEffects: boolean;
  advancedShaders: boolean;
  highRefreshRate: boolean;
  hardwareAcceleration: boolean;
  
  // Data features
  autoRefresh: boolean;
  backgroundUpdates: boolean;
  imageOptimization: 'basic' | 'webp' | 'avif';
  prefetching: boolean;
  
  // Accessibility
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  focusIndicators: 'standard' | 'enhanced';
}

export interface NetworkCapabilities {
  type: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'unknown';
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
}

export interface UserPreferences {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  prefersLargeText: boolean;
  dataUsageMode: 'unlimited' | 'conservative' | 'minimal';
  performanceMode: 'auto' | 'performance' | 'battery';
}

export interface EnhancementTier {
  name: 'minimal' | 'standard' | 'enhanced' | 'premium';
  description: string;
  config: ProgressiveEnhancementConfig;
}

const ENHANCEMENT_TIERS: Record<string, EnhancementTier> = {
  minimal: {
    name: 'minimal',
    description: 'Essential features only - optimized for low-end devices and slow connections',
    config: {
      animations: 'none',
      glassmorphism: 'disabled',
      interactions: 'basic',
      particleEffects: false,
      advancedShaders: false,
      highRefreshRate: false,
      hardwareAcceleration: false,
      autoRefresh: false,
      backgroundUpdates: false,
      imageOptimization: 'basic',
      prefetching: false,
      reducedMotion: true,
      highContrast: false,
      largeText: false,
      focusIndicators: 'standard',
    },
  },
  standard: {
    name: 'standard',
    description: 'Balanced experience - good performance with essential enhancements',
    config: {
      animations: 'reduced',
      glassmorphism: 'light',
      interactions: 'enhanced',
      particleEffects: false,
      advancedShaders: false,
      highRefreshRate: false,
      hardwareAcceleration: true,
      autoRefresh: true,
      backgroundUpdates: false,
      imageOptimization: 'webp',
      prefetching: false,
      reducedMotion: false,
      highContrast: false,
      largeText: false,
      focusIndicators: 'standard',
    },
  },
  enhanced: {
    name: 'enhanced',
    description: 'Rich experience - premium features for capable devices',
    config: {
      animations: 'standard',
      glassmorphism: 'medium',
      interactions: 'premium',
      particleEffects: true,
      advancedShaders: false,
      highRefreshRate: true,
      hardwareAcceleration: true,
      autoRefresh: true,
      backgroundUpdates: true,
      imageOptimization: 'webp',
      prefetching: true,
      reducedMotion: false,
      highContrast: false,
      largeText: false,
      focusIndicators: 'enhanced',
    },
  },
  premium: {
    name: 'premium',
    description: 'Maximum experience - all features for high-end devices',
    config: {
      animations: 'enhanced',
      glassmorphism: 'heavy',
      interactions: 'premium',
      particleEffects: true,
      advancedShaders: true,
      highRefreshRate: true,
      hardwareAcceleration: true,
      autoRefresh: true,
      backgroundUpdates: true,
      imageOptimization: 'avif',
      prefetching: true,
      reducedMotion: false,
      highContrast: false,
      largeText: false,
      focusIndicators: 'enhanced',
    },
  },
};

export function useProgressiveEnhancement() {
  const deviceCapabilities = useDeviceCapabilities();
  const [networkCapabilities, setNetworkCapabilities] = useState<NetworkCapabilities>({
    type: 'unknown',
    downlink: 10,
    rtt: 100,
    saveData: false,
  });
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersLargeText: false,
    dataUsageMode: 'unlimited',
    performanceMode: 'auto',
  });
  const [currentTier, setCurrentTier] = useState<EnhancementTier>(ENHANCEMENT_TIERS.standard);
  const [config, setConfig] = useState<ProgressiveEnhancementConfig>(ENHANCEMENT_TIERS.standard.config);

  // Detect network capabilities
  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      if (connection) {
        setNetworkCapabilities({
          type: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 100,
          saveData: connection.saveData || false,
        });
      }
    };

    updateNetworkInfo();
    
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
      return () => connection.removeEventListener('change', updateNetworkInfo);
    }
  }, []);

  // Detect user preferences
  useEffect(() => {
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      largeText: window.matchMedia('(prefers-reduced-data: reduce)'),
    };

    const updatePreferences = () => {
      setUserPreferences(prev => ({
        ...prev,
        prefersReducedMotion: mediaQueries.reducedMotion.matches,
        prefersHighContrast: mediaQueries.highContrast.matches,
        prefersLargeText: false, // TODO: Implement text size detection
      }));
    };

    updatePreferences();

    // Listen for changes
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updatePreferences);
    });

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updatePreferences);
      });
    };
  }, []);

  // Calculate optimal enhancement tier
  const calculateOptimalTier = useCallback((): EnhancementTier => {
    let score = 0;

    // Device capability scoring
    if (deviceCapabilities.gpu === 'high-end') score += 3;
    else if (deviceCapabilities.gpu === 'mid-range') score += 2;
    else if (deviceCapabilities.gpu === 'low-end') score += 1;

    // WebGL and backdrop filter support
    if (deviceCapabilities.supportsWebGL) score += 1;
    if (deviceCapabilities.supportsBackdropFilter) score += 1;

    // Network scoring
    if (networkCapabilities.type === '5g' || networkCapabilities.type === 'wifi') score += 2;
    else if (networkCapabilities.type === '4g') score += 1;
    else if (networkCapabilities.type === '3g') score -= 1;
    else if (networkCapabilities.type === '2g' || networkCapabilities.type === 'slow-2g') score -= 2;

    if (networkCapabilities.saveData) score -= 2;
    if (networkCapabilities.downlink < 1) score -= 1;
    if (networkCapabilities.rtt > 300) score -= 1;

    // User preference overrides
    if (userPreferences.prefersReducedMotion) score -= 2;
    if (userPreferences.dataUsageMode === 'conservative') score -= 1;
    if (userPreferences.dataUsageMode === 'minimal') score -= 3;
    if (userPreferences.performanceMode === 'battery') score -= 2;
    if (userPreferences.performanceMode === 'performance') score += 1;

    // Screen size considerations
    if (deviceCapabilities.screenSize === 'mobile') score -= 1;
    if (deviceCapabilities.screenSize === 'desktop') score += 1;

    // Determine tier based on score
    if (score >= 8) return ENHANCEMENT_TIERS.premium;
    if (score >= 5) return ENHANCEMENT_TIERS.enhanced;
    if (score >= 2) return ENHANCEMENT_TIERS.standard;
    return ENHANCEMENT_TIERS.minimal;
  }, [deviceCapabilities, networkCapabilities, userPreferences]);

  // Update tier when dependencies change
  useEffect(() => {
    const optimalTier = calculateOptimalTier();
    setCurrentTier(optimalTier);
    
    // Apply user preference overrides to config
    const adjustedConfig = { ...optimalTier.config };
    
    if (userPreferences.prefersReducedMotion) {
      adjustedConfig.animations = 'none';
      adjustedConfig.particleEffects = false;
    }
    
    if (userPreferences.prefersHighContrast) {
      adjustedConfig.highContrast = true;
      adjustedConfig.glassmorphism = 'disabled'; // High contrast mode disables transparency
    }
    
    if (userPreferences.prefersLargeText) {
      adjustedConfig.largeText = true;
    }
    
    if (networkCapabilities.saveData) {
      adjustedConfig.autoRefresh = false;
      adjustedConfig.backgroundUpdates = false;
      adjustedConfig.prefetching = false;
      adjustedConfig.imageOptimization = 'basic';
    }

    setConfig(adjustedConfig);
  }, [calculateOptimalTier, userPreferences, networkCapabilities]);

  // Manual tier override
  const setTier = useCallback((tierName: keyof typeof ENHANCEMENT_TIERS) => {
    const tier = ENHANCEMENT_TIERS[tierName];
    if (tier) {
      setCurrentTier(tier);
      setConfig(tier.config);
    }
  }, []);

  // Manual config override
  const updateConfig = useCallback((updates: Partial<ProgressiveEnhancementConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Convenience methods for common feature checks
  const shouldUseAnimations = config.animations !== 'none';
  const shouldUseGlassmorphism = config.glassmorphism !== 'disabled';
  const shouldUseParticleEffects = config.particleEffects;
  const shouldUseHardwareAcceleration = config.hardwareAcceleration;
  const shouldAutoRefresh = config.autoRefresh;
  const shouldPrefetch = config.prefetching;

  // Feature flag methods
  const getAnimationClass = useCallback((standard: string, reduced: string, enhanced?: string) => {
    switch (config.animations) {
      case 'none': return '';
      case 'reduced': return reduced;
      case 'standard': return standard;
      case 'enhanced': return enhanced || standard;
      default: return standard;
    }
  }, [config.animations]);

  const getGlassClass = useCallback(() => {
    switch (config.glassmorphism) {
      case 'disabled': return 'bg-background-secondary border border-border-primary';
      case 'light': return 'glass-light';
      case 'medium': return 'glass-medium';
      case 'heavy': return 'glass-heavy';
      default: return 'glass-light';
    }
  }, [config.glassmorphism]);

  const getImageFormat = useCallback(() => {
    switch (config.imageOptimization) {
      case 'basic': return 'jpg';
      case 'webp': return 'webp';
      case 'avif': return 'avif';
      default: return 'webp';
    }
  }, [config.imageOptimization]);

  return {
    // Current state
    currentTier,
    config,
    networkCapabilities,
    userPreferences,
    deviceCapabilities,
    
    // Control methods
    setTier,
    updateConfig,
    setUserPreferences,
    
    // Convenience flags
    shouldUseAnimations,
    shouldUseGlassmorphism,
    shouldUseParticleEffects,
    shouldUseHardwareAcceleration,
    shouldAutoRefresh,
    shouldPrefetch,
    
    // Helper methods
    getAnimationClass,
    getGlassClass,
    getImageFormat,
    
    // Available tiers
    availableTiers: Object.values(ENHANCEMENT_TIERS),
  };
}

/**
 * Hook for component-specific progressive enhancement
 */
export function useComponentEnhancement(componentType: 'card' | 'button' | 'chart' | 'list' | 'modal') {
  const { config, getAnimationClass, getGlassClass } = useProgressiveEnhancement();
  
  const getComponentConfig = useCallback(() => {
    const baseConfig = {
      animations: config.animations !== 'none',
      glassmorphism: config.glassmorphism !== 'disabled',
      interactions: config.interactions !== 'basic',
      hardwareAcceleration: config.hardwareAcceleration,
    };

    switch (componentType) {
      case 'card':
        return {
          ...baseConfig,
          hoverEffects: config.interactions === 'premium',
          magneticEffect: config.interactions === 'premium' && config.animations === 'enhanced',
        } as any;
      
      case 'button':
        return {
          ...baseConfig,
          rippleEffect: config.interactions !== 'basic',
          morphingStates: config.interactions === 'premium',
        } as any;
      
      case 'chart':
        return {
          ...baseConfig,
          smoothAnimations: config.animations !== 'none',
          particleTrails: config.particleEffects,
          realtimeUpdates: config.autoRefresh,
        };
      
      case 'list':
        return {
          ...baseConfig,
          virtualScrolling: true, // Always use for performance
          lazyLoading: true,
          smoothScrolling: config.animations !== 'none',
        };
      
      case 'modal':
        return {
          ...baseConfig,
          backdropBlur: config.glassmorphism !== 'disabled',
          springAnimations: config.animations === 'enhanced',
        };
      
      default:
        return baseConfig;
    }
  }, [componentType, config]);

  return {
    config: getComponentConfig(),
    getAnimationClass,
    getGlassClass,
  };
}