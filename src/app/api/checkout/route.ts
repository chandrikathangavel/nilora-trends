import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createServerClient, createAdminServerClient } from '@/lib/supabase-server';
import { createServerComponentClient } from '@/lib/supabase-auth';
import { DEMO_PRODUCTS } from '@/data/demoProducts';
import {
  toPaise,
  toRupees,
  calculateLineTotalPaise,
  calculateShippingFeePaise,
  calculateDiscountPaise,
  formatINR,
} from '@/lib/money';
import { validateIndianPincode, checkCodEligibility } from '@/lib/pincode';
import { ORDER_STORE } from '@/lib/order-store';
import { sendOrderConfirmationEmail } from '@/lib/email';

// Server-side in-memory idempotency cache (keyed by idempotencyKey)
const idempotencyCache = new Map<string, { order: any; timestamp: number }>();

// Cleanup stale idempotency records every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of idempotencyCache.entries()) {
    if (now - value.timestamp > 1000 * 60 * 30) {
      idempotencyCache.delete(key);
    }
  }
}, 1000 * 60 * 10);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      shippingAddress,
      items,
      couponCode,
      paymentMethod = 'cod',
      idempotencyKey,
    } = body;

    // 1. Anti-Double-Submission / Idempotency Check
    if (idempotencyKey && idempotencyCache.has(idempotencyKey)) {
      const cached = idempotencyCache.get(idempotencyKey)!;
      return NextResponse.json({
        success: true,
        order: cached.order,
        message: 'Order already processed (idempotent submission).',
        isDuplicateSubmissionPrevented: true,
      });
    }

    // 2. Validate Inputs
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.addressLine1) {
      return NextResponse.json(
        { error: 'Please provide full recipient name, contact phone number, and street address.' },
        { status: 400 }
      );
    }

    // Validate 6-digit Indian PIN code
    const pinCheck = validateIndianPincode(shippingAddress.pincode);
    if (!pinCheck.valid) {
      return NextResponse.json(
        { error: pinCheck.error || 'Please provide a valid 6-digit Indian PIN code.' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Your boutique bag is currently empty.' },
        { status: 400 }
      );
    }

    // 3. Online Payment Verification: Never claim online payment works if not configured
    const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const isRazorpayConfigured = Boolean(
      razorpayKey && !razorpayKey.includes('placeholder') && !razorpayKey.includes('rzp_test_placeholder')
    );

    if (paymentMethod === 'razorpay' && !isRazorpayConfigured) {
      return NextResponse.json(
        {
          error:
            'Razorpay online gateway is currently pending live API configuration. Please select Cash on Delivery to complete your boutique order.',
        },
        { status: 400 }
      );
    }

    // 4. Resolve authenticated user session server-side
    let authenticatedUserId: string | null = null;
    let authUserEmail: string | null = null;

    try {
      const ssrSupabase = await createServerComponentClient();
      const {
        data: { user },
      } = await ssrSupabase.auth.getUser();

      if (user) {
        authenticatedUserId = user.id;
        authUserEmail = user.email || null;
      }
    } catch {}

    // Fallback if client passed authenticated user ID in headers or body for preview mode
    if (!authenticatedUserId && body.userId && !body.userId.startsWith('guest-')) {
      authenticatedUserId = body.userId;
    }

    // 5. Revalidate Every Cart Item & Product Variant on the Server (Never trust client prices)
    const verifiedOrderItems: Array<{
      productId: string;
      variantId?: string;
      productName: string;
      sku: string;
      size: string;
      color: string;
      image: string;
      unitPrice: number;
      unitPricePaise: number;
      quantity: number;
      lineTotal: number;
      lineTotalPaise: number;
    }> = [];

    let calculatedSubtotalPaise = 0;

    // Fetch DB products if Supabase is active
    let dbProducts: any[] = [];
    if (isSupabaseConfigured) {
      try {
        const client = createServerClient();
        const pIds = items.map((i: any) => i.productId || i.id?.split('-')[0]).filter(Boolean);
        const { data: pData } = await (client as any)
          .from('products')
          .select(`
            id, name, slug, price, is_active,
            product_images (image_url, sort_order),
            product_variants (id, sku, size, color, stock_quantity, price_override, is_active)
          `)
          .in('id', pIds);

        if (pData) dbProducts = pData;
      } catch (err) {
        console.warn('DB catalog fetch error:', err);
      }
    }

    for (const item of items) {
      const rawProductId = item.productId || item.product?.id || item.id?.split('-')[0];
      const requestedSize = String(item.selectedSize || item.size || 'Free Size').trim();
      const requestedColor = String(item.selectedColor || item.color || 'Standard').trim();
      const rawQty = Number(item.quantity);
      if (!Number.isFinite(rawQty) || rawQty <= 0 || !Number.isInteger(rawQty)) {
        return NextResponse.json(
          { error: `Invalid item quantity: ${item.quantity}. Quantity must be a positive integer.` },
          { status: 400 }
        );
      }
      const requestedQty = rawQty;

      let productName = 'Boutique Piece';
      let sku = `NT-${Date.now().toString().slice(-4)}`;
      let image = '/images/placeholder.jpg';
      let unitPrice = 499;
      let variantId: string | undefined = undefined;
      let availableStock = 10;
      let isItemActive = true;

      // Check DB first
      const dbP = dbProducts.find((p) => p.id === rawProductId);
      if (dbP) {
        productName = dbP.name;
        unitPrice = Number(dbP.price) || 499;
        isItemActive = Boolean(dbP.is_active);

        if (dbP.product_images && dbP.product_images.length > 0) {
          const sorted = [...dbP.product_images].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
          image = sorted[0]?.image_url || image;
        }

        const variant = dbP.product_variants?.find(
          (v: any) =>
            v.size?.toLowerCase() === requestedSize.toLowerCase() &&
            v.color?.toLowerCase() === requestedColor.toLowerCase()
        );

        if (variant) {
          variantId = variant.id;
          sku = variant.sku || sku;
          if (variant.price_override !== null && variant.price_override !== undefined) {
            unitPrice = Number(variant.price_override);
          }
          availableStock = Number(variant.stock_quantity) || 0;
          isItemActive = isItemActive && Boolean(variant.is_active);
        }
      } else {
        // Fallback to demo products catalog
        const demo = DEMO_PRODUCTS.find((p) => p.id === rawProductId || p.slug === rawProductId);
        if (demo) {
          productName = demo.name;
          unitPrice = demo.price;
          sku = demo.sku || sku;
          image = demo.images?.[0] || image;
          isItemActive = demo.inStock;

          const sizeObj = demo.sizes?.find((s) => s.size.toLowerCase() === requestedSize.toLowerCase());
          if (sizeObj) {
            availableStock = sizeObj.stockCount ?? (sizeObj.inStock ? 10 : 0);
            isItemActive = isItemActive && sizeObj.inStock;
          }
        }
      }

      // Check stock and activity
      if (!isItemActive || availableStock <= 0) {
        return NextResponse.json(
          {
            error: `"${productName}" (${requestedSize} / ${requestedColor}) is no longer in stock. Please update your bag.`,
          },
          { status: 400 }
        );
      }

      if (availableStock < requestedQty) {
        return NextResponse.json(
          {
            error: `Insufficient inventory for "${productName}" (${requestedSize}). Only ${availableStock} pieces available (requested: ${requestedQty}).`,
          },
          { status: 400 }
        );
      }

      const lineTotalPaise = calculateLineTotalPaise(unitPrice, requestedQty);
      calculatedSubtotalPaise += lineTotalPaise;

      verifiedOrderItems.push({
        productId: rawProductId,
        variantId,
        productName,
        sku,
        size: requestedSize,
        color: requestedColor,
        image,
        unitPrice,
        unitPricePaise: toPaise(unitPrice),
        quantity: requestedQty,
        lineTotal: toRupees(lineTotalPaise),
        lineTotalPaise,
      });
    }

    const calculatedSubtotal = toRupees(calculatedSubtotalPaise);

    // 6. Server-Side Coupon Verification
    let discountPaise = 0;
    let validatedCouponCode: string | null = null;

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();

      if (isSupabaseConfigured) {
        try {
          const client = createServerClient();
          const { data: dbCoupon } = await (client as any)
            .from('coupons')
            .select('*')
            .ilike('code', cleanCode)
            .eq('is_active', true)
            .maybeSingle();

          if (dbCoupon) {
            const { discountPaise: cDiscPaise } = calculateDiscountPaise(calculatedSubtotalPaise, {
              discountType: dbCoupon.discount_type,
              discountValue: Number(dbCoupon.discount_value),
              minimumOrderRupees: Number(dbCoupon.minimum_order) || 0,
              maximumDiscountRupees: dbCoupon.maximum_discount ? Number(dbCoupon.maximum_discount) : undefined,
            });
            discountPaise = cDiscPaise;
            validatedCouponCode = cleanCode;
          }
        } catch {}
      }

      if (!validatedCouponCode) {
        // Fallback store coupons
        if (cleanCode === 'NILORA10' && calculatedSubtotal >= 999) {
          discountPaise = Math.min(toPaise(1000), Math.round((calculatedSubtotalPaise * 10) / 100));
          validatedCouponCode = 'NILORA10';
        } else if (cleanCode === 'FESTIVE500' && calculatedSubtotal >= 2499) {
          discountPaise = toPaise(500);
          validatedCouponCode = 'FESTIVE500';
        }
      }
    }

    const discountAmount = toRupees(discountPaise);

    // 7. Server Shipping Charge Calculation (Dynamic Zonal Rates from Erode)
    const shippingFeePaise = calculateShippingFeePaise(calculatedSubtotalPaise, shippingAddress);
    const shippingFee = toRupees(shippingFeePaise);

    // 8. Final Amount in INR (Decimal-Safe Integer Paise Math)
    const finalTotalPaise = Math.max(0, calculatedSubtotalPaise - discountPaise + shippingFeePaise);
    const finalTotalAmount = toRupees(finalTotalPaise);

    // 9. COD Eligibility Rules Check
    if (paymentMethod === 'cod') {
      const codCheck = checkCodEligibility(finalTotalAmount, shippingAddress.pincode);
      if (!codCheck.eligible) {
        return NextResponse.json(
          { error: codCheck.reason || 'Cash on Delivery is not available for this order.' },
          { status: 400 }
        );
      }
    }

    // 10. Generate Unique Order Number
    const orderNumber = `NT-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const orderRecord = {
      id: orderId,
      order_number: orderNumber,
      user_id: authenticatedUserId,
      shipping_address_snapshot: {
        fullName: String(shippingAddress.fullName || '').trim(),
        phone: String(shippingAddress.phone || '').trim(),
        email: String(shippingAddress.email || authUserEmail || '').trim(),
        addressLine1: String(shippingAddress.addressLine1 || '').trim(),
        addressLine2: String(shippingAddress.addressLine2 || '').trim(),
        city: String(shippingAddress.city || '').trim(),
        state: String(shippingAddress.state || pinCheck.state || 'India').trim(),
        pincode: String(shippingAddress.pincode || '').trim(),
        country: 'India',
      },
      subtotal: calculatedSubtotal,
      shipping_fee: shippingFee,
      discount_amount: discountAmount,
      total_amount: finalTotalAmount,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'cod' ? 'pending' : 'pending',
      order_status: 'confirmed',
      created_at: nowIso,
      updated_at: nowIso,
      items: verifiedOrderItems.map((item) => ({
        product_id: item.productId,
        product_variant_id: item.variantId || null,
        product_name_snapshot: item.productName,
        sku_snapshot: item.sku,
        size_snapshot: item.size,
        color_snapshot: item.color,
        unit_price_snapshot: item.unitPrice,
        quantity: item.quantity,
        line_total: item.lineTotal,
        image: item.image,
      })),
      tracking: {
        carrier: 'Delhivery Boutique Express',
        tracking_number: `NT-DEL-${orderNumber.replace('NT-', '')}`,
        estimated_delivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      },
    };

    // 11. Atomic Supabase Database Order Creation (if configured)
    if (isSupabaseConfigured) {
      let insertedIntoDb = false;

      // Option A: Try stored procedure if variant IDs are present
      if (verifiedOrderItems.some((i) => i.variantId)) {
        try {
          const client = createServerClient();
          const rpcItems = verifiedOrderItems
            .filter((i) => i.variantId)
            .map((i) => ({
              variant_id: i.variantId,
              quantity: i.quantity,
            }));

          if (rpcItems.length > 0) {
            const { data: rpcData, error: rpcError } = await (client as any).rpc('process_checkout', {
              p_shipping_address: orderRecord.shipping_address_snapshot,
              p_items: rpcItems,
              p_coupon_code: validatedCouponCode || null,
              p_payment_method: paymentMethod,
            });

            if (!rpcError && rpcData) {
              orderRecord.id = rpcData.order_id || orderRecord.id;
              orderRecord.order_number = rpcData.order_number || orderRecord.order_number;
              insertedIntoDb = true;
            }
          }
        } catch (dbErr) {
          console.warn('Supabase stored procedure checkout notice, proceeding with direct database record:', dbErr);
        }
      }

      // Option B: Direct insert into public.orders and public.order_items via Admin Client
      if (!insertedIntoDb) {
        try {
          const adminClient = createAdminServerClient();
          const isUserUuid = authenticatedUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authenticatedUserId);

          const { data: dbOrder, error: orderErr } = await (adminClient as any)
            .from('orders')
            .insert({
              order_number: orderRecord.order_number,
              user_id: isUserUuid ? authenticatedUserId : null,
              shipping_address_snapshot: orderRecord.shipping_address_snapshot,
              subtotal: orderRecord.subtotal,
              shipping_fee: orderRecord.shipping_fee,
              discount_amount: orderRecord.discount_amount,
              total_amount: orderRecord.total_amount,
              payment_method: paymentMethod,
              payment_status: paymentMethod === 'cod' ? 'pending' : 'pending',
              order_status: 'confirmed',
            })
            .select()
            .single();

          if (!orderErr && dbOrder) {
            orderRecord.id = dbOrder.id;
            orderRecord.order_number = dbOrder.order_number;

            const dbItems = verifiedOrderItems.map((item) => {
              const isProdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.productId);
              const isVarUuid = item.variantId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.variantId);
              return {
                order_id: dbOrder.id,
                product_id: isProdUuid ? item.productId : null,
                product_variant_id: isVarUuid ? item.variantId : null,
                product_name_snapshot: item.productName,
                sku_snapshot: item.sku || `SKU-${item.productId}`,
                size_snapshot: item.size,
                color_snapshot: item.color,
                unit_price_snapshot: item.unitPrice,
                quantity: item.quantity,
                line_total: item.lineTotal,
              };
            });

            await (adminClient as any).from('order_items').insert(dbItems);
            insertedIntoDb = true;
          } else if (orderErr) {
            console.warn('Direct order insert notice:', orderErr.message);
          }
        } catch (insertErr) {
          console.warn('Direct order insert exception:', insertErr);
        }
      }
    }

    // 12. Save in idempotency cache and local order store
    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, { order: orderRecord, timestamp: Date.now() });
    }
    ORDER_STORE.set(orderRecord.id, orderRecord);
    ORDER_STORE.set(orderRecord.order_number, orderRecord);

    // 13. Dispatch Order Confirmation Email for confirmed orders
    if (paymentMethod === 'cod') {
      sendOrderConfirmationEmail(orderRecord).catch((err) => {
        console.warn('Order confirmation email notice (COD):', err);
      });
    }

    return NextResponse.json({
      success: true,
      order: orderRecord,
      message:
        paymentMethod === 'cod'
          ? `Boutique order #${orderRecord.order_number} confirmed! Cash on Delivery will be collected upon arrival.`
          : `Boutique order #${orderRecord.order_number} initiated.`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error while processing checkout';
    console.error('Checkout processing error:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
