/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Service for managing user community profile settings, privacy visibilities,
 * and fetching sanitized public profile pages.
 *
 * @module community-profile.service
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getLevel } from '@/features/gamification/services/level.service';
import type { PublicProfile, CommunitySettings } from '../types/community.types';
import type { CommunitySettingsInput } from '../schemas/community.schemas';

/**
 * Gets a sanitized public profile of a user.
 * Honors privacy visibility settings.
 *
 * @param requesterId - The ID of the user requesting the profile.
 * @param targetUserId - The ID of the profile being viewed.
 * @returns Promise<PublicProfile | null> - Sanitized profile, or null if hidden/not found.
 */
export async function getPublicProfile(
  requesterId: string,
  targetUserId: string,
): Promise<PublicProfile | null> {
  const supabase = createClient();

  try {
    // 1. Fetch visibility settings first
    const { data: settingsRow, error: settingsError } = await supabase
      .from('community_profiles')
      .select('public_profile_visibility, bio, opt_in')
      .eq('id', targetUserId)
      .maybeSingle();

    if (settingsError) throw settingsError;

    // Default to hidden if not opted in or settings don't exist
    const isOptedIn = settingsRow?.opt_in === true;
    const visibility = settingsRow?.public_profile_visibility || 'hidden';

    // If hidden and requester is not the profile owner, block access
    if ((visibility === 'hidden' || !isOptedIn) && requesterId !== targetUserId) {
      return null;
    }

    // 2. Fetch profile, points, cache rank, and badges in parallel
    const [profileRes, pointsRes, rankRes, badgesRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', targetUserId)
        .maybeSingle(),
      supabase
        .from('user_points')
        .select('total_points, longest_streak, current_level')
        .eq('user_id', targetUserId)
        .maybeSingle(),
      supabase
        .from('leaderboard_rank_cache')
        .select('rank')
        .eq('user_id', targetUserId)
        .maybeSingle(),
      supabase.from('user_badges').select('badges(slug)').eq('user_id', targetUserId),
    ]);

    if (profileRes.error) throw profileRes.error;
    if (!profileRes.data) return null;

    const profile = profileRes.data;
    const points = pointsRes.data;
    const rankRow = rankRes.data;

    // Map badge slugs
    const badgeSlugs = (badgesRes.data || [])
      .map((row: any) => row.badges?.slug)
      .filter(Boolean) as string[];

    const totalPoints = points?.total_points || 0;
    const levelInfo = getLevel(totalPoints);

    return {
      userId: targetUserId,
      displayName: profile.display_name || 'Anonymous User',
      avatarUrl: profile.avatar_url,
      level: points?.current_level || levelInfo.rank,
      levelName: levelInfo.name,
      rank: rankRow?.rank || null,
      badgeSlugs,
      longestStreak: points?.longest_streak || 0,
      bio: settingsRow?.bio || '',
    };
  } catch (err) {
    logger.error('Error fetching public profile', { userId: targetUserId, error: err });
    return null;
  }
}

/**
 * Updates a user's community settings.
 * Enforces removal from cache if opt-out or hidden visibility is chosen.
 *
 * @param userId - ID of the user.
 * @param settings - The updated settings object.
 */
export async function updateCommunitySettings(
  userId: string,
  settings: CommunitySettingsInput,
): Promise<void> {
  const supabase = createClient();

  try {
    // 1. Upsert community settings
    const { error: upsertError } = await supabase.from('community_profiles').upsert({
      id: userId,
      opt_in: settings.optIn,
      leaderboard_opt_in: settings.leaderboardOptIn,
      public_profile_visibility: settings.publicProfileVisibility,
      bio: settings.bio,
      updated_at: new Date().toISOString(),
    });

    if (upsertError) throw upsertError;

    // 3. If opted out of leaderboard OR changed visibility to hidden, remove from cache
    const shouldRemoveFromCache =
      !settings.leaderboardOptIn ||
      settings.publicProfileVisibility === 'hidden' ||
      !settings.optIn;

    if (shouldRemoveFromCache) {
      const { error: deleteError } = await supabase
        .from('leaderboard_rank_cache')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        logger.error('Failed to remove user from leaderboard cache after opt-out', {
          userId,
          error: deleteError,
        });
      }
    }

    logger.info('Community settings updated successfully', {
      userId,
      optIn: settings.optIn,
      leaderboardOptIn: settings.leaderboardOptIn,
      visibility: settings.publicProfileVisibility,
    });
  } catch (err) {
    logger.error('Error updating community settings', { userId, error: err });
    throw err;
  }
}

/**
 * Gets the community settings for a user.
 *
 * @param userId - ID of the user.
 * @returns Promise<CommunitySettings> - Current settings or default values.
 */
export async function getVisibilitySettings(userId: string): Promise<CommunitySettings> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('community_profiles')
      .select('opt_in, leaderboard_opt_in, public_profile_visibility, bio')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    return {
      optIn: data?.opt_in ?? false,
      leaderboardOptIn: data?.leaderboard_opt_in ?? false,
      publicProfileVisibility: (data?.public_profile_visibility ?? 'public') as any,
      bio: data?.bio ?? '',
    };
  } catch (err) {
    logger.error('Error fetching community settings', { userId, error: err });
    return {
      optIn: false,
      leaderboardOptIn: false,
      publicProfileVisibility: 'public',
      bio: '',
    };
  }
}
