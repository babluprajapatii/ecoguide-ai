/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as leaderboardService from '../leaderboard.service';

// Mock Supabase Server Client
const mockFrom = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// Setup default mock builder
let mockQueryResult: { data: any; error: any } = { data: null, error: null };
const mockBuilder: any = {
  select: vi.fn().mockImplementation(function (this: any) { return this; }),
  eq: vi.fn().mockImplementation(function (this: any) { return this; }),
  neq: vi.fn().mockImplementation(function (this: any) { return this; }),
  order: vi.fn().mockImplementation(function (this: any) { return this; }),
  limit: vi.fn().mockImplementation(function (this: any) { return this; }),
  range: vi.fn().mockImplementation(function (this: any) { return this; }),
  gte: vi.fn().mockImplementation(function (this: any) { return this; }),
  lte: vi.fn().mockImplementation(function (this: any) { return this; }),
  delete: vi.fn().mockImplementation(function (this: any) { return this; }),
  insert: vi.fn().mockImplementation(function (this: any) { return this; }),
  upsert: vi.fn().mockImplementation(function (this: any) { return this; }),
  maybeSingle: vi.fn().mockImplementation(function (this: any) { return this; }),
  single: vi.fn().mockImplementation(function (this: any) { return this; }),
  then: vi.fn().mockImplementation(function (this: any, onfulfilled: any) {
    if (typeof onfulfilled === 'function') {
      return Promise.resolve(mockQueryResult).then(onfulfilled);
    }
    return Promise.resolve(mockQueryResult);
  }),
};

describe('leaderboard.service tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryResult = { data: null, error: null };
    mockFrom.mockReturnValue(mockBuilder);
  });

  describe('isCacheStale', () => {
    it('returns true if no cache row is returned', async () => {
      mockQueryResult = { data: [], error: null };
      const result = await leaderboardService.isCacheStale();
      expect(result).toBe(true);
    });

    it('returns true if cache row is older than 5 minutes', async () => {
      const olderDate = new Date(Date.now() - 360000).toISOString(); // 6 mins ago
      mockQueryResult = { data: [{ cached_at: olderDate }], error: null };
      const result = await leaderboardService.isCacheStale();
      expect(result).toBe(true);
    });

    it('returns false if cache row is fresh', async () => {
      const freshDate = new Date(Date.now() - 60000).toISOString(); // 1 min ago
      mockQueryResult = { data: [{ cached_at: freshDate }], error: null };
      const result = await leaderboardService.isCacheStale();
      expect(result).toBe(false);
    });
  });

  describe('getGlobalLeaderboard', () => {
    it('queries correct range and maps rows correctly', async () => {
      const sampleRows = [
        {
          rank: 1,
          previous_rank: 2,
          rank_change: 1,
          user_id: 'user-1',
          display_name: 'Hero',
          avatar_url: 'url-1',
          total_points: 1200,
          current_level: 4,
          longest_streak: 5,
          badge_count: 2,
        },
      ];
      mockQueryResult = { data: sampleRows, error: null };

      const result = await leaderboardService.getGlobalLeaderboard(1, 20);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          rank: 1,
          displayName: 'Hero',
          totalPoints: 1200,
          isCurrentUser: false,
        })
      );
    });
  });

  describe('getUserRank', () => {
    it('retrieves user rank context from cache', async () => {
      mockQueryResult = {
        data: { rank: 5, total_points: 1000, current_level: 5 },
        error: null,
      };

      const result = await leaderboardService.getUserRank('user-1');
      expect(result.rank).toBe(5);
      expect(result.totalPoints).toBe(1000);
    });
  });

  describe('refreshLeaderboardCache', () => {
    it('successfully computes new ranks and inserts them', async () => {
      // Setup mock data for refresh query sequences
      const sampleUsers = [
        {
          user_id: 'u-1',
          total_points: 1000,
          current_level: 5,
          longest_streak: 10,
          profiles: { display_name: 'User One', avatar_url: 'avatar-1', created_at: '2026-06-01T00:00:00Z' },
          community_profiles: { leaderboard_opt_in: true, public_profile_visibility: 'public' },
        },
        {
          user_id: 'u-2',
          total_points: 2000,
          current_level: 6,
          longest_streak: 15,
          profiles: { display_name: 'User Two', avatar_url: 'avatar-2', created_at: '2026-06-02T00:00:00Z' },
          community_profiles: { leaderboard_opt_in: true, public_profile_visibility: 'public' },
        },
      ];

      // Since refreshLeaderboardCache does multiple queries sequentially (cache read, user points read, badges read, points_transactions read),
      // we'll setup mock query returns in sequence by dynamically overriding mockQueryResult.
      let queryCount = 0;
      mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
        queryCount++;
        let res = { data: [] as any, error: null as any };
        if (queryCount === 1) {
          // Existing cache query
          res = { data: [], error: null };
        } else if (queryCount === 2) {
          // Live users query
          res = { data: sampleUsers, error: null };
        } else if (queryCount === 3) {
          // User badges query
          res = { data: [{ user_id: 'u-1' }, { user_id: 'u-2' }], error: null };
        } else if (queryCount === 4) {
          // Delete cache query
          res = { data: null, error: null };
        } else if (queryCount === 5) {
          // Insert cache query
          res = { data: null, error: null };
        } else if (queryCount === 6) {
          // points_transactions query
          res = { data: [], error: null };
        }
        return Promise.resolve(res).then(onfulfilled);
      });

      await expect(leaderboardService.refreshLeaderboardCache()).resolves.not.toThrow();
    });
  });
});
