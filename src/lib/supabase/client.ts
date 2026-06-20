import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/database.types';

/**
 * Creates a Supabase client for use in Client Components.
 *
 * This client is configured for browser-side usage and automatically
 * handles cookie-based session management via `@supabase/ssr`.
 *
 * @returns A typed Supabase browser client instance.
 *
 * @example
 * ```tsx
 * 'use client';
 * import { createClient } from '@/lib/supabase/client';
 *
 * function MyComponent() {
 *   const supabase = createClient();
 *   // use supabase...
 * }
 * ```
 */
import { mockSupabaseClient } from './mock-db';

function _getBrowserClientType() {
  return createBrowserClient<Database>('https://placeholder.supabase.co', 'placeholder');
}

export function createClient(): ReturnType<typeof _getBrowserClientType> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return mockSupabaseClient as unknown as ReturnType<typeof _getBrowserClientType>;
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
