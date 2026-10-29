import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Only run user auth verification if Supabase URL is genuinely configured
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Protect /admin routes: only Luke Piatti or verified clinicians
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (user) {
        const isClinician =
          user.email?.toLowerCase() === 'luke@mightymentalhealth.com.au' ||
          user.email?.toLowerCase() === 'lukepiatti@gmail.com' ||
          user.user_metadata?.role === 'clinician';

        if (!isClinician) {
          const url = request.nextUrl.clone();
          url.pathname = '/portal';
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*'],
};
