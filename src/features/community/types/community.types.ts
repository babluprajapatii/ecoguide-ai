/**
 * Type definitions for the Community & Leaderboard feature.
 *
 * Models leaderboard rankings, community statistics, public profiles,
 * privacy settings, and highlight widgets.
 *
 * @module community.types
 */

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

/** A single entry in the leaderboard rankings. */
export interface LeaderboardEntry {
  readonly rank: number;
  readonly previousRank: number | null;
  readonly rankChange: number;
  readonly userId: string;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly totalPoints: number;
  readonly level: number;
  readonly levelName: string;
  readonly badgeCount: number;
  readonly longestStreak: number;
  readonly isCurrentUser: boolean;
}

/** Current user's leaderboard context. */
export interface CurrentUserRank {
  readonly rank: number | null;
  readonly totalPoints: number;
  readonly level: number;
  readonly isOptedIn: boolean;
}

/** Pagination metadata. */
export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly totalEntries: number;
  readonly totalPages: number;
}

/** Full leaderboard API response. */
export interface LeaderboardResponse {
  readonly rankings: readonly LeaderboardEntry[];
  readonly currentUser: CurrentUserRank;
  readonly pagination: PaginationMeta;
}

/** Supported leaderboard view modes. */
export type LeaderboardView = 'global' | 'nearby' | 'top';

// ---------------------------------------------------------------------------
// Community Statistics
// ---------------------------------------------------------------------------

/** Community highlight: a single user achievement widget. */
export interface CommunityHighlight {
  readonly userId: string | null;
  readonly displayName: string | null;
  readonly value: number;
}

/** Aggregate community statistics. */
export interface CommunityStats {
  readonly totalUsers: number;
  readonly activeUsers7d: number;
  readonly totalXpEarned: number;
  readonly assessmentsCompleted: number;
  readonly simulationsSaved: number;
  readonly badgesEarned: number;
  readonly avgCarbonFootprint: number;
  readonly topCarbonSaver: CommunityHighlight;
  readonly mostImprovedUser: CommunityHighlight;
  readonly longestStreakUser: CommunityHighlight;
  readonly cachedAt: string;
}

// ---------------------------------------------------------------------------
// Public Profile
// ---------------------------------------------------------------------------

/** Sanitized public profile data. */
export interface PublicProfile {
  readonly userId: string;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly level: number;
  readonly levelName: string;
  readonly rank: number | null;
  readonly badgeSlugs: readonly string[];
  readonly longestStreak: number;
  readonly bio: string;
}

// ---------------------------------------------------------------------------
// Privacy Settings
// ---------------------------------------------------------------------------

/** Profile visibility options. */
export type ProfileVisibility = 'public' | 'hidden';

/** Community privacy and participation settings. */
export interface CommunitySettings {
  readonly optIn: boolean;
  readonly leaderboardOptIn: boolean;
  readonly publicProfileVisibility: ProfileVisibility;
  readonly bio: string;
}

// ---------------------------------------------------------------------------
// Supabase Row Shapes
// ---------------------------------------------------------------------------

/** Row shape for `leaderboard_rank_cache`. */
export interface LeaderboardCacheRow {
  readonly user_id: string;
  readonly rank: number;
  readonly previous_rank: number | null;
  readonly rank_change: number;
  readonly total_points: number;
  readonly current_level: number;
  readonly longest_streak: number;
  readonly display_name: string | null;
  readonly avatar_url: string | null;
  readonly badge_count: number;
  readonly cached_at: string;
}

/** Row shape for `community_stats_cache`. */
export interface CommunityStatsCacheRow {
  readonly id: number;
  readonly total_users: number;
  readonly active_users_7d: number;
  readonly total_xp_earned: number;
  readonly assessments_completed: number;
  readonly simulations_saved: number;
  readonly badges_earned: number;
  readonly avg_carbon_footprint: number;
  readonly top_carbon_saver_user_id: string | null;
  readonly top_carbon_saver_name: string | null;
  readonly top_carbon_saver_score: number;
  readonly most_improved_user_id: string | null;
  readonly most_improved_name: string | null;
  readonly most_improved_reduction: number;
  readonly longest_streak_user_id: string | null;
  readonly longest_streak_name: string | null;
  readonly longest_streak_days: number;
  readonly cached_at: string;
}

/** Row shape for `leaderboard_seasons`. */
export interface LeaderboardSeasonRow {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly starts_at: string;
  readonly ends_at: string;
  readonly is_active: boolean;
  readonly created_at: string;
}
