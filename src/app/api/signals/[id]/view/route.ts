import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { ValidationError } from '@/lib/errors';
import { SignalsService } from '@/lib/services/signals.service';

const viewSchema = z.object({
  device: z.string().optional(),
  source: z.string().optional()
});

export async function POST(
  request: NextRequest,
  { params }: any
) {
  try {
    const { id: signalId } = params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = viewSchema.parse(body);

    // Track view
    const signalsService = new SignalsService();
    await signalsService.markAsViewed(signalId, user.id);
    
    // TODO: Track additional metadata (device, source) when metrics service is implemented

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error tracking signal view:', error);
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}
