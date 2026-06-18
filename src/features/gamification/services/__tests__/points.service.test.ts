/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  getUserLevel,
  awardPoints,
  checkBadgeUnlock,
  fetchEarnedBadges,
  fetchTotalPoints,
} from '../points.service';
import type { GamificationAction } from '@/features/gamification/types/gamification.types';

// Multi-table mock setup
const dbStore: any = {
  points_transactions: { data: [], error: null },
  user_points: { data: null, error: null },
  user_badges: { data: [], error: null },
  badges: { data: [], error: null },
};

const createMockBuilder = (table: string) => {
  const builder: any = {
    insert: vi.fn().mockImplementation(function (this: any, val: any) {
      if (Array.isArray(dbStore[table].data)) {
        dbStore[table].data.push(val);
      } else {
        dbStore[table].data = val;
      }
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
    gte: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    update: vi.fn().mockImplementation(function (this: any, val: any) {
      dbStore[table].data = { ...dbStore[table].data, ...val };
      return this;
    }),
    maybeSingle: vi.fn().mockImplementation(function (this: any) {
      return Promise.resolve({ data: dbStore[table].data, error: dbStore[table].error });
    }),
    single: vi.fn().mockImplementation(function (this: any) {
      return Promise.resolve({ data: dbStore[table].data, error: dbStore[table].error });
    }),
    then: vi.fn().mockImplementation(function (this: any, onfulfilled: any) {
      const result = { data: dbStore[table].data, error: dbStore[table].error };
      return Promise.resolve(result).then(onfulfilled);
    }),
  };
  return builder;
};

const mockBuilders: Record<string, any> = {};

vi.mock('@/lib/supabase/server', () => {
  return {
    createClient: () => ({
      from: vi.fn().mockImplementation((table: string) => {
        if (!mockBuilders[table]) {
          mockBuilders[table] = createMockBuilder(table);
        }
        return mockBuilders[table];
      }),
    }),
  };
});

describe('Points & Badge Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset DB state
    dbStore.points_transactions = { data: [], error: null };
    dbStore.user_points = { data: null, error: null };
    dbStore.user_badges = { data: [], error: null };
    dbStore.badges = { data: [], error: null };
    Object.keys(mockBuilders).forEach((k) => delete mockBuilders[k]);
  });

  // ---------------------------------------------------------------------------
  // getUserLevel (Pure Function) Tests
  // ---------------------------------------------------------------------------
  describe('getUserLevel', () => {
    it('should clamp negative points to 0 and return Eco Beginner', () => {
      const level = getUserLevel(-50);
      expect(level).toEqual({
        name: 'Eco Beginner',
        rank: 1,
        minPoints: 0,
        maxPoints: 100,
        progress: 0,
      });
    });

    it('should return Eco Beginner level for 0 points', () => {
      const level = getUserLevel(0);
      expect(level).toEqual({
        name: 'Eco Beginner',
        rank: 1,
        minPoints: 0,
        maxPoints: 100,
        progress: 0,
      });
    });

    it('should calculate correct progress for Eco Beginner (e.g., 50 points = 50%)', () => {
      const level = getUserLevel(50);
      expect(level).toEqual({
        name: 'Eco Beginner',
        rank: 1,
        minPoints: 0,
        maxPoints: 100,
        progress: 0.5,
      });
    });

    it('should transition to Green Explorer at 100 points', () => {
      const level = getUserLevel(100);
      expect(level).toEqual({
        name: 'Green Explorer',
        rank: 2,
        minPoints: 100,
        maxPoints: 300,
        progress: 0,
      });
    });

    it('should calculate correct progress for Green Explorer (e.g., 200 points = 50%)', () => {
      const level = getUserLevel(200);
      expect(level).toEqual({
        name: 'Green Explorer',
        rank: 2,
        minPoints: 100,
        maxPoints: 300,
        progress: 0.5,
      });
    });

    it('should transition to Climate Learner at 300 points', () => {
      const level = getUserLevel(300);
      expect(level).toEqual({
        name: 'Climate Learner',
        rank: 3,
        minPoints: 300,
        maxPoints: 600,
        progress: 0,
      });
    });

    it('should transition to Carbon Reducer at 600 points', () => {
      const level = getUserLevel(600);
      expect(level).toEqual({
        name: 'Carbon Reducer',
        rank: 4,
        minPoints: 600,
        maxPoints: 1000,
        progress: 0,
      });
    });

    it('should transition to Net-Zero Legend at 5000 points and show max progress', () => {
      const level = getUserLevel(5000);
      expect(level).toEqual({
        name: 'Net-Zero Legend',
        rank: 10,
        minPoints: 5000,
        maxPoints: null,
        progress: 1,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // awardPoints Tests
  // ---------------------------------------------------------------------------
  describe('awardPoints', () => {
    it('should successfully award points when database insertion succeeds', async () => {
      const points = await awardPoints('user-123', 'complete_assessment', 100);
      expect(points).toBe(100);
      expect(dbStore.points_transactions.data).toHaveLength(1);
      expect(dbStore.points_transactions.data[0]).toEqual(
        expect.objectContaining({
          user_id: 'user-123',
          action: 'complete_assessment',
          points: 100,
        })
      );
    });

    it('should enforce cooldown limit for coaching messages (max 50 XP/day)', async () => {
      // Setup: user already earned 40 XP today for coach messages
      dbStore.points_transactions.data = [
        { points: 10, action: 'use_coach', awarded_at: new Date().toISOString() },
        { points: 10, action: 'use_coach', awarded_at: new Date().toISOString() },
        { points: 10, action: 'use_coach', awarded_at: new Date().toISOString() },
        { points: 10, action: 'use_coach', awarded_at: new Date().toISOString() },
      ];

      // Awarding 10 XP works (reaches 50 XP limit)
      const pointsAwarded1 = await awardPoints('user-123', 'use_coach', 10);
      expect(pointsAwarded1).toBe(10);

      // Next award gets capped to 0
      const pointsAwarded2 = await awardPoints('user-123', 'use_coach', 10);
      expect(pointsAwarded2).toBe(0);
    });

    it('should throw an error when database transaction fails', async () => {
      dbStore.points_transactions = { data: [], error: { message: 'Database insert failed' } };
      await expect(awardPoints('user-123', 'complete_assessment', 50)).rejects.toThrow(
        'Failed to award points: Database insert failed'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // checkBadgeUnlock Tests
  // ---------------------------------------------------------------------------
  describe('checkBadgeUnlock', () => {
    it('should return empty array if action does not map to a badge', async () => {
      const result = await checkBadgeUnlock('user-123', 'unknown_action' as GamificationAction);
      expect(result).toEqual([]);
    });

    it('should return empty array if badge is already earned by user', async () => {
      // Mock badge definitions in DB
      dbStore.badges.data = [
        { id: 'badge-123', slug: 'first_assessment' }
      ];
      // Mock already earned
      dbStore.user_badges.data = [
        { badge_id: 'badge-123' }
      ];

      const result = await checkBadgeUnlock('user-123', 'complete_assessment');
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // fetchEarnedBadges Tests
  // ---------------------------------------------------------------------------
  describe('fetchEarnedBadges', () => {
    it('should fetch and map user badges correctly', async () => {
      dbStore.user_badges.data = [
        {
          earned_at: '2026-06-11T14:00:00Z',
          badge_id: 'badge-123',
          badges: {
            slug: 'first_assessment',
            xp_reward: 50,
          },
        },
      ];

      const badges = await fetchEarnedBadges('user-123');
      expect(badges).toHaveLength(1);
      expect(badges[0]).toEqual({
        badgeId: 'badge-123',
        badgeSlug: 'first_assessment',
        earnedAt: '2026-06-11T14:00:00Z',
        pointValue: 50,
      });
    });

    it('should throw an error if database fetch fails', async () => {
      dbStore.user_badges = { data: null, error: { message: 'DB fetch failed' } };
      await expect(fetchEarnedBadges('user-123')).rejects.toThrow(
        'Failed to fetch badges: DB fetch failed'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // fetchTotalPoints Tests
  // ---------------------------------------------------------------------------
  describe('fetchTotalPoints', () => {
    it('should fetch total points correctly', async () => {
      dbStore.user_points.data = [{ total_points: 170 }];

      const points = await fetchTotalPoints('user-123');
      expect(points).toBe(170);
    });

    it('should return 0 if no points record is found', async () => {
      dbStore.user_points.data = null;
      const points = await fetchTotalPoints('user-123');
      expect(points).toBe(0);
    });

    it('should throw an error if database fetch fails', async () => {
      dbStore.user_points = { data: null, error: { message: 'DB fetch failed' } };
      await expect(fetchTotalPoints('user-123')).rejects.toThrow(
        'Failed to fetch points: DB fetch failed'
      );
    });
  });
});
