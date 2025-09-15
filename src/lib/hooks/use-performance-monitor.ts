'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDeviceCapabilities } from './use-device-capabilities';

interface PerformanceMetrics {
  fps: number;
  averageFps: number;
  frameTime: number;
  isPerforming: boolean;
  droppedFrames: number;
  totalFrames: number;
}

interface PerformanceMonitorOptions {
  targetFps?: number;
  sampleSize?: number;
  onPerformanceDrop?: (metrics: PerformanceMetrics) => void;
  enableMonitoring?: boolean;
}

/**
 * Hook for monitoring performance and adapting animations accordingly
 * Tracks FPS and automatically reduces effects when performance drops
 */
export function usePerformanceMonitor(options: PerformanceMonitorOptions = {}) {
  const {
    targetFps = 60,
    sampleSize = 60, // Sample over 1 second at 60fps
    onPerformanceDrop,
    enableMonitoring = true
  } = options;

  const capabilities = useDeviceCapabilities();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: targetFps,
    averageFps: targetFps,
    frameTime: 1000 / targetFps,
    isPerforming: true,
    droppedFrames: 0,
    totalFrames: 0
  });

  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(typeof performance !== 'undefined' ? performance.now() : Date.now());
  const animationFrameRef = useRef<number | undefined>(undefined);
  const frameCountRef = useRef<number>(0);
  const droppedFramesRef = useRef<number>(0);

  const measureFrame = useCallback(() => {
    if (!enableMonitoring) return;

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const frameTime = now - lastFrameTimeRef.current;
    const fps = 1000 / frameTime;

    frameTimesRef.current.push(frameTime);
    frameCountRef.current++;

    // Keep only recent samples
    if (frameTimesRef.current.length > sampleSize) {
      frameTimesRef.current.shift();
    }

    // Count dropped frames (assuming target of 16.67ms for 60fps)
    if (frameTime > (1000 / targetFps) * 1.5) {
      droppedFramesRef.current++;
    }

    // Update metrics every 10 frames for performance
    if (frameCountRef.current % 10 === 0) {
      const averageFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
      const averageFps = 1000 / averageFrameTime;
      const isPerforming = averageFps >= targetFps * 0.8; // 80% of target is acceptable

      const newMetrics: PerformanceMetrics = {
        fps: Math.round(fps),
        averageFps: Math.round(averageFps),
        frameTime: Math.round(frameTime * 100) / 100,
        isPerforming,
        droppedFrames: droppedFramesRef.current,
        totalFrames: frameCountRef.current
      };

      setMetrics(newMetrics);

      // Notify if performance is poor
      if (!isPerforming && onPerformanceDrop) {
        onPerformanceDrop(newMetrics);
      }
    }

    lastFrameTimeRef.current = now;
    animationFrameRef.current = requestAnimationFrame(measureFrame);
  }, [enableMonitoring, targetFps, sampleSize, onPerformanceDrop]);

  useEffect(() => {
    if (!enableMonitoring) return;

    // Start monitoring
    lastFrameTimeRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
    animationFrameRef.current = requestAnimationFrame(measureFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [measureFrame, enableMonitoring]);

  // Auto-disable monitoring on low-end devices
  useEffect(() => {
    if (capabilities.gpu === 'low-end' || capabilities.networkSpeed === 'slow-2g') {
      // Don't monitor on very low-end devices to save resources
    }
  }, [capabilities]);

  return {
    metrics,
    isMonitoring: enableMonitoring,
    // Helper methods
    getDroppedFramePercentage: () => {
      return metrics.totalFrames > 0 ? (metrics.droppedFrames / metrics.totalFrames) * 100 : 0;
    },
    shouldReduceAnimations: () => {
      return !metrics.isPerforming || capabilities.reducedMotion;
    },
    shouldDisableEffects: () => {
      return metrics.averageFps < targetFps * 0.5 || capabilities.gpu === 'low-end';
    },
    getRecommendedFrameRate: () => {
      if (metrics.averageFps >= 60) return 60;
      if (metrics.averageFps >= 30) return 30;
      return 24;
    }
  };
}

/**
 * Hook for adaptive animation configuration
 * Automatically adjusts animation settings based on performance
 */
export function useAdaptiveAnimation(baseConfig: {
  duration?: number;
  stiffness?: number;
  damping?: number;
  mass?: number;
}) {
  const performanceMonitor = usePerformanceMonitor({
    enableMonitoring: true,
    targetFps: 60
  });

  const capabilities = useDeviceCapabilities();

  return {
    ...performanceMonitor,
    config: {
      duration: capabilities.reducedMotion ? 0 : 
               performanceMonitor.shouldReduceAnimations() ? (baseConfig.duration || 300) * 0.5 : 
               baseConfig.duration,
      
      stiffness: performanceMonitor.shouldReduceAnimations() ? 
                Math.min(baseConfig.stiffness || 100, 50) : 
                baseConfig.stiffness,
                
      damping: performanceMonitor.shouldReduceAnimations() ? 
              Math.max(baseConfig.damping || 10, 25) : 
              baseConfig.damping,
              
      mass: baseConfig.mass,
    },
    shouldAnimate: !capabilities.reducedMotion && performanceMonitor.metrics.isPerforming,
    effectsEnabled: !performanceMonitor.shouldDisableEffects() && capabilities.supportsBackdropFilter,
  };
}

/**
 * Hook for touch gesture optimization
 * Provides optimized gesture handling based on device capabilities
 */
export function useOptimizedGestures() {
  const capabilities = useDeviceCapabilities();
  const performanceMonitor = usePerformanceMonitor();

  return {
    // Touch-optimized settings
    touchAction: capabilities.touch ? 'pan-y' : 'auto',
    
    // Gesture thresholds based on performance
    swipeThreshold: capabilities.touch ? 
      (performanceMonitor.metrics.isPerforming ? 50 : 100) : 100,
    
    // Debounce settings
    gestureDebounce: performanceMonitor.metrics.isPerforming ? 16 : 32,
    
    // Should use native scrolling
    useNativeScroll: !performanceMonitor.metrics.isPerforming || capabilities.gpu === 'low-end',
    
    // Enable haptic feedback
    enableHaptics: capabilities.touch && 'vibrate' in navigator,
  };
}