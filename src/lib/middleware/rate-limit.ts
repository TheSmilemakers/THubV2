import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validationErrorResponse } from '@/lib/validation/helpers';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  requests: number;
  window: number; // seconds
  identifier?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Default configurations for different endpoint types
 */
export const RATE_LIMIT_CONFIGS = {
  auth: {
    signIn: { requests: 5, window: 300 }, // 5 per 5 minutes
    signUp: { requests: 3, window: 3600 }, // 3 per hour
    passwordReset: { requests: 3, window: 3600 }, // 3 per hour
  },
  api: {
    public: { requests: 60, window: 60 }, // 60 per minute
    authenticated: { requests: 300, window: 60 }, // 300 per minute
    webhook: { requests: 100, window: 60 }, // 100 per minute
  },
};

/**
 * Get client IP address
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || real || 'unknown';
  return ip.trim();
}

/**
 * Rate limit middleware
 */
export function withRateLimit(
  config: RateLimitConfig,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Get identifier (default to IP)
      const identifier = config.identifier 
        ? config.identifier(request) 
        : `ip:${getClientIp(request)}`;

      // Create window key
      const windowStart = Math.floor(Date.now() / 1000 / config.window) * config.window;
      const windowKey = `${identifier}:${windowStart}`;

      // Check rate limit using Supabase
      const supabase = await createClient();
      
      // Get current count
      const { data: existing, error: fetchError } = await supabase
        .from('rate_limit_tracking')
        .select('count')
        .eq('identifier', identifier)
        .eq('window_start', new Date(windowStart * 1000).toISOString())
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // Log error but don't block request
        console.error('Rate limit check failed:', fetchError);
        return handler(request);
      }

      const currentCount = existing?.count || 0;

      // Check if limit exceeded
      if (currentCount >= config.requests) {
        const resetTime = (windowStart + config.window) * 1000;
        const resetIn = Math.ceil((resetTime - Date.now()) / 1000);

        return NextResponse.json(
          {
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
            resetAt: new Date(resetTime).toISOString(),
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(config.requests),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Math.floor(resetTime / 1000)),
              'Retry-After': String(resetIn),
            },
          }
        );
      }

      // Increment counter
      const { error: updateError } = await supabase
        .from('rate_limit_tracking')
        .upsert({
          identifier,
          action: request.nextUrl.pathname,
          window_start: new Date(windowStart * 1000).toISOString(),
          count: currentCount + 1,
        }, {
          onConflict: 'identifier,action,window_start',
        });

      if (updateError) {
        console.error('Rate limit update failed:', updateError);
      }

      // Add rate limit headers
      const remaining = config.requests - currentCount - 1;
      const resetTime = (windowStart + config.window) * 1000;
      
      const response = await handler(request);
      
      response.headers.set('X-RateLimit-Limit', String(config.requests));
      response.headers.set('X-RateLimit-Remaining', String(Math.max(0, remaining)));
      response.headers.set('X-RateLimit-Reset', String(Math.floor(resetTime / 1000)));

      return response;
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // On error, allow the request
      return handler(request);
    }
  };
}

/**
 * Rate limit by user ID
 */
export function withUserRateLimit(
  config: Omit<RateLimitConfig, 'identifier'>,
  handler: (request: NextRequest, userId: string) => Promise<NextResponse>
) {
  return withRateLimit(
    {
      ...config,
      identifier: (req) => {
        const userId = req.headers.get('x-user-id');
        return userId ? `user:${userId}` : `ip:${getClientIp(req)}`;
      },
    },
    async (request) => {
      const userId = request.headers.get('x-user-id');
      if (!userId) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      return handler(request, userId);
    }
  );
}

/**
 * Rate limit by API key
 */
export function withApiKeyRateLimit(
  config: Omit<RateLimitConfig, 'identifier'>,
  handler: (request: NextRequest, apiKeyId: string) => Promise<NextResponse>
) {
  return withRateLimit(
    {
      ...config,
      identifier: (req) => {
        const apiKeyId = req.headers.get('x-api-key-id');
        return apiKeyId ? `key:${apiKeyId}` : `ip:${getClientIp(req)}`;
      },
    },
    async (request) => {
      const apiKeyId = request.headers.get('x-api-key-id');
      if (!apiKeyId) {
        return NextResponse.json(
          { error: 'API key required' },
          { status: 401 }
        );
      }
      return handler(request, apiKeyId);
    }
  );
}

/**
 * Tiered rate limiting based on subscription
 */
export async function withTieredRateLimit(
  handler: (request: NextRequest, tier: 'free' | 'pro' | 'premium') => Promise<NextResponse>
) {
  const tierLimits = {
    free: { requests: 100, window: 3600 }, // 100 per hour
    pro: { requests: 1000, window: 3600 }, // 1000 per hour
    premium: { requests: 5000, window: 3600 }, // 5000 per hour
  };

  return async (request: NextRequest): Promise<NextResponse> => {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      // Use free tier for unauthenticated requests
      return withRateLimit(
        {
          ...tierLimits.free,
          identifier: (req) => `ip:${getClientIp(req)}`,
        },
        async (req) => handler(req, 'free')
      )(request);
    }

    // Get user tier from database
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    const tier = profile?.subscription_tier || 'free';
    const config = tierLimits[tier as keyof typeof tierLimits] || tierLimits.free;

    return withRateLimit(
      {
        ...config,
        identifier: () => `user:${userId}`,
      },
      async (req) => handler(req, tier as 'free' | 'pro' | 'premium')
    )(request);
  };
}