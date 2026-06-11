'use client';

/**
 * useBadges — hook for managing earned badges and new unlock detection.
 *
 * Fetches the user's earned badges from Supabase, provides a method
 * to check for new unlocks after actions, and shows toast-style
 * notifications when a new badge is earned.
 *
 * @module useBadges
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { BadgeDefinition, EarnedBadge, GamificationAction, Level, BadgeSlug } from '@/features/gamification/types/gamification.types';
import { fetchEarnedBadges, fetchTotalPoints, checkBadgeUnlock, getUserLevel } from '@/features/gamification/services/points.service';
import { BADGES } from '@/features/gamification/data/badges';

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
  /** All 10 badge definitions. */
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
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const TOAST_AUTO_DISMISS_MS = 5000;

export function useBadges(userId: string | null): UseBadgesReturn {
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [toasts, setToasts] = useState<BadgeToast[]>([]);
  const toastTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Derived
  const earnedSlugs: ReadonlySet<BadgeSlug> = new Set(earnedBadges.map((b) => b.badgeSlug));
  const level = getUserLevel(totalPoints);

  // --- Fetch on mount / userId change ---
  const refresh = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [badges, points] = await Promise.all([
        fetchEarnedBadges(userId),
        fetchTotalPoints(userId),
      ]);
      setEarnedBadges(badges);
      setTotalPoints(points);
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

  // --- Dismiss toast ---
  const dismissToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
    const timer = toastTimersRef.current.get(toastId);
    if (timer) {
      clearTimeout(timer);
      toastTimersRef.current.delete(toastId);
    }
  }, []);

  // --- Show toast with auto-dismiss ---
  const showToast = useCallback(
    (badge: BadgeDefinition) => {
      const toastId = `badge-toast-${badge.slug}-${Date.now()}`;
      const toast: BadgeToast = {
        id: toastId,
        badge,
        dismissedAt: null,
      };

      setToasts((prev) => [...prev, toast]);

      const timer = setTimeout(() => {
        dismissToast(toastId);
      }, TOAST_AUTO_DISMISS_MS);

      toastTimersRef.current.set(toastId, timer);
    },
    [dismissToast],
  );

  // --- Check for new unlocks ---
  const checkUnlocks = useCallback(
    async (action: GamificationAction): Promise<BadgeDefinition[]> => {
      if (!userId) return [];

      try {
        const newBadges = await checkBadgeUnlock(userId, action);

        if (newBadges.length > 0) {
          // Show toast for each new badge
          for (const badge of newBadges) {
            showToast(badge);
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
    [userId, showToast, refresh],
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
  };
}
