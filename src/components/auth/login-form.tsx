'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';
import { cn } from '@/lib/utils';

/**
 * LoginForm Component - Premium glassmorphism login form
 * 
 * Features:
 * - Glassmorphism design with adaptive effects
 * - Real-time validation with visual feedback
 * - Mobile-first responsive design
 * - Touch-optimized interactions
 * - Accessibility-compliant (ARIA, keyboard navigation)
 * - Performance-aware animations
 * - Security-focused input handling
 */

export interface LoginFormProps {
  onSubmit?: (credentials: { email: string; password: string }) => Promise<void>;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
  loading?: boolean;
  error?: string;
  success?: string;
  className?: string;
  'data-testid'?: string;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onForgotPassword,
  onSignUp,
  loading = false,
  error,
  success,
  className,
  'data-testid': testId,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { screenSize } = useDeviceCapabilities();

  // Email validation
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  // Password validation
  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return undefined;
  };

  // Real-time validation
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched.email) {
      const emailError = validateEmail(value);
      setValidationErrors(prev => ({ ...prev, email: emailError }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password) {
      const passwordError = validatePassword(value);
      setValidationErrors(prev => ({ ...prev, password: passwordError }));
    }
  };

  // Handle field blur for validation
  const handleEmailBlur = () => {
    setTouched(prev => ({ ...prev, email: true }));
    const emailError = validateEmail(email);
    setValidationErrors(prev => ({ ...prev, email: emailError }));
  };

  const handlePasswordBlur = () => {
    setTouched(prev => ({ ...prev, password: true }));
    const passwordError = validatePassword(password);
    setValidationErrors(prev => ({ ...prev, password: passwordError }));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError || passwordError) {
      setValidationErrors({
        email: emailError,
        password: passwordError,
      });
      setTouched({ email: true, password: true });
      return;
    }

    setIsSubmitting(true);
    setValidationErrors({});

    try {
      await onSubmit?.({ email, password });
    } catch (err) {
      setValidationErrors({
        general: err instanceof Error ? err.message : 'Login failed. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form state
  const isFormValid = !validateEmail(email) && !validatePassword(password);
  const showLoading = loading || isSubmitting;

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
        className="p-8 w-full"
      >
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-text-secondary">
            Sign in to access your trading signals
          </p>
        </motion.div>

        {/* Success/Error Messages */}
        <AnimatePresence mode="wait">
          {(error || success || validationErrors.general) && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className={cn(
                'flex items-center gap-3 p-4 rounded-xl',
                'glass-light border',
                {
                  'border-status-error': error || validationErrors.general,
                  'border-status-success': success,
                }
              )}>
                {(error || validationErrors.general) && (
                  <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0" />
                )}
                {success && (
                  <CheckCircle className="w-5 h-5 text-status-success flex-shrink-0" />
                )}
                <p className={cn(
                  'text-sm',
                  {
                    'text-status-error': error || validationErrors.general,
                    'text-status-success': success,
                  }
                )}>
                  {error || validationErrors.general || success}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          aria-label="Login form"
        >
          <fieldset className="space-y-6">
            <legend className="sr-only">User credentials</legend>
          {/* Email Input */}
          <GlassInput
            type="email"
            label="Email Address"
            value={email}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            icon={<Mail className="w-5 h-5" />}
            iconPosition="left"
            error={validationErrors.email}
            disabled={showLoading}
            required
            autoComplete="email"
            placeholder="Enter your email"
            data-testid="login-email-input"
          />

          {/* Password Input */}
          <GlassInput
            type="password"
            label="Password"
            value={password}
            onChange={handlePasswordChange}
            onBlur={handlePasswordBlur}
            icon={<Lock className="w-5 h-5" />}
            iconPosition="left"
            error={validationErrors.password}
            disabled={showLoading}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            data-testid="login-password-input"
          />

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <motion.button
              type="button"
              onClick={onForgotPassword}
              className={cn(
                'text-sm text-accent-primary hover:text-accent-primary/80',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2',
                'focus:ring-offset-background-primary rounded-md px-1 py-1',
                'touch-target-min',
                showLoading && 'opacity-50 cursor-not-allowed'
              )}
              disabled={showLoading}
              whileHover={performanceTier === 'high' ? { scale: 1.02 } : undefined}
              whileTap={{ scale: 0.98 }}
              data-testid="forgot-password-link"
            >
              Forgot your password?
            </motion.button>
          </div>

          {/* Submit Button */}
          <MagneticButton
            type="submit"
            variant="primary"
            size={screenSize === 'mobile' ? 'lg' : 'md'}
            disabled={!isFormValid || showLoading}
            loading={showLoading}
            className="w-full"
            icon={<ArrowRight className="w-5 h-5" />}
            iconPosition="right"
            data-testid="login-submit-button"
          >
            {showLoading ? 'Signing In...' : 'Sign In'}
          </MagneticButton>
          </fieldset>
        </motion.form>

        {/* Sign Up Link */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <p className="text-text-secondary">
            Don't have an account?{' '}
            <motion.button
              type="button"
              onClick={onSignUp}
              className={cn(
                'text-accent-primary hover:text-accent-primary/80',
                'transition-colors duration-200 font-medium',
                'focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2',
                'focus:ring-offset-background-primary rounded-md px-1 py-1',
                'touch-target-min',
                showLoading && 'opacity-50 cursor-not-allowed'
              )}
              disabled={showLoading}
              whileHover={performanceTier === 'high' ? { scale: 1.02 } : undefined}
              whileTap={{ scale: 0.98 }}
              data-testid="sign-up-link"
            >
              Sign up
            </motion.button>
          </p>
        </motion.div>

        {/* Premium Glass Effects for High-End Devices */}
        {adaptiveGlass.effects && performanceTier === 'high' && (
          <>
            {/* Gradient Orb */}
            <motion.div
              className="absolute top-8 right-8 w-32 h-32 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Shimmer Effect */}
            <div
              className="absolute inset-0 rounded-xl pointer-events-none opacity-5"
              style={{
                background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                backgroundSize: '200% 200%',
                animation: adaptiveGlass.animations === 'full' ? 'shimmer 3s ease-in-out infinite' : undefined,
              }}
            />
          </>
        )}
      </GlassCard>
    </motion.div>
  );
};

LoginForm.displayName = 'LoginForm';

export { LoginForm };