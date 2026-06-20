/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET } from '../route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { clearRateLimitStore } from '@/lib/rate-limiter';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Coach Dashboard API Route (GET)', () => {
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
    limit: vi.fn().mockImplementation(function (this: any) {
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

  it('rejects requests when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No user') });

    const req = new NextRequest('http://localhost/api/coach/dashboard', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.message).toContain('Authentication required');
  });

  it('returns compiled coach dashboard metrics', async () => {
    // We mock the database queries sequentially:
    // Query 1: coach_conversations
    // Query 2: coach_recommendations
    // Query 3: assessments
    let queryIdx = 0;
    mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
      queryIdx++;
      let res = { data: [] as any, error: null };
      if (queryIdx === 1) {
        // conversations
        res = {
          data: [
            { created_at: new Date().toISOString(), role: 'user' },
            { created_at: new Date().toISOString(), role: 'assistant' },
          ],
          error: null,
        };
      } else if (queryIdx === 2) {
        // recommendations
        res = {
          data: [{ status: 'pending' }, { status: 'completed' }],
          error: null,
        };
      } else if (queryIdx === 3) {
        // assessments
        res = {
          data: [
            { created_at: new Date().toISOString() },
            { created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
          ],
          error: null,
        };
      }
      return Promise.resolve(res).then(onfulfilled);
    });

    const req = new NextRequest('http://localhost/api/coach/dashboard', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.conversationCount).toBe(1);
    expect(json.insightsCount).toBe(2);
    expect(json.activeRecommendations).toBe(1);
    expect(json.completedRecommendations).toBe(1);
    expect(json.streak).toBe(2); // Two consecutive days (18th and 17th)
  });

  it('handles database query errors gracefully', async () => {
    mockResult = { data: null, error: { message: 'DB Failure' } };

    const req = new NextRequest('http://localhost/api/coach/dashboard', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
