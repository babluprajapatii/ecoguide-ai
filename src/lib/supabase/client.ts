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
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
