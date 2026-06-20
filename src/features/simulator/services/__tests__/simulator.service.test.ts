import { describe, it, expect } from 'vitest';
import { adjustFootprint, projectForecast } from '../simulator.service';
import type { FootprintBreakdown } from '@/features/assessment/types/assessment.types';
import type { SimulatorAdjustments } from '@/features/simulator/types/simulator.types';
import { DEFAULT_ADJUSTMENTS } from '@/features/simulator/types/simulator.types';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const BASELINE: FootprintBreakdown = {
  transport: 2000,
  diet: 2000,
  energy: 1800,
  shopping: 1200,
  travel: 1000,
  total: 8000,
  comparedToAverage: 1.7,
  percentile: 60,
};

// ---------------------------------------------------------------------------
// adjustFootprint
// ---------------------------------------------------------------------------

describe('adjustFootprint', () => {
  it('should return baseline values when no adjustments are made', () => {
    const result = adjustFootprint(BASELINE, DEFAULT_ADJUSTMENTS);
    expect(result.diet).toBe(BASELINE.diet);
    expect(result.shopping).toBe(BASELINE.shopping);
    expect(result.travel).toBe(BASELINE.travel);
  });

  it('should adjust diet to vegan', () => {
    const adj: SimulatorAdjustments = { ...DEFAULT_ADJUSTMENTS, dietType: 'vegan' };
    const result = adjustFootprint(BASELINE, adj);
    expect(result.diet).toBe(1500);
    expect(result.total).toBeLessThan(BASELINE.total);
  });

  it('should adjust diet to vegetarian', () => {
    const adj: SimulatorAdjustments = { ...DEFAULT_ADJUSTMENTS, dietType: 'vegetarian' };
    const result = adjustFootprint(BASELINE, adj);
    expect(result.diet).toBe(1700);
  });

  it('should adjust diet to meat-heavy', () => {
    const adj: SimulatorAdjustments = { ...DEFAULT_ADJUSTMENTS, dietType: 'meat-heavy' };
    const result = adjustFootprint(BASELINE, adj);
    expect(result.diet).toBe(3300);
  });

  it('should adjust car km per week with petrol', () => {
    const adj: SimulatorAdjustments = {
      ...DEFAULT_ADJUSTMENTS,
      carKmPerWeek: 100,
      carFuelType: 'petrol',
    };
    const result = adjustFootprint(BASELINE, adj);
    // 100 km/wk * 52 weeks * 0.21 = 1092 + transit portion (20% of 2000 = 400) = 1492
    expect(result.transport).toBe(1492);
  });

  it('should adjust car to electric fuel type', () => {
    const adj: SimulatorAdjustments = {
      ...DEFAULT_ADJUSTMENTS,
      carKmPerWeek: 100,
      carFuelType: 'electric',
    };
    const result = adjustFootprint(BASELINE, adj);
    // 100 * 52 * 0.05 = 260 + 400 = 660
    expect(result.transport).toBeLessThan(BASELINE.transport);
  });

  it('should set flights to zero when flightHoursPerYear is 0', () => {
    const adj: SimulatorAdjustments = {
      ...DEFAULT_ADJUSTMENTS,
      flightHoursPerYear: 0,
    };
    const result = adjustFootprint(BASELINE, adj);
    // only hotel stays remain (estimated as 10% of baseline travel = 100)
    expect(result.travel).toBe(100);
  });

  it('should reduce energy with 100% renewable', () => {
    const adj: SimulatorAdjustments = {
      ...DEFAULT_ADJUSTMENTS,
      renewableEnergyPercent: 100,
    };
    const result = adjustFootprint(BASELINE, adj);
    // Only gas portion remains (40% of 1800 = 720)
    expect(result.energy).toBe(720);
  });

  it('should reduce energy with 50% renewable', () => {
    const adj: SimulatorAdjustments = {
      ...DEFAULT_ADJUSTMENTS,
      renewableEnergyPercent: 50,
    };
    const result = adjustFootprint(BASELINE, adj);
    // 60% * 1800 * 0.5 + 40% * 1800 = 540 + 720 = 1260
    expect(result.energy).toBe(1260);
  });

  it('should adjust shopping to low', () => {
    const adj: SimulatorAdjustments = { ...DEFAULT_ADJUSTMENTS, shoppingLevel: 'low' };
    const result = adjustFootprint(BASELINE, adj);
    expect(result.shopping).toBe(500);
  });

  it('should recalculate total from adjusted categories', () => {
    const adj: SimulatorAdjustments = {
      ...DEFAULT_ADJUSTMENTS,
      dietType: 'vegan',
      shoppingLevel: 'low',
      renewableEnergyPercent: 100,
    };
    const result = adjustFootprint(BASELINE, adj);
    expect(result.total).toBe(
      result.transport + result.diet + result.energy + result.shopping + result.travel,
    );
  });

  it('should recalculate comparedToAverage', () => {
    const adj: SimulatorAdjustments = { ...DEFAULT_ADJUSTMENTS, dietType: 'vegan' };
    const result = adjustFootprint(BASELINE, adj);
    expect(result.comparedToAverage).toBeCloseTo(result.total / 4700, 1);
  });

  it('should never produce negative category values', () => {
    const adj: SimulatorAdjustments = {
      ...DEFAULT_ADJUSTMENTS,
      carKmPerWeek: 0,
      carFuelType: 'electric',
      flightHoursPerYear: 0,
      dietType: 'vegan',
      renewableEnergyPercent: 100,
      shoppingLevel: 'low',
    };
    const result = adjustFootprint(BASELINE, adj);
    expect(result.transport).toBeGreaterThanOrEqual(0);
    expect(result.diet).toBeGreaterThanOrEqual(0);
    expect(result.energy).toBeGreaterThanOrEqual(0);
    expect(result.shopping).toBeGreaterThanOrEqual(0);
    expect(result.travel).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  it('should produce integer values for all categories', () => {
    const adj: SimulatorAdjustments = {
      ...DEFAULT_ADJUSTMENTS,
      carKmPerWeek: 73,
      carFuelType: 'hybrid',
      renewableEnergyPercent: 37,
    };
    const result = adjustFootprint(BASELINE, adj);
    expect(Number.isInteger(result.transport)).toBe(true);
    expect(Number.isInteger(result.diet)).toBe(true);
    expect(Number.isInteger(result.energy)).toBe(true);
    expect(Number.isInteger(result.shopping)).toBe(true);
    expect(Number.isInteger(result.travel)).toBe(true);
    expect(Number.isInteger(result.total)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// projectForecast
// ---------------------------------------------------------------------------

describe('projectForecast', () => {
  const TARGET: FootprintBreakdown = {
    transport: 1000,
    diet: 1500,
    energy: 800,
    shopping: 500,
    travel: 500,
    total: 4300,
    comparedToAverage: 0.91,
    percentile: 42,
  };

  it('should return months + 1 data points (including month 0)', () => {
    const result = projectForecast(BASELINE, TARGET, 12);
    expect(result).toHaveLength(13);
  });

  it('should start with baseline values at month 0', () => {
    const result = projectForecast(BASELINE, TARGET, 12);
    const first = result[0];
    expect(first).toBeDefined();
    expect(first!.total).toBe(BASELINE.total);
    expect(first!.transport).toBe(BASELINE.transport);
    expect(first!.diet).toBe(BASELINE.diet);
    expect(first!.energy).toBe(BASELINE.energy);
    expect(first!.shopping).toBe(BASELINE.shopping);
    expect(first!.travel).toBe(BASELINE.travel);
    expect(first!.month).toBe('Now');
  });

  it('should end with target values at the final month', () => {
    const result = projectForecast(BASELINE, TARGET, 12);
    const last = result[result.length - 1];
    expect(last).toBeDefined();
    expect(last!.total).toBe(TARGET.total);
    expect(last!.transport).toBe(TARGET.transport);
    expect(last!.diet).toBe(TARGET.diet);
    expect(last!.energy).toBe(TARGET.energy);
    expect(last!.shopping).toBe(TARGET.shopping);
    expect(last!.travel).toBe(TARGET.travel);
  });

  it('should maintain total = sum of categories for every month', () => {
    const result = projectForecast(BASELINE, TARGET, 12);
    for (const point of result) {
      expect(point.total).toBe(
        point.transport + point.diet + point.energy + point.shopping + point.travel,
      );
    }
  });
});
