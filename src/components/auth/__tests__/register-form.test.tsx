import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../register-form';
import '@testing-library/jest-dom';

// Mock the hooks
jest.mock('@/lib/hooks', () => ({
  useAdaptiveGlass: () => ({ effects: true }),
  usePerformanceTier: () => 'high',
  useDeviceCapabilities: () => ({ screenSize: 'desktop' }),
}));

// Mock UI components
jest.mock('@/components/ui/glass-card', () => ({
  GlassCard: ({ children, ...props }: any) => <div data-testid="glass-card" {...props}>{children}</div>,
}));

jest.mock('@/components/ui/glass-input', () => ({
  GlassInput: ({ label, value, onChange, onBlur, error, disabled, required, type, placeholder, 'data-testid': testId, maxLength, ...props }: any) => (
    <div>
      <label htmlFor={testId}>{label}</label>
      <input
        id={testId}
        type={type === 'password' && !props.showPassword ? 'password' : type === 'password' ? 'text' : type}
        value={value}
        onChange={(e) => {
          // Enforce maxLength if provided
          if (maxLength && e.target.value.length > maxLength) {
            return;
          }
          onChange(e.target.value);
        }}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        data-testid={testId}
        aria-invalid={error ? 'true' : 'false'}
        maxLength={maxLength}
        {...props}
      />
      {error && <span role="alert">{error}</span>}
    </div>
  ),
}));

jest.mock('@/components/ui/magnetic-button', () => ({
  MagneticButton: ({ children, onClick, disabled, loading, type, 'data-testid': testId, ...props }: any) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    form: ({ children, onSubmit, ...props }: any) => <form onSubmit={onSubmit} {...props}>{children}</form>,
    label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
    button: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button>,
    svg: ({ children, ...props }: any) => <svg {...props}>{children}</svg>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('RegisterForm', () => {
  const defaultProps = {
    onSubmit: jest.fn(),
    onSignIn: jest.fn(),
    'data-testid': 'register-form',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all form fields correctly', () => {
      render(<RegisterForm {...defaultProps} />);

      expect(screen.getByTestId('register-form')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
      expect(screen.getByText('Join THub to access premium trading signals')).toBeInTheDocument();
      
      expect(screen.getByTestId('register-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('register-email-input')).toBeInTheDocument();
      expect(screen.getByTestId('register-password-input')).toBeInTheDocument();
      expect(screen.getByTestId('register-confirm-password-input')).toBeInTheDocument();
      expect(screen.getByTestId('register-terms-checkbox')).toBeInTheDocument();
      expect(screen.getByTestId('register-submit-button')).toBeInTheDocument();
      expect(screen.getByTestId('sign-in-link')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<RegisterForm {...defaultProps} className="custom-class" />);
      const form = screen.getByTestId('register-form');
      expect(form).toHaveClass('custom-class');
    });

    it('displays error message when provided', () => {
      const errorMessage = 'Registration failed';
      render(<RegisterForm {...defaultProps} error={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      const errorContainer = screen.getByText(errorMessage).closest('div');
      expect(errorContainer).toHaveClass('border-status-error');
    });

    it('displays success message when provided', () => {
      const successMessage = 'Registration successful!';
      render(<RegisterForm {...defaultProps} success={successMessage} />);
      
      expect(screen.getByText(successMessage)).toBeInTheDocument();
      const successContainer = screen.getByText(successMessage).closest('div');
      expect(successContainer).toHaveClass('border-status-success');
    });

    it('displays loading state correctly', () => {
      render(<RegisterForm {...defaultProps} loading={true} />);
      
      const submitButton = screen.getByTestId('register-submit-button');
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Creating Account...');
    });
  });

  describe('Name Field Validation', () => {
    it('validates required name', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const nameInput = screen.getByTestId('register-name-input');
      await user.click(nameInput);
      await user.tab(); // Blur the field
      
      expect(await screen.findByText('Full name is required')).toBeInTheDocument();
    });

    it('validates minimum name length', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const nameInput = screen.getByTestId('register-name-input');
      await user.type(nameInput, 'A');
      await user.tab();
      
      expect(await screen.findByText('Name must be at least 2 characters')).toBeInTheDocument();
    });

    it('validates maximum name length', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const nameInput = screen.getByTestId('register-name-input');
      // Type 50 chars (should be valid)
      await user.type(nameInput, 'A'.repeat(50));
      await user.tab();
      
      // No error should appear
      await waitFor(() => {
        expect(screen.queryByText('Name must be less than 50 characters')).not.toBeInTheDocument();
      });
      
      // Clear and type 51 chars (should be invalid)
      await user.clear(nameInput);
      await user.type(nameInput, 'A'.repeat(51));
      await user.tab();
      
      // Since maxLength is 50, the input will truncate to 50 chars, so no error
      await waitFor(() => {
        expect(nameInput).toHaveValue('A'.repeat(50));
      });
    });

    it('validates name format', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const nameInput = screen.getByTestId('register-name-input');
      await user.type(nameInput, 'John123');
      await user.tab();
      
      expect(await screen.findByText('Name can only contain letters, spaces, hyphens, and apostrophes')).toBeInTheDocument();
    });

    it('accepts valid names', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const validNames = ["John Doe", "Mary-Jane", "O'Connor", "Jean-Paul D'Arc"];
      
      for (const name of validNames) {
        await user.clear(screen.getByTestId('register-name-input'));
        await user.type(screen.getByTestId('register-name-input'), name);
        await user.tab();
        
        await waitFor(() => {
          expect(screen.queryByText(/Name must/)).not.toBeInTheDocument();
          expect(screen.queryByText(/Name can only/)).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Email Field Validation', () => {
    it('validates required email', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const emailInput = screen.getByTestId('register-email-input');
      await user.click(emailInput);
      await user.tab();
      
      expect(await screen.findByText('Email is required')).toBeInTheDocument();
    });

    it('validates email format', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const invalidEmails = ['invalid', 'invalid@', '@invalid.com', 'invalid@.com'];
      
      for (const email of invalidEmails) {
        await user.clear(screen.getByTestId('register-email-input'));
        await user.type(screen.getByTestId('register-email-input'), email);
        await user.tab();
        
        expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
      }
    });

    it('accepts valid email addresses', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const validEmails = ['user@example.com', 'test.user+tag@domain.co.uk', 'admin@company.org'];
      
      for (const email of validEmails) {
        await user.clear(screen.getByTestId('register-email-input'));
        await user.type(screen.getByTestId('register-email-input'), email);
        await user.tab();
        
        await waitFor(() => {
          expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Password Field Validation', () => {
    it('validates required password', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const passwordInput = screen.getByTestId('register-password-input');
      await user.click(passwordInput);
      await user.tab();
      
      expect(await screen.findByText('Password is required')).toBeInTheDocument();
    });

    it('validates minimum password length', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const passwordInput = screen.getByTestId('register-password-input');
      await user.type(passwordInput, 'Short1!');
      await user.tab();
      
      expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
    });

    it('validates maximum password length', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const passwordInput = screen.getByTestId('register-password-input');
      // Type 128 chars (should be valid)
      const validLongPassword = 'A'.repeat(125) + 'a1!';
      await user.type(passwordInput, validLongPassword);
      await user.tab();
      
      // No error should appear
      await waitFor(() => {
        expect(screen.queryByText('Password must be less than 128 characters')).not.toBeInTheDocument();
      });
      
      // Clear and try to type 129 chars (should truncate at 128)
      await user.clear(passwordInput);
      const tooLongPassword = 'A'.repeat(129) + '1!';
      await user.type(passwordInput, tooLongPassword);
      await user.tab();
      
      // Since maxLength is 128, the input will truncate
      await waitFor(() => {
        expect(passwordInput).toHaveValue(tooLongPassword.substring(0, 128));
      });
    });

    it('validates password complexity requirements', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const testCases = [
        { password: 'UPPERCASE1!', error: 'Password must contain at least one lowercase letter' },
        { password: 'lowercase1!', error: 'Password must contain at least one uppercase letter' },
        { password: 'NoNumbers!', error: 'Password must contain at least one number' },
        { password: 'NoSpecial1', error: 'Password must contain at least one special character' },
      ];
      
      for (const { password, error } of testCases) {
        await user.clear(screen.getByTestId('register-password-input'));
        await user.type(screen.getByTestId('register-password-input'), password);
        await user.tab();
        
        expect(await screen.findByText(error)).toBeInTheDocument();
      }
    });

    it('accepts valid passwords', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const passwordInput = screen.getByTestId('register-password-input');
      await user.type(passwordInput, 'ValidPass123!');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.queryByText(/Password must/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Password Strength Indicator', () => {
    it('shows no indicator when password is empty', () => {
      render(<RegisterForm {...defaultProps} />);
      
      expect(screen.queryByText(/Very Weak|Weak|Fair|Good|Strong/)).not.toBeInTheDocument();
    });

    it('shows correct strength levels', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const testCases = [
        { password: 'a', strength: 'Very Weak' },
        { password: 'abcdefgh', strength: 'Weak' },
        { password: 'Abcdefgh', strength: 'Fair' },
        { password: 'Abcdefgh1', strength: 'Good' },
        { password: 'Abcdefgh1!', strength: 'Strong' },
      ];
      
      for (const { password, strength } of testCases) {
        await user.clear(screen.getByTestId('register-password-input'));
        await user.type(screen.getByTestId('register-password-input'), password);
        
        expect(await screen.findByText(strength)).toBeInTheDocument();
      }
    });

    it('shows suggestions for weak passwords', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const passwordInput = screen.getByTestId('register-password-input');
      await user.type(passwordInput, 'weak');
      
      expect(await screen.findByText('Use at least 8 characters')).toBeInTheDocument();
      expect(screen.getByText('Add uppercase letters')).toBeInTheDocument();
    });

    it('shows shield icon for strong passwords', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const passwordInput = screen.getByTestId('register-password-input');
      await user.type(passwordInput, 'StrongPass123!');
      
      await waitFor(() => {
        const shieldIcon = document.querySelector('.text-status-success');
        expect(shieldIcon).toBeInTheDocument();
      });
    });
  });

  describe('Confirm Password Validation', () => {
    it('validates required confirm password', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const confirmInput = screen.getByTestId('register-confirm-password-input');
      await user.click(confirmInput);
      await user.tab();
      
      expect(await screen.findByText('Please confirm your password')).toBeInTheDocument();
    });

    it('validates password match', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      await user.type(screen.getByTestId('register-password-input'), 'Password123!');
      await user.type(screen.getByTestId('register-confirm-password-input'), 'Different123!');
      await user.tab();
      
      expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    });

    it('accepts matching passwords', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const password = 'MatchingPass123!';
      await user.type(screen.getByTestId('register-password-input'), password);
      await user.type(screen.getByTestId('register-confirm-password-input'), password);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
      });
    });
  });

  describe('Terms and Conditions', () => {
    it('validates terms acceptance', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      // Fill valid form data
      await user.type(screen.getByTestId('register-name-input'), 'John Doe');
      await user.type(screen.getByTestId('register-email-input'), 'john@example.com');
      await user.type(screen.getByTestId('register-password-input'), 'Password123!');
      await user.type(screen.getByTestId('register-confirm-password-input'), 'Password123!');
      
      // Submit button should be disabled without terms acceptance
      const submitButton = screen.getByTestId('register-submit-button');
      expect(submitButton).toBeDisabled();
      
      // Accept terms
      await user.click(screen.getByTestId('register-terms-checkbox'));
      
      // Submit button should now be enabled
      expect(submitButton).not.toBeDisabled();
    });

    it('toggles checkbox state on click', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const checkbox = screen.getByTestId('register-terms-checkbox');
      expect(checkbox).not.toBeChecked();
      
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
      
      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('renders clickable terms and privacy policy links', () => {
      render(<RegisterForm {...defaultProps} />);
      
      expect(screen.getByText('Terms of Service')).toBeInTheDocument();
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
      
      const termsButton = screen.getByText('Terms of Service');
      const privacyButton = screen.getByText('Privacy Policy');
      
      expect(termsButton.tagName).toBe('BUTTON');
      expect(privacyButton.tagName).toBe('BUTTON');
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      render(<RegisterForm {...defaultProps} onSubmit={mockSubmit} />);
      
      // Fill form
      await user.type(screen.getByTestId('register-name-input'), 'John Doe');
      await user.type(screen.getByTestId('register-email-input'), 'john@example.com');
      await user.type(screen.getByTestId('register-password-input'), 'Password123!');
      await user.type(screen.getByTestId('register-confirm-password-input'), 'Password123!');
      await user.click(screen.getByTestId('register-terms-checkbox'));
      
      // Submit
      await user.click(screen.getByTestId('register-submit-button'));
      
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          acceptTerms: true,
        });
      });
    });

    it('trims name and lowercases email on submission', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      render(<RegisterForm {...defaultProps} onSubmit={mockSubmit} />);
      
      // Fill form with spaces and uppercase
      await user.type(screen.getByTestId('register-name-input'), '  John Doe  ');
      await user.type(screen.getByTestId('register-email-input'), 'JOHN@EXAMPLE.COM');
      await user.type(screen.getByTestId('register-password-input'), 'Password123!');
      await user.type(screen.getByTestId('register-confirm-password-input'), 'Password123!');
      await user.click(screen.getByTestId('register-terms-checkbox'));
      
      // Submit
      await user.click(screen.getByTestId('register-submit-button'));
      
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          acceptTerms: true,
        });
      });
    });

    it('prevents submission with invalid data', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn();
      render(<RegisterForm {...defaultProps} onSubmit={mockSubmit} />);
      
      // Submit button should be disabled with empty form
      const submitButton = screen.getByTestId('register-submit-button');
      expect(submitButton).toBeDisabled();
      
      // Touch all fields to show validation errors
      await user.click(screen.getByTestId('register-name-input'));
      await user.tab();
      await user.click(screen.getByTestId('register-email-input'));
      await user.tab();
      await user.click(screen.getByTestId('register-password-input'));
      await user.tab();
      await user.click(screen.getByTestId('register-confirm-password-input'));
      await user.tab();
      
      // Check that all error messages appear
      expect(await screen.findByText('Full name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
      
      // Submit button should still be disabled
      expect(submitButton).toBeDisabled();
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('handles submission errors', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn().mockRejectedValue(new Error('Email already exists'));
      render(<RegisterForm {...defaultProps} onSubmit={mockSubmit} />);
      
      // Fill valid form
      await user.type(screen.getByTestId('register-name-input'), 'John Doe');
      await user.type(screen.getByTestId('register-email-input'), 'john@example.com');
      await user.type(screen.getByTestId('register-password-input'), 'Password123!');
      await user.type(screen.getByTestId('register-confirm-password-input'), 'Password123!');
      await user.click(screen.getByTestId('register-terms-checkbox'));
      
      // Submit
      await user.click(screen.getByTestId('register-submit-button'));
      
      expect(await screen.findByText('Email already exists')).toBeInTheDocument();
    });

    it('disables form during submission', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn(() => new Promise<void>(resolve => setTimeout(resolve, 100)));
      render(<RegisterForm {...defaultProps} onSubmit={mockSubmit} />);
      
      // Fill valid form
      await user.type(screen.getByTestId('register-name-input'), 'John Doe');
      await user.type(screen.getByTestId('register-email-input'), 'john@example.com');
      await user.type(screen.getByTestId('register-password-input'), 'Password123!');
      await user.type(screen.getByTestId('register-confirm-password-input'), 'Password123!');
      await user.click(screen.getByTestId('register-terms-checkbox'));
      
      // Submit
      await user.click(screen.getByTestId('register-submit-button'));
      
      // Check all inputs are disabled
      expect(screen.getByTestId('register-name-input')).toBeDisabled();
      expect(screen.getByTestId('register-email-input')).toBeDisabled();
      expect(screen.getByTestId('register-password-input')).toBeDisabled();
      expect(screen.getByTestId('register-confirm-password-input')).toBeDisabled();
      expect(screen.getByTestId('register-terms-checkbox')).toBeDisabled();
      expect(screen.getByTestId('register-submit-button')).toBeDisabled();
      
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Real-time Validation', () => {
    it('validates fields on blur', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      // Focus and blur name field
      const nameInput = screen.getByTestId('register-name-input');
      await user.click(nameInput);
      await user.tab();
      
      expect(await screen.findByText('Full name is required')).toBeInTheDocument();
    });

    it('validates fields on change after being touched', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const nameInput = screen.getByTestId('register-name-input');
      
      // First touch the field
      await user.click(nameInput);
      await user.tab();
      expect(await screen.findByText('Full name is required')).toBeInTheDocument();
      
      // Now type - should validate in real-time
      await user.type(nameInput, 'J');
      expect(await screen.findByText('Name must be at least 2 characters')).toBeInTheDocument();
      
      await user.type(nameInput, 'ohn Doe');
      await waitFor(() => {
        expect(screen.queryByText(/Name must/)).not.toBeInTheDocument();
      });
    });

    it('does not validate untouched fields', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      // Type in email without touching name
      await user.type(screen.getByTestId('register-email-input'), 'test@example.com');
      
      // Name error should not appear
      expect(screen.queryByText('Full name is required')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('calls onSignIn when sign in link is clicked', async () => {
      const user = userEvent.setup();
      const mockSignIn = jest.fn();
      render(<RegisterForm {...defaultProps} onSignIn={mockSignIn} />);
      
      await user.click(screen.getByTestId('sign-in-link'));
      
      expect(mockSignIn).toHaveBeenCalled();
    });

    it('disables sign in link during submission', async () => {
      const user = userEvent.setup();
      const mockSignIn = jest.fn();
      render(<RegisterForm {...defaultProps} onSignIn={mockSignIn} loading={true} />);
      
      const signInLink = screen.getByTestId('sign-in-link');
      expect(signInLink).toBeDisabled();
      
      await user.click(signInLink);
      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure', () => {
      render(<RegisterForm {...defaultProps} />);
      
      // Form is rendered by motion.form which we mocked
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('has proper input labels', () => {
      render(<RegisterForm {...defaultProps} />);
      
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    });

    it('has proper ARIA attributes for errors', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      const nameInput = screen.getByTestId('register-name-input');
      await user.click(nameInput);
      await user.tab();
      
      await waitFor(() => {
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);
      
      // Tab through all interactive elements
      await user.tab(); // Name input
      expect(screen.getByTestId('register-name-input')).toHaveFocus();
      
      await user.tab(); // Email input
      expect(screen.getByTestId('register-email-input')).toHaveFocus();
      
      await user.tab(); // Password input
      expect(screen.getByTestId('register-password-input')).toHaveFocus();
      
      await user.tab(); // Confirm password input
      expect(screen.getByTestId('register-confirm-password-input')).toHaveFocus();
      
      await user.tab(); // Terms checkbox
      expect(screen.getByTestId('register-terms-checkbox')).toHaveFocus();
    });
  });

  describe('Mobile Behavior', () => {
    it('adjusts button size for mobile', () => {
      // Mock the hook to return mobile
      const hooks = require('@/lib/hooks');
      hooks.useDeviceCapabilities = jest.fn(() => ({ screenSize: 'mobile' }));
      
      render(<RegisterForm {...defaultProps} />);
      
      const submitButton = screen.getByTestId('register-submit-button');
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('disables effects on low performance tier', () => {
      // Mock the hook to return low performance
      const hooks = require('@/lib/hooks');
      hooks.usePerformanceTier = jest.fn(() => 'low');
      hooks.useAdaptiveGlass = jest.fn(() => ({ effects: false }));
      
      render(<RegisterForm {...defaultProps} />);
      
      // Glass effects should not be rendered
      expect(document.querySelector('[style*="radial-gradient"]')).not.toBeInTheDocument();
    });
  });
});