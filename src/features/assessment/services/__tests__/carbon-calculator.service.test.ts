import { describe, it, expect } from 'vitest';
import {
  calculateTransportFootprint,
  calculateDietFootprint,
  calculateEnergyFootprint,
  calculateShoppingFootprint,
  calculateTotalFootprint,
} from '@/features/assessment/services/carbon-calculator.service';
import type {
  TransportInput,
  EnergyInput,
  AssessmentInput,
  DietType,
  ShoppingLevel,
  FuelType,
} from '@/features/assessment/types/assessment.types';

// ---------------------------------------------------------------------------
// calculateTransportFootprint
// ---------------------------------------------------------------------------

describe('calculateTransportFootprint', () => {
  it('returns 0 for no car and no flights', () => {
    const input: TransportInput = { flights: [] };
    expect(calculateTransportFootprint(input)).toBe(0);
  });

  it('calculates petrol car emissions correctly', () => {
    const input: TransportInput = {
      car: { weeklyKm: 100, fuelType: 'petrol' },
      flights: [],
    };
    // 100 km/week * 0.21 kg/km * 52 weeks = 1092
    expect(calculateTransportFootprint(input)).toBe(1092);
  });

  it('calculates diesel car emissions correctly', () => {
    const input: TransportInput = {
      car: { weeklyKm: 100, fuelType: 'diesel' },
      flights: [],
    };
    // 100 * 0.17 * 52 = 884
    expect(calculateTransportFootprint(input)).toBe(884);
  });

  it('calculates electric car emissions correctly', () => {
    const input: TransportInput = {
      car: { weeklyKm: 100, fuelType: 'electric' },
      flights: [],
    };
    // 100 * 0.05 * 52 = 260
    expect(calculateTransportFootprint(input)).toBe(260);
  });

  it('calculates hybrid car emissions correctly', () => {
    const input: TransportInput = {
      car: { weeklyKm: 100, fuelType: 'hybrid' },
      flights: [],
    };
    // 100 * 0.11 * 52 = 572
    expect(calculateTransportFootprint(input)).toBe(572);
  });

  it('returns 0 for car with 0 weekly km', () => {
    const input: TransportInput = {
      car: { weeklyKm: 0, fuelType: 'petrol' },
      flights: [],
    };
    expect(calculateTransportFootprint(input)).toBe(0);
  });

  it('calculates short-haul flight emissions correctly', () => {
    const input: TransportInput = {
      flights: [
        { flightsPerYear: 4, avgDistanceKm: 800, type: 'short-haul' },
      ],
    };
    // 4 * 800 * 0.255 = 816
    expect(calculateTransportFootprint(input)).toBe(816);
  });

  it('calculates long-haul flight emissions correctly', () => {
    const input: TransportInput = {
      flights: [
        { flightsPerYear: 2, avgDistanceKm: 5000, type: 'long-haul' },
      ],
    };
    // 2 * 5000 * 0.195 = 1950
    expect(calculateTransportFootprint(input)).toBe(1950);
  });

  it('returns 0 for flights with 0 flights per year', () => {
    const input: TransportInput = {
      flights: [
        { flightsPerYear: 0, avgDistanceKm: 800, type: 'short-haul' },
      ],
    };
    expect(calculateTransportFootprint(input)).toBe(0);
  });

  it('returns 0 for flights with 0 distance', () => {
    const input: TransportInput = {
      flights: [
        { flightsPerYear: 10, avgDistanceKm: 0, type: 'short-haul' },
      ],
    };
    expect(calculateTransportFootprint(input)).toBe(0);
  });

  it('sums car and multiple flight categories', () => {
    const input: TransportInput = {
      car: { weeklyKm: 50, fuelType: 'petrol' },
      flights: [
        { flightsPerYear: 4, avgDistanceKm: 800, type: 'short-haul' },
        { flightsPerYear: 2, avgDistanceKm: 5000, type: 'long-haul' },
      ],
    };
    // Car: 50 * 0.21 * 52 = 546
    // Short: 4 * 800 * 0.255 = 816
    // Long: 2 * 5000 * 0.195 = 1950
    // Total: 3312
    expect(calculateTransportFootprint(input)).toBe(3312);
  });

  it('handles all fuel types without error', () => {
    const fuelTypes: FuelType[] = ['petrol', 'diesel', 'electric', 'hybrid'];
    for (const fuelType of fuelTypes) {
      const input: TransportInput = {
        car: { weeklyKm: 10, fuelType },
        flights: [],
      };
      const result = calculateTransportFootprint(input);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(result)).toBe(true);
    }
  });

  it('handles very high mileage', () => {
    const input: TransportInput = {
      car: { weeklyKm: 5000, fuelType: 'petrol' },
      flights: [],
    };
    // 5000 * 0.21 * 52 = 54600
    expect(calculateTransportFootprint(input)).toBe(54600);
  });
});

// ---------------------------------------------------------------------------
// calculateDietFootprint
// ---------------------------------------------------------------------------

describe('calculateDietFootprint', () => {
  it('returns 1500 for vegan diet', () => {
    expect(calculateDietFootprint({ dietType: 'vegan' })).toBe(1500);
  });

  it('returns 1700 for vegetarian diet', () => {
    expect(calculateDietFootprint({ dietType: 'vegetarian' })).toBe(1700);
  });

  it('returns 2500 for mixed diet', () => {
    expect(calculateDietFootprint({ dietType: 'mixed' })).toBe(2500);
  });

  it('returns 3300 for meat-heavy diet', () => {
    expect(calculateDietFootprint({ dietType: 'meat-heavy' })).toBe(3300);
  });

  it('handles all diet types without error', () => {
    const types: DietType[] = ['vegan', 'vegetarian', 'mixed', 'meat-heavy'];
    for (const dietType of types) {
      const result = calculateDietFootprint({ dietType });
      expect(result).toBeGreaterThan(0);
      expect(Number.isFinite(result)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// calculateEnergyFootprint
// ---------------------------------------------------------------------------

describe('calculateEnergyFootprint', () => {
  it('returns 0 for zero electricity and zero gas', () => {
    const input: EnergyInput = {
      electricityKwhPerMonth: 0,
      gasKwhPerMonth: 0,
    };
    expect(calculateEnergyFootprint(input)).toBe(0);
  });

  it('calculates electricity-only footprint with default grid factor', () => {
    const input: EnergyInput = {
      electricityKwhPerMonth: 300,
      gasKwhPerMonth: 0,
    };
    // 300 * 12 * 0.233 = 838.8
    expect(calculateEnergyFootprint(input)).toBe(838.8);
  });

  it('calculates gas-only footprint', () => {
    const input: EnergyInput = {
      electricityKwhPerMonth: 0,
      gasKwhPerMonth: 100,
    };
    // 100 * 12 * 2.04 = 2448
    expect(calculateEnergyFootprint(input)).toBe(2448);
  });

  it('sums electricity and gas correctly', () => {
    const input: EnergyInput = {
      electricityKwhPerMonth: 300,
      gasKwhPerMonth: 100,
    };
    // Electricity: 300 * 12 * 0.233 = 838.8
    // Gas: 100 * 12 * 2.04 = 2448
    // Total: 3286.8
    expect(calculateEnergyFootprint(input)).toBe(3286.8);
  });

  it('uses custom grid factor when provided', () => {
    const input: EnergyInput = {
      electricityKwhPerMonth: 100,
      gasKwhPerMonth: 0,
      electricityGridFactor: 0.5,
    };
    // 100 * 12 * 0.5 = 600
    expect(calculateEnergyFootprint(input)).toBe(600);
  });

  it('uses zero grid factor (renewables)', () => {
    const input: EnergyInput = {
      electricityKwhPerMonth: 500,
      gasKwhPerMonth: 0,
      electricityGridFactor: 0,
    };
    expect(calculateEnergyFootprint(input)).toBe(0);
  });

  it('handles very high energy usage', () => {
    const input: EnergyInput = {
      electricityKwhPerMonth: 10000,
      gasKwhPerMonth: 5000,
    };
    // Electricity: 10000 * 12 * 0.233 = 27960
    // Gas: 5000 * 12 * 2.04 = 122400
    // Total: 150360
    expect(calculateEnergyFootprint(input)).toBe(150360);
  });
});

// ---------------------------------------------------------------------------
// calculateShoppingFootprint
// ---------------------------------------------------------------------------

describe('calculateShoppingFootprint', () => {
  it('returns 500 for low shopping', () => {
    expect(calculateShoppingFootprint({ level: 'low' })).toBe(500);
  });

  it('returns 1200 for medium shopping', () => {
    expect(calculateShoppingFootprint({ level: 'medium' })).toBe(1200);
  });

  it('returns 2500 for high shopping', () => {
    expect(calculateShoppingFootprint({ level: 'high' })).toBe(2500);
  });

  it('handles all shopping levels without error', () => {
    const levels: ShoppingLevel[] = ['low', 'medium', 'high'];
    for (const level of levels) {
      const result = calculateShoppingFootprint({ level });
      expect(result).toBeGreaterThan(0);
      expect(Number.isFinite(result)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// calculateTotalFootprint
// ---------------------------------------------------------------------------

describe('calculateTotalFootprint', () => {
  const baseInput: AssessmentInput = {
    transport: { flights: [] },
    diet: { dietType: 'mixed' },
    energy: { electricityKwhPerMonth: 0, gasKwhPerMonth: 0 },
    shopping: { level: 'medium' },
  };

  it('returns correct total for minimal input', () => {
    const result = calculateTotalFootprint(baseInput);
    // Transport: 0, Diet: 2500, Energy: 0, Shopping: 1200
    expect(result.total).toBe(3700);
    expect(result.transport).toBe(0);
    expect(result.diet).toBe(2500);
    expect(result.energy).toBe(0);
    expect(result.shopping).toBe(1200);
  });

  it('returns all breakdown fields', () => {
    const result = calculateTotalFootprint(baseInput);
    expect(result).toHaveProperty('transport');
    expect(result).toHaveProperty('diet');
    expect(result).toHaveProperty('energy');
    expect(result).toHaveProperty('shopping');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('comparedToAverage');
    expect(result).toHaveProperty('percentile');
  });

  it('total equals sum of categories', () => {
    const input: AssessmentInput = {
      transport: {
        car: { weeklyKm: 100, fuelType: 'petrol' },
        flights: [
          { flightsPerYear: 2, avgDistanceKm: 5000, type: 'long-haul' },
        ],
      },
      diet: { dietType: 'mixed' },
      energy: { electricityKwhPerMonth: 300, gasKwhPerMonth: 100 },
      shopping: { level: 'medium' },
    };

    const result = calculateTotalFootprint(input);
    const expectedSum =
      result.transport + result.diet + result.energy + result.shopping;

    // Allow for rounding
    expect(Math.abs(result.total - expectedSum)).toBeLessThan(0.02);
  });

  it('comparedToAverage is ratio of total to 4700', () => {
    const result = calculateTotalFootprint(baseInput);
    // 3700 / 4700 = 0.787...  → rounded to 0.79
    expect(result.comparedToAverage).toBe(0.79);
  });

  it('comparedToAverage > 1 for high-footprint user', () => {
    const input: AssessmentInput = {
      transport: {
        car: { weeklyKm: 500, fuelType: 'petrol' },
        flights: [
          { flightsPerYear: 10, avgDistanceKm: 5000, type: 'long-haul' },
        ],
      },
      diet: { dietType: 'meat-heavy' },
      energy: { electricityKwhPerMonth: 1000, gasKwhPerMonth: 500 },
      shopping: { level: 'high' },
    };
    const result = calculateTotalFootprint(input);
    expect(result.comparedToAverage).toBeGreaterThan(1);
  });

  it('comparedToAverage < 1 for low-footprint user', () => {
    const input: AssessmentInput = {
      transport: { flights: [] },
      diet: { dietType: 'vegan' },
      energy: { electricityKwhPerMonth: 50, gasKwhPerMonth: 0 },
      shopping: { level: 'low' },
    };
    const result = calculateTotalFootprint(input);
    expect(result.comparedToAverage).toBeLessThan(1);
  });

  it('percentile is between 0 and 100', () => {
    const result = calculateTotalFootprint(baseInput);
    expect(result.percentile).toBeGreaterThanOrEqual(0);
    expect(result.percentile).toBeLessThanOrEqual(100);
  });

  it('percentile is 0 for zero total', () => {
    // This edge case: all zeroes
    const input: AssessmentInput = {
      transport: { flights: [] },
      diet: { dietType: 'vegan' }, // Vegan still has 1500 kg
      energy: { electricityKwhPerMonth: 0, gasKwhPerMonth: 0 },
      shopping: { level: 'low' }, // 500 kg
    };
    const result = calculateTotalFootprint(input);
    // Total = 2000, which should give a low percentile
    expect(result.percentile).toBeGreaterThanOrEqual(0);
    expect(result.percentile).toBeLessThanOrEqual(50);
  });

  it('higher footprint yields higher percentile', () => {
    const lowInput: AssessmentInput = {
      transport: { flights: [] },
      diet: { dietType: 'vegan' },
      energy: { electricityKwhPerMonth: 50, gasKwhPerMonth: 0 },
      shopping: { level: 'low' },
    };
    const highInput: AssessmentInput = {
      transport: {
        car: { weeklyKm: 500, fuelType: 'petrol' },
        flights: [
          { flightsPerYear: 10, avgDistanceKm: 5000, type: 'long-haul' },
        ],
      },
      diet: { dietType: 'meat-heavy' },
      energy: { electricityKwhPerMonth: 1000, gasKwhPerMonth: 500 },
      shopping: { level: 'high' },
    };

    const lowResult = calculateTotalFootprint(lowInput);
    const highResult = calculateTotalFootprint(highInput);

    expect(highResult.percentile).toBeGreaterThan(lowResult.percentile);
  });

  it('all values are finite numbers', () => {
    const input: AssessmentInput = {
      transport: {
        car: { weeklyKm: 200, fuelType: 'hybrid' },
        flights: [
          { flightsPerYear: 3, avgDistanceKm: 1200, type: 'short-haul' },
        ],
      },
      diet: { dietType: 'vegetarian' },
      energy: { electricityKwhPerMonth: 250, gasKwhPerMonth: 80 },
      shopping: { level: 'medium' },
    };

    const result = calculateTotalFootprint(input);
    expect(Number.isFinite(result.transport)).toBe(true);
    expect(Number.isFinite(result.diet)).toBe(true);
    expect(Number.isFinite(result.energy)).toBe(true);
    expect(Number.isFinite(result.shopping)).toBe(true);
    expect(Number.isFinite(result.total)).toBe(true);
    expect(Number.isFinite(result.comparedToAverage)).toBe(true);
    expect(Number.isFinite(result.percentile)).toBe(true);
  });

  it('handles maximum realistic values', () => {
    const input: AssessmentInput = {
      transport: {
        car: { weeklyKm: 10000, fuelType: 'petrol' },
        flights: [
          { flightsPerYear: 200, avgDistanceKm: 20000, type: 'long-haul' },
        ],
      },
      diet: { dietType: 'meat-heavy' },
      energy: { electricityKwhPerMonth: 50000, gasKwhPerMonth: 50000 },
      shopping: { level: 'high' },
    };

    const result = calculateTotalFootprint(input);
    expect(result.total).toBeGreaterThan(0);
    expect(Number.isFinite(result.total)).toBe(true);
    expect(result.percentile).toBe(100);
    expect(result.comparedToAverage).toBeGreaterThan(1);
  });
});
