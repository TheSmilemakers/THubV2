/**
 * Signals Service - Handles all signal-related data operations
 * 
 * Implements:
 * - CRUD operations for signals
 * - Real-time subscriptions
 * - Caching and optimization
 * - Error handling with retries
 */

import { createClient } from '@/lib/supabase/client'
import { 
  type Signal, 
  type SignalQueryOptions, 
  type SignalResponse, 
  type DbSignal,
  mapDbSignalToUI,
  type SignalEvent,
  type SignalAnalytics,
  type MarketType
} from '@/types/signals.types'
import { logger } from '@/lib/logger'
import { CacheService } from './cache.service'

export class SignalsService {
  private supabase = createClient()
  // private cache = new CacheService() // Removed due to security concern (service role key exposure)
  private subscriptions = new Map<string, any>()

  /**
   * Fetch signals with filters and pagination
   */
  async getSignals(options: SignalQueryOptions = {}): Promise<SignalResponse> {
    const { filters = {}, sort = { by: 'score', order: 'desc' }, limit = 20, offset = 0 } = options
    
    try {
      // Caching logic removed from client-side due to security concerns.
      // If caching is needed, it should be implemented on the server-side.
      // const cacheKey = `signals:${JSON.stringify(options)}`

      // Build query
      let query = this.supabase
        .from('signals')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters.market) {
        query = query.eq('market', filters.market)
      }
      
      if (filters.signal_strength && filters.signal_strength.length > 0) {
        query = query.in('signal_strength', filters.signal_strength)
      }
      
      if (filters.min_score !== undefined) {
        query = query.gte('convergence_score', filters.min_score)
      }
      
      if (filters.max_score !== undefined) {
        query = query.lte('convergence_score', filters.max_score)
      }
      
      // Handle both single symbol and array of symbols
      if (filters.symbols && filters.symbols.length > 0) {
        query = query.in('symbol', filters.symbols)
      } else if (filters.symbol) {
        // Backward compatibility with single symbol
        query = query.ilike('symbol', `%${filters.symbol}%`)
      }
      
      if (filters.active !== undefined) {
        if (filters.active) {
          query = query.gt('expires_at', new Date().toISOString())
        } else {
          query = query.lte('expires_at', new Date().toISOString())
        }
      }

      // Apply sorting
      const sortColumn = this.mapSortColumn(sort.by)
      query = query.order(sortColumn, { ascending: sort.order === 'asc' })

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      // Execute query
      const { data, error, count } = await query

      if (error) {
        logger.error('Failed to fetch signals', error)
        throw new Error(`Failed to fetch signals: ${error.message}`)
      }

      // Enrich signals with additional data
      const enrichedSignals = await this.enrichSignals(data || [])

      const response: SignalResponse = {
        data: enrichedSignals,
        count: count || 0,
        hasMore: (count || 0) > offset + limit
      }

      // Caching logic removed from client-side due to security concerns.
      // If caching is needed, it should be implemented on the server-side.

      return response
    } catch (error) {
      logger.error('Error in getSignals', error)
      throw error
    }
  }

  /**
   * Get a single signal by ID
   */
  async getSignalById(id: string): Promise<Signal | null> {
    try {
      const { data, error } = await this.supabase
        .from('signals')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }

      const enriched = await this.enrichSignals([data])
      return enriched[0] || null
    } catch (error) {
      logger.error('Error fetching signal by ID', { id, error })
      throw error
    }
  }

  /**
   * Mark signal as viewed by current user
   */
  async markAsViewed(signalId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('array_append_unique', {
        table_name: 'signals',
        column_name: 'viewed_by',
        id: signalId,
        value: userId
      })

      if (error) throw error
    } catch (error) {
      logger.error('Error marking signal as viewed', { signalId, userId, error })
      // Non-critical error, don't throw
    }
  }

  /**
   * Save/unsave signal for current user
   */
  async toggleSaved(signalId: string, userId: string): Promise<boolean> {
    try {
      // First check if already saved
      const { data: signal } = await this.supabase
        .from('signals')
        .select('saved_by')
        .eq('id', signalId)
        .single()

      const isSaved = signal?.saved_by?.includes(userId) || false

      if (isSaved) {
        // Remove from saved
        const { error } = await this.supabase.rpc('array_remove', {
          table_name: 'signals',
          column_name: 'saved_by',
          id: signalId,
          value: userId
        })
        if (error) throw error
        return false
      } else {
        // Add to saved
        const { error } = await this.supabase.rpc('array_append_unique', {
          table_name: 'signals',
          column_name: 'saved_by',
          id: signalId,
          value: userId
        })
        if (error) throw error
        return true
      }
    } catch (error) {
      logger.error('Error toggling saved signal', { signalId, userId, error })
      throw error
    }
  }

  /**
   * Get signal analytics
   */
  async getAnalytics(): Promise<SignalAnalytics> {
    try {
      const { data, error } = await this.supabase.rpc('get_signal_analytics')
      
      if (error) throw error

      return data as SignalAnalytics
    } catch (error) {
      logger.error('Error fetching signal analytics', error)
      throw error
    }
  }

  /**
   * Subscribe to real-time signal updates
   */
  subscribeToSignals(
    filters: { market?: MarketType } = {},
    callback: (event: SignalEvent) => void
  ): () => void {
    const subscriptionKey = `signals:${JSON.stringify(filters)}`

    // Create subscription
    const subscription = this.supabase
      .channel(subscriptionKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'signals',
          filter: filters.market ? `market=eq.${filters.market}` : undefined
        },
        async (payload) => {
          try {
            const eventType = payload.eventType === 'INSERT' ? 'created' : 
                            payload.eventType === 'UPDATE' ? 'updated' : 
                            'expired'

            const signal = await this.enrichSignals([payload.new as DbSignal])
            
            callback({
              type: eventType,
              signal: signal[0],
              timestamp: new Date().toISOString()
            })
          } catch (error) {
            logger.error('Error processing signal event', error)
          }
        }
      )
      .subscribe()

    this.subscriptions.set(subscriptionKey, subscription)

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe()
      this.subscriptions.delete(subscriptionKey)
    }
  }

  /**
   * Enrich signals with additional data (company info, price data, etc.)
   */
  private async enrichSignals(signals: DbSignal[]): Promise<Signal[]> {
    // In a real implementation, this would fetch additional data from:
    // - Company info service
    // - Price history service
    // - Market data service
    
    // For now, we'll add mock data
    return signals.map(signal => mapDbSignalToUI(signal, {
      company_name: this.getCompanyName(signal.symbol),
      price_change_24h: this.generatePriceChange(),
      price_change_percent_24h: this.generatePriceChangePercent(),
      volume_24h: this.generateVolume(),
      market_cap: this.generateMarketCap(),
      price_history: this.generatePriceHistory(signal.current_price || 100)
    }))
  }

  private mapSortColumn(sortBy: string): string {
    const mapping: Record<string, string> = {
      score: 'convergence_score',
      created_at: 'created_at',
      price_change: 'current_price',
      volume: 'technical_data->volume'
    }
    return mapping[sortBy] || 'convergence_score'
  }

  // Mock data generators (replace with real services)
  private getCompanyName(symbol: string): string {
    const companies: Record<string, string> = {
      AAPL: 'Apple Inc.',
      GOOGL: 'Alphabet Inc.',
      MSFT: 'Microsoft Corporation',
      AMZN: 'Amazon.com Inc.',
      TSLA: 'Tesla, Inc.',
      NVDA: 'NVIDIA Corporation',
      META: 'Meta Platforms, Inc.'
    }
    return companies[symbol] || `${symbol} Company`
  }

  private generatePriceChange(): number {
    return (Math.random() - 0.5) * 10
  }

  private generatePriceChangePercent(): number {
    return (Math.random() - 0.5) * 5
  }

  private generateVolume(): number {
    return Math.floor(Math.random() * 100000000)
  }

  private generateMarketCap(): number {
    return Math.floor(Math.random() * 1000000000000)
  }

  private generatePriceHistory(basePrice: number): number[] {
    return Array(20).fill(0).map(() => 
      basePrice + (Math.random() - 0.5) * basePrice * 0.02
    )
  }
}

// Export singleton instance
export const signalsService = new SignalsService()