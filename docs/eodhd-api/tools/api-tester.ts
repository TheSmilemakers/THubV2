#!/usr/bin/env ts-node

/**
 * EODHD API Testing Tool
 * 
 * A comprehensive tool for testing and documenting EODHD API endpoints
 * Usage: npx ts-node api-tester.ts [endpoint] [params]
 */

import * as fs from 'fs';
import * as path from 'path';
import axios, { AxiosInstance } from 'axios';
import { EODData, RealTimeQuote, TechnicalIndicatorBase } from '../../../src/types/eodhd';

// Configuration
const API_KEY = process.env.EODHD_API_KEY || 'demo';
const BASE_URL = 'https://eodhd.com/api';
const OUTPUT_DIR = path.join(__dirname, '../responses');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

class EODHDAPITester {
  private client: AxiosInstance;
  private apiCallCount = 0;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
    });

    // Request interceptor for logging
    this.client.interceptors.request.use((config) => {
      console.log(`\n🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      console.log(`📦 Parameters:`, config.params);
      this.apiCallCount++;
      return config;
    });

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ Response Status: ${response.status}`);
        console.log(`📊 Data Preview:`, JSON.stringify(response.data).slice(0, 200) + '...');
        return response;
      },
      (error) => {
        console.error(`❌ Error: ${error.response?.status} - ${error.message}`);
        if (error.response?.data) {
          console.error(`📛 Error Details:`, error.response.data);
        }
        throw error;
      }
    );
  }

  /**
   * Save response to file for documentation
   */
  private saveResponse(endpoint: string, data: any, params: any): void {
    const filename = `${endpoint.replace(/\//g, '_')}_${Date.now()}.json`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    const output = {
      timestamp: new Date().toISOString(),
      endpoint,
      params,
      response: data,
      metadata: {
        api_calls_consumed: this.getApiCallsForEndpoint(endpoint),
        data_points: Array.isArray(data) ? data.length : 1,
      }
    };

    fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
    console.log(`\n💾 Response saved to: ${filename}`);
  }

  /**
   * Get API call consumption for endpoint type
   */
  private getApiCallsForEndpoint(endpoint: string): number {
    if (endpoint.includes('technical')) return 5;
    if (endpoint.includes('options')) return 10;
    if (endpoint.includes('screener')) return 5;
    return 1;
  }

  /**
   * Test EOD Historical Data
   */
  async testEODData(symbol = 'AAPL.US'): Promise<void> {
    console.log(`\n=== Testing EOD Historical Data for ${symbol} ===`);
    
    const params = {
      api_token: API_KEY,
      from: '2024-01-01',
      to: '2024-01-31',
      fmt: 'json'
    };

    const response = await this.client.get<EODData[]>(`/eod/${symbol}`, { params });
    this.saveResponse('eod', response.data, params);
    
    // Test with different periods
    const weeklyParams = { ...params, period: 'w' };
    const weeklyResponse = await this.client.get(`/eod/${symbol}`, { params: weeklyParams });
    this.saveResponse('eod_weekly', weeklyResponse.data, weeklyParams);
  }

  /**
   * Test Real-time Quote
   */
  async testRealTimeQuote(symbol = 'AAPL.US'): Promise<void> {
    console.log(`\n=== Testing Real-time Quote for ${symbol} ===`);
    
    const params = {
      api_token: API_KEY,
      fmt: 'json'
    };

    const response = await this.client.get<RealTimeQuote>(`/real-time/${symbol}`, { params });
    this.saveResponse('real-time', response.data, params);
  }

  /**
   * Test Technical Indicators
   */
  async testTechnicalIndicators(symbol = 'AAPL.US'): Promise<void> {
    console.log(`\n=== Testing Technical Indicators for ${symbol} ===`);

    // Test RSI
    const rsiParams = {
      api_token: API_KEY,
      function: 'rsi',
      period: 14,
      fmt: 'json'
    };
    const rsiResponse = await this.client.get(`/technical/${symbol}`, { params: rsiParams });
    this.saveResponse('technical_rsi', rsiResponse.data, rsiParams);

    // Test MACD
    const macdParams = {
      api_token: API_KEY,
      function: 'macd',
      fast_period: 12,
      slow_period: 26,
      signal_period: 9,
      fmt: 'json'
    };
    const macdResponse = await this.client.get(`/technical/${symbol}`, { params: macdParams });
    this.saveResponse('technical_macd', macdResponse.data, macdParams);

    // Test Bollinger Bands
    const bbParams = {
      api_token: API_KEY,
      function: 'bbands',
      period: 20,
      std_dev: 2,
      fmt: 'json'
    };
    const bbResponse = await this.client.get(`/technical/${symbol}`, { params: bbParams });
    this.saveResponse('technical_bbands', bbResponse.data, bbParams);
  }

  /**
   * Test Screener API
   */
  async testScreener(): Promise<void> {
    console.log(`\n=== Testing Screener API ===`);
    
    const params = {
      api_token: API_KEY,
      filters: JSON.stringify([
        ["market_capitalization", ">", 1000000000],
        ["exchange", "=", "US"]
      ]),
      limit: 10,
      fmt: 'json'
    };

    try {
      const response = await this.client.get('/screener', { params });
      this.saveResponse('screener', response.data, params);
    } catch (error) {
      console.log('Screener API might require upgraded plan');
    }
  }

  /**
   * Test Exchange List
   */
  async testExchangesList(): Promise<void> {
    console.log(`\n=== Testing Exchanges List ===`);
    
    const params = {
      api_token: API_KEY,
      fmt: 'json'
    };

    const response = await this.client.get('/exchanges-list', { params });
    this.saveResponse('exchanges-list', response.data, params);
  }

  /**
   * Test Symbol Search
   */
  async testSearch(query = 'Apple'): Promise<void> {
    console.log(`\n=== Testing Symbol Search for "${query}" ===`);
    
    const params = {
      api_token: API_KEY,
      fmt: 'json'
    };

    const response = await this.client.get(`/search/${query}`, { params });
    this.saveResponse('search', response.data, params);
  }

  /**
   * Test Bulk EOD
   */
  async testBulkEOD(exchange = 'US'): Promise<void> {
    console.log(`\n=== Testing Bulk EOD for ${exchange} ===`);
    
    const params = {
      api_token: API_KEY,
      fmt: 'json'
    };

    try {
      const response = await this.client.get(`/eod-bulk-last-day/${exchange}`, { params });
      // Save only first 10 symbols to avoid huge files
      const limitedData = response.data.slice(0, 10);
      this.saveResponse('bulk-eod', limitedData, params);
      console.log(`📊 Total symbols returned: ${response.data.length}`);
    } catch (error) {
      console.log('Bulk EOD might require upgraded plan');
    }
  }

  /**
   * Generate Type Definitions from Responses
   */
  generateTypes(): void {
    console.log('\n=== Generating TypeScript Types from Responses ===');
    
    const files = fs.readdirSync(OUTPUT_DIR);
    const types = new Map<string, Set<string>>();

    files.forEach(file => {
      if (!file.endsWith('.json')) return;
      
      const content = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, file), 'utf-8'));
      const endpoint = content.endpoint;
      const data = content.response;

      // Extract type structure
      const typeStructure = this.extractTypeStructure(data);
      
      if (!types.has(endpoint)) {
        types.set(endpoint, new Set());
      }
      types.get(endpoint)?.add(JSON.stringify(typeStructure));
    });

    // Write type definitions
    let typeDefinitions = '// Auto-generated TypeScript types from API responses\n\n';
    
    types.forEach((structures, endpoint) => {
      typeDefinitions += `// Endpoint: ${endpoint}\n`;
      structures.forEach(structure => {
        typeDefinitions += `// ${structure}\n`;
      });
      typeDefinitions += '\n';
    });

    fs.writeFileSync(path.join(__dirname, '../types/generated.types.ts'), typeDefinitions);
    console.log('✅ Type definitions generated');
  }

  /**
   * Extract type structure from response data
   */
  private extractTypeStructure(data: any): any {
    if (Array.isArray(data)) {
      return [this.extractTypeStructure(data[0])];
    }
    
    if (data === null) return 'null';
    if (typeof data !== 'object') return typeof data;
    
    const structure: any = {};
    Object.keys(data).forEach(key => {
      structure[key] = this.extractTypeStructure(data[key]);
    });
    
    return structure;
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Starting EODHD API Test Suite');
    console.log(`🔑 Using API Key: ${API_KEY === 'demo' ? 'demo' : '***' + API_KEY.slice(-4)}`);
    console.log(`📁 Output Directory: ${OUTPUT_DIR}`);
    
    try {
      // Market Data Tests
      await this.testEODData();
      await this.testRealTimeQuote();
      
      // Technical Indicators
      await this.testTechnicalIndicators();
      
      // Reference Data
      await this.testExchangesList();
      await this.testSearch();
      
      // Advanced Features (may require paid plan)
      await this.testScreener();
      await this.testBulkEOD();
      
      // Generate types from responses
      this.generateTypes();
      
      console.log(`\n✅ Test Suite Complete!`);
      console.log(`📊 Total API Calls Made: ${this.apiCallCount}`);
      console.log(`💾 Response files saved to: ${OUTPUT_DIR}`);
    } catch (error) {
      console.error('\n❌ Test Suite Failed:', error);
    }
  }
}

// CLI Interface
const tester = new EODHDAPITester();

const command = process.argv[2];
const symbol = process.argv[3] || 'AAPL.US';

switch (command) {
  case 'eod':
    tester.testEODData(symbol);
    break;
  case 'quote':
    tester.testRealTimeQuote(symbol);
    break;
  case 'technical':
    tester.testTechnicalIndicators(symbol);
    break;
  case 'screener':
    tester.testScreener();
    break;
  case 'exchanges':
    tester.testExchangesList();
    break;
  case 'search':
    tester.testSearch(symbol);
    break;
  case 'bulk':
    tester.testBulkEOD(symbol);
    break;
  case 'types':
    tester.generateTypes();
    break;
  default:
    console.log('Running all tests...');
    tester.runAllTests();
}

export default EODHDAPITester;