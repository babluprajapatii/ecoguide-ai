/**
 * Type definitions for the Gamification feature.
 *
 * Models badges, points, levels, and gamification actions
 * used across services, hooks, and UI components.
 *
 * @module gamification.types
 */

// ---------------------------------------------------------------------------
// Badge System
// ---------------------------------------------------------------------------

/** Unique slug identifier for each badge. */
export type BadgeSlug =
  | 'first_assessment'
  | 'assessment_master'
  | 'under_10t'
  | 'under_2t'
  | 'ai_coach_explorer'
  | 'ai_coach_expert'
  | 'simulator_explorer'
  | 'simulator_master'
  | 'community_member'
  | 'top_10_leaderboard'
  | 'eco_streak_7'
  | 'eco_streak_30'
  | 'eco_streak_90'
  | 'carbon_reducer'
  | 'eco_hero'
  | 'vegan_switch';

/** Definition of a badge including its unlock criteria. */
export interface BadgeDefinition {
  /** Unique identifier slug. */
  readonly slug: BadgeSlug;
  /** Human-readable badge name. */
  readonly name: string;
  /** Description of how to earn this badge. */
  readonly description: string;
  /** Lucide icon name for rendering. */
  readonly icon: string;
  /** Points/XP awarded upon earning the badge. */
  readonly pointValue: number;
  /** Machine-readable unlock criteria description. */
  readonly criteria: string;
  /** Display category for UI grouping. */
  readonly category:
    | 'assessment'
    | 'coaching'
    | 'simulation'
    | 'community'
    | 'sustainability_impact'
    | 'streaks';
}

/** A badge that has been earned by a user. */
export interface EarnedBadge {
  /** The badge database UUID. */
  readonly badgeId: string;
  /** The badge definition slug. */
  readonly badgeSlug: BadgeSlug;
  /** Timestamp when the badge was earned. */
  readonly earnedAt: string;
  /** Points awarded for this badge. */
  readonly pointValue: number;
}

// ---------------------------------------------------------------------------
// Points & Levels
// ---------------------------------------------------------------------------

/** Actions that can trigger points or badge unlocks. */
export type GamificationAction =
  | 'complete_assessment'
  | 'update_assessment'
  | 'use_coach'
  | 'complete_recommendation'
  | 'run_simulator'
  | 'join_challenge'
  | 'streak_day';

/** Level names in ascending order. */
export type LevelName =
  | 'Eco Beginner'
  | 'Green Explorer'
  | 'Climate Learner'
  | 'Carbon Reducer'
  | 'Eco Advocate'
  | 'Green Hero'
  | 'Climate Warrior'
  | 'Sustainability Champion'
  | 'Planet Protector'
  | 'Net-Zero Legend';

/** A user's current level with thresholds. */
export interface Level {
  /** The level name. */
  readonly name: LevelName;
  /** Numeric level (1–10). */
  readonly rank: number;
  /** Points required to reach this level. */
  readonly minPoints: number;
  /** Points required for the next level (null if max level). */
  readonly maxPoints: number | null;
  /** Progress fraction within this level (0–1). */
  readonly progress: number;
}

// ---------------------------------------------------------------------------
// Supabase Row Shapes
// ---------------------------------------------------------------------------

/** Row shape for the `badges` table. */
export interface BadgeRow {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly xp_reward: number;
  readonly unlock_condition: string;
  readonly category: string;
  readonly created_at: string;
}

/** Row shape for the `user_badges` table. */
export interface UserBadgeRow {
  readonly id: string;
  readonly user_id: string;
  readonly badge_id: string;
  readonly earned_at: string;
}

/** Row shape for the `user_points` table. */
export interface UserPointsRow {
  readonly id: string;
  readonly user_id: string;
  readonly total_points: number;
  readonly lifetime_points: number;
  readonly current_level: number;
  readonly current_streak: number;
  readonly longest_streak: number;
  readonly last_activity_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}
