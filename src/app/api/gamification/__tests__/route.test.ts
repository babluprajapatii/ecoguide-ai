/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { clearRateLimitStore } from '@/lib/rate-limiter';
import {
  awardPoints,
  checkBadgeUnlock,
  fetchEarnedBadges,
} from '@/features/gamification/services/points.service';
import { getXpEarnedSummary } from '@/features/gamification/services/gamification-analytics.service';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/features/gamification/services/points.service', () => ({
  getUserLevel: vi.fn(() => ({ name: 'Eco Beginner', rank: 1, minPoints: 0, maxPoints: 100 })),
  awardPoints: vi.fn(),
  checkBadgeUnlock: vi.fn(),
  fetchEarnedBadges: vi.fn(),
}));

vi.mock('@/features/gamification/services/gamification-analytics.service', () => ({
  getXpEarnedSummary: vi.fn(),
}));

describe('Gamification API Route', () => {
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
    mockGetUser.mockResolvedValue({ data: { user: { id: 'test-game-user' } }, error: null });
    mockFrom.mockReturnValue(mockBuilder);

    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    } as any);

    vi.mocked(fetchEarnedBadges).mockResolvedValue([]);
    vi.mocked(getXpEarnedSummary).mockResolvedValue({ today: 0, thisWeek: 0 });
    vi.mocked(awardPoints).mockResolvedValue(100);
    vi.mocked(checkBadgeUnlock).mockResolvedValue([]);
  });

  describe('GET /api/gamification', () => {
    it('returns gamification stats for user', async () => {
      mockResult = {
        data: {
          total_points: 150,
          lifetime_points: 150,
          current_level: 2,
          current_streak: 5,
          longest_streak: 10,
          last_activity_at: '2026-06-18',
        },
        error: null,
      };

      const req = new NextRequest('http://localhost/api/gamification');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.totalPoints).toBe(150);
      expect(json.streak.current).toBe(5);
    });
  });

  describe('POST /api/gamification', () => {
    it('processes check-in activity dynamic action successfully', async () => {
      const req = new NextRequest('http://localhost/api/gamification', {
        method: 'POST',
        body: JSON.stringify({ action: 'streak_day' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.pointsAwarded).toBe(100);
      expect(awardPoints).toHaveBeenCalledWith('test-game-user', 'streak_day');
    });

    it('rejects invalid action name', async () => {
      const req = new NextRequest('http://localhost/api/gamification', {
        method: 'POST',
        body: JSON.stringify({ action: 'invalid_action_name' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });
});
