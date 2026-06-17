/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Sustainability Coach API Route (POST)', () => {
  let mockResult: { data: any; error: any } = { data: null, error: null };
  const mockGetUser = vi.fn();
  const mockFrom = vi.fn();

  const mockBuilder: any = {
    insert: vi.fn().mockImplementation(function (this: any) { return this; }),
    select: vi.fn().mockImplementation(function (this: any) { return this; }),
    eq: vi.fn().mockImplementation(function (this: any) { return this; }),
    order: vi.fn().mockImplementation(function (this: any) { return this; }),
    limit: vi.fn().mockImplementation(function (this: any) { return this; }),
    maybeSingle: vi.fn().mockImplementation(function (this: any) { return this; }),
    then: vi.fn().mockImplementation(function (this: any, onfulfilled: any) {
      return Promise.resolve({ data: mockResult.data, error: mockResult.error }).then(onfulfilled);
    }),
  };

  const originalApiKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'dummy-key';
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

    // Mock global fetch for Anthropic API
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      let done = false;
      return Promise.resolve({
        ok: true,
        body: {
          getReader: () => ({
            read: () => {
              if (!done) {
                done = true;
                return Promise.resolve({
                  done: false,
                  value: new TextEncoder().encode(
                    'data: {"type": "content_block_delta", "delta": {"type": "text_delta", "text": "Hello user!"}}\n'
                  ),
                });
              }
              return Promise.resolve({ done: true, value: undefined });
            },
          }),
        },
      });
    }));
  });

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalApiKey;
    }
    vi.unstubAllGlobals();
  });

  it('rejects requests when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No user') });

    const req = new NextRequest('http://localhost/api/coach', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.message).toContain('Authentication required');
  });

  it('rejects requests with invalid payload', async () => {
    const req = new NextRequest('http://localhost/api/coach', {
      method: 'POST',
      body: JSON.stringify({ message: '' }), // Too short (empty)
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain('Invalid request payload');
  });

  it('rejects requests when message exceeds 500 characters', async () => {
    const longMessage = 'a'.repeat(501);
    const req = new NextRequest('http://localhost/api/coach', {
      method: 'POST',
      body: JSON.stringify({ message: longMessage }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain('Invalid request payload');
  });

  it('sanitizes input, strips ASCII control characters, and streams response', async () => {
    mockResult = { data: null, error: null };

    const req = new NextRequest('http://localhost/api/coach', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello\x00 World!\x1F How is\x7F the environment?',
        conversationHistory: [],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const text = await res.text();
    expect(text).toBe('Hello user!');

    // Verify coach_conversations insert was called with sanitized message
    expect(mockFrom).toHaveBeenCalledWith('coach_conversations');
    expect(mockBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Hello World! How is the environment?',
        role: 'user',
        user_id: 'test-coach-user',
      })
    );
  });

  it('enforces rate limiting: returns 429 when minute limit is exceeded', async () => {
    mockResult = { data: null, error: null };
    // Use a unique ID for this test to avoid leakage from previous tests
    mockGetUser.mockResolvedValue({ data: { user: { id: 'rate-limit-test-user' } }, error: null });

    // First 5 requests should succeed
    for (let i = 0; i < 5; i++) {
      const req = new NextRequest('http://localhost/api/coach', {
        method: 'POST',
        body: JSON.stringify({ message: `Message ${i}`, conversationHistory: [] }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      await res.text();
    }

    // 6th request should hit the rate limit (429)
    const req6 = new NextRequest('http://localhost/api/coach', {
      method: 'POST',
      body: JSON.stringify({ message: 'Sixth message', conversationHistory: [] }),
    });
    const res6 = await POST(req6);
    expect(res6.status).toBe(429);
    const json = await res6.json();
    expect(json.message).toContain('Rate limit exceeded');
    expect(res6.headers.get('Retry-After')).toBeDefined();
  });
});
