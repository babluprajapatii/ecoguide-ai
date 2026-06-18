/**
 * Centralized Simulation Engine — pure calculation functions.
 *
 * Computes adjusted footprints, financial savings, water/waste metrics,
 * combined impact scores, and monthly forecast projections for
 * "what-if" scenario analysis.
 *
 * All functions are side-effect-free, stateless, and 100% deterministic.
 *
 * @module simulation.service
 */

import type { FootprintBreakdown, DietType, FuelType, ShoppingLevel } from '@/features/assessment/types/assessment.types';
import type { MonthlyProjection, SimulatorAdjustments } from '@/features/simulator/types/simulator.types';

// ---------------------------------------------------------------------------
// Constants & Emission Factors
// ---------------------------------------------------------------------------

export const WEEKS_PER_YEAR = 52;

/** Car emissions factors in kg CO2 per km. */
export const CAR_KG_PER_KM: Record<FuelType, number> = {
  petrol: 0.21,
  diesel: 0.17,
  hybrid: 0.11,
  electric: 0.05,
  none: 0,
};

/** Car fuel/energy cost in USD per km. */
export const CAR_COST_PER_KM: Record<FuelType, number> = {
  petrol: 0.15,
  diesel: 0.12,
  hybrid: 0.08,
  electric: 0.03,
  none: 0,
};

/** Average flight speed in km/h. */
export const AVG_FLIGHT_SPEED_KMH = 800;

/** Average kg CO2 per passenger-flight-hour. */
export const FLIGHT_KG_PER_HOUR = 180;

/** Average ticket cost per flight hour in USD. */
export const FLIGHT_COST_PER_HOUR = 100;

/** Annual diet carbon footprint in kg CO2. */
export const DIET_ANNUAL_KG: Record<DietType, number> = {
  vegan: 1500,
  vegetarian: 1700,
  mixed: 2500,
  'meat-heavy': 3300,
};

/** Diet water usage in liters per day. */
export const DIET_WATER_L_PER_DAY: Record<DietType, number> = {
  vegan: 1500,
  vegetarian: 2000,
  mixed: 3000,
  'meat-heavy': 4500,
};

/** Annual shopping carbon footprint in kg CO2. */
export const SHOPPING_ANNUAL_KG: Record<ShoppingLevel, number> = {
  low: 500,
  medium: 1200,
  high: 2500,
};

/** Annual shopping waste in kg per year. */
export const SHOPPING_WASTE_KG: Record<ShoppingLevel, number> = {
  low: 50,
  medium: 150,
  high: 300,
};

/** Global average annual carbon footprint in kg CO2. */
export const GLOBAL_AVERAGE_KG = 4700;

/** Grid electricity emissions factor in kg CO2 per kWh. */
export const GRID_CO2_PER_KWH = 0.38;

/** Average electricity rate in USD per kWh. */
export const ELECTRICITY_COST_PER_KWH = 0.16;

/** Estimated baseline annual household electricity usage in kWh. */
export const BASELINE_ANNUAL_KWH = 6000;

// ---------------------------------------------------------------------------
// Pure Core Logic
// ---------------------------------------------------------------------------

/**
 * Calculates a user's simulated footprint breakdown and savings.
 */
export function calculateSimulatedImpact(
  baseline: FootprintBreakdown,
  adjustments: SimulatorAdjustments,
  baselineDiet: DietType = 'mixed',
  baselineShopping: ShoppingLevel = 'medium'
): {
  projected: FootprintBreakdown;
  carbonSavings: number; // kg CO2/yr
  costSavings: number; // USD/yr
  waterSavings: number; // liters/yr
  energySavings: number; // kWh/yr
  wasteSavings: number; // kg/yr
  impactScore: number; // 0-100
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
} {
  // Clamp input adjustments to prevent out of bound errors
  const renewableEnergyPct = Math.max(0, Math.min(100, adjustments.renewableEnergyPercent));

  // --- 1. Transport (EV Adoption & Distance Adjustments) ---
  let transport = baseline.transport;
  let transportCostBaseline = 0;
  let transportCostProjected = 0;

  if (adjustments.carKmPerWeek !== null || adjustments.carFuelType !== null) {
    const km = Math.max(0, adjustments.carKmPerWeek ?? 100);
    const fuel = adjustments.carFuelType ?? 'petrol';

    // Synergy: If car is electric AND home solar is installed, charging emissions are cleaner.
    // Assume 80% charging happens at home.
    let carFactor = CAR_KG_PER_KM[fuel];
    if (fuel === 'electric') {
      const solarReduction = 0.8 * (renewableEnergyPct / 100);
      carFactor = Math.max(0, CAR_KG_PER_KM.electric * (1 - solarReduction));
    }

    const annualKm = km * WEEKS_PER_YEAR;
    const carEmissions = annualKm * carFactor;
    const transitPortion = baseline.transport * 0.2; // Assume 20% of baseline transport is public transit
    transport = carEmissions + transitPortion;

    // Financial calculations
    const baselineFuel = adjustments.carFuelType ? 'petrol' : fuel; // Assume petrol was baseline if changed
    transportCostBaseline = annualKm * CAR_COST_PER_KM[baselineFuel];
    transportCostProjected = annualKm * CAR_COST_PER_KM[fuel];
  }

  // --- 2. Diet Transition ---
  let diet = baseline.diet;
  let waterSavings = 0;
  if (adjustments.dietType !== null) {
    diet = DIET_ANNUAL_KG[adjustments.dietType];
    const baselineWater = DIET_WATER_L_PER_DAY[baselineDiet] || 3000;
    const projectedWater = DIET_WATER_L_PER_DAY[adjustments.dietType];
    waterSavings = Math.max(0, (baselineWater - projectedWater) * 365);
  }

  // --- 3. Solar / Home Energy ---
  let energy = baseline.energy;
  let energySavings = 0; // kWh saved
  let energyCostSavings = 0; // USD saved

  if (renewableEnergyPct > 0) {
    // Electricity accounts for ~60% of baseline energy emissions, heating/gas for ~40%
    const electricityPortion = baseline.energy * 0.6;
    const gasPortion = baseline.energy * 0.4;
    energy = electricityPortion * (1 - renewableEnergyPct / 100) + gasPortion;

    energySavings = BASELINE_ANNUAL_KWH * (renewableEnergyPct / 100);
    energyCostSavings = energySavings * ELECTRICITY_COST_PER_KWH;
  }

  // --- 4. Shopping Habits ---
  let shopping = baseline.shopping;
  let wasteSavings = 0;
  if (adjustments.shoppingLevel !== null) {
    shopping = SHOPPING_ANNUAL_KG[adjustments.shoppingLevel];
    const baselineWaste = SHOPPING_WASTE_KG[baselineShopping] || 150;
    const projectedWaste = SHOPPING_WASTE_KG[adjustments.shoppingLevel];
    wasteSavings = Math.max(0, baselineWaste - projectedWaste);
  }

  // --- 5. Flight Reductions ---
  let travel = baseline.travel ?? 0;
  let flightCostSavings = 0;
  if (adjustments.flightHoursPerYear !== null) {
    const hours = Math.max(0, adjustments.flightHoursPerYear);
    const flightEmissions = hours * FLIGHT_KG_PER_HOUR;
    const hotelPortion = (baseline.travel ?? 0) * 0.1; // Assume 10% baseline travel is hotel stays
    travel = flightEmissions + hotelPortion;

    // Financial
    const baselineHours = Math.max(hours, 20); // Assume at least 20 hours baseline
    flightCostSavings = Math.max(0, (baselineHours - hours) * FLIGHT_COST_PER_HOUR);
  }

  // Clamp category projections to avoid negative emissions
  transport = Math.max(0, Math.round(transport));
  diet = Math.max(0, Math.round(diet));
  energy = Math.max(0, Math.round(energy));
  shopping = Math.max(0, Math.round(shopping));
  travel = Math.max(0, Math.round(travel));

  const total = transport + diet + energy + shopping + travel;

  // Recompute metrics
  const comparedToAverage = Math.round((total / GLOBAL_AVERAGE_KG) * 100) / 100;
  const k = 0.0006;
  const percentile = Math.round(100 / (1 + Math.exp(-k * (total - GLOBAL_AVERAGE_KG))));

  const projected: FootprintBreakdown = {
    transport,
    diet,
    energy,
    shopping,
    travel,
    total,
    comparedToAverage,
    percentile,
  };

  // Carbon Savings (must be non-negative)
  const carbonSavings = Math.max(0, baseline.total - total);

  // Financial Savings
  const carCostSavings = Math.max(0, transportCostBaseline - transportCostProjected);
  const costSavings = carCostSavings + energyCostSavings + flightCostSavings;

  // Calculate Impact Score (0–100)
  const carbonSavingsPct = baseline.total > 0 ? carbonSavings / baseline.total : 0;
  const carbonPoints = carbonSavingsPct * 50; // max 50 points
  const costPoints = Math.min(30, (costSavings / 2000) * 30); // max 30 points (based on $2000 ceiling)
  const sustainabilityPoints =
    (renewableEnergyPct / 100) * 15 +
    (adjustments.shoppingLevel === 'low' ? 5 : adjustments.shoppingLevel === 'medium' ? 3 : 0); // max 20 points

  const impactScore = Math.max(0, Math.min(100, Math.round(carbonPoints + costPoints + sustainabilityPoints)));

  // Tiers
  let tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' = 'Bronze';
  if (impactScore > 75) {
    tier = 'Platinum';
  } else if (impactScore > 50) {
    tier = 'Gold';
  } else if (impactScore > 25) {
    tier = 'Silver';
  }

  return {
    projected,
    carbonSavings,
    costSavings,
    waterSavings,
    energySavings,
    wasteSavings,
    impactScore,
    tier,
  };
}

/**
 * Projects a month-by-month linear transition forecast between start and end breakdowns.
 * Clamps emissions at each month index to prevent negative forecasts.
 */
export function projectForecast(
  start: FootprintBreakdown,
  end: FootprintBreakdown,
  months: number = 12
): MonthlyProjection[] {
  const projections: MonthlyProjection[] = [];
  const safeMonths = Math.max(1, Math.round(months));

  for (let i = 0; i <= safeMonths; i++) {
    const t = i / safeMonths;

    const transport = Math.max(0, Math.round(start.transport + (end.transport - start.transport) * t));
    const diet = Math.max(0, Math.round(start.diet + (end.diet - start.diet) * t));
    const energy = Math.max(0, Math.round(start.energy + (end.energy - start.energy) * t));
    const shopping = Math.max(0, Math.round(start.shopping + (end.shopping - start.shopping) * t));
    const travel = Math.max(0, Math.round((start.travel ?? 0) + ((end.travel ?? 0) - (start.travel ?? 0)) * t));
    const total = transport + diet + energy + shopping + travel;

    projections.push({
      month: i === 0 ? 'Now' : `Month ${i}`,
      monthIndex: i,
      total,
      transport,
      diet,
      energy,
      shopping,
      travel,
    });
  }

  return projections;
}
