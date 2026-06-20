'use client';

/**
 * useBadges — hook for managing earned badges and new unlock detection.
 *
 * Fetches the user's earned badges and points from the secure /api/gamification endpoint,
 * provides a method to check for new unlocks after actions, and shows toast-style
 * notifications when a new badge is earned.
 *
 * @module useBadges
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  BadgeDefinition,
  EarnedBadge,
  GamificationAction,
  Level,
  BadgeSlug,
} from '@/features/gamification/types/gamification.types';
import { getLevel } from '@/features/gamification/services/level.service';
import { BADGES } from '@/features/gamification/data/badges';
import { useA11y } from '@/providers/a11y-announcer-provider';

// ---------------------------------------------------------------------------
// Toast notification type
// ---------------------------------------------------------------------------

export interface BadgeToast {
  readonly id: string;
  readonly badge: BadgeDefinition;
  readonly dismissedAt: number | null;
}

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseBadgesReturn {
  /** All 16 badge definitions. */
  readonly allBadges: readonly BadgeDefinition[];
  /** Slugs of badges earned by the user. */
  readonly earnedSlugs: ReadonlySet<BadgeSlug>;
  /** Full earned badge data (with timestamps). */
  readonly earnedBadges: readonly EarnedBadge[];
  /** Whether badge data is currently loading. */
  readonly isLoading: boolean;
  /** Error from fetching badges, if any. */
  readonly error: Error | null;
  /** User's total gamification points. */
  readonly totalPoints: number;
  /** User's current level. */
  readonly level: Level;
  /** Active toast notifications for newly earned badges. */
  readonly toasts: readonly BadgeToast[];
  /** Check for new badge unlocks after an action. */
  readonly checkUnlocks: (action: GamificationAction) => Promise<BadgeDefinition[]>;
  /** Dismiss a toast notification by ID. */
  readonly dismissToast: (toastId: string) => void;
  /** Refresh earned badges from the server. */
  readonly refresh: () => Promise<void>;
  /** Show badge toasts for already unlocked badges */
  readonly showBadgeToast: (badge: BadgeDefinition) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const TOAST_AUTO_DISMISS_MS = 5000;

export function useBadges(userId: string | null): UseBadgesReturn {
  const { announce } = useA11y();
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [toasts, setToasts] = useState<BadgeToast[]>([]);
  const toastTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const prevEarnedSlugsRef = useRef<Set<BadgeSlug>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Derived
  const earnedSlugs: ReadonlySet<BadgeSlug> = new Set(earnedBadges.map((b) => b.badgeSlug));
  const level = getLevel(totalPoints);

  const prevLevelRankRef = useRef<number | null>(null);

  useEffect(() => {
    if (totalPoints > 0) {
      const currentLevel = getLevel(totalPoints);
      if (prevLevelRankRef.current !== null && currentLevel.rank > prevLevelRankRef.current) {
        announce(
          `Level up! You are now Level ${currentLevel.rank} - ${currentLevel.name}!`,
          'polite',
        );
      }
      prevLevelRankRef.current = currentLevel.rank;
    }
  }, [totalPoints, announce]);

  // --- Show toast helper (needed in useEffect) ---
  // --- Dismiss toast ---
  const dismissToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
    const timer = toastTimersRef.current.get(toastId);
    if (timer) {
      clearTimeout(timer);
      toastTimersRef.current.delete(toastId);
    }
  }, []);

  const showBadgeToast = useCallback(
    (badge: BadgeDefinition) => {
      const toastId = `badge-toast-${badge.slug}-${Date.now()}`;
      const toast: BadgeToast = {
        id: toastId,
        badge,
        dismissedAt: null,
      };

      setToasts((prev) => [...prev, toast]);
      announce(`New badge unlocked: ${badge.name}! ${badge.description}`, 'polite');

      const timer = setTimeout(() => {
        dismissToast(toastId);
      }, TOAST_AUTO_DISMISS_MS);

      toastTimersRef.current.set(toastId, timer);
    },
    [dismissToast, announce],
  );

  // Automatically show toasts for newly earned badges when earnedBadges updates
  useEffect(() => {
    const currentSlugs = new Set(earnedBadges.map((b) => b.badgeSlug));

    if (isInitialLoadRef.current) {
      return;
    }

    const prevSlugs = prevEarnedSlugsRef.current;
    const newlyEarned = earnedBadges.filter((eb) => !prevSlugs.has(eb.badgeSlug));
    for (const eb of newlyEarned) {
      const badgeDef = BADGES.find((b) => b.slug === eb.badgeSlug);
      if (badgeDef) {
        showBadgeToast(badgeDef);
      }
    }

    prevEarnedSlugsRef.current = currentSlugs;
  }, [earnedBadges, showBadgeToast]);

  // --- Fetch on mount / userId change ---
  const refresh = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gamification');
      if (!response.ok) {
        throw new Error('Failed to fetch gamification stats');
      }
      const data = await response.json();
      const newBadgesList = data.earnedBadges ?? [];

      if (isInitialLoadRef.current) {
        prevEarnedSlugsRef.current = new Set(newBadgesList.map((b: EarnedBadge) => b.badgeSlug));
        isInitialLoadRef.current = false;
      }

      setEarnedBadges(newBadgesList);
      setTotalPoints(data.totalPoints ?? 0);
    } catch (err: unknown) {
      const resolvedError = err instanceof Error ? err : new Error('Failed to fetch badges');
      setError(resolvedError);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // --- Auto-dismiss toast timers cleanup ---
  useEffect(() => {
    const timers = toastTimersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  // --- Check for new unlocks ---
  const checkUnlocks = useCallback(
    async (action: GamificationAction): Promise<BadgeDefinition[]> => {
      if (!userId) return [];

      try {
        const response = await fetch('/api/gamification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action }),
        });

        if (!response.ok) {
          throw new Error('Failed to post gamification activity');
        }

        const data = await response.json();
        const newBadges: BadgeDefinition[] = data.unlockedBadges ?? [];

        if (newBadges.length > 0) {
          // Show toast for each new badge
          for (const badge of newBadges) {
            showBadgeToast(badge);
          }

          // Refresh data to pick up new badges and points
          await refresh();
        }

        return newBadges;
      } catch (err: unknown) {
        console.error('[useBadges] Failed to check unlocks:', err);
        return [];
      }
    },
    [userId, showBadgeToast, refresh],
  );

  return {
    allBadges: BADGES,
    earnedSlugs,
    earnedBadges,
    isLoading,
    error,
    totalPoints,
    level,
    toasts,
    checkUnlocks,
    dismissToast,
    refresh,
    showBadgeToast,
  };
}
