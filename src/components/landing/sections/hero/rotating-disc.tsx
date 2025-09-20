'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface RotatingDiscProps {
  className?: string;
  isActive?: boolean;
}

export function RotatingDisc({ className, isActive = true }: RotatingDiscProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = 400;
      canvas.height = 200;
    };
    resizeCanvas();

    // Configuration
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 60;
    const numDots = 12;
    let rotation = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update rotation
      rotation += 0.02;

      // Draw dots in circular pattern
      for (let i = 0; i < numDots; i++) {
        const angle = (i / numDots) * Math.PI * 2 + rotation;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        // Calculate opacity based on position (creates trailing effect)
        const opacity = 0.3 + (Math.sin(angle * 2) * 0.3 + 0.4);
        
        // Dot size varies based on position
        const size = 3 + Math.sin(angle * 3 + rotation * 2) * 2;
        
        // Draw dot with glow effect
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6, 255, 165, ${opacity})`;
        ctx.fill();
        
        // Add glow
        ctx.beginPath();
        ctx.arc(x, y, size * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6, 255, 165, ${opacity * 0.3})`;
        ctx.fill();
      }

      // Draw connecting lines between dots
      ctx.strokeStyle = 'rgba(6, 255, 165, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i < numDots; i++) {
        const angle1 = (i / numDots) * Math.PI * 2 + rotation;
        const angle2 = ((i + 1) / numDots) * Math.PI * 2 + rotation;
        
        const x1 = centerX + Math.cos(angle1) * radius;
        const y1 = centerY + Math.sin(angle1) * radius;
        const x2 = centerX + Math.cos(angle2) * radius;
        const y2 = centerY + Math.sin(angle2) * radius;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  return (
    <div className={cn("flex items-center justify-center pointer-events-none", className)}>
      <canvas
        ref={canvasRef}
        className="opacity-80"
        style={{
          filter: 'drop-shadow(0 0 20px rgba(6, 255, 165, 0.5))',
        }}
      />
    </div>
  );
}