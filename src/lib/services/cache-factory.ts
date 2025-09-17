import { createClient } from '@supabase/supabase-js';
import { CacheService } from './cache.service';
import { logger } from '@/lib/logger';

/**
 * Factory for creating cache service instances with proper Supabase client
 */
export class CacheFactory {
  private static instance: CacheService | null = null;
  private static logger = logger.createChild('CacheFactory');

  /**
   * Get or create a cache service instance
   * Uses environment variables to create Supabase client if needed
   */
  static async getInstance(): Promise<CacheService> {
    if (!this.instance) {
      // Create Supabase client from environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        this.logger.error('Missing Supabase environment variables', {
          hasUrl: !!supabaseUrl,
          hasAnonKey: !!supabaseAnonKey,
          hasServiceKey: !!supabaseServiceKey
        });
        throw new Error('Supabase configuration missing. Please check environment variables.');
      }

      // Use service role key if available (for server-side), otherwise use anon key
      const supabaseKey = supabaseServiceKey || supabaseAnonKey;

      try {
        const supabaseClient = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        });

        this.instance = new CacheService(supabaseClient);
        this.logger.info('Cache service initialized with Supabase client');
      } catch (error) {
        this.logger.error('Failed to create Supabase client', error);
        throw new Error('Failed to initialize cache service with Supabase');
      }
    }

    return this.instance;
  }

  /**
   * Reset the instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}