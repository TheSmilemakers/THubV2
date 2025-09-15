'use client';

import { PerformanceValidator } from '@/components/dev/performance-validator';
import { MagneticButton as Button } from '@/components/ui/magnetic-button';
import { GlassCard as Card } from '@/components/ui/glass-card';
import { runMobileTestSuite, generateMobileTestReport } from '@/lib/utils/mobile-testing';
import { logTouchTargetAudit, generateTouchTargetReport } from '@/lib/utils/touch-target-audit';
import { TouchPerformanceTestSuite } from '@/lib/utils/touch-performance';
import { ProgressiveEnhancementSettings } from '@/components/dev/progressive-enhancement-settings';
import { useState, useRef } from 'react';
import { Smartphone, FileText, CheckCircle, AlertTriangle, Target, Zap, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

// Force dynamic rendering to prevent build errors
export const dynamic = 'force-dynamic';

export default function TestingPage() {
  const [mobileTestResults, setMobileTestResults] = useState<any>(null);
  const [isRunningMobileTests, setIsRunningMobileTests] = useState(false);
  const [touchTargetReport, setTouchTargetReport] = useState<any>(null);
  const [isRunningTouchAudit, setIsRunningTouchAudit] = useState(false);
  const [touchPerformanceResults, setTouchPerformanceResults] = useState<any>(null);
  const [isRunningTouchPerformance, setIsRunningTouchPerformance] = useState(false);
  const testElementRef = useRef<HTMLDivElement>(null);

  const runMobileTests = async () => {
    setIsRunningMobileTests(true);
    try {
      const results = await runMobileTestSuite();
      setMobileTestResults(results);
    } catch (error) {
      console.error('Mobile tests failed:', error);
    } finally {
      setIsRunningMobileTests(false);
    }
  };

  const runTouchTargetAudit = async () => {
    setIsRunningTouchAudit(true);
    try {
      // Small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const report = generateTouchTargetReport();
      setTouchTargetReport(report);
      
      // Also log to console for debugging
      logTouchTargetAudit();
    } catch (error) {
      console.error('Touch target audit failed:', error);
    } finally {
      setIsRunningTouchAudit(false);
    }
  };

  const runTouchPerformanceTest = async () => {
    setIsRunningTouchPerformance(true);
    try {
      if (!testElementRef.current) {
        throw new Error('Test element not found');
      }

      const testSuite = new TouchPerformanceTestSuite();
      const results = await testSuite.runTouchResponseTest(testElementRef.current);
      setTouchPerformanceResults(results);
      
      console.group('🔥 Touch Performance Test Results');
      results.forEach(result => {
        console.log(`${result.testName}: ${result.actual.toFixed(1)}ms (target: ${result.target}ms) - ${result.passed ? 'PASS' : 'FAIL'}`);
      });
      console.groupEnd();
    } catch (error) {
      console.error('Touch performance test failed:', error);
    } finally {
      setIsRunningTouchPerformance(false);
    }
  };

  const exportMobileReport = () => {
    if (!mobileTestResults) return;
    
    const report = generateMobileTestReport(mobileTestResults);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mobile-test-report-${new Date().toISOString()}.txt`;
    a.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Performance & Mobile Testing</h1>
        <p className="text-gray-400">Validate performance claims and test mobile functionality</p>
      </div>

      {/* Test Elements for Interaction Testing */}
      <div className="hidden">
        <div data-testid="touch-target" className="p-4 bg-gray-800 rounded">Touch Target</div>
        <div data-testid="scroll-container" className="h-96 overflow-y-auto">
          {Array.from({ length: 100 }, (_, i) => (
            <div key={i} className="p-2">Scroll Item {i}</div>
          ))}
        </div>
        <div data-testid="signal-card" className="p-4 bg-gray-800 rounded transition-transform">Signal Card</div>
        <canvas data-testid="convergence-radar" width="200" height="200" />
      </div>

      {/* Touch Performance Test Element */}
      <div 
        ref={testElementRef}
        className="hidden w-32 h-32 bg-blue-600 rounded-lg touch-target transition-all duration-200 active:scale-95"
        data-testid="touch-performance-element"
      >
        Touch Test
      </div>

      {/* Performance Validator */}
      <PerformanceValidator />

      {/* Progressive Enhancement Settings */}
      <ProgressiveEnhancementSettings />

      {/* Touch Target Compliance Audit */}
      <Card className="p-6 bg-gray-900/50 backdrop-blur-xl border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-green-400" />
            WCAG 2.1 AA Touch Target Compliance
          </h2>
          <Button
            onClick={runTouchTargetAudit}
            disabled={isRunningTouchAudit}
            className="bg-green-600 hover:bg-green-700"
          >
            {isRunningTouchAudit ? 'Auditing...' : 'Run Touch Audit'}
          </Button>
        </div>

        {touchTargetReport && (
          <div className="space-y-4">
            {/* Compliance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{touchTargetReport.total}</div>
                <div className="text-gray-400 text-sm">Total Interactive</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{touchTargetReport.compliant}</div>
                <div className="text-gray-400 text-sm">Compliant</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{touchTargetReport.nonCompliant}</div>
                <div className="text-gray-400 text-sm">Non-Compliant</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <div className={`text-2xl font-bold ${touchTargetReport.complianceRate >= 95 ? 'text-green-400' : touchTargetReport.complianceRate >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {touchTargetReport.complianceRate.toFixed(1)}%
                </div>
                <div className="text-gray-400 text-sm">Compliance Rate</div>
              </div>
            </div>

            {/* Issues List */}
            {touchTargetReport.issues.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Non-Compliant Elements:</h3>
                {touchTargetReport.issues.map((issue: any, index: number) => (
                  <div 
                    key={index}
                    className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{issue.component}</p>
                        <p className="text-gray-400 text-sm">
                          Size: {issue.size?.width.toFixed(0)}×{issue.size?.height.toFixed(0)}px 
                          (min: 44×44px required)
                        </p>
                        {issue.touchClass && (
                          <p className="text-gray-400 text-sm">
                            Touch Class: <code className="bg-gray-800 px-1 rounded">{issue.touchClass}</code>
                          </p>
                        )}
                      </div>
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {touchTargetReport.complianceRate === 100 && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-green-400 font-medium">Perfect Compliance!</p>
                  <p className="text-gray-400 text-sm">All interactive elements meet WCAG 2.1 AA standards (44px minimum)</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Touch Performance Testing */}
      <Card className="p-6 bg-gray-900/50 backdrop-blur-xl border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            Touch Response Performance (&lt;50ms Target)
          </h2>
          <Button
            onClick={runTouchPerformanceTest}
            disabled={isRunningTouchPerformance}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {isRunningTouchPerformance ? 'Testing...' : 'Run Touch Performance Test'}
          </Button>
        </div>

        {touchPerformanceResults && (
          <div className="space-y-4">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-lg font-bold text-white mb-2">Response Time Tests</div>
                <div className="space-y-2">
                  {touchPerformanceResults.map((result: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{result.testName}</span>
                      <div className="flex items-center gap-2">
                        <span className={result.passed ? 'text-green-400' : 'text-red-400'}>
                          {result.actual.toFixed(1)}ms
                        </span>
                        {result.passed ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-lg font-bold text-white mb-2">Performance Summary</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Tests Passed:</span>
                    <span className="text-green-400">
                      {touchPerformanceResults.filter((r: any) => r.passed).length} / {touchPerformanceResults.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Average Response:</span>
                    <span className="text-white">
                      {(touchPerformanceResults.reduce((sum: number, r: any) => sum + r.actual, 0) / touchPerformanceResults.length).toFixed(1)}ms
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Target Met:</span>
                    <span className={touchPerformanceResults.every((r: any) => r.passed) ? 'text-green-400' : 'text-red-400'}>
                      {touchPerformanceResults.every((r: any) => r.passed) ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white">Detailed Results:</h3>
              {touchPerformanceResults.map((result: any, index: number) => (
                <div 
                  key={index}
                  className={cn(
                    "rounded-lg p-4 border",
                    result.passed 
                      ? "bg-green-500/10 border-green-500/20" 
                      : "bg-red-500/10 border-red-500/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{result.testName}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Target: {result.target}ms</span>
                      <span className={cn(
                        "font-bold",
                        result.passed ? "text-green-400" : "text-red-400"
                      )}>
                        {result.actual.toFixed(1)}ms
                      </span>
                      {result.passed ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                  </div>
                  
                  {/* Performance Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                    <div 
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        result.passed ? "bg-green-400" : "bg-red-400"
                      )}
                      style={{ 
                        width: `${Math.min((result.actual / (result.target * 2)) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  
                  {!result.passed && (
                    <p className="text-sm text-red-400">
                      Performance below target. Consider optimizing touch event handlers or reducing DOM complexity.
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Overall Assessment */}
            {touchPerformanceResults.every((r: any) => r.passed) ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-green-400 font-medium">Excellent Touch Performance!</p>
                  <p className="text-gray-400 text-sm">All touch interactions meet the &lt;50ms response time target</p>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-yellow-400 font-medium">Performance Optimization Needed</p>
                  <p className="text-gray-400 text-sm">Some touch interactions exceed the 50ms target. Consider using FastTouchHandler for critical components.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Mobile Testing */}
      <Card className="p-6 bg-gray-900/50 backdrop-blur-xl border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-purple-400" />
            Mobile Device Testing
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={runMobileTests}
              disabled={isRunningMobileTests}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isRunningMobileTests ? 'Running Tests...' : 'Run Mobile Tests'}
            </Button>
            {mobileTestResults && (
              <Button
                onClick={exportMobileReport}
                variant="secondary"
                className="bg-gray-800/50 border-gray-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            )}
          </div>
        </div>

        {mobileTestResults && (
          <div className="space-y-4">
            {mobileTestResults.map((result: any, index: number) => (
              <div 
                key={index}
                className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {result.passed ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  )}
                  <div>
                    <p className="text-white font-medium">{result.testName}</p>
                    {result.metrics.touchLatency !== undefined && (
                      <p className="text-gray-400 text-sm">
                        Touch Latency: {result.metrics.touchLatency.toFixed(2)}ms
                      </p>
                    )}
                    {result.metrics.scrollFPS !== undefined && (
                      <p className="text-gray-400 text-sm">
                        Scroll FPS: {result.metrics.scrollFPS.toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
                <span className={result.passed ? 'text-green-400' : 'text-red-400'}>
                  {result.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Usage Instructions */}
      <Card className="p-6 bg-gray-900/50 backdrop-blur-xl border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Testing Instructions</h3>
        <div className="space-y-3 text-gray-300">
          <p>• <strong>Performance Tests:</strong> Measure real FPS, frame times, and smoothness across different scenarios</p>
          <p>• <strong>Progressive Enhancement:</strong> Configure and test adaptive UI features based on device capabilities</p>
          <p>• <strong>Touch Target Audit:</strong> Validate WCAG 2.1 AA compliance (44px minimum touch targets)</p>
          <p>• <strong>Touch Performance:</strong> Measure touch response times with &lt;50ms target validation</p>
          <p>• <strong>Mobile Tests:</strong> Validate touch responsiveness, scroll performance, and viewport handling</p>
          <p>• <strong>Device Detection:</strong> Automatically detects device capabilities and adjusts tests accordingly</p>
          <p>• <strong>Export Reports:</strong> Generate detailed reports for documentation and CI/CD integration</p>
        </div>
        
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-400 text-sm">
            💡 For accurate mobile testing, access this page on a real mobile device. 
            The tests will automatically adapt to touch interfaces and mobile viewports.
          </p>
        </div>
      </Card>
    </div>
  );
}