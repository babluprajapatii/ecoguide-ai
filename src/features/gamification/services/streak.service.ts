/**
 * Timezone-Safe UTC Streak Service.
 *
 * Compares calendar dates in UTC to maintain, increment, or reset
 * daily streaks.
 *
 * @module streak.service
 */

export interface StreakEvaluationResult {
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly lastActivityAt: string;
  readonly status: 'same_day' | 'next_day' | 'reset';
}

/**
 * Calculates updated streak parameters for a new activity check-in.
 *
 * @param lastActivityAtStr - ISO timestamp of user's last activity, or null.
 * @param currentStreak - User's current streak count.
 * @param longestStreak - User's longest streak count.
 * @returns StreakEvaluationResult object.
 */
export function evaluateStreak(
  lastActivityAtStr: string | null,
  currentStreak: number,
  longestStreak: number
): StreakEvaluationResult {
  const now = new Date();
  const currentActivityAt = now.toISOString();
  const currentDateStr = currentActivityAt.split('T')[0]!; // YYYY-MM-DD in UTC

  if (!lastActivityAtStr) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(1, longestStreak),
      lastActivityAt: currentActivityAt,
      status: 'reset',
    };
  }

  const lastDateStr = lastActivityAtStr.split('T')[0]!; // YYYY-MM-DD in UTC

  const currentMidnight = Date.parse(`${currentDateStr}T00:00:00.000Z`);
  const lastMidnight = Date.parse(`${lastDateStr}T00:00:00.000Z`);
  const diffMs = currentMidnight - lastMidnight;

  if (diffMs <= 0) {
    // Activity on the same day -> Keep current streak, last activity becomes current time
    return {
      currentStreak,
      longestStreak,
      lastActivityAt: currentActivityAt,
      status: 'same_day',
    };
  } else if (diffMs === 86400000) {
    // Activity on the next day -> Increment streak
    const nextStreak = currentStreak + 1;
    return {
      currentStreak: nextStreak,
      longestStreak: Math.max(nextStreak, longestStreak),
      lastActivityAt: currentActivityAt,
      status: 'next_day',
    };
  } else {
    // Activity after a gap of > 1 day -> Reset streak to 1
    return {
      currentStreak: 1,
      longestStreak: Math.max(1, longestStreak),
      lastActivityAt: currentActivityAt,
      status: 'reset',
    };
  }
}
