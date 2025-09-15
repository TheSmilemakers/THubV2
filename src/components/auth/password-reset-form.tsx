'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, AlertCircle, CheckCircle, Send } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';
import { cn } from '@/lib/utils';

/**
 * PasswordResetForm Component - Secure password reset with email verification
 * 
 * Features:
 * - Two-step process: email entry → confirmation
 * - Real-time email validation
 * - Loading states and success/error feedback
 * - Accessible design with screen reader support
 * - Mobile-first responsive layout
 * - Premium glassmorphism effects
 * - Resend functionality with cooldown
 */

export interface PasswordResetFormProps {
  onSubmit?: (email: string) => Promise<void>;
  onBack?: () => void;
  onResend?: (email: string) => Promise<void>;
  loading?: boolean;
  error?: string;
  success?: string;
  className?: string;
  'data-testid'?: string;
}

type FormStep = 'email' | 'confirmation';

interface ValidationErrors {
  email?: string;
  general?: string;
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  onSubmit,
  onBack,
  onResend,
  loading = false,
  error,
  success,
  className,
  'data-testid': testId,
}) => {
  const [step, setStep] = useState<FormStep>('email');
  const [email, setEmail] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({ email: false });
  const [resendCooldown, setResendCooldown] = useState(0);

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

  // Real-time email validation
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched.email) {
      const emailError = validateEmail(value);
      setValidationErrors(prev => ({ ...prev, email: emailError }));
    }
  };

  const handleEmailBlur = () => {
    setTouched(prev => ({ ...prev, email: true }));
    const emailError = validateEmail(email);
    setValidationErrors(prev => ({ ...prev, email: emailError }));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    
    if (emailError) {
      setValidationErrors({ email: emailError });
      setTouched({ email: true });
      return;
    }

    setIsSubmitting(true);
    setValidationErrors({});

    try {
      await onSubmit?.(email.toLowerCase().trim());
      setStep('confirmation');
    } catch (err) {
      setValidationErrors({
        general: err instanceof Error ? err.message : 'Failed to send reset email. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend functionality
  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setIsSubmitting(true);
    try {
      await onResend?.(email.toLowerCase().trim());
      
      // Start cooldown timer (60 seconds)
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setValidationErrors({
        general: err instanceof Error ? err.message : 'Failed to resend email. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const showLoading = loading || isSubmitting;
  const isFormValid = !validateEmail(email);

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
        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <h1 className="text-3xl font-bold text-white mb-2">
                  Reset Password
                </h1>
                <p className="text-text-secondary">
                  Enter your email address and we'll send you a link to reset your password
                </p>
              </motion.div>

              {/* Error Messages */}
              <AnimatePresence mode="wait">
                {(error || validationErrors.general) && (
                  <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-3 p-4 rounded-xl glass-light border border-status-error">
                      <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0" />
                      <p className="text-sm text-status-error">
                        {error || validationErrors.general}
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
              >
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
                  autoFocus
                  placeholder="Enter your email address"
                  data-testid="reset-email-input"
                />

                {/* Submit Button */}
                <MagneticButton
                  type="submit"
                  variant="primary"
                  size={screenSize === 'mobile' ? 'lg' : 'md'}
                  disabled={!isFormValid || showLoading}
                  loading={showLoading}
                  className="w-full"
                  icon={<Send className="w-5 h-5" />}
                  iconPosition="right"
                  data-testid="reset-submit-button"
                >
                  {showLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
                </MagneticButton>
              </motion.form>
            </motion.div>
          ) : (
            <motion.div
              key="confirmation-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Success Header */}
              <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full glass-medium flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-status-success" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Check Your Email
                </h1>
                <p className="text-text-secondary">
                  We've sent a password reset link to
                </p>
                <p className="text-accent-primary font-medium mt-1">
                  {email}
                </p>
              </motion.div>

              {/* Instructions */}
              <motion.div
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <div className="glass-light rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    What's next?
                  </h3>
                  <div className="space-y-3 text-sm text-text-secondary">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-accent-primary">1</span>
                      </div>
                      <p>Check your email inbox (and spam folder)</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-accent-primary">2</span>
                      </div>
                      <p>Click the reset link in the email</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-accent-primary">3</span>
                      </div>
                      <p>Create your new password</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Error Messages for resend */}
              <AnimatePresence mode="wait">
                {(error || validationErrors.general) && (
                  <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-3 p-4 rounded-xl glass-light border border-status-error">
                      <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0" />
                      <p className="text-sm text-status-error">
                        {error || validationErrors.general}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                {/* Resend Button */}
                <MagneticButton
                  type="button"
                  variant="secondary"
                  size={screenSize === 'mobile' ? 'lg' : 'md'}
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || showLoading}
                  loading={showLoading}
                  className="w-full"
                  data-testid="resend-button"
                >
                  {resendCooldown > 0 
                    ? `Resend in ${resendCooldown}s`
                    : showLoading 
                      ? 'Resending...' 
                      : 'Resend Email'
                  }
                </MagneticButton>

                {/* Change Email Button */}
                <MagneticButton
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    setStep('email');
                    setValidationErrors({});
                  }}
                  disabled={showLoading}
                  className="w-full"
                  data-testid="change-email-button"
                >
                  Use Different Email
                </MagneticButton>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back to Login */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <motion.button
            type="button"
            onClick={onBack}
            className={cn(
              'inline-flex items-center gap-2',
              'text-text-secondary hover:text-accent-primary',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2',
              'focus:ring-offset-background-primary rounded-md px-2 py-1',
              'touch-target-min',
              showLoading && 'opacity-50 cursor-not-allowed'
            )}
            disabled={showLoading}
            whileHover={performanceTier === 'high' ? { scale: 1.02 } : undefined}
            whileTap={{ scale: 0.98 }}
            data-testid="back-to-login-button"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </motion.button>
        </motion.div>

        {/* Premium Glass Effects */}
        {adaptiveGlass.effects && performanceTier === 'high' && (
          <>
            {/* Pulsing Orb */}
            <motion.div
              className="absolute top-6 right-6 w-24 h-24 pointer-events-none"
              style={{
                background: step === 'email' 
                  ? 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)',
                filter: 'blur(15px)',
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Email Icon Effect (confirmation step) */}
            {step === 'confirmation' && (
              <motion.div
                className="absolute bottom-6 left-6 w-20 h-20 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
                  filter: 'blur(12px)',
                }}
                animate={{
                  rotate: [0, 360],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 4,
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

PasswordResetForm.displayName = 'PasswordResetForm';

export { PasswordResetForm };