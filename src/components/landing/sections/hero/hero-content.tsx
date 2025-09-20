'use client';

import { useTheme } from '@/lib/themes/use-theme';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface HeroContentProps {
  onInitialize: () => void;
  isInitializing: boolean;
  isInitialized: boolean;
  hasError?: boolean;
}

export function HeroContent({ onInitialize, isInitializing, isInitialized, hasError }: HeroContentProps) {
  const { theme } = useTheme();
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  const itemTransition = {
    duration: 0.6,
    ease: "easeOut" as const,
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="text-center"
    >
      {/* Main Title */}
      <motion.h1
        variants={itemVariants}
        transition={itemTransition}
        className={cn(
          "text-5xl md:text-7xl font-bold mb-6 leading-tight",
          theme === 'synthwave'
            ? "font-mono text-terminal-green"
            : "text-3d-clean"
        )}
      >
        {theme === 'synthwave' ? (
          <span className="block">
            <span className="text-neon-cyan">THUB</span>
            <span className="text-neon-pink">://</span>
            <span className="text-terminal-green">V2.0</span>
          </span>
        ) : (
          "THub V2"
        )}
      </motion.h1>

      {/* Subtitle */}
      <motion.h2
        variants={itemVariants}
        transition={itemTransition}
        className={cn(
          "text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed",
          theme === 'synthwave'
            ? "font-mono text-neon-cyan"
            : "text-3d-clean-subtitle"
        )}
      >
        {theme === 'synthwave' ? (
          <>
            {">"} NEURAL TRADING INTELLIGENCE PLATFORM
            <br />
            {">"} 3-LAYER CONVERGENCE • REAL-TIME SIGNALS • HIGH ACCURACY
          </>
        ) : (
          "Advanced trading intelligence with 3-layer convergence analysis. Make informed decisions with real-time signals and institutional-grade insights."
        )}
      </motion.h2>

      {/* Feature Pills */}
      <motion.div
        variants={itemVariants}
        transition={itemTransition}
        className="flex flex-wrap justify-center gap-4 mb-12"
      >
        {[
          { text: theme === 'synthwave' ? 'NEURAL AI' : '95.2% Accuracy', color: 'primary' },
          { text: theme === 'synthwave' ? 'REAL-TIME' : 'Real-time Signals', color: 'secondary' },
          { text: theme === 'synthwave' ? '3-LAYER' : 'Multi-layer Analysis', color: 'accent' },
        ].map((pill, index) => (
          <div
            key={index}
            className={cn(
              "px-6 py-3 rounded-full text-sm font-semibold",
              theme === 'synthwave' 
                ? [
                    "bg-glass-surface border border-neon-pink text-terminal-green",
                    "font-mono tracking-wider"
                  ]
                : "pill-3d-clean"
            )}
          >
            {theme === 'professional' ? (
              <span>{pill.text}</span>
            ) : (
              pill.text
            )}
          </div>
        ))}
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        variants={itemVariants}
        transition={itemTransition}
        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
      >
        <button
          onClick={onInitialize}
          disabled={isInitializing || isInitialized}
          aria-label={
            isInitializing 
              ? "System is initializing, please wait"
              : isInitialized
                ? "Re-initialize the trading system"
                : "Initialize the trading system"
          }
          aria-busy={isInitializing}
          aria-pressed={isInitialized}
          className={cn(
            "px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300",
            "touch-target min-w-[200px]",
            theme === 'synthwave'
              ? [
                  "bg-gradient-to-r from-neon-pink to-neon-purple text-bg-primary",
                  "font-mono tracking-wide",
                  isInitializing || isInitialized
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:shadow-neon transform hover:scale-105"
                ]
              : [
                  "btn-3d-clean",
                  isInitializing || isInitialized && "opacity-60 cursor-not-allowed"
                ]
          )}
        >
          {isInitializing 
            ? (theme === 'synthwave' ? '[INITIALIZING...]' : 'Initializing...')
            : isInitialized
              ? (theme === 'synthwave' ? '[RE-INITIALIZE]' : 'Restart System')
              : (theme === 'synthwave' ? '[INITIALIZE]' : 'Start Free Trial')
          }
        </button>

        <button
          onClick={() => router.push('/demo')}
          className={cn(
            "px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300",
            "touch-target min-w-[200px]",
            theme === 'synthwave'
              ? [
                  "bg-glass-surface border border-neon-cyan text-neon-cyan",
                  "font-mono tracking-wide",
                  "hover:bg-neon-cyan/10 hover:shadow-lg hover:shadow-neon-cyan/30"
                ]
              : "btn-3d-clean-glass"
          )}
        >
          {theme === 'synthwave' ? '[VIEW DEMO]' : (
            <span>Live Demo</span>
          )}
        </button>

        <button
          onClick={() => router.push('/login')}
          disabled={!isInitialized}
          aria-label={
            !isInitialized
              ? "Login button - Initialize system first to enable"
              : "Login to your trading account"
          }
          aria-disabled={!isInitialized}
          className={cn(
            "px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300",
            "touch-target min-w-[200px]",
            theme === 'synthwave'
              ? [
                  "bg-glass-surface border text-neon-pink",
                  "font-mono tracking-wide",
                  !isInitialized
                    ? "border-neon-pink/20 opacity-50 cursor-not-allowed"
                    : "border-neon-pink/50 hover:bg-neon-pink/10 hover:border-neon-pink hover:shadow-lg hover:shadow-neon-pink/30"
                ]
              : [
                  "btn-3d-clean-glass",
                  !isInitialized && "opacity-50 cursor-not-allowed"
                ]
          )}
        >
          {theme === 'synthwave' ? '[LOGIN]' : (
            <span>Login</span>
          )}
        </button>
      </motion.div>

      {/* Error Message */}
      {hasError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "mt-4 p-3 rounded-lg text-sm",
            theme === 'synthwave' 
              ? "bg-red-900/20 border border-red-500/50 text-red-400 font-mono"
              : "bg-red-50 border border-red-200 text-red-600"
          )}
        >
          {theme === 'synthwave' 
            ? '[ERROR] INITIALIZATION TIMEOUT - PLEASE RETRY'
            : 'Initialization timed out. Please try again.'
          }
        </motion.div>
      )}

      {/* Social Proof */}
      <motion.div
        variants={itemVariants}
        transition={itemTransition}
        className={cn(
          "mt-16 pt-8 border-t",
          theme === 'synthwave'
            ? "border-neon-pink/20 text-neon-cyan"
            : "border-white/10 text-text-muted"
        )}
      >
        <p className="text-sm mb-4 text-center">
          {theme === 'synthwave' ? '> TRUSTED BY TRADERS WORLDWIDE' : 'Trusted by professional traders worldwide'}
        </p>
        
        {/* Mobile-friendly stats with horizontal scroll */}
        <div className="overflow-x-auto scrollbar-hide md:overflow-visible">
          <div className="flex justify-center items-center gap-4 md:gap-8 text-lg md:text-2xl font-bold min-w-max px-4">
            <motion.div 
              className={cn(
                "flex flex-col md:flex-row items-center gap-1 md:gap-2 stat-item",
                theme === 'synthwave' ? "text-terminal-green font-mono" : "gradient-text"
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <span className="text-2xl md:text-2xl">10K+</span>
              <span className="text-xs md:text-sm font-normal opacity-70 whitespace-nowrap">Active Users</span>
            </motion.div>
            
            <div className={cn(
              "w-px h-8 hidden md:block",
              theme === 'synthwave' ? "bg-neon-pink/30" : "bg-white/20"
            )} />
            
            <motion.div 
              className={cn(
                "flex flex-col md:flex-row items-center gap-1 md:gap-2 stat-item",
                theme === 'synthwave' ? "text-terminal-green font-mono" : "gradient-text"
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <span className="text-2xl md:text-2xl">847</span>
              <span className="text-xs md:text-sm font-normal opacity-70 whitespace-nowrap">Daily Signals</span>
            </motion.div>
            
            <div className={cn(
              "w-px h-8 hidden md:block",
              theme === 'synthwave' ? "bg-neon-pink/30" : "bg-white/20"
            )} />
            
            <motion.div 
              className={cn(
                "flex flex-col md:flex-row items-center gap-1 md:gap-2 stat-item",
                theme === 'synthwave' ? "text-terminal-green font-mono" : "gradient-text"
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <span className="text-2xl md:text-2xl">95.2%</span>
              <span className="text-xs md:text-sm font-normal opacity-70 whitespace-nowrap">Accuracy</span>
            </motion.div>
          </div>
        </div>
        
        {/* Scroll indicator for mobile */}
        <motion.div 
          className="mt-4 text-center text-xs opacity-50 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.2 }}
        >
          {theme === 'synthwave' ? '< SWIPE TO SEE MORE >' : 'Swipe to see more →'}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}