import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '@/lib/logger';
import { ExternalAPIError } from '@/lib/errors';
import { sleep } from '@/lib/utils';

// EODHD API Response Types
export interface RealTimeQuote {
  code: string;
  timestamp: number;
  gmtoffset: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  previousClose: number;
  change: number;
  change_p: number;
}

export interface EODData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjusted_close: number;
  volume: number;
}

export interface IntradayData {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicator {
  date: string;
  value: number;
}

export interface MACDData {
  date: string;
  macd: number;
  macd_signal: number;
  macd_hist: number;
}

export interface BollingerBandsData {
  date: string;
  upper: number;
  middle: number;
  lower: number;
}

export interface BulkEODSymbol {
  code: string;
  exchange_short_name: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjusted_close: number;
  volume: number;
}

/**
 * Service for interacting with EODHD API
 * Handles all market data requests with proper error handling and logging
 */
export class EODHDService {
  private apiKey: string;
  private baseUrl = 'https://eodhd.com/api';
  private client: AxiosInstance;
  private logger = logger.createChild('EODHDService');

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.EODHD_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('EODHD_API_KEY is not set');
    }

    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 second timeout
      headers: {
        'Accept': 'application/json',
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug('API Request', {
          method: config.method,
          url: config.url,
          params: { ...config.params, api_token: '[REDACTED]' }
        });
        return config;
      },
      (error) => {
        this.logger.error('Request error', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling and retry logic
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config;
        const retryCount = (config as any)?._retryCount || 0;
        const maxRetries = 3;
        
        // Check if we should retry
        const shouldRetry = 
          retryCount < maxRetries &&
          config &&
          (!error.response || error.response.status >= 500 || error.code === 'ECONNABORTED');
        
        if (shouldRetry) {
          (config as any)._retryCount = retryCount + 1;
          
          // Exponential backoff with jitter
          const delay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 1000, 10000);
          
          this.logger.warn(`Retrying request (attempt ${retryCount + 1}/${maxRetries})`, {
            url: config.url,
            delay,
            status: error.response?.status
          });
          
          await sleep(delay);
          return this.client(config);
        }
        
        // If no retry, throw error
        const message = (error.response?.data as any)?.message || error.message;
        const status = error.response?.status || 500;
        
        this.logger.error('API Error', {
          status,
          message,
          url: error.config?.url,
          retryCount
        });
        
        throw new ExternalAPIError(`EODHD API Error: ${message}`, status);
      }
    );
  }

  /**
   * Get real-time quote for a symbol
   * API Cost: 1 call
   */
  async getRealTimeQuote(symbol: string): Promise<RealTimeQuote> {
    try {
      const response = await this.client.get<RealTimeQuote>(
        `/real-time/${symbol}.US`,
        {
          params: { 
            api_token: this.apiKey,
            fmt: 'json'
          }
        }
      );
      
      this.logger.info(`Fetched real-time quote for ${symbol}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch real-time quote for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Get historical EOD data
   * API Cost: 1 call
   */
  async getHistoricalData(
    symbol: string, 
    days: number = 60,
    from?: string,
    to?: string
  ): Promise<EODData[]> {
    const fromDate = from || this.getDateString(days);
    const toDate = to || this.getDateString(0);
    
    try {
      const response = await this.client.get<EODData[]>(
        `/eod/${symbol}.US`,
        {
          params: {
            api_token: this.apiKey,
            from: fromDate,
            to: toDate,
            fmt: 'json'
          }
        }
      );
      
      this.logger.info(`Fetched ${response.data.length} days of historical data for ${symbol}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch historical data for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Get intraday data with specified interval
   * API Cost: 1 call
   */
  async getIntradayData(
    symbol: string, 
    interval: '1m' | '5m' | '1h' = '5m',
    from?: string,
    to?: string
  ): Promise<IntradayData[]> {
    try {
      const params: any = {
        api_token: this.apiKey,
        interval: interval,
        fmt: 'json'
      };

      if (from) params.from = from;
      if (to) params.to = to;

      const response = await this.client.get<IntradayData[]>(
        `/intraday/${symbol}.US`,
        { params }
      );
      
      this.logger.info(`Fetched ${response.data.length} intraday data points for ${symbol}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch intraday data for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Get RSI technical indicator
   * API Cost: 5 calls
   */
  async getRSI(symbol: string, period: number = 14): Promise<TechnicalIndicator[]> {
    try {
      const response = await this.client.get<TechnicalIndicator[]>(
        `/technical/${symbol}.US`,
        {
          params: {
            api_token: this.apiKey,
            function: 'rsi',
            period: period,
            fmt: 'json'
          }
        }
      );
      
      this.logger.info(`Fetched RSI(${period}) for ${symbol}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch RSI for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Get MACD indicator
   * API Cost: 5 calls
   */
  async getMACD(
    symbol: string, 
    fastPeriod = 12, 
    slowPeriod = 26, 
    signalPeriod = 9
  ): Promise<MACDData[]> {
    try {
      const response = await this.client.get<MACDData[]>(
        `/technical/${symbol}.US`,
        {
          params: {
            api_token: this.apiKey,
            function: 'macd',
            fast_period: fastPeriod,
            slow_period: slowPeriod,
            signal_period: signalPeriod,
            fmt: 'json'
          }
        }
      );
      
      this.logger.info(`Fetched MACD(${fastPeriod},${slowPeriod},${signalPeriod}) for ${symbol}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch MACD for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Get SMA (Simple Moving Average)
   * API Cost: 5 calls
   */
  async getSMA(symbol: string, period: number = 20): Promise<TechnicalIndicator[]> {
    try {
      const response = await this.client.get<TechnicalIndicator[]>(
        `/technical/${symbol}.US`,
        {
          params: {
            api_token: this.apiKey,
            function: 'sma',
            period: period,
            fmt: 'json'
          }
        }
      );
      
      this.logger.info(`Fetched SMA(${period}) for ${symbol}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch SMA for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Get Bollinger Bands
   * API Cost: 5 calls
   */
  async getBollingerBands(
    symbol: string, 
    period: number = 20,
    stdDev: number = 2
  ): Promise<BollingerBandsData[]> {
    try {
      const response = await this.client.get<BollingerBandsData[]>(
        `/technical/${symbol}.US`,
        {
          params: {
            api_token: this.apiKey,
            function: 'bbands',
            period: period,
            std_dev: stdDev,
            fmt: 'json'
          }
        }
      );
      
      this.logger.info(`Fetched Bollinger Bands(${period},${stdDev}) for ${symbol}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch Bollinger Bands for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Get bulk EOD data for an entire exchange
   * API Cost: 1 call per 1000 symbols
   */
  async getBulkEOD(exchange: string = 'US', date?: string): Promise<BulkEODSymbol[]> {
    try {
      const endpoint = date 
        ? `/eod-bulk-last-day/${exchange}/${date}`
        : `/eod-bulk-last-day/${exchange}`;
        
      const response = await this.client.get<BulkEODSymbol[]>(endpoint, {
        params: {
          api_token: this.apiKey,
          fmt: 'json'
        }
      });
      
      this.logger.info(`Fetched bulk EOD data for ${exchange} exchange: ${response.data.length} symbols`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch bulk EOD for ${exchange}`, error);
      throw error;
    }
  }

  /**
   * Helper: Get date string in YYYY-MM-DD format
   */
  private getDateString(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  }

  /**
   * Helper: Check if market is open (US market hours)
   */
  isMarketOpen(): boolean {
    const now = new Date();
    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();
    const day = now.getUTCDay();
    
    // Convert to EST (UTC-5) or EDT (UTC-4)
    const estHour = hour - 5; // Simplified, should account for DST
    
    // Market hours: 9:30 AM - 4:00 PM EST, Monday-Friday
    if (day === 0 || day === 6) return false; // Weekend
    if (estHour < 9 || estHour >= 16) return false;
    if (estHour === 9 && minute < 30) return false;
    
    return true;
  }
}