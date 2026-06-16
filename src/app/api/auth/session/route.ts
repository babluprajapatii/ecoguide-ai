import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Route handler to synchronize Supabase client-side session state
 * (tokens) with server-side HTTP cookies.
 *
 * This mitigates session drift between the client-side state and Next.js
 * middleware/Server Components.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { event, session } = body;

    const cookieStore = cookies();
    const response = NextResponse.json({ success: true });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 500 }
      );
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
            { status: 400 }
          );
        }
      }
    } else if (event === 'SIGNED_OUT') {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return NextResponse.json(
          { error: `Failed to sign out server session: ${error.message}` },
          { status: 400 }
        );
      }
    }

    return response;
  } catch (error) {
    console.error('[SessionSyncAPI] Error setting session cookies:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
