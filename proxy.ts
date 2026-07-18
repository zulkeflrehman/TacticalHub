import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const COOKIE_NAME = 'tecticalhub_session';
const JWT_SECRET = process.env.JWT_SECRET || 'tecticalhub_super_secret_jwt_key_1234567890_change_me_in_prod';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let user: { id: string; email: string; role: string } | null = null;

  if (token) {
    try {
      const { payload } = await jose.jwtVerify(token, SECRET_KEY);
      user = {
        id: payload.id as string,
        email: payload.email as string,
        role: payload.role as string
      };
    } catch (err) {
      // Token expired or invalid — treat as unauthenticated
    }
  }

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    if (!user || user.role !== 'ADMIN') {
      const loginUrl = new URL('/account/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Customer account protection (excluding login/register)
  if (
    pathname.startsWith('/account/') &&
    !pathname.startsWith('/account/login') &&
    !pathname.startsWith('/account/register')
  ) {
    if (!user) {
      const loginUrl = new URL('/account/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect already-authenticated users away from login/register
  if (pathname === '/account/login' || pathname === '/account/register') {
    if (user) {
      if (user.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/account/profile', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*']
};
