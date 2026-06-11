import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  getUserLevel,
  awardPoints,
  checkBadgeUnlock,
  fetchEarnedBadges,
  fetchTotalPoints,
} from '../points.service';
import { ACTION_TO_BADGE, BADGE_MAP } from '@/features/gamification/data/badges';
import type { GamificationAction } from '@/features/gamification/types/gamification.types';

// Global mock result that tests can customize before invoking functions
let mockResult: { data: unknown; error: { message: string } | null } = { data: null, error: null };

const mockBuilder = {
  insert: vi.fn().mockImplementation(function (this: unknown) {
    return this;
  }),
  select: vi.fn().mockImplementation(function (this: unknown) {
    return this;
  }),
  eq: vi.fn().mockImplementation(function (this: unknown) {
    return this;
  }),
  order: vi.fn().mockImplementation(function (this: unknown) {
    return this;
  }),
  limit: vi.fn().mockImplementation(function (this: unknown) {
    return this;
  }),
  then: vi.fn().mockImplementation(function (this: unknown, onfulfilled: (value: unknown) => unknown) {
    return Promise.resolve(mockResult).then(onfulfilled);
  }),
};

vi.mock('@/lib/supabase/client', () => {
  return {
    createClient: () => ({
      from: vi.fn().mockReturnValue(mockBuilder),
    }),
  };
});

describe('Points & Badge Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResult = { data: null, error: null };
  });

  // ---------------------------------------------------------------------------
  // getUserLevel (Pure Function) Tests
  // ---------------------------------------------------------------------------
  describe('getUserLevel', () => {
    it('should clamp negative points to 0 and return Seedling', () => {
      const level = getUserLevel(-50);
      expect(level).toEqual({
        name: 'Seedling',
        rank: 1,
        minPoints: 0,
        maxPoints: 100,
        progress: 0,
      });
    });

    it('should return Seedling level for 0 points', () => {
      const level = getUserLevel(0);
      expect(level).toEqual({
        name: 'Seedling',
        rank: 1,
        minPoints: 0,
        maxPoints: 100,
        progress: 0,
      });
    });

    it('should calculate correct progress for Seedling (e.g., 50 points = 50%)', () => {
      const level = getUserLevel(50);
      expect(level).toEqual({
        name: 'Seedling',
        rank: 1,
        minPoints: 0,
        maxPoints: 100,
        progress: 0.5,
      });
    });

    it('should transition to Sprout at 100 points', () => {
      const level = getUserLevel(100);
      expect(level).toEqual({
        name: 'Sprout',
        rank: 2,
        minPoints: 100,
        maxPoints: 300,
        progress: 0,
      });
    });

    it('should calculate correct progress for Sprout (e.g., 200 points = 50%)', () => {
      const level = getUserLevel(200);
      expect(level).toEqual({
        name: 'Sprout',
        rank: 2,
        minPoints: 100,
        maxPoints: 300,
        progress: 0.5,
      });
    });

    it('should transition to Sapling at 300 points', () => {
      const level = getUserLevel(300);
      expect(level).toEqual({
        name: 'Sapling',
        rank: 3,
        minPoints: 300,
        maxPoints: 600,
        progress: 0,
      });
    });

    it('should transition to Tree at 600 points', () => {
      const level = getUserLevel(600);
      expect(level).toEqual({
        name: 'Tree',
        rank: 4,
        minPoints: 600,
        maxPoints: 1000,
        progress: 0,
      });
    });

    it('should transition to Forest at 1000 points and show max progress', () => {
      const level = getUserLevel(1000);
      expect(level).toEqual({
        name: 'Forest',
        rank: 5,
        minPoints: 1000,
        maxPoints: null,
        progress: 1,
      });
    });

    it('should keep Forest level with max progress for >1000 points', () => {
      const level = getUserLevel(2500);
      expect(level).toEqual({
        name: 'Forest',
        rank: 5,
        minPoints: 1000,
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
      mockResult = { data: null, error: null };
      await expect(awardPoints('user-123', 'complete_assessment', 50)).resolves.not.toThrow();
      expect(mockBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          action: 'complete_assessment',
          points: 50,
        })
      );
    });

    it('should throw an error when database insertion fails', async () => {
      mockResult = { data: null, error: { message: 'Database insert failed' } };
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
      mockResult = {
        data: [{ badge_slug: 'first_assessment' }],
        error: null,
      };

      const result = await checkBadgeUnlock('user-123', 'complete_assessment');
      expect(result).toEqual([]);
      expect(mockBuilder.select).toHaveBeenCalledWith('badge_slug');
    });

    it('should unlock badge, insert to database, award points, and return definition if not earned yet', async () => {
      // 1. First select returns empty array (not earned yet)
      // 2. Insert succeeds
      // 3. awardPoints succeeds
      mockResult = { data: [], error: null };

      const badgeSlug = ACTION_TO_BADGE.get('complete_assessment');
      expect(badgeSlug).toBeDefined();
      const badgeDef = BADGE_MAP.get(badgeSlug!);
      expect(badgeDef).toBeDefined();

      const result = await checkBadgeUnlock('user-123', 'complete_assessment');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(badgeDef);

      expect(mockBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          badge_slug: badgeSlug,
          points_awarded: badgeDef?.pointValue,
        })
      );
    });

    it('should return empty array if checking existing badges fails', async () => {
      mockResult = { data: null, error: { message: 'DB fetch failed' } };
      const result = await checkBadgeUnlock('user-123', 'complete_assessment');
      expect(result).toEqual([]);
    });

    it('should return empty array if badge insertion fails', async () => {
      // Set up: first mock call (select) succeeds with empty list
      // But we will mock the insert to fail.
      // Wait, since both select and insert use the same `mockResult` in our simple promise implementation,
      // let's dynamically change `mockResult` inside a mock implementation of `insert`.
      mockResult = { data: [], error: null }; // for select
      mockBuilder.insert.mockImplementationOnce(function (this: unknown) {
        mockResult = { data: null, error: { message: 'Insert failed' } };
        return this;
      });

      const result = await checkBadgeUnlock('user-123', 'complete_assessment');
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // fetchEarnedBadges Tests
  // ---------------------------------------------------------------------------
  describe('fetchEarnedBadges', () => {
    it('should fetch and map user badges correctly', async () => {
      const rawRow = {
        badge_slug: 'first_assessment',
        earned_at: '2026-06-11T14:00:00Z',
        points_awarded: 50,
      };
      mockResult = { data: [rawRow], error: null };

      const badges = await fetchEarnedBadges('user-123');
      expect(badges).toHaveLength(1);
      expect(badges[0]).toEqual({
        badgeSlug: 'first_assessment',
        earnedAt: '2026-06-11T14:00:00Z',
        pointValue: 50,
      });
    });

    it('should throw an error if database fetch fails', async () => {
      mockResult = { data: null, error: { message: 'DB fetch failed' } };
      await expect(fetchEarnedBadges('user-123')).rejects.toThrow(
        'Failed to fetch badges: DB fetch failed'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // fetchTotalPoints Tests
  // ---------------------------------------------------------------------------
  describe('fetchTotalPoints', () => {
    it('should fetch and sum all points correctly', async () => {
      mockResult = {
        data: [{ points: 50 }, { points: 100 }, { points: 20 }],
        error: null,
      };

      const points = await fetchTotalPoints('user-123');
      expect(points).toBe(170);
    });

    it('should return 0 if no points records are returned', async () => {
      mockResult = { data: [], error: null };
      const points = await fetchTotalPoints('user-123');
      expect(points).toBe(0);
    });

    it('should throw an error if database fetch fails', async () => {
      mockResult = { data: null, error: { message: 'DB fetch failed' } };
      await expect(fetchTotalPoints('user-123')).rejects.toThrow(
        'Failed to fetch points: DB fetch failed'
      );
    });
  });
});
