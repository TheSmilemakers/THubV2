/**
 * Mobile Testing Utilities for THub V2
 * Provides real device testing, touch interaction validation, and mobile-specific testing
 */

import { logger } from '@/lib/logger';

export interface TouchGesture {
  type: 'tap' | 'swipe' | 'pinch' | 'long-press';
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  duration: number;
  velocity?: number;
  scale?: number;
}

export interface MobileTestResult {
  testName: string;
  passed: boolean;
  device: {
    model: string;
    os: string;
    browser: string;
    viewport: { width: number; height: number };
    pixelRatio: number;
    touch: boolean;
  };
  metrics: {
    touchLatency?: number;
    scrollFPS?: number;
    gestureAccuracy?: number;
    viewportStability?: boolean;
  };
  errors?: string[];
}

/**
 * Mobile device detection and classification
 */
export class MobileDeviceDetector {
  private userAgent: string;
  
  constructor() {
    this.userAgent = navigator.userAgent;
  }

  getDeviceInfo() {
    return {
      model: this.getDeviceModel(),
      os: this.getOS(),
      browser: this.getBrowser(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      pixelRatio: window.devicePixelRatio || 1,
      touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      orientation: this.getOrientation()
    };
  }

  private getDeviceModel(): string {
    const ua = this.userAgent;
    
    // iOS devices
    if (/iPhone/.test(ua)) {
      if (/iPhone\s?(12|13|14|15)/.test(ua)) return 'iPhone (Latest)';
      if (/iPhone\s?(X|11)/.test(ua)) return 'iPhone (Modern)';
      return 'iPhone (Legacy)';
    }
    
    if (/iPad/.test(ua)) {
      if (/iPad\s?Pro/.test(ua)) return 'iPad Pro';
      return 'iPad';
    }
    
    // Android devices
    if (/Android/.test(ua)) {
      const match = ua.match(/Android.+;\s(.*?)\)/);
      if (match && match[1]) {
        return match[1].split(';')[0].trim();
      }
      return 'Android Device';
    }
    
    return 'Unknown Device';
  }

  private getOS(): string {
    const ua = this.userAgent;
    
    if (/iPhone|iPad|iPod/.test(ua)) {
      const match = ua.match(/OS\s(\d+)_/);
      return match ? `iOS ${match[1]}` : 'iOS';
    }
    
    if (/Android/.test(ua)) {
      const match = ua.match(/Android\s(\d+\.\d+)/);
      return match ? `Android ${match[1]}` : 'Android';
    }
    
    return 'Unknown OS';
  }

  private getBrowser(): string {
    const ua = this.userAgent;
    
    if (/CriOS/.test(ua)) return 'Chrome iOS';
    if (/FxiOS/.test(ua)) return 'Firefox iOS';
    if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari';
    if (/Chrome/.test(ua)) return 'Chrome';
    if (/Firefox/.test(ua)) return 'Firefox';
    
    return 'Unknown Browser';
  }

  private getOrientation(): 'portrait' | 'landscape' {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }
}

/**
 * Touch interaction tester
 */
export class TouchInteractionTester {
  private touchLog: TouchGesture[] = [];
  private testLogger = logger.createChild('TouchTest');

  /**
   * Test touch responsiveness
   */
  async testTouchLatency(element: HTMLElement): Promise<number> {
    return new Promise((resolve) => {
      let touchStartTime = 0;
      let touchEndTime = 0;
      
      const handleTouchStart = (e: TouchEvent) => {
        touchStartTime = performance.now();
        element.style.transform = 'scale(0.98)';
      };
      
      const handleTouchEnd = (e: TouchEvent) => {
        touchEndTime = performance.now();
        element.style.transform = 'scale(1)';
        
        const latency = touchEndTime - touchStartTime;
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchend', handleTouchEnd);
        
        resolve(latency);
      };
      
      element.addEventListener('touchstart', handleTouchStart);
      element.addEventListener('touchend', handleTouchEnd);
      
      // Simulate touch if not on real device
      if (!('ontouchstart' in window)) {
        setTimeout(() => {
          element.dispatchEvent(new TouchEvent('touchstart', {
            touches: [new Touch({
              identifier: 1,
              target: element,
              clientX: 100,
              clientY: 100,
              radiusX: 10,
              radiusY: 10,
              rotationAngle: 0,
              force: 1
            })]
          }));
          
          setTimeout(() => {
            element.dispatchEvent(new TouchEvent('touchend', { touches: [] }));
          }, 50);
        }, 100);
      }
    });
  }

  /**
   * Test swipe gesture recognition
   */
  async testSwipeGesture(element: HTMLElement): Promise<TouchGesture | null> {
    return new Promise((resolve) => {
      let startX = 0, startY = 0;
      let startTime = 0;
      
      const handleTouchStart = (e: TouchEvent) => {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        startTime = performance.now();
      };
      
      const handleTouchEnd = (e: TouchEvent) => {
        const touch = e.changedTouches[0];
        const endX = touch.clientX;
        const endY = touch.clientY;
        const duration = performance.now() - startTime;
        
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const velocity = distance / duration;
        
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchend', handleTouchEnd);
        
        if (distance > 50) { // Minimum swipe distance
          resolve({
            type: 'swipe',
            startX,
            startY,
            endX,
            endY,
            duration,
            velocity
          });
        } else {
          resolve(null);
        }
      };
      
      element.addEventListener('touchstart', handleTouchStart);
      element.addEventListener('touchend', handleTouchEnd);
    });
  }

  /**
   * Test scroll performance
   */
  async testScrollPerformance(container: HTMLElement, duration: number = 2000): Promise<number> {
    const frames: number[] = [];
    let lastFrameTime = performance.now();
    let animationId: number;
    
    const measureFrame = () => {
      const now = performance.now();
      const frameTime = now - lastFrameTime;
      if (frameTime > 0) {
        frames.push(1000 / frameTime);
      }
      lastFrameTime = now;
      animationId = requestAnimationFrame(measureFrame);
    };
    
    // Start measuring
    animationId = requestAnimationFrame(measureFrame);
    
    // Perform scroll
    const startY = container.scrollTop;
    const scrollDistance = Math.min(1000, container.scrollHeight - container.clientHeight);
    const startTime = performance.now();
    
    const animateScroll = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easing = 1 - Math.pow(1 - progress, 3);
      
      container.scrollTop = startY + scrollDistance * easing;
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        cancelAnimationFrame(animationId!);
      }
    };
    
    animateScroll();
    
    // Wait for scroll to complete
    await new Promise(resolve => setTimeout(resolve, duration + 100));
    
    // Calculate average FPS
    const averageFPS = frames.reduce((a, b) => a + b, 0) / frames.length;
    
    return averageFPS;
  }
}

/**
 * Mobile viewport tester
 */
export class ViewportTester {
  /**
   * Test viewport stability during keyboard show/hide
   */
  async testKeyboardResize(): Promise<boolean> {
    const initialHeight = window.innerHeight;
    
    // Focus an input to show keyboard
    const input = document.querySelector('input, textarea') as HTMLElement;
    if (!input) {
      return true; // No input to test
    }
    
    input.focus();
    
    // Wait for keyboard to appear
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const keyboardHeight = initialHeight - window.innerHeight;
    const isStable = keyboardHeight > 0 && keyboardHeight < initialHeight * 0.5;
    
    input.blur();
    
    return isStable;
  }

  /**
   * Test safe area handling
   */
  testSafeAreaSupport(): boolean {
    const styles = getComputedStyle(document.documentElement);
    
    // Check for CSS environment variables
    const hasEnvSupport = CSS.supports('padding-top', 'env(safe-area-inset-top)');
    
    // Check if safe areas are being used
    const safeAreaTop = styles.getPropertyValue('--safe-area-inset-top');
    const hasSafeAreaVars = safeAreaTop !== '';
    
    return hasEnvSupport && hasSafeAreaVars;
  }

  /**
   * Test orientation change handling
   */
  async testOrientationChange(): Promise<boolean> {
    const initialOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    
    return new Promise((resolve) => {
      let orientationChanged = false;
      
      const handleOrientationChange = () => {
        const currentOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        if (currentOrientation !== initialOrientation) {
          orientationChanged = true;
        }
        resolve(orientationChanged);
      };
      
      window.addEventListener('orientationchange', handleOrientationChange);
      window.addEventListener('resize', handleOrientationChange);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        window.removeEventListener('orientationchange', handleOrientationChange);
        window.removeEventListener('resize', handleOrientationChange);
        resolve(orientationChanged);
      }, 5000);
    });
  }
}

/**
 * Mobile test suite runner
 */
export async function runMobileTestSuite(): Promise<MobileTestResult[]> {
  const results: MobileTestResult[] = [];
  const deviceDetector = new MobileDeviceDetector();
  const touchTester = new TouchInteractionTester();
  const viewportTester = new ViewportTester();
  
  const deviceInfo = deviceDetector.getDeviceInfo();
  
  // Test 1: Touch Responsiveness
  try {
    const touchTarget = document.querySelector('[data-testid="touch-target"]') as HTMLElement;
    if (touchTarget) {
      const latency = await touchTester.testTouchLatency(touchTarget);
      results.push({
        testName: 'Touch Responsiveness',
        passed: latency < 50, // Should respond within 50ms
        device: deviceInfo,
        metrics: { touchLatency: latency }
      });
    }
  } catch (error) {
    results.push({
      testName: 'Touch Responsiveness',
      passed: false,
      device: deviceInfo,
      metrics: {},
      errors: [error instanceof Error ? error.message : 'Test failed']
    });
  }
  
  // Test 2: Scroll Performance
  try {
    const scrollContainer = document.querySelector('[data-testid="scroll-container"]') as HTMLElement || document.body;
    const scrollFPS = await touchTester.testScrollPerformance(scrollContainer);
    results.push({
      testName: 'Scroll Performance',
      passed: scrollFPS > 30, // Should maintain at least 30fps
      device: deviceInfo,
      metrics: { scrollFPS }
    });
  } catch (error) {
    results.push({
      testName: 'Scroll Performance',
      passed: false,
      device: deviceInfo,
      metrics: {},
      errors: [error instanceof Error ? error.message : 'Test failed']
    });
  }
  
  // Test 3: Viewport Stability
  try {
    const viewportStability = await viewportTester.testKeyboardResize();
    results.push({
      testName: 'Viewport Stability',
      passed: viewportStability,
      device: deviceInfo,
      metrics: { viewportStability }
    });
  } catch (error) {
    results.push({
      testName: 'Viewport Stability',
      passed: false,
      device: deviceInfo,
      metrics: {},
      errors: [error instanceof Error ? error.message : 'Test failed']
    });
  }
  
  // Test 4: Safe Area Support
  const safeAreaSupport = viewportTester.testSafeAreaSupport();
  results.push({
    testName: 'Safe Area Support',
    passed: safeAreaSupport || !deviceInfo.os.includes('iOS'), // Only required on iOS
    device: deviceInfo,
    metrics: {}
  });
  
  return results;
}

/**
 * Generate mobile test report
 */
export function generateMobileTestReport(results: MobileTestResult[]): string {
  const device = results[0]?.device;
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  let report = `
Mobile Testing Report
====================
Device: ${device?.model || 'Unknown'}
OS: ${device?.os || 'Unknown'}
Browser: ${device?.browser || 'Unknown'}
Viewport: ${device?.viewport.width}x${device?.viewport.height}
Pixel Ratio: ${device?.pixelRatio}x
Touch Support: ${device?.touch ? 'Yes' : 'No'}

Test Results: ${passed}/${total} passed
------------------------
`;

  results.forEach(result => {
    report += `
${result.testName}: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`;
    
    if (result.metrics.touchLatency !== undefined) {
      report += `\n  - Touch Latency: ${result.metrics.touchLatency.toFixed(2)}ms`;
    }
    if (result.metrics.scrollFPS !== undefined) {
      report += `\n  - Scroll FPS: ${result.metrics.scrollFPS.toFixed(1)}`;
    }
    if (result.metrics.viewportStability !== undefined) {
      report += `\n  - Viewport Stable: ${result.metrics.viewportStability ? 'Yes' : 'No'}`;
    }
    if (result.errors) {
      report += `\n  - Errors: ${result.errors.join(', ')}`;
    }
  });
  
  return report;
}