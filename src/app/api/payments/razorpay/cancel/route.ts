import { NextRequest, NextResponse } from 'next/server';
import { ORDER_STORE } from '@/lib/order-store';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createServerClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, internalOrderId, reason } = body;

    const orderRecord =
      (internalOrderId && ORDER_STORE.get(internalOrderId)) ||
      (orderNumber && ORDER_STORE.get(orderNumber)) ||
      null;

    if (orderRecord) {
      // If order was pending payment, mark as failed / cancelled
      if (orderRecord.payment_status === 'pending') {
        orderRecord.payment_status = 'failed';
        orderRecord.order_status = 'cancelled';
        orderRecord.cancellation_reason = reason || 'Customer dismissed payment gateway';
        orderRecord.updated_at = new Date().toISOString();

        if (isSupabaseConfigured) {
          try {
            const client = createServerClient();
            await (client as any)
              .from('orders')
              .update({
                payment_status: 'failed',
                order_status: 'cancelled',
                updated_at: new Date().toISOString(),
              })
              .eq('id', orderRecord.id);
          } catch (e) {
            console.warn('DB cancellation note:', e);
          }
        }

        ORDER_STORE.set(orderRecord.id, orderRecord);
        ORDER_STORE.set(orderRecord.order_number, orderRecord);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment dismissal and cancellation recorded safely.',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error cancelling order';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
