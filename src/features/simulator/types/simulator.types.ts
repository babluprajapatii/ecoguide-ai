/**
 * Type definitions for the Impact Simulator feature.
 *
 * These types model the adjustable scenario parameters, projected
 * footprints, and monthly forecast data points used by the simulator
 * UI and service layer.
 *
 * @module simulator.types
 */

import type {
  DietType,
  FuelType,
  ShoppingLevel,
} from '@/features/assessment/types/assessment.types';

// ---------------------------------------------------------------------------
// Simulator Adjustments
// ---------------------------------------------------------------------------

/** Adjustable parameters for the "what-if" scenario simulator. */
export interface SimulatorAdjustments {
  /** Weekly car km driven. `null` means "keep baseline". */
  readonly carKmPerWeek: number | null;
  /** Fuel type of the vehicle. `null` means "keep baseline". */
  readonly carFuelType: FuelType | null;
  /** Diet type override. `null` means "keep baseline". */
  readonly dietType: DietType | null;
  /** Percentage of electricity from renewable sources (0–100). */
  readonly renewableEnergyPercent: number;
  /** Annual flight hours override. `null` means "keep baseline". */
  readonly flightHoursPerYear: number | null;
  /** Shopping intensity level override. `null` means "keep baseline". */
  readonly shoppingLevel: ShoppingLevel | null;
}

/** Default adjustments — all nulls mean "no change from baseline". */
export const DEFAULT_ADJUSTMENTS: SimulatorAdjustments = {
  carKmPerWeek: null,
  carFuelType: null,
  dietType: null,
  renewableEnergyPercent: 0,
  flightHoursPerYear: null,
  shoppingLevel: null,
};

// ---------------------------------------------------------------------------
// Forecast Data
// ---------------------------------------------------------------------------

/** A single data point in the 12-month forecast projection. */
export interface MonthlyProjection {
  /** Month label (e.g. "Month 1", "Month 2"). */
  readonly month: string;
  /** Month index (0-based). */
  readonly monthIndex: number;
  /** Projected total annual emissions at this month in kg CO2. */
  readonly total: number;
  /** Projected transport emissions at this month in kg CO2. */
  readonly transport: number;
  /** Projected diet emissions at this month in kg CO2. */
  readonly diet: number;
  /** Projected energy emissions at this month in kg CO2. */
  readonly energy: number;
  /** Projected shopping emissions at this month in kg CO2. */
  readonly shopping: number;
  /** Projected travel emissions at this month in kg CO2. */
  readonly travel: number;
}

// ---------------------------------------------------------------------------
// Scenario Presets
// ---------------------------------------------------------------------------

/** A named scenario preset with predefined adjustment overrides. */
export interface ScenarioPreset {
  /** Display name of the preset. */
  readonly name: string;
  /** Short description of what this preset does. */
  readonly description: string;
  /** Emoji icon for the preset. */
  readonly icon: string;
  /** The adjustments to apply. */
  readonly adjustments: Partial<SimulatorAdjustments>;
}

/** Built-in scenario presets. */
export const SCENARIO_PRESETS: readonly ScenarioPreset[] = [
  {
    name: 'Go Vegan',
    description: 'Switch to a fully plant-based diet',
    icon: '🌱',
    adjustments: { dietType: 'vegan' },
  },
  {
    name: 'Buy EV',
    description: 'Switch to an electric vehicle',
    icon: '⚡',
    adjustments: { carFuelType: 'electric' },
  },
  {
    name: 'Go Solar',
    description: '100% renewable electricity at home',
    icon: '☀️',
    adjustments: { renewableEnergyPercent: 100 },
  },
  {
    name: 'No Flights',
    description: 'Eliminate all air travel',
    icon: '✈️',
    adjustments: { flightHoursPerYear: 0 },
  },
] as const;
