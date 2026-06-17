/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET as getHistory, DELETE as deleteHistory } from '../history/route';
import { GET as getDashboard } from '../dashboard/route';
import {
  GET as getRecs,
  POST as postRec,
  PUT as putRec,
  DELETE as deleteRec,
} from '../recommendations/route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Coach Features Integration Tests', () => {
  let mockResult: { data: any; error: any } = { data: null, error: null };
  const mockGetUser = vi.fn();
  const mockFrom = vi.fn();

  const mockBuilder: any = {
    insert: vi.fn().mockImplementation(function (this: any) { return this; }),
    select: vi.fn().mockImplementation(function (this: any) { return this; }),
    eq: vi.fn().mockImplementation(function (this: any) { return this; }),
    order: vi.fn().mockImplementation(function (this: any) { return this; }),
    limit: vi.fn().mockImplementation(function (this: any) { return this; }),
    delete: vi.fn().mockImplementation(function (this: any) { return this; }),
    update: vi.fn().mockImplementation(function (this: any) { return this; }),
    maybeSingle: vi.fn().mockImplementation(function (this: any) { return this; }),
    single: vi.fn().mockImplementation(function (this: any) { return this; }),
    then: vi.fn().mockImplementation(function (this: any, onfulfilled: any) {
      return Promise.resolve({ data: mockResult.data, error: mockResult.error }).then(onfulfilled);
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockResult = { data: null, error: null };
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

  describe('History API (/api/coach/history)', () => {
    it('GET loads conversation history successfully', async () => {
      mockResult.data = [
        { role: 'user', message: 'Hello', created_at: '2026-06-17T12:00:00Z' },
        { role: 'assistant', message: 'Hi', created_at: '2026-06-17T12:01:00Z' },
      ];

      const req = new NextRequest('http://localhost/api/coach/history');
      const res = await getHistory(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveLength(2);
      expect(json[0].message).toBe('Hello');
    });

    it('DELETE clears chat logs', async () => {
      mockResult.data = null;

      const req = new NextRequest('http://localhost/api/coach/history', { method: 'DELETE' });
      const res = await deleteHistory(req);

      expect(res.status).toBe(200);
      expect(mockBuilder.delete).toHaveBeenCalled();
    });
  });

  describe('Dashboard stats API (/api/coach/dashboard)', () => {
    it('GET returns computed dashboard stats', async () => {
      // Simulate database queries sequentially
      let queryIdx = 0;
      mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
        let data: any = null;
        if (queryIdx === 0) {
          // conversations query
          data = [
            { created_at: '2026-06-17T12:00:00Z', role: 'user' },
            { created_at: '2026-06-16T12:00:00Z', role: 'user' },
          ];
        } else if (queryIdx === 1) {
          // recommendations breakdown query
          data = [
            { status: 'pending' },
            { status: 'completed' },
          ];
        } else if (queryIdx === 2) {
          // assessments completed query (for streak calculation)
          data = [
            { created_at: '2026-06-17T12:00:00Z' },
            { created_at: '2026-06-16T12:00:00Z' },
          ];
        }
        queryIdx++;
        return Promise.resolve({ data, error: null }).then(onfulfilled);
      });

      const req = new NextRequest('http://localhost/api/coach/dashboard');
      const res = await getDashboard(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.streak).toBeGreaterThanOrEqual(1);
      expect(json.conversationCount).toBe(2);
      expect(json.insightsCount).toBe(2);
    });
  });

  describe('Recommendations API (/api/coach/recommendations)', () => {
    it('GET loads recommendations and seeds defaults if empty', async () => {
      let firstCall = true;
      mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
        if (firstCall) {
          firstCall = false;
          // Return empty recommendations initially to trigger seeding
          return Promise.resolve({ data: [], error: null }).then(onfulfilled);
        } else {
          // Seeding inserts, or assessment select
          return Promise.resolve({ data: { transport_kg: 5000 }, error: null }).then(onfulfilled);
        }
      });

      const req = new NextRequest('http://localhost/api/coach/recommendations');
      const res = await getRecs(req);

      expect(res.status).toBe(201);
      // Verify assessments select was triggered to determine high footprint categories
      expect(mockFrom).toHaveBeenCalledWith('assessments');
    });

    it('POST creates a custom recommendation', async () => {
      mockResult.data = { id: 'new-rec-id', title: 'Plant a tree' };

      const req = new NextRequest('http://localhost/api/coach/recommendations', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Plant a tree',
          description: 'Plant a tree in your garden',
          priority: 'medium',
          estimated_savings: 50,
        }),
      });
      const res = await postRec(req);

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.title).toBe('Plant a tree');
    });

    it('PUT updates recommendation status', async () => {
      let queryIdx = 0;
      mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
        let data: any = null;
        if (queryIdx === 0) {
          // Ownership verification select
          data = { user_id: 'test-coach-user' };
        } else {
          // Update query
          data = { id: '11111111-2222-3333-4444-555555555555', status: 'completed' };
        }
        queryIdx++;
        return Promise.resolve({ data, error: null }).then(onfulfilled);
      });

      const req = new NextRequest('http://localhost/api/coach/recommendations', {
        method: 'PUT',
        body: JSON.stringify({
          id: '11111111-2222-3333-4444-555555555555',
          status: 'completed',
        }),
      });
      const res = await putRec(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('completed');
    });

    it('DELETE removes a recommendation', async () => {
      let queryIdx = 0;
      mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
        let data: any = null;
        if (queryIdx === 0) {
          // Ownership verification select
          data = { user_id: 'test-coach-user' };
        } else {
          // Delete query
          data = null;
        }
        queryIdx++;
        return Promise.resolve({ data, error: null }).then(onfulfilled);
      });

      const req = new NextRequest('http://localhost/api/coach/recommendations?id=11111111-2222-3333-4444-555555555555', {
        method: 'DELETE',
      });
      const res = await deleteRec(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toContain('deleted successfully');
    });
  });
});
