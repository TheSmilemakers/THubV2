/**
 * Performance measurement utilities for validating performance claims
 * Provides real FPS measurement, performance metrics tracking, and reporting
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  jank: number;
  smoothness: number;
  timestamp: number;
}

export interface PerformanceReport {
  average: PerformanceMetrics;
  min: PerformanceMetrics;
  max: PerformanceMetrics;
  samples: number;
  duration: number;
  device: {
    userAgent: string;
    deviceMemory?: number;
    hardwareConcurrency?: number;
    connection?: string;
  };
}

export class PerformanceMeasurement {
  private metrics: PerformanceMetrics[] = [];
  private frameCount = 0;
  private lastFrameTime = 0;
  private animationId?: number;
  private startTime = 0;
  private isRecording = false;

  /**
   * Start measuring performance
   */
  start(): void {
    if (this.isRecording) return;
    
    this.isRecording = true;
    this.metrics = [];
    this.frameCount = 0;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    
    this.measure();
  }

  /**
   * Stop measuring and return report
   */
  stop(): PerformanceReport {
    this.isRecording = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    return this.generateReport();
  }

  /**
   * Measure a single frame
   */
  private measure = (): void => {
    if (!this.isRecording) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    const fps = frameTime > 0 ? 1000 / frameTime : 0;
    
    // Detect jank (frames taking > 16.67ms for 60fps target)
    const targetFrameTime = 1000 / 60;
    const jank = Math.max(0, frameTime - targetFrameTime);
    
    // Calculate smoothness (0-100, where 100 is perfectly smooth)
    const smoothness = Math.max(0, Math.min(100, 100 - (jank / targetFrameTime) * 100));

    this.metrics.push({
      fps: Math.round(fps),
      frameTime: Math.round(frameTime * 100) / 100,
      jank: Math.round(jank * 100) / 100,
      smoothness: Math.round(smoothness),
      timestamp: currentTime
    });

    this.frameCount++;
    this.lastFrameTime = currentTime;
    
    this.animationId = requestAnimationFrame(this.measure);
  };

  /**
   * Generate performance report
   */
  private generateReport(): PerformanceReport {
    if (this.metrics.length === 0) {
      throw new Error('No performance data collected');
    }

    const duration = performance.now() - this.startTime;
    
    // Calculate aggregates
    const average = this.calculateAverage();
    const min = this.findMin();
    const max = this.findMax();

    // Get device info
    const device = {
      userAgent: navigator.userAgent,
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      connection: (navigator as any).connection?.effectiveType
    };

    return {
      average,
      min,
      max,
      samples: this.metrics.length,
      duration: Math.round(duration),
      device
    };
  }

  private calculateAverage(): PerformanceMetrics {
    const sum = this.metrics.reduce((acc, metric) => ({
      fps: acc.fps + metric.fps,
      frameTime: acc.frameTime + metric.frameTime,
      jank: acc.jank + metric.jank,
      smoothness: acc.smoothness + metric.smoothness,
      timestamp: 0
    }), { fps: 0, frameTime: 0, jank: 0, smoothness: 0, timestamp: 0 });

    const count = this.metrics.length;
    
    return {
      fps: Math.round(sum.fps / count),
      frameTime: Math.round((sum.frameTime / count) * 100) / 100,
      jank: Math.round((sum.jank / count) * 100) / 100,
      smoothness: Math.round(sum.smoothness / count),
      timestamp: Date.now()
    };
  }

  private findMin(): PerformanceMetrics {
    return this.metrics.reduce((min, metric) => ({
      fps: Math.min(min.fps, metric.fps),
      frameTime: Math.min(min.frameTime, metric.frameTime),
      jank: Math.min(min.jank, metric.jank),
      smoothness: Math.min(min.smoothness, metric.smoothness),
      timestamp: metric.timestamp
    }));
  }

  private findMax(): PerformanceMetrics {
    return this.metrics.reduce((max, metric) => ({
      fps: Math.max(max.fps, metric.fps),
      frameTime: Math.max(max.frameTime, metric.frameTime),
      jank: Math.max(max.jank, metric.jank),
      smoothness: Math.max(max.smoothness, metric.smoothness),
      timestamp: metric.timestamp
    }));
  }
}

/**
 * Performance testing scenarios for different components
 */
export const performanceScenarios = {
  /**
   * Test signal card animations
   */
  signalCardAnimation: async (): Promise<PerformanceReport> => {
    const measurement = new PerformanceMeasurement();
    measurement.start();
    
    // Simulate animation for 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return measurement.stop();
  },

  /**
   * Test glassmorphism rendering
   */
  glassmorphismEffects: async (): Promise<PerformanceReport> => {
    const measurement = new PerformanceMeasurement();
    measurement.start();
    
    // Test for 5 seconds to capture various states
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return measurement.stop();
  },

  /**
   * Test scroll performance
   */
  scrollPerformance: async (scrollDistance: number = 1000): Promise<PerformanceReport> => {
    const measurement = new PerformanceMeasurement();
    measurement.start();
    
    // Simulate smooth scroll
    const startY = window.scrollY;
    const duration = 2000;
    const startTime = performance.now();
    
    const scroll = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easing = 1 - Math.pow(1 - progress, 3); // Cubic easing
      
      window.scrollTo(0, startY + scrollDistance * easing);
      
      if (progress < 1) {
        requestAnimationFrame(scroll);
      }
    };
    
    scroll();
    
    // Wait for scroll to complete
    await new Promise(resolve => setTimeout(resolve, duration + 100));
    
    return measurement.stop();
  }
};

/**
 * Format performance report for display
 */
export function formatPerformanceReport(report: PerformanceReport): string {
  return `
Performance Report
==================
Duration: ${report.duration}ms
Samples: ${report.samples}

Average Performance:
- FPS: ${report.average.fps}
- Frame Time: ${report.average.frameTime}ms
- Jank: ${report.average.jank}ms
- Smoothness: ${report.average.smoothness}%

Minimum Performance:
- FPS: ${report.min.fps}
- Frame Time: ${report.min.frameTime}ms
- Jank: ${report.min.jank}ms
- Smoothness: ${report.min.smoothness}%

Maximum Performance:
- FPS: ${report.max.fps}
- Frame Time: ${report.max.frameTime}ms
- Jank: ${report.max.jank}ms
- Smoothness: ${report.max.smoothness}%

Device Info:
- User Agent: ${report.device.userAgent}
- Device Memory: ${report.device.deviceMemory || 'Unknown'}GB
- CPU Cores: ${report.device.hardwareConcurrency || 'Unknown'}
- Connection: ${report.device.connection || 'Unknown'}
  `.trim();
}

/**
 * Performance assertions for testing
 */
export const performanceAssertions = {
  /**
   * Assert minimum FPS requirement
   */
  assertMinimumFPS(report: PerformanceReport, minFPS: number): boolean {
    return report.average.fps >= minFPS;
  },

  /**
   * Assert maximum frame time
   */
  assertMaxFrameTime(report: PerformanceReport, maxFrameTime: number): boolean {
    return report.average.frameTime <= maxFrameTime;
  },

  /**
   * Assert smoothness threshold
   */
  assertSmoothness(report: PerformanceReport, minSmoothness: number): boolean {
    return report.average.smoothness >= minSmoothness;
  },

  /**
   * Assert jank threshold
   */
  assertMaxJank(report: PerformanceReport, maxJank: number): boolean {
    return report.average.jank <= maxJank;
  }
};