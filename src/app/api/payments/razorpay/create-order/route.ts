import { NextRequest, NextResponse } from 'next/server';
import { DEMO_PRODUCTS } from '@/data/demoProducts';
import {
  toPaise,
  toRupees,
  calculateLineTotalPaise,
  calculateShippingFeePaise,
  calculateDiscountPaise,
} from '@/lib/money';
import { getRazorpayConfig, getRazorpayClient } from '@/lib/razorpay';
import { ORDER_STORE } from '@/lib/order-store';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createServerClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, shippingAddress, couponCode, userId, notes } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one garment is required in your bag.' }, { status: 400 });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.pincode) {
      return NextResponse.json(
        { error: 'Valid delivery contact name, phone and Indian PIN code are required.' },
        { status: 400 }
      );
    }

    // 1. Revalidate all items and calculate subtotal securely in integer paise
    let calculatedSubtotalPaise = 0;
    const verifiedOrderItems: any[] = [];

    // Check DB products if configured
    let dbProducts: any[] = [];
    if (isSupabaseConfigured) {
      try {
        const client = createServerClient();
        const pIds = Array.from(new Set(items.map((i: any) => i.productId)));
        const { data } = await (client as any)
          .from('products')
          .select(`
            id, name, slug, price, is_active,
            product_variants (id, sku, size, color, stock_quantity, price_override, is_active)
          `)
          .in('id', pIds);
        if (data) dbProducts = data;
      } catch (e) {
        console.warn('DB catalog lookup notice:', e);
      }
    }

    for (const rawItem of items) {
      const rawProductId = rawItem.productId;
      const requestedSize = String(rawItem.selectedSize || 'M').trim();
      const requestedColor = String(rawItem.selectedColor || 'Default').trim();
      const requestedQty = Math.max(1, Math.min(10, parseInt(String(rawItem.quantity || 1), 10)));

      let productName = 'Couture Garment';
      let unitPrice = 499;
      let sku = `NT-${rawProductId}-${requestedSize}`;
      let availableStock = 10;
      let isItemActive = true;
      let variantId: string | null = null;
      let image = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80';

      const dbProd = dbProducts.find((p) => p.id === rawProductId || p.slug === rawProductId);
      if (dbProd) {
        productName = dbProd.name;
        unitPrice = Number(dbProd.price) || unitPrice;
        isItemActive = Boolean(dbProd.is_active);

        const variant = dbProd.product_variants?.find(
          (v: any) =>
            v.size?.toLowerCase() === requestedSize.toLowerCase() &&
            (!v.color || v.color.toLowerCase() === requestedColor.toLowerCase())
        );

        if (variant) {
          variantId = variant.id;
          sku = variant.sku || sku;
          if (variant.price_override != null) unitPrice = Number(variant.price_override);
          availableStock = Number(variant.stock_quantity) || 0;
          isItemActive = isItemActive && Boolean(variant.is_active);
        }
      } else {
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

      if (!isItemActive || availableStock <= 0) {
        return NextResponse.json(
          { error: `"${productName}" (${requestedSize} / ${requestedColor}) is no longer in stock.` },
          { status: 400 }
        );
      }

      if (availableStock < requestedQty) {
        return NextResponse.json(
          {
            error: `Insufficient inventory for "${productName}" (${requestedSize}). Only ${availableStock} pieces available.`,
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
        quantity: requestedQty,
        lineTotal: toRupees(lineTotalPaise),
        lineTotalPaise,
      });
    }

    const calculatedSubtotal = toRupees(calculatedSubtotalPaise);

    // 2. Validate coupon if provided
    let discountPaise = 0;
    let validatedCouponCode: string | null = null;

    if (couponCode && typeof couponCode === 'string') {
      const cleanCode = couponCode.trim().toUpperCase();
      if (cleanCode === 'NILORA10') {
        const disc = calculateDiscountPaise(calculatedSubtotalPaise, {
          discountType: 'percent',
          discountValue: 10,
        });
        discountPaise = disc.discountPaise;
        validatedCouponCode = 'NILORA10';
      } else if (cleanCode === 'FESTIVE500') {
        if (calculatedSubtotalPaise >= toPaise(2499)) {
          const disc = calculateDiscountPaise(calculatedSubtotalPaise, {
            discountType: 'flat',
            discountValue: 500,
            minimumOrderRupees: 2499,
          });
          discountPaise = disc.discountPaise;
          if (!disc.error) validatedCouponCode = 'FESTIVE500';
        }
      }
    }

    // 3. Shipping fee calculation (Dynamic Zonal Rates from Erode: Zone 1 ₹40, Zone 2 ₹50-₹60, Zone 3 ₹55-₹101)
    const shippingFeePaise = calculateShippingFeePaise(calculatedSubtotalPaise, shippingAddress);
    const shippingFee = toRupees(shippingFeePaise);

    // 4. Final total
    const totalAmountPaise = Math.max(0, calculatedSubtotalPaise - discountPaise + shippingFeePaise);
    const totalAmount = toRupees(totalAmountPaise);
    const discountAmount = toRupees(discountPaise);

    // 5. Generate internal order number
    const orderNumber = `NT-${Math.floor(100000 + Math.random() * 900000)}`;
    const internalOrderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 6. Check Razorpay Configuration
    const razorpayConfig = getRazorpayConfig();
    const razorpayClient = getRazorpayClient();

    let razorpayOrderId = '';
    let isTestSimulation = false;

    if (razorpayClient && razorpayConfig.isConfigured) {
      try {
        const rzpOrder = await razorpayClient.orders.create({
          amount: totalAmountPaise,
          currency: 'INR',
          receipt: orderNumber,
          notes: {
            internal_order_id: internalOrderId,
            order_number: orderNumber,
            user_id: userId || 'guest',
            ...(notes || {}),
          },
        });
        razorpayOrderId = rzpOrder.id;
      } catch (rzpErr: any) {
        console.error('Razorpay API order creation error:', rzpErr);
        return NextResponse.json(
          { error: rzpErr?.error?.description || 'Failed to initiate order with Razorpay gateway.' },
          { status: 502 }
        );
      }
    } else {
      // Safe fallback test simulation mode (allows test suites and preview without live merchant keys)
      isTestSimulation = true;
      razorpayOrderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    // 7. Store internal order in pending payment state
    const orderRecord = {
      id: internalOrderId,
      order_number: orderNumber,
      user_id: userId || null,
      shipping_address_snapshot: shippingAddress,
      subtotal: calculatedSubtotal,
      shipping_fee: shippingFee,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      total_amount_paise: totalAmountPaise,
      payment_method: 'razorpay',
      payment_status: 'pending',
      order_status: 'pending',
      razorpay_order_id: razorpayOrderId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: verifiedOrderItems.map((item) => ({
        product_id: item.productId,
        product_variant_id: item.variantId,
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

    ORDER_STORE.set(internalOrderId, orderRecord);
    ORDER_STORE.set(orderNumber, orderRecord);
    ORDER_STORE.set(razorpayOrderId, orderRecord);

    return NextResponse.json({
      success: true,
      orderId: razorpayOrderId,
      amount: totalAmountPaise,
      currency: 'INR',
      keyId: razorpayConfig.keyId || 'rzp_test_placeholder',
      orderNumber,
      internalOrderId,
      isTestMode: razorpayConfig.isTestMode,
      isTestSimulation,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error creating Razorpay payment order';
    console.error('Razorpay create-order error:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
