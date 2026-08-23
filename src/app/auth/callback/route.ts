import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Auth callback for the PKCE flow (@supabase/ssr default). Recovery emails
 * land here as `{origin}/auth/callback?code=...&next=...`; we exchange the
 * one-time code server-side so the session cookies are set on this very
 * request/response pair, then forward the user to `next`.
 *
 * Exchanging here (request-bound client) rather than client-side means the
 * browser never handles the raw code and the refreshed cookies are already
 * attached to the redirect response.
 */

/**
 * Only same-origin local paths may be used as the post-exchange target:
 * must start with '/' and must not start with '//' (protocol-relative URLs
 * would leave the site) or contain a backslash (URL parsing normalizes it to
 * '/', so '/\evil.com' would otherwise smuggle an external host through).
 */
function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) {
    return '/reset-password';
  }
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));

  try {
    if (!code) {
      throw new Error('Missing code parameter in auth callback URL.');
    }
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw error;
    }
    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    console.error('Auth callback failed:', error);
    return NextResponse.redirect(new URL('/forgot-password?error=callback', request.url));
  }
}
