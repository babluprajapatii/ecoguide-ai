'use client';

/**
 * React Query hook for dashboard data.
 *
 * Wraps the `/api/dashboard` endpoint with TanStack Query for
 * automatic caching (5 min stale window), background refetching,
 * and optimistic updates when a new assessment is submitted.
 *
 * @module useDashboardData
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { DashboardData, AssessmentRecord } from '@/features/dashboard/types/dashboard.types';

/** Query key constant to avoid magic strings. */
const DASHBOARD_QUERY_KEY = ['dashboard'] as const;

/** Stale time: 5 minutes in milliseconds. */
const STALE_TIME_MS = 5 * 60 * 1000;

/**
 * Fetches dashboard data from the API route.
 * Throws on non-OK responses so React Query marks the query as errored.
 */
async function fetchDashboardDataClient(): Promise<DashboardData> {
  const response = await fetch('/api/dashboard', {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Dashboard fetch failed: ${response.status}`);
  }

  return response.json() as Promise<DashboardData>;
}

/**
 * Dashboard data shape returned by the hook, extending React Query state
 * with a typed optimistic update function.
 */
export interface UseDashboardDataReturn {
  /** The fetched dashboard data, or `undefined` while loading. */
  readonly data: DashboardData | undefined;
  /** Whether the initial load is in progress. */
  readonly isLoading: boolean;
  /** Whether data exists from a previous fetch (even if stale). */
  readonly isPending: boolean;
  /** The error object if the query failed. */
  readonly error: Error | null;
  /** Whether a background refetch is occurring. */
  readonly isFetching: boolean;
  /**
   * Optimistically adds a new assessment to the cached dashboard data.
   * Useful after the assessment wizard submits successfully so the
   * dashboard updates instantly without a round-trip.
   */
  readonly addOptimisticAssessment: (record: AssessmentRecord) => void;
  /** Force a refetch of the dashboard data. */
  readonly refetch: () => void;
}

/**
 * Provides cached, auto-refreshing dashboard data via React Query.
 *
 * - `staleTime`: 5 minutes — avoids redundant fetches on tab switches.
 * - `initialData`: Accepts server-fetched data to eliminate the loading
 *   waterfall on first render (SSR hydration).
 * - `addOptimisticAssessment`: Writes directly to the query cache so the
 *   UI updates immediately after a new assessment submission.
 *
 * @param initialData - Server-side pre-fetched dashboard data (optional).
 * @returns Dashboard data state, loading indicators, and cache helpers.
 */
export function useDashboardData(initialData?: DashboardData): UseDashboardDataReturn {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isPending,
    error,
    isFetching,
    refetch: queryRefetch,
  } = useQuery<DashboardData, Error>({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: fetchDashboardDataClient,
    staleTime: STALE_TIME_MS,
    initialData,
    retry: 2,
    refetchOnWindowFocus: true,
  });

  /**
   * Optimistically appends a new assessment record to the cached data.
   *
   * WHY useCallback: This function is passed as a prop to child components
   * (e.g. the assessment wizard completion handler). Stabilising the
   * reference prevents unnecessary re-renders of memoised children.
   */
  const addOptimisticAssessment = useCallback(
    (record: AssessmentRecord) => {
      queryClient.setQueryData<DashboardData>(DASHBOARD_QUERY_KEY, (old) => {
        if (!old) {
          return {
            latestAssessment: record,
            history: [record],
          };
        }

        return {
          latestAssessment: record,
          history: [...old.history, record],
        };
      });
    },
    [queryClient],
  );

  const refetch = useCallback(() => {
    void queryRefetch();
  }, [queryRefetch]);

  return {
    data,
    isLoading,
    isPending,
    error,
    isFetching,
    addOptimisticAssessment,
    refetch,
  };
}
