import { z } from 'zod';

export const fuelTypeSchema = z.enum(['petrol', 'diesel', 'hybrid', 'electric']);
export const dietTypeSchema = z.enum(['vegan', 'vegetarian', 'mixed', 'meat-heavy']);
export const shoppingLevelSchema = z.enum(['low', 'medium', 'high']);

export const simulatorAdjustmentsSchema = z.object({
  carKmPerWeek: z.number().min(0).max(1000).nullable(),
  carFuelType: fuelTypeSchema.nullable(),
  dietType: dietTypeSchema.nullable(),
  renewableEnergyPercent: z.number().min(0).max(100),
  flightHoursPerYear: z.number().min(0).max(200).nullable(),
  shoppingLevel: shoppingLevelSchema.nullable(),
});

export const createSimulationSchema = z.object({
  scenario_name: z.string().min(1, 'Scenario name cannot be empty.').max(100, 'Scenario name is too long.'),
  scenario_type: z.enum(['ev', 'solar', 'diet', 'flights', 'shopping', 'custom']),
  configuration: simulatorAdjustmentsSchema,
  estimated_carbon_savings: z.number().nonnegative(),
  estimated_cost_savings: z.number(),
  estimated_water_savings: z.number().nonnegative().optional(),
  estimated_energy_savings: z.number().nonnegative().optional(),
  impact_score: z.number().int().min(0).max(100),
  is_favorite: z.boolean().optional(),
  comparison_group_id: z.string().uuid().nullable().optional(),
});

export const updateSimulationSchema = z.object({
  id: z.string().uuid(),
  scenario_name: z.string().min(1).max(100).optional(),
  is_favorite: z.boolean().optional(),
  comparison_group_id: z.string().uuid().nullable().optional(),
});

export type SimulatorAdjustmentsType = z.infer<typeof simulatorAdjustmentsSchema>;
export type CreateSimulationType = z.infer<typeof createSimulationSchema>;
export type UpdateSimulationType = z.infer<typeof updateSimulationSchema>;
