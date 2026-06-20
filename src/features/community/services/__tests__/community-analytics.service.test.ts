/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as communityAnalyticsService from '../community-analytics.service';

const mockFrom = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

let mockQueryResult: { data: any; error: any; count?: number } = { data: null, error: null };
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
  gte: vi.fn().mockImplementation(function (this: any) {
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
    if (typeof onfulfilled === 'function') {
      return Promise.resolve(mockQueryResult).then(onfulfilled);
    }
    return Promise.resolve(mockQueryResult);
  }),
};

describe('community-analytics.service tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryResult = { data: null, error: null };
    mockFrom.mockReturnValue(mockBuilder);
  });

  describe('isCacheStale', () => {
    it('returns true if no stats cache exists', async () => {
      mockQueryResult = { data: null, error: null };
      const result = await communityAnalyticsService.isCacheStale();
      expect(result).toBe(true);
    });

    it('returns true if cache is older than 10 minutes', async () => {
      const olderDate = new Date(Date.now() - 700000).toISOString(); // 11 mins ago
      mockQueryResult = { data: { cached_at: olderDate }, error: null };
      const result = await communityAnalyticsService.isCacheStale();
      expect(result).toBe(true);
    });

    it('returns false if cache is fresh', async () => {
      const freshDate = new Date(Date.now() - 300000).toISOString(); // 5 mins ago
      mockQueryResult = { data: { cached_at: freshDate }, error: null };
      const result = await communityAnalyticsService.isCacheStale();
      expect(result).toBe(false);
    });
  });

  describe('getCommunityStats', () => {
    it('returns formatted cache data when fresh', async () => {
      const sampleStats = {
        total_users: 10,
        active_users_7d: 5,
        total_xp_earned: 5000,
        assessments_completed: 15,
        simulations_saved: 3,
        badges_earned: 8,
        avg_carbon_footprint: 25.5,
        top_carbon_saver_user_id: 'u-1',
        top_carbon_saver_name: 'Saver',
        top_carbon_saver_score: 12.5,
        most_improved_user_id: 'u-2',
        most_improved_name: 'Improved',
        most_improved_reduction: 14.2,
        longest_streak_user_id: 'u-3',
        longest_streak_name: 'Streaker',
        longest_streak_days: 10,
        cached_at: new Date().toISOString(),
      };
      mockQueryResult = { data: sampleStats, error: null };

      const stats = await communityAnalyticsService.getCommunityStats();
      expect(stats).not.toBeNull();
      expect(stats?.totalUsers).toBe(10);
      expect(stats?.topCarbonSaver.displayName).toBe('Saver');
      expect(stats?.mostImprovedUser.value).toBe(14.2);
    });
  });

  describe('refreshCommunityStats', () => {
    it('queries and aggregates data successfully', async () => {
      let queryIdx = 0;
      mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
        queryIdx++;
        let res: any = { data: [] as any, error: null as any, count: 0 };
        if (queryIdx === 1) {
          // profiles count
          res = { data: null, error: null, count: 15 } as any;
        } else if (queryIdx === 2) {
          // points_transactions 7d
          res = { data: [{ user_id: 'u-1' }], error: null };
        } else if (queryIdx === 3) {
          // user_points total xp
          res = { data: [{ total_points: 1000 }, { total_points: 2000 }], error: null };
        } else if (queryIdx === 4) {
          // assessments completed count
          res = { data: null, error: null, count: 8 } as any;
        } else if (queryIdx === 5) {
          // saved_simulations count
          res = { data: null, error: null, count: 5 } as any;
        } else if (queryIdx === 6) {
          // user_badges count
          res = { data: null, error: null, count: 12 } as any;
        } else if (queryIdx === 7) {
          // completed assessments list
          res = {
            data: [
              {
                user_id: 'u-1',
                total_score: 50,
                created_at: '2026-06-01T00:00:00Z',
                profiles: { display_name: 'User One' },
                community_profiles: { opt_in: true, public_profile_visibility: 'public' },
              },
            ],
            error: null,
          };
        } else if (queryIdx === 8) {
          // user streak data
          res = {
            data: [
              {
                user_id: 'u-1',
                longest_streak: 5,
                profiles: { display_name: 'User One' },
                community_profiles: { opt_in: true, public_profile_visibility: 'public' },
              },
            ],
            error: null,
          };
        } else if (queryIdx === 9) {
          // cache upsert
          res = { data: null, error: null };
        }
        return Promise.resolve(res).then(onfulfilled);
      });

      await expect(communityAnalyticsService.refreshCommunityStats()).resolves.not.toThrow();
    });
  });
});
