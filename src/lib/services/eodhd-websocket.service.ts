import { logger } from '@/lib/logger';
import { ExternalAPIError } from '@/lib/errors';

// WebSocket message types
export interface WSTradeData {
  s: string;  // Symbol
  p: number;  // Price
  v: number;  // Volume
  t: number;  // Timestamp
  c?: string[]; // Conditions
}

export interface WSQuoteData {
  s: string;  // Symbol
  bp: number; // Bid price
  bs: number; // Bid size
  ap: number; // Ask price
  as: number; // Ask size
  t: number;  // Timestamp
}

export interface WSMessage {
  type: 'trade' | 'quote' | 'subscribe' | 'unsubscribe' | 'error';
  data?: WSTradeData | WSQuoteData;
  symbols?: string[];
  message?: string;
}

export type MarketType = 'US_TRADE' | 'US_QUOTE' | 'FOREX' | 'CRYPTO';

/**
 * WebSocket service for real-time EODHD data
 * Handles connection, reconnection, and subscription management
 * Supports up to 50 concurrent symbol subscriptions
 */
export class EODHDWebSocketService {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private subscribedSymbols: Set<string> = new Set();
  private logger = logger.createChild('EODHDWebSocket');
  private isReconnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000; // Start with 5 seconds
  
  // Callbacks
  private onMessageCallback?: (data: WSMessage) => void;
  private onConnectCallback?: () => void;
  private onDisconnectCallback?: () => void;
  private onErrorCallback?: (error: any) => void;
  
  // WebSocket endpoints
  private readonly WS_URLS: Record<MarketType, string> = {
    US_TRADE: 'wss://ws.eodhistoricaldata.com/ws/us',
    US_QUOTE: 'wss://ws.eodhistoricaldata.com/ws/us-quote',
    FOREX: 'wss://ws.eodhistoricaldata.com/ws/forex',
    CRYPTO: 'wss://ws.eodhistoricaldata.com/ws/crypto'
  };
  
  // Maximum symbols per connection (EODHD limit)
  private readonly MAX_SYMBOLS = 50;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.EODHD_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('EODHD_API_KEY is not set');
    }
  }

  /**
   * Connect to EODHD WebSocket
   * @param market Market type to connect to
   * @param callbacks Event callbacks
   */
  connect(
    market: MarketType = 'US_TRADE',
    callbacks?: {
      onMessage?: (data: WSMessage) => void;
      onConnect?: () => void;
      onDisconnect?: () => void;
      onError?: (error: any) => void;
    }
  ): void {
    // Store callbacks
    if (callbacks?.onMessage) this.onMessageCallback = callbacks.onMessage;
    if (callbacks?.onConnect) this.onConnectCallback = callbacks.onConnect;
    if (callbacks?.onDisconnect) this.onDisconnectCallback = callbacks.onDisconnect;
    if (callbacks?.onError) this.onErrorCallback = callbacks.onError;
    
    try {
      // Clean up existing connection
      this.cleanup();
      
      const url = `${this.WS_URLS[market]}?api_token=${this.apiKey}`;
      this.logger.info(`Connecting to ${market} WebSocket...`);
      
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        this.logger.info(`WebSocket connected to ${market}`);
        this.isReconnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 5000; // Reset delay
        
        // Resubscribe to previously subscribed symbols
        this.resubscribeSymbols();
        
        // Start ping interval to keep connection alive
        this.startPingInterval();
        
        // Notify callback
        this.onConnectCallback?.();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          this.logger.error('Failed to parse WebSocket message', error);
        }
      };

      this.ws.onerror = (error: Event) => {
        this.logger.error('WebSocket error:', error);
        this.onErrorCallback?.(error);
      };

      this.ws.onclose = (event: CloseEvent) => {
        this.logger.info(`WebSocket disconnected: ${event.code} - ${event.reason}`);
        this.cleanup();
        this.onDisconnectCallback?.();
        
        // Schedule reconnection if not manually disconnected
        if (!this.isReconnecting && event.code !== 1000) {
          this.scheduleReconnect(market);
        }
      };
    } catch (error) {
      this.logger.error('Failed to connect WebSocket:', error);
      this.scheduleReconnect(market);
    }
  }

  /**
   * Subscribe to symbols for real-time updates
   * @param symbols Array of symbols to subscribe (max 50 total)
   */
  subscribe(symbols: string[]): void {
    // Validate symbol limit
    const totalSymbols = this.subscribedSymbols.size + symbols.length;
    if (totalSymbols > this.MAX_SYMBOLS) {
      const available = this.MAX_SYMBOLS - this.subscribedSymbols.size;
      throw new Error(
        `Cannot subscribe to ${symbols.length} symbols. ` +
        `Only ${available} slots available (max ${this.MAX_SYMBOLS})`
      );
    }
    
    // Add to subscribed set
    symbols.forEach(symbol => this.subscribedSymbols.add(symbol.toUpperCase()));
    
    // Send subscription if connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        action: 'subscribe',
        symbols: symbols.map(s => s.toUpperCase())
      };
      
      this.ws.send(JSON.stringify(message));
      this.logger.info(`Subscribed to symbols: ${symbols.join(', ')}`);
    } else {
      this.logger.warn('WebSocket not connected, symbols queued for subscription');
    }
  }

  /**
   * Unsubscribe from symbols
   * @param symbols Array of symbols to unsubscribe
   */
  unsubscribe(symbols: string[]): void {
    // Remove from subscribed set
    symbols.forEach(symbol => this.subscribedSymbols.delete(symbol.toUpperCase()));
    
    // Send unsubscription if connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        action: 'unsubscribe',
        symbols: symbols.map(s => s.toUpperCase())
      };
      
      this.ws.send(JSON.stringify(message));
      this.logger.info(`Unsubscribed from symbols: ${symbols.join(', ')}`);
    }
  }

  /**
   * Get list of currently subscribed symbols
   */
  getSubscribedSymbols(): string[] {
    return Array.from(this.subscribedSymbols);
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get number of available subscription slots
   */
  getAvailableSlots(): number {
    return this.MAX_SYMBOLS - this.subscribedSymbols.size;
  }

  /**
   * Disconnect WebSocket and cleanup
   */
  disconnect(): void {
    this.logger.info('Disconnecting WebSocket...');
    this.isReconnecting = false; // Prevent auto-reconnect
    this.cleanup();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.subscribedSymbols.clear();
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: any): void {
    // Transform raw data into standardized format
    let message: WSMessage;
    
    if (data.status === 'ok' && data.type) {
      // Subscription confirmation
      message = {
        type: data.type,
        symbols: data.symbols
      };
    } else if (data.status === 'error') {
      // Error message
      message = {
        type: 'error',
        message: data.message
      };
      this.logger.error('WebSocket error message:', data.message);
    } else if (data.s && data.p !== undefined) {
      // Trade data
      message = {
        type: 'trade',
        data: data as WSTradeData
      };
    } else if (data.s && data.bp !== undefined) {
      // Quote data
      message = {
        type: 'quote',
        data: data as WSQuoteData
      };
    } else {
      // Unknown message type
      this.logger.warn('Unknown WebSocket message type:', data);
      return;
    }
    
    // Send to callback
    this.onMessageCallback?.(message);
  }

  /**
   * Resubscribe to all previously subscribed symbols
   */
  private resubscribeSymbols(): void {
    if (this.subscribedSymbols.size > 0) {
      const symbols = Array.from(this.subscribedSymbols);
      this.logger.info(`Resubscribing to ${symbols.length} symbols`);
      
      // Clear and re-add to trigger subscription
      this.subscribedSymbols.clear();
      this.subscribe(symbols);
    }
  }

  /**
   * Schedule WebSocket reconnection with exponential backoff
   */
  private scheduleReconnect(market: MarketType): void {
    if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.logger.error('Max reconnection attempts reached, giving up');
      }
      return;
    }
    
    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    // Exponential backoff with jitter
    const jitter = Math.random() * 1000;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1) + jitter,
      60000 // Max 1 minute
    );
    
    this.logger.info(
      `Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} ` +
      `in ${Math.round(delay / 1000)}s`
    );
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect(market);
    }, delay);
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.stopPingInterval();
    
    // Send ping every 30 seconds
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ action: 'ping' }));
      }
    }, 30000);
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Cleanup timeouts and intervals
   */
  private cleanup(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.stopPingInterval();
  }

  // Method aliases for backward compatibility
  onMessage(callback: (data: WSMessage) => void): void {
    this.onMessageCallback = callback;
  }

  onConnect(callback: () => void): void {
    this.onConnectCallback = callback;
  }

  onDisconnect(callback: () => void): void {
    this.onDisconnectCallback = callback;
  }

  onError(callback: (error: any) => void): void {
    this.onErrorCallback = callback;
  }
}

// Singleton instance
let webSocketInstance: EODHDWebSocketService | null = null;

/**
 * Get singleton WebSocket service instance
 */
export function getWebSocketService(apiKey?: string): EODHDWebSocketService {
  if (!webSocketInstance) {
    webSocketInstance = new EODHDWebSocketService(apiKey);
  }
  return webSocketInstance;
}