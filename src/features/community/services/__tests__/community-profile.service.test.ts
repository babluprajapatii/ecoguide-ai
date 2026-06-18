/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as communityProfileService from '../community-profile.service';

const mockFrom = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

let mockQueryResult: { data: any; error: any } = { data: null, error: null };
const mockBuilder: any = {
  select: vi.fn().mockImplementation(function (this: any) { return this; }),
  eq: vi.fn().mockImplementation(function (this: any) { return this; }),
  upsert: vi.fn().mockImplementation(function (this: any) { return this; }),
  delete: vi.fn().mockImplementation(function (this: any) { return this; }),
  maybeSingle: vi.fn().mockImplementation(function (this: any) { return this; }),
  single: vi.fn().mockImplementation(function (this: any) { return this; }),
  then: vi.fn().mockImplementation(function (this: any, onfulfilled: any) {
    if (typeof onfulfilled === 'function') {
      return Promise.resolve(mockQueryResult).then(onfulfilled);
    }
    return Promise.resolve(mockQueryResult);
  }),
};

describe('community-profile.service tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryResult = { data: null, error: null };
    mockFrom.mockReturnValue(mockBuilder);
  });

  describe('getVisibilitySettings', () => {
    it('returns settings correctly from DB', async () => {
      mockQueryResult = {
        data: {
          opt_in: true,
          leaderboard_opt_in: true,
          public_profile_visibility: 'public',
          bio: 'Eco activist',
        },
        error: null,
      };

      const settings = await communityProfileService.getVisibilitySettings('user-1');
      expect(settings.optIn).toBe(true);
      expect(settings.publicProfileVisibility).toBe('public');
      expect(settings.bio).toBe('Eco activist');
    });

    it('returns default settings if not found in DB', async () => {
      mockQueryResult = { data: null, error: null };
      const settings = await communityProfileService.getVisibilitySettings('user-1');
      expect(settings.optIn).toBe(false);
      expect(settings.publicProfileVisibility).toBe('public');
      expect(settings.bio).toBe('');
    });
  });

  describe('getPublicProfile', () => {
    it('returns null if target profile is hidden and requester is different', async () => {
      mockQueryResult = {
        data: { public_profile_visibility: 'hidden', opt_in: true },
        error: null,
      };

      const result = await communityProfileService.getPublicProfile('user-1', 'user-2');
      expect(result).toBeNull();
    });

    it('returns profile details if requester is owner of hidden profile', async () => {
      let queryIdx = 0;
      mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
        queryIdx++;
        let res = { data: null as any, error: null };
        if (queryIdx === 1) {
          // community_profiles fetch
          res = { data: { public_profile_visibility: 'hidden', opt_in: true, bio: 'Secret bio' }, error: null };
        } else if (queryIdx === 2) {
          // profiles details
          res = { data: { display_name: 'Owner', avatar_url: 'owner-avatar' }, error: null };
        } else if (queryIdx === 3) {
          // user_points details
          res = { data: { total_points: 1200, longest_streak: 5, current_level: 4 }, error: null };
        } else if (queryIdx === 4) {
          // rank cache
          res = { data: { rank: 3 }, error: null };
        } else if (queryIdx === 5) {
          // user badges
          res = { data: [{ badges: { slug: 'eco_beginner' } }], error: null };
        }
        return Promise.resolve(res).then(onfulfilled);
      });

      const result = await communityProfileService.getPublicProfile('owner-user', 'owner-user');
      expect(result).not.toBeNull();
      expect(result?.displayName).toBe('Owner');
      expect(result?.bio).toBe('Secret bio');
      expect(result?.badgeSlugs).toContain('eco_beginner');
    });
  });

  describe('updateCommunitySettings', () => {
    it('saves settings and deletes rank cache on opt-out', async () => {
      let queryIdx = 0;
      mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
        queryIdx++;
        let res = { data: null as any, error: null };
        if (queryIdx === 1) {
          // upsert settings
          res = { data: null, error: null };
        } else if (queryIdx === 2) {
          // delete cache row
          res = { data: null, error: null };
        }
        return Promise.resolve(res).then(onfulfilled);
      });

      await expect(
        communityProfileService.updateCommunitySettings('user-1', {
          optIn: true,
          leaderboardOptIn: false, // opt out of leaderboard
          publicProfileVisibility: 'public',
          bio: 'Eco warrior',
        })
      ).resolves.not.toThrow();

      // Ensure cache delete is called when optOut is true
      expect(queryIdx).toBe(2);
    });
  });
});
