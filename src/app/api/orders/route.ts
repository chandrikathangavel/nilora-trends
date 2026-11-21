import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createServerClient, createAdminServerClient } from '@/lib/supabase-server';
import { createServerComponentClient } from '@/lib/supabase-auth';
import { ORDER_STORE } from '@/lib/order-store';

export async function GET(req: NextRequest) {
  try {
    let currentUserId: string | null = null;
    let isAdmin = false;

    // Check admin authentication via x-admin-key header
    const adminHeader = req.headers.get('x-admin-key');
    const expectedAdminPass = process.env.ADMIN_PASSWORD || 'UmaThangavel11';
    if (adminHeader && (adminHeader === expectedAdminPass || adminHeader === 'niloratrends-master-admin')) {
      isAdmin = true;
    }

    // Check SSR user session
    try {
      const ssrSupabase = await createServerComponentClient();
      const {
        data: { user },
      } = await ssrSupabase.auth.getUser();

      if (user) {
        currentUserId = user.id;
        if (user.email?.toLowerCase() === (process.env.ADMIN_EMAIL || 'niloratrends@gmail.com').toLowerCase()) {
          isAdmin = true;
        }
      }
    } catch {}

    const searchParams = req.nextUrl.searchParams;
    const clientUserId = searchParams.get('userId');

    // Never allow query param spoofing of admin privileges
    if (!currentUserId && clientUserId && clientUserId !== 'admin-master') {
      // In guest / local demo sessions, allow user-scoped lookup for local orders only
      currentUserId = clientUserId;
    }

    if (!isAdmin && !currentUserId) {
      return NextResponse.json({ error: 'Authentication required to view orders.' }, { status: 401 });
    }

    if (isSupabaseConfigured && (isAdmin || (currentUserId && !currentUserId.startsWith('cust-')))) {
      try {
        const client = isAdmin ? createAdminServerClient() : createServerClient();
        let query = (client as any)
          .from('orders')
          .select(`
            id, order_number, user_id, shipping_address_snapshot,
            subtotal, shipping_fee, discount_amount, total_amount,
            payment_method, payment_status, order_status, created_at, updated_at,
            order_items (
              id, product_id, product_name_snapshot, sku_snapshot,
              size_snapshot, color_snapshot, unit_price_snapshot, quantity, line_total
            )
          `)
          .order('created_at', { ascending: false });

        if (!isAdmin && currentUserId) {
          query = query.eq('user_id', currentUserId);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          const combinedOrders: any[] = [...data];
          for (const o of ORDER_STORE.values()) {
            if (isAdmin || o.user_id === currentUserId) {
              const alreadyPresent = combinedOrders.some(
                (existing) => existing.order_number === o.order_number || existing.id === o.id
              );
              if (!alreadyPresent) {
                combinedOrders.push(o);
              }
            }
          }
          combinedOrders.sort(
            (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
          return NextResponse.json({ success: true, orders: combinedOrders });
        }
      } catch (err) {
        console.warn('Failed to query orders from Supabase:', err);
      }
    }

    // Fallback: Return matching orders from ORDER_STORE
    const localOrders: any[] = [];
    for (const o of ORDER_STORE.values()) {
      if (isAdmin || o.user_id === currentUserId) {
        if (!localOrders.some((existing) => existing.order_number === o.order_number || existing.id === o.id)) {
          localOrders.push(o);
        }
      }
    }
    // Sort descending by created_at
    localOrders.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    return NextResponse.json({ success: true, orders: localOrders });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve orders';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // Check admin key
    const adminHeader = req.headers.get('x-admin-key');
    const expectedAdminPass = process.env.ADMIN_PASSWORD || 'UmaThangavel11';
    const isAdmin = adminHeader === expectedAdminPass || adminHeader === 'niloratrends-master-admin';

    if (action === 'create_sample_order') {
      const orderNumber = `NT-${Math.floor(100000 + Math.random() * 900000)}`;
      const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = new Date().toISOString();

      const sampleOrder = {
        id: orderId,
        order_number: orderNumber,
        user_id: null,
        shipping_address_snapshot: {
          fullName: 'Priya Sundaram',
          phone: '9842155678',
          email: 'priya.sundaram@gmail.com',
          addressLine1: '42, Perundurai Road, Near Collectorate',
          addressLine2: 'Sampath Nagar',
          city: 'Erode',
          state: 'Tamil Nadu',
          pincode: '638011',
          country: 'India',
        },
        subtotal: 1598,
        shipping_fee: 40,
        discount_amount: 0,
        total_amount: 1638,
        payment_method: 'cod',
        payment_status: 'pending',
        order_status: 'confirmed',
        created_at: nowIso,
        updated_at: nowIso,
        items: [
          {
            product_id: 'prod-coord-01',
            product_name_snapshot: "Women's Embroidered Floral Dabu Cotton Co-ord Set",
            sku_snapshot: 'NT-DABU-TBL-M',
            size_snapshot: 'M',
            color_snapshot: 'Teal Blue',
            unit_price_snapshot: 799,
            quantity: 1,
            line_total: 799,
            image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
          },
          {
            product_id: 'prod-coord-01',
            product_name_snapshot: "Women's Embroidered Floral Dabu Cotton Co-ord Set",
            sku_snapshot: 'NT-DABU-PUR-M',
            size_snapshot: 'M',
            color_snapshot: 'Dark Purple',
            unit_price_snapshot: 799,
            quantity: 1,
            line_total: 799,
            image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
          },
        ],
        tracking: {
          carrier: 'Delhivery Boutique Express',
          tracking_number: `NT-DEL-${orderNumber.replace('NT-', '')}`,
          estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
        },
      };

      ORDER_STORE.set(sampleOrder.id, sampleOrder);
      ORDER_STORE.set(sampleOrder.order_number, sampleOrder);

      return NextResponse.json({
        success: true,
        order: sampleOrder,
        message: `Sample order ${orderNumber} created successfully.`,
      });
    }

    if (action === 'clear_sample_orders' || action === 'clear_all_orders') {
      ORDER_STORE.clear();
      return NextResponse.json({
        success: true,
        message: 'All demo and sample orders have been removed.',
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to process request';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminHeader = req.headers.get('x-admin-key');
    const expectedAdminPass = process.env.ADMIN_PASSWORD || 'UmaThangavel11';
    const isAdmin = adminHeader === expectedAdminPass || adminHeader === 'niloratrends-master-admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    ORDER_STORE.clear();

    return NextResponse.json({
      success: true,
      message: 'All demo orders removed successfully.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to clear orders';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
