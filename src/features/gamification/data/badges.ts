/**
 * Badge Definitions — all 10 earnable badges in EcoGuide AI.
 *
 * Each badge is a static, immutable definition with a unique slug,
 * display metadata, point value, and human-readable criteria.
 *
 * @module badges
 */

import type { BadgeDefinition, BadgeSlug, GamificationAction } from '@/features/gamification/types/gamification.types';

// ---------------------------------------------------------------------------
// Badge Definitions
// ---------------------------------------------------------------------------

export const BADGES: readonly BadgeDefinition[] = [
  {
    slug: 'first_assessment',
    name: 'First Step',
    description: 'Complete your first carbon footprint assessment',
    icon: 'ClipboardCheck',
    pointValue: 50,
    criteria: 'Complete at least one carbon footprint assessment.',
  },
  {
    slug: 'under_10t',
    name: 'Under 10 Tonnes',
    description: 'Achieve a total footprint under 10 tonnes CO₂/year',
    icon: 'TrendingDown',
    pointValue: 100,
    criteria: 'Latest assessment total must be under 10,000 kg CO₂/year.',
  },
  {
    slug: 'week_streak',
    name: 'Week Warrior',
    description: 'Log in for 7 consecutive days',
    icon: 'Flame',
    pointValue: 75,
    criteria: 'Maintain a 7-day consecutive login streak.',
  },
  {
    slug: 'vegan_switch',
    name: 'Plant Powered',
    description: 'Switch your diet to vegan in the simulator',
    icon: 'Leaf',
    pointValue: 60,
    criteria: 'Set diet type to vegan in the Impact Simulator.',
  },
  {
    slug: 'community_top10',
    name: 'Top 10',
    description: 'Reach the community top 10 leaderboard',
    icon: 'Trophy',
    pointValue: 200,
    criteria: 'Achieve a ranking in the top 10 on the community leaderboard.',
  },
  {
    slug: 'transport_hero',
    name: 'Transport Hero',
    description: 'Reduce your transport emissions by 25%',
    icon: 'Bike',
    pointValue: 120,
    criteria: 'Reduce transport category emissions by at least 25% from first assessment.',
  },
  {
    slug: 'energy_saver',
    name: 'Energy Saver',
    description: 'Set renewable energy to 100% in your assessment',
    icon: 'Sun',
    pointValue: 80,
    criteria: 'Complete an energy assessment with 100% renewable/solar energy.',
  },
  {
    slug: 'share_results',
    name: 'Eco Influencer',
    description: 'Share your simulator scenario with others',
    icon: 'Share2',
    pointValue: 40,
    criteria: 'Use the "Share My Scenario" feature in the Impact Simulator.',
  },
  {
    slug: 'coach_10',
    name: 'Coach Regular',
    description: 'Send 10 messages to the AI sustainability coach',
    icon: 'MessageCircle',
    pointValue: 60,
    criteria: 'Send at least 10 messages to the AI Coach.',
  },
  {
    slug: 'carbon_zero',
    name: 'Carbon Champion',
    description: 'Achieve a total footprint under 2 tonnes CO₂/year',
    icon: 'Award',
    pointValue: 300,
    criteria: 'Latest assessment total must be under 2,000 kg CO₂/year.',
  },
] as const;

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Map from badge slug to its definition for O(1) lookups. */
export const BADGE_MAP: ReadonlyMap<BadgeSlug, BadgeDefinition> = new Map(
  BADGES.map((b) => [b.slug, b]),
);

/**
 * Maps a gamification action to the badge slug it can unlock.
 * Not all actions map 1:1, but this covers the primary triggers.
 */
export const ACTION_TO_BADGE: ReadonlyMap<GamificationAction, BadgeSlug> = new Map<GamificationAction, BadgeSlug>([
  ['complete_assessment', 'first_assessment'],
  ['achieve_under_10t', 'under_10t'],
  ['login_streak_7', 'week_streak'],
  ['switch_vegan', 'vegan_switch'],
  ['reach_top_10', 'community_top10'],
  ['reduce_transport_25', 'transport_hero'],
  ['energy_with_solar', 'energy_saver'],
  ['share_scenario', 'share_results'],
  ['coach_10_messages', 'coach_10'],
  ['achieve_under_2t', 'carbon_zero'],
]);

/**
 * Get a badge definition by slug.
 * @throws Error if slug not found (should never happen with typed slugs).
 */
export function getBadgeBySlug(slug: BadgeSlug): BadgeDefinition {
  const badge = BADGE_MAP.get(slug);
  if (!badge) {
    throw new Error(`Badge definition not found for slug: ${slug}`);
  }
  return badge;
}
