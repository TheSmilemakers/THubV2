'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const MatrixRain = () => {
  const [matrixChars, setMatrixChars] = useState<any[]>([]);

  useEffect(() => {
    const chars = Array.from({ length: 20 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 2}s`,
      animationDuration: `${2 + Math.random() * 3}s`,
      content: Math.random() > 0.5 ? '01' : '10',
    }));
    setMatrixChars(chars);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
      {matrixChars.map((char, i) => (
        <div
          key={i}
          className="absolute text-xs font-mono text-terminal-green animate-pulse"
          style={{
            left: char.left,
            top: char.top,
            animationDelay: char.animationDelay,
            animationDuration: char.animationDuration,
          }}
        >
          {char.content}
        </div>
      ))}
    </div>
  );
};

export function LoadingSequence() {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const loadingSteps = [
    'INITIALIZING NEURAL NETWORKS...',
    'CONNECTING TO MARKET FEEDS...',
    'LOADING CONVERGENCE ENGINE...',
    'CALIBRATING SIGNAL ANALYSIS...',
    'SYSTEM READY FOR TRADING...'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 2;
        
        // Update current step based on progress
        const stepIndex = Math.floor(newProgress / 20);
        setCurrentStep(stepIndex);
        
        if (newProgress >= 100) {
          clearInterval(timer);
          setIsComplete(true);
          return 100;
        }
        
        return newProgress;
      });
    }, 80);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mb-8 space-y-4">
      {/* Loading Steps */}
      <div className="space-y-2 min-h-[120px]">
        {loadingSteps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-3 text-sm font-mono transition-all duration-300",
              index < currentStep 
                ? "text-terminal-green opacity-100" 
                : index === currentStep
                  ? "text-neon-cyan opacity-100"
                  : "text-neon-purple opacity-30"
            )}
          >
            <span className="text-neon-cyan">{'>'}</span>
            <span className="flex-1">{step}</span>
            {index < currentStep && (
              <span className="text-terminal-green">[✓]</span>
            )}
            {index === currentStep && !isComplete && (
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-neon-cyan rounded-full animate-pulse" />
                <div className="w-1 h-1 bg-neon-cyan rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-1 h-1 bg-neon-cyan rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-neon-cyan">LOADING PROGRESS</span>
          <span className="text-terminal-green">{progress}%</span>
        </div>
        
        <div className="relative h-2 bg-bg-tertiary border border-neon-pink/30 rounded overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-pink via-neon-purple to-terminal-green transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
          
          {/* Progress bar glow effect */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-pink/50 via-neon-purple/50 to-terminal-green/50 blur-sm"
            style={{ width: `${progress}%` }}
          />
          
          {/* Scanning line effect */}
          <div
            className="absolute inset-y-0 w-1 bg-white opacity-60 transition-all duration-300"
            style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
          />
        </div>
      </div>

      {/* System Status */}
      {isComplete && (
        <div className="mt-6 p-4 border border-terminal-green/50 rounded bg-terminal-green/5">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-terminal-green rounded-full animate-pulse" />
            <span className="text-terminal-green font-mono font-semibold">
              {'>'} THUB V2.0 NEURAL SYSTEM ONLINE
            </span>
          </div>
          <div className="mt-2 text-xs text-neon-cyan font-mono">
            {'>'} All systems operational • Ready for signal analysis
            <br />
            {'>'} Connected to 11,247 market feeds • Latency: 23ms
          </div>
        </div>
      )}

      {/* Matrix-style character rain effect */}
      <MatrixRain />
    </div>
  );
}