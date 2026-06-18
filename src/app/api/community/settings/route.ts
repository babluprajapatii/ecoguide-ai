import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limiter';
import { communitySettingsSchema } from '@/features/community/schemas/community.schemas';
import {
  getVisibilitySettings,
  updateCommunitySettings,
} from '@/features/community/services/community-profile.service';

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

    const settings = await getVisibilitySettings(user.id);
    return NextResponse.json(settings, { status: 200, headers });
  } catch (err) {
    logger.error('Error in community settings GET endpoint', { error: err });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const parsed = communitySettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid settings fields', details: parsed.error.format() },
        { status: 400, headers }
      );
    }

    await updateCommunitySettings(user.id, parsed.data);

    logger.info('User updated community settings', {
      userId: user.id,
      optIn: parsed.data.optIn,
      leaderboardOptIn: parsed.data.leaderboardOptIn,
      visibility: parsed.data.publicProfileVisibility,
    });

    return NextResponse.json(parsed.data, { status: 200, headers });
  } catch (err) {
    logger.error('Error in community settings PUT endpoint', { error: err });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers }
    );
  }
}
