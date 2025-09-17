#!/usr/bin/env node

/**
 * THub V2 n8n Workflow Testing Script
 * Tests all production workflows with detailed output
 */

const https = require('https');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// n8n webhook base URL
const N8N_BASE_URL = 'n8n.anikamaher.com';

// Test configurations
const tests = [
  {
    name: 'Simple Webhook Test',
    path: '/webhook/thub-test',
    method: 'POST',
    data: {
      test: 'simple',
      timestamp: new Date().toISOString()
    }
  },
  {
    name: 'Deploy-Ready Webhook Test',
    path: '/webhook/test-webhook',
    method: 'POST',
    data: {
      action: 'test',
      source: 'node-test-script',
      timestamp: new Date().toISOString()
    }
  },
  {
    name: 'Batch Analysis Test',
    path: '/webhook/batch-analysis-trigger',
    method: 'POST',
    data: {
      symbols: ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'],
      priority: 'normal',
      metadata: {
        source: 'test-script',
        test: true
      }
    }
  },
  {
    name: 'Market Scan Action Test',
    path: '/webhook/thub-test',
    method: 'POST',
    data: {
      action: 'market_scan',
      filters: {
        limit: 10,
        minVolume: 1000000,
        minPrice: 5
      }
    }
  }
];

// Function to make HTTPS request
function makeRequest(test) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(test.data);
    
    const options = {
      hostname: N8N_BASE_URL,
      port: 443,
      path: test.path,
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    console.log(`\n${colors.blue}Testing: ${test.name}${colors.reset}`);
    console.log(`URL: https://${N8N_BASE_URL}${test.path}`);
    console.log('Payload:', JSON.stringify(test.data, null, 2));
    console.log('----------------------------------------');
    
    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`${colors.green}✓ Success (${res.statusCode})${colors.reset}`);
          try {
            const response = JSON.parse(body);
            console.log('Response:', JSON.stringify(response, null, 2));
            resolve({ success: true, test: test.name, response });
          } catch (e) {
            console.log('Response:', body);
            resolve({ success: true, test: test.name, response: body });
          }
        } else {
          console.log(`${colors.red}✗ Failed (${res.statusCode})${colors.reset}`);
          console.log('Response:', body);
          resolve({ success: false, test: test.name, statusCode: res.statusCode, response: body });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
      resolve({ success: false, test: test.name, error: error.message });
    });
    
    req.write(data);
    req.end();
  });
}

// Function to test scheduled workflows via manual trigger
async function testScheduledWorkflows() {
  console.log(`\n${colors.yellow}========================================`);
  console.log('Testing Scheduled Workflows');
  console.log('========================================');
  console.log(`Note: These workflows run on schedules and cannot be triggered directly.${colors.reset}\n`);
  
  console.log('1. Market Scanner (ID: fPC0yQPZZGK0nDyc)');
  console.log('   - Schedule: Every 30 minutes during market hours');
  console.log('   - Next run: Check n8n interface');
  console.log('   - Manual test: Can be triggered manually in n8n UI');
  
  console.log('\n2. Signal Monitor (ID: Vsm1O5ROZxCTKIBh)');
  console.log('   - Schedule: Every 15 minutes');
  console.log('   - Next run: Check n8n interface');
  console.log('   - Manual test: Can be triggered manually in n8n UI');
}

// Main test function
async function runTests() {
  console.log(`${colors.blue}========================================`);
  console.log('THub V2 n8n Workflow Testing');
  console.log(`========================================${colors.reset}`);
  
  const results = [];
  
  // Run webhook tests
  for (const test of tests) {
    const result = await makeRequest(test);
    results.push(result);
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Show scheduled workflow info
  await testScheduledWorkflows();
  
  // Summary
  console.log(`\n${colors.blue}========================================`);
  console.log('Test Summary');
  console.log(`========================================${colors.reset}`);
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`${colors.green}Successful: ${successful}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  
  results.forEach(result => {
    const status = result.success ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`${status} ${result.test}`);
  });
  
  console.log(`\n${colors.yellow}Next Steps:${colors.reset}`);
  console.log('1. Check n8n execution history for detailed logs');
  console.log('2. Verify scheduled workflows are active in n8n UI');
  console.log('3. Monitor THub V2 logs for incoming webhook calls');
  console.log('4. Test with actual market data during market hours');
}

// Run the tests
runTests().catch(console.error);