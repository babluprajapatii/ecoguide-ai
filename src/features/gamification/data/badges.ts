/**
 * Badge Definitions — all 16 earnable badges in EcoGuide AI.
 *
 * Each badge is a static, immutable definition with a unique slug,
 * display metadata, point value, human-readable criteria, and category.
 *
 * @module badges
 */

import type {
  BadgeDefinition,
  BadgeSlug,
  GamificationAction,
} from '@/features/gamification/types/gamification.types';

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
    category: 'assessment',
  },
  {
    slug: 'assessment_master',
    name: 'Assessment Master',
    description: 'Complete 5 carbon footprint assessments',
    icon: 'GraduationCap',
    pointValue: 150,
    criteria: 'Complete 5 or more carbon footprint assessments.',
    category: 'assessment',
  },
  {
    slug: 'under_10t',
    name: 'Low Carbon Footprint',
    description: 'Achieve a carbon footprint under 10 tonnes CO₂/year',
    icon: 'TrendingDown',
    pointValue: 100,
    criteria: 'Latest assessment total must be under 10,000 kg CO₂/year.',
    category: 'sustainability_impact',
  },
  {
    slug: 'under_2t',
    name: 'Net-Zero Champion',
    description: 'Achieve a carbon footprint under 2 tonnes CO₂/year',
    icon: 'Award',
    pointValue: 300,
    criteria: 'Latest assessment total must be under 2,000 kg CO₂/year.',
    category: 'sustainability_impact',
  },
  {
    slug: 'ai_coach_explorer',
    name: 'Coach Explorer',
    description: 'Send your first message to the AI coach',
    icon: 'MessageSquare',
    pointValue: 20,
    criteria: 'Send at least 1 message to the AI coach.',
    category: 'coaching',
  },
  {
    slug: 'ai_coach_expert',
    name: 'Coach Expert',
    description: 'Send 10 messages to the AI coach',
    icon: 'MessageCircle',
    pointValue: 100,
    criteria: 'Send at least 10 messages to the AI coach.',
    category: 'coaching',
  },
  {
    slug: 'simulator_explorer',
    name: 'Simulator Explorer',
    description: 'Save your first scenario in the simulator',
    icon: 'Play',
    pointValue: 30,
    criteria: 'Save at least 1 scenario in the Impact Simulator.',
    category: 'simulation',
  },
  {
    slug: 'simulator_master',
    name: 'Simulator Master',
    description: 'Save 5 scenarios in the simulator',
    icon: 'Sliders',
    pointValue: 120,
    criteria: 'Save 5 or more scenarios in the Impact Simulator.',
    category: 'simulation',
  },
  {
    slug: 'community_member',
    name: 'Community Member',
    description: 'Complete a community profile',
    icon: 'Users',
    pointValue: 50,
    criteria: 'Complete your public community profile.',
    category: 'community',
  },
  {
    slug: 'top_10_leaderboard',
    name: 'Top 10 Leaderboard',
    description: 'Reach the top 10 on the leaderboard',
    icon: 'Trophy',
    pointValue: 200,
    criteria: 'Achieve a top 10 rank on the community leaderboard.',
    category: 'community',
  },
  {
    slug: 'eco_streak_7',
    name: '7-Day Streak',
    description: 'Maintain a 7-day daily activity streak',
    icon: 'Flame',
    pointValue: 75,
    criteria: 'Reach a daily activity streak of 7 days.',
    category: 'streaks',
  },
  {
    slug: 'eco_streak_30',
    name: '30-Day Streak',
    description: 'Maintain a 30-day daily activity streak',
    icon: 'Flame',
    pointValue: 150,
    criteria: 'Reach a daily activity streak of 30 days.',
    category: 'streaks',
  },
  {
    slug: 'eco_streak_90',
    name: '90-Day Streak',
    description: 'Maintain a 90-day daily activity streak',
    icon: 'Flame',
    pointValue: 300,
    criteria: 'Reach a daily activity streak of 90 days.',
    category: 'streaks',
  },
  {
    slug: 'carbon_reducer',
    name: 'Carbon Reducer',
    description: 'Reduce your footprint compared to your previous assessment',
    icon: 'Zap',
    pointValue: 100,
    criteria: 'Achieve lower total emissions in your latest assessment than in your first one.',
    category: 'sustainability_impact',
  },
  {
    slug: 'eco_hero',
    name: 'Eco Hero',
    description: 'Reach Level 6 (Green Hero)',
    icon: 'Shield',
    pointValue: 150,
    criteria: 'Reach level 6 or higher.',
    category: 'sustainability_impact',
  },
  {
    slug: 'vegan_switch',
    name: 'Plant Powered',
    description: 'Switch diet to vegan in simulator',
    icon: 'Leaf',
    pointValue: 50,
    criteria: 'Set diet type to vegan in any saved simulator configuration.',
    category: 'simulation',
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
 */
export const ACTION_TO_BADGE: ReadonlyMap<GamificationAction, BadgeSlug> = new Map<
  GamificationAction,
  BadgeSlug
>([
  ['complete_assessment', 'first_assessment'],
  ['use_coach', 'ai_coach_explorer'],
  ['run_simulator', 'simulator_explorer'],
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
