import { describe, it, expect } from 'vitest';
import {
  calculateReductionPotential,
  calculateGradeFromEmissions,
  generateForecastCurve,
} from '../analytics.service';

describe('analytics.service', () => {
  describe('calculateReductionPotential', () => {
    it('applies sector-specific optimization ratios correctly', () => {
      const input = {
        transport_kg: 2000, // EV + public transit (35% target, 65% savings)
        energy_kg: 3000, // Solar offset + home efficiency (40% target, 60% savings)
        diet_kg: 2500, // Shift to vegetarian/vegan (capped at 1600)
        shopping_kg: 1000, // Shift to minimal spending (capped at 500)
        travel_kg: 2000, // Fewer flights, green lodging (40% target, 60% savings)
      };

      const result = calculateReductionPotential(input);

      // Calculations:
      // targetTransport = Math.round(2000 * 0.35) = 700
      // targetEnergy = Math.round(3000 * 0.4) = 1200
      // targetDiet = Math.min(2500, 1600) = 1600
      // targetShopping = Math.min(1000, 500) = 500
      // targetTravel = Math.round(2000 * 0.4) = 800
      // targetTotal = 700 + 1200 + 1600 + 500 + 800 = 4800
      // currentTotal = 2000 + 3000 + 2500 + 1000 + 2000 = 10500
      // savingsTotal = 10500 - 4800 = 5700
      expect(result.targetTotal).toBe(4800);
      expect(result.savingsTotal).toBe(5700);
    });

    it('uses actual values if diet and shopping are already below sustainable caps', () => {
      const input = {
        transport_kg: 1000,
        energy_kg: 1000,
        diet_kg: 1200, // less than 1600
        shopping_kg: 300, // less than 500
        travel_kg: 1000,
      };

      const result = calculateReductionPotential(input);

      // Calculations:
      // targetTransport = Math.round(1000 * 0.35) = 350
      // targetEnergy = Math.round(1000 * 0.4) = 400
      // targetDiet = Math.min(1200, 1600) = 1200
      // targetShopping = Math.min(300, 500) = 300
      // targetTravel = Math.round(1000 * 0.4) = 400
      // targetTotal = 350 + 400 + 1200 + 300 + 400 = 2650
      // currentTotal = 1000 + 1000 + 1200 + 300 + 1000 = 4500
      // savingsTotal = 4500 - 2650 = 1850
      expect(result.targetTotal).toBe(2650);
      expect(result.savingsTotal).toBe(1850);
    });

    it('ensures savingsTotal is never negative', () => {
      // Inputs already lower than possible targets (extreme edge case/highly theoretical)
      const input = {
        transport_kg: 0,
        energy_kg: 0,
        diet_kg: 0,
        shopping_kg: 0,
        travel_kg: 0,
      };

      const result = calculateReductionPotential(input);
      expect(result.targetTotal).toBe(0);
      expect(result.savingsTotal).toBe(0);
    });
  });

  describe('calculateGradeFromEmissions', () => {
    it('maps footprint values to correct letter grades', () => {
      expect(calculateGradeFromEmissions(1500)).toBe('A+');
      expect(calculateGradeFromEmissions(2000)).toBe('A+');
      expect(calculateGradeFromEmissions(2001)).toBe('A');
      expect(calculateGradeFromEmissions(3500)).toBe('A');
      expect(calculateGradeFromEmissions(3501)).toBe('B');
      expect(calculateGradeFromEmissions(5000)).toBe('B');
      expect(calculateGradeFromEmissions(5001)).toBe('C');
      expect(calculateGradeFromEmissions(7000)).toBe('C');
      expect(calculateGradeFromEmissions(7001)).toBe('D');
      expect(calculateGradeFromEmissions(10000)).toBe('D');
      expect(calculateGradeFromEmissions(10001)).toBe('F');
      expect(calculateGradeFromEmissions(25000)).toBe('F');
    });
  });

  describe('generateForecastCurve', () => {
    it('generates a 12-month ease-out curve from baseline to target', () => {
      const baseline = 10000;
      const target = 4000;
      const months = 12;

      const curve = generateForecastCurve(baseline, target, months);

      expect(curve).toHaveLength(13); // Month 0 to 12
      expect(curve[0]!.month).toBe('Now');
      expect(curve[0]!.monthIndex).toBe(0);
      expect(curve[0]!.total).toBe(baseline);

      expect(curve[12]!.month).toBe('Month 12');
      expect(curve[12]!.monthIndex).toBe(12);
      expect(curve[12]!.total).toBe(target);

      // Verify decelerating ease-out: reduction should be steeper in the beginning and flatter at the end.
      // Month 1 should have a larger drop than Month 12 drop.
      const dropMonth1 = curve[0]!.total - curve[1]!.total;
      const dropMonth12 = curve[11]!.total - curve[12]!.total;
      expect(dropMonth1).toBeGreaterThan(dropMonth12);

      // Verify progressive decrease
      for (let i = 1; i <= 12; i++) {
        expect(curve[i]!.total).toBeLessThan(curve[i - 1]!.total);
      }
    });

    it('supports custom month lengths', () => {
      const curve = generateForecastCurve(8000, 3000, 6);
      expect(curve).toHaveLength(7); // Month 0 to 6
      expect(curve[0]!.total).toBe(8000);
      expect(curve[6]!.total).toBe(3000);
    });
  });
});
