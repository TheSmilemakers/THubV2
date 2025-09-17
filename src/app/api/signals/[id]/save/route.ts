import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { ValidationError } from '@/lib/errors';

const saveSchema = z.object({
  notes: z.string().optional()
});

export async function PUT(
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
    const validatedData = saveSchema.parse(body);

    // Save/unsave signal
    const { error } = await supabase
      .from('saved_signals')
      .upsert({
        signal_id: signalId,
        user_id: user.id,
        notes: validatedData.notes,
        saved_at: new Date().toISOString()
      }, {
        onConflict: 'signal_id,user_id'
      });

    if (error) {
      console.error('[API] Error saving signal:', error);
      return NextResponse.json({ error: 'Failed to save signal' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error saving signal:', error);
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save signal' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Remove saved signal
    const { error } = await supabase
      .from('saved_signals')
      .delete()
      .match({
        signal_id: signalId,
        user_id: user.id
      });

    if (error) {
      console.error('[API] Error unsaving signal:', error);
      return NextResponse.json({ error: 'Failed to unsave signal' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error unsaving signal:', error);
    return NextResponse.json({ error: 'Failed to unsave signal' }, { status: 500 });
  }
}
