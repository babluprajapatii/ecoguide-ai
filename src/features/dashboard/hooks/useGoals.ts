'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useA11y } from '@/providers/a11y-announcer-provider';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  category: 'total' | 'transport' | 'energy' | 'diet' | 'shopping' | 'travel';
  target_value: number;
  current_value: number;
  unit: string;
  status: 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

const GOALS_QUERY_KEY = ['goals'] as const;

async function fetchGoals(): Promise<Goal[]> {
  const res = await fetch('/api/goals');
  if (!res.ok) {
    throw new Error('Failed to fetch goals');
  }
  return res.json() as Promise<Goal[]>;
}

export function useGoals() {
  const queryClient = useQueryClient();
  const { announce } = useA11y();

  const {
    data: goals = [],
    isLoading,
    error,
  } = useQuery<Goal[], Error>({
    queryKey: GOALS_QUERY_KEY,
    queryFn: fetchGoals,
    staleTime: 60 * 1000, // 1 minute stale time
  });

  // Create Goal Mutation
  const createMutation = useMutation<
    Goal,
    Error,
    Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  >({
    mutationFn: async (newGoal) => {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal),
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({ message: 'Failed to create goal' }))) as {
          message?: string;
        };
        throw new Error(errData.message || 'Failed to create goal');
      }

      return res.json() as Promise<Goal>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
    },
  });

  // Update Goal Mutation
  const updateMutation = useMutation<
    Goal,
    Error,
    { id: string; current_value: number; status?: 'in_progress' | 'completed' }
  >({
    mutationFn: async (updated) => {
      const res = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (!res.ok) {
        throw new Error('Failed to update goal');
      }

      return res.json() as Promise<Goal>;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      if (data.status === 'completed') {
        announce(`Goal completed: ${data.title}!`, 'assertive');
      }
    },
  });

  // Delete Goal Mutation
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/goals?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete goal');
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
    },
  });

  const createGoal = useCallback(
    async (goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      return createMutation.mutateAsync(goal);
    },
    [createMutation],
  );

  const updateGoal = useCallback(
    async (id: string, currentValue: number, status?: 'in_progress' | 'completed') => {
      return updateMutation.mutateAsync({ id, current_value: currentValue, status });
    },
    [updateMutation],
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      return deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );

  return {
    goals,
    isLoading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error?.message || null,
  };
}
