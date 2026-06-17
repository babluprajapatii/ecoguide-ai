/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Community Preview API Route Handlers', () => {
  let mockResult: { data: any; error: any } = { data: null, error: null };
  const mockGetUser = vi.fn();
  const mockFrom = vi.fn();

  const mockBuilder: any = {
    select: vi.fn().mockImplementation(function (this: any) { return this; }),
    eq: vi.fn().mockImplementation(function (this: any) { return this; }),
    order: vi.fn().mockImplementation(function (this: any) { return this; }),
    upsert: vi.fn().mockImplementation(function (this: any) { return this; }),
    then: vi.fn().mockImplementation(function (this: any, onfulfilled: any) {
      return Promise.resolve(mockResult).then(onfulfilled);
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockResult = { data: null, error: null };
    mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });
    mockFrom.mockReturnValue(mockBuilder);

    mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
      return Promise.resolve(mockResult).then(onfulfilled);
    });

    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    } as any);
  });

  describe('GET /api/community/preview', () => {
    it('returns privacy-safe leaderboard preview of opted-in users', async () => {
      // 1st database call: community_profiles (opted-in users)
      const optedInProfiles = [
        { id: 'test-user-id', opt_in: true },
        { id: 'user-2', opt_in: true },
      ];
      // 2nd database call: completed assessments
      const assessmentsList = [
        {
          user_id: 'test-user-id',
          total_score: 3000,
          created_at: '2026-06-17T12:00:00Z',
          profiles: { display_name: 'Eco Hero 1', avatar_url: '' },
        },
        {
          user_id: 'user-2',
          total_score: 2500,
          created_at: '2026-06-17T12:00:00Z',
          profiles: { display_name: 'Eco Hero 2', avatar_url: '' },
        },
        {
          // User-3 did NOT opt in, and is not current user, so should be excluded
          user_id: 'user-3',
          total_score: 1500,
          created_at: '2026-06-17T12:00:00Z',
          profiles: { display_name: 'Secret User', avatar_url: '' },
        },
      ];

      let isOptInFetchDone = false;
      mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
        if (!isOptInFetchDone) {
          isOptInFetchDone = true;
          return Promise.resolve({ data: optedInProfiles, error: null }).then(onfulfilled);
        }
        return Promise.resolve({ data: assessmentsList, error: null }).then(onfulfilled);
      });

      const req = new NextRequest('http://localhost/api/community/preview');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.optedIn).toBe(true);
      expect(json.totalOptedInUsers).toBe(2);
      expect(json.currentUserRank).toBe(2); // user-2 has 2500 (rank 1), test-user-id has 3000 (rank 2)

      // Ensure secret user (user-3) is excluded
      const usernames = json.leaderboardPreview.map((item: any) => item.displayName);
      expect(usernames).not.toContain('Secret User');
      expect(usernames).toContain('Eco Hero 1');
      expect(usernames).toContain('Eco Hero 2');
    });

    it('always includes the current user in standings preview even if they are not opted in themselves', async () => {
      // Current user is not opted-in
      const optedInProfiles = [
        { id: 'user-2', opt_in: true },
      ];
      const assessmentsList = [
        {
          user_id: 'test-user-id', // current user, not opted-in
          total_score: 3000,
          created_at: '2026-06-17T12:00:00Z',
          profiles: { display_name: 'Self', avatar_url: '' },
        },
        {
          user_id: 'user-2',
          total_score: 2500,
          created_at: '2026-06-17T12:00:00Z',
          profiles: { display_name: 'Eco Hero 2', avatar_url: '' },
        },
      ];

      let isOptInFetchDone = false;
      mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
        if (!isOptInFetchDone) {
          isOptInFetchDone = true;
          return Promise.resolve({ data: optedInProfiles, error: null }).then(onfulfilled);
        }
        return Promise.resolve({ data: assessmentsList, error: null }).then(onfulfilled);
      });

      const req = new NextRequest('http://localhost/api/community/preview');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.optedIn).toBe(false);
      expect(json.totalOptedInUsers).toBe(1);
      expect(json.currentUserRank).toBe(2); // user-2 (rank 1), test-user-id (rank 2)

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
      mockResult = { data: null, error: null };

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
      expect(mockBuilder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-user-id',
          opt_in: true,
        }),
        { onConflict: 'id' }
      );
    });
  });
});
