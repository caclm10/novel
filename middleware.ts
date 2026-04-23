import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const sessionCookie = request.cookies.get(`a_session_${projectId}`);
  const { pathname } = request.nextUrl;

  const isPublicRoute = pathname.startsWith('/login') || pathname.startsWith('/api/');

  if (!sessionCookie && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (sessionCookie && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads).*)'],
};
