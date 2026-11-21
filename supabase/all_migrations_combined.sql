-- =============================================================================
-- NILORA TRENDS - MASTER SUPABASE SQL SETUP SCRIPT (ALL-IN-ONE)
-- Execute this file in your Supabase SQL Editor:
-- Dashboard > SQL Editor > "New Query" > Paste & Run
-- =============================================================================

-- =============================================================================
-- SECTION 1: EXTENSIONS & HELPER FUNCTIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SECTION 2: TABLES DDL (16 CORE ENTITIES)
-- =============================================================================

-- 1. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  fabric TEXT,
  care_instructions TEXT[],
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(10, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. product_images
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  alt_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. product_variants
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  price_override NUMERIC(10, 2) CHECK (price_override IS NULL OR price_override >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. addresses
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. carts
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. cart_items
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cart_items_unique_variant UNIQUE (cart_id, product_variant_id)
);

-- 9. wishlists
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wishlists_user_product_unique UNIQUE (user_id, product_id)
);

-- 10. orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  shipping_address_snapshot JSONB NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL DEFAULT 'cod',
  payment_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  order_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (order_status IN ('pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. order_items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  sku_snapshot TEXT NOT NULL,
  size_snapshot TEXT NOT NULL,
  color_snapshot TEXT NOT NULL,
  unit_price_snapshot NUMERIC(10, 2) NOT NULL CHECK (unit_price_snapshot >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_order_id TEXT,
  provider_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'authorized', 'captured', 'completed', 'failed', 'refunded')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'flat')),
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value >= 0),
  minimum_order NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (minimum_order >= 0),
  maximum_discount NUMERIC(10, 2) CHECK (maximum_discount IS NULL OR maximum_discount >= 0),
  usage_limit INT CHECK (usage_limit IS NULL OR usage_limit > 0),
  usage_count INT NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. inventory_movements
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity_change INT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('order_fulfillment', 'order_cancellation', 'restock', 'manual_adjustment', 'damaged', 'return')),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. admin_roles
CREATE TABLE IF NOT EXISTS public.admin_roles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'manager', 'support')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role)
);

-- =============================================================================
-- SECTION 3: INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant ON public.inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON public.admin_roles(user_id);

-- =============================================================================
-- SECTION 4: SECURITY & ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  IF check_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_roles 
    WHERE user_id = check_user_id
      AND role IN ('superadmin', 'admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_insert_own_or_admin" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;
CREATE POLICY "profiles_admin_delete" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- Categories Policies
DROP POLICY IF EXISTS "categories_public_read_active" ON public.categories;
CREATE POLICY "categories_public_read_active" ON public.categories
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_admin_all" ON public.categories
  FOR ALL USING (public.is_admin());

-- Products Policies
DROP POLICY IF EXISTS "products_public_read_active" ON public.products;
CREATE POLICY "products_public_read_active" ON public.products
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "products_admin_all" ON public.products;
CREATE POLICY "products_admin_all" ON public.products
  FOR ALL USING (public.is_admin());

-- Product Images Policies
DROP POLICY IF EXISTS "product_images_public_read" ON public.product_images;
CREATE POLICY "product_images_public_read" ON public.product_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND (p.is_active = true OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "product_images_admin_all" ON public.product_images;
CREATE POLICY "product_images_admin_all" ON public.product_images
  FOR ALL USING (public.is_admin());

-- Product Variants Policies
DROP POLICY IF EXISTS "product_variants_public_read" ON public.product_variants;
CREATE POLICY "product_variants_public_read" ON public.product_variants
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "product_variants_admin_all" ON public.product_variants;
CREATE POLICY "product_variants_admin_all" ON public.product_variants
  FOR ALL USING (public.is_admin());

-- Addresses Policies
DROP POLICY IF EXISTS "addresses_select_own" ON public.addresses;
CREATE POLICY "addresses_select_own" ON public.addresses
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "addresses_insert_own" ON public.addresses;
CREATE POLICY "addresses_insert_own" ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "addresses_update_own" ON public.addresses;
CREATE POLICY "addresses_update_own" ON public.addresses
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "addresses_delete_own" ON public.addresses;
CREATE POLICY "addresses_delete_own" ON public.addresses
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Carts Policies
DROP POLICY IF EXISTS "carts_select_own" ON public.carts;
CREATE POLICY "carts_select_own" ON public.carts
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "carts_insert_own" ON public.carts;
CREATE POLICY "carts_insert_own" ON public.carts
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "carts_update_own" ON public.carts;
CREATE POLICY "carts_update_own" ON public.carts
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "carts_delete_own" ON public.carts;
CREATE POLICY "carts_delete_own" ON public.carts
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "cart_items_select_own" ON public.cart_items;
CREATE POLICY "cart_items_select_own" ON public.cart_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_id AND (c.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "cart_items_insert_own" ON public.cart_items;
CREATE POLICY "cart_items_insert_own" ON public.cart_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "cart_items_update_own" ON public.cart_items;
CREATE POLICY "cart_items_update_own" ON public.cart_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "cart_items_delete_own" ON public.cart_items;
CREATE POLICY "cart_items_delete_own" ON public.cart_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_id AND (c.user_id = auth.uid() OR public.is_admin())
    )
  );

-- Wishlists Policies
DROP POLICY IF EXISTS "wishlists_select_own" ON public.wishlists;
CREATE POLICY "wishlists_select_own" ON public.wishlists
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "wishlists_insert_own" ON public.wishlists;
CREATE POLICY "wishlists_insert_own" ON public.wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlists_delete_own" ON public.wishlists;
CREATE POLICY "wishlists_delete_own" ON public.wishlists
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Orders Policies
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "order_items_select_own" ON public.order_items;
CREATE POLICY "order_items_select_own" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "order_items_admin_all" ON public.order_items;
CREATE POLICY "order_items_admin_all" ON public.order_items
  FOR ALL USING (public.is_admin());

-- Payments Policies
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;
CREATE POLICY "payments_admin_all" ON public.payments
  FOR ALL USING (public.is_admin());

-- Reviews Policies
DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
CREATE POLICY "reviews_public_read" ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviews_insert_authenticated" ON public.reviews;
CREATE POLICY "reviews_insert_authenticated" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_update_own_or_admin" ON public.reviews;
CREATE POLICY "reviews_update_own_or_admin" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "reviews_delete_own_or_admin" ON public.reviews;
CREATE POLICY "reviews_delete_own_or_admin" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Coupons Policies
DROP POLICY IF EXISTS "coupons_public_read_active" ON public.coupons;
CREATE POLICY "coupons_public_read_active" ON public.coupons
  FOR SELECT USING (
    (is_active = true AND (expires_at IS NULL OR expires_at > NOW())) 
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "coupons_admin_all" ON public.coupons;
CREATE POLICY "coupons_admin_all" ON public.coupons
  FOR ALL USING (public.is_admin());

-- Inventory Movements Policies
DROP POLICY IF EXISTS "inventory_movements_admin_all" ON public.inventory_movements;
CREATE POLICY "inventory_movements_admin_all" ON public.inventory_movements
  FOR ALL USING (public.is_admin());

-- Admin Roles Policies
DROP POLICY IF EXISTS "admin_roles_admin_all" ON public.admin_roles;
CREATE POLICY "admin_roles_admin_all" ON public.admin_roles
  FOR ALL USING (public.is_admin());

-- =============================================================================
-- SECTION 5: SERVER-CONTROLLED CHECKOUT & INVENTORY PROCEDURES
-- =============================================================================
CREATE OR REPLACE FUNCTION public.process_checkout(
  p_shipping_address JSONB,
  p_items JSONB,
  p_coupon_code TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'cod'
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_order_id UUID;
  v_order_number TEXT;
  v_item RECORD;
  v_variant RECORD;
  v_unit_price NUMERIC(10, 2);
  v_line_total NUMERIC(10, 2);
  v_subtotal NUMERIC(10, 2) := 0;
  v_shipping_fee NUMERIC(10, 2) := 0;
  v_discount_amount NUMERIC(10, 2) := 0;
  v_total_amount NUMERIC(10, 2) := 0;
  v_coupon RECORD;
  v_free_shipping_threshold NUMERIC(10, 2) := 1999.00;
  v_standard_shipping_fee NUMERIC(10, 2) := 149.00;
  v_order_result JSONB;
BEGIN
  v_user_id := auth.uid();

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Your shopping cart is empty.';
  END IF;

  v_order_number := 'NT-' || LPAD(FLOOR(100000 + RANDOM() * 900000)::TEXT, 6, '0');

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS (variant_id UUID, quantity INT)
  LOOP
    IF v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid item quantity: %', v_item.quantity;
    END IF;

    SELECT pv.*, p.name AS product_name, p.price AS product_price, p.is_active AS product_is_active
    INTO v_variant
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = v_item.variant_id
    FOR UPDATE OF pv;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product variant not found: %', v_item.variant_id;
    END IF;

    IF NOT v_variant.is_active OR NOT v_variant.product_is_active THEN
      RAISE EXCEPTION 'Garment % is currently unavailable.', v_variant.product_name;
    END IF;

    IF v_variant.stock_quantity < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for % (Size: %, Color: %). Available: %, Requested: %',
        v_variant.product_name, v_variant.size, v_variant.color, v_variant.stock_quantity, v_item.quantity;
    END IF;

    v_unit_price := COALESCE(v_variant.price_override, v_variant.product_price);
    v_line_total := v_unit_price * v_item.quantity;
    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE UPPER(code) = UPPER(TRIM(p_coupon_code))
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    FOR UPDATE;

    IF FOUND THEN
      IF v_subtotal >= v_coupon.minimum_order THEN
        IF v_coupon.discount_type = 'percent' THEN
          v_discount_amount := ROUND((v_subtotal * v_coupon.discount_value / 100.0), 2);
        ELSE
          v_discount_amount := v_coupon.discount_value;
        END IF;

        IF v_coupon.maximum_discount IS NOT NULL AND v_discount_amount > v_coupon.maximum_discount THEN
          v_discount_amount := v_coupon.maximum_discount;
        END IF;

        IF v_discount_amount > v_subtotal THEN
          v_discount_amount := v_subtotal;
        END IF;

        UPDATE public.coupons 
        SET usage_count = usage_count + 1 
        WHERE id = v_coupon.id;
      END IF;
    END IF;
  END IF;

  IF v_subtotal >= v_free_shipping_threshold THEN
    v_shipping_fee := 0.00;
  ELSE
    v_shipping_fee := v_standard_shipping_fee;
  END IF;

  v_total_amount := v_subtotal - v_discount_amount + v_shipping_fee;

  INSERT INTO public.orders (
    order_number,
    user_id,
    shipping_address_snapshot,
    subtotal,
    shipping_fee,
    discount_amount,
    total_amount,
    payment_method,
    payment_status,
    order_status
  ) VALUES (
    v_order_number,
    v_user_id,
    p_shipping_address,
    v_subtotal,
    v_shipping_fee,
    v_discount_amount,
    v_total_amount,
    p_payment_method,
    'pending',
    'confirmed'
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS (variant_id UUID, quantity INT)
  LOOP
    SELECT pv.*, p.name AS product_name, p.price AS product_price
    INTO v_variant
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = v_item.variant_id;

    v_unit_price := COALESCE(v_variant.price_override, v_variant.product_price);
    v_line_total := v_unit_price * v_item.quantity;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_variant_id,
      product_name_snapshot,
      sku_snapshot,
      size_snapshot,
      color_snapshot,
      unit_price_snapshot,
      quantity,
      line_total
    ) VALUES (
      v_order_id,
      v_variant.product_id,
      v_variant.id,
      v_variant.product_name,
      v_variant.sku,
      v_variant.size,
      v_variant.color,
      v_unit_price,
      v_item.quantity,
      v_line_total
    );

    UPDATE public.product_variants
    SET stock_quantity = stock_quantity - v_item.quantity
    WHERE id = v_variant.id;

    INSERT INTO public.inventory_movements (
      variant_id,
      quantity_change,
      reason,
      order_id
    ) VALUES (
      v_variant.id,
      -v_item.quantity,
      'order_fulfillment',
      v_order_id
    );
  END LOOP;

  IF v_user_id IS NOT NULL THEN
    DELETE FROM public.cart_items
    WHERE cart_id IN (SELECT id FROM public.carts WHERE user_id = v_user_id);
  END IF;

  SELECT json_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping_fee,
    'discount_amount', v_discount_amount,
    'total_amount', v_total_amount,
    'payment_method', p_payment_method,
    'order_status', 'confirmed'
  )::JSONB INTO v_order_result;

  RETURN v_order_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.process_checkout(JSONB, JSONB, TEXT, TEXT) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.adjust_inventory(
  p_variant_id UUID,
  p_quantity_change INT,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_new_stock INT;
  v_variant RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only authorized boutique administrators can adjust stock levels.';
  END IF;

  SELECT * INTO v_variant
  FROM public.product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product variant not found: %', p_variant_id;
  END IF;

  v_new_stock := v_variant.stock_quantity + p_quantity_change;
  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'Stock quantity cannot be reduced below zero. Current: %, Change: %',
      v_variant.stock_quantity, p_quantity_change;
  END IF;

  UPDATE public.product_variants
  SET stock_quantity = v_new_stock
  WHERE id = p_variant_id;

  INSERT INTO public.inventory_movements (
    variant_id,
    quantity_change,
    reason
  ) VALUES (
    p_variant_id,
    p_quantity_change,
    p_reason
  );

  RETURN json_build_object(
    'variant_id', p_variant_id,
    'previous_stock', v_variant.stock_quantity,
    'new_stock', v_new_stock,
    'quantity_change', p_quantity_change,
    'reason', p_reason
  )::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.adjust_inventory(UUID, INT, TEXT) TO authenticated;

-- =============================================================================
-- SECTION 6: STORAGE BUCKETS & STORAGE POLICIES
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product-media', 'product-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "product_media_public_read" ON storage.objects;
CREATE POLICY "product_media_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-media');

DROP POLICY IF EXISTS "product_media_admin_insert" ON storage.objects;
CREATE POLICY "product_media_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-media' AND (public.is_admin() OR auth.role() = 'service_role'));

DROP POLICY IF EXISTS "product_media_admin_update" ON storage.objects;
CREATE POLICY "product_media_admin_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-media' AND (public.is_admin() OR auth.role() = 'service_role'));

DROP POLICY IF EXISTS "product_media_admin_delete" ON storage.objects;
CREATE POLICY "product_media_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-media' AND (public.is_admin() OR auth.role() = 'service_role'));

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_user_insert" ON storage.objects;
CREATE POLICY "avatars_user_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin() OR auth.role() = 'service_role')
  );

DROP POLICY IF EXISTS "avatars_user_update" ON storage.objects;
CREATE POLICY "avatars_user_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin() OR auth.role() = 'service_role')
  );

DROP POLICY IF EXISTS "avatars_user_delete" ON storage.objects;
CREATE POLICY "avatars_user_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin() OR auth.role() = 'service_role')
  );

-- =============================================================================
-- SECTION 7: SEED CATALOG DATA
-- =============================================================================
DO $$
DECLARE
  v_cat_coord_id UUID;
  v_cat_kurta_id UUID;
  v_cat_saree_id UUID;
  v_prod_id UUID;
BEGIN
  INSERT INTO public.categories (name, slug, description, image_url, is_active)
  VALUES 
    ('Co-ord Sets', 'co-ord-sets', 'Modern matching two-piece ensembles curated in pure linen, raw silk, and crepe.', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80', true)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true
  RETURNING id INTO v_cat_coord_id;

  INSERT INTO public.categories (name, slug, description, image_url, is_active)
  VALUES 
    ('Kurtas', 'kurtas', 'Royal Chanderi and pure Mulmul kurtas adorned with Kashmiri Aari, Gota Patti, and Lucknowi Chikankari.', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80', true)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true
  RETURNING id INTO v_cat_kurta_id;

  INSERT INTO public.categories (name, slug, description, image_url, is_active)
  VALUES 
    ('Sarees', 'sarees', 'Heirloom Banarasi Katan silk, featherlight tissue organza, and handcrafted Chanderi drapes.', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80', true)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true
  RETURNING id INTO v_cat_saree_id;

  -- Product 1
  INSERT INTO public.products (category_id, name, slug, description, fabric, care_instructions, price, compare_at_price, is_active, is_featured)
  VALUES (
    v_cat_coord_id, 'Ivory Aari Embroidered Linen Co-ord Set', 'ivory-embroidered-linen-coord-set',
    'An understated statement in ivory. Featuring delicate gold threadwork around the notched neckline and sleeve cuffs, this linen co-ord set pairs an airy silhouette with sharp cigarette trousers for effortless elegance.',
    '100% Pure Organic Linen with Zari Aari threadwork',
    ARRAY['Dry clean recommended for first wash', 'Cold gentle hand wash', 'Iron inside out', 'Dry in shade'],
    499.00, 999.00, true, true
  ) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price
  RETURNING id INTO v_prod_id;

  DELETE FROM public.product_images WHERE product_id = v_prod_id;
  INSERT INTO public.product_images (product_id, image_url, sort_order, alt_text) VALUES
    (v_prod_id, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80', 0, 'Ivory Front View'),
    (v_prod_id, 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80', 1, 'Editorial Side View');

  DELETE FROM public.product_variants WHERE product_id = v_prod_id;
  INSERT INTO public.product_variants (product_id, sku, size, color, stock_quantity, is_active) VALUES
    (v_prod_id, 'NT-CD-001-S-IVY', 'S', 'Ivory Pearl', 10, true),
    (v_prod_id, 'NT-CD-001-M-IVY', 'M', 'Ivory Pearl', 15, true),
    (v_prod_id, 'NT-CD-001-L-IVY', 'L', 'Ivory Pearl', 8, true);

  -- Product 2
  INSERT INTO public.products (category_id, name, slug, description, fabric, care_instructions, price, compare_at_price, is_active, is_featured)
  VALUES (
    v_cat_coord_id, 'Champagne Crepe Silk Wrap Co-ord Set', 'champagne-silk-wrap-blazer-coord',
    'Sculpted for festive gatherings and evening glam. Crafted in rich champagne crepe silk that drapes gracefully.',
    'Heavy Crepe Silk with French satin lining',
    ARRAY['Dry clean only', 'Store in cotton bag'],
    699.00, 1299.00, true, true
  ) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price
  RETURNING id INTO v_prod_id;

  DELETE FROM public.product_images WHERE product_id = v_prod_id;
  INSERT INTO public.product_images (product_id, image_url, sort_order, alt_text) VALUES
    (v_prod_id, 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80', 0, 'Champagne Wrap Front View');

  DELETE FROM public.product_variants WHERE product_id = v_prod_id;
  INSERT INTO public.product_variants (product_id, sku, size, color, stock_quantity, is_active) VALUES
    (v_prod_id, 'NT-CD-002-S-CHP', 'S', 'Champagne Glow', 7, true),
    (v_prod_id, 'NT-CD-002-M-CHP', 'M', 'Champagne Glow', 10, true);

  -- Product 3
  INSERT INTO public.products (category_id, name, slug, description, fabric, care_instructions, price, compare_at_price, is_active, is_featured)
  VALUES (
    v_cat_kurta_id, 'Royal Chanderi Silk Kurta & Pants Set', 'royal-chanderi-silk-kurta-set',
    'Handwoven pure Chanderi silk kurta paired with tonal cigarette trousers and sheer tissue dupatta.',
    'Pure Chanderi Silk & Mulmul Cotton Lining',
    ARRAY['Dry clean only', 'Keep wrapped in muslin'],
    599.00, 1199.00, true, true
  ) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price
  RETURNING id INTO v_prod_id;

  DELETE FROM public.product_images WHERE product_id = v_prod_id;
  INSERT INTO public.product_images (product_id, image_url, sort_order, alt_text) VALUES
    (v_prod_id, 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80', 0, 'Royal Wine Front View');

  DELETE FROM public.product_variants WHERE product_id = v_prod_id;
  INSERT INTO public.product_variants (product_id, sku, size, color, stock_quantity, is_active) VALUES
    (v_prod_id, 'NT-KT-001-S-WNE', 'S', 'Royal Wine', 8, true),
    (v_prod_id, 'NT-KT-001-M-WNE', 'M', 'Royal Wine', 14, true);

  -- Product 4
  INSERT INTO public.products (category_id, name, slug, description, fabric, care_instructions, price, compare_at_price, is_active, is_featured)
  VALUES (
    v_cat_saree_id, 'Whisper-Light Tissue Organza Banarasi Saree', 'whisper-light-tissue-organza-saree',
    'Woven with real silver and gold-dipped zari in the holy looms of Varanasi.',
    'Pure Tissue Organza with 24k Gold electroplated Zari border',
    ARRAY['Dry clean only', 'Store folded with butter paper'],
    899.00, 1899.00, true, true
  ) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price
  RETURNING id INTO v_prod_id;

  DELETE FROM public.product_images WHERE product_id = v_prod_id;
  INSERT INTO public.product_images (product_id, image_url, sort_order, alt_text) VALUES
    (v_prod_id, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80', 0, 'Tissue Saree Main Drapery');

  DELETE FROM public.product_variants WHERE product_id = v_prod_id;
  INSERT INTO public.product_variants (product_id, sku, size, color, stock_quantity, is_active) VALUES
    (v_prod_id, 'NT-SR-001-FS-GLD', 'Free Size', 'Liquid Gold', 12, true);

  -- Coupons
  INSERT INTO public.coupons (code, discount_type, discount_value, minimum_order, maximum_discount, is_active)
  VALUES
    ('NILORA10', 'percent', 10.00, 999.00, 500.00, true),
    ('FESTIVE500', 'flat', 500.00, 2499.00, 500.00, true),
    ('WELCOMEVIP', 'percent', 15.00, 1499.00, 750.00, true)
  ON CONFLICT (code) DO UPDATE SET is_active = true;

END $$;
