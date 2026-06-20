/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST as sessionSync } from '../api/auth/session/route';
import { GET as getDashboard } from '../api/dashboard/route';
import { GET as getCoachDashboard } from '../api/coach/dashboard/route';
import { POST as postCoachRec } from '../api/coach/recommendations/route';
import { POST as postSimulation } from '../api/simulator/route';
import { PUT as putCommunitySettings } from '../api/community/settings/route';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';
import { clearRateLimitStore } from '@/lib/rate-limiter';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

describe('Complete End-to-End User Journey Integration', () => {
  let mockResult: { data: any; error: any } = { data: null, error: null };
  const mockGetUser = vi.fn();
  const mockFrom = vi.fn();
  const mockSetSession = vi.fn();
  const mockSignOut = vi.fn();

  const mockBuilder: any = {
    insert: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    select: vi.fn().mockImplementation(function (this: any) {
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
    delete: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    update: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    upsert: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    maybeSingle: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    single: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    then: vi.fn().mockImplementation(function (this: any, onfulfilled: any) {
      return Promise.resolve({ data: mockResult.data, error: mockResult.error }).then(onfulfilled);
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearRateLimitStore();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'dummy-anon-key';

    mockResult = { data: null, error: null };
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-journey-id' } }, error: null });
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

    mockSetSession.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValue({ error: null });

    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        setSession: mockSetSession,
        signOut: mockSignOut,
        getUser: mockGetUser,
      },
      from: mockFrom,
    } as any);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('runs the full signup -> assessment -> dashboard -> coach -> simulator -> community -> logout journey successfully', async () => {
    // 1. User signs in / Sync session
    const syncReq = new NextRequest('http://localhost/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({
        event: 'SIGNED_IN',
        session: { access_token: 'fake-access', refresh_token: 'fake-refresh' },
      }),
    });
    const syncRes = await sessionSync(syncReq);
    expect(syncRes.status).toBe(200);
    expect(mockSetSession).toHaveBeenCalled();

    // 2. User loads dashboard data
    mockResult.data = [
      {
        id: 'assessment-uuid',
        user_id: 'user-journey-id',
        transport_score: 1500,
        diet_score: 1800,
        energy_score: 1200,
        shopping_score: 900,
        travel_score: 600,
        total_score: 6000,
        compared_to_average: 1.2,
        percentile: 50,
        created_at: new Date().toISOString(),
      },
    ];

    const dashReq = new NextRequest('http://localhost/api/dashboard');
    const dashRes = await getDashboard(dashReq);
    expect(dashRes.status).toBe(200);
    const dashJson = await dashRes.json();
    expect(dashJson.latestAssessment.total_kg).toBe(6000);

    // 3. User views coach dashboard
    let queryIdx = 0;
    mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
      queryIdx++;
      let res = { data: [] as any, error: null };
      if (queryIdx === 1) {
        res = { data: [{ created_at: new Date().toISOString(), role: 'user' }], error: null }; // conversations
      } else if (queryIdx === 2) {
        res = { data: [{ status: 'pending' }], error: null }; // recommendations
      } else if (queryIdx === 3) {
        res = { data: [{ created_at: new Date().toISOString() }], error: null }; // assessments
      }
      return Promise.resolve(res).then(onfulfilled);
    });

    const coachDashReq = new NextRequest('http://localhost/api/coach/dashboard');
    const coachDashRes = await getCoachDashboard(coachDashReq);
    expect(coachDashRes.status).toBe(200);
    const coachDashJson = await coachDashRes.json();
    expect(coachDashJson.activeRecommendations).toBe(1);

    // 4. User queries recommendations & creates custom one
    mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
      return Promise.resolve({ data: mockResult.data, error: mockResult.error }).then(onfulfilled);
    });
    mockResult.data = { id: 'new-rec', title: 'Solar Panels' };
    const postRecReq = new NextRequest('http://localhost/api/coach/recommendations', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Solar Panels',
        description: 'Install solar PV system on roof',
        priority: 'high',
        estimated_savings: 1200,
      }),
    });
    const postRecRes = await postCoachRec(postRecReq);
    expect(postRecRes.status).toBe(201);
    const postRecJson = await postRecRes.json();
    expect(postRecJson.title).toBe('Solar Panels');

    // 5. User runs simulator to save lifestyle changes
    mockResult.data = {
      id: 'sim-uuid',
      scenario_name: 'Electric Commute',
      estimated_carbon_savings: 800,
    };
    const simReq = new NextRequest('http://localhost/api/simulator', {
      method: 'POST',
      body: JSON.stringify({
        scenario_name: 'Electric Commute',
        scenario_type: 'custom',
        configuration: {
          carKmPerWeek: 150,
          carFuelType: 'electric',
          dietType: null,
          renewableEnergyPercent: 0,
          flightHoursPerYear: null,
          shoppingLevel: null,
        },
        estimated_carbon_savings: 800,
        estimated_cost_savings: 150,
        impact_score: 25,
      }),
    });
    const simRes = await postSimulation(simReq);
    expect(simRes.status).toBe(201);
    const simJson = await simRes.json();
    expect(simJson.scenario_name).toBe('Electric Commute');

    // 6. User joins community leaderboard
    mockResult.data = { id: 'profile-uuid', leaderboard_opt_in: true };
    const communityReq = new NextRequest('http://localhost/api/community/settings', {
      method: 'PUT',
      body: JSON.stringify({
        optIn: true,
        leaderboardOptIn: true,
        publicProfileVisibility: 'public',
        bio: '',
      }),
    });
    const communityRes = await putCommunitySettings(communityReq);
    expect(communityRes.status).toBe(200);

    // 7. User logs out / Sync session out
    const logoutReq = new NextRequest('http://localhost/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({ event: 'SIGNED_OUT' }),
    });
    const logoutRes = await sessionSync(logoutReq);
    expect(logoutRes.status).toBe(200);
    expect(mockSignOut).toHaveBeenCalled();
  });
});
