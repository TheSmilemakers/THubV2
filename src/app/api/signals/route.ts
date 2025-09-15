import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCacheService } from '@/lib/services/cache.service';
import { SignalsService } from '@/lib/services/signals.service';
import { withUserRateLimit } from '@/lib/middleware/rate-limit';
import { validateQueryParams } from '@/lib/validation/helpers';
import { signalFiltersSchema, paginationSchema } from '@/lib/validation/schemas';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { type SignalQueryOptions, type SignalResponse, type SignalFilters, type SignalSort, type SignalSortBy } from '@/types/signals.types';

// Use the signalFiltersSchema directly as it already includes pagination
const SignalsQuerySchema = signalFiltersSchema;

/**
 * GET /api/signals - Fetch signals with caching
 */
export const GET = withUserRateLimit(
  { requests: 300, window: 60 }, // 300 requests per minute for authenticated users
  async (request: NextRequest, userId: string) => {
    const requestLogger = logger.createChild('SignalsAPI');
    
    try {
      // Validate query parameters
      const validation = validateQueryParams(request, SignalsQuerySchema);
      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Invalid query parameters',
            details: validation.errors,
          },
          { status: 400 }
        );
      }

      const params = validation.data;
      
      // Generate cache key based on parameters
      const cacheKey = `signals:${JSON.stringify({
        ...params,
        userId, // Include userId for personalized results
      })}`;

      // Initialize services
      const supabase = await createClient();
      const cacheService = getCacheService(supabase);
      
      // Try to get from cache first
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        requestLogger.info('Signals served from cache', { userId, cacheKey });
        return NextResponse.json(cached, {
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': 'private, max-age=60', // 1 minute client cache
          },
        });
      }

      // If not in cache, fetch from database
      const signalsService = new SignalsService();
      
      // Extract filters and pagination
      const { page, limit, orderBy, order, symbols, minScore, maxScore, signalTypes, sectors, startDate, endDate } = params;
      const pagination = { page, limit };
      
      // Map query params to SignalFilters
      const filters: SignalFilters = {
        symbol: symbols?.[0], // Take first symbol for now
        min_score: minScore,
        max_score: maxScore,
        // Additional filters can be mapped here
      };
      
      // Map sort params
      const sort: SignalSort = {
        by: (orderBy as SignalSortBy) || 'created_at',
        order: order || 'desc'
      };

      // Fetch signals
      // SignalsService.getSignals expects different parameters
      // Convert to the expected format
      const queryOptions: SignalQueryOptions = {
        filters,
        sort,
        limit: pagination.limit || 10,
        offset: ((pagination.page || 1) - 1) * (pagination.limit || 10)
      };
      const result = await signalsService.getSignals(queryOptions);

      // Cache the result
      await cacheService.set(
        cacheKey,
        result,
        300 // Cache for 5 minutes
      );

      requestLogger.info('Signals fetched and cached', {
        userId,
        count: result.count,
        cacheKey,
      });

      return NextResponse.json(result, {
        headers: {
          'X-Cache': 'MISS',
          'Cache-Control': 'private, max-age=60',
        },
      });

    } catch (error) {
      requestLogger.error('Failed to fetch signals', { error, userId });
      return NextResponse.json(
        {
          error: 'Failed to fetch signals',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/signals/:id/view - Mark signal as viewed
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get signal ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const signalId = pathParts[pathParts.length - 2]; // Get ID before 'view'

    if (!signalId || signalId === 'signals') {
      return NextResponse.json(
        { error: 'Signal ID required' },
        { status: 400 }
      );
    }

    // Mark as viewed functionality would be implemented here
    // For now, just return success
    // TODO: Implement markAsViewed in SignalsService

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to mark signal as viewed', { error });
    return NextResponse.json(
      { error: 'Failed to mark signal as viewed' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/signals/:id/save - Toggle saved status
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get signal ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const signalId = pathParts[pathParts.length - 2]; // Get ID before 'save'

    if (!signalId || signalId === 'signals') {
      return NextResponse.json(
        { error: 'Signal ID required' },
        { status: 400 }
      );
    }

    // Toggle saved functionality would be implemented here
    // For now, just return success
    // TODO: Implement toggleSaved in SignalsService
    const isSaved = false;

    return NextResponse.json({ saved: isSaved });
  } catch (error) {
    logger.error('Failed to toggle saved status', { error });
    return NextResponse.json(
      { error: 'Failed to toggle saved status' },
      { status: 500 }
    );
  }
}