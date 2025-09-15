import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../login-form';
import { render } from '@/test-utils/render';

// Mock the hooks
jest.mock('@/lib/hooks', () => ({
  useAdaptiveGlass: () => ({ effects: true, animations: 'full' }),
  usePerformanceTier: () => 'high',
  useDeviceCapabilities: () => ({ screenSize: 'desktop' }),
}));

describe('LoginForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnForgotPassword = jest.fn();
  const mockOnSignUp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders login form with all elements', () => {
      render(
        <LoginForm
          onSubmit={mockOnSubmit}
          onForgotPassword={mockOnForgotPassword}
          onSignUp={mockOnSignUp}
        />
      );

      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
      expect(screen.getByText(/sign in to access your trading signals/i)).toBeInTheDocument();
      expect(screen.getByTestId('login-email-input')).toBeInTheDocument();
      expect(screen.getByTestId('login-password-input')).toBeInTheDocument();
      expect(screen.getByTestId('forgot-password-link')).toBeInTheDocument();
      expect(screen.getByTestId('login-submit-button')).toBeInTheDocument();
      expect(screen.getByTestId('sign-up-link')).toBeInTheDocument();
    });

    it('displays error message when provided', () => {
      const errorMessage = 'Invalid credentials';
      render(
        <LoginForm
          onSubmit={mockOnSubmit}
          error={errorMessage}
        />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toHaveClass('text-status-error');
    });

    it('displays success message when provided', () => {
      const successMessage = 'Login successful!';
      render(
        <LoginForm
          onSubmit={mockOnSubmit}
          success={successMessage}
        />
      );

      expect(screen.getByText(successMessage)).toBeInTheDocument();
      expect(screen.getByText(successMessage)).toHaveClass('text-status-success');
    });

    it('disables form elements when loading', () => {
      render(
        <LoginForm
          onSubmit={mockOnSubmit}
          loading={true}
        />
      );

      expect(screen.getByTestId('login-email-input')).toBeDisabled();
      expect(screen.getByTestId('login-password-input')).toBeDisabled();
      expect(screen.getByTestId('login-submit-button')).toBeDisabled();
      // When loading, the MagneticButton shows a spinner, not text
      const button = screen.getByTestId('login-submit-button');
      // Check that the button contains a spinner (animated div with border)
      const spinner = button.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('validates email format', async () => {
      const user = userEvent.setup();
      render(<LoginForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByTestId('login-email-input');

      // Test empty email
      await user.click(emailInput);
      await user.tab();
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      // Test invalid email
      await user.type(emailInput, 'invalid-email');
      await user.tab();
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      // Test valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'user@example.com');
      await user.tab();
      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });

    it('validates password requirements', async () => {
      const user = userEvent.setup();
      render(<LoginForm onSubmit={mockOnSubmit} />);

      const passwordInput = screen.getByTestId('login-password-input');

      // Test empty password
      await user.click(passwordInput);
      await user.tab();
      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      // Test short password
      await user.type(passwordInput, 'short');
      await user.tab();
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      // Test valid password
      await user.clear(passwordInput);
      await user.type(passwordInput, 'validpassword123');
      await user.tab();
      await waitFor(() => {
        expect(screen.queryByText(/password is required/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/password must be at least 8 characters/i)).not.toBeInTheDocument();
      });
    });

    it('disables submit button when form is invalid', async () => {
      const user = userEvent.setup();
      render(<LoginForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByTestId('login-submit-button');
      expect(submitButton).toBeDisabled();

      // Fill valid email
      await user.type(screen.getByTestId('login-email-input'), 'user@example.com');
      expect(submitButton).toBeDisabled();

      // Fill valid password
      await user.type(screen.getByTestId('login-password-input'), 'validpassword123');
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with valid credentials', async () => {
      const user = userEvent.setup();
      const credentials = {
        email: 'user@example.com',
        password: 'validpassword123',
      };

      render(<LoginForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByTestId('login-email-input'), credentials.email);
      await user.type(screen.getByTestId('login-password-input'), credentials.password);
      
      const submitButton = screen.getByTestId('login-submit-button');
      await waitFor(() => expect(submitButton).toBeEnabled());
      
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(credentials);
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });
    });

    it('shows validation errors on submit with invalid form', async () => {
      const user = userEvent.setup();
      render(<LoginForm onSubmit={mockOnSubmit} />);

      // First, type something and clear to enable the submit button logic
      const emailInput = screen.getByTestId('login-email-input');
      const passwordInput = screen.getByTestId('login-password-input');
      
      // Type and clear to trigger validation
      await user.type(emailInput, 'test');
      await user.clear(emailInput);
      await user.type(passwordInput, 'test');
      await user.clear(passwordInput);
      
      // Now try to submit
      const form = screen.getByRole('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('handles submission errors gracefully', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid credentials';
      
      mockOnSubmit.mockRejectedValueOnce(new Error(errorMessage));

      render(<LoginForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByTestId('login-email-input'), 'user@example.com');
      await user.type(screen.getByTestId('login-password-input'), 'validpassword123');
      
      const submitButton = screen.getByTestId('login-submit-button');
      await waitFor(() => expect(submitButton).toBeEnabled());
      
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('prevents multiple submissions', async () => {
      const user = userEvent.setup();
      
      // Mock a slow submission
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<LoginForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByTestId('login-email-input'), 'user@example.com');
      await user.type(screen.getByTestId('login-password-input'), 'validpassword123');
      
      const submitButton = screen.getByTestId('login-submit-button');
      await waitFor(() => expect(submitButton).toBeEnabled());
      
      // Click multiple times
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation Links', () => {
    it('calls onForgotPassword when forgot password link is clicked', async () => {
      const user = userEvent.setup();
      render(
        <LoginForm
          onSubmit={mockOnSubmit}
          onForgotPassword={mockOnForgotPassword}
        />
      );

      await user.click(screen.getByTestId('forgot-password-link'));
      expect(mockOnForgotPassword).toHaveBeenCalledTimes(1);
    });

    it('calls onSignUp when sign up link is clicked', async () => {
      const user = userEvent.setup();
      render(
        <LoginForm
          onSubmit={mockOnSubmit}
          onSignUp={mockOnSignUp}
        />
      );

      await user.click(screen.getByTestId('sign-up-link'));
      expect(mockOnSignUp).toHaveBeenCalledTimes(1);
    });

    it('disables navigation links when loading', () => {
      render(
        <LoginForm
          onSubmit={mockOnSubmit}
          onForgotPassword={mockOnForgotPassword}
          onSignUp={mockOnSignUp}
          loading={true}
        />
      );

      expect(screen.getByTestId('forgot-password-link')).toBeDisabled();
      expect(screen.getByTestId('sign-up-link')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<LoginForm onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('form', { name: /login form/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<LoginForm onSubmit={mockOnSubmit} />);

      // Fill in valid form data so submit button is enabled
      const emailInput = screen.getByTestId('login-email-input');
      const passwordInput = screen.getByTestId('login-password-input');
      
      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'validpassword123');

      // Click somewhere else to clear focus
      const heading = screen.getByRole('heading', { name: /welcome back/i });
      await user.click(heading);

      // Tab through form elements from the beginning
      await user.tab();
      expect(screen.getByTestId('login-email-input')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('login-password-input')).toHaveFocus();

      // The password input has a show/hide button, so tab to it
      await user.tab();
      expect(screen.getByLabelText(/show password/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('forgot-password-link')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('login-submit-button')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('sign-up-link')).toHaveFocus();
    });

    it('shows validation errors for screen readers', async () => {
      const user = userEvent.setup();
      render(<LoginForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByTestId('login-email-input');
      
      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Behavior', () => {
    beforeEach(() => {
      (require('@/lib/hooks') as any).useDeviceCapabilities = () => ({ screenSize: 'mobile' });
    });

    it('adjusts button size for mobile', () => {
      render(<LoginForm onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByTestId('login-submit-button');
      // Check for lg size class
      expect(submitButton).toHaveClass('touch-target');
    });
  });
});