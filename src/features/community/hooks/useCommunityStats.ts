'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CommunityStats } from '../types/community.types';

export function useCommunityStats() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/community/stats');
      if (!res.ok) {
        throw new Error(`Failed to fetch stats: ${res.statusText}`);
      }
      const data = await res.json();
      setStats(data);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'An error occurred while loading community statistics';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
  };
}
