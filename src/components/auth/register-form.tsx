'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';
import { cn } from '@/lib/utils';

/**
 * RegisterForm Component - Premium glassmorphism registration form
 * 
 * Features:
 * - Comprehensive registration with real-time validation
 * - Password strength indicator
 * - Terms and conditions acceptance
 * - Progressive enhancement with glassmorphism effects
 * - Mobile-first responsive design
 * - Accessibility-compliant
 * - Security-focused input handling
 */

export interface RegisterFormProps {
  onSubmit?: (userData: {
    name: string;
    email: string;
    password: string;
    acceptTerms: boolean;
  }) => Promise<void>;
  onSignIn?: () => void;
  loading?: boolean;
  error?: string;
  success?: string;
  className?: string;
  'data-testid'?: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
  general?: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  suggestions: string[];
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  onSignIn,
  loading = false,
  error,
  success,
  className,
  'data-testid': testId,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    acceptTerms: false,
  });

  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { screenSize } = useDeviceCapabilities();

  // Validation functions
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    if (name.trim().length > 50) return 'Name must be less than 50 characters';
    if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password.length > 128) return 'Password must be less than 128 characters';
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return undefined;
  };

  const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
    if (!confirmPassword) return 'Please confirm your password';
    if (password !== confirmPassword) return 'Passwords do not match';
    return undefined;
  };

  const validateTerms = (accepted: boolean): string | undefined => {
    if (!accepted) return 'You must accept the terms and conditions';
    return undefined;
  };

  // Password strength calculation
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    if (!password) return { score: 0, label: '', color: 'transparent', suggestions: [] };

    let score = 0;
    const suggestions: string[] = [];

    // Length check
    if (password.length >= 8) score += 1;
    else suggestions.push('Use at least 8 characters');

    // Lowercase check
    if (/(?=.*[a-z])/.test(password)) score += 1;
    else suggestions.push('Add lowercase letters');

    // Uppercase check
    if (/(?=.*[A-Z])/.test(password)) score += 1;
    else suggestions.push('Add uppercase letters');

    // Number check
    if (/(?=.*\d)/.test(password)) score += 1;
    else suggestions.push('Add numbers');

    // Special character check
    if (/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) score += 1;
    else suggestions.push('Add special characters');

    const strengthMap = {
      0: { label: '', color: 'transparent' },
      1: { label: 'Very Weak', color: '#ef4444' },
      2: { label: 'Weak', color: '#f97316' },
      3: { label: 'Fair', color: '#eab308' },
      4: { label: 'Good', color: '#22c55e' },
      5: { label: 'Strong', color: '#16a34a' },
    };

    const { label, color } = strengthMap[score as keyof typeof strengthMap];
    return { score, label, color, suggestions: suggestions.slice(0, 2) };
  };

  // Form handlers
  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Real-time validation for touched fields
    if (touched[field as keyof typeof touched]) {
      validateField(field, value);
    }
  };

  const validateField = (field: keyof typeof formData, value: string | boolean) => {
    let error: string | undefined;

    switch (field) {
      case 'name':
        error = validateName(value as string);
        break;
      case 'email':
        error = validateEmail(value as string);
        break;
      case 'password':
        error = validatePassword(value as string);
        break;
      case 'confirmPassword':
        error = validateConfirmPassword(formData.password, value as string);
        break;
      case 'acceptTerms':
        error = validateTerms(value as boolean);
        break;
    }

    setValidationErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field as keyof typeof formData]);
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const errors: ValidationErrors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.password, formData.confirmPassword),
      acceptTerms: validateTerms(formData.acceptTerms),
    };

    const hasErrors = Object.values(errors).some(error => error !== undefined);

    if (hasErrors) {
      setValidationErrors(errors);
      setTouched({
        name: true,
        email: true,
        password: true,
        confirmPassword: true,
        acceptTerms: true,
      });
      return;
    }

    setIsSubmitting(true);
    setValidationErrors({});

    try {
      await onSubmit?.({
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        acceptTerms: formData.acceptTerms,
      });
    } catch (err) {
      setValidationErrors({
        general: err instanceof Error ? err.message : 'Registration failed. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form state
  const isFormValid = 
    !validateName(formData.name) &&
    !validateEmail(formData.email) &&
    !validatePassword(formData.password) &&
    !validateConfirmPassword(formData.password, formData.confirmPassword) &&
    !validateTerms(formData.acceptTerms);

  const showLoading = loading || isSubmitting;
  const passwordStrength = calculatePasswordStrength(formData.password);

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
            Create Account
          </h1>
          <p className="text-text-secondary">
            Join THub to access premium trading signals
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
        >
          {/* Name Input */}
          <GlassInput
            type="text"
            label="Full Name"
            value={formData.name}
            onChange={(value) => handleInputChange('name', value)}
            onBlur={() => handleBlur('name')}
            icon={<User className="w-5 h-5" />}
            iconPosition="left"
            error={validationErrors.name}
            disabled={showLoading}
            required
            autoComplete="name"
            placeholder="Enter your full name"
            maxLength={50}
            data-testid="register-name-input"
          />

          {/* Email Input */}
          <GlassInput
            type="email"
            label="Email Address"
            value={formData.email}
            onChange={(value) => handleInputChange('email', value)}
            onBlur={() => handleBlur('email')}
            icon={<Mail className="w-5 h-5" />}
            iconPosition="left"
            error={validationErrors.email}
            disabled={showLoading}
            required
            autoComplete="email"
            placeholder="Enter your email"
            data-testid="register-email-input"
          />

          {/* Password Input */}
          <div className="space-y-2">
            <GlassInput
              type="password"
              label="Password"
              value={formData.password}
              onChange={(value) => handleInputChange('password', value)}
              onBlur={() => handleBlur('password')}
              icon={<Lock className="w-5 h-5" />}
              iconPosition="left"
              error={validationErrors.password}
              disabled={showLoading}
              required
              autoComplete="new-password"
              placeholder="Create a strong password"
              maxLength={128}
              data-testid="register-password-input"
            />

            {/* Password Strength Indicator */}
            <AnimatePresence>
              {formData.password && (
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Strength Bar */}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-all duration-300',
                          passwordStrength.score >= level
                            ? 'opacity-100'
                            : 'opacity-20 bg-glass-border-light'
                        )}
                        style={{
                          backgroundColor: passwordStrength.score >= level 
                            ? passwordStrength.color 
                            : undefined
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Strength Label */}
                  {passwordStrength.label && (
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-xs font-medium"
                        style={{ color: passwordStrength.color }}
                      >
                        {passwordStrength.label}
                      </span>
                      {passwordStrength.score >= 4 && (
                        <Shield className="w-4 h-4 text-status-success" />
                      )}
                    </div>
                  )}

                  {/* Suggestions */}
                  {passwordStrength.suggestions.length > 0 && (
                    <ul className="text-xs text-text-muted space-y-1">
                      {passwordStrength.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-text-muted" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Confirm Password Input */}
          <GlassInput
            type="password"
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={(value) => handleInputChange('confirmPassword', value)}
            onBlur={() => handleBlur('confirmPassword')}
            icon={<Lock className="w-5 h-5" />}
            iconPosition="left"
            error={validationErrors.confirmPassword}
            disabled={showLoading}
            required
            autoComplete="new-password"
            placeholder="Confirm your password"
            data-testid="register-confirm-password-input"
          />

          {/* Terms and Conditions */}
          <div className="space-y-2">
            <motion.label
              className="flex items-start gap-3 cursor-pointer group"
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                  onBlur={() => handleBlur('acceptTerms')}
                  className="sr-only"
                  disabled={showLoading}
                  data-testid="register-terms-checkbox"
                />
                <div className={cn(
                  'w-5 h-5 rounded glass-light border-2 transition-all duration-200',
                  'flex items-center justify-center',
                  formData.acceptTerms
                    ? 'border-accent-primary bg-accent-primary'
                    : 'border-glass-border-medium',
                  'group-hover:border-accent-primary/50',
                  showLoading && 'opacity-50 cursor-not-allowed'
                )}>
                  {formData.acceptTerms && (
                    <motion.svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </motion.svg>
                  )}
                </div>
              </div>
              <span className={cn(
                'text-sm text-text-secondary leading-tight',
                showLoading && 'opacity-50'
              )}>
                I agree to the{' '}
                <button
                  type="button"
                  className="text-accent-primary hover:text-accent-primary/80 underline"
                  disabled={showLoading}
                >
                  Terms of Service
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  className="text-accent-primary hover:text-accent-primary/80 underline"
                  disabled={showLoading}
                >
                  Privacy Policy
                </button>
              </span>
            </motion.label>

            {validationErrors.acceptTerms && (
              <motion.p
                className="text-sm text-status-error flex items-center gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <AlertCircle className="w-4 h-4" />
                {validationErrors.acceptTerms}
              </motion.p>
            )}
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
            data-testid="register-submit-button"
          >
            {showLoading ? 'Creating Account...' : 'Create Account'}
          </MagneticButton>
        </motion.form>

        {/* Sign In Link */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <p className="text-text-secondary">
            Already have an account?{' '}
            <motion.button
              type="button"
              onClick={onSignIn}
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
              data-testid="sign-in-link"
            >
              Sign in
            </motion.button>
          </p>
        </motion.div>

        {/* Premium Glass Effects */}
        {adaptiveGlass.effects && performanceTier === 'high' && (
          <>
            {/* Gradient Orb */}
            <motion.div
              className="absolute top-8 right-8 w-32 h-32 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)',
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

            {/* Security Badge Effect */}
            <motion.div
              className="absolute bottom-8 left-8 w-24 h-24 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
                filter: 'blur(15px)',
              }}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </>
        )}
      </GlassCard>
    </motion.div>
  );
};

RegisterForm.displayName = 'RegisterForm';

export { RegisterForm };