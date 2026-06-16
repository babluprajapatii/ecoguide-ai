/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/consistent-type-imports */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateSession } from '../middleware';
import type { NextRequest } from 'next/server';

const mockGetUser = vi.fn();

vi.mock('@supabase/ssr', () => {
  return {
    createServerClient: vi.fn(() => ({
      auth: {
        getUser: mockGetUser,
      },
    })),
  };
});

vi.mock('next/server', async () => {
  const original = await vi.importActual<typeof import('next/server')>('next/server');
  const mockCookies = {
    set: vi.fn(),
  };
  return {
    ...original,
    NextResponse: {
      next: vi.fn().mockReturnValue({
        cookies: mockCookies,
        headers: new Headers(),
      }),
      redirect: vi.fn().mockImplementation((url) => ({
        status: 307,
        headers: new Headers({ Location: url.toString() }),
        url: url.toString(),
      })),
    },
  };
});

describe('middleware router protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  });

  const createMockRequest = (pathname: string) => {
    const url = new URL(`https://ecoguide.ai${pathname}`);
    const req = {
      nextUrl: { pathname, searchParams: url.searchParams },
      url: url.toString(),
      cookies: {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn(),
      },
    };
    return req as unknown as NextRequest;
  };

  it('redirects unauthenticated users from protected nested paths', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    // Test nested dashboard path
    const req = createMockRequest('/dashboard/metrics/carbon');
    const response = await updateSession(req);

    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toContain(
      '/login?redirectTo=%2Fdashboard%2Fmetrics%2Fcarbon'
    );
  });

  it('allows authenticated users to pass through to protected nested paths', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });

    const req = createMockRequest('/dashboard/metrics/carbon');
    const response = await updateSession(req);

    // Should not redirect, so status is not 307
    expect(response.status).not.toBe(307);
    expect(response.headers.get('Location')).toBeNull();
  });

  it('redirects authenticated users away from auth pages to dashboard', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });

    const req = createMockRequest('/login');
    const response = await updateSession(req);

    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe('https://ecoguide.ai/dashboard');
  });

  it('allows unauthenticated users to access login pages', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const req = createMockRequest('/login');
    const response = await updateSession(req);

    expect(response.status).not.toBe(307);
    expect(response.headers.get('Location')).toBeNull();
  });
});
