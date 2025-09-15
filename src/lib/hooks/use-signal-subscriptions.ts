/**
 * React Query hooks for real-time signal subscriptions
 * 
 * Integrates WebSocket subscriptions with React Query cache
 * for automatic updates and optimistic UI
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { signalsService } from '@/lib/services/signals.service'
import { signalKeys } from './use-signals'
import type { SignalEvent, MarketType, SignalResponse, Signal } from '@/types/signals.types'
import { logger } from '@/lib/logger'

interface SubscriptionOptions {
  market?: MarketType
  enabled?: boolean
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
}

interface SubscriptionState {
  isConnected: boolean
  error: Error | null
  lastEvent: SignalEvent | null
}

/**
 * Hook for real-time signal subscriptions
 * Automatically updates React Query cache when new signals arrive
 * 
 * @example
 * const { isConnected, error } = useSignalSubscriptions({
 *   market: 'stocks_us',
 *   onConnect: () => console.log('Connected to signal stream'),
 *   onError: (error) => console.error('Subscription error:', error)
 * })
 */
export function useSignalSubscriptions(options: SubscriptionOptions = {}) {
  const {
    market,
    enabled = true,
    onConnect,
    onDisconnect,
    onError
  } = options

  const queryClient = useQueryClient()
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const reconnectAttemptsRef = useRef(0)

  const [state, setState] = useState<SubscriptionState>({
    isConnected: false,
    error: null,
    lastEvent: null
  })

  /**
   * Handle incoming signal events and update cache
   */
  const handleSignalEvent = useCallback((event: SignalEvent) => {
    logger.info('Signal event received', { type: event.type, signalId: event.signal.id })
    
    setState(prev => ({ ...prev, lastEvent: event }))

    // Update all signal list queries
    queryClient.setQueriesData(
      { queryKey: signalKeys.lists() },
      (oldData: SignalResponse | undefined) => {
        if (!oldData) return oldData

        switch (event.type) {
          case 'created':
            // Add new signal to the beginning of the list
            return {
              ...oldData,
              data: [event.signal, ...oldData.data],
              count: oldData.count + 1
            }

          case 'updated':
            // Update existing signal
            return {
              ...oldData,
              data: oldData.data.map(signal =>
                signal.id === event.signal.id ? event.signal : signal
              )
            }

          case 'expired':
            // Mark signal as expired
            return {
              ...oldData,
              data: oldData.data.map(signal =>
                signal.id === event.signal.id 
                  ? { ...signal, is_expired: true }
                  : signal
              )
            }

          default:
            return oldData
        }
      }
    )

    // Update individual signal queries
    if (event.type !== 'created') {
      queryClient.setQueryData(
        signalKeys.detail(event.signal.id),
        (oldData: Signal | null | undefined) => {
          if (!oldData) return oldData
          
          return event.type === 'expired'
            ? { ...oldData, is_expired: true }
            : event.signal
        }
      )
    }

    // Invalidate analytics when signals change
    queryClient.invalidateQueries({ 
      queryKey: signalKeys.analytics(),
      refetchType: 'none' // Don't refetch immediately
    })
  }, [queryClient])

  /**
   * Establish WebSocket connection with reconnection logic
   */
  const connect = useCallback(() => {
    if (!enabled || unsubscribeRef.current) return

    try {
      logger.info('Connecting to signal stream', { market })
      
      const unsubscribe = signalsService.subscribeToSignals(
        { market },
        handleSignalEvent
      )

      unsubscribeRef.current = unsubscribe
      reconnectAttemptsRef.current = 0
      
      setState(prev => ({ 
        ...prev, 
        isConnected: true, 
        error: null 
      }))
      
      onConnect?.()
    } catch (error) {
      const err = error as Error
      logger.error('Failed to connect to signal stream', err)
      
      setState(prev => ({ 
        ...prev, 
        isConnected: false, 
        error: err 
      }))
      
      onError?.(err)
      
      // Attempt reconnection with exponential backoff
      scheduleReconnect()
    }
  }, [enabled, market, handleSignalEvent, onConnect, onError])

  /**
   * Disconnect WebSocket and cleanup
   */
  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = undefined
    }

    setState(prev => ({ 
      ...prev, 
      isConnected: false 
    }))
    
    onDisconnect?.()
  }, [onDisconnect])

  /**
   * Schedule reconnection with exponential backoff
   */
  const scheduleReconnect = useCallback(() => {
    const attempts = reconnectAttemptsRef.current
    const delay = Math.min(1000 * Math.pow(2, attempts), 30000) // Max 30s
    
    logger.info(`Scheduling reconnection in ${delay}ms (attempt ${attempts + 1})`)
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++
      connect()
    }, delay)
  }, [connect])

  /**
   * Manual reconnection trigger
   */
  const reconnect = useCallback(() => {
    disconnect()
    reconnectAttemptsRef.current = 0
    connect()
  }, [disconnect, connect])

  // Setup and cleanup effect
  useEffect(() => {
    connect()
    
    // Listen for online/offline events
    const handleOnline = () => {
      logger.info('Network online, reconnecting...')
      reconnect()
    }
    
    const handleOffline = () => {
      logger.info('Network offline')
      disconnect()
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Listen for visibility change to pause/resume
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logger.info('Page hidden, disconnecting...')
        disconnect()
      } else {
        logger.info('Page visible, reconnecting...')
        connect()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      disconnect()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connect, disconnect, reconnect])

  return {
    ...state,
    reconnect
  }
}

/**
 * Hook to get subscription status across all markets
 * Useful for showing global connection status
 */
export function useSignalSubscriptionStatus() {
  const stocksSubscription = useSignalSubscriptions({ 
    market: 'stocks_us',
    enabled: false // Start disabled, let components enable
  })
  
  const cryptoSubscription = useSignalSubscriptions({ 
    market: 'crypto',
    enabled: false 
  })
  
  const forexSubscription = useSignalSubscriptions({ 
    market: 'forex',
    enabled: false 
  })

  const isAnyConnected = 
    stocksSubscription.isConnected || 
    cryptoSubscription.isConnected || 
    forexSubscription.isConnected

  const hasAnyError = 
    stocksSubscription.error || 
    cryptoSubscription.error || 
    forexSubscription.error

  return {
    isConnected: isAnyConnected,
    hasError: !!hasAnyError,
    subscriptions: {
      stocks: stocksSubscription,
      crypto: cryptoSubscription,
      forex: forexSubscription
    }
  }
}

// Export types for external use
export type { SubscriptionOptions, SubscriptionState, SignalEvent }