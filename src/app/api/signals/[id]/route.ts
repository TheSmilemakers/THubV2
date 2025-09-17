import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SignalsService } from '@/lib/services/signals.service';
import { getCacheService } from '@/lib/services/cache.service';

/**
 * GET /api/signals/:id - Get a single signal by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: signalId } = await params;
    const supabase = await createClient();
    
    // Authentication is optional for read operations
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check cache first
    const cacheService = getCacheService(supabase);
    const cacheKey = `signal:${signalId}`;
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'private, max-age=60',
        },
      });
    }
    
    // Get signal from database
    const signalsService = new SignalsService();
    const signal = await signalsService.getSignalById(signalId);
    
    if (!signal) {
      return NextResponse.json(
        { error: 'Signal not found' },
        { status: 404 }
      );
    }
    
    // Cache the result
    await cacheService.set(cacheKey, signal, 300); // 5 minutes
    
    return NextResponse.json(signal, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    console.error('[API] Error fetching signal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signal' },
      { status: 500 }
    );
  }
}