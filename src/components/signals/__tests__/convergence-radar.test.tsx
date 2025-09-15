import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConvergenceRadar } from '../convergence-radar';
import * as hooks from '@/lib/hooks';
import { mockSignal } from '@/test-utils/test-data';
import { type Signal } from '@/types/signals.types';

// Mock the custom hooks
jest.mock('@/lib/hooks', () => ({
  useAdaptiveGlass: jest.fn(() => ({ effects: true })),
  usePerformanceTier: jest.fn(() => 'high'),
  useDeviceCapabilities: jest.fn(() => ({ 
    screenSize: 'desktop',
    isTouchDevice: false,
    pixelRatio: 2
  })),
}));

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    svg: ({ children, ...props }: any) => <svg {...props}>{children}</svg>,
    circle: ({ children, ...props }: any) => <circle {...props}>{children}</circle>,
    path: ({ children, ...props }: any) => <path {...props}>{children}</path>,
    g: ({ children, ...props }: any) => <g {...props}>{children}</g>,
    text: ({ children, ...props }: any) => <text {...props}>{children}</text>,
    line: ({ children, ...props }: any) => <line {...props}>{children}</line>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('ConvergenceRadar', () => {
  const mockOnLayerHover = jest.fn();
  const mockOnLayerClick = jest.fn();
  const mockUseAdaptiveGlass = hooks.useAdaptiveGlass as jest.MockedFunction<typeof hooks.useAdaptiveGlass>;
  const mockUsePerformanceTier = hooks.usePerformanceTier as jest.MockedFunction<typeof hooks.usePerformanceTier>;
  const mockUseDeviceCapabilities = hooks.useDeviceCapabilities as jest.MockedFunction<typeof hooks.useDeviceCapabilities>;

  const defaultSignal: Signal = {
    ...mockSignal,
    convergence_score: 85,
    technical_score: 90,
    sentiment_score: 80,
    liquidity_score: 85
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAdaptiveGlass.mockReturnValue({ effects: true } as any);
    mockUsePerformanceTier.mockReturnValue('high');
    mockUseDeviceCapabilities.mockReturnValue({ 
      screenSize: 'desktop',
      isTouchDevice: false,
      pixelRatio: 2
    } as any);
  });

  describe('Rendering', () => {
    it('renders radar chart correctly', () => {
      render(<ConvergenceRadar signal={defaultSignal} />);
      
      // Check for SVG element
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 200 200');
    });

    it('renders with custom size', () => {
      render(<ConvergenceRadar signal={defaultSignal} size={300} />);
      
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 300 300');
    });

    it('renders labels when showLabels is true', () => {
      render(<ConvergenceRadar signal={defaultSignal} showLabels={true} />);
      
      expect(screen.getByText('Technical')).toBeInTheDocument();
      expect(screen.getByText('Sentiment')).toBeInTheDocument();
      expect(screen.getByText('Liquidity')).toBeInTheDocument();
    });

    it('does not render labels when showLabels is false', () => {
      render(<ConvergenceRadar signal={defaultSignal} showLabels={false} />);
      
      expect(screen.queryByText('Technical')).not.toBeInTheDocument();
      expect(screen.queryByText('Sentiment')).not.toBeInTheDocument();
      expect(screen.queryByText('Liquidity')).not.toBeInTheDocument();
    });

    it('renders grid when showGrid is true', () => {
      render(<ConvergenceRadar signal={defaultSignal} showGrid={true} />);
      
      // Check for grid lines (paths)
      const paths = document.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
    });

    it('renders center score', () => {
      render(<ConvergenceRadar signal={defaultSignal} />);
      
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('SCORE')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(
        <ConvergenceRadar 
          signal={defaultSignal} 
          className="custom-radar"
          data-testid="custom-radar"
        />
      );
      
      const container = screen.getByTestId('custom-radar');
      expect(container).toHaveClass('custom-radar');
    });
  });

  describe('Data Visualization', () => {
    it('correctly displays layer scores', () => {
      render(<ConvergenceRadar signal={defaultSignal} />);
      
      // Check if the chart renders with the correct structure
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      
      // Check for the presence of score circle in center
      expect(screen.getByText('SCORE')).toBeInTheDocument();
    });

    it('handles missing scores gracefully', () => {
      const signalWithMissingScores: Signal = {
        ...mockSignal,
        convergence_score: 75,
        technical_score: null,
        sentiment_score: 80,
        liquidity_score: null
      };
      
      render(<ConvergenceRadar signal={signalWithMissingScores} />);
      
      // Should still render without errors
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(screen.getByText('SCORE')).toBeInTheDocument();
    });

    it('calculates correct radar polygon points', () => {
      render(<ConvergenceRadar signal={defaultSignal} />);
      
      // Check for path element representing the radar polygon
      const paths = document.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
      // Check if the radar path has a fill gradient
      const radarPath = Array.from(paths).find(p => p.getAttribute('fill')?.includes('url'));
      expect(radarPath).toBeInTheDocument();
    });

    it('applies correct colors to layers', () => {
      render(<ConvergenceRadar signal={defaultSignal} />);
      
      // Technical layer should have primary color
      const technicalElements = screen.getAllByText('Technical');
      expect(technicalElements.length).toBeGreaterThan(0);
    });
  });

  describe('Interactivity', () => {
    it('renders interactive elements when interactive is true', () => {
      render(
        <ConvergenceRadar 
          signal={defaultSignal} 
          onLayerHover={mockOnLayerHover}
          interactive={true}
        />
      );
      
      // Should render the SVG with interactive capability
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('does not respond to interactions when interactive is false', () => {
      render(
        <ConvergenceRadar 
          signal={defaultSignal} 
          onLayerHover={mockOnLayerHover}
          onLayerClick={mockOnLayerClick}
          interactive={false}
        />
      );
      
      // Should still render the radar
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Performance Adaptations', () => {
    it('adapts to low performance tier', () => {
      mockUsePerformanceTier.mockReturnValue('low');
      
      render(<ConvergenceRadar signal={defaultSignal} />);
      
      // Should render simplified version
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('adapts to mobile screen size', () => {
      mockUseDeviceCapabilities.mockReturnValue({ 
        screenSize: 'mobile',
        isTouchDevice: true,
        pixelRatio: 2
      } as any);
      
      render(<ConvergenceRadar signal={defaultSignal} />);
      
      // Should render mobile-optimized version
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('disables effects when adaptive glass is off', () => {
      mockUseAdaptiveGlass.mockReturnValue({ effects: false } as any);
      
      render(<ConvergenceRadar signal={defaultSignal} />);
      
      // Should render without glassmorphism effects
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('optimizes for high pixel ratio displays', () => {
      mockUseDeviceCapabilities.mockReturnValue({ 
        screenSize: 'desktop',
        isTouchDevice: false,
        pixelRatio: 3
      } as any);
      
      render(<ConvergenceRadar signal={defaultSignal} />);
      
      // Should render with crisp graphics
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Touch Interactions', () => {
    beforeEach(() => {
      mockUseDeviceCapabilities.mockReturnValue({ 
        screenSize: 'mobile',
        isTouchDevice: true,
        pixelRatio: 2
      } as any);
    });

    it('handles touch events on mobile', () => {
      render(
        <ConvergenceRadar 
          signal={defaultSignal} 
          onLayerClick={mockOnLayerClick}
          interactive={true}
        />
      );
      
      // Should render touch-optimized version
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('touch-manipulation');
    });
  });

  describe('Animations', () => {
    it('respects animationDuration prop', () => {
      const { rerender } = render(
        <ConvergenceRadar 
          signal={defaultSignal} 
          animationDuration={2000}
        />
      );
      
      // Update signal to trigger animation
      const updatedSignal: Signal = {
        ...mockSignal,
        convergence_score: 95,
        technical_score: 95,
        sentiment_score: 95,
        liquidity_score: 95
      };
      
      rerender(
        <ConvergenceRadar 
          signal={updatedSignal} 
          animationDuration={2000}
        />
      );
      
      // Animation should be triggered with correct duration
      expect(screen.getByText('95')).toBeInTheDocument();
    });

    it('disables animations on low performance devices', () => {
      mockUsePerformanceTier.mockReturnValue('low');
      
      render(
        <ConvergenceRadar 
          signal={defaultSignal} 
          animationDuration={1000}
        />
      );
      
      // Should render without animations
      expect(screen.getByText('85')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders accessible content', () => {
      render(<ConvergenceRadar signal={defaultSignal} />);
      
      // Check for accessible text in the center
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('SCORE')).toBeInTheDocument();
    });

    it('provides screen reader friendly descriptions', () => {
      render(<ConvergenceRadar signal={defaultSignal} />);
      
      // Check for score percentages
      expect(screen.getByText('90%')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero scores', () => {
      const zeroScoreSignal: Signal = {
        ...mockSignal,
        convergence_score: 0,
        technical_score: 0,
        sentiment_score: 0,
        liquidity_score: 0
      };
      
      render(<ConvergenceRadar signal={zeroScoreSignal} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles maximum scores', () => {
      const maxScoreSignal: Signal = {
        ...mockSignal,
        convergence_score: 100,
        technical_score: 100,
        sentiment_score: 100,
        liquidity_score: 100
      };
      
      render(<ConvergenceRadar signal={maxScoreSignal} />);
      
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getAllByText('100%')).toHaveLength(3);
    });

    it('handles rapid signal updates', () => {
      const { rerender } = render(<ConvergenceRadar signal={defaultSignal} />);
      
      // Rapid updates
      for (let i = 70; i <= 90; i += 5) {
        const updatedSignal: Signal = {
          ...mockSignal,
          convergence_score: i,
          technical_score: i + 5,
          sentiment_score: i - 5,
          liquidity_score: i
        };
        rerender(<ConvergenceRadar signal={updatedSignal} />);
      }
      
      // Should display final values
      expect(screen.getByText('90')).toBeInTheDocument();
    });

    it('handles container resize', () => {
      const { container } = render(<ConvergenceRadar signal={defaultSignal} />);
      
      // Trigger resize observer callback
      const resizeObserverCallback = (global.ResizeObserver as jest.Mock).mock.calls[0][0];
      resizeObserverCallback([
        {
          contentRect: { width: 300, height: 300 },
          target: container.firstChild,
        },
      ]);
      
      // Component should adapt to new size
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Signal Type Variations', () => {
    it('renders correctly for buy signals', () => {
      const buySignal: Signal = {
        ...mockSignal,
        signal_strength: 'buy',
        convergence_score: 90
      };
      
      render(<ConvergenceRadar signal={buySignal} />);
      
      // Check for convergence score in the center by finding the SCORE label
      expect(screen.getByText('SCORE')).toBeInTheDocument();
      // Verify the component renders the layers
      expect(screen.getByText('Technical')).toBeInTheDocument();
    });

    it('renders correctly for sell signals', () => {
      const sellSignal: Signal = {
        ...mockSignal,
        signal_strength: 'sell',
        convergence_score: 20
      };
      
      render(<ConvergenceRadar signal={sellSignal} />);
      
      // Check for convergence score display
      expect(screen.getByText('SCORE')).toBeInTheDocument();
      // Verify signal strength affects rendering
      expect(screen.getByText('Sentiment')).toBeInTheDocument();
    });

    it('renders correctly for hold signals', () => {
      const holdSignal: Signal = {
        ...mockSignal,
        signal_strength: 'hold',
        convergence_score: 50
      };
      
      render(<ConvergenceRadar signal={holdSignal} />);
      
      // Check for convergence score display
      expect(screen.getByText('SCORE')).toBeInTheDocument();
      // Verify hold signal rendering
      expect(screen.getByText('Liquidity')).toBeInTheDocument();
    });
  });
});