import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Next.js middleware entry point.
 *
 * Delegates to the Supabase session-refresh middleware which also
 * handles route protection (redirecting unauthenticated users from
 * protected routes to `/login`).
 *
 * @param request - The incoming request to process.
 * @returns The response with refreshed auth cookies and any redirects.
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

/**
 * Matcher configuration: run middleware on all routes except
 * static assets, images, favicon, and Next.js internals.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public assets with common image extensions
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
