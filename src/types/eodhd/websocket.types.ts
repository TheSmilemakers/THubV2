/**
 * EODHD WebSocket API Types
 * Types for real-time streaming data via WebSocket
 */

import { Symbol } from './common.types';

/**
 * WebSocket Connection State
 */
export type WebSocketState = 
  | 'connecting'
  | 'connected'
  | 'authenticated'
  | 'disconnected'
  | 'error';

/**
 * WebSocket Message Types
 */
export type WebSocketMessageType =
  | 'auth'
  | 'subscribe'
  | 'unsubscribe'
  | 'ping'
  | 'pong'
  | 'quote'
  | 'trade'
  | 'orderbook'
  | 'error'
  | 'info';

/**
 * Base WebSocket Message
 */
export interface WebSocketMessage {
  type: WebSocketMessageType;
  timestamp?: number;
}

/**
 * Authentication Message
 */
export interface AuthMessage extends WebSocketMessage {
  type: 'auth';
  action: 'login';
  apiToken: string;
}

/**
 * Authentication Response
 */
export interface AuthResponse extends WebSocketMessage {
  type: 'auth';
  status: 'ok' | 'error';
  message?: string;
}

/**
 * Subscribe Message
 */
export interface SubscribeMessage extends WebSocketMessage {
  type: 'subscribe';
  action: 'subscribe';
  symbols: string | string[];
  channels?: ('quotes' | 'trades' | 'orderbook')[];
}

/**
 * Unsubscribe Message
 */
export interface UnsubscribeMessage extends WebSocketMessage {
  type: 'unsubscribe';
  action: 'unsubscribe';
  symbols: string | string[];
}

/**
 * Subscription Response
 */
export interface SubscriptionResponse extends WebSocketMessage {
  type: 'info';
  status: 'ok' | 'error';
  subscribed?: string[];
  unsubscribed?: string[];
  message?: string;
}

/**
 * Real-time Quote
 */
export interface WebSocketQuote extends WebSocketMessage {
  type: 'quote';
  s: Symbol; // Symbol
  t: number; // Timestamp
  p: number; // Price
  v: number; // Volume
  b?: number; // Bid
  a?: number; // Ask
  bs?: number; // Bid size
  as?: number; // Ask size
}

/**
 * Real-time Trade
 */
export interface WebSocketTrade extends WebSocketMessage {
  type: 'trade';
  s: Symbol; // Symbol
  t: number; // Timestamp
  p: number; // Price
  v: number; // Volume
  c?: string[]; // Conditions
  e?: string; // Exchange
}

/**
 * Real-time Order Book
 */
export interface WebSocketOrderBook extends WebSocketMessage {
  type: 'orderbook';
  s: Symbol; // Symbol
  t: number; // Timestamp
  b: Array<[number, number]>; // Bids [price, size]
  a: Array<[number, number]>; // Asks [price, size]
}

/**
 * WebSocket Error Message
 */
export interface WebSocketErrorMessage extends WebSocketMessage {
  type: 'error';
  code: number;
  message: string;
  details?: any;
}

/**
 * Info Message
 */
export interface WebSocketInfo extends WebSocketMessage {
  type: 'info';
  message: string;
  data?: any;
}

/**
 * Ping/Pong Messages
 */
export interface PingMessage extends WebSocketMessage {
  type: 'ping';
}

export interface PongMessage extends WebSocketMessage {
  type: 'pong';
}

/**
 * WebSocket Configuration
 */
export interface WebSocketConfig {
  url?: string; // Default: wss://ws.eodhd.com/ws
  apiToken: string;
  reconnect?: boolean; // Auto-reconnect on disconnect
  reconnectInterval?: number; // Milliseconds between reconnect attempts
  maxReconnectAttempts?: number;
  pingInterval?: number; // Keep-alive ping interval
  subscribeOnConnect?: string[]; // Auto-subscribe to symbols
  channels?: ('quotes' | 'trades' | 'orderbook')[];
}

/**
 * WebSocket Event Handlers
 */
export interface WebSocketHandlers {
  onConnect?: () => void;
  onAuthenticated?: () => void;
  onDisconnect?: (code: number, reason: string) => void;
  onError?: (error: WebSocketErrorMessage) => void;
  onQuote?: (quote: WebSocketQuote) => void;
  onTrade?: (trade: WebSocketTrade) => void;
  onOrderBook?: (orderBook: WebSocketOrderBook) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

/**
 * WebSocket Client Interface
 */
export interface IWebSocketClient {
  state: WebSocketState;
  connect(): Promise<void>;
  disconnect(): void;
  subscribe(symbols: string | string[]): void;
  unsubscribe(symbols: string | string[]): void;
  send(message: any): void;
  on(event: keyof WebSocketHandlers, handler: Function): void;
  off(event: keyof WebSocketHandlers, handler: Function): void;
}

/**
 * WebSocket Statistics
 */
export interface WebSocketStats {
  connected: boolean;
  connectedAt?: Date;
  messagesReceived: number;
  messagesSent: number;
  subscribedSymbols: string[];
  reconnectCount: number;
  lastError?: WebSocketErrorMessage;
  latency?: number;
}