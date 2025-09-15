#!/usr/bin/env tsx

/**
 * Performance Test Runner for CI/CD
 * Run with: npx tsx scripts/run-performance-tests.ts
 */

import { PerformanceRegressionTester, ciHelpers } from '../src/lib/utils/performance-regression';

// Playwright is optional - check if available
let chromium: any;
try {
  chromium = require('@playwright/test').chromium;
} catch (error) {
  console.warn('⚠️  Playwright not installed. Performance tests require Playwright.');
  console.log('Install with: npm install @playwright/test');
  process.exit(0);
}

// Test scenarios
const testScenarios = [
  {
    name: 'Homepage Load Performance',
    test: async (page: any) => {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      // Scroll to trigger animations
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(2000);
    },
    critical: true
  },
  {
    name: 'Signal Dashboard Performance',
    test: async (page: any) => {
      await page.goto('http://localhost:3000/signals');
      await page.waitForLoadState('networkidle');
      // Trigger card animations
      const cards = await page.$$('[data-testid="signal-card"]');
      for (const card of cards.slice(0, 3)) {
        await card.hover();
        await page.waitForTimeout(300);
      }
    },
    critical: true
  },
  {
    name: 'Mobile Touch Interactions',
    test: async (page: any) => {
      await page.goto('http://localhost:3000/showcase');
      await page.waitForLoadState('networkidle');
      // Simulate touch interactions
      const touchTarget = await page.$('[data-testid="touch-target"]');
      if (touchTarget) {
        await touchTarget.tap();
        await page.waitForTimeout(100);
      }
    },
    critical: false
  },
  {
    name: 'Glassmorphism Effects',
    test: async (page: any) => {
      await page.goto('http://localhost:3000/showcase');
      await page.waitForLoadState('networkidle');
      // Toggle glass effects
      const glassElements = await page.$$('[data-glass]');
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => {
          document.querySelectorAll('[data-glass]').forEach(el => {
            el.classList.toggle('backdrop-blur-xl');
          });
        });
        await page.waitForTimeout(200);
      }
    },
    critical: false
  }
];

async function runTests() {
  console.log('🚀 Starting Performance Tests...\n');
  
  // Launch browser
  const browser = await chromium.launch({
    headless: process.env.CI === 'true'
  });
  
  try {
    // Test on desktop
    console.log('📱 Testing Desktop Performance...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    const desktopPage = await desktopContext.newPage();
    
    // Enable performance monitoring
    await desktopPage.evaluateOnNewDocument(() => {
      // Inject performance measurement script
      window.performanceMetrics = [];
      let lastTime = performance.now();
      
      function measureFrame() {
        const now = performance.now();
        const frameTime = now - lastTime;
        window.performanceMetrics.push({
          frameTime,
          fps: 1000 / frameTime,
          timestamp: now
        });
        lastTime = now;
        requestAnimationFrame(measureFrame);
      }
      
      requestAnimationFrame(measureFrame);
    });
    
    const tester = new PerformanceRegressionTester();
    
    // Run desktop tests
    const desktopResults = await tester.runRegressionTests({
      thresholds: {
        fps: 30,
        frameTime: 33.33,
        smoothness: 80,
        jank: 16.67
      },
      scenarios: testScenarios.map(scenario => ({
        ...scenario,
        test: async () => {
          await scenario.test(desktopPage);
          // Get performance metrics
          const metrics = await desktopPage.evaluate(() => window.performanceMetrics);
          return metrics;
        }
      }))
    });
    
    await desktopContext.close();
    
    // Test on mobile
    console.log('\n📱 Testing Mobile Performance...');
    const mobileContext = await browser.newContext({
      ...chromium.devices['iPhone 12'],
      viewport: { width: 390, height: 844 }
    });
    const mobilePage = await mobileContext.newPage();
    
    // Enable performance monitoring for mobile
    await mobilePage.evaluateOnNewDocument(() => {
      window.performanceMetrics = [];
      let lastTime = performance.now();
      
      function measureFrame() {
        const now = performance.now();
        const frameTime = now - lastTime;
        window.performanceMetrics.push({
          frameTime,
          fps: 1000 / frameTime,
          timestamp: now
        });
        lastTime = now;
        requestAnimationFrame(measureFrame);
      }
      
      requestAnimationFrame(measureFrame);
    });
    
    const mobileResults = await tester.runRegressionTests({
      thresholds: {
        fps: 24, // Lower threshold for mobile
        frameTime: 41.67,
        smoothness: 70,
        jank: 20
      },
      scenarios: testScenarios.map(scenario => ({
        ...scenario,
        test: async () => {
          await scenario.test(mobilePage);
          const metrics = await mobilePage.evaluate(() => window.performanceMetrics);
          return metrics;
        }
      }))
    });
    
    await mobileContext.close();
    
    // Print results
    console.log('\n📊 Desktop Results:');
    console.log(ciHelpers.formatForCI(desktopResults));
    
    console.log('\n📊 Mobile Results:');
    console.log(ciHelpers.formatForCI(mobileResults));
    
    // Save artifacts
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const desktopArtifact = ciHelpers.saveAsArtifact(desktopResults, `desktop-${timestamp}.json`);
    const mobileArtifact = ciHelpers.saveAsArtifact(mobileResults, `mobile-${timestamp}.json`);
    
    // Write artifacts if in CI
    if (process.env.CI === 'true') {
      const fs = await import('fs/promises');
      await fs.mkdir('performance-artifacts', { recursive: true });
      await fs.writeFile(`performance-artifacts/desktop-${timestamp}.json`, desktopArtifact);
      await fs.writeFile(`performance-artifacts/mobile-${timestamp}.json`, mobileArtifact);
    }
    
    // Exit with appropriate code
    const passed = desktopResults.passed && mobileResults.passed;
    ciHelpers.exitWithCode(passed);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Declare global for TypeScript
declare global {
  interface Window {
    performanceMetrics: any[];
  }
}

// Run tests
runTests().catch(console.error);