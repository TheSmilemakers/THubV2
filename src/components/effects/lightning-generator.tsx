'use client';

import React, { useRef, useEffect, useState, forwardRef, useLayoutEffect, useCallback } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  generateLightningStrike, 
  defaultLightningConfig, 
  type LightningConfig, 
  type LightningSegment 
} from '@/lib/utils/lightning-algorithm';

export interface LightningGeneratorProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  config?: Partial<LightningConfig>;
  strikeInterval?: number; // Milliseconds between strikes
  strikeDuration?: number; // How long each strike is visible
  maxConcurrentStrikes?: number;
  colorCore?: string;
  colorGlow?: string;
  colorOuter?: string;
  glowRadius?: number;
  enabled?: boolean;
  className?: string;
}

interface ActiveStrike {
  id: number;
  segments: LightningSegment[][];
  startTime: number;
  opacity: number;
}

const LightningGenerator = forwardRef<HTMLDivElement, LightningGeneratorProps>(({
  config,
  strikeInterval = 2000,
  strikeDuration = 200,
  maxConcurrentStrikes = 3,
  colorCore = '#ffffff',
  colorGlow = '#e0e7ff',
  colorOuter = '#c7d2fe',
  glowRadius = 20,
  enabled = true,
  className,
  ...motionProps
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const lastStrikeTime = useRef<number>(0);
  const strikeIdCounter = useRef(0);
  
  // Use refs for animation state to avoid setState in animation loop
  const activeStrikesRef = useRef<ActiveStrike[]>([]);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

  // ResizeObserver to handle container size changes
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasDimensions({ 
          width: Math.floor(rect.width), 
          height: Math.floor(rect.height) 
        });
      }
    };
    
    // Initial size
    updateDimensions();
    
    // Setup ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          updateDimensions();
        }
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Merged config with dynamic dimensions
  const lightningConfig: LightningConfig = {
    ...defaultLightningConfig,
    startPoint: { x: canvasDimensions.width / 2, y: 0 },
    endPoint: { x: canvasDimensions.width / 2, y: canvasDimensions.height },
    ...config
  };

  // Generate a new strike
  const generateStrike = useCallback(() => {
    if (!enabled || canvasDimensions.width === 0 || canvasDimensions.height === 0) return;

    const newStrike: ActiveStrike = {
      id: strikeIdCounter.current++,
      segments: generateLightningStrike({
        ...lightningConfig,
        startPoint: {
          x: canvasDimensions.width * 0.2 + Math.random() * canvasDimensions.width * 0.6,
          y: 0
        },
        endPoint: {
          x: canvasDimensions.width * 0.3 + Math.random() * canvasDimensions.width * 0.4,
          y: canvasDimensions.height
        }
      }, 2 + Math.floor(Math.random() * 2)), // 2-3 bolts per strike
      startTime: performance.now(),
      opacity: 1
    };

    // Update ref directly instead of state to avoid re-renders
    const updated = [...activeStrikesRef.current, newStrike];
    // Limit concurrent strikes
    if (updated.length > maxConcurrentStrikes) {
      activeStrikesRef.current = updated.slice(-maxConcurrentStrikes);
    } else {
      activeStrikesRef.current = updated;
    }
  }, [enabled, canvasDimensions, lightningConfig, maxConcurrentStrikes]);

  // Draw a single segment with glow effect - optimized for performance
  const drawSegment = (
    ctx: CanvasRenderingContext2D,
    segment: LightningSegment,
    opacity: number
  ) => {
    const { start, end, width, intensity } = segment;
    
    // Save context state
    ctx.save();
    
    // Set composite operation for glow
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = opacity * intensity;
    
    // Reduced passes for better performance (from 5 to 3)
    const passes = [
      { width: width * glowRadius * 0.5, color: colorGlow, alpha: 0.15 },
      { width: width * 2, color: colorCore, alpha: 0.6 },
      { width: width, color: colorCore, alpha: 1 }
    ];
    
    passes.forEach(pass => {
      ctx.strokeStyle = pass.color;
      ctx.lineWidth = pass.width;
      ctx.globalAlpha = opacity * intensity * pass.alpha;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Remove blur filters completely - they cause major performance issues
      // The visual glow effect is achieved through layering and alpha blending instead
      
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    });
    
    // Restore context state
    ctx.restore();
  };

  // Setup canvas with proper DPI scaling
  const setupCanvas = useCallback(() => {
    if (!canvasRef.current || canvasDimensions.width === 0 || canvasDimensions.height === 0) return;
    
    const canvas = canvasRef.current;
    // Disable transparency for better performance
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    
    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    
    // Set actual canvas size accounting for device pixel ratio
    canvas.width = canvasDimensions.width * dpr;
    canvas.height = canvasDimensions.height * dpr;
    
    // Scale the context to ensure correct drawing dimensions
    ctx.scale(dpr, dpr);
    
    // Set canvas CSS size
    canvas.style.width = `${canvasDimensions.width}px`;
    canvas.style.height = `${canvasDimensions.height}px`;
  }, [canvasDimensions]);
  
  // Main render loop
  const render = useCallback((timestamp: number) => {
    if (!canvasRef.current || !enabled || canvasDimensions.width === 0) return;
    
    // Use cached context with alpha: false for better performance
    const ctx = canvasRef.current.getContext('2d', { alpha: false });
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height);
    
    // Check if we should generate a new strike
    if (timestamp - lastStrikeTime.current > strikeInterval) {
      generateStrike();
      lastStrikeTime.current = timestamp;
    }
    
    // Update active strikes
    const currentTime = performance.now();
    const updatedStrikes: ActiveStrike[] = [];
    
    activeStrikesRef.current.forEach(strike => {
      const age = currentTime - strike.startTime;
      
      // Skip if too old
      if (age >= strikeDuration) return;
      
      // Calculate opacity based on age
      let opacity = 1;
      if (age < 50) {
        // Flash in
        opacity = age / 50;
      } else if (age > strikeDuration - 100) {
        // Fade out
        opacity = Math.max(0, 1 - (age - (strikeDuration - 100)) / 100);
      }
      
      // Update strike with new opacity
      const updatedStrike = { ...strike, opacity };
      updatedStrikes.push(updatedStrike);
      
      // Draw the strike
      updatedStrike.segments.forEach(bolt => {
        bolt.forEach(segment => {
          drawSegment(ctx, segment, opacity);
        });
      });
    });
    
    // Update the ref with filtered strikes
    activeStrikesRef.current = updatedStrikes;
    
    // Continue animation
    animationRef.current = requestAnimationFrame(render);
  }, [enabled, canvasDimensions, strikeInterval, strikeDuration, generateStrike]);

  // Setup canvas when dimensions change
  useEffect(() => {
    setupCanvas();
  }, [setupCanvas]);
  
  // Start/stop animation based on enabled prop and canvas readiness
  useEffect(() => {
    if (enabled && canvasDimensions.width > 0 && canvasDimensions.height > 0) {
      // Start the animation loop
      const startAnimation = () => {
        animationRef.current = requestAnimationFrame(render);
      };
      
      // Small delay to ensure canvas is ready
      const timeoutId = setTimeout(startAnimation, 50);
      
      return () => {
        clearTimeout(timeoutId);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = undefined;
        }
        // Clear strikes when stopping
        activeStrikesRef.current = [];
      };
    } else {
      // Stop animation if disabled
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      activeStrikesRef.current = [];
    }
  }, [enabled, canvasDimensions, render]);

  return (
    <motion.div
      ref={(node) => {
        // Handle both refs
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        containerRef.current = node;
      }}
      className={cn('relative w-full h-full', className)}
      {...motionProps}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          mixBlendMode: 'screen',
          filter: 'contrast(1.5) brightness(1.2)'
        }}
      />
      
      {/* Additional ambient glow overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${colorGlow}20 0%, transparent 50%)`,
          mixBlendMode: 'screen'
        }}
      />
    </motion.div>
  );
});

LightningGenerator.displayName = 'LightningGenerator';

export { LightningGenerator };