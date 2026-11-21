-- =============================================================================
-- NILORA TRENDS - SUPABASE POSTGRESQL MIGRATION 002
-- Security Model: Admin Authorization & Row Level Security (RLS) Policies
-- =============================================================================

-- 1. Helper function: public.is_admin(user_id)
-- Checks whether a user is an authorized Nilora Trends administrator.
-- Uses SECURITY DEFINER to avoid recursive policy checks and prevent privilege escalation.
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

-- Helper function: public.is_current_user(user_id)
CREATE OR REPLACE FUNCTION public.is_current_user(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL AND auth.uid() = check_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- 2. ENABLE ROW LEVEL SECURITY ON ALL 16 TABLES
-- =============================================================================
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

-- =============================================================================
-- 3. POLICIES: profiles
-- Users can view & edit their own profile; Administrators can view all
-- =============================================================================
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

-- =============================================================================
-- 4. POLICIES: categories
-- Public can view active categories; Only admins can insert/update/delete
-- =============================================================================
DROP POLICY IF EXISTS "categories_public_read_active" ON public.categories;
CREATE POLICY "categories_public_read_active" ON public.categories
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_admin_all" ON public.categories
  FOR ALL USING (public.is_admin());

-- =============================================================================
-- 5. POLICIES: products
-- Public can view active products; Only admins can modify prices, status & catalog
-- =============================================================================
DROP POLICY IF EXISTS "products_public_read_active" ON public.products;
CREATE POLICY "products_public_read_active" ON public.products
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "products_admin_all" ON public.products;
CREATE POLICY "products_admin_all" ON public.products
  FOR ALL USING (public.is_admin());

-- =============================================================================
-- 6. POLICIES: product_images
-- Public can view images for active garments; Only admins can upload/delete
-- =============================================================================
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

-- =============================================================================
-- 7. POLICIES: product_variants
-- Public can view active sizes & colors; Stock changes strictly admin/server
-- =============================================================================
DROP POLICY IF EXISTS "product_variants_public_read" ON public.product_variants;
CREATE POLICY "product_variants_public_read" ON public.product_variants
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "product_variants_admin_all" ON public.product_variants;
CREATE POLICY "product_variants_admin_all" ON public.product_variants
  FOR ALL USING (public.is_admin());

-- =============================================================================
-- 8. POLICIES: addresses
-- Customers have full control over their own saved addresses; Admin read/manage
-- =============================================================================
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

-- =============================================================================
-- 9. POLICIES: carts & cart_items
-- Customers can only view and manage their own shopping bag
-- =============================================================================
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

-- =============================================================================
-- 10. POLICIES: wishlists
-- Customers manage their own wishlist; Admins can view for analytics
-- =============================================================================
DROP POLICY IF EXISTS "wishlists_select_own" ON public.wishlists;
CREATE POLICY "wishlists_select_own" ON public.wishlists
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "wishlists_insert_own" ON public.wishlists;
CREATE POLICY "wishlists_insert_own" ON public.wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlists_delete_own" ON public.wishlists;
CREATE POLICY "wishlists_delete_own" ON public.wishlists
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- =============================================================================
-- 11. POLICIES: orders & order_items
-- Customers can view their own orders; Admins can view/update all.
-- Order creation & status modifications are server/admin controlled.
-- =============================================================================
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

-- =============================================================================
-- 12. POLICIES: payments
-- Payments can be read by customer of the order; writes strictly server/admin
-- =============================================================================
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

-- =============================================================================
-- 13. POLICIES: reviews
-- Public read; authenticated buyers can submit/edit their own reviews
-- =============================================================================
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

-- =============================================================================
-- 14. POLICIES: coupons
-- Public can read active, non-expired coupons; Only admins can create/update
-- =============================================================================
DROP POLICY IF EXISTS "coupons_public_read_active" ON public.coupons;
CREATE POLICY "coupons_public_read_active" ON public.coupons
  FOR SELECT USING (
    (is_active = true AND (expires_at IS NULL OR expires_at > NOW())) 
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "coupons_admin_all" ON public.coupons;
CREATE POLICY "coupons_admin_all" ON public.coupons
  FOR ALL USING (public.is_admin());

-- =============================================================================
-- 15. POLICIES: inventory_movements
-- Internal audit ledger: strictly admins can view and audit
-- =============================================================================
DROP POLICY IF EXISTS "inventory_movements_admin_all" ON public.inventory_movements;
CREATE POLICY "inventory_movements_admin_all" ON public.inventory_movements
  FOR ALL USING (public.is_admin());

-- =============================================================================
-- 16. POLICIES: admin_roles
-- Only existing administrators can view and manage admin roles
-- =============================================================================
DROP POLICY IF EXISTS "admin_roles_admin_all" ON public.admin_roles;
CREATE POLICY "admin_roles_admin_all" ON public.admin_roles
  FOR ALL USING (public.is_admin());
