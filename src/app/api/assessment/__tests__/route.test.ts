/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { POST } from '../route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Assessment Submission & Goal Seeding API', () => {
  let mockResult: { data: any; error: any; count?: number } = { data: null, error: null };
  const mockGetUser = vi.fn();
  const mockFrom = vi.fn();

  const mockBuilder: any = {
    insert: vi.fn().mockImplementation(function (this: any) { return this; }),
    select: vi.fn().mockImplementation(function (this: any) { return this; }),
    eq: vi.fn().mockImplementation(function (this: any) { return this; }),
    delete: vi.fn().mockImplementation(function (this: any) { return this; }),
    single: vi.fn().mockImplementation(function (this: any) { return this; }),
    then: vi.fn().mockImplementation(function (this: any, onfulfilled: any) {
      return Promise.resolve({ data: mockResult.data, error: mockResult.error, count: mockResult.count }).then(onfulfilled);
    }),
  };

  const validAssessmentInput = {
    transport: {
      fuelType: 'hybrid',
      weeklyKm: 50,
      publicTransportWeeklyHours: 2,
      rideShareWeeklyKm: 10,
    },
    energy: {
      electricityKwhPerMonth: 200,
      gasKwhPerMonth: 50,
      renewableEnergyPercent: 100,
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockResult = { data: null, error: null };
    mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });
    mockFrom.mockReturnValue(mockBuilder);

    mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
      return Promise.resolve({ data: mockResult.data, error: mockResult.error, count: mockResult.count }).then(onfulfilled);
    });

    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    } as any);
  });

  it('submits assessment successfully and seeds default goals if it is the first completed assessment', async () => {
    const assessmentResult = { id: 'assessment-uuid', created_at: '2026-06-17T12:00:00Z' };

    let countCheckDone = false;
    let insertAssessmentDone = false;

    mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
      if (!insertAssessmentDone) {
        insertAssessmentDone = true;
        return Promise.resolve({ data: assessmentResult, error: null }).then(onfulfilled);
      }
      if (!countCheckDone) {
        countCheckDone = true;
        // Mock count is 1 since this is the first completed assessment
        return Promise.resolve({ data: [], error: null, count: 1 }).then(onfulfilled);
      }
      // Seeding goals & clearing drafts returns success
      return Promise.resolve({ data: null, error: null }).then(onfulfilled);
    });

    const req = new NextRequest('http://localhost/api/assessment', {
      method: 'POST',
      body: JSON.stringify(validAssessmentInput),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe('assessment-uuid');

    // Verify goals insert was called
    expect(mockFrom).toHaveBeenCalledWith('goals');
    expect(mockBuilder.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ title: 'Reduce carbon footprint by 10%' }),
        expect.objectContaining({ title: 'Switch to 100% renewable energy' }),
        expect.objectContaining({ title: 'Reduce annual travel emissions by 500kg' }),
      ])
    );
  });

  it('submits assessment successfully but does NOT seed default goals if count is greater than 1', async () => {
    const assessmentResult = { id: 'assessment-uuid', created_at: '2026-06-17T12:00:00Z' };

    let countCheckDone = false;
    let insertAssessmentDone = false;

    mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
      if (!insertAssessmentDone) {
        insertAssessmentDone = true;
        return Promise.resolve({ data: assessmentResult, error: null }).then(onfulfilled);
      }
      if (!countCheckDone) {
        countCheckDone = true;
        // Mock count is 2 (not first completed assessment)
        return Promise.resolve({ data: [], error: null, count: 2 }).then(onfulfilled);
      }
      return Promise.resolve({ data: null, error: null }).then(onfulfilled);
    });

    // Reset calls count on insert
    mockBuilder.insert.mockClear();

    const req = new NextRequest('http://localhost/api/assessment', {
      method: 'POST',
      body: JSON.stringify(validAssessmentInput),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    // Verify goals insert was NOT called (was only called for 'assessments' insert, not 'goals')
    const goalsCalls = mockFrom.mock.calls.filter((call) => call[0] === 'goals');
    expect(goalsCalls).toHaveLength(0);
  });
});
