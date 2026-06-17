import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/coach/history
 * Loads conversation history for the authenticated user (max 100 rows).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    const { data: conversations, error: dbError } = await supabase
      .from('coach_conversations')
      .select('role, message, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (dbError) {
      logger.error('[API /api/coach/history GET] Database read error', dbError, { userId: user.id });
      return NextResponse.json({ message: 'Failed to fetch conversation history.' }, { status: 500 });
    }

    return NextResponse.json(conversations || [], { status: 200 });
  } catch (error) {
    logger.error('[API /api/coach/history GET] Critical error', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}

/**
 * DELETE /api/coach/history
 * Clears the authenticated user's chat logs.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    const { error: deleteError } = await supabase
      .from('coach_conversations')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      logger.error('[API /api/coach/history DELETE] Database delete error', deleteError, { userId: user.id });
      return NextResponse.json({ message: 'Failed to clear conversation history.' }, { status: 500 });
    }

    logger.info('User cleared conversation history', { userId: user.id });

    return NextResponse.json({ message: 'Conversation history cleared successfully.' }, { status: 200 });
  } catch (error) {
    logger.error('[API /api/coach/history DELETE] Critical error', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}
