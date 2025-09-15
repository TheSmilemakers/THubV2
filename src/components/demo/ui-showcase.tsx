'use client';

import React, { useState } from 'react';
import { 
  GlassCard, 
  MagneticButton, 
  GlassInput, 
  SearchInput, 
  PasswordInput,
  PrimaryButton,
  SecondaryButton,
  GhostButton
} from '@/components/ui';
import { SignalsShowcase } from './signals-showcase';
import { Search, Mail, Lock, Star, Heart, Download } from 'lucide-react';

/**
 * UI Showcase Component - Demonstrates Session B deliverables
 * 
 * This component showcases the core UI components implemented in Session B:
 * 1. GlassCard with multi-layer glassmorphism
 * 2. MagneticButton with spring physics
 * 3. Adaptive Input components
 * 4. Device capability detection
 * 5. CSS custom properties system
 */

export function UIShowcase() {
  const [searchValue, setSearchValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'foundation' | 'signals'>('foundation');

  const handleButtonClick = (buttonName: string) => {
    console.log(`${buttonName} clicked`);
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background-primary p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold gradient-text">
            THub V2: UI Components Showcase
          </h1>
          <p className="text-text-secondary text-lg">
            Premium glassmorphism components with mobile-first design and 60fps performance
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center">
          <div className="flex glass-medium rounded-xl p-1">
            <button
              onClick={() => setActiveTab('foundation')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'foundation'
                  ? 'bg-accent-primary text-white shadow-lg'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              Foundation Components
            </button>
            <button
              onClick={() => setActiveTab('signals')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'signals'
                  ? 'bg-accent-primary text-white shadow-lg'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              Signal Components
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'foundation' ? (
          <div className="space-y-8">

        {/* Glass Card Variants */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">1. GlassCard Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard variant="surface" className="p-6 text-center">
              <h3 className="font-medium text-white mb-2">Surface</h3>
              <p className="text-text-muted text-sm">Light glassmorphism</p>
            </GlassCard>
            
            <GlassCard variant="elevated" className="p-6 text-center" interactive>
              <h3 className="font-medium text-white mb-2">Elevated</h3>
              <p className="text-text-muted text-sm">Medium glass + hover</p>
            </GlassCard>
            
            <GlassCard variant="prominent" className="p-6 text-center" interactive>
              <h3 className="font-medium text-white mb-2">Prominent</h3>
              <p className="text-text-muted text-sm">Heavy glass + interactions</p>
            </GlassCard>
            
            <GlassCard variant="holographic" className="p-6 text-center" interactive>
              <h3 className="font-medium text-white mb-2">Holographic</h3>
              <p className="text-text-muted text-sm">Advanced effects</p>
            </GlassCard>
          </div>
        </section>

        {/* Magnetic Buttons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">2. MagneticButton Variants</h2>
          
          {/* Button sizes */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-text-secondary">Sizes & Variants</h3>
            <div className="flex flex-wrap gap-4 items-end">
              <PrimaryButton 
                size="sm" 
                onClick={() => handleButtonClick('Primary Small')}
                loading={loading}
              >
                Small
              </PrimaryButton>
              
              <PrimaryButton 
                size="md" 
                onClick={() => handleButtonClick('Primary Medium')}
                icon={<Star className="w-4 h-4" />}
              >
                Medium
              </PrimaryButton>
              
              <PrimaryButton 
                size="lg" 
                onClick={() => handleButtonClick('Primary Large')}
                icon={<Download className="w-5 h-5" />}
                iconPosition="right"
              >
                Large
              </PrimaryButton>
              
              <PrimaryButton 
                size="xl" 
                onClick={() => handleButtonClick('Primary XL')}
                magneticStrength={0.5}
                magneticRadius={120}
              >
                Extra Large
              </PrimaryButton>
            </div>
          </div>

          {/* Button variants */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-text-secondary">Style Variants</h3>
            <div className="flex flex-wrap gap-4">
              <SecondaryButton 
                onClick={() => handleButtonClick('Secondary')}
                icon={<Heart className="w-4 h-4" />}
              >
                Secondary
              </SecondaryButton>
              
              <GhostButton onClick={() => handleButtonClick('Ghost')}>
                Ghost
              </GhostButton>
              
              <MagneticButton 
                variant="success" 
                onClick={() => handleButtonClick('Success')}
              >
                Success
              </MagneticButton>
              
              <MagneticButton 
                variant="danger" 
                onClick={() => handleButtonClick('Danger')}
              >
                Danger
              </MagneticButton>
              
              <MagneticButton 
                disabled 
                onClick={() => handleButtonClick('Disabled')}
              >
                Disabled
              </MagneticButton>
            </div>
          </div>
        </section>

        {/* Input Components */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">3. Adaptive Input Components</h2>
          
          <GlassCard variant="elevated" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic inputs */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Standard Inputs</h3>
                
                <SearchInput
                  label="Search"
                  placeholder="Search for signals..."
                  value={searchValue}
                  onChange={setSearchValue}
                  hint="Try searching for 'AAPL' or 'Bitcoin'"
                />
                
                <GlassInput
                  label="Email"
                  type="email"
                  icon={<Mail className="w-5 h-5" />}
                  value={emailValue}
                  onChange={setEmailValue}
                  required
                  placeholder="Enter your email"
                />
                
                <PasswordInput
                  label="Password"
                  value={passwordValue}
                  onChange={setPasswordValue}
                  required
                  hint="Minimum 8 characters"
                />
              </div>

              {/* Advanced inputs */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Advanced Features</h3>
                
                <GlassInput
                  label="Floating Label"
                  placeholder="This has a floating label"
                  success="Great! This field is valid"
                />
                
                <GlassInput
                  label="With Error"
                  placeholder="This shows an error state"
                  error="This field is required"
                  required
                />
                
                <GlassInput
                  label="Disabled Input"
                  placeholder="This input is disabled"
                  disabled
                  value="Disabled state"
                />
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Device Capabilities Demo */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">4. Device Capabilities Detection</h2>
          
          <GlassCard variant="elevated" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl mb-2">🎮</div>
                <h3 className="font-medium text-white">Performance Tier</h3>
                <p className="text-text-muted text-sm">
                  Adaptive animations based on device capabilities
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl mb-2">📱</div>
                <h3 className="font-medium text-white">Touch Optimized</h3>
                <p className="text-text-muted text-sm">
                  44px minimum touch targets for mobile
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl mb-2">✨</div>
                <h3 className="font-medium text-white">Glassmorphism</h3>
                <p className="text-text-muted text-sm">
                  Adaptive effects based on browser support
                </p>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Performance Info */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">5. Performance Targets</h2>
          
          <GlassCard variant="prominent" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-accent-primary mb-2">60fps</div>
                <p className="text-text-muted text-sm">Target frame rate on high-end devices</p>
              </div>
              
              <div>
                <div className="text-3xl font-bold text-accent-secondary mb-2">44px</div>
                <p className="text-text-muted text-sm">Minimum touch target size</p>
              </div>
              
              <div>
                <div className="text-3xl font-bold text-accent-tertiary mb-2">3</div>
                <p className="text-text-muted text-sm">Core components implemented</p>
              </div>
              
              <div>
                <div className="text-3xl font-bold text-accent-quaternary mb-2">0</div>
                <p className="text-text-muted text-sm">TypeScript errors</p>
              </div>
            </div>
          </GlassCard>
        </section>
          </div>
        ) : (
          <SignalsShowcase />
        )}
      </div>
    </div>
  );
}