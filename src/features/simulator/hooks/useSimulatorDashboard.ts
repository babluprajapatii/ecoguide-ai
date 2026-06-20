'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { SimulatorAdjustments } from '@/features/simulator/types/simulator.types';

export interface SavedSimulation {
  readonly id: string;
  readonly user_id: string;
  readonly scenario_name: string;
  readonly scenario_type: 'ev' | 'solar' | 'diet' | 'flights' | 'shopping' | 'custom';
  readonly configuration: SimulatorAdjustments;
  readonly estimated_carbon_savings: number;
  readonly estimated_cost_savings: number;
  readonly estimated_water_savings: number;
  readonly estimated_energy_savings: number;
  readonly impact_score: number;
  readonly is_favorite: boolean;
  readonly comparison_group_id: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

const SAVED_SIMULATIONS_KEY = ['saved-simulations'] as const;

export function useSimulatorDashboard() {
  const queryClient = useQueryClient();

  // 1. Fetch saved simulations
  const savedSimulationsQuery = useQuery<SavedSimulation[], Error>({
    queryKey: SAVED_SIMULATIONS_KEY,
    queryFn: async () => {
      const res = await fetch('/api/simulator');
      if (!res.ok) {
        throw new Error('Failed to load saved simulations.');
      }
      return res.json() as Promise<SavedSimulation[]>;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // 2. Mutation: Save simulation
  const saveSimulationMutation = useMutation<
    SavedSimulation,
    Error,
    {
      scenario_name: string;
      scenario_type: 'ev' | 'solar' | 'diet' | 'flights' | 'shopping' | 'custom';
      configuration: SimulatorAdjustments;
      estimated_carbon_savings: number;
      estimated_cost_savings: number;
      impact_score: number;
      is_favorite?: boolean;
      comparison_group_id?: string | null;
    }
  >({
    mutationFn: async (payload) => {
      const res = await fetch('/api/simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save simulation.');
      }
      return res.json() as Promise<SavedSimulation>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SAVED_SIMULATIONS_KEY });
    },
  });

  // 3. Mutation: Update simulation (e.g. rename, toggle favorite)
  const updateSimulationMutation = useMutation<
    SavedSimulation,
    Error,
    {
      id: string;
      scenario_name?: string;
      is_favorite?: boolean;
      comparison_group_id?: string | null;
    }
  >({
    mutationFn: async (payload) => {
      const res = await fetch('/api/simulator', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error('Failed to update simulation.');
      }
      return res.json() as Promise<SavedSimulation>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SAVED_SIMULATIONS_KEY });
    },
  });

  // 4. Mutation: Delete simulation
  const deleteSimulationMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/simulator?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete simulation.');
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SAVED_SIMULATIONS_KEY });
    },
  });

  const saveSimulation = useCallback(
    async (payload: Parameters<typeof saveSimulationMutation.mutateAsync>[0]) => {
      return saveSimulationMutation.mutateAsync(payload);
    },
    [saveSimulationMutation],
  );

  const deleteSimulation = useCallback(
    async (id: string) => {
      return deleteSimulationMutation.mutateAsync(id);
    },
    [deleteSimulationMutation],
  );

  const toggleFavorite = useCallback(
    async (id: string, currentFavorite: boolean) => {
      return updateSimulationMutation.mutateAsync({ id, is_favorite: !currentFavorite });
    },
    [updateSimulationMutation],
  );

  const updateSimulationName = useCallback(
    async (id: string, name: string) => {
      return updateSimulationMutation.mutateAsync({ id, scenario_name: name });
    },
    [updateSimulationMutation],
  );

  return {
    simulations: savedSimulationsQuery.data || [],
    isLoadingSimulations: savedSimulationsQuery.isLoading,
    isSaving: saveSimulationMutation.isPending,
    isDeleting: deleteSimulationMutation.isPending,
    saveSimulation,
    deleteSimulation,
    toggleFavorite,
    updateSimulationName,
  };
}
