/**
 * Impact Simulator Service — pure calculation functions.
 *
 * Computes adjusted footprints and monthly forecast projections
 * for "what-if" scenario analysis. All functions are stateless
 * with zero side effects.
 *
 * @module simulator.service
 */

import type { FootprintBreakdown } from '@/features/assessment/types/assessment.types';
import type { MonthlyProjection, SimulatorAdjustments } from '@/features/simulator/types/simulator.types';

// ---------------------------------------------------------------------------
// Constants — Emission Factors (mirrored from carbon-calculator for purity)
// ---------------------------------------------------------------------------

const WEEKS_PER_YEAR = 52;

/** Car CO2 factors in kg CO2 per km. */
const CAR_KG_PER_KM: Record<string, number> = {
  petrol: 0.21,
  diesel: 0.17,
  electric: 0.05,
  hybrid: 0.11,
};

/** Average flight speed in km/h for rough hour→km conversion. */
const AVG_FLIGHT_SPEED_KMH = 800;

/** Average kg CO2 per passenger-km (blended short/long-haul). */
const AVG_FLIGHT_KG_PER_KM = 0.225;

/** Annual diet CO2 in kg by type. */
const DIET_ANNUAL_KG: Record<string, number> = {
  vegan: 1_500,
  vegetarian: 1_700,
  mixed: 2_500,
  'meat-heavy': 3_300,
};

/** Annual shopping CO2 in kg by level. */
const SHOPPING_ANNUAL_KG: Record<string, number> = {
  low: 500,
  medium: 1_200,
  high: 2_500,
};

/** Global average annual CO2 per person in kg. */
const GLOBAL_AVERAGE_KG = 4_700;

// ---------------------------------------------------------------------------
// Helper — recompute comparison metrics
// ---------------------------------------------------------------------------

function computeMetrics(total: number): { comparedToAverage: number; percentile: number } {
  const comparedToAverage = total / GLOBAL_AVERAGE_KG;
  // Logistic model calibrated on global average
  const k = 0.0006;
  const percentile = 100 / (1 + Math.exp(-k * (total - GLOBAL_AVERAGE_KG)));
  return {
    comparedToAverage: Math.round(comparedToAverage * 100) / 100,
    percentile: Math.round(percentile),
  };
}

// ---------------------------------------------------------------------------
// adjustFootprint
// ---------------------------------------------------------------------------

/**
 * Adjusts a baseline footprint according to the simulator controls.
 *
 * Each adjustment overrides the relevant category. If an adjustment
 * is `null`, the baseline value is kept. The `total`, `comparedToAverage`,
 * and `percentile` fields are recomputed from the adjusted categories.
 *
 * @param baseline - The user's current actual footprint.
 * @param adjustments - Slider/toggle values from the simulator UI.
 * @returns A new `FootprintBreakdown` reflecting the adjustments.
 */
export function adjustFootprint(
  baseline: FootprintBreakdown,
  adjustments: SimulatorAdjustments,
): FootprintBreakdown {
  // --- Transport ---
  let transport = baseline.transport;
  if (adjustments.carKmPerWeek !== null || adjustments.carFuelType !== null) {
    const kmPerWeek = adjustments.carKmPerWeek ?? 0;
    const fuelType = adjustments.carFuelType ?? 'petrol';
    const factor = CAR_KG_PER_KM[fuelType] ?? CAR_KG_PER_KM.petrol ?? 0.21;
    const carKg = kmPerWeek * WEEKS_PER_YEAR * factor;

    // Preserve flight component from baseline if flight hours not overridden
    let flightKg = 0;
    if (adjustments.flightHoursPerYear !== null) {
      const flightKm = adjustments.flightHoursPerYear * AVG_FLIGHT_SPEED_KMH;
      flightKg = flightKm * AVG_FLIGHT_KG_PER_KM;
    } else {
      // Estimate baseline flight contribution (rough: baseline minus estimated car)
      flightKg = Math.max(0, baseline.transport * 0.3);
    }

    transport = carKg + flightKg;
  } else if (adjustments.flightHoursPerYear !== null) {
    const flightKm = adjustments.flightHoursPerYear * AVG_FLIGHT_SPEED_KMH;
    const flightKg = flightKm * AVG_FLIGHT_KG_PER_KM;
    // Replace flight portion only (estimate car as 70% of baseline transport)
    const carPortion = baseline.transport * 0.7;
    transport = carPortion + flightKg;
  }

  // --- Diet ---
  let diet = baseline.diet;
  if (adjustments.dietType !== null) {
    diet = DIET_ANNUAL_KG[adjustments.dietType] ?? baseline.diet;
  }

  // --- Energy ---
  let energy = baseline.energy;
  if (adjustments.renewableEnergyPercent > 0) {
    // Estimate electricity portion as ~60% of energy, gas as ~40%
    const electricityPortion = baseline.energy * 0.6;
    const gasPortion = baseline.energy * 0.4;
    // Renewable energy reduces the electricity portion
    const renewableFraction = adjustments.renewableEnergyPercent / 100;
    energy = electricityPortion * (1 - renewableFraction) + gasPortion;
  }

  // --- Shopping ---
  let shopping = baseline.shopping;
  if (adjustments.shoppingLevel !== null) {
    shopping = SHOPPING_ANNUAL_KG[adjustments.shoppingLevel] ?? baseline.shopping;
  }

  // Ensure non-negative
  transport = Math.max(0, Math.round(transport));
  diet = Math.max(0, Math.round(diet));
  energy = Math.max(0, Math.round(energy));
  shopping = Math.max(0, Math.round(shopping));

  const total = transport + diet + energy + shopping;
  const metrics = computeMetrics(total);

  return {
    transport,
    diet,
    energy,
    shopping,
    total,
    ...metrics,
  };
}

// ---------------------------------------------------------------------------
// projectForecast
// ---------------------------------------------------------------------------

/**
 * Generates a month-by-month linear interpolation from the current
 * footprint to the target footprint over a given number of months.
 *
 * Each data point represents the projected annual emissions if the
 * user were at that point in their transition at that month.
 *
 * @param start - Current footprint (month 0).
 * @param end - Target footprint after all changes applied.
 * @param months - Number of months to project (default 12).
 * @returns Array of `MonthlyProjection` with `months + 1` entries (month 0 to month N).
 */
export function projectForecast(
  start: FootprintBreakdown,
  end: FootprintBreakdown,
  months: number = 12,
): MonthlyProjection[] {
  const projections: MonthlyProjection[] = [];
  const safeMonths = Math.max(1, Math.round(months));

  for (let i = 0; i <= safeMonths; i++) {
    const t = i / safeMonths;

    const transport = Math.round(start.transport + (end.transport - start.transport) * t);
    const diet = Math.round(start.diet + (end.diet - start.diet) * t);
    const energy = Math.round(start.energy + (end.energy - start.energy) * t);
    const shopping = Math.round(start.shopping + (end.shopping - start.shopping) * t);
    const total = transport + diet + energy + shopping;

    projections.push({
      month: i === 0 ? 'Now' : `Month ${i}`,
      monthIndex: i,
      total,
      transport,
      diet,
      energy,
      shopping,
    });
  }

  return projections;
}
