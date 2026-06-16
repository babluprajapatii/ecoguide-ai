'use client';

/**
 * useSimulator — state management hook for the Impact Simulator.
 *
 * Manages baseline footprint, scenario adjustments, and derived
 * projections with memoisation and debounced recalculation.
 *
 * @module useSimulator
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import type { FootprintBreakdown, DietType, FuelType, ShoppingLevel } from '@/features/assessment/types/assessment.types';
import type { MonthlyProjection, SimulatorAdjustments } from '@/features/simulator/types/simulator.types';
import { DEFAULT_ADJUSTMENTS } from '@/features/simulator/types/simulator.types';
import { adjustFootprint, projectForecast } from '@/features/simulator/services/simulator.service';

// ---------------------------------------------------------------------------
// Debounce utility
// ---------------------------------------------------------------------------

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseSimulatorReturn {
  /** The user's current (unmodified) footprint. */
  readonly baseline: FootprintBreakdown;
  /** Current slider/toggle adjustment state. */
  readonly adjustments: SimulatorAdjustments;
  /** Projected footprint after applying adjustments. */
  readonly projected: FootprintBreakdown;
  /** 12-month forecast from baseline → projected. */
  readonly forecast: MonthlyProjection[];
  /** Total savings in kg CO2/year (positive = reduction). */
  readonly totalSavings: number;
  /** Percentage reduction from baseline. */
  readonly savingsPercent: number;

  // --- Setters ---
  readonly setCarKmPerWeek: (km: number | null) => void;
  readonly setCarFuelType: (fuel: FuelType | null) => void;
  readonly setDietType: (diet: DietType | null) => void;
  readonly setRenewableEnergyPercent: (pct: number) => void;
  readonly setFlightHoursPerYear: (hours: number | null) => void;
  readonly setShoppingLevel: (level: ShoppingLevel | null) => void;

  /** Apply a partial set of adjustments (e.g., from a preset). */
  readonly applyPreset: (overrides: Partial<SimulatorAdjustments>) => void;

  /** Reset all adjustments to defaults. */
  readonly reset: () => void;

  /** Encode current adjustments to URL search params. */
  readonly encodeToUrl: () => string;
}

// ---------------------------------------------------------------------------
// Default baseline (used if no assessment data is provided)
// ---------------------------------------------------------------------------

const FALLBACK_BASELINE: FootprintBreakdown = {
  transport: 2000,
  diet: 2000,
  energy: 1800,
  shopping: 1200,
  travel: 1000,
  total: 8000,
  comparedToAverage: 1.7,
  percentile: 60,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSimulator(baseline?: FootprintBreakdown): UseSimulatorReturn {
  const resolvedBaseline = baseline ?? FALLBACK_BASELINE;
  const [adjustments, setAdjustments] = useState<SimulatorAdjustments>(DEFAULT_ADJUSTMENTS);

  // Debounce the adjustments for expensive recalculation (200ms)
  const debouncedAdjustments = useDebouncedValue(adjustments, 200);

  // --- Individual setters (stable references) ---
  const setCarKmPerWeek = useCallback((km: number | null) => {
    setAdjustments((prev) => ({ ...prev, carKmPerWeek: km }));
  }, []);

  const setCarFuelType = useCallback((fuel: FuelType | null) => {
    setAdjustments((prev) => ({ ...prev, carFuelType: fuel }));
  }, []);

  const setDietType = useCallback((diet: DietType | null) => {
    setAdjustments((prev) => ({ ...prev, dietType: diet }));
  }, []);

  const setRenewableEnergyPercent = useCallback((pct: number) => {
    setAdjustments((prev) => ({ ...prev, renewableEnergyPercent: Math.max(0, Math.min(100, pct)) }));
  }, []);

  const setFlightHoursPerYear = useCallback((hours: number | null) => {
    setAdjustments((prev) => ({ ...prev, flightHoursPerYear: hours }));
  }, []);

  const setShoppingLevel = useCallback((level: ShoppingLevel | null) => {
    setAdjustments((prev) => ({ ...prev, shoppingLevel: level }));
  }, []);

  const applyPreset = useCallback((overrides: Partial<SimulatorAdjustments>) => {
    setAdjustments((prev) => ({ ...prev, ...overrides }));
  }, []);

  const reset = useCallback(() => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
  }, []);

  // --- Derived values (memoised on debounced adjustments) ---
  const projected = useMemo(
    () => adjustFootprint(resolvedBaseline, debouncedAdjustments),
    [resolvedBaseline, debouncedAdjustments],
  );

  const forecast = useMemo(
    () => projectForecast(resolvedBaseline, projected, 12),
    [resolvedBaseline, projected],
  );

  const totalSavings = useMemo(
    () => resolvedBaseline.total - projected.total,
    [resolvedBaseline.total, projected.total],
  );

  const savingsPercent = useMemo(
    () => resolvedBaseline.total > 0
      ? Math.round((totalSavings / resolvedBaseline.total) * 100)
      : 0,
    [totalSavings, resolvedBaseline.total],
  );

  // --- URL encoding ---
  const encodeToUrl = useCallback((): string => {
    const params = new URLSearchParams();
    const adj = adjustments;

    if (adj.carKmPerWeek !== null) params.set('carKm', String(adj.carKmPerWeek));
    if (adj.carFuelType !== null) params.set('fuel', adj.carFuelType);
    if (adj.dietType !== null) params.set('diet', adj.dietType);
    if (adj.renewableEnergyPercent > 0) params.set('solar', String(adj.renewableEnergyPercent));
    if (adj.flightHoursPerYear !== null) params.set('flights', String(adj.flightHoursPerYear));
    if (adj.shoppingLevel !== null) params.set('shop', adj.shoppingLevel);

    return `${window.location.pathname}?${params.toString()}`;
  }, [adjustments]);

  return {
    baseline: resolvedBaseline,
    adjustments,
    projected,
    forecast,
    totalSavings,
    savingsPercent,
    setCarKmPerWeek,
    setCarFuelType,
    setDietType,
    setRenewableEnergyPercent,
    setFlightHoursPerYear,
    setShoppingLevel,
    applyPreset,
    reset,
    encodeToUrl,
  };
}
