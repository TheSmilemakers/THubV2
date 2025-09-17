import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SignalsService } from '@/lib/services/signals.service';
import { getCacheService } from '@/lib/services/cache.service';
import { z } from 'zod';

const analyticsSchema = z.object({
  timeframe: z.enum(['1d', '1w', '1m', '3m', '1y']).optional().default('1w'),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day')
});

/**
 * GET /api/signals/analytics - Get signal analytics and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = analyticsSchema.parse({
      timeframe: searchParams.get('timeframe') || undefined,
      groupBy: searchParams.get('groupBy') || undefined
    });

    // Check cache
    const cacheService = getCacheService(supabase);
    const cacheKey = `signal-analytics:${user.id}:${params.timeframe}:${params.groupBy}`;
    const cached = await cacheService.get(cacheKey);

    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'private, max-age=300', // 5 minutes
        },
      });
    }

    // Get analytics from service
    const signalsService = new SignalsService();
    const analytics = await signalsService.getAnalytics();

    // Cache the result
    await cacheService.set(cacheKey, analytics, 300); // 5 minutes

    return NextResponse.json(analytics, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    console.error('[API] Error fetching signal analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}