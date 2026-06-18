/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET, PUT } from '../route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/features/community/services/community-profile.service', () => ({
  getVisibilitySettings: vi.fn().mockResolvedValue({
    optIn: true,
    leaderboardOptIn: true,
    publicProfileVisibility: 'public',
    bio: 'Test bio',
  }),
  updateCommunitySettings: vi.fn().mockResolvedValue(undefined),
}));

describe('Settings API Endpoint', () => {
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

  describe('GET /api/community/settings', () => {
    it('returns 401 when unauthorized', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      const req = new NextRequest('http://localhost/api/community/settings');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns settings successfully', async () => {
      const req = new NextRequest('http://localhost/api/community/settings');
      const res = await GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.optIn).toBe(true);
      expect(json.bio).toBe('Test bio');
    });
  });

  describe('PUT /api/community/settings', () => {
    it('updates user settings when input is valid', async () => {
      const payload = {
        optIn: true,
        leaderboardOptIn: false,
        publicProfileVisibility: 'hidden',
        bio: 'Updated bio',
      };

      const req = new NextRequest('http://localhost/api/community/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const res = await PUT(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.publicProfileVisibility).toBe('hidden');
      expect(json.bio).toBe('Updated bio');
    });

    it('rejects invalid fields with 400', async () => {
      const payload = {
        optIn: 'not-a-boolean',
        leaderboardOptIn: true,
        publicProfileVisibility: 'invalid-visibility',
        bio: 'Long bio'.repeat(100), // Exceeds 200 character limit
      };

      const req = new NextRequest('http://localhost/api/community/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const res = await PUT(req);
      expect(res.status).toBe(400);
    });
  });
});
