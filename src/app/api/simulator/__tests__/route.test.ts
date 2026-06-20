/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET, POST, PUT, DELETE } from '../route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { clearRateLimitStore } from '@/lib/rate-limiter';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Carbon Impact Simulator API Routes (/api/simulator)', () => {
  let mockResult: { data: any; error: any } = { data: null, error: null };
  const mockGetUser = vi.fn();
  const mockFrom = vi.fn();

  const mockBuilder: any = {
    insert: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    select: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    update: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    delete: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    eq: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    order: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    limit: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    single: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    maybeSingle: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    then: vi.fn().mockImplementation(function (this: any, onfulfilled: any) {
      return Promise.resolve({ data: mockResult.data, error: mockResult.error }).then(onfulfilled);
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearRateLimitStore();
    mockResult = { data: null, error: null };
    mockGetUser.mockResolvedValue({ data: { user: { id: 'test-simulator-user' } }, error: null });
    mockFrom.mockReturnValue(mockBuilder);

    mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
      return Promise.resolve({ data: mockResult.data, error: mockResult.error }).then(onfulfilled);
    });

    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    } as any);
  });

  // ---------------------------------------------------------------------------
  // GET Tests
  // ---------------------------------------------------------------------------
  describe('GET', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Auth error') });
      const req = new NextRequest('http://localhost/api/simulator');
      const res = await GET(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.message).toBe('Authentication required.');
    });

    it('returns user saved simulations successfully', async () => {
      const mockSimulations = [
        {
          id: 'sim-1',
          user_id: 'test-simulator-user',
          scenario_name: 'EV Transition',
          scenario_type: 'ev',
        },
      ];
      mockResult = { data: mockSimulations, error: null };

      const req = new NextRequest('http://localhost/api/simulator');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual(mockSimulations);
      expect(mockFrom).toHaveBeenCalledWith('saved_simulations');
      expect(mockBuilder.eq).toHaveBeenCalledWith('user_id', 'test-simulator-user');
    });

    it('returns 500 when database fails', async () => {
      mockResult = { data: null, error: new Error('DB error') };
      const req = new NextRequest('http://localhost/api/simulator');
      const res = await GET(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.message).toBe('Failed to retrieve saved simulations.');
    });
  });

  // ---------------------------------------------------------------------------
  // POST Tests
  // ---------------------------------------------------------------------------
  describe('POST', () => {
    const validPayload = {
      scenario_name: 'My Eco-Diet',
      scenario_type: 'diet',
      configuration: {
        carKmPerWeek: null,
        carFuelType: null,
        dietType: 'vegan',
        renewableEnergyPercent: 0,
        shoppingLevel: null,
        flightHoursPerYear: null,
      },
      estimated_carbon_savings: 1000,
      estimated_cost_savings: 150,
      impact_score: 25,
      is_favorite: true,
      comparison_group_id: null,
    };

    it('returns 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Auth error') });
      const req = new NextRequest('http://localhost/api/simulator', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 on validation failure', async () => {
      const invalidPayload = { ...validPayload, scenario_type: 'invalid-type' };
      const req = new NextRequest('http://localhost/api/simulator', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.message).toBe('Validation failed.');
    });

    it('saves new simulation, fetches baseline, recomputes, and returns saved simulation', async () => {
      const mockAssessment = {
        transport_kg: 2000,
        diet_kg: 2500,
        energy_kg: 1800,
        shopping_kg: 1200,
        travel_score: 1000,
        total_kg: 8500,
        compared_to_average: 1.8,
        percentile: 65,
      };

      const mockSavedSim = {
        id: 'new-sim-id',
        user_id: 'test-simulator-user',
        scenario_name: 'My Eco-Diet',
        scenario_type: 'diet',
        configuration: validPayload.configuration,
        estimated_carbon_savings: 1000,
        estimated_cost_savings: 150,
        estimated_water_savings: 547500,
        estimated_energy_savings: 0,
        impact_score: 25,
        is_favorite: true,
      };

      // Mock double call to supabase.from()
      // First is 'assessments' (to fetch latest), second is 'saved_simulations' (to insert)
      mockFrom.mockImplementation((table: string) => {
        if (table === 'assessments') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: () => Promise.resolve({ data: mockAssessment, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'saved_simulations') {
          return mockBuilder;
        }
        return mockBuilder;
      });

      mockResult = { data: mockSavedSim, error: null };

      const req = new NextRequest('http://localhost/api/simulator', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.id).toBe('new-sim-id');
      expect(mockBuilder.insert).toHaveBeenCalled();
    });

    it('enforces rate limiting (returns 429 after 20 requests)', async () => {
      // Create a unique user to test rate limit
      mockGetUser.mockResolvedValue({ data: { user: { id: 'rate-limited-user' } }, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'assessments') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: () => Promise.resolve({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return mockBuilder;
      });

      mockResult = { data: { id: 'new-sim-id' }, error: null };

      for (let i = 0; i < 20; i++) {
        const req = new NextRequest('http://localhost/api/simulator', {
          method: 'POST',
          body: JSON.stringify(validPayload),
        });
        const res = await POST(req);
        expect(res.status).toBe(201);
      }

      // 21st request must fail with 429
      const req21 = new NextRequest('http://localhost/api/simulator', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      });
      const res21 = await POST(req21);
      expect(res21.status).toBe(429);
      const json = await res21.json();
      expect(json.error).toBe('Too Many Requests');
    });
  });

  // ---------------------------------------------------------------------------
  // PUT Tests
  // ---------------------------------------------------------------------------
  describe('PUT', () => {
    it('returns 403 when updating simulation owned by another user', async () => {
      const payload = {
        id: '11111111-2222-3333-4444-555555555555',
        scenario_name: 'Stolen Sim',
      };

      // Mock ownership check: existing Sim belongs to 'someone-else'
      mockFrom.mockImplementation((table: string) => {
        if (table === 'saved_simulations') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({ data: { user_id: 'someone-else' }, error: null }),
              }),
            }),
          };
        }
        return mockBuilder;
      });

      const req = new NextRequest('http://localhost/api/simulator', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const res = await PUT(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.message).toContain('Forbidden');
    });

    it('updates simulation successfully when owned by the user', async () => {
      const payload = {
        id: '11111111-2222-3333-4444-555555555555',
        scenario_name: 'My New Sim Name',
        is_favorite: true,
      };

      // Mock ownership check: existing Sim belongs to user, then update returns the updated object
      mockFrom.mockImplementation((table: string) => {
        if (table === 'saved_simulations') {
          return {
            select: (sel: string) => {
              if (sel === 'user_id') {
                return {
                  eq: () => ({
                    maybeSingle: () =>
                      Promise.resolve({ data: { user_id: 'test-simulator-user' }, error: null }),
                  }),
                };
              }
              // This is the update select('*').single() mock flow
              return {
                eq: () => ({
                  select: () => ({
                    single: () =>
                      Promise.resolve({
                        data: {
                          id: '11111111-2222-3333-4444-555555555555',
                          scenario_name: 'My New Sim Name',
                        },
                        error: null,
                      }),
                  }),
                }),
              };
            },
            update: () => ({
              eq: () => ({
                select: () => ({
                  single: () =>
                    Promise.resolve({
                      data: {
                        id: '11111111-2222-3333-4444-555555555555',
                        scenario_name: 'My New Sim Name',
                      },
                      error: null,
                    }),
                }),
              }),
            }),
          };
        }
        return mockBuilder;
      });

      const req = new NextRequest('http://localhost/api/simulator', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const res = await PUT(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.scenario_name).toBe('My New Sim Name');
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE Tests
  // ---------------------------------------------------------------------------
  describe('DELETE', () => {
    it('returns 400 when simulation ID is missing', async () => {
      const req = new NextRequest('http://localhost/api/simulator');
      const res = await DELETE(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.message).toBe('Missing simulation ID.');
    });

    it('returns 403 when deleting simulation owned by another user', async () => {
      // Mock ownership check: existing Sim belongs to 'someone-else'
      mockFrom.mockImplementation((table: string) => {
        if (table === 'saved_simulations') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({ data: { user_id: 'someone-else' }, error: null }),
              }),
            }),
          };
        }
        return mockBuilder;
      });

      const req = new NextRequest(
        'http://localhost/api/simulator?id=11111111-2222-3333-4444-555555555555',
        {
          method: 'DELETE',
        },
      );

      const res = await DELETE(req);
      expect(res.status).toBe(403);
    });

    it('deletes simulation successfully when owned by the user', async () => {
      // Mock ownership check: existing Sim belongs to user, then delete executes successfully
      mockFrom.mockImplementation((table: string) => {
        if (table === 'saved_simulations') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({ data: { user_id: 'test-simulator-user' }, error: null }),
              }),
            }),
            delete: () => ({
              eq: () => Promise.resolve({ error: null }),
            }),
          };
        }
        return mockBuilder;
      });

      const req = new NextRequest(
        'http://localhost/api/simulator?id=11111111-2222-3333-4444-555555555555',
        {
          method: 'DELETE',
        },
      );

      const res = await DELETE(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toBe('Simulation deleted successfully.');
    });
  });
});
