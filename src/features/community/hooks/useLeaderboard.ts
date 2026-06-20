'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  LeaderboardEntry,
  CurrentUserRank,
  PaginationMeta,
  LeaderboardView,
} from '../types/community.types';

export function useLeaderboard(initialLimit: number = 20) {
  const [rankings, setRankings] = useState<readonly LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUserRank | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [view, setView] = useState<LeaderboardView>('global');
  const [limit] = useState(initialLimit);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/community/leaderboard?page=${page}&limit=${limit}&view=${view}`,
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch leaderboard: ${res.statusText}`);
      }

      const data = await res.json();
      setRankings(data.rankings || []);
      setCurrentUser(data.currentUser || null);
      setPagination(data.pagination || null);
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : 'An error occurred while loading the leaderboard';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, view]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    rankings,
    currentUser,
    pagination,
    isLoading,
    error,
    page,
    setPage,
    view,
    setView,
    refresh: fetchLeaderboard,
  };
}
