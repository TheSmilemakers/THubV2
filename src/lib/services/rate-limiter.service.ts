import { logger } from '@/lib/logger';
import { RateLimitError } from '@/lib/errors';

export interface RateLimitStats {
  minute: {
    used: number;
    remaining: number;
    resetIn: number; // milliseconds
  };
  daily: {
    used: number;
    remaining: number;
    resetIn: number; // milliseconds
  };
}

/**
 * Rate limiter for EODHD API calls
 * Tracks both minute and daily limits to prevent API overuse
 * Based on EOD+Intraday plan: 1,000/min, 100,000/day
 */
export class RateLimiter {
  private minuteCounter = 0;
  private dailyCounter = 0;
  private lastMinuteReset = Date.now();
  private lastDailyReset = Date.now();
  private logger = logger.createChild('RateLimiter');
  
  // EODHD API limits for EOD+Intraday plan
  private MINUTE_LIMIT = 1000;
  private DAILY_LIMIT = 100000;
  
  // Buffer to avoid hitting exact limits
  private readonly SAFETY_BUFFER = 0.95; // Use only 95% of limits
  
  constructor(
    minuteLimit?: number,
    dailyLimit?: number
  ) {
    if (minuteLimit) this.MINUTE_LIMIT = minuteLimit;
    if (dailyLimit) this.DAILY_LIMIT = dailyLimit;
    
    this.logger.info('RateLimiter initialized', {
      minuteLimit: this.MINUTE_LIMIT,
      dailyLimit: this.DAILY_LIMIT
    });
  }

  /**
   * Check if we can make the specified number of API calls
   * @param apiCalls Number of API calls to make (default: 1)
   * @returns true if calls can be made, false otherwise
   */
  async checkLimit(apiCalls: number = 1): Promise<boolean> {
    const now = Date.now();
    
    // Reset counters if time windows have passed
    this.resetCountersIfNeeded(now);
    
    // Apply safety buffer
    const safeMinuteLimit = Math.floor(this.MINUTE_LIMIT * this.SAFETY_BUFFER);
    const safeDailyLimit = Math.floor(this.DAILY_LIMIT * this.SAFETY_BUFFER);
    
    // Check if we can make the request
    if (this.minuteCounter + apiCalls > safeMinuteLimit) {
      this.logger.warn('Minute rate limit would be exceeded', {
        current: this.minuteCounter,
        requested: apiCalls,
        limit: safeMinuteLimit
      });
      return false;
    }
    
    if (this.dailyCounter + apiCalls > safeDailyLimit) {
      this.logger.warn('Daily rate limit would be exceeded', {
        current: this.dailyCounter,
        requested: apiCalls,
        limit: safeDailyLimit
      });
      return false;
    }
    
    return true;
  }

  /**
   * Consume API calls if within limits
   * @param apiCalls Number of API calls to consume
   * @throws RateLimitError if limit would be exceeded
   */
  async consume(apiCalls: number = 1): Promise<void> {
    if (!await this.checkLimit(apiCalls)) {
      const stats = this.getStats();
      const resetIn = Math.min(stats.minute.resetIn, stats.daily.resetIn);
      throw new RateLimitError(
        `Rate limit would be exceeded. Try again in ${Math.ceil(resetIn / 1000)}s`
      );
    }
    
    // Update counters
    this.minuteCounter += apiCalls;
    this.dailyCounter += apiCalls;
    
    this.logger.debug('API calls consumed', {
      consumed: apiCalls,
      minuteUsed: this.minuteCounter,
      dailyUsed: this.dailyCounter
    });
  }

  /**
   * Get current rate limit statistics
   */
  getStats(): RateLimitStats {
    const now = Date.now();
    this.resetCountersIfNeeded(now);
    
    return {
      minute: {
        used: this.minuteCounter,
        remaining: this.MINUTE_LIMIT - this.minuteCounter,
        resetIn: 60000 - (now - this.lastMinuteReset)
      },
      daily: {
        used: this.dailyCounter,
        remaining: this.DAILY_LIMIT - this.dailyCounter,
        resetIn: 86400000 - (now - this.lastDailyReset)
      }
    };
  }

  /**
   * Get remaining API calls (with safety buffer applied)
   */
  getRemainingCalls(): { minute: number; daily: number } {
    const safeMinuteLimit = Math.floor(this.MINUTE_LIMIT * this.SAFETY_BUFFER);
    const safeDailyLimit = Math.floor(this.DAILY_LIMIT * this.SAFETY_BUFFER);
    
    return {
      minute: Math.max(0, safeMinuteLimit - this.minuteCounter),
      daily: Math.max(0, safeDailyLimit - this.dailyCounter)
    };
  }

  /**
   * Calculate optimal delay to avoid rate limiting
   */
  getOptimalDelay(): number {
    const remaining = this.getRemainingCalls();
    
    // If we have plenty of calls remaining, no delay needed
    if (remaining.minute > 100) return 0;
    
    // Calculate delay based on remaining calls
    // More aggressive delay as we approach the limit
    if (remaining.minute < 10) return 5000; // 5 seconds
    if (remaining.minute < 50) return 1000; // 1 second
    
    return 100; // 100ms default
  }

  /**
   * Wait if necessary to avoid rate limiting
   */
  async waitIfNeeded(): Promise<void> {
    const delay = this.getOptimalDelay();
    if (delay > 0) {
      this.logger.info(`Rate limit delay: ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Reset counters if time windows have passed
   */
  private resetCountersIfNeeded(now: number): void {
    // Reset minute counter
    if (now - this.lastMinuteReset >= 60000) {
      this.logger.debug('Resetting minute counter', {
        previous: this.minuteCounter
      });
      this.minuteCounter = 0;
      this.lastMinuteReset = now;
    }
    
    // Reset daily counter
    if (now - this.lastDailyReset >= 86400000) {
      this.logger.debug('Resetting daily counter', {
        previous: this.dailyCounter
      });
      this.dailyCounter = 0;
      this.lastDailyReset = now;
    }
  }

  /**
   * Get percentage of limit used
   */
  getUsagePercentage(): { minute: number; daily: number } {
    return {
      minute: (this.minuteCounter / this.MINUTE_LIMIT) * 100,
      daily: (this.dailyCounter / this.DAILY_LIMIT) * 100
    };
  }

  /**
   * Check if we're approaching limits (>80% used)
   */
  isApproachingLimit(): boolean {
    const usage = this.getUsagePercentage();
    return usage.minute > 80 || usage.daily > 80;
  }

  /**
   * Reset all counters (useful for testing)
   */
  reset(): void {
    this.minuteCounter = 0;
    this.dailyCounter = 0;
    this.lastMinuteReset = Date.now();
    this.lastDailyReset = Date.now();
    this.logger.info('Rate limiter reset');
  }
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null;

/**
 * Get singleton rate limiter instance
 */
export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
  }
  return rateLimiterInstance;
}