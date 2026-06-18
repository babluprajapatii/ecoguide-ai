import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limiter';
import { getCommunityStats } from '@/features/community/services/community-analytics.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimitResult = await checkRateLimit(request);
  const headers = rateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.allowed) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers }
    );
  }

  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    const stats = await getCommunityStats();
    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to retrieve community statistics' },
        { status: 500, headers }
      );
    }

    return NextResponse.json(stats, { status: 200, headers });
  } catch (err) {
    logger.error('Error in community stats GET endpoint', { error: err });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers }
    );
  }
}
