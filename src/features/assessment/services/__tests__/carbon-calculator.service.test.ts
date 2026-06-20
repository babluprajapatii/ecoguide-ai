import { describe, it, expect } from 'vitest';
import {
  calculateTransportFootprint,
  calculateDietFootprint,
  calculateEnergyFootprint,
  calculateShoppingFootprint,
  calculateTravelFootprint,
  calculateTotalFootprint,
  estimatePercentile,
  clampEmission,
} from '@/features/assessment/services/carbon-calculator.service';
import type {
  TransportInput,
  EnergyInput,
  TravelInput,
  AssessmentInput,
} from '@/features/assessment/types/assessment.types';

describe('clampEmission', () => {
  it('returns 0 for negative, NaN or infinite values', () => {
    expect(clampEmission(-500)).toBe(0);
    expect(clampEmission(NaN)).toBe(0);
    expect(clampEmission(Infinity)).toBe(0);
    expect(clampEmission(250.5)).toBe(250.5);
  });
});

describe('calculateTransportFootprint', () => {
  it('calculates vehicle and transit emissions correctly', () => {
    const input: TransportInput = {
      fuelType: 'petrol',
      weeklyKm: 100,
      publicTransportWeeklyHours: 5,
      rideShareWeeklyKm: 50,
    };
    // Car: 100 * 0.21 * 52 = 1092
    // Public Transport: 5 * 0.8 * 52 = 208
    // Ride Sharing: 50 * 0.12 * 52 = 312
    // Expected Sum = 1092 + 208 + 312 = 1612
    expect(calculateTransportFootprint(input)).toBe(1612);
  });

  it('returns 0 for no driving and zero transit hours', () => {
    const input: TransportInput = {
      fuelType: 'none',
      weeklyKm: 0,
      publicTransportWeeklyHours: 0,
      rideShareWeeklyKm: 0,
    };
    expect(calculateTransportFootprint(input)).toBe(0);
  });
});

describe('calculateEnergyFootprint', () => {
  it('calculates energy footprint and shares among members', () => {
    const input: EnergyInput = {
      electricityKwhPerMonth: 300,
      gasKwhPerMonth: 100,
      renewableEnergyPercent: 50, // 50% clean offset
      homeSizeSqFt: 1200,
      householdMembers: 2, // Divided by 2 members
    };
    // Raw electricity: 300 * 12 * 0.233 = 838.8
    // Electricity with 50% renewable offset: 838.8 * 0.5 = 419.4
    // Gas: 100 * 12 * 2.04 = 2448
    // Home Size baseline: 1200 * 0.5 = 600
    // Total Household emissions: 419.4 + 2448 + 600 = 3467.4
    // Per Capita: 3467.4 / 2 = 1733.7
    expect(calculateEnergyFootprint(input)).toBe(1733.7);
  });

  it('safely falls back to 1 member on 0 or negative value (divide-by-zero protection)', () => {
    const input: EnergyInput = {
      electricityKwhPerMonth: 300,
      gasKwhPerMonth: 0,
      renewableEnergyPercent: 0,
      homeSizeSqFt: 0,
      householdMembers: 0, // Should fallback to 1
    };
    // Raw electricity: 300 * 12 * 0.233 = 838.8 / 1 = 838.8
    expect(calculateEnergyFootprint(input)).toBe(838.8);
  });
});

describe('calculateDietFootprint', () => {
  it('returns standard IPCC values', () => {
    expect(calculateDietFootprint({ dietType: 'vegan' })).toBe(1500);
    expect(calculateDietFootprint({ dietType: 'vegetarian' })).toBe(1700);
    expect(calculateDietFootprint({ dietType: 'mixed' })).toBe(2500);
    expect(calculateDietFootprint({ dietType: 'meat-heavy' })).toBe(3300);
  });
});

describe('calculateShoppingFootprint', () => {
  it('returns standard consumer spending values', () => {
    expect(calculateShoppingFootprint({ level: 'low' })).toBe(500);
    expect(calculateShoppingFootprint({ level: 'medium' })).toBe(1200);
    expect(calculateShoppingFootprint({ level: 'high' })).toBe(2500);
  });
});

describe('calculateTravelFootprint', () => {
  it('calculates short-haul flights and hotel stays', () => {
    const input: TravelInput = {
      flightsPerYear: 3,
      avgDistanceKm: 1000, // < 1500 is short-haul (0.255)
      hotelStaysPerYear: 5, // 5 * 20 = 100
    };
    // Flights: 3 * 1000 * 0.255 = 765
    // Hotels: 5 * 20 = 100
    // Total = 865
    expect(calculateTravelFootprint(input)).toBe(865);
  });

  it('calculates long-haul flights correctly', () => {
    const input: TravelInput = {
      flightsPerYear: 2,
      avgDistanceKm: 4000, // >= 1500 is long-haul (0.195)
      hotelStaysPerYear: 0,
    };
    // Flights: 2 * 4000 * 0.195 = 1560
    expect(calculateTravelFootprint(input)).toBe(1560);
  });
});

describe('estimatePercentile', () => {
  it('determines predictable percentile rankings based on logistic curve bounds', () => {
    // 1000 kg is very low -> low percentile
    const lowRank = estimatePercentile(1000);
    expect(lowRank).toBeGreaterThanOrEqual(1);
    expect(lowRank).toBeLessThanOrEqual(25);

    // 4700 kg is midpoint -> around 50th percentile
    const midRank = estimatePercentile(4700);
    expect(midRank).toBeCloseTo(50, 0);

    // 25000 kg is very high -> clamped to 99
    const highRank = estimatePercentile(25000);
    expect(highRank).toBe(99);
  });
});

describe('calculateTotalFootprint', () => {
  it('aggregates all categories into footprint breakdown metrics', () => {
    const input: AssessmentInput = {
      transport: {
        fuelType: 'hybrid',
        weeklyKm: 50,
        publicTransportWeeklyHours: 2,
        rideShareWeeklyKm: 10,
      },
      energy: {
        electricityKwhPerMonth: 200,
        gasKwhPerMonth: 50,
        renewableEnergyPercent: 100, // offsets electricity to 0
        homeSizeSqFt: 1000,
        householdMembers: 1,
      },
      diet: { dietType: 'vegan' },
      shopping: { level: 'low' },
      travel: {
        flightsPerYear: 0,
        avgDistanceKm: 0,
        hotelStaysPerYear: 0,
      },
    };

    const result = calculateTotalFootprint(input);
    expect(result.diet).toBe(1500);
    expect(result.shopping).toBe(500);
    expect(result.travel).toBe(0);
    expect(result.total).toBe(
      result.transport + result.energy + result.diet + result.shopping + result.travel,
    );
    expect(result.comparedToAverage).toBe(Math.round((result.total / 4700) * 100) / 100);
  });
});
