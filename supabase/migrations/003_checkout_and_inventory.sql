-- =============================================================================
-- NILORA TRENDS - SUPABASE POSTGRESQL MIGRATION 003
-- Server-Side Checkout Processing & Secure Inventory Movement Procedures
-- =============================================================================

-- =============================================================================
-- FUNCTION: public.process_checkout
-- Secure, atomic server-controlled checkout.
-- Validates prices directly against database catalog, verifies stock,
-- applies validated coupons, decrements variant stock, logs inventory movements,
-- and creates immutable order and line-item records.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.process_checkout(
  p_shipping_address JSONB,
  p_items JSONB, -- Array of objects: [{"variant_id": "...", "quantity": 1}]
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
  v_product RECORD;
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
  -- 1. Identify customer (authenticated user or anonymous guest)
  v_user_id := auth.uid();

  -- 2. Validate input items
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Your shopping cart is empty.';
  END IF;

  -- 3. Generate unique order number (e.g. NT-849201)
  v_order_number := 'NT-' || LPAD(FLOOR(100000 + RANDOM() * 900000)::TEXT, 6, '0');

  -- 4. Calculate subtotal and verify stock availability
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS (variant_id UUID, quantity INT)
  LOOP
    IF v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid item quantity: %', v_item.quantity;
    END IF;

    -- Lock variant row for update to prevent concurrent race conditions
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
      RAISE EXCEPTION 'Garment % is no longer available in the boutique.', v_variant.product_name;
    END IF;

    IF v_variant.stock_quantity < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for % (Size: %, Color: %). Available: %, Requested: %',
        v_variant.product_name, v_variant.size, v_variant.color, v_variant.stock_quantity, v_item.quantity;
    END IF;

    -- Use variant price override if set, else base product price
    v_unit_price := COALESCE(v_variant.price_override, v_variant.product_price);
    v_line_total := v_unit_price * v_item.quantity;
    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  -- 5. Process Coupon Code if provided
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

        -- Apply maximum discount cap if specified
        IF v_coupon.maximum_discount IS NOT NULL AND v_discount_amount > v_coupon.maximum_discount THEN
          v_discount_amount := v_coupon.maximum_discount;
        END IF;

        -- Ensure discount does not exceed subtotal
        IF v_discount_amount > v_subtotal THEN
          v_discount_amount := v_subtotal;
        END IF;

        -- Increment coupon usage count
        UPDATE public.coupons 
        SET usage_count = usage_count + 1 
        WHERE id = v_coupon.id;
      END IF;
    END IF;
  END IF;

  -- 6. Calculate shipping fee
  IF v_subtotal >= v_free_shipping_threshold THEN
    v_shipping_fee := 0.00;
  ELSE
    v_shipping_fee := v_standard_shipping_fee;
  END IF;

  -- 7. Calculate final total amount
  v_total_amount := v_subtotal - v_discount_amount + v_shipping_fee;

  -- 8. Insert Order Record
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
    CASE WHEN p_payment_method = 'cod' THEN 'pending' ELSE 'pending' END,
    'confirmed'
  )
  RETURNING id INTO v_order_id;

  -- 9. Insert Order Items, Decrement Variant Stock, Record Inventory Movements
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS (variant_id UUID, quantity INT)
  LOOP
    SELECT pv.*, p.name AS product_name, p.price AS product_price
    INTO v_variant
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = v_item.variant_id;

    v_unit_price := COALESCE(v_variant.price_override, v_variant.product_price);
    v_line_total := v_unit_price * v_item.quantity;

    -- Snapshot line item
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

    -- Decrement stock quantity
    UPDATE public.product_variants
    SET stock_quantity = stock_quantity - v_item.quantity
    WHERE id = v_variant.id;

    -- Log inventory audit movement
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

  -- 10. Clear authenticated user's cart if registered
  IF v_user_id IS NOT NULL THEN
    DELETE FROM public.cart_items
    WHERE cart_id IN (SELECT id FROM public.carts WHERE user_id = v_user_id);
  END IF;

  -- 11. Return created order summary
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

-- Grant execution to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.process_checkout(JSONB, JSONB, TEXT, TEXT) TO authenticated, anon;


-- =============================================================================
-- FUNCTION: public.adjust_inventory
-- Admin-only inventory stock level adjustment with compulsory audit logging.
-- =============================================================================
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
  -- Strict server-side admin check
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
