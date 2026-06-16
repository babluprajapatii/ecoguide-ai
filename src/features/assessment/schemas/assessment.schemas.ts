import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enum Schemas
// ---------------------------------------------------------------------------

export const fuelTypeSchema = z.enum(['petrol', 'diesel', 'electric', 'hybrid', 'none']);

export const dietTypeSchema = z.enum(['vegan', 'vegetarian', 'mixed', 'meat-heavy']);

export const shoppingLevelSchema = z.enum(['low', 'medium', 'high']);

// ---------------------------------------------------------------------------
// Input Schemas
// ---------------------------------------------------------------------------

export const transportInputSchema = z.object({
  weeklyKm: z
    .number()
    .min(0, 'Weekly km must be non-negative')
    .max(10_000, 'Weekly km seems unrealistically high'),
  fuelType: fuelTypeSchema,
  publicTransportWeeklyHours: z
    .number()
    .min(0, 'Public transport hours must be non-negative')
    .max(168, 'Public transport hours cannot exceed hours in a week'),
  rideShareWeeklyKm: z
    .number()
    .min(0, 'Ride sharing km must be non-negative')
    .max(5_000, 'Ride sharing km seems unrealistically high'),
});

export const energyInputSchema = z.object({
  electricityKwhPerMonth: z
    .number()
    .min(0, 'Electricity usage must be non-negative')
    .max(50_000, 'Electricity usage seems unrealistically high'),
  gasKwhPerMonth: z
    .number()
    .min(0, 'Gas usage must be non-negative')
    .max(50_000, 'Gas usage seems unrealistically high'),
  renewableEnergyPercent: z
    .number()
    .min(0, 'Renewable energy percentage must be non-negative')
    .max(100, 'Renewable energy percentage cannot exceed 100%'),
  homeSizeSqFt: z
    .number()
    .min(0, 'Home size must be non-negative')
    .max(50_000, 'Home size seems unrealistically high'),
  householdMembers: z
    .number()
    .int('Household members must be a whole number')
    .min(1, 'Household members must be at least 1')
    .max(100, 'Household members seems unrealistically high'),
});

export const dietInputSchema = z.object({
  dietType: dietTypeSchema,
});

export const shoppingInputSchema = z.object({
  level: shoppingLevelSchema,
});

export const travelInputSchema = z.object({
  flightsPerYear: z
    .number()
    .int('Flights must be a whole number')
    .min(0, 'Flights must be non-negative')
    .max(200, 'Flights per year seems unrealistically high'),
  avgDistanceKm: z
    .number()
    .min(0, 'Average flight distance must be non-negative')
    .max(20_000, 'Average flight distance seems unrealistically high'),
  hotelStaysPerYear: z
    .number()
    .int('Hotel stays must be a whole number')
    .min(0, 'Hotel stays must be non-negative')
    .max(365, 'Hotel stays cannot exceed days in a year'),
});

export const assessmentInputSchema = z.object({
  transport: transportInputSchema,
  energy: energyInputSchema,
  diet: dietInputSchema,
  shopping: shoppingInputSchema,
  travel: travelInputSchema,
});

// ---------------------------------------------------------------------------
// Inferred Types (for schema-first validation flows)
// ---------------------------------------------------------------------------

export type TransportInputSchema = z.infer<typeof transportInputSchema>;
export type EnergyInputSchema = z.infer<typeof energyInputSchema>;
export type DietInputSchema = z.infer<typeof dietInputSchema>;
export type ShoppingInputSchema = z.infer<typeof shoppingInputSchema>;
export type TravelInputSchema = z.infer<typeof travelInputSchema>;
export type AssessmentInputSchema = z.infer<typeof assessmentInputSchema>;
