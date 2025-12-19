import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

function getOrigin(request: NextRequest): string {
  // In Cloud Run, request.url contains the internal container URL (localhost:8080)
  // We need to use forwarded headers to get the actual external URL
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  // Fallback to NEXT_PUBLIC_BASE_URL if set, otherwise use request origin
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  const { origin } = new URL(request.url);
  return origin;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const origin = getOrigin(request);

  console.log('[auth/callback] Starting code exchange');
  console.log('[auth/callback] Origin:', origin);
  console.log('[auth/callback] Code present:', !!code);
  console.log('[auth/callback] Cookies:', request.cookies.getAll().map(c => c.name));

  if (code) {
    // Create redirect response first - cookies will be set on this response
    const redirectUrl = `${origin}${next}`;
    const response = NextResponse.redirect(redirectUrl);

    // Create Supabase client that reads from request and writes to response
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[auth/callback] Exchange error:', error.message, error.status);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    console.log('[auth/callback] Exchange successful, user:', data.user?.email);
    return response;
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
