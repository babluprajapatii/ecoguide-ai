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
  | 'under_10t'
  | 'week_streak'
  | 'vegan_switch'
  | 'community_top10'
  | 'transport_hero'
  | 'energy_saver'
  | 'share_results'
  | 'coach_10'
  | 'carbon_zero';

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
  /** Points awarded upon earning the badge. */
  readonly pointValue: number;
  /** Machine-readable unlock criteria description. */
  readonly criteria: string;
}

/** A badge that has been earned by a user. */
export interface EarnedBadge {
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
  | 'achieve_under_10t'
  | 'login_streak_7'
  | 'switch_vegan'
  | 'reach_top_10'
  | 'reduce_transport_25'
  | 'energy_with_solar'
  | 'share_scenario'
  | 'coach_10_messages'
  | 'achieve_under_2t';

/** Level names in ascending order. */
export type LevelName = 'Seedling' | 'Sprout' | 'Sapling' | 'Tree' | 'Forest';

/** A user's current level with thresholds. */
export interface Level {
  /** The level name. */
  readonly name: LevelName;
  /** Numeric level (1–5). */
  readonly rank: number;
  /** Points required to reach this level. */
  readonly minPoints: number;
  /** Points required for the next level (null if max level). */
  readonly maxPoints: number | null;
  /** Progress fraction within this level (0–1). */
  readonly progress: number;
}

/** A points transaction record. */
export interface PointsTransaction {
  /** The action that triggered the award. */
  readonly action: GamificationAction;
  /** Points awarded. */
  readonly points: number;
  /** Timestamp of the award. */
  readonly awardedAt: string;
}

// ---------------------------------------------------------------------------
// Supabase Row Shapes
// ---------------------------------------------------------------------------

/** Row shape for the `user_badges` table. */
export interface UserBadgeRow {
  readonly id: string;
  readonly user_id: string;
  readonly badge_slug: string;
  readonly earned_at: string;
  readonly points_awarded: number;
}

/** Row shape for the `user_points` table. */
export interface UserPointsRow {
  readonly id: string;
  readonly user_id: string;
  readonly action: string;
  readonly points: number;
  readonly awarded_at: string;
}
