/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET } from '../route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock services to avoid DB query complexities
vi.mock('@/features/community/services/leaderboard.service', () => ({
  getGlobalLeaderboard: vi.fn().mockResolvedValue([
    {
      rank: 1,
      userId: 'user-1',
      displayName: 'Eco King',
      totalPoints: 1000,
      level: 5,
      levelName: 'Eco Advocate',
      badgeCount: 3,
      longestStreak: 8,
      isCurrentUser: false,
    },
  ]),
  getNearbyRankings: vi.fn().mockResolvedValue([]),
  getTopPerformers: vi.fn().mockResolvedValue([]),
  getUserRank: vi.fn().mockResolvedValue({
    rank: 1,
    totalPoints: 1000,
    level: 5,
    isOptedIn: true,
  }),
  getLeaderboardTotalCount: vi.fn().mockResolvedValue(100),
}));

describe('Leaderboard API Endpoint', () => {
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
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('Auth error') });
    const req = new NextRequest('http://localhost/api/community/leaderboard');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns rankings list successfully for global view', async () => {
    const req = new NextRequest(
      'http://localhost/api/community/leaderboard?view=global&page=1&limit=10',
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.rankings).toHaveLength(1);
    expect(json.rankings[0].displayName).toBe('Eco King');
    expect(json.pagination.totalEntries).toBe(100);
  });

  it('rejects invalid query parameters with 400', async () => {
    const req = new NextRequest('http://localhost/api/community/leaderboard?page=-1');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
