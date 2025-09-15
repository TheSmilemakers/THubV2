/**
 * Authentication Components
 * 
 * Premium glassmorphism authentication UI components for THub V2
 * Features: Mobile-first design, accessibility compliance, performance optimization
 */

// Main Forms
export { LoginForm } from './login-form';
export type { LoginFormProps } from './login-form';

export { RegisterForm } from './register-form';
export type { RegisterFormProps } from './register-form';

export { PasswordResetForm } from './password-reset-form';
export type { PasswordResetFormProps } from './password-reset-form';

// Pages
export { EmailVerificationPage } from './email-verification-page';
export type { EmailVerificationPageProps } from './email-verification-page';

// Social Authentication
export { SocialLoginButtons } from './social-login-buttons';
export type { SocialLoginButtonsProps, OAuthProvider } from './social-login-buttons';

// Error Handling
export { AuthErrorStates } from './auth-error-states';
export type { AuthErrorStatesProps, AuthErrorType } from './auth-error-states';

/**
 * Authentication Component Collection
 * 
 * Complete authentication UI system with:
 * - LoginForm: Premium login with real-time validation
 * - RegisterForm: Registration with password strength indicator
 * - PasswordResetForm: Two-step password reset flow
 * - EmailVerificationPage: Auto-refresh verification status
 * - SocialLoginButtons: OAuth provider integration
 * - AuthErrorStates: Comprehensive error handling
 * 
 * All components feature:
 * - Glassmorphism design with adaptive effects
 * - Mobile-first responsive layout
 * - 60fps performance targeting
 * - Accessibility compliance (WCAG 2.1)
 * - TypeScript strict mode
 * - Comprehensive error handling
 * - Touch-optimized interactions
 */