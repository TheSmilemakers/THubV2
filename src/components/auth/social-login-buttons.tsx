'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';
import { cn } from '@/lib/utils';

/**
 * SocialLoginButtons Component - OAuth provider authentication buttons
 * 
 * Features:
 * - Popular OAuth providers (Google, GitHub, Apple, Microsoft)
 * - Premium glassmorphism design with provider branding
 * - Loading states and error handling
 * - Mobile-optimized touch targets
 * - Accessibility-compliant with screen reader support
 * - Responsive layout with stacking on mobile
 * - Performance-aware animations
 */

export interface SocialLoginButtonsProps {
  onProviderLogin?: (provider: OAuthProvider) => Promise<void>;
  providers?: OAuthProvider[];
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  layout?: 'horizontal' | 'vertical' | 'grid';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'data-testid'?: string;
}

export type OAuthProvider = 'google' | 'github' | 'apple' | 'microsoft' | 'discord' | 'twitter';

interface ProviderConfig {
  name: string;
  icon: React.ReactNode;
  bgColor: string;
  hoverColor: string;
  textColor: string;
  borderColor?: string;
}

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onProviderLogin,
  providers = ['google', 'github'],
  loading = false,
  disabled = false,
  error,
  layout = 'vertical',
  size = 'md',
  className,
  'data-testid': testId,
}) => {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);

  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { screenSize } = useDeviceCapabilities();

  // Provider configurations
  const providerConfigs: Record<OAuthProvider, ProviderConfig> = {
    google: {
      name: 'Google',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      ),
      bgColor: 'rgb(255, 255, 255)',
      hoverColor: 'rgb(248, 249, 250)',
      textColor: 'rgb(60, 64, 67)',
      borderColor: 'rgb(218, 220, 224)',
    },
    github: {
      name: 'GitHub',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
      ),
      bgColor: 'rgb(36, 41, 47)',
      hoverColor: 'rgb(48, 54, 61)',
      textColor: 'rgb(255, 255, 255)',
    },
    apple: {
      name: 'Apple',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      ),
      bgColor: 'rgb(0, 0, 0)',
      hoverColor: 'rgb(29, 29, 31)',
      textColor: 'rgb(255, 255, 255)',
    },
    microsoft: {
      name: 'Microsoft',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path fill="#F25022" d="M1 1h10v10H1z"/>
          <path fill="#00A4EF" d="M13 1h10v10H13z"/>
          <path fill="#7FBA00" d="M1 13h10v10H1z"/>
          <path fill="#FFB900" d="M13 13h10v10H13z"/>
        </svg>
      ),
      bgColor: 'rgb(255, 255, 255)',
      hoverColor: 'rgb(248, 249, 250)',
      textColor: 'rgb(60, 64, 67)',
      borderColor: 'rgb(218, 220, 224)',
    },
    discord: {
      name: 'Discord',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z"/>
        </svg>
      ),
      bgColor: 'rgb(88, 101, 242)',
      hoverColor: 'rgb(71, 82, 196)',
      textColor: 'rgb(255, 255, 255)',
    },
    twitter: {
      name: 'X (Twitter)',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      bgColor: 'rgb(0, 0, 0)',
      hoverColor: 'rgb(29, 29, 31)',
      textColor: 'rgb(255, 255, 255)',
    },
  };

  // Size configurations
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm h-10',
    md: 'px-4 py-3 text-base h-12',
    lg: 'px-6 py-4 text-lg h-14',
  };

  // Handle provider login
  const handleProviderLogin = async (provider: OAuthProvider) => {
    if (disabled || loading || loadingProvider) return;

    setLoadingProvider(provider);
    try {
      await onProviderLogin?.(provider);
    } catch (err) {
      console.error(`${provider} login failed:`, err);
    } finally {
      setLoadingProvider(null);
    }
  };

  // Layout classes
  const containerClasses = cn(
    'w-full',
    {
      'flex flex-col gap-3': layout === 'vertical' || (layout === 'horizontal' && screenSize === 'mobile'),
      'flex flex-row gap-3': layout === 'horizontal' && screenSize !== 'mobile',
      'grid grid-cols-2 gap-3': layout === 'grid',
    },
    className
  );

  const renderButton = (provider: OAuthProvider) => {
    const config = providerConfigs[provider];
    const isLoading = loadingProvider === provider;
    const isDisabled = disabled || loading || loadingProvider !== null;

    return (
      <motion.button
        key={provider}
        type="button"
        onClick={() => handleProviderLogin(provider)}
        disabled={isDisabled}
        className={cn(
          'relative flex items-center justify-center gap-3 rounded-xl font-medium',
          'transition-all duration-200 overflow-hidden',
          'focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2',
          'focus:ring-offset-background-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'touch-manipulation',
          sizeClasses[size],
          // Provider-specific styling
          config.name === 'Google' || config.name === 'Microsoft' 
            ? 'border border-gray-300 shadow-sm' 
            : 'border-0'
        )}
        style={{
          backgroundColor: isDisabled ? 'rgba(156, 163, 175, 0.3)' : config.bgColor,
          color: isDisabled ? 'rgb(156, 163, 175)' : config.textColor,
          borderColor: config.borderColor,
        }}
        whileHover={
          performanceTier === 'high' && !isDisabled
            ? {
                scale: 1.02,
                backgroundColor: config.hoverColor,
                transition: { type: 'spring', stiffness: 400, damping: 25 },
              }
            : undefined
        }
        whileTap={
          !isDisabled
            ? {
                scale: 0.98,
                transition: { type: 'spring', stiffness: 600, damping: 30 },
              }
            : undefined
        }
        data-testid={`social-login-${provider}`}
      >
        {/* Glass overlay for premium effect */}
        {adaptiveGlass.effects && performanceTier === 'high' && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none opacity-10"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
            }}
          />
        )}

        {/* Loading spinner */}
        {isLoading ? (
          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div 
              className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"
              style={{ borderColor: config.textColor }}
            />
          </motion.div>
        ) : (
          <>
            {/* Provider icon */}
            <motion.div
              className="flex-shrink-0"
              animate={
                performanceTier === 'high' && !isDisabled
                  ? { rotate: [0, 5, -5, 0] }
                  : {}
              }
              transition={{ duration: 0.3 }}
            >
              {config.icon}
            </motion.div>

            {/* Provider name */}
            <span className="font-medium">
              Continue with {config.name}
            </span>
          </>
        )}

        {/* Shine effect for high-end devices */}
        {adaptiveGlass.effects && performanceTier === 'high' && !isDisabled && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none opacity-0"
            style={{
              background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
              backgroundSize: '200% 200%',
            }}
            whileHover={{
              opacity: 0.3,
              backgroundPosition: ['0% 0%', '100% 100%'],
              transition: { duration: 0.6, ease: 'easeOut' },
            }}
          />
        )}
      </motion.button>
    );
  };

  return (
    <div data-testid={testId}>
      {/* Error Message */}
      {error && (
        <motion.div
          className="mb-4 p-3 rounded-xl glass-light border border-status-error"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm text-status-error text-center">{error}</p>
        </motion.div>
      )}

      {/* Social Buttons */}
      <motion.div
        className={containerClasses}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, staggerChildren: 0.1 }}
      >
        {providers.map((provider) => (
          <motion.div
            key={provider}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderButton(provider)}
          </motion.div>
        ))}
      </motion.div>

      {/* Divider for use with traditional forms */}
      <motion.div
        className="flex items-center gap-4 my-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="flex-1 h-px bg-glass-border-light" />
        <span className="text-sm text-text-muted font-medium">or</span>
        <div className="flex-1 h-px bg-glass-border-light" />
      </motion.div>
    </div>
  );
};

SocialLoginButtons.displayName = 'SocialLoginButtons';

export { SocialLoginButtons };