/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Points & Streaks Service.
 *
 * Handles point awards, daily limits (cooldown checks), level recalculations,
 * streak evaluations, and badge unlock checking hooks.
 *
 * @module points.service
 */

import { createClient } from '@/lib/supabase/server';
import { getLevel } from './level.service';
import { evaluateStreak } from './streak.service';
import type {
  BadgeDefinition,
  EarnedBadge,
  GamificationAction,
  Level,
  BadgeSlug,
} from '@/features/gamification/types/gamification.types';

// ---------------------------------------------------------------------------
// Action Points & Daily Cooldown Limits
// ---------------------------------------------------------------------------

export const ACTION_POINTS: Record<GamificationAction, number> = {
  complete_assessment: 100,
  update_assessment: 25,
  use_coach: 10,
  complete_recommendation: 50,
  run_simulator: 20,
  join_challenge: 50,
  streak_day: 10,
};

export const DAILY_LIMITS: Partial<Record<GamificationAction, number>> = {
  use_coach: 50, // Max 50 XP per day (5 coach messages)
  run_simulator: 100, // Max 100 XP per day (5 simulation runs)
  update_assessment: 25, // Max 25 XP per day (1 assessment update)
  streak_day: 10, // Max 10 XP per day (1 check-in)
};

// ---------------------------------------------------------------------------
// getUserLevel (Pure Wrapper)
// ---------------------------------------------------------------------------

/**
 * Determines the user's current level from their total points.
 *
 * @param totalPoints — cumulative points earned.
 * @returns The user's current Level with progress within that level.
 */
export function getUserLevel(totalPoints: number): Level {
  return getLevel(totalPoints);
}

// ---------------------------------------------------------------------------
// awardPoints
// ---------------------------------------------------------------------------

/**
 * Awards points to a user for a specific action, applying daily limits and
 * updating streaks.
 *
 * @param userId — The user's ID.
 * @param action — The gamification action performed.
 * @param points — Optional explicit points override (falls back to action default).
 * @returns The number of points actually awarded after daily limits check.
 */
export async function awardPoints(
  userId: string,
  action: GamificationAction,
  points?: number,
): Promise<number> {
  const supabase = createClient();
  const defaultPoints = ACTION_POINTS[action] ?? 0;
  const pointsToAwardRaw = points !== undefined ? points : defaultPoints;

  // 1. Check daily limit if applicable
  let pointsToAward = pointsToAwardRaw;
  const limit = DAILY_LIMITS[action];
  if (limit !== undefined) {
    const now = new Date();
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
    );

    let query = supabase
      .from('points_transactions')
      .select('points')
      .eq('user_id', userId)
      .eq('action', action);

    if (typeof (query as any).gte === 'function') {
      query = (query as any).gte('awarded_at', startOfDay.toISOString());
    }

    const { data: txs, error: txError } = await query;

    if (txError) {
      console.error('[points.service] Failed to fetch daily transactions:', txError.message);
      throw new Error(`Failed to award points: ${txError.message}`);
    }

    const txsArray = Array.isArray(txs) ? txs : [];
    const todayEarned = txsArray.reduce((sum, tx) => sum + (tx.points as number), 0);
    if (todayEarned >= limit) {
      return 0; // Daily cap reached
    }
    pointsToAward = Math.min(pointsToAward, limit - todayEarned);
  }

  if (pointsToAward <= 0) {
    return 0;
  }

  const nowISO = new Date().toISOString();

  // 2. Log in points_transactions history
  const { error: txError } = await supabase.from('points_transactions').insert({
    user_id: userId,
    action,
    points: pointsToAward,
    awarded_at: nowISO,
  });

  if (txError) {
    console.error('[points.service] Failed to insert transaction:', txError.message);
    throw new Error(`Failed to award points: ${txError.message}`);
  }

  // 3. Fetch running totals to update user_points record
  const { data: userPointsData, error: fetchError } = await supabase
    .from('user_points')
    .select('id, total_points, lifetime_points, current_streak, longest_streak, last_activity_at')
    .eq('user_id', userId);

  const userPoints = userPointsData?.[0] ?? null;

  if (fetchError) {
    console.error('[points.service] Failed to fetch user points:', fetchError.message);
    throw new Error(`Failed to award points: ${fetchError.message}`);
  }

  let finalTotal = pointsToAward;
  let finalLifetime = pointsToAward;
  let finalStreak = 1;
  let finalLongest = 1;
  let finalLastActivity = nowISO;

  if (userPoints) {
    const streakResult = evaluateStreak(
      userPoints.last_activity_at,
      userPoints.current_streak,
      userPoints.longest_streak,
    );

    finalTotal = userPoints.total_points + pointsToAward;
    finalLifetime = userPoints.lifetime_points + pointsToAward;
    finalStreak = streakResult.currentStreak;
    finalLongest = streakResult.longestStreak;
    finalLastActivity = streakResult.lastActivityAt;

    const currentLevel = getLevel(finalTotal).rank;

    const { error: updateError } = await supabase
      .from('user_points')
      .update({
        total_points: finalTotal,
        lifetime_points: finalLifetime,
        current_level: currentLevel,
        current_streak: finalStreak,
        longest_streak: finalLongest,
        last_activity_at: finalLastActivity,
        updated_at: nowISO,
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[points.service] Failed to update user points:', updateError.message);
      throw new Error(`Failed to award points: ${updateError.message}`);
    }
  } else {
    const currentLevel = getLevel(finalTotal).rank;
    const { error: insertError } = await supabase.from('user_points').insert({
      user_id: userId,
      total_points: finalTotal,
      lifetime_points: finalLifetime,
      current_level: currentLevel,
      current_streak: finalStreak,
      longest_streak: finalLongest,
      last_activity_at: finalLastActivity,
      created_at: nowISO,
      updated_at: nowISO,
    });

    if (insertError) {
      console.error('[points.service] Failed to insert user points:', insertError.message);
      throw new Error(`Failed to award points: ${insertError.message}`);
    }
  }

  return pointsToAward;
}

// ---------------------------------------------------------------------------
// checkBadgeUnlock
// ---------------------------------------------------------------------------

/**
 * Checks if a gamification action unlocks any new badges for the user.
 *
 * Delegates to badge.service dynamically to prevent circular imports.
 *
 * @param userId — The user's ID.
 * @param action — The gamification action just performed.
 * @returns Array of newly unlocked BadgeDefinition objects.
 */
export async function checkBadgeUnlock(
  userId: string,
  action: GamificationAction,
): Promise<BadgeDefinition[]> {
  try {
    const { evaluateBadges } = await import('./badge.service');
    return await evaluateBadges(userId, action);
  } catch (error) {
    console.error('[points.service] Failed to evaluate badges:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// fetchEarnedBadges
// ---------------------------------------------------------------------------

/**
 * Fetches all badges earned by a user.
 *
 * @param userId — The user's ID.
 * @returns Array of EarnedBadge objects sorted by earned date (newest first).
 */
export async function fetchEarnedBadges(userId: string): Promise<EarnedBadge[]> {
  const supabase = createClient();

  // Joint query to badges to pull slugs and reward values
  let query = supabase
    .from('user_badges')
    .select(
      `
      badge_id,
      earned_at,
      badges (
        slug,
        xp_reward
      )
    `,
    )
    .eq('user_id', userId);

  if (typeof (query as any).order === 'function') {
    query = (query as any).order('earned_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error('[points.service] Failed to fetch badges:', error.message);
    throw new Error(`Failed to fetch badges: ${error.message}`);
  }

  return (data ?? []).map((row: any) => ({
    badgeId: row.badge_id ?? '',
    badgeSlug: (row.badges?.slug ?? '') as BadgeSlug,
    earnedAt: row.earned_at as string,
    pointValue: (row.badges?.xp_reward ?? 0) as number,
  }));
}

// ---------------------------------------------------------------------------
// fetchTotalPoints
// ---------------------------------------------------------------------------

/**
 * Fetches the total points for a user.
 *
 * @param userId — The user's ID.
 * @returns Total accumulated points.
 */
export async function fetchTotalPoints(userId: string): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_points')
    .select('total_points')
    .eq('user_id', userId);

  if (error) {
    console.error('[points.service] Failed to fetch points:', error.message);
    throw new Error(`Failed to fetch points: ${error.message}`);
  }

  return data?.[0]?.total_points ?? 0;
}
