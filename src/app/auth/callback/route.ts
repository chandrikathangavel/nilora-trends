import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-auth';
import { getSafeRedirectUrl } from '@/lib/safeRedirect';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTarget = requestUrl.searchParams.get('redirect') || requestUrl.searchParams.get('next');
  const safeDestination = getSafeRedirectUrl(redirectTarget, '/profile');

  if (code) {
    try {
      const supabase = await createServerComponentClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Auth code exchange error:', error.message);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
        );
      }
    } catch (err: unknown) {
      console.error('Unexpected auth callback error:', err);
      return NextResponse.redirect(
        new URL('/login?error=Authentication%20exchange%20failed', requestUrl.origin)
      );
    }
  }

  // Redirect to verified safe internal destination
  return NextResponse.redirect(new URL(safeDestination, requestUrl.origin));
}
