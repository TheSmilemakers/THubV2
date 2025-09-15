import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignalCard } from '../signal-card';
import { render } from '@/test-utils/render';
import { mockSignal, createMockSignals } from '@/test-utils/test-data';
import { Signal, UISignalStrength } from '@/types/signals.types';

// Mock the hooks
jest.mock('@/lib/hooks', () => ({
  useAdaptiveGlass: () => ({ effects: true, animations: 'full' }),
  usePerformanceTier: () => 'high',
  useDeviceCapabilities: () => ({ touch: false, screenSize: 'desktop' }),
  useGestureConfig: () => ({ longPressDelay: 500, swipeThreshold: 50 }),
}));

describe('SignalCard', () => {
  const mockOnTap = jest.fn();
  const mockOnLongPress = jest.fn();
  const mockOnSwipe = jest.fn();
  const mockOnScoreUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders signal card with all essential information', () => {
      render(
        <SignalCard
          signal={mockSignal}
          data-testid="signal-card"
        />
      );

      // Check symbol and basic info
      expect(screen.getByText(mockSignal.symbol)).toBeInTheDocument();
      
      // Check convergence score (appears in the main score display)
      const scoreElements = screen.getAllByText(mockSignal.convergence_score.toString());
      expect(scoreElements.length).toBeGreaterThan(0);
      
      // Check signal strength (should be 'buy' based on mock data)
      expect(screen.getByText(/buy/i)).toBeInTheDocument();
    });

    it('renders different variants correctly', () => {
      const variants: Array<'compact' | 'detailed' | 'minimal'> = ['compact', 'detailed', 'minimal'];
      
      variants.forEach((variant) => {
        const { rerender } = render(
          <SignalCard
            signal={mockSignal}
            variant={variant}
            data-testid={`signal-card-${variant}`}
          />
        );
        
        expect(screen.getByTestId(`signal-card-${variant}`)).toBeInTheDocument();
        
        if (variant === 'detailed') {
          // Detailed view should show more information
          expect(screen.getByText(mockSignal.symbol)).toBeInTheDocument();
          expect(screen.getAllByText(mockSignal.convergence_score.toString()).length).toBeGreaterThan(0);
        }
        
        rerender(<div />);
      });
    });

    it('shows convergence breakdown when enabled', () => {
      render(
        <SignalCard
          signal={mockSignal}
          showConvergenceBreakdown={true}
          data-testid="signal-card"
        />
      );

      // Check for layer scores
      expect(screen.getByText(/technical/i)).toBeInTheDocument();
      expect(screen.getByText(/sentiment/i)).toBeInTheDocument();
      expect(screen.getByText(/liquidity/i)).toBeInTheDocument();
      
      // Check individual scores (might appear multiple times)
      expect(screen.getAllByText(mockSignal.technical_score!.toString()).length).toBeGreaterThan(0);
      expect(screen.getAllByText(mockSignal.sentiment_score!.toString()).length).toBeGreaterThan(0);
      expect(screen.getAllByText(mockSignal.liquidity_score!.toString()).length).toBeGreaterThan(0);
    });

    it('hides convergence breakdown when disabled', () => {
      render(
        <SignalCard
          signal={mockSignal}
          showConvergenceBreakdown={false}
          data-testid="signal-card"
        />
      );

      expect(screen.queryByText(/technical/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/sentiment/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/liquidity/i)).not.toBeInTheDocument();
    });
  });

  describe('Score Zone Styling', () => {
    it('applies green zone styling for high scores (≥70)', () => {
      const highScoreSignal = { ...mockSignal, convergence_score: 85 };
      render(
        <SignalCard
          signal={highScoreSignal}
          data-testid="signal-card"
        />
      );

      const card = screen.getByTestId('signal-card');
      expect(card.querySelector('.text-status-success')).toBeInTheDocument();
    });

    it('applies yellow zone styling for medium scores (40-69)', () => {
      const mediumScoreSignal = { ...mockSignal, convergence_score: 55 };
      render(
        <SignalCard
          signal={mediumScoreSignal}
          data-testid="signal-card"
        />
      );

      const card = screen.getByTestId('signal-card');
      expect(card.querySelector('.text-status-warning')).toBeInTheDocument();
    });

    it('applies red zone styling for low scores (<40)', () => {
      const lowScoreSignal = { ...mockSignal, convergence_score: 25 };
      render(
        <SignalCard
          signal={lowScoreSignal}
          data-testid="signal-card"
        />
      );

      const card = screen.getByTestId('signal-card');
      expect(card.querySelector('.text-status-error')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('handles tap events when interactive (via touch)', async () => {
      render(
        <SignalCard
          signal={mockSignal}
          onTap={mockOnTap}
          interactive={true}
          data-testid="signal-card"
        />
      );

      const card = screen.getByTestId('signal-card');
      
      // Simulate touch events since the component uses touch handlers
      const touchStartEvent = new TouchEvent('touchstart', {
        bubbles: true,
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });
      
      const touchEndEvent = new TouchEvent('touchend', {
        bubbles: true,
        touches: [],
      });

      card.dispatchEvent(touchStartEvent);
      card.dispatchEvent(touchEndEvent);

      expect(mockOnTap).toHaveBeenCalledWith(mockSignal);
      expect(mockOnTap).toHaveBeenCalledTimes(1);
    });

    it('does not handle events when not interactive', () => {
      render(
        <SignalCard
          signal={mockSignal}
          onTap={mockOnTap}
          interactive={false}
          data-testid="signal-card"
        />
      );

      const card = screen.getByTestId('signal-card');
      
      // Try touch events on non-interactive card
      const touchStartEvent = new TouchEvent('touchstart', {
        bubbles: true,
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });
      
      const touchEndEvent = new TouchEvent('touchend', {
        bubbles: true,
        touches: [],
      });

      card.dispatchEvent(touchStartEvent);
      card.dispatchEvent(touchEndEvent);

      expect(mockOnTap).not.toHaveBeenCalled();
    });

    it('shows hover effects on desktop', async () => {
      const user = userEvent.setup();
      render(
        <SignalCard
          signal={mockSignal}
          interactive={true}
          data-testid="signal-card"
        />
      );

      const card = screen.getByTestId('signal-card');
      
      // Check that the component has hover capabilities
      expect(card).toHaveAttribute('whilehover');
      expect(card).toHaveClass('cursor-pointer');
    });
  });

  describe('Touch Gestures', () => {
    beforeEach(() => {
      (require('@/lib/hooks') as any).useDeviceCapabilities = () => ({ 
        touch: true, 
        screenSize: 'mobile' 
      });
    });

    it('handles long press on touch devices', async () => {
      jest.useFakeTimers();
      
      render(
        <SignalCard
          signal={mockSignal}
          onLongPress={mockOnLongPress}
          interactive={true}
          data-testid="signal-card"
        />
      );

      const card = screen.getByTestId('signal-card');
      
      // Simulate touch start
      const touchStartEvent = new TouchEvent('touchstart', {
        bubbles: true,
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });
      card.dispatchEvent(touchStartEvent);

      // Fast forward time to trigger long press
      jest.advanceTimersByTime(500);

      expect(mockOnLongPress).toHaveBeenCalledWith(mockSignal);
      
      jest.useRealTimers();
    });

    it('cancels long press if touch moves', async () => {
      jest.useFakeTimers();
      
      render(
        <SignalCard
          signal={mockSignal}
          onLongPress={mockOnLongPress}
          interactive={true}
          data-testid="signal-card"
        />
      );

      const card = screen.getByTestId('signal-card');
      
      // Simulate touch start
      const touchStartEvent = new TouchEvent('touchstart', {
        bubbles: true,
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });
      card.dispatchEvent(touchStartEvent);

      // Simulate touch move
      const touchMoveEvent = new TouchEvent('touchmove', {
        bubbles: true,
        touches: [{ clientX: 150, clientY: 150 } as Touch],
      });
      card.dispatchEvent(touchMoveEvent);

      // Fast forward time
      jest.advanceTimersByTime(500);

      expect(mockOnLongPress).not.toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });

  describe('Signal Priority', () => {
    it('renders different signal types with correct priority', () => {
      const signalTypes: UISignalStrength[] = ['strong_buy', 'buy', 'hold', 'sell', 'strong_sell'];
      
      signalTypes.forEach((strength) => {
        const signal = { ...mockSignal, signal_strength: strength };
        const { rerender } = render(
          <SignalCard
            signal={signal}
            data-testid="signal-card"
          />
        );
        
        // Check that the signal strength is displayed (with underscores replaced by spaces)
        const strengthText = strength.replace('_', ' ');
        expect(screen.getByText(new RegExp(strengthText, 'i'))).toBeInTheDocument();
        
        rerender(<div />);
      });
    });
  });

  describe('Price Information', () => {
    it('displays price information when available', () => {
      render(
        <SignalCard
          signal={mockSignal}
          variant="detailed"
          data-testid="signal-card"
        />
      );

      // Check for price values (displayed with $ symbol)
      if (mockSignal.current_price) {
        expect(screen.getByText(`$${mockSignal.current_price.toFixed(2)}`)).toBeInTheDocument();
      }
      
      if (mockSignal.entry_price) {
        expect(screen.getByText(/entry/i)).toBeInTheDocument();
        // Check if entry price is displayed in the format "Entry: $189.50"
        expect(screen.getByText(new RegExp(`\\$${mockSignal.entry_price.toFixed(2)}`))).toBeInTheDocument();
      }
    });

    it('handles missing price information gracefully', () => {
      const signalWithoutPrices = {
        ...mockSignal,
        current_price: null,
        entry_price: null,
        stop_loss: null,
        take_profit: null,
      };
      
      render(
        <SignalCard
          signal={signalWithoutPrices}
          variant="detailed"
          data-testid="signal-card"
        />
      );

      // Should still render without errors
      expect(screen.getByTestId('signal-card')).toBeInTheDocument();
      expect(screen.getByText(signalWithoutPrices.symbol)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <SignalCard
          signal={mockSignal}
          interactive={true}
          data-testid="signal-card"
        />
      );

      const card = screen.getByTestId('signal-card');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabindex', '0');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <SignalCard
          signal={mockSignal}
          onTap={mockOnTap}
          interactive={true}
          data-testid="signal-card"
        />
      );

      const card = screen.getByTestId('signal-card');
      
      // Tab to the card
      await user.tab();
      expect(card).toHaveFocus();
      
      // Check that it has proper accessibility attributes
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabindex', '0');
      expect(card).toHaveAttribute('aria-label');
    });
  });

  describe('Mobile Optimization', () => {
    beforeEach(() => {
      (require('@/lib/hooks') as any).useDeviceCapabilities = () => ({ 
        touch: true, 
        screenSize: 'mobile' 
      });
    });

    it('uses larger touch targets on mobile', () => {
      render(
        <SignalCard
          signal={mockSignal}
          interactive={true}
          data-testid="signal-card"
        />
      );

      const card = screen.getByTestId('signal-card');
      expect(card).toHaveClass('touch-target');
    });

    it('simplifies animations on lower performance devices', () => {
      (require('@/lib/hooks') as any).usePerformanceTier = () => 'low';
      
      render(
        <SignalCard
          signal={mockSignal}
          interactive={true}
          data-testid="signal-card"
        />
      );

      const card = screen.getByTestId('signal-card');
      // Low performance devices should have simpler animations
      expect(card).not.toHaveStyle({ willChange: 'transform' });
    });
  });
});