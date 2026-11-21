export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          fabric: string | null;
          care_instructions: string[] | null;
          price: number;
          compare_at_price: number | null;
          is_active: boolean;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          fabric?: string | null;
          care_instructions?: string[] | null;
          price: number;
          compare_at_price?: number | null;
          is_active?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          fabric?: string | null;
          care_instructions?: string[] | null;
          price?: number;
          compare_at_price?: number | null;
          is_active?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          image_url: string;
          sort_order: number;
          alt_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          image_url: string;
          sort_order?: number;
          alt_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          image_url?: string;
          sort_order?: number;
          alt_text?: string | null;
          created_at?: string;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          size: string;
          color: string;
          stock_quantity: number;
          price_override: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          size: string;
          color: string;
          stock_quantity?: number;
          price_override?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          sku?: string;
          size?: string;
          color?: string;
          stock_quantity?: number;
          price_override?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          phone: string;
          address_line1: string;
          address_line2: string | null;
          city: string;
          state: string;
          pincode: string;
          country: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          phone: string;
          address_line1: string;
          address_line2?: string | null;
          city: string;
          state: string;
          pincode: string;
          country?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          phone?: string;
          address_line1?: string;
          address_line2?: string | null;
          city?: string;
          state?: string;
          pincode?: string;
          country?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      carts: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          product_variant_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          product_variant_id: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cart_id?: string;
          product_variant_id?: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          shipping_address_snapshot: Json;
          subtotal: number;
          shipping_fee: number;
          discount_amount: number;
          total_amount: number;
          payment_method: string;
          payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
          order_status: 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          user_id?: string | null;
          shipping_address_snapshot: Json;
          subtotal: number;
          shipping_fee?: number;
          discount_amount?: number;
          total_amount: number;
          payment_method?: string;
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
          order_status?: 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          user_id?: string | null;
          shipping_address_snapshot?: Json;
          subtotal?: number;
          shipping_fee?: number;
          discount_amount?: number;
          total_amount?: number;
          payment_method?: string;
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
          order_status?: 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_variant_id: string | null;
          product_name_snapshot: string;
          sku_snapshot: string;
          size_snapshot: string;
          color_snapshot: string;
          unit_price_snapshot: number;
          quantity: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_variant_id?: string | null;
          product_name_snapshot: string;
          sku_snapshot: string;
          size_snapshot: string;
          color_snapshot: string;
          unit_price_snapshot: number;
          quantity: number;
          line_total: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_variant_id?: string | null;
          product_name_snapshot?: string;
          sku_snapshot?: string;
          size_snapshot?: string;
          color_snapshot?: string;
          unit_price_snapshot?: number;
          quantity?: number;
          line_total?: number;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          provider: string;
          provider_order_id: string | null;
          provider_payment_id: string | null;
          status: 'pending' | 'authorized' | 'captured' | 'completed' | 'failed' | 'refunded';
          amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          provider?: string;
          provider_order_id?: string | null;
          provider_payment_id?: string | null;
          status?: 'pending' | 'authorized' | 'captured' | 'completed' | 'failed' | 'refunded';
          amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          provider?: string;
          provider_order_id?: string | null;
          provider_payment_id?: string | null;
          status?: 'pending' | 'authorized' | 'captured' | 'completed' | 'failed' | 'refunded';
          amount?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string | null;
          rating: number;
          title: string | null;
          comment: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id?: string | null;
          rating: number;
          title?: string | null;
          comment: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          user_id?: string | null;
          rating?: number;
          title?: string | null;
          comment?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          discount_type: 'percent' | 'flat';
          discount_value: number;
          minimum_order: number;
          maximum_discount: number | null;
          usage_limit: number | null;
          usage_count: number;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          discount_type: 'percent' | 'flat';
          discount_value: number;
          minimum_order?: number;
          maximum_discount?: number | null;
          usage_limit?: number | null;
          usage_count?: number;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          discount_type?: 'percent' | 'flat';
          discount_value?: number;
          minimum_order?: number;
          maximum_discount?: number | null;
          usage_limit?: number | null;
          usage_count?: number;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_movements: {
        Row: {
          id: string;
          variant_id: string;
          quantity_change: number;
          reason: 'order_fulfillment' | 'order_cancellation' | 'restock' | 'manual_adjustment' | 'damaged' | 'return';
          order_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          variant_id: string;
          quantity_change: number;
          reason: 'order_fulfillment' | 'order_cancellation' | 'restock' | 'manual_adjustment' | 'damaged' | 'return';
          order_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          variant_id?: string;
          quantity_change?: number;
          reason?: 'order_fulfillment' | 'order_cancellation' | 'restock' | 'manual_adjustment' | 'damaged' | 'return';
          order_id?: string | null;
          created_at?: string;
        };
      };
      admin_roles: {
        Row: {
          user_id: string;
          role: 'superadmin' | 'admin' | 'manager' | 'support';
          created_at: string;
        };
        Insert: {
          user_id: string;
          role?: 'superadmin' | 'admin' | 'manager' | 'support';
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: 'superadmin' | 'admin' | 'manager' | 'support';
          created_at?: string;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: { check_user_id?: string };
        Returns: boolean;
      };
      process_checkout: {
        Args: {
          p_shipping_address: Json;
          p_items: Json;
          p_coupon_code?: string | null;
          p_payment_method?: string;
        };
        Returns: Json;
      };
      adjust_inventory: {
        Args: {
          p_variant_id: string;
          p_quantity_change: number;
          p_reason: string;
        };
        Returns: Json;
      };
    };
  };
}
