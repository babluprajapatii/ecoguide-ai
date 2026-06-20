/**
 * Carbon Footprint Calculator Service
 *
 * Pure-function service that computes annual CO2 emissions (in kg)
 * across transport, energy, diet, shopping, and travel categories.
 *
 * All emission factors are sourced from EPA/IPCC published data.
 * Functions are stateless with zero side effects — safe to call
 * from any context (server, client, worker, test).
 *
 * @module carbon-calculator.service
 */

import type {
  AssessmentInput,
  DietInput,
  EnergyInput,
  FootprintBreakdown,
  FuelType,
  ShoppingInput,
  ShoppingLevel,
  TransportInput,
  TravelInput,
} from '@/features/assessment/types/assessment.types';

// ---------------------------------------------------------------------------
// Constants — Emission Factors
// ---------------------------------------------------------------------------

const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;

/** Car CO2 emission factors in kg CO2 per kilometer. */
const CAR_FACTORS: Readonly<Record<FuelType, number>> = {
  petrol: 0.21,
  diesel: 0.17,
  electric: 0.05,
  hybrid: 0.11,
  none: 0,
} as const;

/** Public transport hourly emissions in kg CO2 (bus/train average). */
const PUBLIC_TRANSPORT_FACTOR_PER_HOUR = 0.8;

/** Ride sharing emission factor in kg CO2 per km (shared passenger-km factor). */
const RIDESHARE_FACTOR_PER_KM = 0.12;

/** Default grid carbon intensity in kg CO2 per kWh. */
const DEFAULT_ELECTRICITY_FACTOR = 0.233;

/** Natural gas emission factor in kg CO2 per kWh. */
const NATURAL_GAS_FACTOR = 2.04;

/** Home size annual carbon impact factor per square foot (in kg CO2). */
const HOME_SIZE_ANNUAL_FACTOR = 0.5;

/** Annual diet CO2 emissions in kg by dietary pattern. */
const DIET_ANNUAL_KG: Readonly<Record<string, number>> = {
  vegan: 1500,
  vegetarian: 1700,
  mixed: 2500,
  'meat-heavy': 3300,
} as const;

/** Annual shopping emissions in kg CO2 by spending level. */
const SHOPPING_ANNUAL_KG: Readonly<Record<ShoppingLevel, number>> = {
  low: 500,
  medium: 1200,
  high: 2500,
} as const;

/** Flight emission factors per passenger-km. Short-haul has high take-off penalty. */
const FLIGHT_FACTORS = {
  shortHaul: 0.255, // Under 1500 km
  longHaul: 0.195, // 1500 km and above
} as const;

/** Hotel stay emission factor in kg CO2 per night. */
const HOTEL_STAY_FACTOR_PER_NIGHT = 20;

/** Baseline global average footprint (kg CO2/year) for comparison. */
const GLOBAL_AVERAGE_KG = 4700;

// ---------------------------------------------------------------------------
// Safety Guards
// ---------------------------------------------------------------------------

/**
 * Clamps emissions to a positive, finite float.
 * Prevents NaN, Infinity, and negative values.
 */
export function clampEmission(val: number): number {
  if (isNaN(val) || !isFinite(val)) return 0;
  return Math.max(0, val);
}

// ---------------------------------------------------------------------------
// Individual Category Calculators
// ---------------------------------------------------------------------------

/**
 * Calculates transport footprint.
 * Includes car, public transport, and ride sharing.
 */
export function calculateTransportFootprint(input: TransportInput): number {
  let carEmissions = 0;
  if (input.fuelType !== 'none') {
    const factor = CAR_FACTORS[input.fuelType] ?? 0;
    carEmissions = input.weeklyKm * factor * WEEKS_PER_YEAR;
  }

  const publicTransportEmissions =
    input.publicTransportWeeklyHours * PUBLIC_TRANSPORT_FACTOR_PER_HOUR * WEEKS_PER_YEAR;
  const rideShareEmissions = input.rideShareWeeklyKm * RIDESHARE_FACTOR_PER_KM * WEEKS_PER_YEAR;

  return clampEmission(
    Math.round((carEmissions + publicTransportEmissions + rideShareEmissions) * 100) / 100,
  );
}

/**
 * Calculates household energy footprint.
 * Account for renewable energy offset and household member sharing.
 */
export function calculateEnergyFootprint(input: EnergyInput): number {
  // Guard against division by zero
  const members = Math.max(1, input.householdMembers || 1);
  const renewFactor = Math.max(0, Math.min(100, input.renewableEnergyPercent || 0)) / 100;

  const gridFactor = DEFAULT_ELECTRICITY_FACTOR;

  // Electricity emissions with renewable reduction
  const rawElectricityAnnual = input.electricityKwhPerMonth * MONTHS_PER_YEAR * gridFactor;
  const electricityAnnual = rawElectricityAnnual * (1 - renewFactor);

  // Gas emissions
  const gasAnnual = input.gasKwhPerMonth * MONTHS_PER_YEAR * NATURAL_GAS_FACTOR;

  // Home size baseline emissions
  const homeSizeAnnual = input.homeSizeSqFt * HOME_SIZE_ANNUAL_FACTOR;

  // Shared energy emissions divided per household member
  const totalHouseholdEmissions = electricityAnnual + gasAnnual + homeSizeAnnual;
  const perCapitaEmissions = totalHouseholdEmissions / members;

  return clampEmission(Math.round(perCapitaEmissions * 100) / 100);
}

/**
 * Calculates diet footprint.
 */
export function calculateDietFootprint(input: DietInput): number {
  const score = DIET_ANNUAL_KG[input.dietType] ?? 2500;
  return clampEmission(score);
}

/**
 * Calculates shopping footprint.
 */
export function calculateShoppingFootprint(input: ShoppingInput): number {
  const score = SHOPPING_ANNUAL_KG[input.level] ?? 1200;
  return clampEmission(score);
}

/**
 * Calculates travel footprint.
 * Covers flights (short/long haul) and hotel stays.
 *
 * Future Extensibility Notes:
 * - Distance-based airport code lookup mapping.
 * - Regional grid intensity variance for hotels.
 * - Seat-class multipliers (business, first class penalties).
 */
export function calculateTravelFootprint(input: TravelInput): number {
  const flightDistanceThreshold = 1500;
  const flightFactor =
    input.avgDistanceKm < flightDistanceThreshold
      ? FLIGHT_FACTORS.shortHaul
      : FLIGHT_FACTORS.longHaul;

  const flightEmissions = input.flightsPerYear * input.avgDistanceKm * flightFactor;
  const hotelEmissions = input.hotelStaysPerYear * HOTEL_STAY_FACTOR_PER_NIGHT;

  return clampEmission(Math.round((flightEmissions + hotelEmissions) * 100) / 100);
}

// ---------------------------------------------------------------------------
// Percentile Estimation
// ---------------------------------------------------------------------------

/**
 * Estimates a percentile ranking for the footprint.
 * Uses a logistic model centered on the global average (4700 kg).
 */
export function estimatePercentile(totalKg: number): number {
  if (totalKg <= 0) return 1;

  const k = 0.0004;
  const midpoint = GLOBAL_AVERAGE_KG;
  const percentile = 100 / (1 + Math.exp(-k * (totalKg - midpoint)));

  // Clamp percentile between 1 and 99 for a realistic rank representation
  return Math.round(Math.min(Math.max(percentile, 1), 99));
}

// ---------------------------------------------------------------------------
// Aggregate Calculator
// ---------------------------------------------------------------------------

/**
 * Calculates a complete carbon footprint breakdown.
 */
export function calculateTotalFootprint(inputs: AssessmentInput): FootprintBreakdown {
  const transport = calculateTransportFootprint(inputs.transport);
  const energy = calculateEnergyFootprint(inputs.energy);
  const diet = calculateDietFootprint(inputs.diet);
  const shopping = calculateShoppingFootprint(inputs.shopping);
  const travel = calculateTravelFootprint(inputs.travel);

  const total = clampEmission(
    Math.round((transport + energy + diet + shopping + travel) * 100) / 100,
  );
  const comparedToAverage = clampEmission(Math.round((total / GLOBAL_AVERAGE_KG) * 100) / 100);
  const percentile = estimatePercentile(total);

  return {
    transport,
    energy,
    diet,
    shopping,
    travel,
    total,
    comparedToAverage,
    percentile,
  };
}
