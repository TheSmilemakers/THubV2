import { EODHDService, RealTimeQuote } from './eodhd.service';
import { EODHDWebSocketService, WSMessage, WSTradeData } from './eodhd-websocket.service';
import { getCacheService } from './cache.service';
import { getRateLimiter } from './rate-limiter.service';
import { logger } from '@/lib/logger';
import { ExternalAPIError } from '@/lib/errors';

export interface EnrichedMarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  high52w?: number;
  low52w?: number;
  lastUpdate: Date;
  isRealTime: boolean;
  source: 'websocket' | 'rest-api' | 'cache';
}

export interface MarketDataSubscription {
  symbol: string;
  onUpdate: (data: EnrichedMarketData) => void;
  onError?: (error: Error) => void;
}

/**
 * Market Data Enrichment Service
 * Combines REST API, WebSocket, and cached data for comprehensive market information
 * Automatically handles fallbacks and optimizes API usage
 */
export class MarketDataEnrichmentService {
  private eodhd: EODHDService;
  private websocket: EODHDWebSocketService;
  private cache = getCacheService();
  private rateLimiter = getRateLimiter();
  private logger = logger.createChild('MarketDataEnrichment');
  
  private subscriptions = new Map<string, MarketDataSubscription[]>();
  private realtimeData = new Map<string, EnrichedMarketData>();
  private isWebSocketConnected = false;
  
  constructor() {
    this.eodhd = new EODHDService();
    this.websocket = new EODHDWebSocketService();
    
    this.setupWebSocketHandlers();
  }

  /**
   * Initialize WebSocket connection for real-time data
   */
  async initialize(): Promise<void> {
    try {
      await this.websocket.connect('US_TRADE');
      this.isWebSocketConnected = true;
      this.logger.info('Market data enrichment service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize WebSocket, using REST API only', error);
      this.isWebSocketConnected = false;
    }
  }

  /**
   * Subscribe to real-time updates for a symbol
   */
  async subscribe(subscription: MarketDataSubscription): Promise<void> {
    const { symbol } = subscription;
    
    // Add subscription to map
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, []);
    }
    this.subscriptions.get(symbol)!.push(subscription);
    
    // Get initial data
    try {
      const initialData = await this.getEnrichedData(symbol);
      subscription.onUpdate(initialData);
    } catch (error) {
      this.logger.error(`Failed to get initial data for ${symbol}`, error);
      subscription.onError?.(error instanceof Error ? error : new Error('Unknown error'));
    }
    
    // Subscribe to WebSocket if available
    if (this.isWebSocketConnected) {
      try {
        await this.websocket.subscribe([symbol]);
        this.logger.debug(`Subscribed to real-time updates for ${symbol}`);
      } catch (error) {
        this.logger.warn(`WebSocket subscription failed for ${symbol}, using polling`, error);
        this.startPolling(symbol);
      }
    } else {
      // Fallback to polling
      this.startPolling(symbol);
    }
  }

  /**
   * Unsubscribe from a symbol
   */
  async unsubscribe(symbol: string, subscription: MarketDataSubscription): Promise<void> {
    const subscriptions = this.subscriptions.get(symbol) || [];
    const index = subscriptions.indexOf(subscription);
    
    if (index > -1) {
      subscriptions.splice(index, 1);
    }
    
    // If no more subscriptions, clean up
    if (subscriptions.length === 0) {
      this.subscriptions.delete(symbol);
      this.realtimeData.delete(symbol);
      
      // Unsubscribe from WebSocket
      if (this.isWebSocketConnected) {
        try {
          await this.websocket.unsubscribe([symbol]);
        } catch (error) {
          this.logger.warn(`Failed to unsubscribe from ${symbol}`, error);
        }
      }
    }
  }

  /**
   * Get enriched market data with multiple fallback strategies
   */
  async getEnrichedData(symbol: string): Promise<EnrichedMarketData> {
    // 1. Try real-time cache first
    const cached = this.realtimeData.get(symbol);
    if (cached && Date.now() - cached.lastUpdate.getTime() < 5000) { // 5 second freshness
      return cached;
    }
    
    // 2. Try WebSocket data if available
    if (this.isWebSocketConnected) {
      const wsData = this.realtimeData.get(symbol);
      if (wsData && wsData.isRealTime) {
        return wsData;
      }
    }
    
    // 3. Fetch from REST API with rate limiting
    try {
      const canProceed = await this.rateLimiter.checkLimit(1);
      if (!canProceed) {
        // Fall back to cache even if stale
        const staleData = await this.cache.get(`market_data:${symbol}`);
        if (staleData) {
          this.logger.debug(`Using stale cache for ${symbol} due to rate limits`);
          return {
            ...staleData,
            source: 'cache',
            isRealTime: false
          };
        }
        throw new ExternalAPIError('Rate limit reached and no cached data available');
      }

      const quote = await this.eodhd.getRealTimeQuote(symbol);
      const enrichedData = this.convertToEnrichedData(quote, 'rest-api');
      
      // Cache the data
      await this.cache.set(`market_data:${symbol}`, enrichedData, 300); // 5 minutes
      this.realtimeData.set(symbol, enrichedData);
      
      return enrichedData;
      
    } catch (error) {
      this.logger.error(`Failed to fetch enriched data for ${symbol}`, error);
      
      // Last resort: try cache
      const cachedData = await this.cache.get(`market_data:${symbol}`);
      if (cachedData) {
        return {
          ...cachedData,
          source: 'cache',
          isRealTime: false
        };
      }
      
      throw error;
    }
  }

  /**
   * Get batch enriched data for multiple symbols
   */
  async getBatchEnrichedData(symbols: string[]): Promise<Map<string, EnrichedMarketData>> {
    const results = new Map<string, EnrichedMarketData>();
    const promises = symbols.map(async (symbol) => {
      try {
        const data = await this.getEnrichedData(symbol);
        results.set(symbol, data);
      } catch (error) {
        this.logger.error(`Failed to get enriched data for ${symbol}`, error);
      }
    });
    
    await Promise.all(promises);
    return results;
  }

  /**
   * Setup WebSocket message handlers
   */
  private setupWebSocketHandlers(): void {
    this.websocket.onMessage((message: WSMessage) => {
      if (message.type === 'trade' && message.data) {
        const tradeData = message.data as WSTradeData;
        this.handleRealtimeUpdate(tradeData);
      }
    });

    this.websocket.onConnect(() => {
      this.isWebSocketConnected = true;
      this.logger.info('WebSocket connected for real-time market data');
    });

    this.websocket.onDisconnect(() => {
      this.isWebSocketConnected = false;
      this.logger.warn('WebSocket disconnected, falling back to REST API');
    });

    this.websocket.onError((error) => {
      this.logger.error('WebSocket error', error);
    });
  }

  /**
   * Handle real-time WebSocket updates
   */
  private handleRealtimeUpdate(tradeData: WSTradeData): void {
    const { s: symbol, p: price, v: volume, t: timestamp } = tradeData;
    
    // Get existing data or create new
    const existing = this.realtimeData.get(symbol);
    const previousPrice = existing?.price || price;
    
    const enrichedData: EnrichedMarketData = {
      symbol,
      price,
      change: price - previousPrice,
      changePercent: previousPrice !== 0 ? ((price - previousPrice) / previousPrice) * 100 : 0,
      volume,
      lastUpdate: new Date(timestamp),
      isRealTime: true,
      source: 'websocket',
      // Preserve additional data if available
      marketCap: existing?.marketCap,
      pe: existing?.pe,
      high52w: existing?.high52w,
      low52w: existing?.low52w,
    };
    
    this.realtimeData.set(symbol, enrichedData);
    
    // Notify subscribers
    const subscriptions = this.subscriptions.get(symbol) || [];
    subscriptions.forEach(subscription => {
      try {
        subscription.onUpdate(enrichedData);
      } catch (error) {
        this.logger.error(`Error in subscription callback for ${symbol}`, error);
      }
    });
  }

  /**
   * Start polling for symbols when WebSocket is not available
   */
  private startPolling(symbol: string): void {
    // Simple polling every 10 seconds for symbols without WebSocket
    const pollInterval = setInterval(async () => {
      if (!this.subscriptions.has(symbol)) {
        clearInterval(pollInterval);
        return;
      }
      
      try {
        const data = await this.getEnrichedData(symbol);
        const subscriptions = this.subscriptions.get(symbol) || [];
        subscriptions.forEach(subscription => subscription.onUpdate(data));
      } catch (error) {
        this.logger.error(`Polling failed for ${symbol}`, error);
      }
    }, 10000);
  }

  /**
   * Convert EODHD quote to enriched data format
   */
  private convertToEnrichedData(quote: RealTimeQuote, source: 'rest-api' | 'cache'): EnrichedMarketData {
    return {
      symbol: quote.code,
      price: quote.close,
      change: quote.change,
      changePercent: quote.change_p,
      volume: quote.volume,
      lastUpdate: new Date(quote.timestamp * 1000),
      isRealTime: source === 'rest-api',
      source,
    };
  }

  /**
   * Get subscription statistics
   */
  getStats() {
    return {
      totalSubscriptions: Array.from(this.subscriptions.values()).reduce((sum, subs) => sum + subs.length, 0),
      uniqueSymbols: this.subscriptions.size,
      realtimeSymbols: Array.from(this.realtimeData.values()).filter(data => data.isRealTime).length,
      websocketConnected: this.isWebSocketConnected,
    };
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    // Clear all subscriptions
    this.subscriptions.clear();
    this.realtimeData.clear();
    
    // Disconnect WebSocket
    if (this.isWebSocketConnected) {
      await this.websocket.disconnect();
    }
    
    this.logger.info('Market data enrichment service destroyed');
  }
}

// Singleton instance
let instance: MarketDataEnrichmentService | null = null;

export function getMarketDataEnrichmentService(): MarketDataEnrichmentService {
  if (!instance) {
    instance = new MarketDataEnrichmentService();
    // Initialize in background
    instance.initialize().catch(error => {
      logger.error('Failed to initialize market data enrichment service', error);
    });
  }
  return instance;
}