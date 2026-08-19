import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refreshes the Supabase auth session on every request and enforces admin-only
 * access to `/admin`. Called from `src/middleware.ts`.
 *
 * Follows the official @supabase/ssr pattern: the same cookies must be written
 * to BOTH the request (so downstream Server Components read the fresh token)
 * and the response (so the browser stores it). Do not run other logic between
 * creating the client and calling `getClaims()` — it revalidates the token.
 *
 * Authorization uses `app_metadata.role` (server-controlled), never
 * `user_metadata` (user-editable, unsafe for authz).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getClaims() validates the JWT signature and refreshes the
  // session. Never use getSession() in server code — it isn't guaranteed to
  // revalidate the token.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const isAdmin =
    (claims?.app_metadata as { role?: string } | undefined)?.role === 'admin';

  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && !isAdmin) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
