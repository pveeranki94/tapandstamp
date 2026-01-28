import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/auth/callback'];

// Routes that are public for customer-facing flows
const CUSTOMER_ROUTES = ['/join', '/card', '/api/passes', '/api/passkit', '/api/draft', '/api/revalidate'];

// API routes that are public (for customer join flow)
const PUBLIC_API_PATTERNS = [
  /^\/api\/merchants\/[^/]+$/, // /api/merchants/[slug] but not /api/merchants/id/[id]
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes (exact match for root, prefix for others)
  if (pathname === '/' || PUBLIC_ROUTES.slice(1).some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow customer-facing routes
  if (CUSTOMER_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public API patterns (e.g., /api/merchants/[slug] for join flow)
  if (PUBLIC_API_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return NextResponse.next();
  }

  // Update session and check auth
  const { user, response } = await updateSession(request);

  // Redirect to login if not authenticated
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
