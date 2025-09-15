'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertCircle, 
  ShieldX, 
  Clock, 
  WifiOff, 
  UserX, 
  Mail, 
  RefreshCw, 
  ArrowLeft,
  HelpCircle,
  Settings
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';
import { cn } from '@/lib/utils';

/**
 * AuthErrorStates Component - Comprehensive error handling for authentication flows
 * 
 * Features:
 * - Multiple error types with specific icons and recovery actions
 * - Recovery suggestions and action buttons
 * - Mobile-first responsive design
 * - Premium glassmorphism effects with error-specific theming
 * - Accessibility-compliant with clear error messaging
 * - Progressive enhancement with animations
 */

export interface AuthErrorStatesProps {
  errorType?: AuthErrorType;
  errorMessage?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  onContactSupport?: () => void;
  onCheckSettings?: () => void;
  userEmail?: string;
  retryCount?: number;
  maxRetries?: number;
  className?: string;
  'data-testid'?: string;
}

export type AuthErrorType = 
  | 'network_error'
  | 'invalid_credentials'
  | 'account_locked'
  | 'email_not_verified'
  | 'session_expired'
  | 'rate_limit_exceeded'
  | 'provider_error'
  | 'invalid_token'
  | 'account_not_found'
  | 'email_already_exists'
  | 'weak_password'
  | 'generic_error';

interface ErrorConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  actions: ('retry' | 'back' | 'support' | 'settings' | 'verify')[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const AuthErrorStates: React.FC<AuthErrorStatesProps> = ({
  errorType = 'generic_error',
  errorMessage,
  onRetry,
  onGoBack,
  onContactSupport,
  onCheckSettings,
  userEmail,
  retryCount = 0,
  maxRetries = 3,
  className,
  'data-testid': testId,
}) => {
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { screenSize } = useDeviceCapabilities();

  // Error configurations
  const errorConfigs: Record<AuthErrorType, ErrorConfig> = {
    network_error: {
      icon: <WifiOff className="w-8 h-8" />,
      title: 'Network Connection Error',
      description: 'Unable to connect to our servers. Please check your internet connection and try again.',
      color: 'rgb(234, 179, 8)',
      bgColor: 'rgba(234, 179, 8, 0.1)',
      actions: ['retry', 'back'],
      severity: 'medium',
    },
    invalid_credentials: {
      icon: <UserX className="w-8 h-8" />,
      title: 'Invalid Credentials',
      description: 'The email or password you entered is incorrect. Please double-check your credentials and try again.',
      color: 'rgb(239, 68, 68)',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      actions: ['retry', 'back'],
      severity: 'low',
    },
    account_locked: {
      icon: <ShieldX className="w-8 h-8" />,
      title: 'Account Temporarily Locked',
      description: 'Your account has been temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.',
      color: 'rgb(239, 68, 68)',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      actions: ['support', 'back'],
      severity: 'high',
    },
    email_not_verified: {
      icon: <Mail className="w-8 h-8" />,
      title: 'Email Not Verified',
      description: 'Please verify your email address before signing in. Check your inbox for a verification link.',
      color: 'rgb(59, 130, 246)',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      actions: ['verify', 'back'],
      severity: 'medium',
    },
    session_expired: {
      icon: <Clock className="w-8 h-8" />,
      title: 'Session Expired',
      description: 'Your session has expired for security reasons. Please sign in again to continue.',
      color: 'rgb(139, 92, 246)',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      actions: ['retry', 'back'],
      severity: 'low',
    },
    rate_limit_exceeded: {
      icon: <Clock className="w-8 h-8" />,
      title: 'Too Many Attempts',
      description: 'You\'ve made too many requests. Please wait a few minutes before trying again.',
      color: 'rgb(234, 179, 8)',
      bgColor: 'rgba(234, 179, 8, 0.1)',
      actions: ['support', 'back'],
      severity: 'medium',
    },
    provider_error: {
      icon: <Settings className="w-8 h-8" />,
      title: 'Provider Authentication Error',
      description: 'There was an issue with the authentication provider. Please try a different sign-in method.',
      color: 'rgb(239, 68, 68)',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      actions: ['retry', 'back', 'support'],
      severity: 'medium',
    },
    invalid_token: {
      icon: <ShieldX className="w-8 h-8" />,
      title: 'Invalid or Expired Token',
      description: 'The authentication token is invalid or has expired. Please request a new one.',
      color: 'rgb(239, 68, 68)',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      actions: ['retry', 'back'],
      severity: 'medium',
    },
    account_not_found: {
      icon: <UserX className="w-8 h-8" />,
      title: 'Account Not Found',
      description: 'No account found with this email address. Please check your email or create a new account.',
      color: 'rgb(239, 68, 68)',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      actions: ['back'],
      severity: 'low',
    },
    email_already_exists: {
      icon: <Mail className="w-8 h-8" />,
      title: 'Email Already Registered',
      description: 'An account with this email address already exists. Please sign in instead.',
      color: 'rgb(234, 179, 8)',
      bgColor: 'rgba(234, 179, 8, 0.1)',
      actions: ['back'],
      severity: 'low',
    },
    weak_password: {
      icon: <ShieldX className="w-8 h-8" />,
      title: 'Password Too Weak',
      description: 'Your password doesn\'t meet our security requirements. Please choose a stronger password.',
      color: 'rgb(234, 179, 8)',
      bgColor: 'rgba(234, 179, 8, 0.1)',
      actions: ['back'],
      severity: 'low',
    },
    generic_error: {
      icon: <AlertCircle className="w-8 h-8" />,
      title: 'Something Went Wrong',
      description: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
      color: 'rgb(239, 68, 68)',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      actions: ['retry', 'support', 'back'],
      severity: 'medium',
    },
  };

  const config = errorConfigs[errorType];
  const canRetry = retryCount < maxRetries && config.actions.includes('retry');

  // Action handlers
  const handleRetry = () => {
    if (canRetry && onRetry) {
      onRetry();
    }
  };

  const handleVerify = () => {
    // In real implementation, this would trigger email verification resend
    console.log('Resending verification email to:', userEmail);
  };

  const renderActionButton = (action: string, index: number) => {
    const buttonProps = {
      key: action,
      size: screenSize === 'mobile' ? 'lg' as const : 'md' as const,
      className: 'flex-1',
      'data-testid': `error-action-${action}`,
    };

    const delay = 0.3 + (index * 0.1);

    switch (action) {
      case 'retry':
        return (
          <motion.div
            key={action}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
          >
            <MagneticButton
              {...buttonProps}
              variant="primary"
              onClick={handleRetry}
              disabled={!canRetry}
              icon={<RefreshCw className="w-4 h-4" />}
              iconPosition="left"
            >
              {retryCount > 0 ? `Retry (${maxRetries - retryCount} left)` : 'Try Again'}
            </MagneticButton>
          </motion.div>
        );
      
      case 'verify':
        return (
          <motion.div
            key={action}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
          >
            <MagneticButton
              {...buttonProps}
              variant="primary"
              onClick={handleVerify}
              icon={<Mail className="w-4 h-4" />}
              iconPosition="left"
            >
              Resend Verification
            </MagneticButton>
          </motion.div>
        );
      
      case 'back':
        return (
          <motion.div
            key={action}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
          >
            <MagneticButton
              {...buttonProps}
              variant="secondary"
              onClick={onGoBack}
              icon={<ArrowLeft className="w-4 h-4" />}
              iconPosition="left"
            >
              Go Back
            </MagneticButton>
          </motion.div>
        );
      
      case 'support':
        return (
          <motion.div
            key={action}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
          >
            <MagneticButton
              {...buttonProps}
              variant="ghost"
              onClick={onContactSupport}
              icon={<HelpCircle className="w-4 h-4" />}
              iconPosition="left"
            >
              Contact Support
            </MagneticButton>
          </motion.div>
        );
      
      case 'settings':
        return (
          <motion.div
            key={action}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
          >
            <MagneticButton
              {...buttonProps}
              variant="ghost"
              onClick={onCheckSettings}
              icon={<Settings className="w-4 h-4" />}
              iconPosition="left"
            >
              Check Settings
            </MagneticButton>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={cn('w-full max-w-md mx-auto', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      data-testid={testId}
    >
      <GlassCard
        variant={performanceTier === 'high' ? 'prominent' : 'elevated'}
        className="p-8 w-full relative overflow-hidden"
      >
        {/* Error Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {/* Error Icon */}
          <motion.div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: config.bgColor,
              color: config.color,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          >
            {config.icon}
          </motion.div>

          {/* Error Title */}
          <motion.h1
            className="text-2xl font-bold text-white mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {config.title}
          </motion.h1>

          {/* Error Description */}
          <motion.p
            className="text-text-secondary leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            {errorMessage || config.description}
          </motion.p>

          {/* User Email for context */}
          {userEmail && ['email_not_verified', 'account_not_found', 'email_already_exists'].includes(errorType) && (
            <motion.p
              className="text-accent-primary font-medium mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              {userEmail}
            </motion.p>
          )}
        </motion.div>

        {/* Additional Info */}
        {config.severity === 'high' && (
          <motion.div
            className="mb-6 p-4 rounded-xl glass-light border"
            style={{ borderColor: config.color + '40' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: config.color }} />
              <div className="text-sm text-text-secondary">
                <p className="font-medium mb-1" style={{ color: config.color }}>
                  Security Notice
                </p>
                <p>
                  This is a security-related issue. If you believe this is an error, 
                  please contact our support team immediately.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Retry Counter */}
        {retryCount > 0 && (
          <motion.div
            className="mb-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.3 }}
          >
            <p className="text-sm text-text-muted">
              Attempt {retryCount} of {maxRetries}
            </p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          className={cn(
            'space-y-3',
            config.actions.length > 1 && screenSize !== 'mobile' && 'md:flex md:space-y-0 md:space-x-3'
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {config.actions.map((action, index) => renderActionButton(action, index))}
        </motion.div>

        {/* Premium Glass Effects */}
        {adaptiveGlass.effects && performanceTier === 'high' && (
          <>
            {/* Error-specific Orb */}
            <motion.div
              className="absolute top-6 right-6 w-20 h-20 pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${config.color}15 0%, transparent 70%)`,
                filter: 'blur(12px)',
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: config.severity === 'critical' ? 1.5 : 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Pulse Effect for Critical Errors */}
            {config.severity === 'critical' && (
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none border"
                style={{ borderColor: config.color + '20' }}
                animate={{
                  borderColor: [config.color + '20', config.color + '40', config.color + '20'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
          </>
        )}
      </GlassCard>
    </motion.div>
  );
};

AuthErrorStates.displayName = 'AuthErrorStates';

export { AuthErrorStates };