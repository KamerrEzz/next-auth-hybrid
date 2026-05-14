import { NextResponse, type NextRequest } from 'next/server';

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
  matcher: ['/dashboard/:path*'],
};
