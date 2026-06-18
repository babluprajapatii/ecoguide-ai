import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getUserLevel, awardPoints, checkBadgeUnlock, fetchEarnedBadges } from '@/features/gamification/services/points.service';
import { getXpEarnedSummary } from '@/features/gamification/services/gamification-analytics.service';
import { BADGES, getBadgeBySlug } from '@/features/gamification/data/badges';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gamification
 * Returns user's points, levels, streaks, earned badges, and category completion metrics.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    // 1. Fetch user's points stats
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('total_points, lifetime_points, current_level, current_streak, longest_streak, last_activity_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (pointsError) {
      logger.error('[API /api/gamification GET] User points fetch error', pointsError, { userId: user.id });
      return NextResponse.json({ message: 'Failed to query user points.' }, { status: 500 });
    }

    const totalPoints = userPoints?.total_points ?? 0;
    const lifetimePoints = userPoints?.lifetime_points ?? 0;
    const currentStreak = userPoints?.current_streak ?? 0;
    const longestStreak = userPoints?.longest_streak ?? 0;
    const lastActivityAt = userPoints?.last_activity_at ?? null;

    // 2. Fetch earned badges
    const earnedBadges = await fetchEarnedBadges(user.id);

    // 3. Calculate category completion percentages
    const totalInCategory: Record<string, number> = {
      assessment: 0,
      coaching: 0,
      simulation: 0,
      community: 0,
      sustainability_impact: 0,
      streaks: 0,
    };
    for (const b of BADGES) {
      totalInCategory[b.category] = (totalInCategory[b.category] ?? 0) + 1;
    }

    const earnedInCategory: Record<string, number> = {
      assessment: 0,
      coaching: 0,
      simulation: 0,
      community: 0,
      sustainability_impact: 0,
      streaks: 0,
    };
    for (const eb of earnedBadges) {
      try {
        const badgeDef = getBadgeBySlug(eb.badgeSlug);
        earnedInCategory[badgeDef.category] = (earnedInCategory[badgeDef.category] ?? 0) + 1;
      } catch {
        // Ignore unrecognized badge slugs in DB
      }
    }

    const categoryCompletion = {
      assessment: (totalInCategory.assessment ?? 0) > 0 ? Math.round(((earnedInCategory.assessment ?? 0) / (totalInCategory.assessment ?? 0)) * 100) : 0,
      coaching: (totalInCategory.coaching ?? 0) > 0 ? Math.round(((earnedInCategory.coaching ?? 0) / (totalInCategory.coaching ?? 0)) * 100) : 0,
      simulation: (totalInCategory.simulation ?? 0) > 0 ? Math.round(((earnedInCategory.simulation ?? 0) / (totalInCategory.simulation ?? 0)) * 100) : 0,
      community: (totalInCategory.community ?? 0) > 0 ? Math.round(((earnedInCategory.community ?? 0) / (totalInCategory.community ?? 0)) * 100) : 0,
      sustainability_impact: (totalInCategory.sustainability_impact ?? 0) > 0 ? Math.round(((earnedInCategory.sustainability_impact ?? 0) / (totalInCategory.sustainability_impact ?? 0)) * 100) : 0,
      streaks: (totalInCategory.streaks ?? 0) > 0 ? Math.round(((earnedInCategory.streaks ?? 0) / (totalInCategory.streaks ?? 0)) * 100) : 0,
    };

    // 4. Fetch daily/weekly XP summary
    const xpSummary = await getXpEarnedSummary(user.id);

    return NextResponse.json({
      totalPoints,
      lifetimePoints,
      level: getUserLevel(totalPoints),
      streak: {
        current: currentStreak,
        longest: longestStreak,
        lastActivityAt,
      },
      earnedBadges,
      categoryCompletion,
      xpSummary,
    }, { status: 200 });

  } catch (error) {
    logger.error('[API /api/gamification GET] Server error', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}

/**
 * POST /api/gamification
 * Performs the daily activity check-in to trigger XP updates and badge checks.
 */
export async function POST(_request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    // Award XP for daily check-in (streak_day)
    const pointsAwarded = await awardPoints(user.id, 'streak_day');
    const unlockedBadges = await checkBadgeUnlock(user.id, 'streak_day');

    return NextResponse.json({
      pointsAwarded,
      unlockedBadges,
    }, { status: 200 });

  } catch (error) {
    logger.error('[API /api/gamification POST] Server error', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}
