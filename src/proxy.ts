import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Refreshes the Supabase auth session on every matched request and enforces
 * role-based access: `/admin` requires `admin`, `/dashboard` requires
 * `student` (see `updateSession`). Replaces the old unsigned-cookie presence
 * check.
 *
 * Next.js 16 renamed the `middleware` file convention to `proxy` (same
 * behaviour, now defaulting to the Node.js runtime — which suits the
 * `@supabase/ssr` cookie handling). The exported function must be named
 * `proxy`; the `config.matcher` contract is unchanged.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Gate the two protected areas (/admin, /dashboard) and refresh the session
  // cookie on the auth pages (/login, /signup) so a logged-in user isn't left
  // holding a stale token there.
  matcher: ['/admin/:path*', '/dashboard/:path*', '/login', '/signup'],
};
