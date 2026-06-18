/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET } from '../route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/features/community/services/community-analytics.service', () => ({
  getCommunityStats: vi.fn().mockResolvedValue({
    totalUsers: 15,
    activeUsers7d: 5,
    totalXpEarned: 20000,
    assessmentsCompleted: 30,
    simulationsSaved: 10,
    badgesEarned: 15,
    avgCarbonFootprint: 12.4,
    topCarbonSaver: { userId: 'u-1', displayName: 'Saver', value: 8.4 },
    mostImprovedUser: { userId: 'u-2', displayName: 'Improved', value: 12.0 },
    longestStreakUser: { userId: 'u-3', displayName: 'Streaker', value: 14 },
    cachedAt: new Date().toISOString(),
  }),
}));

describe('Stats API Endpoint', () => {
  const mockGetUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });

    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    } as any);
  });

  it('returns 401 when unauthorized', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const req = new NextRequest('http://localhost/api/community/stats');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns aggregated community stats successfully', async () => {
    const req = new NextRequest('http://localhost/api/community/stats');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.totalUsers).toBe(15);
    expect(json.topCarbonSaver.displayName).toBe('Saver');
  });
});
