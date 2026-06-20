/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../route';
import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';
import { clearRateLimitStore } from '@/lib/rate-limiter';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

describe('Session Sync API Route (POST)', () => {
  const mockSetSession = vi.fn();
  const mockSignOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    clearRateLimitStore();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'dummy-anon-key';

    mockSetSession.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValue({ error: null });

    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        setSession: mockSetSession,
        signOut: mockSignOut,
      },
    } as any);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('rejects requests with invalid payload', async () => {
    const req = new NextRequest('http://localhost/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({ event: 'SIGNED_IN', session: {} }), // Missing access_token/refresh_token
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid request payload');
  });

  it('handles SIGNED_IN event successfully', async () => {
    const req = new NextRequest('http://localhost/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({
        event: 'SIGNED_IN',
        session: {
          access_token: 'fake-access-token',
          refresh_token: 'fake-refresh-token',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockSetSession).toHaveBeenCalledWith({
      access_token: 'fake-access-token',
      refresh_token: 'fake-refresh-token',
    });
  });

  it('handles SIGNED_OUT event successfully', async () => {
    const req = new NextRequest('http://localhost/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({ event: 'SIGNED_OUT' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('applies rate limiting and returns 429', async () => {
    // Make 20 allowed requests
    for (let i = 0; i < 20; i++) {
      const req = new NextRequest('http://localhost/api/auth/session', {
        method: 'POST',
        headers: { 'x-forwarded-for': '1.1.1.1' },
        body: JSON.stringify({ event: 'SIGNED_OUT' }),
      });
      await POST(req);
    }

    // 21st request should be rate limited
    const reqRateLimited = new NextRequest('http://localhost/api/auth/session', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.1.1.1' },
      body: JSON.stringify({ event: 'SIGNED_OUT' }),
    });

    const res = await POST(reqRateLimited);
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toBe('Too Many Requests');
  });
});
