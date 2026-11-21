/**
 * Shared in-memory / local order store for NILORA TRENDS.
 * Stores orders placed during checkout so they can be retrieved by /api/orders/[id].
 */

export interface StoredOrderRecord {
  id: string;
  order_number: string;
  user_id?: string | null;
  shipping_address_snapshot: any;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  total_amount_paise?: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  items: any[];
  tracking?: {
    carrier: string;
    tracking_number: string;
    estimated_delivery: string;
  };
}

// Global singleton map to persist orders across route module re-evaluations
const globalForOrders = globalThis as unknown as {
  niloraOrdersStore?: Map<string, StoredOrderRecord>;
};

export const ORDER_STORE: Map<string, StoredOrderRecord> =
  globalForOrders.niloraOrdersStore || new Map<string, StoredOrderRecord>();

if (process.env.NODE_ENV !== 'production') {
  globalForOrders.niloraOrdersStore = ORDER_STORE;
}
