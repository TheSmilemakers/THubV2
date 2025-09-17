'use client';

import { useTheme, type Theme } from '@/lib/themes/use-theme';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

// Singleton WebGL context manager to prevent context overflow
class WebGLContextManager {
  private static instance: WebGLContextManager;
  private activeContexts: Map<string, CanvasRenderingContext2D> = new Map();
  private readonly maxContexts = 8; // Browser limit is typically 16, we'll use half

  static getInstance(): WebGLContextManager {
    if (!WebGLContextManager.instance) {
      WebGLContextManager.instance = new WebGLContextManager();
    }
    return WebGLContextManager.instance;
  }

  getContext(canvas: HTMLCanvasElement, id: string): CanvasRenderingContext2D | null {
    // Clean up excess contexts if we're at the limit
    if (this.activeContexts.size >= this.maxContexts) {
      const oldestKey = this.activeContexts.keys().next().value;
      if (oldestKey !== undefined) {
        this.activeContexts.delete(oldestKey);
      }
    }

    try {
      const ctx = canvas.getContext('2d', {
        alpha: true,
        desynchronized: true, // Performance optimization
      });
      
      if (ctx) {
        this.activeContexts.set(id, ctx);
      }
      
      return ctx;
    } catch (error) {
      console.warn('Failed to create canvas context:', error);
      return null;
    }
  }

  releaseContext(id: string): void {
    this.activeContexts.delete(id);
  }
}

interface HeroBackgroundProps {
  theme?: Theme;
  className?: string;
}

export function HeroBackground({ className }: HeroBackgroundProps) {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);
  const contextIdRef = useRef(`hero-bg-${Date.now()}`);
  const animationIdRef = useRef<number>(0);
  const contextManager = WebGLContextManager.getInstance();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    const ctx = contextManager.getContext(canvas, contextIdRef.current);
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    if (theme === 'synthwave') {
      // Synthwave: Animated grid with perspective and neon effects
      const gridLines: Array<{
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        opacity: number;
        speed: number;
      }> = [];

      // Create perspective grid lines
      const createGrid = () => {
        gridLines.length = 0;
        const centerX = canvas.width / 2;
        const centerY = canvas.height * 0.8;
        
        // Horizontal lines (receding into distance)
        for (let i = 0; i < 20; i++) {
          const y = centerY - i * 30;
          const perspectiveScale = Math.max(0.1, 1 - (i * 0.08));
          const width = canvas.width * perspectiveScale;
          
          gridLines.push({
            x1: centerX - width / 2,
            y1: y,
            x2: centerX + width / 2,
            y2: y,
            opacity: perspectiveScale * 0.6,
            speed: i * 0.5,
          });
        }

        // Vertical lines (perspective)
        for (let i = -10; i <= 10; i++) {
          if (i === 0) continue;
          const startX = centerX + i * 100;
          
          gridLines.push({
            x1: startX,
            y1: centerY,
            x2: centerX + i * 20,
            y2: 0,
            opacity: 0.4,
            speed: 0,
          });
        }
      };

      createGrid();

      const animateSynthwave = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(16, 0, 43, 1)');
        gradient.addColorStop(0.5, 'rgba(36, 0, 70, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid lines with animation
        gridLines.forEach((line, index) => {
          ctx.beginPath();
          ctx.moveTo(line.x1, line.y1);
          ctx.lineTo(line.x2, line.y2);
          
          // Animate opacity for pulsing effect
          const pulseOpacity = line.opacity + Math.sin(Date.now() * 0.003 + index * 0.5) * 0.2;
          ctx.strokeStyle = `rgba(255, 0, 110, ${Math.max(0, pulseOpacity)})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Add glow effect for some lines
          if (index % 3 === 0) {
            ctx.shadowColor = '#ff006e';
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        });

        // Floating particles
        const time = Date.now() * 0.001;
        for (let i = 0; i < 50; i++) {
          const x = (Math.sin(time + i) * 200) + canvas.width / 2;
          const y = (Math.cos(time * 0.7 + i) * 100) + canvas.height / 3;
          const size = Math.sin(time + i * 2) * 2 + 3;
          
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(6, 255, 165, ${Math.sin(time + i) * 0.3 + 0.4})`;
          ctx.fill();
        }

        animationIdRef.current = requestAnimationFrame(animateSynthwave);
      };

      animateSynthwave();
    } else {
      // Professional: Elegant particle system with glassmorphism
      const particles: Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;
        opacity: number;
        hue: number;
      }> = [];

      // Create particles
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.4 + 0.1,
          hue: Math.random() * 60 + 220, // Blue to purple range
        });
      }

      const animateProfessional = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background gradient
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, canvas.width
        );
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.05)');
        gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.03)');
        gradient.addColorStop(1, 'rgba(10, 11, 20, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Update and draw particles
        particles.forEach((particle, index) => {
          // Update position
          particle.x += particle.vx;
          particle.y += particle.vy;

          // Wrap around edges
          if (particle.x < 0) particle.x = canvas.width;
          if (particle.x > canvas.width) particle.x = 0;
          if (particle.y < 0) particle.y = canvas.height;
          if (particle.y > canvas.height) particle.y = 0;

          // Draw particle with glow
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          
          // Main particle
          ctx.fillStyle = `hsla(${particle.hue}, 70%, 70%, ${particle.opacity})`;
          ctx.fill();

          // Glow effect
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${particle.hue}, 70%, 70%, ${particle.opacity * 0.2})`;
          ctx.fill();

          // Connect nearby particles
          particles.slice(index + 1).forEach(otherParticle => {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 120) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = `hsla(${(particle.hue + otherParticle.hue) / 2}, 70%, 70%, ${
                (particle.opacity + otherParticle.opacity) * (1 - distance / 120) * 0.1
              })`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          });
        });

        animationIdRef.current = requestAnimationFrame(animateProfessional);
      };

      animateProfessional();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      // Release the context when component unmounts
      contextManager.releaseContext(contextIdRef.current);
    };
  }, [theme, contextManager]);

  // Check if we should render the canvas based on viewport and device capabilities
  const shouldRenderCanvas = () => {
    if (typeof window === 'undefined') return false;
    
    // Disable on mobile devices with limited resources
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const hasLowMemory = 'deviceMemory' in navigator && (navigator as any).deviceMemory < 4;
    
    return !isMobile || !hasLowMemory;
  };

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {mounted && shouldRenderCanvas() && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{
            mixBlendMode: theme === 'synthwave' ? 'normal' : 'soft-light',
            willChange: 'transform',
            transform: 'translateZ(0)' // Force GPU acceleration
          }}
        />
      )}
      
      {/* Additional static overlays - only render after mount to avoid hydration mismatch */}
      {mounted && theme === 'synthwave' && (
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-bg-primary/30" />
      )}
      
      {mounted && theme === 'professional' && (
        <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/20 via-transparent to-bg-primary" />
      )}
    </div>
  );
}