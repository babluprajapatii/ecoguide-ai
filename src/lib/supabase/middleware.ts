import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refreshes the Supabase session on every request by reading/writing
 * auth cookies through the middleware request/response cycle.
 *
 * This ensures Server Components always see the latest session state,
 * prevents stale tokens, and enforces security route access rules.
 *
 * @param request - The incoming Next.js middleware request.
 * @returns A `NextResponse` with refreshed auth cookies and any redirect routes.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, pass through without auth checks
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Do not add logic between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Redirect unauthenticated users away from protected nested routes
  const isProtectedRoute =
    pathname === '/dashboard' || pathname.startsWith('/dashboard/') ||
    pathname === '/assessment' || pathname.startsWith('/assessment/') ||
    pathname === '/coach' || pathname.startsWith('/coach/') ||
    pathname === '/simulator' || pathname.startsWith('/simulator/') ||
    pathname === '/community' || pathname.startsWith('/community/') ||
    pathname === '/badges' || pathname.startsWith('/badges/') ||
    pathname === '/settings' || pathname.startsWith('/settings/');

  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth-only pages to dashboard
  const isAuthRoute =
    pathname === '/login' || pathname.startsWith('/login/') ||
    pathname === '/signup' || pathname.startsWith('/signup/') ||
    pathname === '/forgot-password' || pathname.startsWith('/forgot-password/') ||
    pathname === '/reset-password' || pathname.startsWith('/reset-password/') ||
    pathname === '/verify-email' || pathname.startsWith('/verify-email/');

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}
