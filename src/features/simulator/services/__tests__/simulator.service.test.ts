import { describe, it, expect } from 'vitest';
import { adjustFootprint, projectForecast } from '../simulator.service';
import type { FootprintBreakdown } from '@/features/assessment/types/assessment.types';
import type { SimulatorAdjustments } from '@/features/simulator/types/simulator.types';
import { DEFAULT_ADJUSTMENTS } from '@/features/simulator/types/simulator.types';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const BASELINE: FootprintBreakdown = {
  transport: 3000,
  diet: 2500,
  energy: 2000,
  shopping: 1200,
  total: 8700,
  comparedToAverage: 1.85,
  percentile: 65,
};

const LOW_BASELINE: FootprintBreakdown = {
  transport: 500,
  diet: 1500,
  energy: 800,
  shopping: 500,
  total: 3300,
  comparedToAverage: 0.7,
  percentile: 30,
};

// ---------------------------------------------------------------------------
// adjustFootprint
// ---------------------------------------------------------------------------

describe('adjustFootprint', () => {
  it('should return baseline values when no adjustments are made', () => {
    const result = adjustFootprint(BASELINE, DEFAULT_ADJUSTMENTS);
    expect(result.diet).toBe(BASELINE.diet);
    expect(result.shopping).toBe(BASELINE.shopping);
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
    // 100 km/wk * 52 weeks * 0.21 = 1092 + flight portion
    expect(result.transport).toBeGreaterThan(1000);
  });

  it('should adjust car to electric fuel type', () => {
    const adj: SimulatorAdjustments = {
      ...DEFAULT_ADJUSTMENTS,
      carKmPerWeek: 100,
      carFuelType: 'electric',
    };
    const result = adjustFootprint(BASELINE, adj);
    // 100 * 52 * 0.05 = 260 + flight portion
    expect(result.transport).toBeLessThan(BASELINE.transport);
  });

  it('should adjust car to diesel fuel type', () => {
    const adj: SimulatorAdjustments = {
      ...DEFAULT_ADJUSTMENTS,
      carKmPerWeek: 100,
      carFuelType: 'diesel',
    };
    const result = adjustFootprint(BASELINE, adj);
    expect(result.transport).toBeGreaterThan(0);
  });

  it('should adjust car to hybrid fuel type', () => {
    const adj: SimulatorAdjustments = {
      ...DEFAULT_ADJUSTMENTS,
      carKmPerWeek: 100,
      carFuelType: 'hybrid',
    };
    const result = adjustFootprint(BASELINE, adj);
    expect(result.transport).toBeGreaterThan(0);
  });

  it('should handle zero car km per week', () => {
    const adj: SimulatorAdjustments = {
      ...DEFAULT_ADJUSTMENTS,
      carKmPerWeek: 0,
      carFuelType: 'petrol',
    };
    const result = adjustFootprint(BASELINE, adj);
    // Only flight portion remains
    expect(result.transport).toBeLessThan(BASELINE.transport);
  });

  it('should set flights to zero when flightHoursPerYear is 0', () => {
    const adj: SimulatorAdjustments = {
      ...DEFAULT_ADJUSTMENTS,
      flightHoursPerYear: 0,
    };
    const result = adjustFootprint(BASELINE, adj);
    expect(result.transport).toBeLessThan(BASELINE.transport);
  });

  it('should handle flight hours with no car adjustments', () => {
    const adj: SimulatorAdjustments = {
      ...DEFAULT_ADJUSTMENTS,
      flightHoursPerYear: 10,
    };
    const result = adjustFootprint(BASELINE, adj);
    expect(result.transport).toBeGreaterThan(0);
    expect(typeof result.transport).toBe('number');
  });

  it('should handle both car and flight adjustments together', () => {
    const adj: SimulatorAdjustments = {
      ...DEFAULT_ADJUSTMENTS,
      carKmPerWeek: 50,
      carFuelType: 'electric',
      flightHoursPerYear: 0,
    };
    const result = adjustFootprint(BASELINE, adj);
    // 50 * 52 * 0.05 = 130 + 0 flights = 130
    expect(result.transport).toBe(130);
  });

  it('should reduce energy with 100% renewable', () => {
    const adj: SimulatorAdjustments = {
      ...DEFAULT_ADJUSTMENTS,
      renewableEnergyPercent: 100,
    };
    const result = adjustFootprint(BASELINE, adj);
    // Only gas portion remains (40% of 2000 = 800)
    expect(result.energy).toBe(800);
  });

  it('should reduce energy with 50% renewable', () => {
    const adj: SimulatorAdjustments = {
      ...DEFAULT_ADJUSTMENTS,
      renewableEnergyPercent: 50,
    };
    const result = adjustFootprint(BASELINE, adj);
    // 60% * 2000 * 0.5 + 40% * 2000 = 600 + 800 = 1400
    expect(result.energy).toBe(1400);
  });

  it('should not change energy with 0% renewable', () => {
    const adj: SimulatorAdjustments = {
      ...DEFAULT_ADJUSTMENTS,
      renewableEnergyPercent: 0,
    };
    const result = adjustFootprint(BASELINE, adj);
    expect(result.energy).toBe(BASELINE.energy);
  });

  it('should adjust shopping to low', () => {
    const adj: SimulatorAdjustments = { ...DEFAULT_ADJUSTMENTS, shoppingLevel: 'low' };
    const result = adjustFootprint(BASELINE, adj);
    expect(result.shopping).toBe(500);
  });

  it('should adjust shopping to medium', () => {
    const adj: SimulatorAdjustments = { ...DEFAULT_ADJUSTMENTS, shoppingLevel: 'medium' };
    const result = adjustFootprint(BASELINE, adj);
    expect(result.shopping).toBe(1200);
  });

  it('should adjust shopping to high', () => {
    const adj: SimulatorAdjustments = { ...DEFAULT_ADJUSTMENTS, shoppingLevel: 'high' };
    const result = adjustFootprint(BASELINE, adj);
    expect(result.shopping).toBe(2500);
  });

  it('should recalculate total from adjusted categories', () => {
    const adj: SimulatorAdjustments = {
      ...DEFAULT_ADJUSTMENTS,
      dietType: 'vegan',
      shoppingLevel: 'low',
      renewableEnergyPercent: 100,
    };
    const result = adjustFootprint(BASELINE, adj);
    expect(result.total).toBe(result.transport + result.diet + result.energy + result.shopping);
  });

  it('should recalculate comparedToAverage', () => {
    const adj: SimulatorAdjustments = { ...DEFAULT_ADJUSTMENTS, dietType: 'vegan' };
    const result = adjustFootprint(BASELINE, adj);
    // comparedToAverage = total / 4700
    expect(result.comparedToAverage).toBeCloseTo(result.total / 4700, 1);
  });

  it('should recalculate percentile', () => {
    const result = adjustFootprint(BASELINE, DEFAULT_ADJUSTMENTS);
    expect(result.percentile).toBeGreaterThanOrEqual(0);
    expect(result.percentile).toBeLessThanOrEqual(100);
  });

  it('should produce lower percentile for lower emissions', () => {
    const low = adjustFootprint(LOW_BASELINE, { ...DEFAULT_ADJUSTMENTS, dietType: 'vegan' });
    const high = adjustFootprint(BASELINE, { ...DEFAULT_ADJUSTMENTS, dietType: 'meat-heavy' });
    expect(low.percentile).toBeLessThan(high.percentile);
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
    expect(Number.isInteger(result.total)).toBe(true);
  });

  it('should apply multiple adjustments simultaneously', () => {
    const adj: SimulatorAdjustments = {
      carKmPerWeek: 30,
      carFuelType: 'electric',
      dietType: 'vegan',
      renewableEnergyPercent: 80,
      flightHoursPerYear: 2,
      shoppingLevel: 'low',
    };
    const result = adjustFootprint(BASELINE, adj);
    expect(result.total).toBeLessThan(BASELINE.total);
    expect(result.diet).toBe(1500);
    expect(result.shopping).toBe(500);
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
    total: 3800,
    comparedToAverage: 0.81,
    percentile: 38,
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
  });

  it('should produce monotonically decreasing totals when target < baseline', () => {
    const result = projectForecast(BASELINE, TARGET, 12);
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1];
      const curr = result[i];
      expect(prev).toBeDefined();
      expect(curr).toBeDefined();
      expect(curr!.total).toBeLessThanOrEqual(prev!.total);
    }
  });

  it('should produce monotonically increasing totals when target > baseline', () => {
    const result = projectForecast(TARGET, BASELINE, 12);
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1];
      const curr = result[i];
      expect(prev).toBeDefined();
      expect(curr).toBeDefined();
      expect(curr!.total).toBeGreaterThanOrEqual(prev!.total);
    }
  });

  it('should produce flat line when start equals end', () => {
    const result = projectForecast(BASELINE, BASELINE, 12);
    for (const point of result) {
      expect(point.total).toBe(BASELINE.total);
    }
  });

  it('should label months correctly', () => {
    const result = projectForecast(BASELINE, TARGET, 6);
    expect(result[0]!.month).toBe('Now');
    expect(result[1]!.month).toBe('Month 1');
    expect(result[6]!.month).toBe('Month 6');
  });

  it('should set monthIndex correctly', () => {
    const result = projectForecast(BASELINE, TARGET, 3);
    expect(result.map((p) => p.monthIndex)).toEqual([0, 1, 2, 3]);
  });

  it('should handle months = 1', () => {
    const result = projectForecast(BASELINE, TARGET, 1);
    expect(result).toHaveLength(2);
    expect(result[0]!.total).toBe(BASELINE.total);
    expect(result[1]!.total).toBe(TARGET.total);
  });

  it('should produce all integer values', () => {
    const result = projectForecast(BASELINE, TARGET, 12);
    for (const point of result) {
      expect(Number.isInteger(point.transport)).toBe(true);
      expect(Number.isInteger(point.diet)).toBe(true);
      expect(Number.isInteger(point.energy)).toBe(true);
      expect(Number.isInteger(point.shopping)).toBe(true);
    }
  });

  it('should maintain total = sum of categories for every month', () => {
    const result = projectForecast(BASELINE, TARGET, 12);
    for (const point of result) {
      expect(point.total).toBe(
        point.transport + point.diet + point.energy + point.shopping,
      );
    }
  });

  it('should produce correct midpoint at month 6 of 12', () => {
    const result = projectForecast(BASELINE, TARGET, 12);
    const mid = result[6];
    expect(mid).toBeDefined();
    // Linear midpoint for transport: (3000 + 1000) / 2 = 2000
    expect(mid!.transport).toBe(2000);
    // Linear midpoint for diet: (2500 + 1500) / 2 = 2000
    expect(mid!.diet).toBe(2000);
  });

  it('should handle negative months gracefully (clamp to 1)', () => {
    const result = projectForecast(BASELINE, TARGET, -5);
    expect(result).toHaveLength(2);
  });
});
