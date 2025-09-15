/**
 * Performance Regression Testing for CI/CD Integration
 * Automated performance testing to prevent regressions
 */

import { PerformanceMeasurement, performanceAssertions } from './performance-measurement';
import { logger } from '@/lib/logger';

export interface PerformanceBaseline {
  version: string;
  timestamp: Date;
  environment: {
    userAgent: string;
    platform: string;
    cpuCores: number;
    memory?: number;
  };
  benchmarks: {
    [key: string]: {
      fps: number;
      frameTime: number;
      smoothness: number;
      jank: number;
    };
  };
}

export interface RegressionTestConfig {
  baselineVersion?: string;
  thresholds?: {
    fps?: number;        // Minimum acceptable FPS
    frameTime?: number;  // Maximum acceptable frame time
    smoothness?: number; // Minimum smoothness percentage
    jank?: number;       // Maximum jank in ms
  };
  scenarios: Array<{
    name: string;
    test: () => Promise<any>;
    critical?: boolean;  // Fails entire suite if this test fails
  }>;
}

/**
 * Performance regression tester
 */
export class PerformanceRegressionTester {
  private logger = logger.createChild('PerformanceRegression');
  
  /**
   * Run regression tests against baseline
   */
  async runRegressionTests(
    config: RegressionTestConfig,
    baseline?: PerformanceBaseline
  ): Promise<{
    passed: boolean;
    results: any[];
    regressions: string[];
    improvements: string[];
  }> {
    const results: any[] = [];
    const regressions: string[] = [];
    const improvements: string[] = [];
    
    // Default thresholds
    const thresholds = {
      fps: 30,
      frameTime: 33.33, // 30fps threshold
      smoothness: 80,
      jank: 16.67, // One frame at 60fps
      ...config.thresholds
    };
    
    for (const scenario of config.scenarios) {
      this.logger.info(`Running scenario: ${scenario.name}`);
      
      try {
        const measurement = new PerformanceMeasurement();
        measurement.start();
        
        // Run the test scenario
        await scenario.test();
        
        const report = measurement.stop();
        
        // Check against thresholds
        const passedFPS = report.average.fps >= thresholds.fps;
        const passedFrameTime = report.average.frameTime <= thresholds.frameTime;
        const passedSmoothness = report.average.smoothness >= thresholds.smoothness;
        const passedJank = report.average.jank <= thresholds.jank;
        
        const scenarioPassed = passedFPS && passedFrameTime && passedSmoothness && passedJank;
        
        // Compare with baseline if available
        if (baseline && baseline.benchmarks[scenario.name]) {
          const baselineMetrics = baseline.benchmarks[scenario.name];
          
          // Check for regressions (10% tolerance)
          if (report.average.fps < baselineMetrics.fps * 0.9) {
            regressions.push(
              `${scenario.name}: FPS regressed from ${baselineMetrics.fps} to ${report.average.fps}`
            );
          }
          
          if (report.average.smoothness < baselineMetrics.smoothness * 0.9) {
            regressions.push(
              `${scenario.name}: Smoothness regressed from ${baselineMetrics.smoothness}% to ${report.average.smoothness}%`
            );
          }
          
          // Check for improvements
          if (report.average.fps > baselineMetrics.fps * 1.1) {
            improvements.push(
              `${scenario.name}: FPS improved from ${baselineMetrics.fps} to ${report.average.fps}`
            );
          }
        }
        
        results.push({
          scenario: scenario.name,
          passed: scenarioPassed,
          critical: scenario.critical,
          metrics: report.average,
          thresholds,
          errors: []
        });
        
      } catch (error) {
        this.logger.error(`Scenario failed: ${scenario.name}`, error);
        
        results.push({
          scenario: scenario.name,
          passed: false,
          critical: scenario.critical,
          metrics: null,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
        
        if (scenario.critical) {
          break; // Stop testing if critical scenario fails
        }
      }
    }
    
    // Determine overall pass/fail
    const criticalFailure = results.some(r => r.critical && !r.passed);
    const allPassed = results.every(r => r.passed);
    const passed = !criticalFailure && (allPassed || regressions.length === 0);
    
    return {
      passed,
      results,
      regressions,
      improvements
    };
  }
  
  /**
   * Generate baseline from current performance
   */
  async generateBaseline(
    version: string,
    scenarios: Array<{ name: string; test: () => Promise<any> }>
  ): Promise<PerformanceBaseline> {
    const benchmarks: PerformanceBaseline['benchmarks'] = {};
    
    for (const scenario of scenarios) {
      this.logger.info(`Generating baseline for: ${scenario.name}`);
      
      try {
        const measurement = new PerformanceMeasurement();
        measurement.start();
        
        await scenario.test();
        
        const report = measurement.stop();
        
        benchmarks[scenario.name] = {
          fps: report.average.fps,
          frameTime: report.average.frameTime,
          smoothness: report.average.smoothness,
          jank: report.average.jank
        };
        
      } catch (error) {
        this.logger.error(`Failed to generate baseline for: ${scenario.name}`, error);
      }
    }
    
    return {
      version,
      timestamp: new Date(),
      environment: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        cpuCores: navigator.hardwareConcurrency || 4,
        memory: (navigator as any).deviceMemory
      },
      benchmarks
    };
  }
  
  /**
   * Compare two baselines
   */
  compareBaselines(
    current: PerformanceBaseline,
    previous: PerformanceBaseline
  ): {
    regressions: string[];
    improvements: string[];
    unchanged: string[];
  } {
    const regressions: string[] = [];
    const improvements: string[] = [];
    const unchanged: string[] = [];
    
    for (const [scenario, currentMetrics] of Object.entries(current.benchmarks)) {
      const previousMetrics = previous.benchmarks[scenario];
      
      if (!previousMetrics) {
        continue; // New scenario, skip comparison
      }
      
      // Compare with 10% threshold
      const fpsChange = ((currentMetrics.fps - previousMetrics.fps) / previousMetrics.fps) * 100;
      const smoothnessChange = ((currentMetrics.smoothness - previousMetrics.smoothness) / previousMetrics.smoothness) * 100;
      
      if (fpsChange < -10) {
        regressions.push(`${scenario}: FPS decreased by ${Math.abs(fpsChange).toFixed(1)}%`);
      } else if (fpsChange > 10) {
        improvements.push(`${scenario}: FPS increased by ${fpsChange.toFixed(1)}%`);
      }
      
      if (smoothnessChange < -10) {
        regressions.push(`${scenario}: Smoothness decreased by ${Math.abs(smoothnessChange).toFixed(1)}%`);
      } else if (smoothnessChange > 10) {
        improvements.push(`${scenario}: Smoothness increased by ${smoothnessChange.toFixed(1)}%`);
      }
      
      if (Math.abs(fpsChange) <= 10 && Math.abs(smoothnessChange) <= 10) {
        unchanged.push(scenario);
      }
    }
    
    return { regressions, improvements, unchanged };
  }
}

/**
 * CI/CD integration helpers
 */
export const ciHelpers = {
  /**
   * Format results for CI output
   */
  formatForCI(results: any): string {
    const passed = results.passed ? '✅ PASSED' : '❌ FAILED';
    let output = `\nPerformance Regression Test: ${passed}\n`;
    output += '=' .repeat(50) + '\n';
    
    // Summary
    const totalTests = results.results.length;
    const passedTests = results.results.filter((r: any) => r.passed).length;
    output += `\nTests: ${passedTests}/${totalTests} passed\n`;
    
    // Regressions
    if (results.regressions.length > 0) {
      output += '\n⚠️  Performance Regressions:\n';
      results.regressions.forEach((r: string) => {
        output += `  - ${r}\n`;
      });
    }
    
    // Improvements
    if (results.improvements.length > 0) {
      output += '\n✨ Performance Improvements:\n';
      results.improvements.forEach((i: string) => {
        output += `  - ${i}\n`;
      });
    }
    
    // Detailed results
    output += '\nDetailed Results:\n';
    results.results.forEach((r: any) => {
      const status = r.passed ? '✅' : '❌';
      const critical = r.critical ? ' [CRITICAL]' : '';
      output += `\n${status} ${r.scenario}${critical}\n`;
      
      if (r.metrics) {
        output += `  FPS: ${r.metrics.fps} (threshold: ${r.thresholds.fps})\n`;
        output += `  Frame Time: ${r.metrics.frameTime.toFixed(2)}ms (threshold: ${r.thresholds.frameTime.toFixed(2)}ms)\n`;
        output += `  Smoothness: ${r.metrics.smoothness}% (threshold: ${r.thresholds.smoothness}%)\n`;
      }
      
      if (r.errors.length > 0) {
        output += `  Errors: ${r.errors.join(', ')}\n`;
      }
    });
    
    return output;
  },
  
  /**
   * Exit with appropriate code for CI
   */
  exitWithCode(passed: boolean): void {
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(passed ? 0 : 1);
    }
  },
  
  /**
   * Save results as JSON for artifact storage
   */
  saveAsArtifact(results: any, filename: string): string {
    const artifact = {
      timestamp: new Date().toISOString(),
      environment: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        url: window.location.href
      },
      results
    };
    
    return JSON.stringify(artifact, null, 2);
  }
};