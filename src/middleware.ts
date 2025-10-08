import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

export function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;
  const authToken = request.cookies.get('auth-token');

  // This middleware should only protect routes under /admin
  if (pathname.startsWith('/admin')) {
    if (!authToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // The matcher ensures this middleware only runs on routes starting with /admin
  matcher: '/admin/:path*',
};
