/**
 * Points & Badge Service — gamification business logic.
 *
 * Handles point awards, level calculations, and badge unlock
 * checks. All Supabase writes go through this service.
 *
 * @module points.service
 */

import { createClient } from '@/lib/supabase/client';
import { ACTION_TO_BADGE, BADGE_MAP } from '@/features/gamification/data/badges';
import type {
  BadgeDefinition,
  EarnedBadge,
  GamificationAction,
  Level,
  LevelName,
  BadgeSlug,
} from '@/features/gamification/types/gamification.types';

// ---------------------------------------------------------------------------
// Level Thresholds
// ---------------------------------------------------------------------------

interface LevelThreshold {
  readonly name: LevelName;
  readonly rank: number;
  readonly minPoints: number;
}

const LEVEL_THRESHOLDS: readonly LevelThreshold[] = [
  { name: 'Seedling', rank: 1, minPoints: 0 },
  { name: 'Sprout', rank: 2, minPoints: 100 },
  { name: 'Sapling', rank: 3, minPoints: 300 },
  { name: 'Tree', rank: 4, minPoints: 600 },
  { name: 'Forest', rank: 5, minPoints: 1000 },
] as const;

// ---------------------------------------------------------------------------
// getUserLevel — pure function
// ---------------------------------------------------------------------------

/**
 * Determines the user's current level from their total points.
 *
 * Levels:
 * - Seedling: 0–99 pts
 * - Sprout: 100–299 pts
 * - Sapling: 300–599 pts
 * - Tree: 600–999 pts
 * - Forest: 1000+ pts
 *
 * @param totalPoints — cumulative points earned.
 * @returns The user's current Level with progress within that level.
 */
export function getUserLevel(totalPoints: number): Level {
  const safePoints = Math.max(0, Math.floor(totalPoints));

  let currentThreshold = LEVEL_THRESHOLDS[0]!;

  for (const threshold of LEVEL_THRESHOLDS) {
    if (safePoints >= threshold.minPoints) {
      currentThreshold = threshold;
    }
  }

  const currentIndex = LEVEL_THRESHOLDS.indexOf(currentThreshold);
  const nextThreshold = LEVEL_THRESHOLDS[currentIndex + 1] ?? null;
  const maxPoints = nextThreshold?.minPoints ?? null;

  let progress = 0;
  if (maxPoints !== null) {
    const range = maxPoints - currentThreshold.minPoints;
    progress = range > 0 ? (safePoints - currentThreshold.minPoints) / range : 1;
  } else {
    // Max level — always show full progress
    progress = 1;
  }

  return {
    name: currentThreshold.name,
    rank: currentThreshold.rank,
    minPoints: currentThreshold.minPoints,
    maxPoints,
    progress: Math.min(1, Math.max(0, progress)),
  };
}

// ---------------------------------------------------------------------------
// awardPoints
// ---------------------------------------------------------------------------

/**
 * Awards points to a user for a specific action.
 *
 * Inserts a record into the `user_points` table.
 *
 * @param userId — The user's ID.
 * @param action — The gamification action performed.
 * @param points — Number of points to award.
 */
export async function awardPoints(
  userId: string,
  action: GamificationAction,
  points: number,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('user_points')
    .insert({
      user_id: userId,
      action,
      points,
      awarded_at: new Date().toISOString(),
    });

  if (error) {
    console.error('[points.service] Failed to award points:', error.message);
    throw new Error(`Failed to award points: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// checkBadgeUnlock
// ---------------------------------------------------------------------------

/**
 * Checks if a gamification action unlocks any new badges for the user.
 *
 * 1. Looks up which badge the action maps to.
 * 2. Checks if the user already has that badge.
 * 3. If not, inserts the badge record and awards bonus points.
 *
 * @param userId — The user's ID.
 * @param action — The gamification action just performed.
 * @returns Array of newly unlocked `BadgeDefinition` objects (may be empty).
 */
export async function checkBadgeUnlock(
  userId: string,
  action: GamificationAction,
): Promise<BadgeDefinition[]> {
  const badgeSlug = ACTION_TO_BADGE.get(action);
  if (!badgeSlug) return [];

  const badge = BADGE_MAP.get(badgeSlug);
  if (!badge) return [];

  const supabase = createClient();

  // Check if already earned
  const { data: existingBadges, error: fetchError } = await supabase
    .from('user_badges')
    .select('badge_slug')
    .eq('user_id', userId)
    .eq('badge_slug', badgeSlug)
    .limit(1);

  if (fetchError) {
    console.error('[points.service] Failed to check existing badges:', fetchError.message);
    return [];
  }

  if (existingBadges && existingBadges.length > 0) {
    return []; // Already earned
  }

  // Award the badge
  const now = new Date().toISOString();
  const { error: insertError } = await supabase
    .from('user_badges')
    .insert({
      user_id: userId,
      badge_slug: badgeSlug,
      earned_at: now,
      points_awarded: badge.pointValue,
    });

  if (insertError) {
    console.error('[points.service] Failed to insert badge:', insertError.message);
    return [];
  }

  // Also award the badge points
  try {
    await awardPoints(userId, action, badge.pointValue);
  } catch {
    // Points failed but badge was awarded — log but don't throw
    console.error('[points.service] Badge awarded but points failed for:', badgeSlug);
  }

  return [badge];
}

// ---------------------------------------------------------------------------
// fetchEarnedBadges
// ---------------------------------------------------------------------------

/**
 * Fetches all badges earned by a user from Supabase.
 *
 * @param userId — The user's ID.
 * @returns Array of `EarnedBadge` objects sorted by earned date (newest first).
 */
export async function fetchEarnedBadges(userId: string): Promise<EarnedBadge[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_badges')
    .select('badge_slug, earned_at, points_awarded')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) {
    console.error('[points.service] Failed to fetch badges:', error.message);
    throw new Error(`Failed to fetch badges: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    badgeSlug: row.badge_slug as BadgeSlug,
    earnedAt: row.earned_at as string,
    pointValue: row.points_awarded as number,
  }));
}

// ---------------------------------------------------------------------------
// fetchTotalPoints
// ---------------------------------------------------------------------------

/**
 * Fetches the total points for a user from Supabase.
 *
 * @param userId — The user's ID.
 * @returns Total accumulated points.
 */
export async function fetchTotalPoints(userId: string): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_points')
    .select('points')
    .eq('user_id', userId);

  if (error) {
    console.error('[points.service] Failed to fetch points:', error.message);
    throw new Error(`Failed to fetch points: ${error.message}`);
  }

  return (data ?? []).reduce((sum, row) => sum + (row.points as number), 0);
}
