import { describe, it, expect } from 'vitest';
import { calculateSimulatedImpact, projectForecast } from '../simulation.service';
import type { FootprintBreakdown } from '@/features/assessment/types/assessment.types';
import type { SimulatorAdjustments } from '@/features/simulator/types/simulator.types';

const BASELINE: FootprintBreakdown = {
  transport: 2000,
  diet: 2500,
  energy: 1800,
  shopping: 1200,
  travel: 1000,
  total: 8500,
  comparedToAverage: 1.8,
  percentile: 65,
};

const DEFAULT_ADJUSTMENTS: SimulatorAdjustments = {
  carKmPerWeek: null,
  carFuelType: null,
  dietType: null,
  renewableEnergyPercent: 0,
  shoppingLevel: null,
  flightHoursPerYear: null,
};

describe('simulation.service core logic', () => {
  describe('calculateSimulatedImpact', () => {
    it('returns baseline values and 0 savings when no adjustments are made', () => {
      const result = calculateSimulatedImpact(BASELINE, DEFAULT_ADJUSTMENTS, 'mixed', 'medium');
      expect(result.projected.transport).toBe(BASELINE.transport);
      expect(result.projected.diet).toBe(BASELINE.diet);
      expect(result.projected.energy).toBe(BASELINE.energy);
      expect(result.projected.shopping).toBe(BASELINE.shopping);
      expect(result.projected.travel).toBe(BASELINE.travel);
      expect(result.projected.total).toBe(BASELINE.total);
      expect(result.carbonSavings).toBe(0);
      expect(result.costSavings).toBe(0);
      expect(result.waterSavings).toBe(0);
      expect(result.energySavings).toBe(0);
      expect(result.wasteSavings).toBe(0);
    });

    it('calculates EV adoption and cost savings correctly', () => {
      const adjustments: SimulatorAdjustments = {
        ...DEFAULT_ADJUSTMENTS,
        carKmPerWeek: 200,
        carFuelType: 'petrol',
      };
      const result = calculateSimulatedImpact(BASELINE, adjustments, 'mixed', 'medium');
      // 200 * 52 * 0.21 = 2184 + 0.2 * 2000 (400 public transit portion) = 2584
      expect(result.projected.transport).toBe(2584);
      // Cost savings: transportCostBaseline (200 * 52 * 0.15 = 1560) vs transportCostProjected (200 * 52 * 0.15 = 1560) = 0 savings
      expect(result.costSavings).toBe(0);
    });

    it('models EV and solar synergy: charging emissions are reduced', () => {
      const adjustmentsClean: SimulatorAdjustments = {
        ...DEFAULT_ADJUSTMENTS,
        carKmPerWeek: 200,
        carFuelType: 'electric',
        renewableEnergyPercent: 100, // 100% solar
      };
      const resultClean = calculateSimulatedImpact(BASELINE, adjustmentsClean, 'mixed', 'medium');

      const adjustmentsGrid: SimulatorAdjustments = {
        ...DEFAULT_ADJUSTMENTS,
        carKmPerWeek: 200,
        carFuelType: 'electric',
        renewableEnergyPercent: 0, // 0% solar
      };
      const resultGrid = calculateSimulatedImpact(BASELINE, adjustmentsGrid, 'mixed', 'medium');

      // Electric car factor: 0.05
      // Grid charging: 200 * 52 * 0.05 = 520 + 400 = 920 kg
      expect(resultGrid.projected.transport).toBe(920);

      // Clean charging (100% solar): solarReduction = 0.8 * 1.0 = 0.8.
      // carFactor = 0.05 * (1 - 0.8) = 0.01.
      // 200 * 52 * 0.01 = 104 + 400 = 504 kg
      expect(resultClean.projected.transport).toBe(504);
      expect(resultClean.projected.transport).toBeLessThan(resultGrid.projected.transport);

      // Electric cost savings: baseline fuel petrol (1560) vs electric (200 * 52 * 0.03 = 312) = 1248 savings
      // Plus 0% solar energy savings = 1248
      expect(resultGrid.costSavings).toBe(1248);
    });

    it('calculates diet transition water savings correctly', () => {
      const adjustments: SimulatorAdjustments = {
        ...DEFAULT_ADJUSTMENTS,
        dietType: 'vegan',
      };
      const result = calculateSimulatedImpact(BASELINE, adjustments, 'mixed', 'medium');
      // Baseline mixed water: 3000 l/day, Vegan: 1500 l/day
      // Savings = (3000 - 1500) * 365 = 547500 liters/yr
      expect(result.waterSavings).toBe(547500);
      expect(result.projected.diet).toBe(1500);
    });

    it('calculates solar energy electricity reduction and cost savings', () => {
      const adjustments: SimulatorAdjustments = {
        ...DEFAULT_ADJUSTMENTS,
        renewableEnergyPercent: 50,
      };
      const result = calculateSimulatedImpact(BASELINE, adjustments, 'mixed', 'medium');
      // baseline.energy = 1800.
      // electricity portion = 1800 * 0.6 = 1080.
      // gas portion = 1800 * 0.4 = 720.
      // 50% renewable -> electricity portion = 1080 * 0.5 = 540.
      // total energy = 540 + 720 = 1260.
      expect(result.projected.energy).toBe(1260);

      // energySavings = BASELINE_ANNUAL_KWH (6000) * 0.5 = 3000 kWh
      expect(result.energySavings).toBe(3000);
      // costSavings = 3000 * ELECTRICITY_COST_PER_KWH (0.16) = 480 USD
      expect(result.costSavings).toBe(480);
    });

    it('calculates flight reduction carbon and cost savings', () => {
      const adjustments: SimulatorAdjustments = {
        ...DEFAULT_ADJUSTMENTS,
        flightHoursPerYear: 5,
      };
      const result = calculateSimulatedImpact(BASELINE, adjustments, 'mixed', 'medium');
      // emissions: 5 hours * 180 kg/hr = 900 + 10% baseline (100) = 1000 kg
      expect(result.projected.travel).toBe(1000);
      // baseline hours = max(5, 20) = 20
      // cost savings: (20 - 5) * 100 USD/hr = 1500 USD
      expect(result.costSavings).toBe(1500);
    });

    it('calculates sustainable shopping carbon and waste savings', () => {
      const adjustments: SimulatorAdjustments = {
        ...DEFAULT_ADJUSTMENTS,
        shoppingLevel: 'low',
      };
      const result = calculateSimulatedImpact(BASELINE, adjustments, 'mixed', 'medium');
      // shopping emissions for low = 500
      expect(result.projected.shopping).toBe(500);
      // waste savings: baseline waste (medium = 150), projected (low = 50) -> 100 kg/yr
      expect(result.wasteSavings).toBe(100);
    });

    it('calculates combined impact scores and tiers correctly', () => {
      const adjustments: SimulatorAdjustments = {
        carKmPerWeek: 50,
        carFuelType: 'electric',
        dietType: 'vegan',
        renewableEnergyPercent: 100,
        shoppingLevel: 'low',
        flightHoursPerYear: 0,
      };
      const result = calculateSimulatedImpact(BASELINE, adjustments, 'mixed', 'medium');

      expect(result.impactScore).toBeGreaterThanOrEqual(0);
      expect(result.impactScore).toBeLessThanOrEqual(100);
      expect(result.tier).toBeDefined();
    });

    it('clamps renewable energy percent to [0, 100]', () => {
      const adjustmentsOver: SimulatorAdjustments = {
        ...DEFAULT_ADJUSTMENTS,
        renewableEnergyPercent: 150,
      };
      const resultOver = calculateSimulatedImpact(BASELINE, adjustmentsOver, 'mixed', 'medium');
      expect(resultOver.projected.energy).toBe(BASELINE.energy * 0.4); // Only gas portion remains (40%)

      const adjustmentsUnder: SimulatorAdjustments = {
        ...DEFAULT_ADJUSTMENTS,
        renewableEnergyPercent: -50,
      };
      const resultUnder = calculateSimulatedImpact(BASELINE, adjustmentsUnder, 'mixed', 'medium');
      expect(resultUnder.projected.energy).toBe(BASELINE.energy);
    });
  });

  describe('projectForecast', () => {
    it('generates correct number of steps and monthly values', () => {
      const start = BASELINE;
      const end = {
        ...BASELINE,
        transport: 1000,
        energy: 500,
        total: 6200,
      };
      const forecast = projectForecast(start, end, 6);
      expect(forecast).toHaveLength(7);
      expect(forecast[0]!.month).toBe('Now');
      expect(forecast[0]!.total).toBe(start.total);
      expect(forecast[6]!.month).toBe('Month 6');
      expect(forecast[6]!.total).toBe(end.total);
    });

    it('handles negative month requests gracefully', () => {
      const start = BASELINE;
      const end = BASELINE;
      const forecast = projectForecast(start, end, -5);
      expect(forecast).toHaveLength(2); // month 0 and month 1
    });
  });
});
