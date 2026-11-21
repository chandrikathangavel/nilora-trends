import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createServerClient } from '@/lib/supabase-server';
import { toPaise, toRupees, calculateDiscountPaise, formatINR } from '@/lib/money';

const FALLBACK_COUPONS = [
  {
    code: 'NILORA10',
    discountType: 'percent' as const,
    discountValue: 10,
    minimumOrder: 999,
    maximumDiscount: 1000,
    usageLimit: 500,
    usageCount: 142,
    isActive: true,
    description: '10% Off on your boutique curation (Min order ₹999)',
  },
  {
    code: 'FESTIVE500',
    discountType: 'flat' as const,
    discountValue: 500,
    minimumOrder: 2499,
    maximumDiscount: 500,
    usageLimit: 200,
    usageCount: 88,
    isActive: true,
    description: 'Flat ₹500 Off on orders above ₹2,499',
  },
  {
    code: 'WELCOMEVIP',
    discountType: 'percent' as const,
    discountValue: 15,
    minimumOrder: 1499,
    maximumDiscount: 1500,
    usageLimit: 100,
    usageCount: 39,
    isActive: true,
    description: '15% Off VIP Welcome privilege (Min order ₹1,499)',
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { couponCode, subtotal } = body;

    if (!couponCode || typeof couponCode !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Please enter a valid coupon code.' },
        { status: 400 }
      );
    }

    const cleanCode = couponCode.trim().toUpperCase();
    const safeSubtotal = Math.max(0, Number(subtotal) || 0);
    const subtotalPaise = toPaise(safeSubtotal);

    if (subtotalPaise <= 0) {
      return NextResponse.json(
        { valid: false, error: 'Your bag is empty. Add items before applying a coupon.' },
        { status: 400 }
      );
    }

    let couponData: {
      code: string;
      discountType: 'percent' | 'flat';
      discountValue: number;
      minimumOrder: number;
      maximumDiscount?: number;
      usageLimit?: number;
      usageCount: number;
      expiresAt?: string;
      isActive: boolean;
      description?: string;
    } | null = null;

    // 1. Check live Supabase database
    if (isSupabaseConfigured) {
      try {
        const client = createServerClient();
        const { data, error } = await (client as any)
          .from('coupons')
          .select('*')
          .ilike('code', cleanCode)
          .maybeSingle();

        if (data && !error) {
          couponData = {
            code: data.code,
            discountType: data.discount_type as 'percent' | 'flat',
            discountValue: Number(data.discount_value),
            minimumOrder: Number(data.minimum_order) || 0,
            maximumDiscount: data.maximum_discount ? Number(data.maximum_discount) : undefined,
            usageLimit: data.usage_limit || undefined,
            usageCount: Number(data.usage_count) || 0,
            expiresAt: data.expires_at || undefined,
            isActive: Boolean(data.is_active),
          };
        }
      } catch (e) {
        console.warn('Could not query coupons table, checking fallback coupons:', e);
      }
    }

    // 2. Fallback to store registry if not found in DB
    if (!couponData) {
      const fb = FALLBACK_COUPONS.find((c) => c.code === cleanCode);
      if (fb) {
        couponData = fb;
      }
    }

    if (!couponData) {
      return NextResponse.json({
        valid: false,
        error: `Coupon "${cleanCode}" is not recognized. Try NILORA10 or FESTIVE500.`,
      });
    }

    // Check active status
    if (!couponData.isActive) {
      return NextResponse.json({
        valid: false,
        error: `Coupon "${cleanCode}" is currently inactive or paused.`,
      });
    }

    // Check expiration date
    if (couponData.expiresAt) {
      const expiry = new Date(couponData.expiresAt);
      if (Date.now() > expiry.getTime()) {
        return NextResponse.json({
          valid: false,
          error: `Coupon "${cleanCode}" expired on ${expiry.toLocaleDateString('en-IN')}.`,
        });
      }
    }

    // Check usage limit
    if (couponData.usageLimit && couponData.usageCount >= couponData.usageLimit) {
      return NextResponse.json({
        valid: false,
        error: `Coupon "${cleanCode}" has reached its maximum redemptions limit.`,
      });
    }

    // Check minimum order value
    if (safeSubtotal < couponData.minimumOrder) {
      return NextResponse.json({
        valid: false,
        error: `Coupon "${cleanCode}" requires a minimum bag value of ${formatINR(couponData.minimumOrder)}. Add ${formatINR(couponData.minimumOrder - safeSubtotal)} more to qualify.`,
      });
    }

    // Calculate discount with integer precision
    const { discountPaise, error: calcError } = calculateDiscountPaise(subtotalPaise, {
      discountType: couponData.discountType,
      discountValue: couponData.discountValue,
      minimumOrderRupees: couponData.minimumOrder,
      maximumDiscountRupees: couponData.maximumDiscount,
    });

    if (calcError) {
      return NextResponse.json({ valid: false, error: calcError });
    }

    const discountRupees = toRupees(discountPaise);

    return NextResponse.json({
      valid: true,
      couponCode: cleanCode,
      discountType: couponData.discountType,
      discountValue: couponData.discountValue,
      discountAmount: discountRupees,
      discountPaise,
      maximumDiscount: couponData.maximumDiscount,
      minimumOrder: couponData.minimumOrder,
      message:
        couponData.discountType === 'percent'
          ? `Privilege code applied: ${couponData.discountValue}% Off (-${formatINR(discountRupees)})`
          : `Privilege code applied: Flat ${formatINR(discountRupees)} Off`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to validate coupon';
    console.error('Coupon validation error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
