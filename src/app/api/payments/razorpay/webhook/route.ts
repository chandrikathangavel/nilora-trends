import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayConfig, verifyWebhookSignature, PROCESSED_WEBHOOKS } from '@/lib/razorpay';
import { ORDER_STORE } from '@/lib/order-store';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createServerClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const testSecretOverride = req.headers.get('x-test-secret-override');

    if (!signature) {
      return NextResponse.json({ error: 'Missing Razorpay webhook signature header.' }, { status: 400 });
    }

    const config = getRazorpayConfig();
    const webhookSecret = testSecretOverride || config.webhookSecret;

    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'RAZORPAY_WEBHOOK_SECRET is not configured on the server.' },
        { status: 503 }
      );
    }

    // 1. Verify Cryptographic Webhook Signature
    const isValid = verifyWebhookSignature({
      bodyString: rawBody,
      signature,
      webhookSecret,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventId = event.id || `${event.event}_${event.created_at || Date.now()}`;

    // 2. Idempotency Check: Guard against duplicate delivery
    if (PROCESSED_WEBHOOKS.has(eventId)) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: 'Webhook event was previously processed idempotently.',
      });
    }

    // Mark event as processed
    PROCESSED_WEBHOOKS.set(eventId, {
      timestamp: Date.now(),
      result: event.event,
    });

    const eventType = event.event;
    const paymentEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;

    // 3. Handle 'payment.captured' or 'order.paid'
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id;
      const currency = paymentEntity?.currency || orderEntity?.currency;
      const amountPaise = paymentEntity?.amount || orderEntity?.amount;

      // Currency check
      if (currency && currency.toUpperCase() !== 'INR') {
        return NextResponse.json({ error: 'Invalid currency. Only INR is supported.' }, { status: 400 });
      }

      // Locate internal order
      const internalOrderId =
        paymentEntity?.notes?.internal_order_id || orderEntity?.notes?.internal_order_id;
      const orderNumber = paymentEntity?.notes?.order_number || orderEntity?.notes?.order_number;

      let orderRecord =
        (internalOrderId && ORDER_STORE.get(internalOrderId)) ||
        (orderNumber && ORDER_STORE.get(orderNumber)) ||
        (razorpayOrderId && ORDER_STORE.get(razorpayOrderId)) ||
        null;

      if (!orderRecord && razorpayOrderId) {
        for (const o of ORDER_STORE.values()) {
          if (o.razorpay_order_id === razorpayOrderId) {
            orderRecord = o;
            break;
          }
        }
      }

      if (orderRecord) {
        // Amount verification
        const expectedPaise = Math.round(orderRecord.total_amount * 100);
        if (amountPaise && Math.abs(expectedPaise - amountPaise) > 100) {
          console.error('Webhook amount mismatch detected:', {
            expectedPaise,
            receivedAmount: amountPaise,
            orderNumber: orderRecord.order_number,
          });
          return NextResponse.json(
            { error: 'Payment amount mismatch between webhook and internal order.' },
            { status: 400 }
          );
        }

        // Transition order status
        orderRecord.payment_status = 'completed';
        orderRecord.order_status = 'confirmed';
        if (razorpayPaymentId) {
          orderRecord.razorpay_payment_id = razorpayPaymentId;
        }
        orderRecord.updated_at = new Date().toISOString();

        // Database persistence if Supabase configured
        if (isSupabaseConfigured) {
          try {
            const client = createServerClient();
            await (client as any).from('payments').insert({
              order_id: orderRecord.id,
              provider: 'razorpay',
              provider_order_id: razorpayOrderId,
              provider_payment_id: razorpayPaymentId || `pay_wh_${Date.now()}`,
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
            console.warn('Webhook DB persistence notice:', dbErr);
          }
        }

        ORDER_STORE.set(orderRecord.id, orderRecord);
        ORDER_STORE.set(orderRecord.order_number, orderRecord);
        if (razorpayOrderId) ORDER_STORE.set(razorpayOrderId, orderRecord);
      }
    }

    // 4. Handle 'payment.failed'
    if (eventType === 'payment.failed') {
      const razorpayOrderId = paymentEntity?.order_id;
      let orderRecord = razorpayOrderId ? ORDER_STORE.get(razorpayOrderId) : null;
      if (!orderRecord && razorpayOrderId) {
        for (const o of ORDER_STORE.values()) {
          if (o.razorpay_order_id === razorpayOrderId) {
            orderRecord = o;
            break;
          }
        }
      }

      if (orderRecord) {
        orderRecord.payment_status = 'failed';
        orderRecord.updated_at = new Date().toISOString();
        ORDER_STORE.set(orderRecord.id, orderRecord);
        ORDER_STORE.set(orderRecord.order_number, orderRecord);
      }
    }

    // 5. Handle 'refund.processed'
    if (eventType === 'refund.processed') {
      const refundEntity = event.payload?.refund?.entity;
      const paymentId = refundEntity?.payment_id;
      if (paymentId) {
        for (const o of ORDER_STORE.values()) {
          if (o.razorpay_payment_id === paymentId) {
            o.payment_status = 'refunded';
            o.updated_at = new Date().toISOString();
            break;
          }
        }
      }
    }

    return NextResponse.json({ success: true, processedEvent: eventType });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error processing Razorpay webhook';
    console.error('Razorpay webhook processing error:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
