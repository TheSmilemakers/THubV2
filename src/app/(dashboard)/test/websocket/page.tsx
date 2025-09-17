'use client';

import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { AdaptiveButton } from '@/components/ui/adaptive-button';
import { GlassInput } from '@/components/ui/glass-input';
import { useToast, ToastProvider, useToastHelpers } from '@/components/ui/toast';
import { WSMessage, WSTradeData, WSQuoteData } from '@/lib/services/eodhd-websocket.service';

interface ConnectionStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  message?: string;
  timestamp?: Date;
}

interface TradeUpdate {
  symbol: string;
  price: number;
  volume: number;
  timestamp: Date;
  change?: number;
  changePercent?: number;
}

function WebSocketTestContent() {
  const { showSuccess, showError, showWarning, showInfo } = useToastHelpers();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'disconnected'
  });
  const [subscribedSymbols, setSubscribedSymbols] = useState<string[]>([]);
  const [symbolInput, setSymbolInput] = useState('');
  const [tradeUpdates, setTradeUpdates] = useState<TradeUpdate[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const priceHistoryRef = useRef<Map<string, number>>(new Map());

  // Connect to WebSocket
  const connect = async () => {
    try {
      setIsLoading(true);
      setConnectionStatus({ status: 'connecting' });
      
      // Get API key from environment
      const apiKey = process.env.NEXT_PUBLIC_EODHD_API_KEY || '';
      
      if (!apiKey) {
        throw new Error('EODHD API key not found in environment');
      }
      
      // Connect to US trade stream
      const wsUrl = `wss://ws.eodhistoricaldata.com/ws/us?api_token=${apiKey}`;
      
      console.log('Connecting to EODHD WebSocket...');
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully');
        setConnectionStatus({
          status: 'connected',
          message: 'Connected to EODHD real-time stream',
          timestamp: new Date()
        });
        showSuccess('Ready for real-time data.', 'WebSocket connected!');
        setIsLoading(false);
        
        // Subscribe to default symbols
        if (subscribedSymbols.length === 0) {
          subscribeToSymbols(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']);
        }
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus({
          status: 'error',
          message: 'WebSocket connection error',
          timestamp: new Date()
        });
        setIsLoading(false);
      };
      
      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus({
          status: 'disconnected',
          message: `Disconnected: ${event.reason || 'Connection closed'}`,
          timestamp: new Date()
        });
        wsRef.current = null;
        setIsLoading(false);
      };
      
    } catch (error) {
      console.error('Failed to connect:', error);
      setConnectionStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection failed',
        timestamp: new Date()
      });
      setIsLoading(false);
      showError('Failed to connect to WebSocket', 'Connection Failed');
    }
  };
  
  // Disconnect from WebSocket
  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
  };
  
  // Subscribe to symbols
  const subscribeToSymbols = (symbols: string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      showError('WebSocket not connected', 'Not Connected');
      return;
    }
    
    const message = {
      action: 'subscribe',
      symbols: symbols.map(s => s.toUpperCase())
    };
    
    wsRef.current.send(JSON.stringify(message));
    setSubscribedSymbols(prev => [...new Set([...prev, ...symbols])]);
    showSuccess(`Now tracking ${symbols.join(', ')}`, 'Subscribed');
  };
  
  // Unsubscribe from symbols
  const unsubscribeFromSymbol = (symbol: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    
    const message = {
      action: 'unsubscribe',
      symbols: [symbol]
    };
    
    wsRef.current.send(JSON.stringify(message));
    setSubscribedSymbols(prev => prev.filter(s => s !== symbol));
    priceHistoryRef.current.delete(symbol);
  };
  
  // Handle incoming messages
  const handleMessage = (data: any) => {
    setMessageCount(prev => prev + 1);
    
    // Handle subscription confirmation
    if (data.status === 'ok' && data.type === 'subscribe') {
      console.log('Subscription confirmed for:', data.symbols);
      return;
    }
    
    // Handle error messages
    if (data.status === 'error') {
      showError(data.message, 'WebSocket Error');
      return;
    }
    
    // Handle trade data
    if (data.s && data.p !== undefined) {
      const symbol = data.s;
      const price = data.p;
      const previousPrice = priceHistoryRef.current.get(symbol) || price;
      const change = price - previousPrice;
      const changePercent = previousPrice ? (change / previousPrice) * 100 : 0;
      
      // Update price history
      if (previousPrice === price) {
        priceHistoryRef.current.set(symbol, price);
      }
      
      const tradeUpdate: TradeUpdate = {
        symbol,
        price,
        volume: data.v || 0,
        timestamp: new Date(data.t * 1000),
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100
      };
      
      // Update trade history (keep last 50 updates)
      setTradeUpdates(prev => [tradeUpdate, ...prev].slice(0, 50));
      
      // Update price history for next comparison
      priceHistoryRef.current.set(symbol, price);
    }
  };
  
  // Handle symbol input
  const handleAddSymbol = () => {
    const symbol = symbolInput.trim().toUpperCase();
    if (!symbol) return;
    
    if (subscribedSymbols.includes(symbol)) {
      showInfo(`${symbol} is already being tracked`, 'Already Subscribed');
      return;
    }
    
    if (subscribedSymbols.length >= 50) {
      showError('Maximum 50 symbols allowed', 'Limit Reached');
      return;
    }
    
    subscribeToSymbols([symbol]);
    setSymbolInput('');
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">EODHD WebSocket Test</h1>
      
      {/* Connection Status */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Connection Status</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            connectionStatus.status === 'connected' ? 'bg-green-500/20 text-green-500' :
            connectionStatus.status === 'connecting' ? 'bg-yellow-500/20 text-yellow-500' :
            connectionStatus.status === 'error' ? 'bg-red-500/20 text-red-500' :
            'bg-gray-500/20 text-gray-500'
          }`}>
            {connectionStatus.status}
          </span>
        </div>
        
        <div className="space-y-2">
          {connectionStatus.message && (
            <p className="text-sm text-muted-foreground">{connectionStatus.message}</p>
          )}
          {connectionStatus.timestamp && (
            <p className="text-xs text-muted-foreground">
              Last update: {connectionStatus.timestamp.toLocaleTimeString()}
            </p>
          )}
          <p className="text-sm">Messages received: <span className="font-mono">{messageCount}</span></p>
        </div>
        
        <div className="mt-4 flex gap-2">
          {connectionStatus.status === 'disconnected' ? (
            <AdaptiveButton onClick={connect} disabled={isLoading}>
              {isLoading ? 'Connecting...' : 'Connect to WebSocket'}
            </AdaptiveButton>
          ) : (
            <AdaptiveButton onClick={disconnect} variant="destructive">
              Disconnect
            </AdaptiveButton>
          )}
        </div>
      </GlassCard>
      
      {/* Symbol Management */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold mb-4">Symbol Subscriptions</h2>
        
        <div className="flex gap-2 mb-4">
          <form onSubmit={(e) => { e.preventDefault(); handleAddSymbol(); }} className="flex-1 flex gap-2">
            <GlassInput
              value={symbolInput}
              onChange={(value: string) => setSymbolInput(value)}
              placeholder="Enter symbol (e.g., NVDA)"
              disabled={connectionStatus.status !== 'connected'}
            />
            <AdaptiveButton 
              type="submit"
              onClick={handleAddSymbol}
              disabled={connectionStatus.status !== 'connected'}
            >
              Subscribe
            </AdaptiveButton>
          </form>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {subscribedSymbols.map(symbol => (
            <span 
              key={symbol} 
              className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-500 border border-blue-500/30 cursor-pointer hover:bg-blue-500/30 transition-colors"
              onClick={() => unsubscribeFromSymbol(symbol)}
            >
              {symbol} ✕
            </span>
          ))}
          {subscribedSymbols.length === 0 && (
            <p className="text-sm text-muted-foreground">No symbols subscribed</p>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          {subscribedSymbols.length}/50 symbols subscribed
        </p>
      </GlassCard>
      
      {/* Real-Time Updates */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold mb-4">Real-Time Trade Updates</h2>
        
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Time</th>
                <th className="text-left p-2">Symbol</th>
                <th className="text-right p-2">Price</th>
                <th className="text-right p-2">Change</th>
                <th className="text-right p-2">Volume</th>
              </tr>
            </thead>
            <tbody>
              {tradeUpdates.map((update, idx) => (
                <tr key={`${update.symbol}-${update.timestamp.getTime()}-${idx}`} className="border-b">
                  <td className="p-2 text-xs text-muted-foreground">
                    {update.timestamp.toLocaleTimeString()}
                  </td>
                  <td className="p-2 font-medium">{update.symbol}</td>
                  <td className="p-2 text-right font-mono">${update.price.toFixed(2)}</td>
                  <td className={`p-2 text-right font-mono ${
                    update.change && update.change > 0 ? 'text-green-600' : 
                    update.change && update.change < 0 ? 'text-red-600' : ''
                  }`}>
                    {update.change !== undefined ? (
                      `${update.change > 0 ? '+' : ''}${update.change.toFixed(2)} (${update.changePercent?.toFixed(2)}%)`
                    ) : '-'}
                  </td>
                  <td className="p-2 text-right font-mono">
                    {update.volume.toLocaleString()}
                  </td>
                </tr>
              ))}
              {tradeUpdates.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    No trades received yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
      
      {/* Instructions */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Click "Connect to WebSocket" to establish connection</li>
          <li>Default symbols (AAPL, MSFT, GOOGL, AMZN, TSLA) will be subscribed</li>
          <li>Add more symbols using the subscription input (max 50)</li>
          <li>Watch real-time price updates stream in</li>
          <li>Click on a symbol badge to unsubscribe</li>
        </ol>
        <p className="text-sm text-muted-foreground mt-4">
          Note: This uses your EODHD ALL-IN-ONE plan with &lt;50ms latency for US markets
        </p>
      </GlassCard>
    </div>
  );
}

export default function WebSocketTestPage() {
  return (
    <ToastProvider>
      <WebSocketTestContent />
    </ToastProvider>
  );
}