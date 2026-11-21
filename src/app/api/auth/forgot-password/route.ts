import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body || {};

    const trimmedEmail = (email || '').trim().toLowerCase();
    if (!trimmedEmail) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Database service is not configured.' },
        { status: 500 }
      );
    }

    // 1. Verify that user actually exists in Supabase
    const { data: userList, error: listError } = await admin.auth.admin.listUsers();
    let customerName = 'Valued Patron';
    if (!listError && userList?.users) {
      const user = userList.users.find((u) => u.email?.toLowerCase() === trimmedEmail);
      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: `No registered account found with ${trimmedEmail}. Please verify the spelling or create an account first.`,
          },
          { status: 404 }
        );
      }
      customerName = (user.user_metadata?.full_name || user.user_metadata?.name || 'Valued Patron').trim();
    }

    // 2. Dispatch reset password email
    const origin = req.nextUrl.origin || 'http://localhost:3000';
    const redirectTo = `${origin}/auth/reset-password`;

    // Generate secure recovery link via Supabase Admin
    let resetUrl = `${redirectTo}?email=${encodeURIComponent(trimmedEmail)}`;
    try {
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email: trimmedEmail,
        options: { redirectTo },
      });

      if (!linkErr && linkData?.properties?.action_link) {
        resetUrl = linkData.properties.action_link;
      }
    } catch (linkGenErr) {
      console.warn('generateLink exception:', linkGenErr);
    }

    // Attempt standard Supabase password reset email dispatch (non-blocking)
    try {
      await supabase.auth.resetPasswordForEmail(trimmedEmail, { redirectTo });
    } catch (sbErr) {
      console.warn('Supabase resetPasswordForEmail notice:', sbErr);
    }

    // Dispatch luxury-branded email notification via SMTP / Resend
    const emailResult = await sendPasswordResetEmail({
      email: trimmedEmail,
      resetUrl,
      customerName,
    });

    return NextResponse.json({
      success: true,
      email: trimmedEmail,
      mode: emailResult.mode,
      message: `A secure password reset email has been dispatched to ${trimmedEmail}. Please check your inbox or spam folder.`,
    });
  } catch (err: unknown) {
    console.error('API forgot-password error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to process password reset request.' },
      { status: 500 }
    );
  }
}
