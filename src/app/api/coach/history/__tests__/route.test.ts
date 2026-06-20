/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET, DELETE } from '../route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { clearRateLimitStore } from '@/lib/rate-limiter';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Coach History API Route', () => {
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
    delete: vi.fn().mockImplementation(function (this: any) {
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

    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    } as any);
  });

  describe('GET /api/coach/history', () => {
    it('rejects when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No user') });
      const req = new NextRequest('http://localhost/api/coach/history');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns conversation history', async () => {
      mockResult = {
        data: [{ role: 'user', message: 'Hello', created_at: '2026-06-18' }],
        error: null,
      };

      const req = new NextRequest('http://localhost/api/coach/history');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.length).toBe(1);
      expect(json[0].message).toBe('Hello');
    });
  });

  describe('DELETE /api/coach/history', () => {
    it('rejects when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No user') });
      const req = new NextRequest('http://localhost/api/coach/history', { method: 'DELETE' });
      const res = await DELETE(req);
      expect(res.status).toBe(401);
    });

    it('clears conversation history successfully', async () => {
      mockResult = { data: null, error: null };
      const req = new NextRequest('http://localhost/api/coach/history', { method: 'DELETE' });
      const res = await DELETE(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toContain('cleared successfully');
    });
  });
});
