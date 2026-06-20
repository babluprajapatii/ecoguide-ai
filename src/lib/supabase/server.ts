import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/database.types';

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers.
 *
 * Reads and writes cookies through the Next.js `cookies()` API to maintain
 * session state across server-rendered requests.
 *
 * @returns A typed Supabase server client instance.
 *
 * @example
 * ```ts
 * // In a Server Component or Route Handler
 * import { createClient } from '@/lib/supabase/server';
 *
 * export default async function Page() {
 *   const supabase = createClient();
 *   const { data } = await supabase.from('profiles').select();
 * }
 * ```
 */
import { mockSupabaseClient } from './mock-db';

function _getServerClientType() {
  return createServerClient<Database>('https://placeholder.supabase.co', 'placeholder', {
    cookies: {} as unknown as ReturnType<typeof cookies>,
  });
}

export function createClient(): ReturnType<typeof _getServerClientType> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return mockSupabaseClient as unknown as ReturnType<typeof _getServerClientType>;
  }

  const cookieStore = cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method is called from a Server Component where
          // cookies cannot be set. This is safe to ignore if middleware
          // is refreshing user sessions.
        }
      },
    },
  });
}
