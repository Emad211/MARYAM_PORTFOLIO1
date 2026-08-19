import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server Supabase client (Server Components, Server Actions, Route Handlers).
 *
 * Bound to the request's cookies so it acts as the logged-in user and RLS
 * applies. In a Server Component, `setAll` throws because response cookies
 * can't be written there — that is expected and swallowed; the middleware
 * (`updateSession`) is what actually refreshes and persists the session.
 *
 * `cookies()` is async in Next.js 15+, so this helper is async too.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore because the
            // middleware refreshes the session on every request.
          }
        },
      },
    }
  );
}
