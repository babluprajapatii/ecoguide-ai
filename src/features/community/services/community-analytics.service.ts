/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Service for computing and caching community-wide statistics and highlights.
 *
 * Exposes aggregate carbon reduction metrics and user highlight widgets
 * (Top Carbon Saver, Most Improved User, Longest Streak).
 *
 * @module community-analytics.service
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { CommunityStats } from '../types/community.types';

// Cache TTL: 10 minutes
const STATS_TTL_SECONDS = 600;

/**
 * Checks if the community stats cache is stale.
 *
 * @returns Promise<boolean>
 */
export async function isCacheStale(): Promise<boolean> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('community_stats_cache')
      .select('cached_at')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) {
      return true;
    }

    const cachedAt = new Date(data.cached_at).getTime();
    const ageSeconds = (Date.now() - cachedAt) / 1000;
    return ageSeconds > STATS_TTL_SECONDS;
  } catch (err) {
    logger.error('Error checking community stats staleness', { error: err });
    return true;
  }
}

/**
 * Refreshes the community statistics cache by performing analytical queries.
 */
export async function refreshCommunityStats(): Promise<void> {
  const supabase = createClient();
  const startTime = Date.now();
  logger.info('Refreshing community statistics cache');

  try {
    // 1. Fetch total users count
    const { count: totalUsers, error: usersErr } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    if (usersErr) throw usersErr;

    // 2. Fetch 7d active users count (users who earned points in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: activeUsersData, error: activeErr } = await supabase
      .from('points_transactions')
      .select('user_id')
      .gte('awarded_at', sevenDaysAgo);
    if (activeErr) throw activeErr;

    const activeSet = new Set((activeUsersData || []).map((tx) => tx.user_id));
    const activeUsers7d = activeSet.size;

    // 3. Fetch total XP earned
    const { data: xpData, error: xpErr } = await supabase
      .from('user_points')
      .select('total_points');
    if (xpErr) throw xpErr;
    const totalXpEarned = (xpData || []).reduce((sum, row) => sum + (row.total_points || 0), 0);

    // 4. Fetch assessments completed
    const { count: assessmentsCompleted, error: assessErr } = await supabase
      .from('assessments')
      .select('*', { count: 'exact', head: true })
      .eq('is_complete', true);
    if (assessErr) throw assessErr;

    // 5. Fetch simulations saved
    const { count: simulationsSaved, error: simErr } = await supabase
      .from('saved_simulations')
      .select('*', { count: 'exact', head: true });
    if (simErr) throw simErr;

    // 6. Fetch badges earned
    const { count: badgesEarned, error: badgeErr } = await supabase
      .from('user_badges')
      .select('*', { count: 'exact', head: true });
    if (badgeErr) throw badgeErr;

    // 7. Fetch all completed assessments to calculate avg footprint and highlights
    // We join profile details and community opt-in / visibility settings.
    const { data: assessments, error: allAssessErr } = await supabase
      .from('assessments')
      .select(`
        user_id,
        total_score,
        created_at,
        profiles (
          display_name
        ),
        community_profiles:user_id (
          opt_in,
          public_profile_visibility
        )
      `)
      .eq('is_complete', true) as any;
    if (allAssessErr) throw allAssessErr;

    // Deduplicate assessments to latest per user in memory
    const userLatestAssessments = new Map<string, any>();
    const userFirstAssessments = new Map<string, any>();

    // Sort by created_at ascending to find first vs last
    const sortedAssessments = [...(assessments || [])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    for (const record of sortedAssessments) {
      const userId = record.user_id;
      if (!userFirstAssessments.has(userId)) {
        userFirstAssessments.set(userId, record);
      }
      userLatestAssessments.set(userId, record); // will overwrite, ending up with the latest
    }

    // Calculate average carbon footprint of the latest completed assessments
    const latestAssessmentsList = Array.from(userLatestAssessments.values());
    const avgCarbonFootprint =
      latestAssessmentsList.length > 0
        ? latestAssessmentsList.reduce((sum, r) => sum + Number(r.total_score || 0), 0) /
          latestAssessmentsList.length
        : 0;

    // Filter public & opted-in users for highlight widgets
    const publicLatestAssessments = latestAssessmentsList.filter((r) => {
      const cp = Array.isArray(r.community_profiles) ? r.community_profiles[0] : r.community_profiles;
      return cp?.opt_in === true && cp?.public_profile_visibility === 'public';
    });

    // WIDGET 1: Top Carbon Saver (lowest total_score in latest assessment)
    let topCarbonSaverUserId: string | null = null;
    let topCarbonSaverName: string | null = null;
    let topCarbonSaverScore = 0;

    if (publicLatestAssessments.length > 0) {
      let topSaver = publicLatestAssessments[0];
      for (const record of publicLatestAssessments) {
        if (record.total_score < topSaver.total_score) {
          topSaver = record;
        }
      }
      topCarbonSaverUserId = topSaver.user_id;
      topCarbonSaverName = topSaver.profiles?.display_name || 'Anonymous';
      topCarbonSaverScore = topSaver.total_score;
    }

    // WIDGET 2: Most Improved User (highest improvement = first_score - latest_score)
    let mostImprovedUserId: string | null = null;
    let mostImprovedName: string | null = null;
    let mostImprovedReduction = 0;

    const improvementCandidates = publicLatestAssessments.map((latest) => {
      const first = userFirstAssessments.get(latest.user_id);
      const reduction = first ? Number(first.total_score) - Number(latest.total_score) : 0;
      return {
        userId: latest.user_id,
        name: latest.profiles?.display_name || 'Anonymous',
        reduction,
      };
    });

    if (improvementCandidates.length > 0) {
      let mostImproved = improvementCandidates[0]!;
      for (const cand of improvementCandidates) {
        if (cand.reduction > mostImproved.reduction) {
          mostImproved = cand;
        }
      }
      if (mostImproved.reduction > 0) {
        mostImprovedUserId = mostImproved.userId;
        mostImprovedName = mostImproved.name;
        mostImprovedReduction = mostImproved.reduction;
      }
    }

    // WIDGET 3: Longest Streak (user with highest longest_streak)
    let longestStreakUserId: string | null = null;
    let longestStreakName: string | null = null;
    let longestStreakDays = 0;

    const { data: streakData, error: streakErr } = await supabase
      .from('user_points')
      .select(`
        user_id,
        longest_streak,
        profiles (
          display_name
        ),
        community_profiles:user_id (
          opt_in,
          public_profile_visibility
        )
      `) as any;

    if (!streakErr && streakData) {
      const publicStreakUsers = (streakData || []).filter((r: any) => {
        const cp = Array.isArray(r.community_profiles) ? r.community_profiles[0] : r.community_profiles;
        return cp?.opt_in === true && cp?.public_profile_visibility === 'public';
      });

      if (publicStreakUsers.length > 0) {
        let topStreak = publicStreakUsers[0];
        for (const row of publicStreakUsers) {
          if (row.longest_streak > topStreak.longest_streak) {
            topStreak = row;
          }
        }
        longestStreakUserId = topStreak.user_id;
        longestStreakName = topStreak.profiles?.display_name || 'Anonymous';
        longestStreakDays = topStreak.longest_streak;
      }
    }

    // 8. Upsert single row (id=1) in community_stats_cache
    const updatePayload = {
      id: 1,
      total_users: totalUsers || 0,
      active_users_7d: activeUsers7d,
      total_xp_earned: totalXpEarned,
      assessments_completed: assessmentsCompleted || 0,
      simulations_saved: simulationsSaved || 0,
      badges_earned: badgesEarned || 0,
      avg_carbon_footprint: parseFloat(avgCarbonFootprint.toFixed(2)),
      top_carbon_saver_user_id: topCarbonSaverUserId,
      top_carbon_saver_name: topCarbonSaverName,
      top_carbon_saver_score: parseFloat(topCarbonSaverScore.toFixed(2)),
      most_improved_user_id: mostImprovedUserId,
      most_improved_name: mostImprovedName,
      most_improved_reduction: parseFloat(mostImprovedReduction.toFixed(2)),
      longest_streak_user_id: longestStreakUserId,
      longest_streak_name: longestStreakName,
      longest_streak_days: longestStreakDays,
      cached_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await supabase
      .from('community_stats_cache')
      .upsert(updatePayload);

    if (upsertErr) throw upsertErr;

    const duration = Date.now() - startTime;
    logger.info('Community statistics cache refreshed successfully', { durationMs: duration });
  } catch (err) {
    logger.error('Failed to refresh community statistics cache', { error: err });
    throw err;
  }
}

/**
 * Gets cached community stats.
 *
 * @returns Promise<CommunityStats | null>
 */
export async function getCommunityStats(): Promise<CommunityStats | null> {
  const supabase = createClient();

  if (await isCacheStale()) {
    try {
      await refreshCommunityStats();
    } catch (err) {
      logger.error('Error auto-refreshing community stats', { error: err });
    }
  }

  const { data, error } = await supabase
    .from('community_stats_cache')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data) {
    logger.error('Error retrieving community stats from cache', { error });
    return null;
  }

  return {
    totalUsers: data.total_users,
    activeUsers7d: data.active_users_7d,
    totalXpEarned: Number(data.total_xp_earned),
    assessmentsCompleted: data.assessments_completed,
    simulationsSaved: data.simulations_saved,
    badgesEarned: data.badges_earned,
    avgCarbonFootprint: Number(data.avg_carbon_footprint),
    topCarbonSaver: {
      userId: data.top_carbon_saver_user_id,
      displayName: data.top_carbon_saver_name,
      value: Number(data.top_carbon_saver_score),
    },
    mostImprovedUser: {
      userId: data.most_improved_user_id,
      displayName: data.most_improved_name,
      value: Number(data.most_improved_reduction),
    },
    longestStreakUser: {
      userId: data.longest_streak_user_id,
      displayName: data.longest_streak_name,
      value: data.longest_streak_days,
    },
    cachedAt: data.cached_at,
  };
}
