import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enum Schemas
// ---------------------------------------------------------------------------

export const fuelTypeSchema = z.enum(['petrol', 'diesel', 'electric', 'hybrid']);

export const flightTypeSchema = z.enum(['short-haul', 'long-haul']);

export const dietTypeSchema = z.enum(['vegan', 'vegetarian', 'mixed', 'meat-heavy']);

export const shoppingLevelSchema = z.enum(['low', 'medium', 'high']);

// ---------------------------------------------------------------------------
// Input Schemas
// ---------------------------------------------------------------------------

export const carInputSchema = z.object({
  weeklyKm: z
    .number()
    .min(0, 'Weekly km must be non-negative')
    .max(10_000, 'Weekly km seems unrealistically high'),
  fuelType: fuelTypeSchema,
});

export const flightInputSchema = z.object({
  flightsPerYear: z
    .number()
    .int('Flights must be a whole number')
    .min(0, 'Flights must be non-negative')
    .max(200, 'Flights per year seems unrealistically high'),
  avgDistanceKm: z
    .number()
    .min(0, 'Distance must be non-negative')
    .max(20_000, 'Distance per flight seems unrealistically high'),
  type: flightTypeSchema,
});

export const transportInputSchema = z.object({
  car: carInputSchema.optional(),
  flights: z.array(flightInputSchema).max(10, 'Too many flight entries'),
});

export const dietInputSchema = z.object({
  dietType: dietTypeSchema,
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
  electricityGridFactor: z
    .number()
    .min(0, 'Grid factor must be non-negative')
    .max(2, 'Grid factor seems unrealistically high')
    .optional(),
});

export const shoppingInputSchema = z.object({
  level: shoppingLevelSchema,
});

export const assessmentInputSchema = z.object({
  transport: transportInputSchema,
  diet: dietInputSchema,
  energy: energyInputSchema,
  shopping: shoppingInputSchema,
});

// ---------------------------------------------------------------------------
// Inferred Types (for schema-first validation flows)
// ---------------------------------------------------------------------------

export type CarInputSchema = z.infer<typeof carInputSchema>;
export type FlightInputSchema = z.infer<typeof flightInputSchema>;
export type TransportInputSchema = z.infer<typeof transportInputSchema>;
export type DietInputSchema = z.infer<typeof dietInputSchema>;
export type EnergyInputSchema = z.infer<typeof energyInputSchema>;
export type ShoppingInputSchema = z.infer<typeof shoppingInputSchema>;
export type AssessmentInputSchema = z.infer<typeof assessmentInputSchema>;
