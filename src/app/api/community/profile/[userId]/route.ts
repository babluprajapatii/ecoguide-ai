import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limiter';
import { getPublicProfile } from '@/features/community/services/community-profile.service';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  const rateLimitResult = await checkRateLimit(request);
  const headers = rateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.allowed) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers },
    );
  }

  const { userId: targetUserId } = params;

  if (!targetUserId || !UUID_REGEX.test(targetUserId)) {
    return NextResponse.json({ error: 'Invalid User ID' }, { status: 400, headers });
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    const profile = await getPublicProfile(user.id, targetUserId);
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found or is private' },
        { status: 404, headers },
      );
    }

    return NextResponse.json(profile, { status: 200, headers });
  } catch (err) {
    logger.error('Error in community public profile GET endpoint', {
      targetUserId,
      error: err,
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers });
  }
}
