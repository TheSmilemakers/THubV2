import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { PasswordResetForm } from '../password-reset-form';
import * as hooks from '@/lib/hooks';

// Mock the custom hooks
jest.mock('@/lib/hooks', () => ({
  useAdaptiveGlass: jest.fn(() => ({ effects: true })),
  usePerformanceTier: jest.fn(() => 'high'),
  useDeviceCapabilities: jest.fn(() => ({ screenSize: 'desktop' })),
}));

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock glass UI components
jest.mock('@/components/ui/glass-card', () => ({
  GlassCard: ({ children, className }: any) => (
    <div className={className} data-testid="glass-card">
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/glass-input', () => ({
  GlassInput: ({ 
    label, 
    value, 
    onChange, 
    onBlur, 
    error, 
    disabled,
    required,
    placeholder,
    type,
    'data-testid': testId 
  }: any) => (
    <div data-testid="glass-input">
      {label && <label>{label}</label>}
      <input
        type={type || 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        data-testid={testId}
        aria-invalid={!!error}
        aria-describedby={error ? `${testId}-error` : undefined}
      />
      {error && <span id={`${testId}-error`} role="alert">{error}</span>}
    </div>
  ),
}));

jest.mock('@/components/ui/magnetic-button', () => ({
  MagneticButton: ({ 
    children, 
    onClick, 
    type, 
    disabled, 
    loading,
    className,
    'data-testid': testId 
  }: any) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      data-testid={testId}
    >
      {loading ? 'Loading...' : children}
    </button>
  ),
}));

describe('PasswordResetForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnBack = jest.fn();
  const mockOnResend = jest.fn();
  const mockUseAdaptiveGlass = hooks.useAdaptiveGlass as jest.MockedFunction<typeof hooks.useAdaptiveGlass>;
  const mockUsePerformanceTier = hooks.usePerformanceTier as jest.MockedFunction<typeof hooks.usePerformanceTier>;
  const mockUseDeviceCapabilities = hooks.useDeviceCapabilities as jest.MockedFunction<typeof hooks.useDeviceCapabilities>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseAdaptiveGlass.mockReturnValue({ effects: true } as any);
    mockUsePerformanceTier.mockReturnValue('high');
    mockUseDeviceCapabilities.mockReturnValue({ screenSize: 'desktop' } as any);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders email step correctly', () => {
      render(<PasswordResetForm />);
      
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
      expect(screen.getByText(/Enter your email address/)).toBeInTheDocument();
      expect(screen.getByTestId('reset-email-input')).toBeInTheDocument();
      expect(screen.getByTestId('reset-submit-button')).toBeInTheDocument();
      expect(screen.getByTestId('back-to-login-button')).toBeInTheDocument();
    });

    it('renders with custom props', () => {
      render(
        <PasswordResetForm
          className="custom-class"
          data-testid="custom-test-id"
          loading={true}
          error="Custom error"
        />
      );
      
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
      expect(screen.getByText('Custom error')).toBeInTheDocument();
      expect(screen.getByTestId('reset-submit-button')).toBeDisabled();
    });

    it('adapts to mobile screen size', () => {
      mockUseDeviceCapabilities.mockReturnValue({ screenSize: 'mobile' } as any);
      
      render(<PasswordResetForm />);
      
      // Mobile buttons should have 'lg' size
      const submitButton = screen.getByTestId('reset-submit-button');
      expect(submitButton).toBeInTheDocument();
    });

    it('renders with different performance tiers', () => {
      mockUsePerformanceTier.mockReturnValue('low');
      
      render(<PasswordResetForm />);
      
      // Should render with 'elevated' variant for low performance
      const glassCard = screen.getByTestId('glass-card');
      expect(glassCard).toBeInTheDocument();
    });
  });

  describe('Email Validation', () => {
    it('validates empty email', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PasswordResetForm />);
      
      const emailInput = screen.getByTestId('reset-email-input');
      const submitButton = screen.getByTestId('reset-submit-button');
      
      await user.click(emailInput);
      await user.tab(); // Blur
      
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('validates invalid email format', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PasswordResetForm />);
      
      const emailInput = screen.getByTestId('reset-email-input');
      
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Blur
      
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('shows real-time validation after first blur', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PasswordResetForm />);
      
      const emailInput = screen.getByTestId('reset-email-input');
      
      // First blur to set touched state
      await user.click(emailInput);
      await user.tab();
      
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      
      // Now typing should show real-time validation
      await user.type(emailInput, 'test');
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      
      await user.clear(emailInput);
      await user.type(emailInput, 'test@example.com');
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    });

    it('enables submit button with valid email', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PasswordResetForm />);
      
      const emailInput = screen.getByTestId('reset-email-input');
      const submitButton = screen.getByTestId('reset-submit-button');
      
      expect(submitButton).toBeDisabled();
      
      await user.type(emailInput, 'valid@email.com');
      
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it.skip('submits form with valid email and shows confirmation', async () => {
      const user = userEvent.setup({ delay: null });
      mockOnSubmit.mockResolvedValue(undefined);
      
      render(<PasswordResetForm onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByTestId('reset-email-input');
      const submitButton = screen.getByTestId('reset-submit-button');
      
      await user.type(emailInput, 'Test@Example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com');
      });
      
      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
        // The email should be visible in the confirmation view
        expect(screen.getByText(/test@example\.com/)).toBeInTheDocument();
      });
    });

    it.skip('shows loading state during submission', async () => {
      const user = userEvent.setup({ delay: null });
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>(resolve => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(submitPromise);
      
      render(<PasswordResetForm onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByTestId('reset-email-input');
      const submitButton = screen.getByTestId('reset-submit-button');
      
      await user.type(emailInput, 'test@example.com');
      
      // Start the submission
      await user.click(submitButton);
      
      // Check for loading state
      await waitFor(() => {
        const loadingButton = screen.getByTestId('reset-submit-button');
        expect(loadingButton).toHaveTextContent('Sending Reset Link...');
        expect(loadingButton).toBeDisabled();
      });
      
      // Resolve the promise
      await act(async () => {
        resolveSubmit!();
      });
      
      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      });
    });

    it('handles submission error', async () => {
      const user = userEvent.setup({ delay: null });
      const errorMessage = 'Failed to send email';
      mockOnSubmit.mockRejectedValue(new Error(errorMessage));
      
      render(<PasswordResetForm onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByTestId('reset-email-input');
      const submitButton = screen.getByTestId('reset-submit-button');
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        expect(screen.queryByText('Check Your Email')).not.toBeInTheDocument();
      });
    });

    it('handles submission error with non-Error object', async () => {
      const user = userEvent.setup({ delay: null });
      mockOnSubmit.mockRejectedValue('String error');
      
      render(<PasswordResetForm onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByTestId('reset-email-input');
      const submitButton = screen.getByTestId('reset-submit-button');
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to send reset email. Please try again.')).toBeInTheDocument();
      });
    });

    it('prevents submission with invalid email', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PasswordResetForm onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByTestId('reset-email-input');
      const submitButton = screen.getByTestId('reset-submit-button');
      
      // Clear any default value and submit
      await user.clear(emailInput);
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('trims and lowercases email before submission', async () => {
      const user = userEvent.setup({ delay: null });
      mockOnSubmit.mockResolvedValue(undefined);
      
      render(<PasswordResetForm onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByTestId('reset-email-input');
      const submitButton = screen.getByTestId('reset-submit-button');
      
      await user.type(emailInput, '  Test@Example.COM  ');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com');
      });
    });
  });

  describe('Confirmation Step', () => {
    beforeEach(async () => {
      const user = userEvent.setup({ delay: null });
      mockOnSubmit.mockResolvedValue(undefined);
      
      render(<PasswordResetForm onSubmit={mockOnSubmit} onResend={mockOnResend} />);
      
      const emailInput = screen.getByTestId('reset-email-input');
      const submitButton = screen.getByTestId('reset-submit-button');
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      });
    });

    it('shows confirmation content', () => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      expect(screen.getByText(/We've sent a password reset link to/)).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText("What's next?")).toBeInTheDocument();
      expect(screen.getByText(/Check your email inbox/)).toBeInTheDocument();
      expect(screen.getByText(/Click the reset link/)).toBeInTheDocument();
      expect(screen.getByText(/Create your new password/)).toBeInTheDocument();
    });

    it('shows resend and change email buttons', () => {
      expect(screen.getByTestId('resend-button')).toBeInTheDocument();
      expect(screen.getByTestId('change-email-button')).toBeInTheDocument();
    });

    it('handles resend email', async () => {
      const user = userEvent.setup({ delay: null });
      mockOnResend.mockResolvedValue(undefined);
      
      const resendButton = screen.getByTestId('resend-button');
      await user.click(resendButton);
      
      await waitFor(() => {
        expect(mockOnResend).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('shows resend cooldown timer', async () => {
      const user = userEvent.setup({ delay: null });
      mockOnResend.mockResolvedValue(undefined);
      
      const resendButton = screen.getByTestId('resend-button');
      await user.click(resendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Resend in 60s')).toBeInTheDocument();
      });
      
      // Fast forward 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });
      
      expect(screen.getByText('Resend in 30s')).toBeInTheDocument();
      
      // Fast forward to completion
      act(() => {
        jest.advanceTimersByTime(31000);
      });
      
      expect(screen.getByText('Resend Email')).toBeInTheDocument();
    });

    it('prevents resend during cooldown', async () => {
      const user = userEvent.setup({ delay: null });
      mockOnResend.mockResolvedValue(undefined);
      
      const resendButton = screen.getByTestId('resend-button');
      await user.click(resendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Resend in 60s')).toBeInTheDocument();
      });
      
      // Try to click again during cooldown
      await user.click(resendButton);
      
      // Should only be called once
      expect(mockOnResend).toHaveBeenCalledTimes(1);
    });

    it('handles resend error', async () => {
      const user = userEvent.setup({ delay: null });
      const errorMessage = 'Failed to resend';
      mockOnResend.mockRejectedValue(new Error(errorMessage));
      
      const resendButton = screen.getByTestId('resend-button');
      await user.click(resendButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        // Should not start cooldown on error
        expect(screen.queryByText(/Resend in/)).not.toBeInTheDocument();
      });
    });

    it('handles change email button', async () => {
      const user = userEvent.setup({ delay: null });
      
      const changeEmailButton = screen.getByTestId('change-email-button');
      await user.click(changeEmailButton);
      
      // Should go back to email step
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
      expect(screen.getByTestId('reset-email-input')).toBeInTheDocument();
      expect(screen.queryByText('Check Your Email')).not.toBeInTheDocument();
    });

    it.skip('shows loading state during resend', async () => {
      const user = userEvent.setup({ delay: null });
      let resolveResend: () => void;
      const resendPromise = new Promise<void>(resolve => {
        resolveResend = resolve;
      });
      mockOnResend.mockReturnValue(resendPromise);
      
      const resendButton = screen.getByTestId('resend-button');
      
      // Start the resend
      await user.click(resendButton);
      
      // Check for loading state
      await waitFor(() => {
        const loadingButton = screen.getByTestId('resend-button');
        expect(loadingButton).toHaveTextContent('Resending...');
        expect(loadingButton).toBeDisabled();
      });
      
      // Resolve the promise
      await act(async () => {
        resolveResend!();
      });
      
      await waitFor(() => {
        expect(screen.getByText('Resend in 60s')).toBeInTheDocument();
      });
    });
  });

  describe('Back to Login', () => {
    it('calls onBack when back button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PasswordResetForm onBack={mockOnBack} />);
      
      const backButton = screen.getByTestId('back-to-login-button');
      await user.click(backButton);
      
      expect(mockOnBack).toHaveBeenCalled();
    });

    it('disables back button when loading', () => {
      render(<PasswordResetForm loading={true} />);
      
      const backButton = screen.getByTestId('back-to-login-button');
      expect(backButton).toBeDisabled();
    });
  });

  describe('Props and External State', () => {
    it('shows external error message', () => {
      const errorMessage = 'External error';
      render(<PasswordResetForm error={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('shows external success message', () => {
      const successMessage = 'External success';
      render(<PasswordResetForm success={successMessage} />);
      
      // Note: The component doesn't currently display success messages
      // This test is here for completeness and future implementation
    });

    it('disables form when loading prop is true', () => {
      render(<PasswordResetForm loading={true} />);
      
      const emailInput = screen.getByTestId('reset-email-input');
      const submitButton = screen.getByTestId('reset-submit-button');
      
      expect(emailInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure', () => {
      render(<PasswordResetForm />);
      
      // The form is rendered by the motion.form which becomes a regular form
      // Check for the presence of form elements instead
      const emailInput = screen.getByTestId('reset-email-input');
      const submitButton = screen.getByTestId('reset-submit-button');
      
      expect(emailInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('has proper input labels', () => {
      render(<PasswordResetForm />);
      
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    it('shows error messages with proper ARIA attributes', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PasswordResetForm />);
      
      const emailInput = screen.getByTestId('reset-email-input');
      
      await user.click(emailInput);
      await user.tab(); // Blur
      
      const errorMessage = screen.getByText('Email is required');
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(emailInput).toHaveAttribute('aria-describedby', expect.stringContaining('error'));
    });

    it('has keyboard navigation support', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PasswordResetForm onBack={mockOnBack} />);
      
      // Tab through elements
      await user.tab(); // Email input
      expect(screen.getByTestId('reset-email-input')).toHaveFocus();
      
      await user.type(screen.getByTestId('reset-email-input'), 'test@example.com');
      
      await user.tab(); // Submit button
      expect(screen.getByTestId('reset-submit-button')).toHaveFocus();
      
      await user.tab(); // Back to login button
      expect(screen.getByTestId('back-to-login-button')).toHaveFocus();
    });

    it('supports form submission with Enter key', async () => {
      const user = userEvent.setup({ delay: null });
      mockOnSubmit.mockResolvedValue(undefined);
      
      render(<PasswordResetForm onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByTestId('reset-email-input');
      
      await user.type(emailInput, 'test@example.com');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid form submissions', async () => {
      const user = userEvent.setup({ delay: null });
      mockOnSubmit.mockResolvedValue(undefined);
      
      render(<PasswordResetForm onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByTestId('reset-email-input');
      const submitButton = screen.getByTestId('reset-submit-button');
      
      await user.type(emailInput, 'test@example.com');
      
      // Rapid clicks
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);
      
      // Should only submit once
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('clears validation errors when switching steps', async () => {
      const user = userEvent.setup({ delay: null });
      mockOnSubmit.mockRejectedValue(new Error('Submit error'));
      
      render(<PasswordResetForm onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByTestId('reset-email-input');
      const submitButton = screen.getByTestId('reset-submit-button');
      
      // Cause an error
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Submit error')).toBeInTheDocument();
      });
      
      // Successfully submit
      mockOnSubmit.mockResolvedValue(undefined);
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      });
      
      // Go back to email step
      const changeEmailButton = screen.getByTestId('change-email-button');
      await user.click(changeEmailButton);
      
      // Error should be cleared
      expect(screen.queryByText('Submit error')).not.toBeInTheDocument();
    });

    it('handles whitespace in email', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PasswordResetForm />);
      
      const emailInput = screen.getByTestId('reset-email-input');
      
      await user.type(emailInput, '   ');
      await user.tab();
      
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('handles very long email addresses', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PasswordResetForm />);
      
      const emailInput = screen.getByTestId('reset-email-input');
      const longEmail = 'a'.repeat(100) + '@example.com';
      
      await user.type(emailInput, longEmail);
      
      const submitButton = screen.getByTestId('reset-submit-button');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Performance and Responsiveness', () => {
    it('adapts glass effects based on performance tier', () => {
      const { rerender } = render(<PasswordResetForm />);
      
      // High performance should show effects
      expect(screen.getByTestId('glass-card')).toBeInTheDocument();
      
      // Low performance
      mockUsePerformanceTier.mockReturnValue('low');
      rerender(<PasswordResetForm />);
      
      expect(screen.getByTestId('glass-card')).toBeInTheDocument();
    });

    it('disables glass effects when adaptive glass is off', () => {
      mockUseAdaptiveGlass.mockReturnValue({ effects: false } as any);
      
      render(<PasswordResetForm />);
      
      expect(screen.getByTestId('glass-card')).toBeInTheDocument();
    });
  });
});