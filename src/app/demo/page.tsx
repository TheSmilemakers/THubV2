'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/themes/use-theme';
import { cn } from '@/lib/utils';
import { SignalsShowcase } from '@/components/demo/signals-showcase';
import { TerminalWindow } from '@/components/landing/shared/terminal-window';
import { ThemeToggle } from '@/components/landing/shared/theme-toggle';
import { 
  Sparkles, 
  TrendingUp, 
  Activity, 
  ChevronRight,
  Lock,
  ArrowLeft
} from 'lucide-react';

export default function DemoPage() {
  const { theme } = useTheme();
  const router = useRouter();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const features = [
    {
      icon: Sparkles,
      label: theme === 'synthwave' ? 'NEURAL AI' : 'AI-Powered Analysis',
      description: theme === 'synthwave' 
        ? 'MULTI-LAYER CONVERGENCE' 
        : 'Advanced 3-layer signal convergence'
    },
    {
      icon: TrendingUp,
      label: theme === 'synthwave' ? '95.2% ACCURACY' : '95.2% Success Rate',
      description: theme === 'synthwave' 
        ? 'INSTITUTIONAL GRADE SIGNALS' 
        : 'Proven track record with real results'
    },
    {
      icon: Activity,
      label: theme === 'synthwave' ? 'REAL-TIME' : 'Live Market Data',
      description: theme === 'synthwave' 
        ? '24/7 MARKET MONITORING' 
        : 'Continuous market analysis and updates'
    }
  ];

  return (
    <div className={cn(
      "min-h-screen relative",
      theme === 'synthwave' ? 'bg-bg-primary' : 'bg-gradient-to-b from-bg-primary via-bg-secondary to-bg-primary'
    )}>
      {/* Background Effects for Professional Theme */}
      {theme === 'professional' && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Mesh gradient */}
          <div className="mesh-gradient-professional" />
          
          {/* Floating orbs */}
          <div className="particles-professional">
            {[...Array(15)].map((_, i) => (
              <div
                key={`particle-${i}`}
                className="particle-orb"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${20 + Math.random() * 10}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Header Navigation */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 border-b border-white/10 backdrop-blur-md"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300",
                theme === 'synthwave' 
                  ? "text-neon-cyan hover:bg-neon-cyan/10 font-mono"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              {theme === 'synthwave' ? '[BACK]' : 'Back'}
            </button>
            
            <ThemeToggle />
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 pt-12 pb-8"
      >
        <div className="container mx-auto px-4">
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h1 className={cn(
              "text-4xl md:text-6xl font-bold mb-6",
              theme === 'synthwave' 
                ? "font-mono text-terminal-green"
                : "text-3d-clean"
            )}>
              {theme === 'synthwave' ? (
                <>
                  <span className="text-neon-pink">DEMO://</span>
                  <span className="text-terminal-green">TRADING_SIGNALS</span>
                </>
              ) : (
                "THub V2 Live Demo"
              )}
            </h1>
            
            <p className={cn(
              "text-lg md:text-xl max-w-3xl mx-auto mb-8",
              theme === 'synthwave'
                ? "font-mono text-neon-cyan"
                : "text-text-secondary"
            )}>
              {theme === 'synthwave' 
                ? "> EXPLORE OUR ADVANCED TRADING INTELLIGENCE PLATFORM"
                : "Experience our premium trading intelligence platform with real-time signal analysis"
              }
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-full",
                    theme === 'synthwave'
                      ? "bg-glass-surface border border-neon-pink/50 text-terminal-green font-mono"
                      : "pill-3d-clean"
                  )}
                >
                  <feature.icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{feature.label}</span>
                </motion.div>
              ))}
            </div>

            {/* Demo Notice */}
            <motion.div
              variants={itemVariants}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 rounded-xl mb-12",
                theme === 'synthwave'
                  ? "bg-yellow-900/20 border border-yellow-500/50 text-yellow-400 font-mono"
                  : "bg-amber-50 border border-amber-200 text-amber-800"
              )}
            >
              <Lock className="w-4 h-4" />
              <span className="text-sm">
                {theme === 'synthwave' 
                  ? "[DEMO MODE] SHOWING SAMPLE DATA"
                  : "Demo Mode: Displaying sample data for illustration purposes"
                }
              </span>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Signals Showcase Section */}
      <motion.section
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 pb-16"
      >
        <div className="container mx-auto px-4">
          {theme === 'synthwave' ? (
            <TerminalWindow 
              title="SIGNALS://LIVE_FEED" 
              className="max-w-7xl mx-auto"
              animated={false}
            >
              <div className="p-6">
                <SignalsShowcase />
              </div>
            </TerminalWindow>
          ) : (
            <div className="glass-hero rounded-3xl p-8 max-w-7xl mx-auto">
              <SignalsShowcase />
            </div>
          )}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 py-16"
      >
        <div className="container mx-auto px-4">
          <motion.div
            variants={itemVariants}
            className={cn(
              "text-center p-8 md:p-12 rounded-3xl max-w-4xl mx-auto",
              theme === 'synthwave'
                ? "bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border border-neon-pink/50"
                : "glass-premium"
            )}
          >
            <h2 className={cn(
              "text-3xl md:text-4xl font-bold mb-6",
              theme === 'synthwave'
                ? "font-mono text-terminal-green"
                : "text-3d-clean"
            )}>
              {theme === 'synthwave' 
                ? "[READY TO TRADE?]"
                : "Ready to Start Trading?"
              }
            </h2>
            
            <p className={cn(
              "text-lg mb-8 max-w-2xl mx-auto",
              theme === 'synthwave'
                ? "font-mono text-neon-cyan"
                : "text-text-secondary"
            )}>
              {theme === 'synthwave'
                ? "> UNLOCK FULL ACCESS TO REAL-TIME SIGNALS AND ADVANCED ANALYTICS"
                : "Get full access to real-time trading signals, advanced analytics, and personalized insights"
              }
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/login')}
                className={cn(
                  "px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2",
                  theme === 'synthwave'
                    ? [
                        "bg-gradient-to-r from-neon-pink to-neon-purple text-bg-primary",
                        "font-mono tracking-wide hover:shadow-neon transform hover:scale-105"
                      ]
                    : "btn-3d-clean"
                )}
              >
                {theme === 'synthwave' ? '[START FREE TRIAL]' : 'Start Free Trial'}
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => router.push('/')}
                className={cn(
                  "px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300",
                  theme === 'synthwave'
                    ? [
                        "bg-glass-surface border border-neon-cyan text-neon-cyan",
                        "font-mono tracking-wide",
                        "hover:bg-neon-cyan/10 hover:shadow-lg hover:shadow-neon-cyan/30"
                      ]
                    : "btn-3d-clean-glass"
                )}
              >
                {theme === 'synthwave' ? '[LEARN MORE]' : 'Learn More'}
              </button>
            </div>

            {/* Feature List */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className={cn(
                    "p-6 rounded-xl",
                    theme === 'synthwave'
                      ? "bg-glass-surface border border-neon-pink/30"
                      : "glass-light"
                  )}
                >
                  <feature.icon className={cn(
                    "w-8 h-8 mb-3 mx-auto",
                    theme === 'synthwave' ? "text-neon-cyan" : "text-accent-primary"
                  )} />
                  <h3 className={cn(
                    "font-semibold mb-2",
                    theme === 'synthwave'
                      ? "font-mono text-terminal-green"
                      : "text-text-primary"
                  )}>
                    {feature.label}
                  </h3>
                  <p className={cn(
                    "text-sm",
                    theme === 'synthwave'
                      ? "font-mono text-neon-cyan/70"
                      : "text-text-secondary"
                  )}>
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}