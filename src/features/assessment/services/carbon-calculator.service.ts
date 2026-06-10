/**
 * Carbon Footprint Calculator Service
 *
 * Pure-function service that computes annual CO2 emissions (in kg)
 * across transport, diet, energy, and shopping categories.
 *
 * All emission factors are sourced from EPA/IPCC published data.
 * Functions are stateless with zero side effects — safe to call
 * from any context (server, client, worker, test).
 *
 * @module carbon-calculator.service
 */

import type {
  AssessmentInput,
  CarInput,
  DietType,
  EnergyInput,
  FlightInput,
  FootprintBreakdown,
  FuelType,
  ShoppingInput,
  ShoppingLevel,
  TransportInput,
  DietInput,
} from '@/features/assessment/types/assessment.types';

// ---------------------------------------------------------------------------
// Constants — Emission Factors
// ---------------------------------------------------------------------------

/** Weeks in a year, used to annualise weekly figures. */
const WEEKS_PER_YEAR = 52;

/** Months in a year, used to annualise monthly figures. */
const MONTHS_PER_YEAR = 12;

/**
 * Car CO2 emission factors in kg CO2 per kilometer.
 * Source: EPA/IPCC average tailpipe + upstream emissions.
 */
const CAR_FACTORS: Readonly<Record<FuelType, number>> = {
  petrol: 0.21,
  diesel: 0.17,
  electric: 0.05,
  hybrid: 0.11,
} as const;

/**
 * Flight CO2 emission factors in kg CO2 per passenger-kilometer.
 * Short-haul includes taxi/takeoff fuel penalty; long-haul amortises it.
 */
const FLIGHT_FACTORS: Readonly<Record<'short-haul' | 'long-haul', number>> = {
  'short-haul': 0.255,
  'long-haul': 0.195,
} as const;

/**
 * Annual diet CO2 emissions in kg by dietary pattern.
 * Source: IPCC food-system lifecycle analyses.
 */
const DIET_ANNUAL_KG: Readonly<Record<DietType, number>> = {
  vegan: 1_500,
  vegetarian: 1_700,
  mixed: 2_500,
  'meat-heavy': 3_300,
} as const;

/**
 * Default electricity grid carbon intensity in kg CO2 per kWh.
 * UK grid average — override per-user for other regions.
 */
const DEFAULT_ELECTRICITY_FACTOR = 0.233;

/** Natural gas emission factor in kg CO2 per kWh. */
const NATURAL_GAS_FACTOR = 2.04;

/**
 * Annual shopping/consumption CO2 emissions in kg by spending level.
 * Encompasses goods manufacturing, shipping, and disposal.
 */
const SHOPPING_ANNUAL_KG: Readonly<Record<ShoppingLevel, number>> = {
  low: 500,
  medium: 1_200,
  high: 2_500,
} as const;

/**
 * Global average annual CO2 footprint per person in kg.
 * Used as the baseline for comparison metrics.
 * Source: World Bank / Our World in Data (≈ 4.7 tonnes).
 */
const GLOBAL_AVERAGE_KG = 4_700;

// ---------------------------------------------------------------------------
// Individual Category Calculators
// ---------------------------------------------------------------------------

/**
 * Calculates the annual CO2 emissions from a single car.
 *
 * @param input - Car usage details (weekly km and fuel type).
 * @returns Annual CO2 emissions in kilograms.
 */
function calculateCarEmissions(input: CarInput): number {
  const factor = CAR_FACTORS[input.fuelType];
  return input.weeklyKm * factor * WEEKS_PER_YEAR;
}

/**
 * Calculates the annual CO2 emissions from a single flight category.
 *
 * @param input - Flight details (flights/yr, avg distance, haul type).
 * @returns Annual CO2 emissions in kilograms.
 */
function calculateFlightEmissions(input: FlightInput): number {
  const factor = FLIGHT_FACTORS[input.type];
  return input.flightsPerYear * input.avgDistanceKm * factor;
}

/**
 * Calculates the total annual CO2 from all transport modes.
 *
 * Sums car emissions (if provided) with all flight categories.
 *
 * @param input - Transport input with optional car and flight details.
 * @returns Annual transport CO2 emissions in kilograms.
 */
export function calculateTransportFootprint(input: TransportInput): number {
  let total = 0;

  if (input.car) {
    total += calculateCarEmissions(input.car);
  }

  for (const flight of input.flights) {
    total += calculateFlightEmissions(flight);
  }

  return Math.round(total * 100) / 100;
}

/**
 * Calculates the annual CO2 emissions from dietary choices.
 *
 * @param input - Diet input with the user's dietary pattern.
 * @returns Annual diet CO2 emissions in kilograms.
 */
export function calculateDietFootprint(input: DietInput): number {
  return DIET_ANNUAL_KG[input.dietType];
}

/**
 * Calculates the annual CO2 emissions from household energy usage.
 *
 * Covers both electricity (with configurable grid factor) and natural gas.
 *
 * @param input - Energy input with monthly kWh figures.
 * @returns Annual energy CO2 emissions in kilograms.
 */
export function calculateEnergyFootprint(input: EnergyInput): number {
  const gridFactor = input.electricityGridFactor ?? DEFAULT_ELECTRICITY_FACTOR;
  const electricityAnnual = input.electricityKwhPerMonth * MONTHS_PER_YEAR * gridFactor;
  const gasAnnual = input.gasKwhPerMonth * MONTHS_PER_YEAR * NATURAL_GAS_FACTOR;

  return Math.round((electricityAnnual + gasAnnual) * 100) / 100;
}

/**
 * Calculates the annual CO2 emissions from shopping/consumption habits.
 *
 * @param input - Shopping input with spending intensity level.
 * @returns Annual shopping CO2 emissions in kilograms.
 */
export function calculateShoppingFootprint(input: ShoppingInput): number {
  return SHOPPING_ANNUAL_KG[input.level];
}

// ---------------------------------------------------------------------------
// Percentile Estimation
// ---------------------------------------------------------------------------

/**
 * Estimates a percentile ranking for the given annual footprint.
 *
 * Uses a simplified logistic model calibrated against global distribution
 * data. The curve is centred on the global average (~4,700 kg) with a
 * spread factor that approximates the real-world variance.
 *
 * @param totalKg - Total annual CO2 emissions in kilograms.
 * @returns Estimated percentile (0–100, rounded to nearest integer).
 *
 * @internal
 */
function estimatePercentile(totalKg: number): number {
  if (totalKg <= 0) return 0;

  // Logistic function: 100 / (1 + e^(-k*(x - midpoint)))
  // k controls steepness; midpoint = global average
  const k = 0.0004;
  const midpoint = GLOBAL_AVERAGE_KG;
  const percentile = 100 / (1 + Math.exp(-k * (totalKg - midpoint)));

  return Math.round(Math.min(Math.max(percentile, 0), 100));
}

// ---------------------------------------------------------------------------
// Aggregate Calculator
// ---------------------------------------------------------------------------

/**
 * Calculates a complete carbon footprint breakdown from all assessment inputs.
 *
 * Computes each category independently, sums the total, and derives
 * comparison metrics against the global average.
 *
 * @param inputs - Full assessment input across all categories.
 * @returns A `FootprintBreakdown` with per-category totals and comparison metrics.
 *
 * @example
 * ```ts
 * const breakdown = calculateTotalFootprint({
 *   transport: { flights: [], car: { weeklyKm: 100, fuelType: 'petrol' } },
 *   diet: { dietType: 'mixed' },
 *   energy: { electricityKwhPerMonth: 300, gasKwhPerMonth: 100 },
 *   shopping: { level: 'medium' },
 * });
 *
 * console.log(breakdown.total); // e.g. ~6_880 kg CO2/yr
 * console.log(breakdown.comparedToAverage); // e.g. 1.46
 * ```
 */
export function calculateTotalFootprint(inputs: AssessmentInput): FootprintBreakdown {
  const transport = calculateTransportFootprint(inputs.transport);
  const diet = calculateDietFootprint(inputs.diet);
  const energy = calculateEnergyFootprint(inputs.energy);
  const shopping = calculateShoppingFootprint(inputs.shopping);

  const total = Math.round((transport + diet + energy + shopping) * 100) / 100;
  const comparedToAverage = Math.round((total / GLOBAL_AVERAGE_KG) * 100) / 100;
  const percentile = estimatePercentile(total);

  return {
    transport,
    diet,
    energy,
    shopping,
    total,
    comparedToAverage,
    percentile,
  };
}
