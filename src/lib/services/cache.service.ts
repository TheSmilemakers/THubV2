import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { IndicatorCache, CreateCacheInput } from '@/types/database.types';
import { DatabaseError } from '@/lib/errors';

export interface CacheOptions {
  ttlMinutes?: number;
  timeframe?: string;
  apiCallsUsed?: number;
}

/**
 * Service for caching technical indicators to reduce API calls
 * Uses Supabase indicator_cache table with TTL support
 */
export class CacheService {
  private supabase: SupabaseClient;
  private logger = logger.createChild('CacheService');
  
  // Default TTL is 1 hour (60 minutes)
  private readonly DEFAULT_TTL_MINUTES = 60;
  
  // Track cache hit/miss statistics
  private stats = {
    hits: 0,
    misses: 0,
    errors: 0
  };

  constructor(supabaseClient: SupabaseClient) { // Make supabaseClient required
    this.supabase = supabaseClient; // Directly assign the provided client
    
    this.logger.info('CacheService initialized');
  }

  /**
   * Get cached indicator data if available and not expired
   */
  async getCachedIndicator(
    symbol: string, 
    indicator: string, 
    period?: number,
    timeframe: string = '1D'
  ): Promise<IndicatorCache | null> {
    try {
      const { data, error } = await this.supabase
        .from('indicator_cache')
        .select('*')
        .eq('symbol', symbol.toUpperCase())
        .eq('indicator', indicator)
        .eq('period', period || 0)
        .eq('timeframe', timeframe)
        .gte('expires_at', new Date().toISOString())
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        this.logger.error('Cache fetch error', error);
        this.stats.errors++;
        throw new DatabaseError(`Failed to fetch cached indicator: ${error.message}`);
      }
      
      if (data) {
        this.stats.hits++;
        this.logger.debug('Cache hit', {
          symbol,
          indicator,
          period,
          expiresAt: data.expires_at
        });
        return data as IndicatorCache;
      }
      
      this.stats.misses++;
      this.logger.debug('Cache miss', { symbol, indicator, period });
      return null;
    } catch (error) {
      this.logger.error('Cache retrieval failed', error);
      this.stats.errors++;
      // Return null on error to allow fallback to API
      return null;
    }
  }

  /**
   * Store indicator data in cache
   */
  async setCachedIndicator(
    symbol: string,
    indicator: string,
    data: any,
    options: CacheOptions & { period?: number } = {}
  ): Promise<void> {
    const {
      ttlMinutes = this.DEFAULT_TTL_MINUTES,
      timeframe = '1D',
      apiCallsUsed = 5, // Technical indicators typically use 5 API calls
      period = 0
    } = options;
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);
    
    const cacheEntry: CreateCacheInput = {
      symbol: symbol.toUpperCase(),
      indicator,
      period,
      timeframe,
      data,
      api_calls_used: apiCallsUsed
    };
    
    try {
      const { error } = await this.supabase
        .from('indicator_cache')
        .upsert(cacheEntry, {
          onConflict: 'symbol,indicator,timeframe,period'
        });
      
      if (error) {
        throw new DatabaseError(`Failed to cache indicator: ${error.message}`);
      }
      
      this.logger.info('Indicator cached', {
        symbol,
        indicator,
        ttlMinutes,
        expiresAt: expiresAt.toISOString()
      });
    } catch (error) {
      this.logger.error('Cache storage failed', error);
      // Don't throw - caching failure shouldn't break the main flow
    }
  }

  /**
   * Get multiple cached indicators at once
   */
  async getCachedIndicators(
    symbol: string,
    indicators: string[]
  ): Promise<Map<string, IndicatorCache>> {
    try {
      const { data, error } = await this.supabase
        .from('indicator_cache')
        .select('*')
        .eq('symbol', symbol.toUpperCase())
        .in('indicator', indicators)
        .gte('expires_at', new Date().toISOString());
      
      if (error) {
        this.logger.error('Bulk cache fetch error', error);
        return new Map();
      }
      
      const cache = new Map<string, IndicatorCache>();
      if (data) {
        data.forEach((item: IndicatorCache) => {
          cache.set(item.indicator, item);
        });
      }
      
      this.logger.debug('Bulk cache fetch', {
        symbol,
        requested: indicators.length,
        found: cache.size
      });
      
      return cache;
    } catch (error) {
      this.logger.error('Bulk cache retrieval failed', error);
      return new Map();
    }
  }

  /**
   * Clear expired cache entries
   */
  async cleanExpiredCache(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('indicator_cache')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');
      
      if (error) {
        throw new DatabaseError(`Failed to clean cache: ${error.message}`);
      }
      
      const deletedCount = data?.length || 0;
      this.logger.info(`Cleaned ${deletedCount} expired cache entries`);
      
      return deletedCount;
    } catch (error) {
      this.logger.error('Cache cleanup failed', error);
      return 0;
    }
  }

  /**
   * Clear all cache for a specific symbol
   */
  async clearSymbolCache(symbol: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('indicator_cache')
        .delete()
        .eq('symbol', symbol.toUpperCase());
      
      if (error) {
        throw new DatabaseError(`Failed to clear symbol cache: ${error.message}`);
      }
      
      this.logger.info(`Cleared cache for symbol: ${symbol}`);
    } catch (error) {
      this.logger.error('Symbol cache clear failed', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      ...this.stats,
      hitRate: hitRate.toFixed(2) + '%',
      totalRequests: total
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0
    };
    this.logger.info('Cache statistics reset');
  }

  /**
   * Calculate estimated API calls saved
   */
  getApiCallsSaved(): number {
    // Each cache hit saves approximately 5 API calls (for technical indicators)
    return this.stats.hits * 5;
  }

  /**
   * Generic get method for simple key-value caching
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const { data, error } = await this.supabase
        .from('indicator_cache')
        .select('data')
        .eq('symbol', key)
        .eq('indicator', 'generic')
        .gte('expires_at', new Date().toISOString())
        .single();
      
      if (error && error.code !== 'PGRST116') {
        this.logger.error('Generic cache fetch error', error);
        return null;
      }
      
      return data?.data as T || null;
    } catch (error) {
      this.logger.error('Generic cache retrieval failed', error);
      return null;
    }
  }

  /**
   * Generic set method for simple key-value caching
   */
  async set<T = any>(key: string, value: T, ttlMinutes?: number): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + (ttlMinutes || this.DEFAULT_TTL_MINUTES));
    
    const cacheEntry: CreateCacheInput = {
      symbol: key,
      indicator: 'generic',
      period: 0,
      timeframe: 'GENERIC',
      data: value as any,
      api_calls_used: 1,
      expires_at: expiresAt.toISOString()
    };
    
    try {
      const { error } = await this.supabase
        .from('indicator_cache')
        .upsert(cacheEntry, {
          onConflict: 'symbol,indicator,timeframe,period'
        });
      
      if (error) {
        this.logger.error('Generic cache storage failed', error);
      }
    } catch (error) {
      this.logger.error('Generic cache set failed', error);
    }
  }
}

// Singleton instance
let cacheServiceInstance: CacheService | null = null;

/**
 * Get singleton cache service instance
 */
export function getCacheService(supabaseClient?: SupabaseClient): CacheService {
  if (!cacheServiceInstance) {
    if (!supabaseClient) {
      throw new Error('Supabase client required for initial cache service creation');
    }
    cacheServiceInstance = new CacheService(supabaseClient);
  }
  return cacheServiceInstance;
}