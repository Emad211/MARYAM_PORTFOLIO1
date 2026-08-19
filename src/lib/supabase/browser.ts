import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client (Client Components).
 *
 * Uses the publishable/anon key, which is safe to expose to the browser — RLS
 * gates every row. `createBrowserClient` already memoises a singleton, so it is
 * fine to call this on every render.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
