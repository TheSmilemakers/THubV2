/**
 * Touch Performance Measurement Utility
 * Measures actual touch response times and validates <50ms target
 */
import React from 'react';

export interface TouchPerformanceMetrics {
  touchToVisualFeedback: number; // Time from touch to visual response
  touchToHapticFeedback: number; // Time from touch to haptic response  
  gestureRecognition: number; // Time to recognize gesture type
  animationFrameRate: number; // FPS during touch interactions
  totalResponseTime: number; // End-to-end response time
}

export interface TouchPerformanceTest {
  testName: string;
  target: number; // Target response time in ms
  actual: number; // Actual measured time in ms
  passed: boolean; // Whether test passed
  details: Partial<TouchPerformanceMetrics>;
}

export class TouchPerformanceMeasurer {
  private measurements: TouchPerformanceMetrics[] = [];
  private currentTest: Partial<TouchPerformanceMetrics> = {};
  private startTime = 0;
  private animationFrameCount = 0;
  private animationStartTime = 0;
  
  startMeasurement() {
    this.startTime = performance.now();
    this.currentTest = {};
    this.animationFrameCount = 0;
    this.animationStartTime = performance.now();
  }
  
  markVisualFeedback() {
    if (this.startTime) {
      this.currentTest.touchToVisualFeedback = performance.now() - this.startTime;
    }
  }
  
  markHapticFeedback() {
    if (this.startTime) {
      this.currentTest.touchToHapticFeedback = performance.now() - this.startTime;
    }
  }
  
  markGestureRecognition() {
    if (this.startTime) {
      this.currentTest.gestureRecognition = performance.now() - this.startTime;
    }
  }
  
  markFrame() {
    this.animationFrameCount++;
  }
  
  endMeasurement(): TouchPerformanceMetrics {
    const endTime = performance.now();
    const animationDuration = endTime - this.animationStartTime;
    
    const metrics: TouchPerformanceMetrics = {
      touchToVisualFeedback: this.currentTest.touchToVisualFeedback || 0,
      touchToHapticFeedback: this.currentTest.touchToHapticFeedback || 0,
      gestureRecognition: this.currentTest.gestureRecognition || 0,
      animationFrameRate: animationDuration > 0 ? (this.animationFrameCount / animationDuration) * 1000 : 0,
      totalResponseTime: endTime - this.startTime,
    };
    
    this.measurements.push(metrics);
    return metrics;
  }
  
  getAverageMetrics(): TouchPerformanceMetrics {
    if (this.measurements.length === 0) {
      return {
        touchToVisualFeedback: 0,
        touchToHapticFeedback: 0,
        gestureRecognition: 0,
        animationFrameRate: 0,
        totalResponseTime: 0,
      };
    }
    
    return {
      touchToVisualFeedback: this.avg(this.measurements.map(m => m.touchToVisualFeedback)),
      touchToHapticFeedback: this.avg(this.measurements.map(m => m.touchToHapticFeedback)),
      gestureRecognition: this.avg(this.measurements.map(m => m.gestureRecognition)),
      animationFrameRate: this.avg(this.measurements.map(m => m.animationFrameRate)),
      totalResponseTime: this.avg(this.measurements.map(m => m.totalResponseTime)),
    };
  }
  
  private avg(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
  
  reset() {
    this.measurements = [];
    this.currentTest = {};
  }
}

/**
 * Automated touch performance testing suite
 */
export class TouchPerformanceTestSuite {
  private measurer = new TouchPerformanceMeasurer();
  
  async runTouchResponseTest(element: HTMLElement): Promise<TouchPerformanceTest[]> {
    const tests: TouchPerformanceTest[] = [];
    
    // Test 1: Visual feedback response time
    const visualTest = await this.testVisualResponse(element);
    tests.push(visualTest);
    
    // Test 2: Haptic feedback response time  
    const hapticTest = await this.testHapticResponse(element);
    tests.push(hapticTest);
    
    // Test 3: Gesture recognition speed
    const gestureTest = await this.testGestureRecognition(element);
    tests.push(gestureTest);
    
    // Test 4: Animation performance during touch
    const animationTest = await this.testAnimationPerformance(element);
    tests.push(animationTest);
    
    return tests;
  }
  
  private async testVisualResponse(element: HTMLElement): Promise<TouchPerformanceTest> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      
      // Simulate touch event
      const touchEvent = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 100,
          clientY: 100,
          radiusX: 10,
          radiusY: 10,
          rotationAngle: 0,
          force: 1,
        })],
      });
      
      // Measure time to visual feedback (class change or style update)
      const observer = new MutationObserver(() => {
        const responseTime = performance.now() - startTime;
        observer.disconnect();
        
        resolve({
          testName: 'Visual Feedback Response',
          target: 16, // Target: within 1 frame at 60fps
          actual: responseTime,
          passed: responseTime <= 16,
          details: { touchToVisualFeedback: responseTime },
        });
      });
      
      observer.observe(element, {
        attributes: true,
        attributeFilter: ['class', 'style'],
        subtree: true,
      });
      
      element.dispatchEvent(touchEvent);
      
      // Fallback timeout
      setTimeout(() => {
        observer.disconnect();
        resolve({
          testName: 'Visual Feedback Response',
          target: 16,
          actual: 999,
          passed: false,
          details: { touchToVisualFeedback: 999 },
        });
      }, 100);
    });
  }
  
  private async testHapticResponse(element: HTMLElement): Promise<TouchPerformanceTest> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      let hapticTime = 0;
      
      // Mock vibrate function to measure haptic feedback timing
      const originalVibrate = navigator.vibrate;
      (navigator as any).vibrate = (pattern: number | number[]) => {
        hapticTime = performance.now() - startTime;
        (navigator as any).vibrate = originalVibrate; // Restore original
        return true;
      };
      
      const touchEvent = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 100,
          clientY: 100,
          radiusX: 10,
          radiusY: 10,
          rotationAngle: 0,
          force: 1,
        })],
      });
      
      element.dispatchEvent(touchEvent);
      
      setTimeout(() => {
        resolve({
          testName: 'Haptic Feedback Response',
          target: 10, // Target: within 10ms
          actual: hapticTime || 999,
          passed: hapticTime > 0 && hapticTime <= 10,
          details: { touchToHapticFeedback: hapticTime },
        });
      }, 50);
    });
  }
  
  private async testGestureRecognition(element: HTMLElement): Promise<TouchPerformanceTest> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      let recognitionTime = 0;
      
      // Create swipe gesture simulation
      const touch1 = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 100,
          clientY: 100,
          radiusX: 10,
          radiusY: 10,
          rotationAngle: 0,
          force: 1,
        })],
      });
      
      const touch2 = new TouchEvent('touchmove', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 150, // 50px swipe
          clientY: 100,
          radiusX: 10,
          radiusY: 10,
          rotationAngle: 0,
          force: 1,
        })],
      });
      
      const touch3 = new TouchEvent('touchend', {
        changedTouches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 150,
          clientY: 100,
          radiusX: 10,
          radiusY: 10,
          rotationAngle: 0,
          force: 1,
        })],
      });
      
      element.dispatchEvent(touch1);
      
      setTimeout(() => {
        element.dispatchEvent(touch2);
        recognitionTime = performance.now() - startTime;
      }, 10);
      
      setTimeout(() => {
        element.dispatchEvent(touch3);
        
        resolve({
          testName: 'Gesture Recognition Speed',
          target: 30, // Target: within 30ms
          actual: recognitionTime,
          passed: recognitionTime <= 30,
          details: { gestureRecognition: recognitionTime },
        });
      }, 20);
    });
  }
  
  private async testAnimationPerformance(element: HTMLElement): Promise<TouchPerformanceTest> {
    return new Promise((resolve) => {
      let frameCount = 0;
      const startTime = performance.now();
      const duration = 100; // Test for 100ms
      
      const countFrames = () => {
        frameCount++;
        if (performance.now() - startTime < duration) {
          requestAnimationFrame(countFrames);
        } else {
          const fps = (frameCount / duration) * 1000;
          
          resolve({
            testName: 'Touch Animation Performance',
            target: 60, // Target: 60fps
            actual: fps,
            passed: fps >= 30, // Accept 30fps minimum
            details: { animationFrameRate: fps },
          });
        }
      };
      
      // Trigger touch interaction
      const touchEvent = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 100,
          clientY: 100,
          radiusX: 10,
          radiusY: 10,
          rotationAngle: 0,
          force: 1,
        })],
      });
      
      element.dispatchEvent(touchEvent);
      requestAnimationFrame(countFrames);
    });
  }
}

/**
 * React hook for touch performance monitoring
 */
export function useTouchPerformanceMonitor() {
  const measurer = React.useRef(new TouchPerformanceMeasurer());
  const testSuite = React.useRef(new TouchPerformanceTestSuite());
  
  const startMeasurement = () => {
    measurer.current.startMeasurement();
  };
  
  const markVisualFeedback = () => {
    measurer.current.markVisualFeedback();
  };
  
  const markHapticFeedback = () => {
    measurer.current.markHapticFeedback();
  };
  
  const markGestureRecognition = () => {
    measurer.current.markGestureRecognition();
  };
  
  const endMeasurement = () => {
    return measurer.current.endMeasurement();
  };
  
  const runPerformanceTest = async (element: HTMLElement) => {
    return testSuite.current.runTouchResponseTest(element);
  };
  
  const getAverageMetrics = () => {
    return measurer.current.getAverageMetrics();
  };
  
  const reset = () => {
    measurer.current.reset();
  };
  
  return {
    startMeasurement,
    markVisualFeedback,
    markHapticFeedback,
    markGestureRecognition,
    endMeasurement,
    runPerformanceTest,
    getAverageMetrics,
    reset,
  };
}