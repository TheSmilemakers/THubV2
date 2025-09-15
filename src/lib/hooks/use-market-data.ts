/**
 * React Query hooks for market data operations
 * 
 * Provides type-safe hooks for fetching market overview data,
 * indices, and dashboard statistics with automatic caching
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import type { RealTimeQuote, IntradayData } from '@/lib/services/eodhd.service'
import { logger } from '@/lib/logger'

// API client for market data - uses server-side API routes
const marketDataAPI = {
  async getRealTimeQuote(symbol: string): Promise<RealTimeQuote> {
    const response = await fetch(`/api/market-data/quote/${symbol}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch quote for ${symbol}`)
    }
    return response.json()
  },

  async getIntradayData(symbol: string, interval: string): Promise<IntradayData[]> {
    const response = await fetch(`/api/market-data/intraday/${symbol}?interval=${interval}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch intraday data for ${symbol}`)
    }
    return response.json()
  },

  async getMarketIndices(): Promise<MarketIndex[]> {
    const response = await fetch('/api/market-data/indices')
    if (!response.ok) {
      throw new Error('Failed to fetch market indices')
    }
    return response.json()
  }
}

// Query key factories for consistent cache key generation
export const marketKeys = {
  all: ['market'] as const,
  quotes: () => [...marketKeys.all, 'quotes'] as const,
  quote: (symbol: string) => [...marketKeys.quotes(), symbol] as const,
  indices: () => [...marketKeys.all, 'indices'] as const,
  intraday: () => [...marketKeys.all, 'intraday'] as const,
  intradayData: (symbol: string, interval: string) => [...marketKeys.intraday(), symbol, interval] as const,
}


export interface MarketIndex {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  isUp: boolean
  data: IntradayData[]
}

export interface DashboardStats {
  active_signals: number
  success_rate: number
  total_profit: number
  avg_return: number
  change_active_signals: string
  change_success_rate: string
  change_total_profit: string
  change_avg_return: string
}

/**
 * Hook to fetch real-time quote for a symbol
 * 
 * @example
 * const { data: quote, isLoading } = useRealTimeQuote('AAPL')
 */
export function useRealTimeQuote(symbol: string): UseQueryResult<RealTimeQuote, Error> {
  return useQuery<RealTimeQuote, Error>({
    queryKey: marketKeys.quote(symbol),
    queryFn: async () => {
      try {
        const quote = await marketDataAPI.getRealTimeQuote(symbol)
        logger.info('Fetched real-time quote', { symbol, price: quote.close })
        return quote
      } catch (error) {
        logger.error('Failed to fetch real-time quote', { symbol, error })
        throw new Error(`Unable to load quote for ${symbol}`)
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 2,
  })
}

/**
 * Hook to fetch intraday data for charting
 * 
 * @example
 * const { data } = useIntradayData('AAPL', '1m')
 */
export function useIntradayData(
  symbol: string, 
  interval: '1m' | '5m' | '1h' = '5m'
): UseQueryResult<IntradayData[], Error> {
  return useQuery<IntradayData[], Error>({
    queryKey: marketKeys.intradayData(symbol, interval),
    queryFn: async () => {
      try {
        const data = await marketDataAPI.getIntradayData(symbol, interval)
        logger.info('Fetched intraday data', { symbol, interval, points: data.length })
        return data
      } catch (error) {
        logger.error('Failed to fetch intraday data', { symbol, interval, error })
        throw new Error(`Unable to load chart data for ${symbol}`)
      }
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    retry: 2,
  })
}

/**
 * Hook to fetch major market indices for dashboard overview
 * 
 * @example
 * const { data: indices, isLoading } = useMarketIndices()
 */
export function useMarketIndices(): UseQueryResult<MarketIndex[], Error> {
  return useQuery<MarketIndex[], Error>({
    queryKey: marketKeys.indices(),
    queryFn: async () => {
      try {
        const indices = await marketDataAPI.getMarketIndices()
        logger.info('Fetched market indices', { count: indices.length })
        return indices
      } catch (error) {
        logger.error('Failed to fetch market indices', error)
        throw new Error('Unable to load market overview data')
      }
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    retry: 2,
  })
}

/**
 * Hook to fetch dashboard statistics (placeholder - connects to real analytics later)
 * 
 * @example
 * const { data: stats, isLoading } = useDashboardStats()
 */
export function useDashboardStats(): UseQueryResult<DashboardStats, Error> {
  return useQuery<DashboardStats, Error>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      // TODO: Connect to real analytics service
      // For now, return computed stats based on recent signals
      try {
        // This would call signalsService.getAnalytics() in real implementation
        const stats: DashboardStats = {
          active_signals: 24,
          success_rate: 87,
          total_profit: 12450,
          avg_return: 15.3,
          change_active_signals: '+12%',
          change_success_rate: '+5%',
          change_total_profit: '+23%',
          change_avg_return: '+2.1%',
        }

        logger.info('Fetched dashboard stats', stats)
        return stats
      } catch (error) {
        logger.error('Failed to fetch dashboard stats', error)
        throw new Error('Unable to load dashboard statistics')
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    retry: 2,
  })
}

/**
 * Hook to fetch multiple real-time quotes at once
 * Useful for portfolio or watchlist views
 * 
 * @example
 * const { data: quotes } = useMultipleQuotes(['AAPL', 'TSLA', 'GOOGL'])
 */
export function useMultipleQuotes(symbols: string[]): UseQueryResult<Record<string, RealTimeQuote>, Error> {
  return useQuery<Record<string, RealTimeQuote>, Error>({
    queryKey: ['market', 'quotes', 'multiple', symbols.sort().join(',')],
    queryFn: async () => {
      try {
        const quotes = await Promise.all(
          symbols.map(async (symbol) => {
            const quote = await marketDataAPI.getRealTimeQuote(symbol)
            return [symbol, quote] as const
          })
        )

        const quotesMap = Object.fromEntries(quotes)
        logger.info('Fetched multiple quotes', { symbols, count: quotes.length })
        return quotesMap
      } catch (error) {
        logger.error('Failed to fetch multiple quotes', { symbols, error })
        throw new Error('Unable to load multiple quotes')
      }
    },
    enabled: symbols.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 2,
  })
}

// Export types for external use
export type { RealTimeQuote, IntradayData }