import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Refreshes the Supabase auth session on every matched request and enforces
 * admin-only access to `/admin` (see `updateSession`). Replaces the old
 * unsigned-cookie presence check.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Run on /admin (to gate it) and /login (so the session cookie is refreshed
  // and a logged-in admin isn't left with a stale token on the login page).
  matcher: ['/admin/:path*', '/login'],
};
