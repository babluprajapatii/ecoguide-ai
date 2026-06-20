/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Badge Unlock Engine.
 *
 * Evaluates user activity across assessments, coaching messages, simulator configurations,
 * levels, and streaks to unlock badges idempotently and atomically.
 *
 * @module badge.service
 */

import { createClient } from '@/lib/supabase/server';
import { BADGES } from '../data/badges';
import { awardPoints } from './points.service';
import type { BadgeDefinition } from '../types/gamification.types';

/**
 * Scans locked badges for a user and unlocks them if conditions are met.
 *
 * @param userId - The user's ID.
 * @param _triggerAction - Optional action that triggered this evaluation.
 * @returns Promise resolving to an array of newly unlocked BadgeDefinition objects.
 */
export async function evaluateBadges(
  userId: string,
  _triggerAction?: string,
): Promise<BadgeDefinition[]> {
  const supabase = createClient();

  // 1. Fetch badge definition mappings from DB to get UUIDs
  const { data: dbBadges, error: dbBadgesError } = await supabase.from('badges').select('id, slug');

  if (dbBadgesError) {
    console.error(
      '[badge.service] Failed to fetch badge definitions from DB:',
      dbBadgesError.message,
    );
    return [];
  }

  const slugToUuidMap = new Map<string, string>();
  const dbBadgesArray = Array.isArray(dbBadges) ? dbBadges : [];
  for (const b of dbBadgesArray) {
    slugToUuidMap.set(b.slug, b.id);
  }

  // 2. Fetch user's currently earned badges
  const { data: earnedBadges, error: earnedError } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  if (earnedError) {
    console.error('[badge.service] Failed to fetch earned badges:', earnedError.message);
    return [];
  }

  const earnedBadgesArray = Array.isArray(earnedBadges) ? earnedBadges : [];
  const earnedBadgeIdsSet = new Set<string>(earnedBadgesArray.map((eb) => eb.badge_id));

  // 3. Retrieve user data required for evaluation
  // 3a. Assessments
  let assessmentsQuery = supabase
    .from('assessments')
    .select('total_score, is_complete, created_at')
    .eq('user_id', userId);

  if (typeof (assessmentsQuery as any).order === 'function') {
    assessmentsQuery = (assessmentsQuery as any).order('created_at', { ascending: true });
  }

  const { data: assessments, error: assessError } = await assessmentsQuery;

  if (assessError) {
    console.error('[badge.service] Failed to fetch assessments:', assessError.message);
    return [];
  }

  const assessmentsArray = Array.isArray(assessments) ? assessments : [];
  const completedAssessments = assessmentsArray.filter((a) => a.is_complete);
  const assessmentsCount = completedAssessments.length;
  const latestAssessment = completedAssessments[completedAssessments.length - 1] ?? null;
  const firstAssessment = completedAssessments[0] ?? null;

  // 3b. Coach conversations count
  const { count: coachMessagesCount, error: coachError } = await supabase
    .from('coach_conversations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', 'user');

  if (coachError) {
    console.error('[badge.service] Failed to fetch coach conversations:', coachError.message);
    return [];
  }

  const userMessagesCount = coachMessagesCount ?? 0;

  // 3c. Saved simulations
  const { data: simulations, error: simError } = await supabase
    .from('saved_simulations')
    .select('scenario_type, configuration')
    .eq('user_id', userId);

  if (simError) {
    console.error('[badge.service] Failed to fetch simulations:', simError.message);
    return [];
  }

  const simulationsArray = Array.isArray(simulations) ? simulations : [];
  const simulationsCount = simulationsArray.length;
  const hasVeganSimulation = simulationsArray.some((s) => {
    try {
      const config =
        typeof s.configuration === 'string' ? JSON.parse(s.configuration) : s.configuration;
      return config?.dietType === 'vegan';
    } catch {
      return false;
    }
  });

  // 3d. User points, level, and streak
  const { data: userPointsData, error: pointsError } = await supabase
    .from('user_points')
    .select('current_level, current_streak')
    .eq('user_id', userId);

  if (pointsError) {
    console.error('[badge.service] Failed to fetch user points:', pointsError.message);
    return [];
  }

  const userPoints = userPointsData?.[0] ?? null;
  const currentLevel = userPoints?.current_level ?? 1;
  const currentStreak = userPoints?.current_streak ?? 0;

  // 3e. Community profile opt-in
  const { data: commProfileData, error: commError } = await supabase
    .from('community_profiles')
    .select('opt_in')
    .eq('id', userId);

  if (commError) {
    console.error('[badge.service] Failed to fetch community profile:', commError.message);
    return [];
  }

  const commProfile = commProfileData?.[0] ?? null;
  const isCommunityMember = !!commProfile?.opt_in;

  // 3f. Leaderboard top 10
  let rankQuery = supabase.from('user_points').select('user_id');

  if (typeof (rankQuery as any).limit === 'function') {
    rankQuery = (rankQuery as any).limit(10);
  }

  if (typeof (rankQuery as any).order === 'function') {
    rankQuery = (rankQuery as any).order('total_points', { ascending: false });
  }

  const { data: topUsers, error: rankError } = await rankQuery;

  if (rankError) {
    console.error('[badge.service] Failed to fetch top users:', rankError.message);
    return [];
  }

  const topUsersArray = Array.isArray(topUsers) ? topUsers : [];
  const isInTop10 = topUsersArray.some((u) => u.user_id === userId);

  // 4. Evaluate each locked badge definition
  const newlyUnlocked: BadgeDefinition[] = [];

  for (const badgeDef of BADGES) {
    const badgeUuid = slugToUuidMap.get(badgeDef.slug);
    if (!badgeUuid) {
      console.warn(`[badge.service] Badge slug ${badgeDef.slug} has no UUID in badges table.`);
      continue;
    }

    // Skip if already earned
    if (earnedBadgeIdsSet.has(badgeUuid)) {
      continue;
    }

    let isUnlocked = false;

    switch (badgeDef.slug) {
      case 'first_assessment':
        isUnlocked = assessmentsCount >= 1;
        break;
      case 'assessment_master':
        isUnlocked = assessmentsCount >= 5;
        break;
      case 'under_10t':
        isUnlocked = latestAssessment !== null && Number(latestAssessment.total_score) < 10000;
        break;
      case 'under_2t':
        isUnlocked = latestAssessment !== null && Number(latestAssessment.total_score) < 2000;
        break;
      case 'ai_coach_explorer':
        isUnlocked = userMessagesCount >= 1;
        break;
      case 'ai_coach_expert':
        isUnlocked = userMessagesCount >= 10;
        break;
      case 'simulator_explorer':
        isUnlocked = simulationsCount >= 1;
        break;
      case 'simulator_master':
        isUnlocked = simulationsCount >= 5;
        break;
      case 'community_member':
        isUnlocked = isCommunityMember;
        break;
      case 'top_10_leaderboard':
        isUnlocked = isInTop10;
        break;
      case 'eco_streak_7':
        isUnlocked = currentStreak >= 7;
        break;
      case 'eco_streak_30':
        isUnlocked = currentStreak >= 30;
        break;
      case 'eco_streak_90':
        isUnlocked = currentStreak >= 90;
        break;
      case 'carbon_reducer':
        isUnlocked =
          assessmentsCount >= 2 &&
          latestAssessment !== null &&
          firstAssessment !== null &&
          Number(latestAssessment.total_score) < Number(firstAssessment.total_score);
        break;
      case 'eco_hero':
        isUnlocked = currentLevel >= 6;
        break;
      case 'vegan_switch':
        isUnlocked = hasVeganSimulation;
        break;
      default:
        break;
    }

    if (isUnlocked) {
      // Award the badge in the DB
      const { error: insertError } = await supabase.from('user_badges').insert({
        user_id: userId,
        badge_id: badgeUuid,
      });

      if (insertError) {
        // If it's a unique constraint violation, it means someone else inserted it first
        if (insertError.code === '23505') {
          console.log(`[badge.service] Badge ${badgeDef.slug} already unlocked concurrently.`);
          continue;
        }
        console.error(
          `[badge.service] Failed to unlock badge ${badgeDef.slug}:`,
          insertError.message,
        );
        continue;
      }

      // Award badge XP reward
      try {
        await awardPoints(userId, 'complete_recommendation', badgeDef.pointValue);
      } catch (err) {
        console.error(`[badge.service] Failed to award points for badge ${badgeDef.slug}:`, err);
      }

      newlyUnlocked.push(badgeDef);
    }
  }

  return newlyUnlocked;
}
