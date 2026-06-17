/**
 * Analytics Service — pure calculations for carbon reduction potential,
 * grade mapping, and 12-month target forecasting.
 *
 * All functions are deterministic and safe to run on both client and server.
 *
 * @module analytics.service
 */

/** Category footprint parameters for potential reduction calculation. */
export interface FootprintEmissions {
  readonly transport_kg: number;
  readonly diet_kg: number;
  readonly energy_kg: number;
  readonly shopping_kg: number;
  readonly travel_kg: number;
}

/**
 * Calculates a realistic target footprint and estimates annual reduction potential
 * by applying sector-specific optimization ratios (e.g. EV, solar, diet shifts).
 */
export function calculateReductionPotential(latest: FootprintEmissions): {
  targetTotal: number;
  savingsTotal: number;
} {
  const targetTransport = Math.round(latest.transport_kg * 0.35); // 65% reduction potential (EV + public transport)
  const targetEnergy = Math.round(latest.energy_kg * 0.4);       // 60% reduction potential (Solar offset + home efficiency)
  const targetDiet = Math.min(latest.diet_kg, 1600);             // Shift to vegetarian/vegan (~1600kg or baseline if lower)
  const targetShopping = Math.min(latest.shopping_kg, 500);      // Shifting to minimal spending (~500kg or baseline if lower)
  const targetTravel = Math.round(latest.travel_kg * 0.4);       // 60% reduction potential (fewer flights, green lodging)

  const targetTotal = targetTransport + targetEnergy + targetDiet + targetShopping + targetTravel;
  const currentTotal = latest.transport_kg + latest.diet_kg + latest.energy_kg + latest.shopping_kg + latest.travel_kg;
  const savingsTotal = Math.max(0, currentTotal - targetTotal);

  return {
    targetTotal,
    savingsTotal,
  };
}

/**
 * Maps annual emissions (in kg CO2) to a letter grade based on IPCC/EPA carbon thresholds.
 */
export function calculateGradeFromEmissions(totalKg: number): string {
  if (totalKg <= 2000) return 'A+'; // Exceptional / Carbon Neutral Target (2t CO2/yr)
  if (totalKg <= 3500) return 'A';  // Excellent progress
  if (totalKg <= 5000) return 'B';  // Near global average midpoint
  if (totalKg <= 7000) return 'C';  // Average
  if (totalKg <= 10000) return 'D'; // Heavy footprint
  return 'F';                       // Critical footprint
}

/** A single data point in the monthly forecast projection. */
export interface ForecastPoint {
  readonly month: string;
  readonly monthIndex: number;
  readonly total: number;
}

/**
 * Generates a 12-month carbon reduction forecast curve from current baseline
 * to target emissions using a decelerating (ease-out) curve model.
 */
export function generateForecastCurve(
  baselineTotal: number,
  targetTotal: number,
  months: number = 12
): ForecastPoint[] {
  const points: ForecastPoint[] = [];

  for (let i = 0; i <= months; i++) {
    const t = i / months;
    // Decelerating ease-out curve representing progressive adoption of green habits
    const tScaled = t * (2 - t);
    const value = baselineTotal - (baselineTotal - targetTotal) * tScaled;

    points.push({
      month: i === 0 ? 'Now' : `Month ${i}`,
      monthIndex: i,
      total: Math.round(value),
    });
  }

  return points;
}
