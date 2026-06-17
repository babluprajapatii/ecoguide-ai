import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limiter';

interface ProfileData {
  display_name: string | null;
  avatar_url: string | null;
}

interface AssessmentRow {
  user_id: string;
  total_score: number;
  created_at: string;
  profiles: ProfileData | ProfileData[] | null;
}

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
    return NextResponse.json({ message: 'Too many requests. Please try again later.' }, { status: 429, headers });
  }

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401, headers });
  }

  // 1. Fetch opted-in user IDs
  const { data: optedInUsers, error: optInError } = await supabase
    .from('community_profiles')
    .select('id, opt_in')
    .eq('opt_in', true);

  if (optInError) {
    console.error('[API /api/community/preview] Failed to fetch opt-in profiles:', optInError);
    return NextResponse.json({ message: 'Failed to query community settings.' }, { status: 500, headers });
  }

  const optedInIds = new Set((optedInUsers ?? []).map((row) => row.id));

  // Determine if the current user has opted in
  const currentUserOptedIn = optedInIds.has(user.id);

  // 2. Fetch all completed assessments with user profiles
  // Note: we fetch user_id, total_score, created_at, and profile details
  const { data: assessments, error: dbError } = await supabase
    .from('assessments')
    .select(`
      user_id,
      total_score,
      created_at,
      profiles (
        display_name,
        avatar_url
      )
    `)
    .eq('is_complete', true)
    .order('created_at', { ascending: false });

  if (dbError || !assessments) {
    console.error('[API /api/community/preview] Failed to fetch assessments:', dbError);
    return NextResponse.json({ message: 'Failed to load community leaderboard data.' }, { status: 500, headers });
  }

  const typedAssessments = assessments as unknown as AssessmentRow[];

  // 3. Process records: deduplicate to find latest completed assessment for each user
  const latestUserAssessments = new Map<string, { total_score: number; display_name: string; avatar_url: string }>();

  for (const row of typedAssessments) {
    // Only include opted-in users (or the current user themselves, so they can see where they stand)
    const isOptedIn = optedInIds.has(row.user_id);
    const isSelf = row.user_id === user.id;

    if (!isOptedIn && !isSelf) {
      continue;
    }

    if (!latestUserAssessments.has(row.user_id)) {
      // Extract profile details
      let displayName = 'Eco User';
      let avatarUrl = '';
      if (row.profiles) {
        if (Array.isArray(row.profiles)) {
          displayName = row.profiles[0]?.display_name ?? displayName;
          avatarUrl = row.profiles[0]?.avatar_url ?? avatarUrl;
        } else {
          displayName = row.profiles.display_name ?? displayName;
          avatarUrl = row.profiles.avatar_url ?? avatarUrl;
        }
      }

      latestUserAssessments.set(row.user_id, {
        total_score: Number(row.total_score),
        display_name: displayName,
        avatar_url: avatarUrl,
      });
    }
  }

  // Convert map to sorted array (lower score is better rank)
  const leaderboardList = Array.from(latestUserAssessments.entries()).map(([userId, val]) => ({
    userId,
    score: val.total_score,
    displayName: val.display_name,
    avatarUrl: val.avatar_url,
  }));

  leaderboardList.sort((a, b) => a.score - b.score);

  // 4. Assign rankings (handling duplicate scores as equal rank if needed, or index-based)
  const rankedList = leaderboardList.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  // Find current user's position
  const currentUserIndex = rankedList.findIndex((item) => item.userId === user.id);
  const userRankData = currentUserIndex !== -1 ? rankedList[currentUserIndex] : null;

  // 5. Select nearby users (2 above and 2 below current user)
  let nearbyRanks: Array<{ displayName: string; avatarUrl: string; score: number; rank: number; isCurrentUser: boolean }> = [];

  if (currentUserIndex !== -1) {
    const startIndex = Math.max(0, currentUserIndex - 2);
    const endIndex = Math.min(rankedList.length - 1, currentUserIndex + 2);

    for (let i = startIndex; i <= endIndex; i++) {
      const item = rankedList[i]!;
      nearbyRanks.push({
        displayName: item.displayName,
        avatarUrl: item.avatarUrl,
        score: item.score,
        rank: item.rank,
        isCurrentUser: item.userId === user.id,
      });
    }
  } else {
    // If current user has no assessment, just show top 3 opted-in users
    nearbyRanks = rankedList.slice(0, 3).map((item) => ({
      displayName: item.displayName,
      avatarUrl: item.avatarUrl,
      score: item.score,
      rank: item.rank,
      isCurrentUser: false,
    }));
  }

  return NextResponse.json({
    optedIn: currentUserOptedIn,
    currentUserRank: userRankData ? userRankData.rank : null,
    totalOptedInUsers: optedInIds.size,
    leaderboardPreview: nearbyRanks,
  }, { status: 200, headers });
}

/**
 * POST /api/community/preview
 * Toggles the user's leaderboard opt-in status in public.community_profiles.
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request);
  const headers = rateLimitHeaders(rateLimitResult);
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ message: 'Too many requests. Please try again later.' }, { status: 429, headers });
  }

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401, headers });
  }

  let body: { opt_in?: boolean };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body.' }, { status: 400, headers });
  }

  if (body.opt_in === undefined) {
    return NextResponse.json({ message: 'Missing opt_in field.' }, { status: 400, headers });
  }

  const { error: dbError } = await supabase
    .from('community_profiles')
    .upsert({
      id: user.id,
      opt_in: body.opt_in,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (dbError) {
    console.error('[API /api/community/preview POST] Database error:', dbError);
    return NextResponse.json({ message: 'Failed to update community profile.' }, { status: 500, headers });
  }

  return NextResponse.json({ message: 'Community profile updated successfully.', opt_in: body.opt_in }, { status: 200, headers });
}
