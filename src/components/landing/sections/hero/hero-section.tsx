'use client';

import { useTheme } from '@/lib/themes/use-theme';
import { HeroBackground } from './hero-background';
import { HeroContent } from './hero-content';
import { LoadingSequence } from './loading-sequence';
import { TerminalWindow } from '@/components/landing/shared/terminal-window';
import { ThemeToggle } from '@/components/landing/shared/theme-toggle';

export function HeroSection() {
  const { theme } = useTheme();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <HeroBackground />
      
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>
      
      <div className="container mx-auto px-4 z-10">
        {theme === 'synthwave' ? (
          <TerminalWindow 
            title="THUB://V2.0" 
            className="max-w-5xl mx-auto"
            animated={true}
          >
            <LoadingSequence />
            <HeroContent />
          </TerminalWindow>
        ) : (
          <div className="glass-hero max-w-5xl mx-auto p-12 rounded-3xl">
            <HeroContent />
          </div>
        )}
      </div>
      
      {/* Scroll indicator - only show in professional theme */}
      {theme !== 'synthwave' && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex flex-col items-center gap-2 opacity-70">
            <span className="text-xs text-text-secondary">Scroll to explore</span>
            <div className="w-5 h-8 border border-text-secondary/30 rounded-full flex justify-center">
              <div className="w-1 h-2 bg-text-secondary/50 rounded-full mt-2 animate-bounce" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}