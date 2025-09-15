import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Optimized rate limit middleware using the new table structure
 * Features:
 * - Batch operations for multiple windows
 * - Efficient upserts using stored function
 * - Connection pooling
 * - Smart caching of rate limit status
 */

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

/**
 * Check and consume rate limit in a single operation
 * Optimized for performance with the new table structure
 */
export async function checkAndConsumeRateLimit(
  identifier: string,
  action: string,
  config: { requests: number; window: number }
): Promise<RateLimitResult> {
  const supabase = await createClient();
  
  // Calculate window
  const windowStart = new Date(
    Math.floor(Date.now() / 1000 / config.window) * config.window * 1000
  );
  const windowEnd = new Date(windowStart.getTime() + config.window * 1000);

  try {
    // Use the optimized stored function for atomic increment
    const { data, error } = await supabase
      .rpc('increment_rate_limit', {
        p_identifier: identifier,
        p_action: action,
        p_window_start: windowStart.toISOString(),
        p_metadata: {
          timestamp: new Date().toISOString(),
          window_seconds: config.window
        }
      })
      .single<{ current_count: number }>();

    if (error) {
      console.error('Rate limit check failed:', error);
      // On error, allow the request but log it
      return {
        allowed: true,
        limit: config.requests,
        remaining: config.requests,
        reset: windowEnd
      };
    }

    const currentCount = data?.current_count || 1;
    const allowed = currentCount <= config.requests;
    const remaining = Math.max(0, config.requests - currentCount);

    return {
      allowed,
      limit: config.requests,
      remaining,
      reset: windowEnd,
      retryAfter: allowed ? undefined : Math.ceil((windowEnd.getTime() - Date.now()) / 1000)
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // On error, allow the request
    return {
      allowed: true,
      limit: config.requests,
      remaining: config.requests,
      reset: windowEnd
    };
  }
}

/**
 * Optimized rate limit middleware
 */
export function withOptimizedRateLimit(
  config: { requests: number; window: number },
  identifierFn?: (req: NextRequest) => string
) {
  return async function rateLimitMiddleware(
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    return async (request: NextRequest): Promise<NextResponse> => {
      // Get identifier
      const identifier = identifierFn
        ? identifierFn(request)
        : `ip:${getClientIp(request)}`;
      
      const action = request.nextUrl.pathname;
      
      // Check and consume rate limit
      const result = await checkAndConsumeRateLimit(identifier, action, config);
      
      // If rate limit exceeded
      if (!result.allowed) {
        return NextResponse.json(
          {
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
            resetAt: result.reset.toISOString(),
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(result.limit),
              'X-RateLimit-Remaining': String(result.remaining),
              'X-RateLimit-Reset': String(Math.floor(result.reset.getTime() / 1000)),
              'Retry-After': String(result.retryAfter),
            },
          }
        );
      }
      
      // Process request and add headers
      const response = await handler(request);
      
      response.headers.set('X-RateLimit-Limit', String(result.limit));
      response.headers.set('X-RateLimit-Remaining', String(result.remaining));
      response.headers.set('X-RateLimit-Reset', String(Math.floor(result.reset.getTime() / 1000)));
      
      return response;
    };
  };
}

/**
 * Batch check multiple rate limits efficiently
 * Useful for checking multiple windows or tiers
 */
export async function batchCheckRateLimits(
  identifier: string,
  limits: Array<{
    action: string;
    requests: number;
    window: number;
  }>
): Promise<Map<string, RateLimitResult>> {
  const supabase = await createClient();
  const results = new Map<string, RateLimitResult>();
  
  // Build batch query
  const queries = limits.map(limit => {
    const windowStart = new Date(
      Math.floor(Date.now() / 1000 / limit.window) * limit.window * 1000
    );
    return {
      action: limit.action,
      window_start: windowStart.toISOString(),
      limit: limit.requests,
      window: limit.window,
      windowEnd: new Date(windowStart.getTime() + limit.window * 1000)
    };
  });
  
  try {
    // Fetch all counts in a single query
    const { data, error } = await supabase
      .from('rate_limit_tracking')
      .select('action, count')
      .eq('identifier', identifier)
      .in('action', queries.map(q => q.action))
      .in('window_start', queries.map(q => q.window_start));
    
    if (error) {
      console.error('Batch rate limit check failed:', error);
    }
    
    // Process results
    for (const query of queries) {
      const record = data?.find(
        d => d.action === query.action
      );
      const count = record?.count || 0;
      const allowed = count < query.limit;
      
      results.set(query.action, {
        allowed,
        limit: query.limit,
        remaining: Math.max(0, query.limit - count),
        reset: query.windowEnd,
        retryAfter: allowed ? undefined : 
          Math.ceil((query.windowEnd.getTime() - Date.now()) / 1000)
      });
    }
  } catch (error) {
    console.error('Batch rate limit error:', error);
    // On error, allow all requests
    for (const query of queries) {
      results.set(query.action, {
        allowed: true,
        limit: query.limit,
        remaining: query.limit,
        reset: query.windowEnd
      });
    }
  }
  
  return results;
}

/**
 * Get rate limit statistics for monitoring
 */
export async function getRateLimitStats(
  identifier: string,
  window: number = 3600
): Promise<{
  totalRequests: number;
  topActions: Array<{ action: string; count: number }>;
  windowsActive: number;
}> {
  const supabase = await createClient();
  
  try {
    const windowStart = new Date(Date.now() - window * 1000);
    
    const { data, error } = await supabase
      .from('rate_limit_tracking')
      .select('action, count')
      .eq('identifier', identifier)
      .gte('window_start', windowStart.toISOString())
      .order('count', { ascending: false });
    
    if (error) throw error;
    
    const totalRequests = data?.reduce((sum, record) => sum + record.count, 0) || 0;
    const topActions = data?.slice(0, 5).map(record => ({
      action: record.action,
      count: record.count
    })) || [];
    const windowsActive = data?.length || 0;
    
    return {
      totalRequests,
      topActions,
      windowsActive
    };
  } catch (error) {
    console.error('Failed to get rate limit stats:', error);
    return {
      totalRequests: 0,
      topActions: [],
      windowsActive: 0
    };
  }
}

/**
 * Clean up old rate limit entries (should be called periodically)
 */
export async function cleanupOldRateLimits(): Promise<number> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .rpc('cleanup_old_rate_limits');
    
    if (error) throw error;
    
    return data || 0;
  } catch (error) {
    console.error('Rate limit cleanup failed:', error);
    return 0;
  }
}

// Helper function to get client IP
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || real || 'unknown';
  return ip.trim();
}