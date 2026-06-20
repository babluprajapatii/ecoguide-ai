/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const mockGetNearbyRankings = vi.fn();
const mockGetUserRank = vi.fn();
const mockGetLeaderboardTotalCount = vi.fn();
const mockGetVisibilitySettings = vi.fn();
const mockUpdateCommunitySettings = vi.fn();

vi.mock('@/features/community/services/leaderboard.service', () => ({
  getNearbyRankings: (...args: any[]) => mockGetNearbyRankings(...args),
  getUserRank: (...args: any[]) => mockGetUserRank(...args),
  getLeaderboardTotalCount: (...args: any[]) => mockGetLeaderboardTotalCount(...args),
}));

vi.mock('@/features/community/services/community-profile.service', () => ({
  getVisibilitySettings: (...args: any[]) => mockGetVisibilitySettings(...args),
  updateCommunitySettings: (...args: any[]) => mockUpdateCommunitySettings(...args),
}));

describe('Community Preview API Route Handlers', () => {
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

  describe('GET /api/community/preview', () => {
    it('returns privacy-safe leaderboard preview of opted-in users', async () => {
      mockGetVisibilitySettings.mockResolvedValue({
        optIn: true,
        leaderboardOptIn: true,
        publicProfileVisibility: 'public',
        bio: '',
      });
      mockGetUserRank.mockResolvedValue({
        rank: 2,
        totalPoints: 3000,
        level: 4,
        isOptedIn: true,
      });
      mockGetLeaderboardTotalCount.mockResolvedValue(2);
      mockGetNearbyRankings.mockResolvedValue([
        {
          rank: 1,
          previousRank: null,
          rankChange: 0,
          userId: 'user-2',
          displayName: 'Eco Hero 2',
          avatarUrl: '',
          totalPoints: 2500,
          level: 4,
          levelName: 'Carbon Reducer',
          badgeCount: 0,
          longestStreak: 0,
          isCurrentUser: false,
        },
        {
          rank: 2,
          previousRank: null,
          rankChange: 0,
          userId: 'test-user-id',
          displayName: 'Eco Hero 1',
          avatarUrl: '',
          totalPoints: 3000,
          level: 4,
          levelName: 'Carbon Reducer',
          badgeCount: 0,
          longestStreak: 0,
          isCurrentUser: true,
        },
      ]);

      const req = new NextRequest('http://localhost/api/community/preview');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.optedIn).toBe(true);
      expect(json.totalOptedInUsers).toBe(2);
      expect(json.currentUserRank).toBe(2);

      const usernames = json.leaderboardPreview.map((item: any) => item.displayName);
      expect(usernames).not.toContain('Secret User');
      expect(usernames).toContain('Eco Hero 1');
      expect(usernames).toContain('Eco Hero 2');
    });

    it('always includes the current user in standings preview even if they are not opted in themselves', async () => {
      mockGetVisibilitySettings.mockResolvedValue({
        optIn: false,
        leaderboardOptIn: false,
        publicProfileVisibility: 'hidden',
        bio: '',
      });
      mockGetUserRank.mockResolvedValue({
        rank: 2,
        totalPoints: 3000,
        level: 4,
        isOptedIn: false,
      });
      mockGetLeaderboardTotalCount.mockResolvedValue(1);
      mockGetNearbyRankings.mockResolvedValue([
        {
          rank: 1,
          previousRank: null,
          rankChange: 0,
          userId: 'user-2',
          displayName: 'Eco Hero 2',
          avatarUrl: '',
          totalPoints: 2500,
          level: 4,
          levelName: 'Carbon Reducer',
          badgeCount: 0,
          longestStreak: 0,
          isCurrentUser: false,
        },
        {
          rank: 2,
          previousRank: null,
          rankChange: 0,
          userId: 'test-user-id',
          displayName: 'Self',
          avatarUrl: '',
          totalPoints: 3000,
          level: 4,
          levelName: 'Carbon Reducer',
          badgeCount: 0,
          longestStreak: 0,
          isCurrentUser: true,
        },
      ]);

      const req = new NextRequest('http://localhost/api/community/preview');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.optedIn).toBe(false);
      expect(json.totalOptedInUsers).toBe(1);
      expect(json.currentUserRank).toBe(2);

      const users = json.leaderboardPreview.map((item: any) => item.displayName);
      expect(users).toContain('Self');
    });
  });

  describe('POST /api/community/preview', () => {
    it('returns 400 for missing opt_in value', async () => {
      const req = new NextRequest('http://localhost/api/community/preview', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ message: 'Missing opt_in field.' });
    });

    it('updates privacy profile successfully', async () => {
      mockGetVisibilitySettings.mockResolvedValue({
        optIn: false,
        leaderboardOptIn: false,
        publicProfileVisibility: 'hidden',
        bio: 'Old bio',
      });
      mockUpdateCommunitySettings.mockResolvedValue(undefined);

      const req = new NextRequest('http://localhost/api/community/preview', {
        method: 'POST',
        body: JSON.stringify({ opt_in: true }),
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        message: 'Community profile updated successfully.',
        opt_in: true,
      });
      expect(mockUpdateCommunitySettings).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({
          optIn: true,
          leaderboardOptIn: true,
          publicProfileVisibility: 'public',
        }),
      );
    });
  });
});
