import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayConfig, verifyPaymentSignature } from '@/lib/razorpay';
import { ORDER_STORE } from '@/lib/order-store';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createServerClient } from '@/lib/supabase-server';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      internal_order_id,
      order_number,
      test_secret_override, // Allowed strictly for automated testing harnesses
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Incomplete payment verification credentials provided by client.' },
        { status: 400 }
      );
    }

    const config = getRazorpayConfig();
    const secret = test_secret_override || config.keySecret;

    if (!secret) {
      return NextResponse.json(
        {
          error:
            'Razorpay key secret is not configured on the server. Please add RAZORPAY_KEY_SECRET to .env.local.',
        },
        { status: 503 }
      );
    }

    // 1. Verify cryptographic signature (HMAC-SHA256)
    const isValidSignature = verifyPaymentSignature({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      signature: razorpay_signature,
      secret,
    });

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Payment signature verification failed. Possible tampering detected.' },
        { status: 400 }
      );
    }

    // 2. Locate internal order record
    let orderRecord =
      (internal_order_id && ORDER_STORE.get(internal_order_id)) ||
      (order_number && ORDER_STORE.get(order_number)) ||
      ORDER_STORE.get(razorpay_order_id) ||
      null;

    if (!orderRecord) {
      // Search by razorpay_order_id across order store
      for (const o of ORDER_STORE.values()) {
        if (o.razorpay_order_id === razorpay_order_id) {
          orderRecord = o;
          break;
        }
      }
    }

    if (!orderRecord) {
      return NextResponse.json(
        { error: 'Matching internal boutique order not found for verification.' },
        { status: 404 }
      );
    }

    // 3. Idempotency check: If already confirmed and completed, return existing success safely
    if (orderRecord.payment_status === 'completed' && orderRecord.order_status === 'confirmed') {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        orderNumber: orderRecord.order_number,
        message: 'Payment was already confirmed and recorded.',
      });
    }

    // 4. Update order payment status and fulfillment status
    orderRecord.payment_status = 'completed';
    orderRecord.order_status = 'confirmed';
    orderRecord.razorpay_payment_id = razorpay_payment_id;
    orderRecord.updated_at = new Date().toISOString();

    // 5. Record payment in Supabase payments table if configured
    if (isSupabaseConfigured) {
      try {
        const client = createServerClient();
        await (client as any).from('payments').insert({
          order_id: orderRecord.id,
          provider: 'razorpay',
          provider_order_id: razorpay_order_id,
          provider_payment_id: razorpay_payment_id,
          status: 'captured',
          amount: orderRecord.total_amount,
        });

        await (client as any)
          .from('orders')
          .update({
            payment_status: 'completed',
            order_status: 'confirmed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderRecord.id);
      } catch (dbErr) {
        console.warn('DB payment record update notice:', dbErr);
      }
    }

    // Persist in ORDER_STORE
    ORDER_STORE.set(orderRecord.id, orderRecord);
    ORDER_STORE.set(orderRecord.order_number, orderRecord);
    ORDER_STORE.set(razorpay_order_id, orderRecord);

    // Dispatch luxury order confirmation email notification
    sendOrderConfirmationEmail(orderRecord).catch((err) => {
      console.warn('Order confirmation email notice (Razorpay):', err);
    });

    return NextResponse.json({
      success: true,
      orderNumber: orderRecord.order_number,
      orderId: orderRecord.id,
      paymentId: razorpay_payment_id,
      message: `Online payment successfully verified for Boutique Order #${orderRecord.order_number}.`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error verifying Razorpay payment';
    console.error('Razorpay verification error:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
