import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, phone } = body || {};

    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedName = (name || '').trim();
    const trimmedPhone = (phone || '').trim();

    if (!trimmedEmail || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Supabase database service is not configured.' },
        { status: 500 }
      );
    }

    // 1. Check if user already exists
    const { data: userList, error: listError } = await admin.auth.admin.listUsers();
    if (!listError && userList?.users) {
      const existing = userList.users.find(
        (u) => u.email?.toLowerCase() === trimmedEmail
      );
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: 'An account with this email address already exists. Please sign in instead.',
            exists: true,
            email: trimmedEmail,
          },
          { status: 409 }
        );
      }
    }

    // 2. Create the user with email_confirm: true so no activation email is required!
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: trimmedEmail,
      password: password,
      email_confirm: true, // Auto-confirm user so they can log in immediately
      user_metadata: {
        full_name: trimmedName,
        phone: trimmedPhone,
      },
    });

    if (createError || !created?.user) {
      return NextResponse.json(
        {
          success: false,
          error: createError?.message || 'Failed to create boutique account. Please try again.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      email: trimmedEmail,
      userId: created.user.id,
      message: 'Account created successfully! Please sign in with your email and password.',
    });
  } catch (err: unknown) {
    console.error('API register error:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected server error occurred during registration.' },
      { status: 500 }
    );
  }
}
