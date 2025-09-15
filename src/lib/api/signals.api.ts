/**
 * Signals API Client
 * 
 * Provides a clean interface for interacting with the signals API endpoints
 * with proper error handling and type safety
 */

import type { 
  Signal, 
  SignalQueryOptions, 
  SignalResponse,
  SignalAnalytics 
} from '@/types/signals.types';
import { logger } from '@/lib/logger';

class SignalsAPI {
  private baseUrl = '/api/signals';

  /**
   * Fetch signals with filters and pagination
   */
  async getSignals(options: SignalQueryOptions = {}): Promise<SignalResponse> {
    try {
      const params = new URLSearchParams();
      
      // Add filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(key, String(v)));
            } else {
              params.append(key, String(value));
            }
          }
        });
      }

      // Add pagination
      if (options.offset !== undefined) {
        const page = Math.floor(options.offset / (options.limit || 10)) + 1;
        params.append('page', String(page));
      }
      if (options.limit) params.append('limit', String(options.limit));

      // Add sorting
      if (options.sort) {
        params.append('orderBy', options.sort.by);
        params.append('order', options.sort.order);
      }

      const response = await fetch(`${this.baseUrl}?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch signals');
      }

      return response.json();
    } catch (error) {
      logger.error('Failed to fetch signals', { error });
      throw error;
    }
  }

  /**
   * Get a single signal by ID
   */
  async getSignalById(id: string): Promise<Signal | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch signal');
      }

      return response.json();
    } catch (error) {
      logger.error('Failed to fetch signal', { id, error });
      throw error;
    }
  }

  /**
   * Mark signal as viewed
   */
  async markAsViewed(signalId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${signalId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark signal as viewed');
      }
    } catch (error) {
      logger.error('Failed to mark signal as viewed', { signalId, error });
      throw error;
    }
  }

  /**
   * Toggle saved status
   */
  async toggleSaved(signalId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${signalId}/save`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to toggle saved status');
      }

      const data = await response.json();
      return data.saved;
    } catch (error) {
      logger.error('Failed to toggle saved status', { signalId, error });
      throw error;
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(): Promise<SignalAnalytics> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch analytics');
      }

      return response.json();
    } catch (error) {
      logger.error('Failed to fetch analytics', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const signalsAPI = new SignalsAPI();