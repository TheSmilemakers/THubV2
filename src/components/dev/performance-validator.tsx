'use client';

import React, { useState } from 'react';
import { MagneticButton as Button } from '@/components/ui/magnetic-button';
import { GlassCard as Card } from '@/components/ui/glass-card';
import { 
  runPerformanceTestSuite, 
  mobilePerformanceTests, 
  componentPerformanceTests,
  generatePerformanceReport,
  PerformanceTestSuite
} from '@/lib/utils/performance-testing';
import { usePerformanceMonitor } from '@/lib/hooks/use-performance-monitor';
import { useDeviceCapabilities } from '@/lib/hooks/use-device-capabilities';
import { Activity, Smartphone, Monitor, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestStatus {
  running: boolean;
  completed: boolean;
  results?: PerformanceTestSuite;
  error?: string;
}

/**
 * Performance Validator Component
 * Provides real-time performance testing and validation
 */
export function PerformanceValidator() {
  const [testStatus, setTestStatus] = useState<TestStatus>({
    running: false,
    completed: false
  });
  
  const performanceMonitor = usePerformanceMonitor({
    enableMonitoring: true,
    targetFps: 60
  });
  
  const deviceCapabilities = useDeviceCapabilities();

  const runMobileTests = async () => {
    setTestStatus({ running: true, completed: false });
    
    try {
      const results = await runPerformanceTestSuite('Mobile Performance Tests', [
        mobilePerformanceTests.testTouchResponsiveness,
        mobilePerformanceTests.testMobileScroll,
        mobilePerformanceTests.testMobileGlassmorphism
      ]);
      
      setTestStatus({
        running: false,
        completed: true,
        results
      });
    } catch (error) {
      setTestStatus({
        running: false,
        completed: true,
        error: error instanceof Error ? error.message : 'Test failed'
      });
    }
  };

  const runComponentTests = async () => {
    setTestStatus({ running: true, completed: false });
    
    try {
      const results = await runPerformanceTestSuite('Component Performance Tests', [
        componentPerformanceTests.testSignalCardAnimation,
        componentPerformanceTests.testConvergenceRadar
      ]);
      
      setTestStatus({
        running: false,
        completed: true,
        results
      });
    } catch (error) {
      setTestStatus({
        running: false,
        completed: true,
        error: error instanceof Error ? error.message : 'Test failed'
      });
    }
  };

  const runAllTests = async () => {
    setTestStatus({ running: true, completed: false });
    
    try {
      const results = await runPerformanceTestSuite('Full Performance Test Suite', [
        mobilePerformanceTests.testTouchResponsiveness,
        mobilePerformanceTests.testMobileScroll,
        mobilePerformanceTests.testMobileGlassmorphism,
        componentPerformanceTests.testSignalCardAnimation,
        componentPerformanceTests.testConvergenceRadar
      ]);
      
      setTestStatus({
        running: false,
        completed: true,
        results
      });
    } catch (error) {
      setTestStatus({
        running: false,
        completed: true,
        error: error instanceof Error ? error.message : 'Test failed'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-time Performance Monitor */}
      <Card className="p-6 bg-gray-900/50 backdrop-blur-xl border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            Real-time Performance Monitor
          </h3>
          <div className={cn(
            "px-3 py-1 rounded-full text-sm font-medium",
            performanceMonitor.metrics.isPerforming 
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          )}>
            {performanceMonitor.metrics.isPerforming ? 'Performing Well' : 'Performance Issues'}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-gray-400 text-sm">Current FPS</p>
            <p className="text-2xl font-bold text-white">{performanceMonitor.metrics.fps}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-gray-400 text-sm">Frame Time</p>
            <p className="text-2xl font-bold text-white">{performanceMonitor.metrics.frameTime.toFixed(1)}ms</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-gray-400 text-sm">Smoothness</p>
            <p className="text-2xl font-bold text-white">{performanceMonitor.metrics.averageFps}%</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-gray-400 text-sm">Dropped Frames</p>
            <p className="text-2xl font-bold text-white">
              {performanceMonitor.getDroppedFramePercentage().toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>

      {/* Device Capabilities */}
      <Card className="p-6 bg-gray-900/50 backdrop-blur-xl border-gray-800">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          {deviceCapabilities.touch ? (
            <Smartphone className="h-5 w-5 text-purple-400" />
          ) : (
            <Monitor className="h-5 w-5 text-blue-400" />
          )}
          Device Capabilities
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-gray-400 text-sm">GPU Tier</p>
            <p className="text-lg font-medium text-white capitalize">{deviceCapabilities.gpu}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-gray-400 text-sm">Screen Size</p>
            <p className="text-lg font-medium text-white capitalize">{deviceCapabilities.screenSize}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-gray-400 text-sm">Network Speed</p>
            <p className="text-lg font-medium text-white uppercase">{deviceCapabilities.networkSpeed}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-gray-400 text-sm">Touch Support</p>
            <p className="text-lg font-medium text-white">{deviceCapabilities.touch ? 'Yes' : 'No'}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-gray-400 text-sm">Pixel Ratio</p>
            <p className="text-lg font-medium text-white">{deviceCapabilities.pixelRatio}x</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-gray-400 text-sm">Backdrop Filter</p>
            <p className="text-lg font-medium text-white">
              {deviceCapabilities.supportsBackdropFilter ? 'Supported' : 'Not Supported'}
            </p>
          </div>
        </div>
      </Card>

      {/* Performance Tests */}
      <Card className="p-6 bg-gray-900/50 backdrop-blur-xl border-gray-800">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-yellow-400" />
          Performance Tests
        </h3>
        
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            onClick={runMobileTests}
            disabled={testStatus.running}
            variant="secondary"
            className="bg-gray-800/50 border-gray-700 hover:bg-gray-700/50"
          >
            Run Mobile Tests
          </Button>
          <Button
            onClick={runComponentTests}
            disabled={testStatus.running}
            variant="secondary"
            className="bg-gray-800/50 border-gray-700 hover:bg-gray-700/50"
          >
            Run Component Tests
          </Button>
          <Button
            onClick={runAllTests}
            disabled={testStatus.running}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Run All Tests
          </Button>
        </div>

        {/* Test Results */}
        {testStatus.running && (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-gray-300 animate-pulse">Running performance tests...</p>
          </div>
        )}

        {testStatus.completed && testStatus.results && (
          <div className="space-y-4">
            {/* Summary */}
            <div className={cn(
              "rounded-lg p-4",
              testStatus.results.summary.failed === 0 
                ? "bg-green-500/10 border border-green-500/20"
                : "bg-red-500/10 border border-red-500/20"
            )}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white flex items-center gap-2">
                  {testStatus.results.summary.failed === 0 ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      All Tests Passed
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      Some Tests Failed
                    </>
                  )}
                </h4>
                <span className="text-sm text-gray-400">
                  {testStatus.results.summary.passed}/{testStatus.results.summary.totalTests} passed
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-gray-400 text-sm">Average FPS</p>
                  <p className="text-lg font-medium text-white">
                    {testStatus.results.summary.averageFPS.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Average Smoothness</p>
                  <p className="text-lg font-medium text-white">
                    {testStatus.results.summary.averageSmoothness.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Individual Test Results */}
            <div className="space-y-2">
              {testStatus.results.tests.map((test, index) => (
                <div 
                  key={index}
                  className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {test.passed ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    )}
                    <span className="text-gray-300">{test.testName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-400">
                      {test.metrics.fps} FPS
                    </span>
                    <span className="text-gray-400">
                      {test.metrics.smoothness}% smooth
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Export Report */}
            <Button
              onClick={() => {
                const report = generatePerformanceReport(testStatus.results!);
                const blob = new Blob([report], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `performance-report-${new Date().toISOString()}.txt`;
                a.click();
              }}
              variant="secondary"
              className="w-full bg-gray-800/50 border-gray-700 hover:bg-gray-700/50"
            >
              Export Performance Report
            </Button>
          </div>
        )}

        {testStatus.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400">Error: {testStatus.error}</p>
          </div>
        )}
      </Card>
    </div>
  );
}