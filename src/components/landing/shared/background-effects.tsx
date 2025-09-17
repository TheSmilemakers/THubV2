'use client';

import { useTheme } from '@/lib/themes/use-theme';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState, useCallback } from 'react';

interface BackgroundEffectsProps {
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

export function BackgroundEffects({ 
  className, 
  intensity = 'medium' 
}: BackgroundEffectsProps) {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Use refs to store animation state to prevent re-initialization
  const animationIdRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const isInitializedRef = useRef(false);

  // Set client flag after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize particles only once
  const initializeParticles = useCallback((canvas: HTMLCanvasElement) => {
    const particleCount = intensity === 'high' ? 150 : intensity === 'medium' ? 100 : 50;
    const particles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        color: theme === 'synthwave' 
          ? ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5'][Math.floor(Math.random() * 4)]
          : '#8b5cf6'
      });
    }
    
    particlesRef.current = particles;
    isInitializedRef.current = true;
  }, [intensity, theme]);

  // Update particle colors when theme changes
  useEffect(() => {
    if (!isInitializedRef.current) return;
    
    particlesRef.current.forEach(particle => {
      particle.color = theme === 'synthwave' 
        ? ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5'][Math.floor(Math.random() * 4)]
        : '#8b5cf6';
    });
  }, [theme]);

  // Canvas animation effect
  useEffect(() => {
    if (!isClient) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const needsResize = canvas.width !== window.innerWidth || canvas.height !== window.innerHeight;
      if (needsResize) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Re-initialize particles if canvas was resized and particles exist
        if (isInitializedRef.current) {
          initializeParticles(canvas);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles if not already done
    if (!isInitializedRef.current) {
      initializeParticles(canvas);
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (theme === 'synthwave') {
        // Synthwave: Grid pattern
        drawGrid(ctx, canvas.width, canvas.height);
      } else {
        // Professional: Subtle gradient overlay
        drawGradientOverlay(ctx, canvas.width, canvas.height);
      }

      // Update and draw particles
      const particles = particlesRef.current;
      particles.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `${particle.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();

        // Connect nearby particles
        particles.slice(index + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = `${particle.color}${Math.floor((particle.opacity * (1 - distance / 100) * 0.2) * 255).toString(16).padStart(2, '0')}`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isClient, theme, initializeParticles]); // Dependencies optimized

  // Grid drawing function for synthwave theme
  function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const gridSize = 50;
    ctx.strokeStyle = 'rgba(255, 0, 110, 0.1)';
    ctx.lineWidth = 0.5;

    // Vertical lines
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  // Gradient overlay for professional theme
  function drawGradientOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, width / 2
    );
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.02)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.01)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  return (
    <div className={cn(
      "fixed inset-0 pointer-events-none z-0",
      "opacity-60",
      className
    )}>
      {/* Only render canvas on client to prevent hydration mismatch */}
      {isClient && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ 
            mixBlendMode: theme === 'synthwave' ? 'screen' : 'multiply'
          }}
        />
      )}
      
      {/* Static overlay effects - use CSS classes for theme-specific rendering */}
      {/* Synthwave overlays */}
      <div className="synthwave-overlay absolute inset-0">
        {/* Neon glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/5 via-transparent to-neon-blue/5" />
        
        {/* Scan lines */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 255, 65, 0.1) 2px,
                rgba(0, 255, 65, 0.1) 4px
              )
            `
          }}
        />
      </div>

      {/* Professional overlays */}
      <div className="professional-overlay absolute inset-0">
        {/* Glass morphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/3 via-transparent to-accent-secondary/3" />
        
        {/* Subtle light rays */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-accent-primary/20 to-transparent transform rotate-12" />
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-accent-secondary/20 to-transparent transform -rotate-12" />
        </div>
      </div>
    </div>
  );
}