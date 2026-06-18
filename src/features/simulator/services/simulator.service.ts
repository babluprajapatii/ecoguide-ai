import { calculateSimulatedImpact, projectForecast as pf } from './simulation.service';
import type { FootprintBreakdown } from '@/features/assessment/types/assessment.types';
import type { SimulatorAdjustments } from '@/features/simulator/types/simulator.types';

/**
 * Adjusts a baseline footprint according to the simulator controls.
 * Re-routes to the centralized simulation engine.
 */
export function adjustFootprint(
  baseline: FootprintBreakdown,
  adjustments: SimulatorAdjustments,
): FootprintBreakdown {
  return calculateSimulatedImpact(baseline, adjustments).projected;
}

export const projectForecast = pf;
