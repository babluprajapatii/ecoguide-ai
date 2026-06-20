import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limiter';
import { z } from 'zod';
import {
  getNearbyRankings,
  getUserRank,
  getLeaderboardTotalCount,
} from '@/features/community/services/leaderboard.service';
import {
  getVisibilitySettings,
  updateCommunitySettings,
} from '@/features/community/services/community-profile.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/community/preview
 *
 * Returns community leaderboard preview ranks, showing nearby users.
 * Enforces authentication, rate limits, and community opt-in privacy constraints.
 */
export async function GET(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request);
  const headers = rateLimitHeaders(rateLimitResult);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { message: 'Too many requests. Please try again later.' },
      { status: 429, headers },
    );
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401, headers });
  }

  try {
    const settings = await getVisibilitySettings(user.id);
    const userRankContext = await getUserRank(user.id);
    const totalOptedIn = await getLeaderboardTotalCount();

    // Fetch nearby rankings (which fallback to top performers if user is not in cache)
    const nearby = await getNearbyRankings(user.id, 2);

    const mappedPreview = nearby.map((entry) => ({
      displayName: entry.displayName,
      avatarUrl: entry.avatarUrl ?? '',
      score: entry.totalPoints, // Return points as score
      rank: entry.rank,
      isCurrentUser: entry.userId === user.id,
    }));

    return NextResponse.json(
      {
        optedIn: settings.optIn && settings.leaderboardOptIn,
        currentUserRank: userRankContext.rank,
        totalOptedInUsers: totalOptedIn,
        leaderboardPreview: mappedPreview,
      },
      { status: 200, headers },
    );
  } catch (err) {
    console.error('[API /api/community/preview] Failed:', err);
    return NextResponse.json(
      { message: 'Failed to query community settings.' },
      { status: 500, headers },
    );
  }
}

/**
 * POST /api/community/preview
 * Toggles the user's leaderboard opt-in status in public.community_profiles.
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request);
  const headers = rateLimitHeaders(rateLimitResult);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { message: 'Too many requests. Please try again later.' },
      { status: 429, headers },
    );
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401, headers });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body.' }, { status: 400, headers });
  }

  const optInSchema = z.object({
    opt_in: z.boolean({
      required_error: 'opt_in is required',
      invalid_type_error: 'opt_in must be a boolean',
    }),
  });

  const parseResult = optInSchema.safeParse(body);
  if (!parseResult.success) {
    const fieldErrors = parseResult.error.flatten().fieldErrors;
    if (fieldErrors.opt_in && fieldErrors.opt_in.includes('opt_in is required')) {
      return NextResponse.json({ message: 'Missing opt_in field.' }, { status: 400, headers });
    }
    return NextResponse.json(
      { message: 'Validation failed.', errors: fieldErrors },
      { status: 400, headers },
    );
  }

  const { opt_in } = parseResult.data;

  try {
    const currentSettings = await getVisibilitySettings(user.id);
    await updateCommunitySettings(user.id, {
      optIn: opt_in,
      leaderboardOptIn: opt_in,
      publicProfileVisibility: opt_in ? 'public' : 'hidden',
      bio: currentSettings.bio || '',
    });

    return NextResponse.json(
      {
        message: 'Community profile updated successfully.',
        opt_in: opt_in,
      },
      { status: 200, headers },
    );
  } catch (err) {
    console.error('[API /api/community/preview POST] Failed:', err);
    return NextResponse.json(
      { message: 'Failed to update community profile.' },
      { status: 500, headers },
    );
  }
}
