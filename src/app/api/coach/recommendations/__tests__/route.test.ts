/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET, POST, PUT, DELETE } from '../route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { clearRateLimitStore } from '@/lib/rate-limiter';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Coach Recommendations API Route', () => {
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
    order: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    insert: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    update: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    delete: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    limit: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    maybeSingle: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    single: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    then: vi.fn().mockImplementation(function (this: any, onfulfilled: any) {
      return Promise.resolve({ data: mockResult.data, error: mockResult.error }).then(onfulfilled);
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearRateLimitStore();
    mockResult = { data: [], error: null };
    mockGetUser.mockResolvedValue({ data: { user: { id: 'test-coach-user' } }, error: null });
    mockFrom.mockReturnValue(mockBuilder);

    mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
      return Promise.resolve({ data: mockResult.data, error: mockResult.error }).then(onfulfilled);
    });

    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    } as any);
  });

  describe('GET /api/coach/recommendations', () => {
    it('returns existing recommendations', async () => {
      mockResult = {
        data: [{ id: 'rec-1', title: 'Rec 1', status: 'pending' }],
        error: null,
      };

      const req = new NextRequest('http://localhost/api/coach/recommendations');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.length).toBe(1);
    });

    it('seeds default recommendations when empty', async () => {
      // 1. Fetch current recs (empty list)
      // 2. Fetch latest assessment (null)
      // 3. Insert formatted default seeds
      let queryIdx = 0;
      mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
        queryIdx++;
        let res = { data: null as any, error: null };
        if (queryIdx === 1) {
          res = { data: [], error: null }; // empty existing
        } else if (queryIdx === 2) {
          res = { data: null, error: null }; // no assessment baseline
        } else if (queryIdx === 3) {
          res = { data: [{ id: 'seeded-1', title: 'Practice Mindful Shopping' }], error: null }; // insert seeds
        }
        return Promise.resolve(res).then(onfulfilled);
      });

      const req = new NextRequest('http://localhost/api/coach/recommendations');
      const res = await GET(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json[0].title).toContain('Shopping');
    });
  });

  describe('POST /api/coach/recommendations', () => {
    it('creates custom recommendation', async () => {
      mockResult = {
        data: { id: 'rec-custom', title: 'Commute' },
        error: null,
      };

      const req = new NextRequest('http://localhost/api/coach/recommendations', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Custom Commute',
          description: 'Ride sharing weekly',
          priority: 'medium',
          estimated_savings: 120,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.id).toBe('rec-custom');
    });

    it('rejects invalid payload', async () => {
      const req = new NextRequest('http://localhost/api/coach/recommendations', {
        method: 'POST',
        body: JSON.stringify({ title: 'A' }), // Title too short, missing fields
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/coach/recommendations', () => {
    it('verifies ownership and updates status', async () => {
      let queryIdx = 0;
      mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
        queryIdx++;
        let res = { data: null as any, error: null };
        if (queryIdx === 1) {
          res = { data: { user_id: 'test-coach-user' }, error: null }; // ownership check
        } else if (queryIdx === 2) {
          res = { data: { id: 'rec-uuid', status: 'completed' }, error: null }; // update result
        }
        return Promise.resolve(res).then(onfulfilled);
      });

      const req = new NextRequest('http://localhost/api/coach/recommendations', {
        method: 'PUT',
        body: JSON.stringify({
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'completed',
        }),
      });

      const res = await PUT(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('completed');
    });

    it('rejects updates if not the owner', async () => {
      mockResult = { data: { user_id: 'other-user' }, error: null }; // ownership check

      const req = new NextRequest('http://localhost/api/coach/recommendations', {
        method: 'PUT',
        body: JSON.stringify({
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'completed',
        }),
      });

      const res = await PUT(req);
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/coach/recommendations', () => {
    it('rejects invalid query ID UUID format', async () => {
      const req = new NextRequest(
        'http://localhost/api/coach/recommendations?id=invalid-uuid-string',
        {
          method: 'DELETE',
        },
      );

      const res = await DELETE(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.message).toContain('Invalid recommendation ID format');
    });

    it('deletes successfully for owner', async () => {
      let queryIdx = 0;
      mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
        queryIdx++;
        let res = { data: null as any, error: null };
        if (queryIdx === 1) {
          res = { data: { user_id: 'test-coach-user' }, error: null }; // ownership check
        } else if (queryIdx === 2) {
          res = { data: null, error: null }; // delete query
        }
        return Promise.resolve(res).then(onfulfilled);
      });

      const req = new NextRequest(
        'http://localhost/api/coach/recommendations?id=550e8400-e29b-41d4-a716-446655440000',
        {
          method: 'DELETE',
        },
      );

      const res = await DELETE(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toContain('deleted successfully');
    });
  });
});
