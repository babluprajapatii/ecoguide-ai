import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limiter';
import { leaderboardQuerySchema } from '@/features/community/schemas/community.schemas';
import type { LeaderboardEntry } from '@/features/community/types/community.types';
import {
  getGlobalLeaderboard,
  getNearbyRankings,
  getTopPerformers,
  getUserRank,
  getLeaderboardTotalCount,
} from '@/features/community/services/leaderboard.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // 1. Rate Limiting
  const rateLimitResult = await checkRateLimit(request);
  const headers = rateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.allowed) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers },
    );
  }

  try {
    // 2. Authentication
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    // 3. Validate Query Parameters
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get('page') || '1',
      limit: url.searchParams.get('limit') || '20',
      view: url.searchParams.get('view') || 'global',
    };

    const parsed = leaderboardQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.format() },
        { status: 400, headers },
      );
    }

    const { page, limit, view } = parsed.data;

    // 4. Fetch Leaderboard Data depending on View
    let rankings: LeaderboardEntry[] = [];
    if (view === 'global') {
      rankings = await getGlobalLeaderboard(page, limit);
    } else if (view === 'nearby') {
      rankings = await getNearbyRankings(user.id, 5);
    } else if (view === 'top') {
      rankings = await getTopPerformers(limit);
    }

    // 5. Fetch current user rank context
    const currentUserContext = await getUserRank(user.id);

    // Flag current user entry in rankings list
    const mappedRankings = rankings.map((entry) => ({
      ...entry,
      isCurrentUser: entry.userId === user.id,
    }));

    // 6. Get total pagination count
    const totalEntries = await getLeaderboardTotalCount();
    const totalPages = Math.ceil(totalEntries / limit) || 1;

    // 7. Log duration and request details
    const duration = Date.now() - startTime;
    logger.info('Leaderboard query handled', {
      view,
      page,
      limit,
      durationMs: duration,
    });

    return NextResponse.json(
      {
        rankings: mappedRankings,
        currentUser: currentUserContext,
        pagination: {
          page,
          limit,
          totalEntries,
          totalPages,
        },
      },
      { status: 200, headers },
    );
  } catch (err) {
    logger.error('Error in leaderboard GET endpoint', {
      error: err instanceof Error ? { message: err.message, stack: err.stack } : err,
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers });
  }
}
