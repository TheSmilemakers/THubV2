/**
 * Progressive Enhancement Settings Component
 * Debug and control interface for progressive enhancement system
 * 
 * Features:
 * - Real-time tier visualization
 * - Manual tier override controls
 * - User preference toggles
 * - Performance impact indicators
 * - Device capability display
 */
'use client';

import React from 'react';
import { GlassCard as Card } from '@/components/ui/glass-card';
import { MagneticButton as Button } from '@/components/ui/magnetic-button';
import { useProgressiveEnhancementContext } from '@/components/providers/progressive-enhancement-provider';
import { cn } from '@/lib/utils';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Wifi, 
  WifiOff, 
  Zap, 
  Battery, 
  Eye, 
  EyeOff,
  Settings,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

export function ProgressiveEnhancementSettings() {
  const {
    currentTier,
    config,
    isAutoMode,
    setTier,
    setUserPreferences,
    toggleAutoMode,
    resetToAuto,
    debugInfo,
  } = useProgressiveEnhancementContext();

  const getTierIcon = (tierName: string) => {
    switch (tierName) {
      case 'minimal': return <Battery className="h-4 w-4" />;
      case 'standard': return <Monitor className="h-4 w-4" />;
      case 'enhanced': return <Tablet className="h-4 w-4" />;
      case 'premium': return <Zap className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getTierColor = (tierName: string) => {
    switch (tierName) {
      case 'minimal': return 'text-red-400';
      case 'standard': return 'text-yellow-400';
      case 'enhanced': return 'text-blue-400';
      case 'premium': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getFeatureIcon = (enabled: boolean) => {
    return enabled ? 
      <CheckCircle className="h-4 w-4 text-green-400" /> : 
      <XCircle className="h-4 w-4 text-red-400" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 5) return 'text-blue-400';
    if (score >= 2) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="p-6 bg-gray-900/50 backdrop-blur-xl border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-purple-400" />
          Progressive Enhancement Control
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Auto Mode:</span>
          <Button
            onClick={toggleAutoMode}
            variant={isAutoMode ? "primary" : "secondary"}
            size="sm"
            className={cn(
              "px-3 py-1",
              isAutoMode ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"
            )}
          >
            {isAutoMode ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Tier Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Current Enhancement Tier</h3>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-gray-700", getTierColor(currentTier.name))}>
                  {getTierIcon(currentTier.name)}
                </div>
                <div>
                  <div className={cn("font-bold capitalize", getTierColor(currentTier.name))}>
                    {currentTier.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    {currentTier.description}
                  </div>
                </div>
              </div>
              {!isAutoMode && (
                <Button
                  onClick={resetToAuto}
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                >
                  Reset to Auto
                </Button>
              )}
            </div>

            {/* Debug Scores */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center">
                <div className={cn("text-lg font-bold", getScoreColor(debugInfo.deviceScore))}>
                  {debugInfo.deviceScore}
                </div>
                <div className="text-xs text-gray-400">Device</div>
              </div>
              <div className="text-center">
                <div className={cn("text-lg font-bold", getScoreColor(debugInfo.networkScore))}>
                  {debugInfo.networkScore}
                </div>
                <div className="text-xs text-gray-400">Network</div>
              </div>
              <div className="text-center">
                <div className={cn("text-lg font-bold", getScoreColor(debugInfo.totalScore))}>
                  {debugInfo.totalScore}
                </div>
                <div className="text-xs text-gray-400">Total</div>
              </div>
            </div>

            {/* Active Overrides */}
            {debugInfo.overrides.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-400">Active Overrides</span>
                </div>
                <div className="text-xs text-gray-300">
                  {debugInfo.overrides.join(', ')}
                </div>
              </div>
            )}
          </div>

          {/* Manual Tier Override */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-white">Manual Tier Override</h4>
            <div className="grid grid-cols-2 gap-2">
              {(['minimal', 'standard', 'enhanced', 'premium'] as const).map((tierName) => (
                <Button
                  key={tierName}
                  onClick={() => setTier(tierName)}
                  variant={currentTier.name === tierName ? "primary" : "secondary"}
                  size="sm"
                  className={cn(
                    "flex items-center gap-2 justify-start",
                    currentTier.name === tierName && getTierColor(tierName)
                  )}
                  disabled={isAutoMode}
                >
                  {getTierIcon(tierName)}
                  <span className="capitalize">{tierName}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Active Features</h3>
          
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
            {/* Core Features */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white">Visual Effects</h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Animations</span>
                  <div className="flex items-center gap-2">
                    <span className="text-accent-primary capitalize">{config.animations}</span>
                    {getFeatureIcon(config.animations !== 'none')}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Glassmorphism</span>
                  <div className="flex items-center gap-2">
                    <span className="text-accent-primary capitalize">{config.glassmorphism}</span>
                    {getFeatureIcon(config.glassmorphism !== 'disabled')}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Particle Effects</span>
                  <div className="flex items-center gap-2">
                    <span className="text-accent-primary">{config.particleEffects ? 'Enabled' : 'Disabled'}</span>
                    {getFeatureIcon(config.particleEffects)}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Features */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white">Performance</h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Hardware Acceleration</span>
                  <div className="flex items-center gap-2">
                    <span className="text-accent-primary">{config.hardwareAcceleration ? 'Enabled' : 'Disabled'}</span>
                    {getFeatureIcon(config.hardwareAcceleration)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">High Refresh Rate</span>
                  <div className="flex items-center gap-2">
                    <span className="text-accent-primary">{config.highRefreshRate ? 'Enabled' : 'Disabled'}</span>
                    {getFeatureIcon(config.highRefreshRate)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Auto Refresh</span>
                  <div className="flex items-center gap-2">
                    <span className="text-accent-primary">{config.autoRefresh ? 'Enabled' : 'Disabled'}</span>
                    {getFeatureIcon(config.autoRefresh)}
                  </div>
                </div>
              </div>
            </div>

            {/* Data Features */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white">Data Optimization</h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Image Format</span>
                  <div className="flex items-center gap-2">
                    <span className="text-accent-primary uppercase">{config.imageOptimization}</span>
                    {getFeatureIcon(config.imageOptimization !== 'basic')}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Prefetching</span>
                  <div className="flex items-center gap-2">
                    <span className="text-accent-primary">{config.prefetching ? 'Enabled' : 'Disabled'}</span>
                    {getFeatureIcon(config.prefetching)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Background Updates</span>
                  <div className="flex items-center gap-2">
                    <span className="text-accent-primary">{config.backgroundUpdates ? 'Enabled' : 'Disabled'}</span>
                    {getFeatureIcon(config.backgroundUpdates)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Preference Controls */}
      <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-3">User Preferences</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            onClick={() => setUserPreferences({ prefersReducedMotion: !config.reducedMotion })}
            variant={config.reducedMotion ? "primary" : "secondary"}
            size="sm"
            className="flex items-center gap-2"
          >
            {config.reducedMotion ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="text-xs">Reduced Motion</span>
          </Button>
          
          <Button
            onClick={() => setUserPreferences({ prefersHighContrast: !config.highContrast })}
            variant={config.highContrast ? "primary" : "secondary"}
            size="sm"
            className="flex items-center gap-2"
          >
            <Monitor className="h-4 w-4" />
            <span className="text-xs">High Contrast</span>
          </Button>
          
          <Button
            onClick={() => setUserPreferences({ dataUsageMode: config.prefetching ? 'conservative' : 'unlimited' })}
            variant={!config.prefetching ? "primary" : "secondary"}
            size="sm"
            className="flex items-center gap-2"
          >
            {config.prefetching ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span className="text-xs">Data Saver</span>
          </Button>
          
          <Button
            onClick={() => setUserPreferences({ performanceMode: config.hardwareAcceleration ? 'battery' : 'performance' })}
            variant={!config.hardwareAcceleration ? "primary" : "secondary"}
            size="sm"
            className="flex items-center gap-2"
          >
            {config.hardwareAcceleration ? <Zap className="h-4 w-4" /> : <Battery className="h-4 w-4" />}
            <span className="text-xs">Battery Mode</span>
          </Button>
        </div>
      </div>

      {/* Info Panel */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-300">
            <strong>Progressive Enhancement</strong> automatically adapts the UI based on device capabilities, 
            network conditions, and user preferences. Higher tiers enable more visual effects and features, 
            while lower tiers prioritize performance and accessibility.
          </div>
        </div>
      </div>
    </Card>
  );
}