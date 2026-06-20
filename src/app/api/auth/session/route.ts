import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limiter';

const sessionSyncSchema = z.object({
  event: z.string(),
  session: z
    .object({
      access_token: z.string(),
      refresh_token: z.string(),
    })
    .nullable()
    .optional(),
});

/**
 * Route handler to synchronize Supabase client-side session state
 * (tokens) with server-side HTTP cookies.
 *
 * This mitigates session drift between the client-side state and Next.js
 * middleware/Server Components.
 */
export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const rateLimitRes = checkRateLimit(request);
  const headers = rateLimitHeaders(rateLimitRes);

  if (!rateLimitRes.allowed) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers });
  }

  try {
    const rawBody = await request.json().catch(() => ({}));

    // 2. Schema validation
    const parsed = sessionSyncSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.format() },
        { status: 400, headers },
      );
    }

    const { event, session } = parsed.data;
    let cookieStore;
    try {
      cookieStore = cookies();
    } catch {
      cookieStore = {
        getAll: () => [],
        set: () => {},
      } as unknown as ReturnType<typeof cookies>;
    }
    const response = NextResponse.json({ success: true }, { headers });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ success: true }, { headers });
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (session?.access_token && session?.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

        if (error) {
          return NextResponse.json(
            { error: `Failed to set session: ${error.message}` },
            { status: 400, headers },
          );
        }
      }
    } else if (event === 'SIGNED_OUT') {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return NextResponse.json(
          { error: `Failed to sign out server session: ${error.message}` },
          { status: 400, headers },
        );
      }
    }

    return response;
  } catch (error) {
    console.error('[SessionSyncAPI] Error setting session cookies:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers });
  }
}
