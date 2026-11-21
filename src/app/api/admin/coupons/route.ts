import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createAdminServerClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({ success: true, coupons: [] });
    }

    const adminClient = createAdminServerClient() as any;
    const { data, error } = await adminClient
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, coupons: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { coupon } = body;

    if (!coupon || !coupon.code) {
      return NextResponse.json({ success: false, error: 'Coupon code required' }, { status: 400 });
    }

    const cleanCode = coupon.code.trim().toUpperCase();
    const discountType = coupon.discountType || 'percent';
    const discountValue = Number(coupon.discountValue) || 10;
    const minOrder = Number(coupon.minOrderValue || coupon.minimumOrder) || 0;
    const isActive = coupon.status === 'Active' || coupon.isActive !== false;

    if (!isSupabaseConfigured) {
      return NextResponse.json({ success: true, coupon });
    }

    const adminClient = createAdminServerClient() as any;

    // Upsert into Supabase coupons table
    const { data, error } = await adminClient
      .from('coupons')
      .upsert(
        {
          code: cleanCode,
          discount_type: discountType,
          discount_value: discountValue,
          minimum_order: minOrder,
          is_active: isActive,
          usage_limit: 1000,
          usage_count: coupon.usageCount || 0,
        },
        { onConflict: 'code' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, coupon: data, message: 'Coupon saved live to database!' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ success: false, error: 'Coupon code required' }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({ success: true });
    }

    const adminClient = createAdminServerClient() as any;
    await adminClient.from('coupons').delete().ilike('code', code.trim());

    return NextResponse.json({ success: true, message: 'Coupon deleted from database.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
