/**
 * Service for managing the community leaderboard and ranking cache.
 *
 * Centralizes the calculation of leaderboard standings, rank change tracking,
 * caching mechanism, and anti-abuse detection for XP farming.
 *
 * @module leaderboard.service
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getLevel } from '@/features/gamification/services/level.service';
import type {
  LeaderboardEntry,
  CurrentUserRank,
  LeaderboardCacheRow,
} from '../types/community.types';

// Cache configuration: 5 minutes TTL
const CACHE_TTL_SECONDS = 300;

interface ProfilesQueryResult {
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface CommunityProfilesQueryResult {
  leaderboard_opt_in: boolean;
  public_profile_visibility: string;
}

interface UserPointsQueryResult {
  user_id: string;
  total_points: number;
  current_level: number;
  longest_streak: number;
  profiles: ProfilesQueryResult | ProfilesQueryResult[] | null;
  community_profiles: CommunityProfilesQueryResult | CommunityProfilesQueryResult[] | null;
}

/**
 * Checks if the leaderboard cache is stale.
 *
 * @returns Promise<boolean> - True if the cache is stale or empty.
 */
export async function isCacheStale(): Promise<boolean> {
  const supabase = createClient();
  try {
    const query = supabase.from('leaderboard_rank_cache').select('cached_at').limit(1);

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return true;
    }

    const cachedAt = new Date(data[0]!.cached_at).getTime();
    const ageSeconds = (Date.now() - cachedAt) / 1000;
    return ageSeconds > CACHE_TTL_SECONDS;
  } catch (err) {
    logger.error('Error checking leaderboard cache staleness', { error: err });
    return true;
  }
}

/**
 * Gets the age of the leaderboard cache in seconds.
 *
 * @returns Promise<number> - Age of the cache, or Infinity if empty/error.
 */
export async function getCacheAge(): Promise<number> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('leaderboard_rank_cache')
      .select('cached_at')
      .limit(1);

    if (error || !data || data.length === 0) {
      return Infinity;
    }

    const cachedAt = new Date(data[0]!.cached_at).getTime();
    return (Date.now() - cachedAt) / 1000;
  } catch (err) {
    logger.error('Error getting leaderboard cache age', { error: err });
    return Infinity;
  }
}

/**
 * Refreshes the leaderboard rank cache by recomputing rankings from live data.
 * Enforces the deterministic tie-breaking rules and detects suspicious XP gains.
 */
export async function refreshLeaderboardCache(): Promise<void> {
  const supabase = createClient();
  const startTime = Date.now();
  logger.info('Starting leaderboard cache refresh');

  try {
    // 1. Fetch current ranks to compute rank change
    const { data: existingCache, error: cacheError } = await supabase
      .from('leaderboard_rank_cache')
      .select('user_id, rank');

    const previousRanks = new Map<string, number>();
    if (!cacheError && existingCache) {
      for (const row of existingCache) {
        previousRanks.set(row.user_id, row.rank);
      }
    }

    // 2. Fetch all opted-in, public users with points and profile details
    // We fetch user_points, profile (display_name, avatar_url, created_at), and community_profiles
    const { data: users, error: usersError } = (await supabase.from('user_points').select(`
        user_id,
        total_points,
        current_level,
        longest_streak,
        profiles (
          display_name,
          avatar_url,
          created_at
        ),
        community_profiles:user_id (
          leaderboard_opt_in,
          public_profile_visibility
        )
      `)) as unknown as { data: UserPointsQueryResult[] | null; error: { message: string } | null };

    if (usersError) {
      throw usersError;
    }

    // Filter to users who have opted into the leaderboard and are public
    const filteredUsers = (users || []).filter((u) => {
      const cpRaw = u.community_profiles;
      const cp = Array.isArray(cpRaw) ? cpRaw[0] : cpRaw;
      return cp?.leaderboard_opt_in === true && cp?.public_profile_visibility === 'public';
    });

    // 3. Fetch badge counts for all users in parallel
    const { data: badges, error: badgesError } = await supabase
      .from('user_badges')
      .select('user_id');

    const badgeCounts = new Map<string, number>();
    if (!badgesError && badges) {
      for (const b of badges) {
        badgeCounts.set(b.user_id, (badgeCounts.get(b.user_id) || 0) + 1);
      }
    }

    // 4. Sort by deterministic ranking order:
    // 1) total_points DESC
    // 2) current_level DESC
    // 3) longest_streak DESC
    // 4) profiles.created_at ASC
    filteredUsers.sort((a, b) => {
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points;
      }
      if (b.current_level !== a.current_level) {
        return b.current_level - a.current_level;
      }
      if (b.longest_streak !== a.longest_streak) {
        return b.longest_streak - a.longest_streak;
      }
      const profARaw = a.profiles;
      const profA = Array.isArray(profARaw) ? profARaw[0] : profARaw;
      const profBRaw = b.profiles;
      const profB = Array.isArray(profBRaw) ? profBRaw[0] : profBRaw;
      const dateA = new Date(profA?.created_at || 0).getTime();
      const dateB = new Date(profB?.created_at || 0).getTime();
      return dateA - dateB;
    });

    // 5. Build new cache rows
    const cachedAtStr = new Date().toISOString();
    const newCacheRows = filteredUsers.map((u, index) => {
      const newRank = index + 1;
      const prevRank = previousRanks.get(u.user_id) || null;
      const rankChange = prevRank !== null ? prevRank - newRank : 0;
      const profRaw = u.profiles;
      const prof = Array.isArray(profRaw) ? profRaw[0] : profRaw;

      return {
        user_id: u.user_id,
        rank: newRank,
        previous_rank: prevRank,
        rank_change: rankChange,
        total_points: u.total_points,
        current_level: u.current_level,
        longest_streak: u.longest_streak,
        display_name: prof?.display_name || 'Anonymous User',
        avatar_url: prof?.avatar_url || null,
        badge_count: badgeCounts.get(u.user_id) || 0,
        cached_at: cachedAtStr,
      };
    });

    // 6. Bulk delete and insert new cache
    // Perform inside a single workflow since Supabase doesn't support transaction blocks over REST.
    // Clean cache first
    const deleteQuery = supabase
      .from('leaderboard_rank_cache')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000');
    await deleteQuery;

    if (newCacheRows.length > 0) {
      // Supabase insert supports bulk
      const insertQuery = supabase.from('leaderboard_rank_cache').insert(newCacheRows);
      const { error: insertError } = await insertQuery;
      if (insertError) {
        throw insertError;
      }
    }

    // 7. Check for suspicious XP activity (>500 XP in the last hour)
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { data: recentTransactions } = await supabase
      .from('points_transactions')
      .select('user_id, points')
      .gte('awarded_at', oneHourAgo);

    if (recentTransactions) {
      const userXpSum = new Map<string, number>();
      for (const tx of recentTransactions) {
        userXpSum.set(tx.user_id, (userXpSum.get(tx.user_id) || 0) + tx.points);
      }

      userXpSum.forEach((xp, uid) => {
        if (xp > 500) {
          logger.warn('Suspicious XP gain activity detected', {
            userId: uid,
            xpGained: xp,
            timeWindow: '1 hour',
          });
        }
      });
    }

    const duration = Date.now() - startTime;
    logger.info('Leaderboard cache refreshed successfully', {
      totalRanked: newCacheRows.length,
      durationMs: duration,
    });
  } catch (err) {
    logger.error('Failed to refresh leaderboard cache', { error: err });
    throw err;
  }
}

/**
 * Gets global leaderboard entries (paginated).
 *
 * @param page — 1-based page number.
 * @param limit — Number of records per page.
 * @returns Paginated LeaderboardEntry array.
 */
export async function getGlobalLeaderboard(
  page: number,
  limit: number,
): Promise<LeaderboardEntry[]> {
  const supabase = createClient();
  const offset = (page - 1) * limit;

  // Auto-refresh cache if stale
  if (await isCacheStale()) {
    try {
      await refreshLeaderboardCache();
    } catch (err) {
      logger.error('Error auto-refreshing leaderboard cache', { error: err });
    }
  }

  const query = supabase
    .from('leaderboard_rank_cache')
    .select('*')
    .order('rank', { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) {
    logger.error('Error fetching global leaderboard', { error });
    return [];
  }

  return (data || []).map((row: LeaderboardCacheRow) => ({
    rank: row.rank,
    previousRank: row.previous_rank,
    rankChange: row.rank_change,
    userId: row.user_id,
    displayName: row.display_name || 'Anonymous User',
    avatarUrl: row.avatar_url,
    totalPoints: row.total_points,
    level: row.current_level,
    levelName: getLevel(row.total_points).name,
    badgeCount: row.badge_count,
    longestStreak: row.longest_streak,
    isCurrentUser: false, // Set at route/client level
  }));
}

/**
 * Gets nearby rankings for a specific user, returning a range of users
 * above and below the current user in rank.
 *
 * @param userId - ID of the user.
 * @param range - Number of users above/below to fetch.
 * @returns Array of LeaderboardEntries surrounding the user.
 */
export async function getNearbyRankings(
  userId: string,
  range: number,
): Promise<LeaderboardEntry[]> {
  const supabase = createClient();

  if (await isCacheStale()) {
    try {
      await refreshLeaderboardCache();
    } catch (err) {
      logger.error('Error auto-refreshing leaderboard cache', { error: err });
    }
  }

  // Get current user's rank
  const { data: userCacheRow } = await supabase
    .from('leaderboard_rank_cache')
    .select('rank')
    .eq('user_id', userId)
    .maybeSingle();

  if (!userCacheRow) {
    // If not in cache (e.g. hidden or not opted in), return top performers instead
    return getTopPerformers(range * 2 + 1);
  }

  const userRank = userCacheRow.rank;
  const startRank = Math.max(1, userRank - range);
  const endRank = userRank + range;

  const { data, error } = await supabase
    .from('leaderboard_rank_cache')
    .select('*')
    .gte('rank', startRank)
    .lte('rank', endRank)
    .order('rank', { ascending: true });

  if (error) {
    logger.error('Error fetching nearby rankings', { error });
    return [];
  }

  return (data || []).map((row: LeaderboardCacheRow) => ({
    rank: row.rank,
    previousRank: row.previous_rank,
    rankChange: row.rank_change,
    userId: row.user_id,
    displayName: row.display_name || 'Anonymous User',
    avatarUrl: row.avatar_url,
    totalPoints: row.total_points,
    level: row.current_level,
    levelName: getLevel(row.total_points).name,
    badgeCount: row.badge_count,
    longestStreak: row.longest_streak,
    isCurrentUser: row.user_id === userId,
  }));
}

/**
 * Fetches the top performers (highest ranks).
 *
 * @param limit — Maximum number of entries.
 * @returns Array of top LeaderboardEntries.
 */
export async function getTopPerformers(limit: number): Promise<LeaderboardEntry[]> {
  const supabase = createClient();

  if (await isCacheStale()) {
    try {
      await refreshLeaderboardCache();
    } catch (err) {
      logger.error('Error auto-refreshing leaderboard cache', { error: err });
    }
  }

  const query = supabase
    .from('leaderboard_rank_cache')
    .select('*')
    .order('rank', { ascending: true })
    .limit(limit);

  const { data, error } = await query;
  if (error) {
    logger.error('Error fetching top performers', { error });
    return [];
  }

  return (data || []).map((row: LeaderboardCacheRow) => ({
    rank: row.rank,
    previousRank: row.previous_rank,
    rankChange: row.rank_change,
    userId: row.user_id,
    displayName: row.display_name || 'Anonymous User',
    avatarUrl: row.avatar_url,
    totalPoints: row.total_points,
    level: row.current_level,
    levelName: getLevel(row.total_points).name,
    badgeCount: row.badge_count,
    longestStreak: row.longest_streak,
    isCurrentUser: false,
  }));
}

/**
 * Gets the ranking context for a specific user.
 *
 * @param userId - ID of the user.
 * @returns Promise<CurrentUserRank>
 */
export async function getUserRank(userId: string): Promise<CurrentUserRank> {
  const supabase = createClient();

  // 1. Try to get from cache first
  const { data: cacheRow } = await supabase
    .from('leaderboard_rank_cache')
    .select('rank, total_points, current_level')
    .eq('user_id', userId)
    .maybeSingle();

  // 2. Fetch opt-in state to know if they participate
  const { data: cpRow } = await supabase
    .from('community_profiles')
    .select('leaderboard_opt_in')
    .eq('id', userId)
    .maybeSingle();

  const isOptedIn = cpRow?.leaderboard_opt_in === true;

  if (cacheRow) {
    return {
      rank: cacheRow.rank,
      totalPoints: cacheRow.total_points,
      level: cacheRow.current_level,
      isOptedIn,
    };
  }

  // 3. Fallback to live points if user is not in cache (e.g. hidden or cache not updated)
  const { data: pointsRow } = await supabase
    .from('user_points')
    .select('total_points, current_level')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    rank: null,
    totalPoints: pointsRow?.total_points || 0,
    level: pointsRow?.current_level || 1,
    isOptedIn,
  };
}

/**
 * Gets the total count of entries currently in the cache.
 *
 * @returns Promise<number>
 */
export async function getLeaderboardTotalCount(): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('leaderboard_rank_cache')
    .select('*', { count: 'exact', head: true });

  if (error) {
    logger.error('Error counting leaderboard entries', { error });
    return 0;
  }
  return count || 0;
}
