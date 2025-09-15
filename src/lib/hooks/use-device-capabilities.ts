'use client';

import { useState, useEffect } from 'react';

/**
 * Device capability detection for performance optimization
 * Detects GPU tier, screen size, network speed, and accessibility preferences
 */

export interface DeviceCapabilities {
  gpu: 'high-end' | 'mid-range' | 'low-end';
  touch: boolean;
  reducedMotion: boolean;
  networkSpeed: '4g' | '3g' | 'slow-2g' | 'unknown';
  screenSize: 'mobile' | 'tablet' | 'desktop';
  pixelRatio: number;
  supportsBackdropFilter: boolean;
  supportsWebGL: boolean;
}

export interface AdaptiveGlassConfig {
  blur: string;
  effects: boolean;
  animations: 'full' | 'reduced' | 'none';
  shadowLevel: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Primary hook for device capability detection
 */
export function useDeviceCapabilities(): DeviceCapabilities {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    gpu: 'mid-range',
    touch: false,
    reducedMotion: false,
    networkSpeed: 'unknown',
    screenSize: 'desktop',
    pixelRatio: 1,
    supportsBackdropFilter: false,
    supportsWebGL: false,
  });

  useEffect(() => {
    const detectCapabilities = () => {
      // GPU tier detection via WebGL
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      let gpu: 'high-end' | 'mid-range' | 'low-end' = 'mid-range';
      let supportsWebGL = false;
      
      if (gl) {
        supportsWebGL = true;
        const webgl = gl as WebGLRenderingContext;
        const renderer = webgl.getParameter(webgl.RENDERER) || '';
        const vendor = webgl.getParameter(webgl.VENDOR) || '';
        
        // Enhanced GPU tier detection for better mobile performance classification
        if (
          // High-end mobile GPUs (60fps target achievable)
          renderer.includes('Apple') && (renderer.includes('A15') || renderer.includes('A16') || renderer.includes('A17') || renderer.includes('A18')) ||
          renderer.includes('Adreno 7') || // Snapdragon 8 Gen series
          renderer.includes('Mali-G715') || renderer.includes('Mali-G720') || // Latest ARM GPUs
          // High-end desktop GPUs
          renderer.includes('NVIDIA') && (renderer.includes('RTX') || renderer.includes('GTX 1060')) ||
          renderer.includes('AMD') && (renderer.includes('RX 6') || renderer.includes('RX 7'))
        ) {
          gpu = 'high-end';
        } else if (
          // Mid-range mobile GPUs (30-60fps target)
          renderer.includes('Apple') && (renderer.includes('A12') || renderer.includes('A13') || renderer.includes('A14')) ||
          renderer.includes('Adreno 6') || // Snapdragon 7 series
          renderer.includes('Mali-G') || // Most ARM GPUs
          renderer.includes('PowerVR') ||
          // Mid-range desktop GPUs
          renderer.includes('Intel Iris') ||
          renderer.includes('GTX 1050') ||
          renderer.includes('RX 5')
        ) {
          gpu = 'mid-range';
        } else {
          gpu = 'low-end';
        }
      }

      // Touch support detection
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Reduced motion preference
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Network speed detection (if available)
      let networkSpeed: '4g' | '3g' | 'slow-2g' | 'unknown' = 'unknown';
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          const effectiveType = connection.effectiveType;
          if (effectiveType === '4g') networkSpeed = '4g';
          else if (effectiveType === '3g') networkSpeed = '3g';
          else if (effectiveType === 'slow-2g' || effectiveType === '2g') networkSpeed = 'slow-2g';
        }
      }

      // Screen size detection
      const width = window.innerWidth;
      let screenSize: 'mobile' | 'tablet' | 'desktop' = 'desktop';
      if (width < 768) screenSize = 'mobile';
      else if (width < 1024) screenSize = 'tablet';

      // Pixel ratio
      const pixelRatio = window.devicePixelRatio || 1;

      // Backdrop filter support
      const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(20px)') || 
                                    CSS.supports('-webkit-backdrop-filter', 'blur(20px)');

      setCapabilities({
        gpu,
        touch,
        reducedMotion,
        networkSpeed,
        screenSize,
        pixelRatio,
        supportsBackdropFilter,
        supportsWebGL,
      });
    };

    detectCapabilities();

    // Re-detect on resize
    const handleResize = () => {
      const width = window.innerWidth;
      let screenSize: 'mobile' | 'tablet' | 'desktop' = 'desktop';
      if (width < 768) screenSize = 'mobile';
      else if (width < 1024) screenSize = 'tablet';

      setCapabilities(prev => ({ ...prev, screenSize }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return capabilities;
}

/**
 * Hook for adaptive glassmorphism configuration based on device capabilities
 */
export function useAdaptiveGlass(): AdaptiveGlassConfig {
  const { gpu, networkSpeed, reducedMotion, supportsBackdropFilter, screenSize } = useDeviceCapabilities();
  
  // Determine glass configuration based on capabilities
  if (reducedMotion) {
    return {
      blur: 'backdrop-blur-sm',
      effects: false,
      animations: 'none',
      shadowLevel: 'sm',
    };
  }

  if (!supportsBackdropFilter || gpu === 'low-end' || networkSpeed === 'slow-2g') {
    return {
      blur: 'backdrop-blur-sm',
      effects: false,
      animations: 'reduced',
      shadowLevel: 'sm',
    };
  }

  // High-end mobile optimization: enable full effects for capable devices
  if (gpu === 'high-end') {
    return {
      blur: screenSize === 'mobile' ? 'backdrop-blur-lg' : 'backdrop-blur-xl',
      effects: true, // Enable effects even on mobile for high-end GPUs
      animations: 'full',
      shadowLevel: screenSize === 'mobile' ? 'lg' : 'xl',
    };
  }

  // Mid-range configuration with mobile optimization
  if (gpu === 'mid-range') {
    return {
      blur: screenSize === 'mobile' ? 'backdrop-blur-md' : 'backdrop-blur-lg',
      effects: screenSize !== 'mobile', // Conservative approach for mid-range mobile
      animations: 'full',
      shadowLevel: 'md',
    };
  }

  // Low-end fallback
  return {
    blur: 'backdrop-blur-sm',
    effects: false,
    animations: 'reduced',
    shadowLevel: 'sm',
  };
}

/**
 * Hook for performance-aware component rendering
 */
export function usePerformanceTier(): 'high' | 'mid' | 'low' {
  const { gpu, networkSpeed, screenSize } = useDeviceCapabilities();
  
  // High-end: allow mobile devices with capable GPUs to use high tier
  if (gpu === 'high-end' && networkSpeed !== 'slow-2g') {
    return 'high';
  }
  
  // Low-end: only for truly limited devices
  if (gpu === 'low-end' || networkSpeed === 'slow-2g') {
    return 'low';
  }
  
  // Mid-range: default for most mobile and desktop devices
  return 'mid';
}

/**
 * Hook for mobile-optimized glass effect classes
 */
export function useMobileGlassOptimization(): {
  glassClass: string;
  blurClass: string;
  animationClass: string;
  forceGPU: boolean;
} {
  const { gpu, screenSize, supportsBackdropFilter, reducedMotion } = useDeviceCapabilities();
  const performanceTier = usePerformanceTier();
  
  // No glass effects if not supported or motion is reduced
  if (!supportsBackdropFilter || reducedMotion) {
    return {
      glassClass: 'bg-black/20 border border-gray-700',
      blurClass: '',
      animationClass: '',
      forceGPU: false,
    };
  }
  
  // Mobile-specific optimizations
  if (screenSize === 'mobile') {
    if (performanceTier === 'high') {
      return {
        glassClass: 'glass-mobile-high',
        blurClass: 'blur-mobile-heavy',
        animationClass: 'glass-card-mobile',
        forceGPU: true,
      };
    } else if (performanceTier === 'mid') {
      return {
        glassClass: 'glass-mobile-mid',
        blurClass: 'blur-mobile-medium',
        animationClass: 'glass-card-mobile',
        forceGPU: true,
      };
    } else {
      return {
        glassClass: 'glass-mobile-low',
        blurClass: 'blur-mobile-light',
        animationClass: '',
        forceGPU: false,
      };
    }
  }
  
  // Desktop/tablet fallback to existing system
  const adaptiveGlass = useAdaptiveGlass();
  return {
    glassClass: 'glass-card',
    blurClass: adaptiveGlass.blur,
    animationClass: performanceTier === 'high' ? 'transition-all duration-300' : '',
    forceGPU: performanceTier !== 'low',
  };
}

/**
 * Hook for gesture configuration based on device
 */
export function useGestureConfig() {
  const { touch, screenSize } = useDeviceCapabilities();
  
  return {
    swipeThreshold: touch ? 50 : 100,
    longPressDelay: touch ? 500 : 700,
    doubleTapWindow: 300,
    pinchScaleMin: 0.5,
    pinchScaleMax: 3.0,
    enableGestures: touch || screenSize === 'mobile',
  };
}

/**
 * Hook for responsive frame rate targeting
 */
export function useFrameRateTarget(): number {
  const tier = usePerformanceTier();
  
  switch (tier) {
    case 'high': return 60;
    case 'mid': return 30;
    case 'low': return 24;
    default: return 30;
  }
}