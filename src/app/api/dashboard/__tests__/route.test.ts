/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET } from '../route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { clearRateLimitStore } from '@/lib/rate-limiter';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Dashboard API Route (GET)', () => {
  let mockResult: { data: any; error: any } = { data: null, error: null };
  const mockGetUser = vi.fn();
  const mockFrom = vi.fn();

  const mockBuilder: any = {
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
    then: vi.fn().mockImplementation(function (this: any, onfulfilled: any) {
      return Promise.resolve({ data: mockResult.data, error: mockResult.error }).then(onfulfilled);
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearRateLimitStore();
    mockResult = { data: [], error: null };
    mockGetUser.mockResolvedValue({ data: { user: { id: 'test-dash-user' } }, error: null });
    mockFrom.mockReturnValue(mockBuilder);

    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    } as any);
  });

  it('rejects when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No user') });
    const req = new NextRequest('http://localhost/api/dashboard');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns formatted dashboard data', async () => {
    mockResult = {
      data: [
        {
          id: 'assessment-1',
          user_id: 'test-dash-user',
          transport_score: 100,
          diet_score: 200,
          energy_score: 150,
          shopping_score: 120,
          travel_score: 80,
          total_score: 650,
          compared_to_average: 1.1,
          percentile: 55,
          created_at: '2026-06-18T10:00:00Z',
        },
      ],
      error: null,
    };

    const req = new NextRequest('http://localhost/api/dashboard');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.latestAssessment).not.toBeNull();
    expect(json.latestAssessment.id).toBe('assessment-1');
    expect(json.history.length).toBe(1);
  });

  it('returns fallback empty dashboard when database query fails', async () => {
    mockResult = { data: null, error: { message: 'Database crash' } };

    const req = new NextRequest('http://localhost/api/dashboard');
    const res = await GET(req);
    expect(res.status).toBe(200); // Should return 200 with fallback data
    const json = await res.json();
    expect(json.latestAssessment).toBeNull();
    expect(json.history).toEqual([]);
  });
});
