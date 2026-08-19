import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
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

/**
 * Cookie-less public read client — SERVER ONLY, for anon-readable content.
 *
 * Uses the same publishable/anon key as the request-bound client, so RLS still
 * applies at the anon trust level (public content is readable; submissions and
 * mutations are not). The crucial difference: it never touches `cookies()`.
 *
 * Reading `cookies()` opts a route into dynamic rendering, so the cookie-bound
 * client above forces every page that reads content to render live on each
 * request (no caching, a DB round-trip per view). Public content is identical
 * for every visitor and carries no draft/visibility flag, so it needs no
 * per-request session — routing its reads through this client lets those pages
 * be statically rendered / ISR-cached. Use ONLY for content that is the same
 * for all viewers; anything per-user or write-related must use `createClient`.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
