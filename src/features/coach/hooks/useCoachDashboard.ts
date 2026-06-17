'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export interface CoachDashboardStats {
  readonly conversationCount: number;
  readonly insightsCount: number;
  readonly activeRecommendations: number;
  readonly completedRecommendations: number;
  readonly lastConversationDate: string | null;
  readonly streak: number;
}

export interface CoachRecommendation {
  readonly id: string;
  readonly user_id: string;
  readonly title: string;
  readonly description: string;
  readonly priority: 'high' | 'medium' | 'low';
  readonly estimated_savings: number;
  readonly status: 'pending' | 'completed' | 'dismissed';
  readonly created_at: string;
  readonly updated_at: string;
}

const COACH_STATS_KEY = ['coach-stats'] as const;
const COACH_RECS_KEY = ['coach-recommendations'] as const;

export function useCoachDashboard() {
  const queryClient = useQueryClient();

  // 1. Query dashboard statistics
  const statsQuery = useQuery<CoachDashboardStats, Error>({
    queryKey: COACH_STATS_KEY,
    queryFn: async () => {
      const res = await fetch('/api/coach/dashboard');
      if (!res.ok) {
        throw new Error('Failed to load coach metrics.');
      }
      return res.json() as Promise<CoachDashboardStats>;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // 2. Query recommended actions
  const recsQuery = useQuery<CoachRecommendation[], Error>({
    queryKey: COACH_RECS_KEY,
    queryFn: async () => {
      const res = await fetch('/api/coach/recommendations');
      if (!res.ok) {
        throw new Error('Failed to load recommended actions.');
      }
      return res.json() as Promise<CoachRecommendation[]>;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // 3. Mutation: Update Recommendation status
  const updateStatusMutation = useMutation<
    CoachRecommendation,
    Error,
    { id: string; status: 'pending' | 'completed' | 'dismissed' }
  >({
    mutationFn: async ({ id, status }) => {
      const res = await fetch('/api/coach/recommendations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        throw new Error('Failed to update recommendation status.');
      }
      return res.json() as Promise<CoachRecommendation>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: COACH_STATS_KEY });
      void queryClient.invalidateQueries({ queryKey: COACH_RECS_KEY });
    },
  });

  // 4. Mutation: Create custom recommended action
  const createRecMutation = useMutation<
    CoachRecommendation,
    Error,
    Omit<CoachRecommendation, 'id' | 'user_id' | 'status' | 'created_at' | 'updated_at'>
  >({
    mutationFn: async (newRec) => {
      const res = await fetch('/api/coach/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRec),
      });
      if (!res.ok) {
        throw new Error('Failed to create recommendation.');
      }
      return res.json() as Promise<CoachRecommendation>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: COACH_STATS_KEY });
      void queryClient.invalidateQueries({ queryKey: COACH_RECS_KEY });
    },
  });

  // 5. Mutation: Delete recommended action
  const deleteRecMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/coach/recommendations?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete recommendation.');
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: COACH_STATS_KEY });
      void queryClient.invalidateQueries({ queryKey: COACH_RECS_KEY });
    },
  });

  const updateStatus = useCallback(
    async (id: string, status: 'pending' | 'completed' | 'dismissed') => {
      return updateStatusMutation.mutateAsync({ id, status });
    },
    [updateStatusMutation],
  );

  const createRecommendation = useCallback(
    async (rec: Omit<CoachRecommendation, 'id' | 'user_id' | 'status' | 'created_at' | 'updated_at'>) => {
      return createRecMutation.mutateAsync(rec);
    },
    [createRecMutation],
  );

  const deleteRecommendation = useCallback(
    async (id: string) => {
      return deleteRecMutation.mutateAsync(id);
    },
    [deleteRecMutation],
  );

  return {
    stats: statsQuery.data || null,
    isLoadingStats: statsQuery.isLoading,
    statsError: statsQuery.error,

    recommendations: recsQuery.data || [],
    isLoadingRecs: recsQuery.isLoading,
    recsError: recsQuery.error,

    updateStatus,
    createRecommendation,
    deleteRecommendation,

    isUpdating: updateStatusMutation.isPending,
    isCreating: createRecMutation.isPending,
    isDeleting: deleteRecMutation.isPending,
  };
}
