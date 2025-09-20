'use client';

import { HeroBackground } from '@/components/landing/sections/hero/hero-background';
import { ThemeToggle } from '@/components/landing/shared/theme-toggle';
import { useEffect, useState } from 'react';

export default function TestCanvasPage() {
  const [mounted, setMounted] = useState(false);
  const [canvasStatus, setCanvasStatus] = useState<string>('Checking...');
  
  useEffect(() => {
    setMounted(true);
    
    // Check canvas status after a delay
    const timer = setTimeout(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          setCanvasStatus(`✅ Canvas found! Size: ${canvas.width}x${canvas.height}`);
        } else {
          setCanvasStatus('❌ Canvas found but no context');
        }
      } else {
        setCanvasStatus('❌ No canvas element found');
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!mounted) return null;
  
  return (
    <div className="relative min-h-screen bg-bg-primary">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="absolute top-4 left-4 z-50 bg-bg-elevated p-4 rounded-lg shadow-lg">
        <h1 className="text-lg font-bold text-text-primary mb-2">Canvas Test Page</h1>
        <p className="text-sm text-text-secondary mb-1">Status: {canvasStatus}</p>
        <p className="text-sm text-text-secondary">Switch themes to test animations</p>
      </div>
      
      <HeroBackground />
    </div>
  );
}