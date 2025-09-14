'use client';

import { useTheme } from '@/lib/themes/use-theme';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function HeroContent() {
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
            : "gradient-text"
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
            : "text-text-secondary"
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
                : [
                    "glass-card text-text-primary",
                    pill.color === 'primary' && "border border-primary/30",
                    pill.color === 'secondary' && "border border-secondary/30", 
                    pill.color === 'accent' && "border border-accent/30"
                  ]
            )}
          >
            {pill.text}
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
          className={cn(
            "px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300",
            "touch-target min-w-[200px]",
            theme === 'synthwave'
              ? [
                  "bg-gradient-to-r from-neon-pink to-neon-purple text-bg-primary",
                  "font-mono tracking-wide",
                  "hover:shadow-neon transform hover:scale-105"
                ]
              : [
                  "btn-primary",
                  "hover:shadow-xl hover:shadow-primary/30"
                ]
          )}
        >
          {theme === 'synthwave' ? '[INITIALIZE]' : 'Start Free Trial'}
        </button>

        <button
          className={cn(
            "px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300",
            "touch-target min-w-[200px]",
            theme === 'synthwave'
              ? [
                  "bg-glass-surface border border-neon-cyan text-neon-cyan",
                  "font-mono tracking-wide",
                  "hover:bg-neon-cyan/10 hover:shadow-lg hover:shadow-neon-cyan/30"
                ]
              : [
                  "btn-glass",
                  "hover:shadow-lg"
                ]
          )}
        >
          {theme === 'synthwave' ? '[VIEW DEMO]' : 'Live Demo'}
        </button>

        <button
          onClick={() => router.push('/login')}
          className={cn(
            "px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300",
            "touch-target min-w-[200px]",
            theme === 'synthwave'
              ? [
                  "bg-glass-surface border border-neon-pink/50 text-neon-pink",
                  "font-mono tracking-wide",
                  "hover:bg-neon-pink/10 hover:border-neon-pink hover:shadow-lg hover:shadow-neon-pink/30"
                ]
              : [
                  "btn-glass border-violet-500/30 text-violet-400",
                  "hover:border-violet-500/50 hover:text-violet-300 hover:shadow-lg"
                ]
          )}
        >
          {theme === 'synthwave' ? '[LOGIN]' : 'Login'}
        </button>
      </motion.div>

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
        <p className="text-sm mb-4">
          {theme === 'synthwave' ? '> TRUSTED BY TRADERS WORLDWIDE' : 'Trusted by professional traders worldwide'}
        </p>
        
        <div className="flex justify-center items-center gap-8 text-2xl font-bold">
          <div className={cn(
            "flex items-center gap-2",
            theme === 'synthwave' ? "text-terminal-green font-mono" : "gradient-text"
          )}>
            <span>10K+</span>
            <span className="text-sm font-normal opacity-70">Active Users</span>
          </div>
          
          <div className={cn(
            "w-px h-8",
            theme === 'synthwave' ? "bg-neon-pink/30" : "bg-white/20"
          )} />
          
          <div className={cn(
            "flex items-center gap-2",
            theme === 'synthwave' ? "text-terminal-green font-mono" : "gradient-text"
          )}>
            <span>847</span>
            <span className="text-sm font-normal opacity-70">Daily Signals</span>
          </div>
          
          <div className={cn(
            "w-px h-8",
            theme === 'synthwave' ? "bg-neon-pink/30" : "bg-white/20"
          )} />
          
          <div className={cn(
            "flex items-center gap-2",
            theme === 'synthwave' ? "text-terminal-green font-mono" : "gradient-text"
          )}>
            <span>95.2%</span>
            <span className="text-sm font-normal opacity-70">Accuracy</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}