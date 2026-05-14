import { NextResponse, type NextRequest } from 'next/server';

// NOTE: This is a coarse pre-filter only — it short-circuits requests that
// obviously have no session cookie, avoiding a round-trip to the backend for
// clearly unauthenticated users. It does NOT validate whether the session is
// actually valid on the backend.
//
// The real security boundary is the server-side auth guard in
// src/app/(app)/layout.tsx, which calls GET /auth/me on every request and
// redirects to /login if the session is invalid or expired.
export function proxy(req: NextRequest) {
  const hasSession = req.cookies.has('sessionId');

  if (!hasSession) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/developer/:path*'],
};
