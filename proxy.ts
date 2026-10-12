
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js proxy
 *
 * Authentication is handled by AuthGuard on the client side.
 * We intentionally do NOT check localStorage or cookies here because
 * localStorage is not available inside the proxy.
 *
 * The proxy only allows requests to continue.
 */
export function proxy(request: NextRequest) {
  return NextResponse.next();
}

/**
 * Do not run the proxy for static files, images, API routes,
 * or public assets.
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
