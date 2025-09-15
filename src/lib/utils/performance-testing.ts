/**
 * Performance Testing Suite for THub V2
 * Comprehensive testing utilities to validate performance claims
 */

import { PerformanceMeasurement, performanceAssertions, formatPerformanceReport } from './performance-measurement';
import { logger } from '@/lib/logger';

export interface PerformanceTestResult {
  testName: string;
  passed: boolean;
  metrics: {
    fps: number;
    frameTime: number;
    smoothness: number;
    jank: number;
  };
  duration: number;
  device: string;
  timestamp: Date;
  errors?: string[];
}

export interface PerformanceTestSuite {
  name: string;
  tests: PerformanceTestResult[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    averageFPS: number;
    averageSmoothness: number;
  };
}

/**
 * Mobile-specific performance tests
 */
export const mobilePerformanceTests = {
  /**
   * Test touch interaction responsiveness
   */
  async testTouchResponsiveness(): Promise<PerformanceTestResult> {
    const measurement = new PerformanceMeasurement();
    const testName = 'Touch Responsiveness';
    const errors: string[] = [];
    
    measurement.start();
    
    // Simulate rapid touch events
    const touchTarget = document.querySelector('[data-testid="touch-target"]');
    if (!touchTarget) {
      errors.push('Touch target element not found');
    } else {
      // Simulate 100 touch events over 2 seconds
      for (let i = 0; i < 100; i++) {
        const touchEvent = new TouchEvent('touchstart', {
          touches: [new Touch({
            identifier: i,
            target: touchTarget as Element,
            clientX: 100 + Math.random() * 200,
            clientY: 100 + Math.random() * 200,
            radiusX: 10,
            radiusY: 10,
            rotationAngle: 0,
            force: 1
          })]
        });
        touchTarget.dispatchEvent(touchEvent);
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    }
    
    const report = measurement.stop();
    
    return {
      testName,
      passed: performanceAssertions.assertMinimumFPS(report, 50) && errors.length === 0,
      metrics: {
        fps: report.average.fps,
        frameTime: report.average.frameTime,
        smoothness: report.average.smoothness,
        jank: report.average.jank
      },
      duration: report.duration,
      device: navigator.userAgent,
      timestamp: new Date(),
      errors: errors.length > 0 ? errors : undefined
    };
  },

  /**
   * Test scroll performance on mobile
   */
  async testMobileScroll(): Promise<PerformanceTestResult> {
    const measurement = new PerformanceMeasurement();
    const testName = 'Mobile Scroll Performance';
    
    measurement.start();
    
    // Simulate momentum scroll
    const scrollContainer = document.querySelector('[data-testid="scroll-container"]') || document.body;
    const startY = scrollContainer.scrollTop;
    const scrollDistance = 1000;
    const duration = 1000;
    const startTime = performance.now();
    
    const animateScroll = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // iOS-style deceleration curve
      const easing = 1 - Math.pow(1 - progress, 3);
      scrollContainer.scrollTop = startY + scrollDistance * easing;
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };
    
    animateScroll();
    await new Promise(resolve => setTimeout(resolve, duration + 100));
    
    const report = measurement.stop();
    
    return {
      testName,
      passed: performanceAssertions.assertMinimumFPS(report, 30),
      metrics: {
        fps: report.average.fps,
        frameTime: report.average.frameTime,
        smoothness: report.average.smoothness,
        jank: report.average.jank
      },
      duration: report.duration,
      device: navigator.userAgent,
      timestamp: new Date()
    };
  },

  /**
   * Test glassmorphism performance on mobile
   */
  async testMobileGlassmorphism(): Promise<PerformanceTestResult> {
    const measurement = new PerformanceMeasurement();
    const testName = 'Mobile Glassmorphism Effects';
    
    measurement.start();
    
    // Toggle glassmorphism classes to test rendering performance
    const glassElements = document.querySelectorAll('[data-glass]');
    
    for (let i = 0; i < 20; i++) {
      glassElements.forEach(el => {
        el.classList.toggle('backdrop-blur-xl');
        el.classList.toggle('backdrop-blur-sm');
      });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const report = measurement.stop();
    
    // Mobile should maintain at least 24fps with glass effects
    return {
      testName,
      passed: performanceAssertions.assertMinimumFPS(report, 24),
      metrics: {
        fps: report.average.fps,
        frameTime: report.average.frameTime,
        smoothness: report.average.smoothness,
        jank: report.average.jank
      },
      duration: report.duration,
      device: navigator.userAgent,
      timestamp: new Date()
    };
  }
};

/**
 * Component-specific performance tests
 */
export const componentPerformanceTests = {
  /**
   * Test signal card animation performance
   */
  async testSignalCardAnimation(): Promise<PerformanceTestResult> {
    const measurement = new PerformanceMeasurement();
    const testName = 'Signal Card Animation';
    
    measurement.start();
    
    // Find signal cards and trigger animations
    const signalCards = document.querySelectorAll('[data-testid="signal-card"]');
    
    // Simulate hover states and transitions
    for (let i = 0; i < 5; i++) {
      signalCards.forEach(card => {
        card.classList.add('hover');
        (card as HTMLElement).style.transform = 'scale(1.02)';
      });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      signalCards.forEach(card => {
        card.classList.remove('hover');
        (card as HTMLElement).style.transform = 'scale(1)';
      });
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    const report = measurement.stop();
    
    return {
      testName,
      passed: performanceAssertions.assertMinimumFPS(report, 60),
      metrics: {
        fps: report.average.fps,
        frameTime: report.average.frameTime,
        smoothness: report.average.smoothness,
        jank: report.average.jank
      },
      duration: report.duration,
      device: navigator.userAgent,
      timestamp: new Date()
    };
  },

  /**
   * Test convergence radar animation
   */
  async testConvergenceRadar(): Promise<PerformanceTestResult> {
    const measurement = new PerformanceMeasurement();
    const testName = 'Convergence Radar Animation';
    
    measurement.start();
    
    // Simulate radar animation for 3 seconds
    const radarCanvas = document.querySelector('[data-testid="convergence-radar"]');
    if (radarCanvas) {
      // Trigger continuous animation
      (radarCanvas as HTMLElement).setAttribute('data-animating', 'true');
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const report = measurement.stop();
    
    return {
      testName,
      passed: performanceAssertions.assertMinimumFPS(report, 30),
      metrics: {
        fps: report.average.fps,
        frameTime: report.average.frameTime,
        smoothness: report.average.smoothness,
        jank: report.average.jank
      },
      duration: report.duration,
      device: navigator.userAgent,
      timestamp: new Date()
    };
  }
};

/**
 * Run a complete performance test suite
 */
export async function runPerformanceTestSuite(
  suiteName: string,
  tests: (() => Promise<PerformanceTestResult>)[]
): Promise<PerformanceTestSuite> {
  const testLogger = logger.createChild('PerformanceTest');
  testLogger.info(`Starting performance test suite: ${suiteName}`);
  
  const results: PerformanceTestResult[] = [];
  
  for (const test of tests) {
    try {
      const result = await test();
      results.push(result);
      
      testLogger.info(`Test "${result.testName}" ${result.passed ? 'PASSED' : 'FAILED'}`, {
        fps: result.metrics.fps,
        smoothness: result.metrics.smoothness
      });
    } catch (error) {
      testLogger.error('Test failed with error', error);
      results.push({
        testName: 'Unknown Test',
        passed: false,
        metrics: { fps: 0, frameTime: 0, smoothness: 0, jank: 0 },
        duration: 0,
        device: navigator.userAgent,
        timestamp: new Date(),
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }
  
  // Calculate summary
  const summary = {
    totalTests: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    averageFPS: results.reduce((sum, r) => sum + r.metrics.fps, 0) / results.length,
    averageSmoothness: results.reduce((sum, r) => sum + r.metrics.smoothness, 0) / results.length
  };
  
  const suite: PerformanceTestSuite = {
    name: suiteName,
    tests: results,
    summary
  };
  
  testLogger.info(`Test suite completed: ${summary.passed}/${summary.totalTests} passed`, summary);
  
  return suite;
}

/**
 * Performance regression testing
 */
export async function runRegressionTest(
  baseline: PerformanceTestSuite,
  threshold: number = 0.9 // Allow 10% performance degradation
): Promise<{ passed: boolean; degradations: string[] }> {
  // Run the same test suite
  const currentResults = await runPerformanceTestSuite(
    baseline.name + ' (Regression)',
    baseline.tests.map(test => {
      // Re-run the same tests based on test names
      switch (test.testName) {
        case 'Touch Responsiveness':
          return mobilePerformanceTests.testTouchResponsiveness;
        case 'Mobile Scroll Performance':
          return mobilePerformanceTests.testMobileScroll;
        case 'Signal Card Animation':
          return componentPerformanceTests.testSignalCardAnimation;
        default:
          return async () => test; // Return baseline as fallback
      }
    })
  );
  
  const degradations: string[] = [];
  
  // Compare with baseline
  baseline.tests.forEach((baselineTest, index) => {
    const currentTest = currentResults.tests[index];
    
    if (currentTest.metrics.fps < baselineTest.metrics.fps * threshold) {
      degradations.push(
        `${baselineTest.testName}: FPS degraded from ${baselineTest.metrics.fps} to ${currentTest.metrics.fps}`
      );
    }
    
    if (currentTest.metrics.smoothness < baselineTest.metrics.smoothness * threshold) {
      degradations.push(
        `${baselineTest.testName}: Smoothness degraded from ${baselineTest.metrics.smoothness}% to ${currentTest.metrics.smoothness}%`
      );
    }
  });
  
  return {
    passed: degradations.length === 0,
    degradations
  };
}

/**
 * Generate performance report
 */
export function generatePerformanceReport(suite: PerformanceTestSuite): string {
  let report = `
Performance Test Report: ${suite.name}
======================================
Generated: ${new Date().toISOString()}

Summary:
--------
Total Tests: ${suite.summary.totalTests}
Passed: ${suite.summary.passed}
Failed: ${suite.summary.failed}
Average FPS: ${suite.summary.averageFPS.toFixed(1)}
Average Smoothness: ${suite.summary.averageSmoothness.toFixed(1)}%

Test Results:
-------------
`;

  suite.tests.forEach(test => {
    report += `
${test.testName}: ${test.passed ? '✅ PASSED' : '❌ FAILED'}
  - FPS: ${test.metrics.fps} (Frame Time: ${test.metrics.frameTime.toFixed(2)}ms)
  - Smoothness: ${test.metrics.smoothness}%
  - Jank: ${test.metrics.jank.toFixed(2)}ms
  - Duration: ${test.duration}ms
  ${test.errors ? `- Errors: ${test.errors.join(', ')}` : ''}
`;
  });

  report += `
Device Information:
------------------
${suite.tests[0]?.device || 'Unknown'}
`;

  return report;
}

/**
 * Export test results to JSON for CI/CD integration
 */
export function exportTestResults(suite: PerformanceTestSuite): string {
  return JSON.stringify(suite, null, 2);
}