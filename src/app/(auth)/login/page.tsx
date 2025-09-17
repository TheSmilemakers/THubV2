'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Key, ArrowRight, AlertCircle, CheckCircle, Home } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { validateTokenClient } from '@/lib/auth/client-auth';
import { useTheme } from '@/lib/themes/use-theme';
import { cn } from '@/lib/utils';
import Link from 'next/link';

function LoginContent() {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  
  // Get redirect URL from search params
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const errorFromUrl = searchParams.get('error');
  
  // Show error from URL if present
  useEffect(() => {
    if (errorFromUrl === 'authentication_required') {
      setError('Please log in to access this page');
    } else if (errorFromUrl === 'invalid_token') {
      setError('Your session has expired. Please log in again');
    }
  }, [errorFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token.trim()) {
      setError('Please enter your access token');
      return;
    }

    setIsLoading(true);

    try {
      // Store token in localStorage before validation
      localStorage.setItem('thub_access_token', token);
      
      const user = await validateTokenClient(token);
      
      if (user) {
        setSuccess('Authentication successful! Redirecting...');
        setTimeout(() => {
          router.push(redirectUrl);
        }, 1000);
      } else {
        // Remove invalid token from storage
        localStorage.removeItem('thub_access_token');
        setError('Invalid access token. Please check and try again.');
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <GlassCard variant="prominent" className="p-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 p-0.5">
            <div className="flex items-center justify-center w-full h-full rounded-full bg-black">
              <Key className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className={cn(
            "text-3xl font-bold mb-2",
            theme === 'synthwave' ? "text-neon-cyan font-mono" : "text-white"
          )}>
            {theme === 'synthwave' ? '[ACCESS PORTAL]' : 'Welcome to THub V2'}
          </h1>
          <p className={cn(
            "text-text-secondary",
            theme === 'synthwave' && "text-neon-pink font-mono text-sm"
          )}>
            {theme === 'synthwave' ? '> ENTER ACCESS TOKEN TO PROCEED' : 'Enter your access token to continue'}
          </p>
        </motion.div>

        {/* Success/Error Messages */}
        {(error || success) && (
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
                'border-status-error': error,
                'border-status-success': success,
              }
            )}>
              {error && (
                <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0" />
              )}
              {success && (
                <CheckCircle className="w-5 h-5 text-status-success flex-shrink-0" />
              )}
              <p className={cn(
                'text-sm',
                {
                  'text-status-error': error,
                  'text-status-success': success,
                }
              )}>
                {error || success}
              </p>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <GlassInput
            type="text"
            label={theme === 'synthwave' ? 'ACCESS_TOKEN' : 'Access Token'}
            value={token}
            onChange={setToken}
            icon={<Key className="w-5 h-5" />}
            iconPosition="left"
            disabled={isLoading}
            required
            placeholder={theme === 'synthwave' ? 'XXXX-XXXX-XXXX-XXXX' : 'Enter your access token'}
            className={theme === 'synthwave' ? 'font-mono' : ''}
          />

          <MagneticButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={!token.trim() || isLoading}
            loading={isLoading}
            className="w-full"
            icon={<ArrowRight className="w-5 h-5" />}
            iconPosition="right"
          >
            {isLoading ? 'Authenticating...' : theme === 'synthwave' ? '[AUTHENTICATE]' : 'Continue'}
          </MagneticButton>
        </motion.form>

        {/* Info Section */}
        <motion.div
          className="mt-8 p-4 rounded-lg glass-light border border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <p className="text-sm text-text-secondary text-center">
            {theme === 'synthwave' 
              ? '> ACCESS TOKENS PROVIDED BY SYSTEM ADMIN'
              : 'Access tokens are provided by your administrator. If you don\'t have one, please contact support.'}
          </p>
        </motion.div>

        {/* Back to Home Link */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Link
            href="/"
            className={cn(
              "inline-flex items-center gap-2 text-sm transition-colors",
              theme === 'synthwave' 
                ? "text-neon-cyan hover:text-neon-pink font-mono"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <Home className="w-4 h-4" />
            {theme === 'synthwave' ? '[RETURN HOME]' : 'Back to Home'}
          </Link>
        </motion.div>

        {/* Premium Glass Effects */}
        {theme !== 'synthwave' && (
          <>
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

            <div
              className="absolute inset-0 rounded-xl pointer-events-none opacity-5"
              style={{
                background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                backgroundSize: '200% 200%',
                animation: 'shimmer 3s ease-in-out infinite',
              }}
            />
          </>
        )}
      </GlassCard>
    </motion.div>
  );
}

// Loading fallback for Suspense
function LoginLoading() {
  return (
    <div className="w-full max-w-md mx-auto">
      <GlassCard variant="prominent" className="p-8">
        <div className="animate-pulse">
          <div className="h-16 w-16 bg-white/10 rounded-full mx-auto mb-4" />
          <div className="h-8 w-48 bg-white/10 rounded mx-auto mb-2" />
          <div className="h-4 w-64 bg-white/10 rounded mx-auto mb-8" />
          <div className="h-12 w-full bg-white/10 rounded mb-4" />
          <div className="h-12 w-full bg-white/10 rounded" />
        </div>
      </GlassCard>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}