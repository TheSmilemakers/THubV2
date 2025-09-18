# THub V2 Data Mapping Implementation Guide
*Premium Aesthetic Implementation with Advanced Glassmorphism & Progressive Enhancement*

## Overview
This guide provides **complete implementation details** for ensuring all data flows correctly from n8n workflows → Supabase database → Frontend UI while maintaining the **exceptional aesthetic quality** and advanced design system already established.

## Design System Requirements

### 🎨 Aesthetic Standards (MANDATORY)
All implementations MUST follow these aesthetic standards:

- **Progressive Enhancement Integration**: Use `useProgressiveEnhancementContext()` and `useComponentEnhancement()`
- **Glassmorphism Effects**: Apply dynamic glass variants (`glass-light`, `glass-medium`, `glass-heavy`)
- **Design Token System**: Use CSS custom properties instead of hardcoded colors
- **60fps Performance**: Target smooth animations with hardware acceleration
- **Touch-Optimized**: 44px minimum touch targets, haptic feedback support
- **Mobile-First**: Responsive design with device-adaptive rendering

### 🔧 Component Enhancement Pattern with Premium Effects
Every component must follow this COMPLETE enhancement pattern:
```typescript
const { config } = useProgressiveEnhancementContext();
const { config: componentConfig, getGlassClass } = useComponentEnhancement('card');

// Advanced glass classes with neon effects
const glassVariant = componentConfig.glassmorphism === 'full' ? 'glass-heavy' : 'glass-medium';
const neonGlow = componentConfig.premiumEffects ? 'neon-glow' : '';
const holographicVariant = componentConfig.holographicEffects ? 'holographic' : 'elevated';

// Performance-aware animations with advanced effects
const shouldAnimate = componentConfig.animations !== 'none';
const springConfig = componentConfig.springAnimations ? { 
  damping: 25, 
  stiffness: 300,
  type: "spring"
} : { duration: 0.2 };

// Premium visual effects
const magneticHover = componentConfig.magneticEffects && !touch;
const particleEffects = componentConfig.particleEffects && gpu === 'high-end';
const auroraBg = componentConfig.advancedShaders ? 'aurora-gradient' : 'glass-gradient';

// Neon glow intensities based on data status
const getNeonIntensity = (status: 'success' | 'warning' | 'error' | 'info') => {
  if (!componentConfig.neonEffects) return '';
  
  return {
    success: 'neon-success shadow-[0_0_20px_rgba(34,197,94,0.5)] animate-pulse-slow',
    warning: 'neon-warning shadow-[0_0_20px_rgba(251,191,36,0.5)] animate-pulse-medium',
    error: 'neon-error shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse-fast',
    info: 'neon-info shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-pulse-gentle'
  }[status];
};

// Synthwave mode effects
const synthwaveGlow = config.theme === 'synthwave' ? 'synthwave-neon' : '';
const retroGrid = config.theme === 'synthwave' && componentConfig.backgroundEffects ? 'retro-grid' : '';
```

## Current State Summary

### ✅ What's Working:
- ✨ **Advanced Design System**: Progressive enhancement, glassmorphism, design tokens
- 🏗️ **Database Infrastructure**: `signals`, `market_scan_queue`, `market_scan_history`
- ⚡ **n8n Automation**: Active workflows with webhook integration
- 🎯 **Core UI Components**: SignalCard, GlassCard, DashboardLayout with premium effects
- 📱 **Mobile Optimization**: Touch gestures, responsive layouts, performance targeting

### ❌ What's Missing (To Implement):
- 🔄 Queue processing automation with premium loading states
- 📊 Display of `technical_data`, `analysis_notes`, `stop_loss`, `take_profit` with glassmorphism
- 💰 Market cap data enrichment (EODHD workaround)
- 📈 Queue monitoring dashboard with real-time glass effects

## Implementation Tasks

### Task 1: Create n8n Queue Processing Workflow

**Purpose**: Automatically process items from `market_scan_queue`

**n8n Workflow Configuration**:
```json
{
  "name": "THub V2 - Queue Processor (PRODUCTION)",
  "nodes": [
    {
      "name": "Schedule",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [{"field": "minutes", "minutesInterval": 5}]
        }
      }
    },
    {
      "name": "Get Unprocessed Queue",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://anxeptegnpfroajjzuqk.supabase.co/rest/v1/rpc/get_unprocessed_queue",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "YOUR_SUPABASE_ANON_KEY"
            }
          ]
        }
      }
    },
    {
      "name": "Batch Analyze",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://www.thub.rajanmaher.com/api/webhooks/n8n",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "httpHeaderAuth",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ action: 'batch_analyze', symbols: $json.symbols, priority: 'high' }) }}"
      }
    }
  ]
}
```

**Supabase RPC Function**:
```sql
-- Create function to get unprocessed queue items
CREATE OR REPLACE FUNCTION get_unprocessed_queue(batch_size INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  symbol TEXT,
  priority INTEGER,
  opportunity_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.symbol,
    q.priority,
    q.opportunity_score
  FROM market_scan_queue q
  WHERE q.processed = FALSE
  ORDER BY q.priority DESC, q.opportunity_score DESC
  LIMIT batch_size;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_unprocessed_queue TO anon;
GRANT EXECUTE ON FUNCTION get_unprocessed_queue TO authenticated;
```

### Task 2: Display Trading Plan Data with Premium Glassmorphism

**File**: `src/components/signals/trading-plan.tsx` (**NEW COMPONENT**)

**Create Premium Trading Plan Component** with full aesthetic integration:
```typescript
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Shield, Target, Calculator, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgressiveEnhancementContext } from '@/components/providers/progressive-enhancement-provider';
import { useComponentEnhancement } from '@/lib/hooks/use-progressive-enhancement';
import { GlassCard } from '@/components/ui/glass-card';

interface TradingPlanProps {
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  currentPrice: number;
  className?: string;
}

export function TradingPlan({ 
  entryPrice, 
  stopLoss, 
  takeProfit, 
  currentPrice,
  className = ''
}: TradingPlanProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { config } = useProgressiveEnhancementContext();
  const { config: componentConfig, getGlassClass } = useComponentEnhancement('card');

  if (!stopLoss && !takeProfit) return null;

  // Advanced glass classes with neon effects
  const glassVariant = componentConfig.glassmorphism === 'full' ? 'glass-heavy' : 'glass-medium';
  const holographicVariant = componentConfig.holographicEffects ? 'holographic' : 'elevated';
  
  // Premium visual effects
  const magneticHover = componentConfig.magneticEffects && !componentConfig.touch;
  const particleEffects = componentConfig.particleEffects && componentConfig.gpu === 'high-end';
  const auroraBg = componentConfig.advancedShaders ? 'aurora-gradient' : 'glass-gradient';

  // Neon glow intensities based on P&L status
  const getNeonIntensity = (isProfit: boolean) => {
    if (!componentConfig.neonEffects) return '';
    
    return isProfit 
      ? 'neon-success shadow-[0_0_20px_rgba(34,197,94,0.5)] animate-pulse-slow' 
      : 'neon-error shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse-medium';
  };

  // Synthwave mode effects
  const synthwaveGlow = config.theme === 'synthwave' ? 'synthwave-neon' : '';
  const retroGrid = config.theme === 'synthwave' && componentConfig.backgroundEffects ? 'retro-grid' : '';

  // Enhanced calculations with precision
  const riskAmount = stopLoss ? Math.abs(entryPrice - stopLoss) : 0;
  const rewardAmount = takeProfit ? Math.abs(takeProfit - entryPrice) : 0;
  const riskPercent = stopLoss ? ((riskAmount / entryPrice) * 100) : null;
  const rewardPercent = takeProfit ? ((rewardAmount / entryPrice) * 100) : null;
  const riskRewardRatio = riskAmount > 0 && rewardAmount > 0 ? (rewardAmount / riskAmount) : null;
  
  // Current P&L calculation
  const currentPnL = currentPrice - entryPrice;
  const currentPnLPercent = (currentPnL / entryPrice) * 100;
  const isProfit = currentPnL > 0;

  // Distance to targets
  const distanceToStop = stopLoss ? Math.abs(currentPrice - stopLoss) : 0;
  const distanceToTarget = takeProfit ? Math.abs(currentPrice - takeProfit) : 0;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: componentConfig.springAnimations ? 0.4 : 0.2,
        ease: componentConfig.springAnimations ? [0.25, 0.46, 0.45, 0.94] : 'easeOut',
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: componentConfig.springAnimations ? 0.3 : 0.15
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("mt-4", className)}
    >
      <GlassCard 
        variant={holographicVariant as any}
        onHover={setIsHovered}
        className={cn(
          "p-4 border transition-all duration-300 relative overflow-hidden",
          componentConfig.glassmorphism === 'full' ? getGlassClass() : glassVariant,
          isProfit ? 'border-status-success/30' : 'border-status-error/30',
          getNeonIntensity(isProfit),
          synthwaveGlow,
          retroGrid,
          magneticHover && isHovered && "transform-gpu scale-[1.02] rotate-[0.5deg]",
          "group hover:shadow-xl hover:shadow-accent-primary/20"
        )}
        style={{
          background: auroraBg !== 'glass-gradient' ? 
            'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.1) 50%, rgba(236,72,153,0.1) 100%)' : 
            undefined
        }}
      >
        {/* Holographic overlay */}
        {componentConfig.holographicEffects && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"
            animate={{
              background: isHovered ? [
                'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                'linear-gradient(225deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)'
              ] : 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)'
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        
        {/* Particle effects for data updates */}
        {particleEffects && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-accent-primary rounded-full"
                animate={{
                  x: [0, 100, 0],
                  y: [0, -50, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: "easeInOut"
                }}
                style={{
                  left: `${20 + i * 15}%`,
                  top: '50%'
                }}
              />
            ))}
          </motion.div>
        )}
        
        {/* Neon border animation */}
        {componentConfig.neonEffects && (isProfit || !isProfit) && (
          <motion.div
            className={cn(
              "absolute inset-0 rounded-lg pointer-events-none",
              isProfit 
                ? "shadow-[inset_0_0_20px_rgba(34,197,94,0.3)]" 
                : "shadow-[inset_0_0_20px_rgba(239,68,68,0.3)]"
            )}
            animate={{
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
        {/* Header */}
        <motion.div 
          variants={itemVariants}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-accent-primary" />
            <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Trading Plan
            </h4>
          </div>
          
          {/* Current P&L Badge with Neon Effects */}
          <motion.div
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 relative overflow-hidden",
              isProfit 
                ? "bg-status-success/20 text-status-success border border-status-success/30" 
                : "bg-status-error/20 text-status-error border border-status-error/30",
              componentConfig.neonEffects && (
                isProfit 
                  ? "shadow-[0_0_15px_rgba(34,197,94,0.6)] neon-success" 
                  : "shadow-[0_0_15px_rgba(239,68,68,0.6)] neon-error"
              ),
              componentConfig.holographicEffects && "backdrop-blur-sm"
            )}
            whileHover={componentConfig.animations !== 'none' ? { 
              scale: 1.05,
              rotateY: componentConfig.holographicEffects ? 5 : 0
            } : {}}
            animate={componentConfig.neonEffects ? {
              boxShadow: isProfit ? [
                '0 0 15px rgba(34,197,94,0.4)',
                '0 0 25px rgba(34,197,94,0.8)',
                '0 0 15px rgba(34,197,94,0.4)'
              ] : [
                '0 0 15px rgba(239,68,68,0.4)',
                '0 0 25px rgba(239,68,68,0.8)',
                '0 0 15px rgba(239,68,68,0.4)'
              ]
            } : {}}
            transition={{
              boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 0.2 },
              rotateY: { duration: 0.3 }
            }}
          >
            {/* Holographic shimmer effect */}
            {componentConfig.holographicEffects && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ['-100%', '100%']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
            
            <span className="relative z-10">
              {isProfit ? '+' : ''}{currentPnL.toFixed(2)} ({currentPnLPercent.toFixed(2)}%)
            </span>
          </motion.div>
        </motion.div>

        {/* Risk/Reward Overview */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 mb-4">
          {/* Stop Loss */}
          {stopLoss && (
            <motion.div 
              className={cn(
                "p-3 rounded-lg border transition-all duration-200",
                componentConfig.glassmorphism !== 'disabled' 
                  ? "glass-light border-status-error/20" 
                  : "bg-background-tertiary border-border-secondary"
              )}
              whileHover={componentConfig.animations !== 'none' ? { y: -2 } : {}}
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-status-error" />
                <span className="text-xs text-text-tertiary">Stop Loss</span>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-status-error">
                  ${stopLoss.toFixed(2)}
                </p>
                <p className="text-xs text-text-secondary">
                  -{riskPercent?.toFixed(2)}% risk
                </p>
                <p className="text-xs text-text-tertiary">
                  {distanceToStop.toFixed(2)} away
                </p>
              </div>
            </motion.div>
          )}

          {/* Take Profit */}
          {takeProfit && (
            <motion.div 
              className={cn(
                "p-3 rounded-lg border transition-all duration-200",
                componentConfig.glassmorphism !== 'disabled' 
                  ? "glass-light border-status-success/20" 
                  : "bg-background-tertiary border-border-secondary"
              )}
              whileHover={componentConfig.animations !== 'none' ? { y: -2 } : {}}
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-status-success" />
                <span className="text-xs text-text-tertiary">Take Profit</span>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-status-success">
                  ${takeProfit.toFixed(2)}
                </p>
                <p className="text-xs text-text-secondary">
                  +{rewardPercent?.toFixed(2)}% reward
                </p>
                <p className="text-xs text-text-tertiary">
                  {distanceToTarget.toFixed(2)} away
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Risk/Reward Ratio */}
        {riskRewardRatio && (
          <motion.div 
            variants={itemVariants}
            className={cn(
              "p-3 rounded-lg border",
              componentConfig.glassmorphism !== 'disabled' 
                ? "glass-light border-accent-primary/20" 
                : "bg-background-tertiary border-border-secondary"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-accent-primary" />
                <span className="text-xs text-text-tertiary">Risk/Reward Ratio</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-accent-primary">
                  1:{riskRewardRatio.toFixed(2)}
                </p>
                <p className="text-xs text-text-secondary">
                  {riskRewardRatio >= 2 ? 'Excellent' : riskRewardRatio >= 1.5 ? 'Good' : 'Fair'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Advanced Details (Expandable) */}
        <motion.div variants={itemVariants} className="mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "w-full text-xs text-accent-primary hover:text-accent-secondary",
              "transition-colors duration-200 flex items-center justify-center gap-1"
            )}
          >
            <span>{isExpanded ? 'Hide' : 'Show'} Advanced Details</span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <TrendingDown className="w-3 h-3" />
            </motion.div>
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: componentConfig.springAnimations ? 0.3 : 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Entry Price:</span>
                    <span className="text-text-primary font-medium">${entryPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Current Price:</span>
                    <span className="text-text-primary font-medium">${currentPrice.toFixed(2)}</span>
                  </div>
                  {riskAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Risk Amount:</span>
                      <span className="text-status-error font-medium">${riskAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {rewardAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Reward Amount:</span>
                      <span className="text-status-success font-medium">${rewardAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </GlassCard>
    </motion.div>
  );
}
```

**Update signal-card.tsx integration**:
```diff
+ import { TradingPlan } from './trading-plan';

  // In the detailed view section:
  {variant === 'detailed' && (
    <>
      <LayerBreakdown {...} />
+     <TradingPlan 
+       entryPrice={signal.entry_price || signal.current_price}
+       stopLoss={signal.stop_loss}
+       takeProfit={signal.take_profit}
+       currentPrice={signal.current_price}
+     />
    </>
  )}
```

### Task 3: Display Technical Analysis Data with Advanced Glassmorphism

**File**: `src/components/signals/technical-indicators.tsx` (**PREMIUM COMPONENT**)

```typescript
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, BarChart3, Zap, Eye, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgressiveEnhancementContext } from '@/components/providers/progressive-enhancement-provider';
import { useComponentEnhancement } from '@/lib/hooks/use-progressive-enhancement';
import { GlassCard } from '@/components/ui/glass-card';

interface TechnicalIndicatorsProps {
  data: any; // JSONB from database
  className?: string;
  variant?: 'compact' | 'detailed';
}

interface IndicatorData {
  name: string;
  value: number | string;
  displayValue: string;
  status: 'bullish' | 'bearish' | 'neutral' | 'overbought' | 'oversold' | 'strong' | 'weak';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}

export function TechnicalIndicators({ 
  data, 
  className = '',
  variant = 'detailed'
}: TechnicalIndicatorsProps) {
  const [isExpanded, setIsExpanded] = useState(variant === 'detailed');
  const { config } = useProgressiveEnhancementContext();
  const { config: componentConfig, getGlassClass } = useComponentEnhancement('card');

  const indicators = useMemo((): IndicatorData[] => {
    if (!data) return [];

    const result: IndicatorData[] = [];

    // RSI Indicator
    if (data.indicators?.rsi !== undefined) {
      const rsi = data.indicators.rsi;
      let status: IndicatorData['status'] = 'neutral';
      let color = 'text-text-secondary';
      
      if (rsi > 70) {
        status = 'overbought';
        color = 'text-status-error';
      } else if (rsi < 30) {
        status = 'oversold';
        color = 'text-status-success';
      } else if (rsi > 60) {
        status = 'bullish';
        color = 'text-status-warning';
      } else if (rsi < 40) {
        status = 'bearish';
        color = 'text-status-warning';
      }

      result.push({
        name: 'RSI',
        value: rsi,
        displayValue: rsi.toFixed(1),
        status,
        icon: BarChart3,
        color,
        description: status === 'overbought' ? 'Potentially overpriced' : 
                    status === 'oversold' ? 'Potentially underpriced' : 
                    'Normal trading range'
      });
    }

    // Trend Analysis
    if (data.trend) {
      const trend = data.trend.toLowerCase();
      result.push({
        name: 'Trend',
        value: trend,
        displayValue: trend.charAt(0).toUpperCase() + trend.slice(1),
        status: trend === 'bullish' ? 'bullish' : trend === 'bearish' ? 'bearish' : 'neutral',
        icon: trend === 'bullish' ? TrendingUp : trend === 'bearish' ? TrendingDown : Activity,
        color: trend === 'bullish' ? 'text-status-success' : 
               trend === 'bearish' ? 'text-status-error' : 'text-text-secondary',
        description: trend === 'bullish' ? 'Upward price momentum' :
                    trend === 'bearish' ? 'Downward price momentum' : 'Sideways movement'
      });
    }

    // Volume Analysis
    if (data.volume?.ratio) {
      const ratio = data.volume.ratio;
      const status = ratio > 2 ? 'strong' : ratio > 1.5 ? 'bullish' : 'neutral';
      
      result.push({
        name: 'Volume',
        value: ratio,
        displayValue: `${ratio.toFixed(1)}x`,
        status,
        icon: Zap,
        color: ratio > 2 ? 'text-accent-primary' : 
               ratio > 1.5 ? 'text-status-success' : 'text-text-secondary',
        description: ratio > 2 ? 'Very high trading activity' :
                    ratio > 1.5 ? 'Above average volume' : 'Normal volume'
      });
    }

    return result;
  }, [data]);

  if (!data || indicators.length === 0) return null;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: componentConfig.springAnimations ? 0.5 : 0.3,
        ease: componentConfig.springAnimations ? [0.25, 0.46, 0.45, 0.94] : 'easeOut',
        staggerChildren: componentConfig.animations !== 'none' ? 0.1 : 0
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: componentConfig.springAnimations ? 0.4 : 0.2,
        ease: componentConfig.springAnimations ? [0.25, 0.46, 0.45, 0.94] : 'easeOut'
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("mt-4", className)}
    >
      <GlassCard 
        variant="elevated"
        className={cn(
          "p-4 border transition-all duration-300",
          componentConfig.glassmorphism === 'full' ? getGlassClass() : 'glass-medium',
          "border-border-secondary hover:border-accent-primary/30"
        )}
      >
        {/* Header */}
        <motion.div 
          variants={itemVariants}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-primary" />
            <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Technical Analysis
            </h4>
            <span className="text-xs text-text-tertiary">
              ({indicators.length} indicators)
            </span>
          </div>
          
          {variant === 'compact' && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "text-xs text-accent-primary hover:text-accent-secondary",
                "transition-colors duration-200 flex items-center gap-1"
              )}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-3 h-3" />
              </motion.div>
            </button>
          )}
        </motion.div>

        {/* Indicators Grid */}
        <AnimatePresence>
          {(isExpanded || variant === 'detailed') && (
            <motion.div
              initial={variant === 'compact' ? { height: 0, opacity: 0 } : false}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: componentConfig.springAnimations ? 0.3 : 0.2 }}
              className="overflow-hidden"
            >
              <motion.div 
                variants={itemVariants}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4"
              >
                {indicators.map((indicator, index) => (
                  <motion.div
                    key={indicator.name}
                    variants={itemVariants}
                    className={cn(
                      "p-3 rounded-lg border transition-all duration-200",
                      componentConfig.glassmorphism !== 'disabled' 
                        ? "glass-light border-border-tertiary" 
                        : "bg-background-tertiary border-border-secondary",
                      "hover:scale-[1.02] hover:border-accent-primary/20"
                    )}
                    whileHover={componentConfig.animations !== 'none' ? { y: -2 } : {}}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <indicator.icon className={cn("w-4 h-4", indicator.color)} />
                      <span className="text-xs text-text-tertiary font-medium">
                        {indicator.name}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <p className={cn("text-lg font-bold", indicator.color)}>
                        {indicator.displayValue}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {indicator.status.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-text-tertiary leading-relaxed">
                        {indicator.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* SMA Data */}
              {data.indicators?.sma && (
                <motion.div 
                  variants={itemVariants}
                  className={cn(
                    "p-3 rounded-lg border",
                    componentConfig.glassmorphism !== 'disabled' 
                      ? "glass-light border-border-tertiary" 
                      : "bg-background-tertiary border-border-secondary"
                  )}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-4 h-4 text-accent-secondary" />
                    <span className="text-xs text-text-tertiary font-medium">
                      Moving Averages
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-text-tertiary">SMA 20</span>
                        <span className="text-sm font-medium text-text-primary">
                          ${data.indicators.sma.sma20?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                      <div className="h-1 bg-background-secondary rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary"
                          initial={{ width: 0 }}
                          animate={{ width: '65%' }}
                          transition={{ delay: 0.5, duration: 0.8 }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-text-tertiary">SMA 50</span>
                        <span className="text-sm font-medium text-text-primary">
                          ${data.indicators.sma.sma50?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                      <div className="h-1 bg-background-secondary rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-accent-secondary to-accent-primary"
                          initial={{ width: 0 }}
                          animate={{ width: '45%' }}
                          transition={{ delay: 0.7, duration: 0.8 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}
```

**Update signal-card.tsx to use it**:
```diff
+ import { TechnicalIndicators } from './technical-indicators';

  // In the detailed view section:
  {variant === 'detailed' && (
    <>
      <LayerBreakdown {...} />
      <TradingPlan {...} />
+     <TechnicalIndicators data={signal.technical_data} />
    </>
  )}
```

### Task 4: Display Analysis Notes

**File**: `src/components/signals/analysis-insights.tsx` (NEW FILE)

```typescript
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Lightbulb, AlertTriangle, TrendingUp, Info } from 'lucide-react';

interface AnalysisInsightsProps {
  notes: string[];
  className?: string;
  maxVisible?: number;
}

export function AnalysisInsights({ notes, className = '', maxVisible = 3 }: AnalysisInsightsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!notes || notes.length === 0) return null;

  const visibleNotes = isExpanded ? notes : notes.slice(0, maxVisible);
  const hasMore = notes.length > maxVisible;

  // Categorize notes by type
  const categorizeNote = (note: string) => {
    if (note.toLowerCase().includes('risk') || note.toLowerCase().includes('concern')) {
      return { icon: AlertTriangle, color: 'text-yellow-400', bgColor: 'bg-yellow-900/20' };
    } else if (note.toLowerCase().includes('strong') || note.toLowerCase().includes('bullish')) {
      return { icon: TrendingUp, color: 'text-green-400', bgColor: 'bg-green-900/20' };
    } else if (note.toLowerCase().includes('volume') || note.toLowerCase().includes('liquidity')) {
      return { icon: Info, color: 'text-blue-400', bgColor: 'bg-blue-900/20' };
    }
    return { icon: Lightbulb, color: 'text-purple-400', bgColor: 'bg-purple-900/20' };
  };

  return (
    <motion.div 
      className={`p-4 rounded-lg bg-gray-900/50 border border-gray-800 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Analysis Insights ({notes.length})
        </h4>
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            {isExpanded ? (
              <>Show less <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>Show all <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        )}
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {visibleNotes.map((note, index) => {
            const { icon: Icon, color, bgColor } = categorizeNote(note);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-start gap-2 p-2 rounded ${bgColor} border border-gray-700`}
              >
                <Icon className={`w-4 h-4 ${color} mt-0.5 flex-shrink-0`} />
                <p className="text-xs text-gray-300 leading-relaxed">{note}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
```

**Update signal-card.tsx**:
```diff
+ import { AnalysisInsights } from './analysis-insights';

  {variant === 'detailed' && (
    <>
      <LayerBreakdown {...} />
      <TradingPlan {...} />
      <TechnicalIndicators data={signal.technical_data} />
+     <AnalysisInsights notes={signal.analysis_notes} />
    </>
  )}
```

### Task 5: Premium Queue Monitoring Dashboard with Real-Time Glass Effects

**File**: `src/app/(dashboard)/admin/queue-monitor/page.tsx` (**PREMIUM DASHBOARD**)

```typescript
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  TrendingUp, 
  RefreshCw,
  Eye,
  Filter,
  Download
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useProgressiveEnhancementContext } from '@/components/providers/progressive-enhancement-provider';
import { useComponentEnhancement } from '@/lib/hooks/use-progressive-enhancement';
import { GlassCard } from '@/components/ui/glass-card';
import { MagneticButton } from '@/components/ui/magnetic-button';

interface QueueStats {
  total: number;
  processed: number;
  pending: number;
  avgProcessingTime: number;
  successRate: number;
  throughputPerHour: number;
}

interface QueueItem {
  id: string;
  symbol: string;
  priority: number;
  opportunity_score: number;
  scan_reason: string;
  created_at: string;
  processed: boolean;
}

interface ScanHistory {
  id: string;
  total_symbols: number;
  filtered_symbols: number;
  candidates_found: number;
  scan_duration_ms: number;
  created_at: string;
}

export default function QueueMonitorPage() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [recentScans, setRecentScans] = useState<ScanHistory[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { config } = useProgressiveEnhancementContext();
  const { config: componentConfig, getGlassClass } = useComponentEnhancement('card');

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    
    try {
      // Fetch queue statistics with enhanced calculations
      const [queueResponse, scansResponse, pendingResponse] = await Promise.all([
        supabase.from('market_scan_queue').select('*, processed'),
        supabase
          .from('market_scan_history')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('market_scan_queue')
          .select('*')
          .eq('processed', false)
          .order('priority', { ascending: false })
          .limit(20)
      ]);

      const queueData = queueResponse.data || [];
      const total = queueData.length;
      const processed = queueData.filter(item => item.processed).length;
      const pending = total - processed;

      // Calculate advanced metrics
      const recentProcessed = queueData.filter(item => 
        item.processed && 
        new Date(item.updated_at).getTime() > Date.now() - 3600000 // Last hour
      );
      const throughputPerHour = recentProcessed.length;

      setStats({
        total,
        processed,
        pending,
        avgProcessingTime: 3.2, // This should be calculated from actual processing times
        successRate: processed > 0 ? (processed / total) * 100 : 0,
        throughputPerHour
      });

      setRecentScans(scansResponse.data || []);
      setQueueItems(pendingResponse.data || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch queue data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel('queue-monitor-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'market_scan_queue'
      }, () => {
        fetchData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'market_scan_history'
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: componentConfig.springAnimations ? 0.5 : 0.3,
        ease: componentConfig.springAnimations ? [0.25, 0.46, 0.45, 0.94] : 'easeOut'
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <GlassCard variant="elevated" className="p-8">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="w-6 h-6 text-accent-primary" />
            </motion.div>
            <span className="text-text-primary">Loading queue data...</span>
          </div>
        </GlassCard>
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    change, 
    changeType = 'positive' 
  }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
  }) => (
    <motion.div variants={itemVariants}>
      <GlassCard 
        variant="elevated"
        className={cn(
          "p-6 border transition-all duration-300",
          componentConfig.glassmorphism === 'full' ? getGlassClass() : 'glass-medium',
          "hover:border-accent-primary/30 group"
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-text-primary mb-2">
              {value}
            </p>
            {change && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                changeType === 'positive' ? 'text-status-success' :
                changeType === 'negative' ? 'text-status-error' : 'text-text-secondary'
              )}>
                <TrendingUp className="w-3 h-3" />
                <span>{change}</span>
              </div>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-xl transition-all duration-200",
            "group-hover:scale-110",
            componentConfig.glassmorphism !== 'disabled' ? 'glass-light' : 'bg-background-tertiary'
          )}>
            <Icon className={cn("w-6 h-6", color)} />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Queue Monitor
          </h1>
          <p className="text-text-secondary">
            Real-time market scanning and analysis queue management
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-text-tertiary">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          
          <MagneticButton
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'primary' : 'secondary'}
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", autoRefresh && "animate-pulse")} />
            Auto Refresh
          </MagneticButton>
          
          <MagneticButton
            onClick={fetchData}
            variant="ghost"
            size="sm"
          >
            <RefreshCw className="w-4 h-4" />
          </MagneticButton>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          title="Total Queued"
          value={stats?.total || 0}
          icon={Activity}
          color="text-accent-primary"
          change="+12 today"
          changeType="positive"
        />
        
        <StatCard
          title="Processed"
          value={stats?.processed || 0}
          icon={CheckCircle}
          color="text-status-success"
          change={`${stats?.successRate.toFixed(1)}% success`}
          changeType="positive"
        />
        
        <StatCard
          title="Pending"
          value={stats?.pending || 0}
          icon={Clock}
          color="text-status-warning"
          change={`${stats?.throughputPerHour}/hr`}
          changeType="neutral"
        />
        
        <StatCard
          title="Avg Time"
          value={`${stats?.avgProcessingTime.toFixed(1)}s`}
          icon={Zap}
          color="text-accent-secondary"
          change="-0.3s vs yesterday"
          changeType="positive"
        />
      </motion.div>

      {/* Recent Scans */}
      <motion.div variants={itemVariants}>
        <GlassCard 
          variant="elevated"
          className={cn(
            "p-6 border",
            componentConfig.glassmorphism === 'full' ? getGlassClass() : 'glass-medium',
            "border-border-secondary"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-accent-primary" />
              <h2 className="text-xl font-semibold text-text-primary">
                Recent Market Scans
              </h2>
            </div>
            
            <MagneticButton variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </MagneticButton>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {recentScans.map((scan, index) => (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-all duration-200",
                    componentConfig.glassmorphism !== 'disabled' 
                      ? "glass-light border-border-tertiary" 
                      : "bg-background-tertiary border-border-secondary",
                    "hover:border-accent-primary/20"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      scan.candidates_found > 5 ? 'bg-status-success' :
                      scan.candidates_found > 0 ? 'bg-status-warning' : 'bg-status-error'
                    )} />
                    <div>
                      <span className="font-medium text-text-primary">
                        {scan.total_symbols.toLocaleString()} symbols scanned
                      </span>
                      <p className="text-xs text-text-tertiary">
                        {new Date(scan.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium text-status-success">
                        {scan.candidates_found} candidates
                      </div>
                      <div className="text-xs text-text-tertiary">
                        {scan.scan_duration_ms}ms duration
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </GlassCard>
      </motion.div>

      {/* Pending Queue Table */}
      <motion.div variants={itemVariants}>
        <GlassCard 
          variant="elevated"
          className={cn(
            "p-6 border",
            componentConfig.glassmorphism === 'full' ? getGlassClass() : 'glass-medium',
            "border-border-secondary"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-accent-primary" />
              <h2 className="text-xl font-semibold text-text-primary">
                Pending Analysis Queue
              </h2>
              <span className="text-sm text-text-tertiary">
                ({queueItems.length} items)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-tertiary">
                  <th className="text-left p-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Score
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Queued
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {queueItems.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-border-tertiary hover:bg-background-secondary/50 transition-colors duration-200"
                    >
                      <td className="p-3 font-medium text-text-primary">
                        {item.symbol}
                      </td>
                      <td className="p-3">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          item.priority > 80 
                            ? "bg-status-error/20 text-status-error" 
                            : item.priority > 50
                            ? "bg-status-warning/20 text-status-warning"
                            : "bg-status-info/20 text-status-info"
                        )}>
                          {item.priority}
                        </span>
                      </td>
                      <td className="p-3 text-text-secondary">
                        {item.opportunity_score}
                      </td>
                      <td className="p-3 text-sm text-text-tertiary">
                        {item.scan_reason || 'Market scan'}
                      </td>
                      <td className="p-3 text-sm text-text-tertiary">
                        {new Date(item.created_at).toLocaleTimeString()}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
```

### Task 6: Fix Market Cap Issue

**File**: `src/lib/services/market-data-enrichment.service.ts`

**Update enrichment to handle missing market cap**:
```diff
  private mapQuoteToEnrichedData(quote: EODHDQuote, symbol: string): SignalEnrichment {
    return {
      company_name: quote.name || symbol,
      current_price: quote.close || 0,
      price_change_24h: quote.change || 0,
      price_change_percent_24h: quote.change_p || 0,
      volume_24h: quote.volume || 0,
-     market_cap: 0, // EODHD quote endpoint doesn't provide market cap
+     market_cap: quote.marketCap || quote.market_cap || 0, // Try multiple fields
      price_history: [] // Will be populated if historical data is requested
    };
  }

+ // Add fallback method to get market cap from fundamentals endpoint
+ async getMarketCapFallback(symbol: string): Promise<number | null> {
+   try {
+     const { data } = await this.eodhd.getFundamentals(symbol);
+     return data?.General?.MarketCapitalization || null;
+   } catch (error) {
+     this.logger.warn(`Failed to get market cap for ${symbol}`, error);
+     return null;
+   }
+ }
```

### Task 7: Update TypeScript Types

**File**: `src/types/database.types.ts`

**Ensure types match database schema**:
```diff
  export interface Signal {
    id: string;
    symbol: string;
    market: 'stocks_us' | 'crypto' | 'forex';
    technical_score: number | null;
    sentiment_score: number | null;
    liquidity_score: number | null;
    convergence_score: number;
    signal_strength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';
    current_price: number | null;
    entry_price: number | null;
-   stop_loss?: number | null;
-   take_profit?: number | null;
+   stop_loss: number | null;
+   take_profit: number | null;
    created_at: string | null;
    expires_at: string | null;
-   technical_data?: any;
-   analysis_notes?: string[];
+   technical_data: any | null;
+   analysis_notes: string[] | null;
    viewed_by: string[] | null;
    saved_by: string[] | null;
  }
```

## Testing Checklist

1. **n8n Workflow Tests**:
   - [ ] Trigger market scan manually
   - [ ] Verify queue population
   - [ ] Run queue processor workflow
   - [ ] Confirm signals created

2. **UI Component Tests**:
   - [ ] Trading plan displays correctly
   - [ ] Technical indicators parse JSONB
   - [ ] Analysis notes expand/collapse
   - [ ] Mobile responsive at 375px width

3. **Data Flow Tests**:
   - [ ] Real-time updates via Supabase channels
   - [ ] Queue monitor updates live
   - [ ] API returns enriched data
   - [ ] Performance under load (100+ signals)

## Environment Variables Required

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://anxeptegnpfroajjzuqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
EODHD_API_KEY=your_eodhd_key
N8N_WEBHOOK_SECRET=your_webhook_secret
N8N_API_URL=https://n8n.anikamaher.com
N8N_API_KEY=your_n8n_api_key
```

## Next Steps

1. Implement queue processing workflow in n8n
2. Deploy UI component updates
3. Test complete data flow end-to-end
4. Monitor queue processing performance
5. Add error handling and retries

## 🎯 Performance Targets (Premium Standards)

### Core Performance Requirements
- **Queue processing**: > 10 symbols/minute with glassmorphism loading states
- **UI updates**: < 100ms latency with smooth glass transitions
- **Mobile performance**: 60fps on iPhone 12+, 30fps minimum on mid-range Android
- **API response**: < 500ms with progressive loading indicators
- **Real-time updates**: < 1s delay with animated state changes

### Aesthetic Performance Standards
- **Glass Effects**: Hardware-accelerated backdrop-filter with fallbacks
- **Animations**: Spring physics (damping: 25, stiffness: 300) for premium feel
- **Touch Responses**: < 50ms with haptic feedback on supported devices
- **Progressive Enhancement**: Automatic degradation for low-end devices
- **Frame Rate**: Consistent 60fps animations on modern devices

### Component Quality Checklist
Each component implementation must include:

- ✅ **Progressive Enhancement**: `useProgressiveEnhancementContext()` integration
- ✅ **Glass Variants**: Dynamic glass classes based on device capabilities
- ✅ **Design Tokens**: CSS custom properties instead of hardcoded colors
- ✅ **Motion System**: Framer Motion with spring physics animations
- ✅ **Touch Optimization**: 44px minimum touch targets, gesture support
- ✅ **Loading States**: Skeleton screens and glass loading indicators
- ✅ **Error Handling**: Premium error states with recovery actions
- ✅ **Accessibility**: ARIA labels, focus management, screen reader support

### 🌟 Advanced Visual Effects Requirements

#### **Neon Glow System**
```css
/* Required CSS Classes for Neon Effects */
.neon-success {
  box-shadow: 
    0 0 5px rgba(34, 197, 94, 0.5),
    0 0 10px rgba(34, 197, 94, 0.4),
    0 0 15px rgba(34, 197, 94, 0.3),
    0 0 20px rgba(34, 197, 94, 0.2);
}

.neon-error {
  box-shadow: 
    0 0 5px rgba(239, 68, 68, 0.6),
    0 0 10px rgba(239, 68, 68, 0.5),
    0 0 15px rgba(239, 68, 68, 0.4),
    0 0 20px rgba(239, 68, 68, 0.3);
}

.neon-warning {
  box-shadow: 
    0 0 5px rgba(251, 191, 36, 0.5),
    0 0 10px rgba(251, 191, 36, 0.4),
    0 0 15px rgba(251, 191, 36, 0.3);
}

.neon-info {
  box-shadow: 
    0 0 5px rgba(59, 130, 246, 0.4),
    0 0 10px rgba(59, 130, 246, 0.3),
    0 0 15px rgba(59, 130, 246, 0.2);
}

/* Pulse Animations for Neon Effects */
@keyframes pulse-slow {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

@keyframes pulse-medium {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

@keyframes pulse-fast {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@keyframes pulse-gentle {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
}

.animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
.animate-pulse-medium { animation: pulse-medium 2s ease-in-out infinite; }
.animate-pulse-fast { animation: pulse-fast 1.5s ease-in-out infinite; }
.animate-pulse-gentle { animation: pulse-gentle 4s ease-in-out infinite; }
```

#### **Holographic Effects**
```css
/* Holographic Card Variants */
.holographic {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 25%,
    rgba(0, 0, 0, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 75%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 8px 32px rgba(31, 38, 135, 0.37),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  transform-style: preserve-3d;
}

.holographic::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.holographic:hover::before {
  opacity: 1;
}

/* Aurora Gradient Backgrounds */
.aurora-gradient {
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.1) 0%,
    rgba(168, 85, 247, 0.1) 25%,
    rgba(236, 72, 153, 0.1) 50%,
    rgba(248, 113, 113, 0.1) 75%,
    rgba(34, 197, 94, 0.1) 100%
  );
  background-size: 400% 400%;
  animation: aurora-shift 8s ease-in-out infinite;
}

@keyframes aurora-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

#### **Synthwave Mode Effects**
```css
/* Synthwave Neon Theme */
.synthwave-neon {
  border: 2px solid #ff00ff;
  box-shadow: 
    0 0 20px #ff00ff,
    inset 0 0 20px rgba(255, 0, 255, 0.2);
  background: linear-gradient(
    45deg,
    rgba(255, 0, 255, 0.1) 0%,
    rgba(0, 255, 255, 0.1) 100%
  );
}

.retro-grid {
  background-image: 
    linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* Magnetic Hover Effects */
.magnetic-hover {
  transition: transform 0.2s ease-out;
  cursor: pointer;
}

.magnetic-hover:hover {
  transform: translate3d(var(--mouse-x, 0), var(--mouse-y, 0), 0) scale(1.05);
}
```

#### **Particle System Integration**
```typescript
// Particle Effects for Data Updates
const ParticleEffect = ({ isActive, color = 'accent-primary' }: { 
  isActive: boolean; 
  color?: string; 
}) => {
  if (!componentConfig.particleEffects || !isActive) return null;

  return (
    <motion.div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-1 h-1 bg-${color} rounded-full`}
          animate={{
            x: [0, Math.random() * 200 - 100],
            y: [0, Math.random() * 200 - 100],
            opacity: [0, 1, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeOut"
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`
          }}
        />
      ))}
    </motion.div>
  );
};
```

## 🚀 Implementation Impact

This **premium aesthetic implementation** ensures:

### Enhanced User Experience
- **Exceptional Visual Quality**: Multi-layer glassmorphism with device-adaptive rendering
- **Smooth Interactions**: 60fps animations with spring physics
- **Premium Feel**: Touch-optimized gestures with haptic feedback
- **Professional Polish**: Design token consistency across all components

### Technical Excellence
- **Performance-First**: Hardware acceleration with intelligent fallbacks
- **Mobile Optimization**: Touch-friendly interfaces with responsive design
- **Progressive Enhancement**: Graceful degradation for all device types
- **Real-Time Updates**: Live data with smooth visual transitions

### Data Flow Completeness
- **n8n Workflows** → **Supabase Database** → **Premium Frontend UI**
- **Complete visibility** from market scanning through signal generation
- **Real-time monitoring** with glassmorphism dashboard effects
- **Professional presentation** of technical analysis and trading plans

This implementation elevates THub V2 from a functional trading platform to a **premium financial intelligence suite** with exceptional aesthetic quality that matches the sophisticated backend architecture.