import type { Level, LevelName } from '../types/gamification.types';

export interface LevelThreshold {
  readonly name: LevelName;
  readonly rank: number;
  readonly minPoints: number;
}

export const LEVEL_THRESHOLDS: readonly LevelThreshold[] = [
  { name: 'Eco Beginner', rank: 1, minPoints: 0 },
  { name: 'Green Explorer', rank: 2, minPoints: 100 },
  { name: 'Climate Learner', rank: 3, minPoints: 300 },
  { name: 'Carbon Reducer', rank: 4, minPoints: 600 },
  { name: 'Eco Advocate', rank: 5, minPoints: 1000 },
  { name: 'Green Hero', rank: 6, minPoints: 1500 },
  { name: 'Climate Warrior', rank: 7, minPoints: 2200 },
  { name: 'Sustainability Champion', rank: 8, minPoints: 3000 },
  { name: 'Planet Protector', rank: 9, minPoints: 4000 },
  { name: 'Net-Zero Legend', rank: 10, minPoints: 5000 },
] as const;

/**
 * Determines the user's level rank, name, and progress from their current total XP.
 *
 * All level progression logic is centralized here.
 *
 * @param totalPoints — The user's total points (XP).
 * @returns Level object containing current level name, rank, progress, minPoints, maxPoints.
 */
export function getLevel(totalPoints: number): Level {
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
    progress = 1; // Max level reached
  }

  return {
    name: currentThreshold.name,
    rank: currentThreshold.rank,
    minPoints: currentThreshold.minPoints,
    maxPoints,
    progress: Math.min(1, Math.max(0, progress)),
  };
}

/**
 * Gets the next level rank.
 *
 * @param totalPoints - User's current total points.
 * @returns Next level rank or null if at max level.
 */
export function getNextLevel(totalPoints: number): number | null {
  const current = getLevel(totalPoints);
  if (current.rank >= 10) return null;
  return current.rank + 1;
}

/**
 * Calculates progress fraction toward the next level.
 *
 * @param totalPoints - User's current total points.
 * @returns Number between 0 and 1.
 */
export function getProgressToNextLevel(totalPoints: number): number {
  return getLevel(totalPoints).progress;
}
