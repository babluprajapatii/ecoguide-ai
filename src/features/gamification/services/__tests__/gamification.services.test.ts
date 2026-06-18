/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLevel, getNextLevel, getProgressToNextLevel } from '../level.service';
import { evaluateStreak } from '../streak.service';
import { getXpEarnedSummary, getProgressionHistory } from '../gamification-analytics.service';

// Mock Supabase
const dbStore: Record<string, { data: any; error: any }> = {
  points_transactions: { data: [], error: null },
  user_points: { data: null, error: null },
};

const mockBuilder = {
  select: vi.fn().mockImplementation(function (this: any) {
    return this;
  }),
  eq: vi.fn().mockImplementation(function (this: any) {
    return this;
  }),
  order: vi.fn().mockImplementation(function (this: any) {
    return this;
  }),
  gte: vi.fn().mockImplementation(function (this: any) {
    return this;
  }),
  maybeSingle: vi.fn().mockImplementation(function (this: any) {
    return Promise.resolve({ data: dbStore.user_points.data, error: dbStore.user_points.error });
  }),
  then: vi.fn().mockImplementation(function (this: any, onfulfilled: any) {
    const table = this.table;
    const result = { data: dbStore[table]?.data || [], error: dbStore[table]?.error || null };
    return Promise.resolve(result).then(onfulfilled);
  }),
};

vi.mock('@/lib/supabase/server', () => {
  return {
    createClient: () => ({
      from: vi.fn().mockImplementation((table: string) => {
        (mockBuilder as any).table = table;
        return mockBuilder;
      }),
    }),
  };
});

describe('Level Service', () => {
  it('should return rank 1 (Eco Beginner) for 0 points', () => {
    const lvl = getLevel(0);
    expect(lvl.rank).toBe(1);
    expect(lvl.name).toBe('Eco Beginner');
    expect(lvl.progress).toBe(0);
  });

  it('should calculate level 5 (Eco Advocate) with 1200 points', () => {
    const lvl = getLevel(1200);
    expect(lvl.rank).toBe(5);
    // next level is at 1500, range 1000 - 1500, progress should be 200/500 = 40%
    expect(lvl.progress).toBeCloseTo(0.4);
  });

  it('should return next level rank correctly', () => {
    expect(getNextLevel(0)).toBe(2);
    expect(getNextLevel(5500)).toBeNull(); // Max level reached
  });

  it('should return progress to next level', () => {
    expect(getProgressToNextLevel(1200)).toBeCloseTo(0.4);
  });
});

describe('Streak Service', () => {
  it('should initiate streak to 1 if last activity is null', () => {
    const res = evaluateStreak(null, 0, 0);
    expect(res.currentStreak).toBe(1);
    expect(res.status).toBe('reset');
  });

  it('should maintain streak if activity is on the same day', () => {
    const now = new Date().toISOString();
    const res = evaluateStreak(now, 5, 5);
    expect(res.currentStreak).toBe(5);
    expect(res.status).toBe('same_day');
  });

  it('should increment streak if activity is on the next day', () => {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const res = evaluateStreak(yesterday.toISOString(), 3, 3);
    expect(res.currentStreak).toBe(4);
    expect(res.longestStreak).toBe(4);
    expect(res.status).toBe('next_day');
  });

  it('should reset streak to 1 if there is a gap > 1 day', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3);
    const res = evaluateStreak(threeDaysAgo.toISOString(), 5, 8);
    expect(res.currentStreak).toBe(1);
    expect(res.longestStreak).toBe(8); // longest is preserved
    expect(res.status).toBe('reset');
  });
});

describe('Gamification Analytics Service', () => {
  beforeEach(() => {
    dbStore.points_transactions.data = [];
    dbStore.user_points.data = null;
  });

  it('should return correct daily/weekly summaries', async () => {
    const now = new Date().toISOString();
    dbStore.points_transactions.data = [
      { points: 20, awarded_at: now },
      { points: 50, awarded_at: now },
    ];

    const summary = await getXpEarnedSummary('user-123');
    expect(summary.today).toBe(70);
    expect(summary.thisWeek).toBe(70);
  });

  it('should calculate progression history over time', async () => {
    const t1 = new Date();
    t1.setUTCDate(t1.getUTCDate() - 2);
    const t2 = new Date();
    t2.setUTCDate(t2.getUTCDate() - 1);

    dbStore.points_transactions.data = [
      { points: 100, awarded_at: t1.toISOString() },
      { points: 200, awarded_at: t2.toISOString() },
    ];
    dbStore.user_points.data = { total_points: 300 };

    const history = await getProgressionHistory('user-123', 5);
    expect(history).toHaveLength(6); // 5 days ago to today = 6 data points
    // last data point should have total points = 300 (level 3)
    expect(history[5]?.totalXpAccumulated).toBe(300);
    expect(history[5]?.level).toBe(3);
  });
});
