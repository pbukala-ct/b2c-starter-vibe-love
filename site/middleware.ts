import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'vibe-home-fallback-secret-key-2024'
);
const COOKIE_NAME = 'vibe-session';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect all /account/* routes
  if (pathname.startsWith('/account')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    let customerId: string | undefined;

    if (token) {
      try {
        const { payload } = await jwtVerify(token, SECRET);
        customerId = (payload as Record<string, unknown>).customerId as string | undefined;
      } catch {
        // invalid token
      }
    }

    if (!customerId) {
      return NextResponse.redirect(
        new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url)
      );
    }
  }

  return NextResponse.next();
}
