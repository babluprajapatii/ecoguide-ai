import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

/**
 * Calculates a consecutive day streak of completed assessments.
 *
 * @param createdDates - Array of ISO date strings for completed assessments.
 * @returns The current consecutive day streak.
 */
function calculateStreak(createdDates: string[]): number {
  if (createdDates.length === 0) return 0;

  // Deduplicate dates by formatting to YYYY-MM-DD in local time
  const dates = Array.from(
    new Set(
      createdDates.map((d) => {
        const date = new Date(d);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
          date.getDate(),
        ).padStart(2, '0')}`;
      }),
    ),
  ).sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

  if (dates.length === 0) return 0;

  const todayStr = getLocalDateString(new Date());
  const yesterdayStr = getLocalDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));

  const newestDate = dates[0];

  // If the newest assessment is older than yesterday, the streak is broken (0)
  if (newestDate !== todayStr && newestDate !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  const currentDate = new Date(newestDate!);
  let hasNext = true;

  // Scan backwards day-by-day
  while (hasNext) {
    currentDate.setDate(currentDate.getDate() - 1);
    const targetDateStr = getLocalDateString(currentDate);

    if (dates.includes(targetDateStr)) {
      streak++;
    } else {
      hasNext = false;
    }
  }

  return streak;
}

function getLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

/**
 * GET /api/coach/dashboard
 * Compiles real-time metrics for the AI coach dashboard panel.
 */
export async function GET(request: NextRequest) {
  // 1. Rate limiting
  const rateLimitRes = checkRateLimit(request);
  const headers = rateLimitHeaders(rateLimitRes);

  if (!rateLimitRes.allowed) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers });
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401, headers });
    }

    // 1. Fetch conversations count and last conversation date
    const { data: conversations, error: convError } = await supabase
      .from('coach_conversations')
      .select('created_at, role')
      .eq('user_id', user.id);

    if (convError) {
      logger.error('[API /api/coach/dashboard GET] Conversations query error', convError, {
        userId: user.id,
      });
      return NextResponse.json({ message: 'Failed to query conversations data.' }, { status: 500 });
    }

    const userMessages = conversations.filter((c) => c.role === 'user');
    const conversationCount = userMessages.length;
    const lastConversationDate =
      userMessages.length > 0
        ? userMessages.reduce((max, curr) => (curr.created_at > max.created_at ? curr : max))
            .created_at
        : null;

    // 2. Fetch recommendations status breakdowns
    const { data: recommendations, error: recError } = await supabase
      .from('coach_recommendations')
      .select('status')
      .eq('user_id', user.id);

    if (recError) {
      logger.error('[API /api/coach/dashboard GET] Recommendations query error', recError, {
        userId: user.id,
      });
      return NextResponse.json(
        { message: 'Failed to query recommendations data.' },
        { status: 500 },
      );
    }

    const insightsCount = recommendations.length;
    const activeRecommendations = recommendations.filter((r) => r.status === 'pending').length;
    const completedRecommendations = recommendations.filter((r) => r.status === 'completed').length;

    // 3. Fetch completed assessments to calculate streak
    const { data: assessments, error: assessmentError } = await supabase
      .from('assessments')
      .select('created_at')
      .eq('is_complete', true)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (assessmentError) {
      logger.error('[API /api/coach/dashboard GET] Assessments query error', assessmentError, {
        userId: user.id,
      });
      return NextResponse.json({ message: 'Failed to query assessments data.' }, { status: 500 });
    }

    const streak = calculateStreak(assessments.map((a) => a.created_at));

    return NextResponse.json(
      {
        conversationCount,
        insightsCount,
        activeRecommendations,
        completedRecommendations,
        lastConversationDate,
        streak,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error('[API /api/coach/dashboard GET] Critical error', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}
