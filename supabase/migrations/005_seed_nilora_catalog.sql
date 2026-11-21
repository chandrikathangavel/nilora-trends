-- =============================================================================
-- NILORA TRENDS - SUPABASE POSTGRESQL MIGRATION 005
-- Safe Production Seed: Categories, Luxury Products, Variants, Images & Coupons
-- =============================================================================

DO $$
DECLARE
  v_cat_coord_id UUID;
  v_cat_kurta_id UUID;
  v_cat_saree_id UUID;
  v_prod_id UUID;
BEGIN
  -- 1. SEED CATEGORIES
  INSERT INTO public.categories (name, slug, description, image_url, is_active)
  VALUES 
    (
      'Co-ord Sets', 
      'co-ord-sets', 
      'Modern matching two-piece ensembles curated in pure linen, raw silk, and crepe for effortless elegance.',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
      true
    )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    is_active = true
  RETURNING id INTO v_cat_coord_id;

  INSERT INTO public.categories (name, slug, description, image_url, is_active)
  VALUES 
    (
      'Kurtas', 
      'kurtas', 
      'Royal Chanderi and pure Mulmul kurtas adorned with Kashmiri Aari, Gota Patti, and Lucknowi Chikankari.',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80',
      true
    )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    is_active = true
  RETURNING id INTO v_cat_kurta_id;

  INSERT INTO public.categories (name, slug, description, image_url, is_active)
  VALUES 
    (
      'Sarees', 
      'sarees', 
      'Heirloom Banarasi Katan silk, featherlight tissue organza, and handcrafted Chanderi drapes with pure zari.',
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
      true
    )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    is_active = true
  RETURNING id INTO v_cat_saree_id;

  -- =============================================================================
  -- PRODUCT 1: Ivory Aari Embroidered Linen Co-ord Set
  -- =============================================================================
  INSERT INTO public.products (
    category_id, name, slug, description, fabric, care_instructions, price, compare_at_price, is_active, is_featured
  ) VALUES (
    v_cat_coord_id,
    'Ivory Aari Embroidered Linen Co-ord Set',
    'ivory-embroidered-linen-coord-set',
    'An understated statement in ivory. Featuring delicate gold threadwork around the notched neckline and sleeve cuffs, this linen co-ord set pairs an airy silhouette with sharp cigarette trousers for effortless elegance from morning boardroom to evening soirees.',
    '100% Pure Organic Linen with Zari Aari threadwork',
    ARRAY['Dry clean recommended for first wash', 'Cold gentle hand wash with mild liquid detergent', 'Iron inside out on medium heat', 'Dry in shade'],
    499.00,
    999.00,
    true,
    true
  ) ON CONFLICT (slug) DO UPDATE SET
    price = EXCLUDED.price,
    compare_at_price = EXCLUDED.compare_at_price,
    description = EXCLUDED.description,
    fabric = EXCLUDED.fabric
  RETURNING id INTO v_prod_id;

  -- Images
  DELETE FROM public.product_images WHERE product_id = v_prod_id;
  INSERT INTO public.product_images (product_id, image_url, sort_order, alt_text) VALUES
    (v_prod_id, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80', 0, 'Ivory Pearl Main Front View'),
    (v_prod_id, 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80', 1, 'Champagne Beige Editorial View'),
    (v_prod_id, 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=80', 2, 'Espresso Mink Detail View');

  -- Variants
  DELETE FROM public.product_variants WHERE product_id = v_prod_id;
  INSERT INTO public.product_variants (product_id, sku, size, color, stock_quantity, is_active) VALUES
    (v_prod_id, 'NT-CD-001-S-IVY', 'S', 'Ivory Pearl', 10, true),
    (v_prod_id, 'NT-CD-001-M-IVY', 'M', 'Ivory Pearl', 15, true),
    (v_prod_id, 'NT-CD-001-L-IVY', 'L', 'Ivory Pearl', 8, true),
    (v_prod_id, 'NT-CD-001-XL-IVY', 'XL', 'Ivory Pearl', 5, true),
    (v_prod_id, 'NT-CD-001-S-CHP', 'S', 'Champagne Beige', 6, true),
    (v_prod_id, 'NT-CD-001-M-CHP', 'M', 'Champagne Beige', 12, true),
    (v_prod_id, 'NT-CD-001-L-CHP', 'L', 'Champagne Beige', 4, true),
    (v_prod_id, 'NT-CD-001-S-ESP', 'S', 'Espresso Mink', 5, true),
    (v_prod_id, 'NT-CD-001-M-ESP', 'M', 'Espresso Mink', 8, true);

  -- =============================================================================
  -- PRODUCT 2: Champagne Crepe Silk Wrap Co-ord Set
  -- =============================================================================
  INSERT INTO public.products (
    category_id, name, slug, description, fabric, care_instructions, price, compare_at_price, is_active, is_featured
  ) VALUES (
    v_cat_coord_id,
    'Champagne Crepe Silk Wrap Co-ord Set',
    'champagne-silk-wrap-blazer-coord',
    'Sculpted for festive gatherings and evening glam. Crafted in rich champagne crepe silk that drapes gracefully, completed with a self-tie waist belt with muted rose-gold handcrafted tassels.',
    'Heavy Crepe Silk with French satin lining',
    ARRAY['Dry clean only', 'Store in cotton garment bag', 'Steam press on low setting'],
    699.00,
    1299.00,
    true,
    true
  ) ON CONFLICT (slug) DO UPDATE SET
    price = EXCLUDED.price,
    compare_at_price = EXCLUDED.compare_at_price
  RETURNING id INTO v_prod_id;

  DELETE FROM public.product_images WHERE product_id = v_prod_id;
  INSERT INTO public.product_images (product_id, image_url, sort_order, alt_text) VALUES
    (v_prod_id, 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80', 0, 'Champagne Wrap Front View'),
    (v_prod_id, 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80', 1, 'Rose Gold Silhouette View');

  DELETE FROM public.product_variants WHERE product_id = v_prod_id;
  INSERT INTO public.product_variants (product_id, sku, size, color, stock_quantity, is_active) VALUES
    (v_prod_id, 'NT-CD-002-S-CHP', 'S', 'Champagne Glow', 7, true),
    (v_prod_id, 'NT-CD-002-M-CHP', 'M', 'Champagne Glow', 10, true),
    (v_prod_id, 'NT-CD-002-L-CHP', 'L', 'Champagne Glow', 4, true),
    (v_prod_id, 'NT-CD-002-S-RSG', 'S', 'Rose Gold Nude', 5, true),
    (v_prod_id, 'NT-CD-002-M-RSG', 'M', 'Rose Gold Nude', 6, true);

  -- =============================================================================
  -- PRODUCT 3: Royal Mulberry Silk Chanderi Kurta Set
  -- =============================================================================
  INSERT INTO public.products (
    category_id, name, slug, description, fabric, care_instructions, price, compare_at_price, is_active, is_featured
  ) VALUES (
    v_cat_kurta_id,
    'Royal Chanderi Silk Kurta & Pants Set',
    'royal-chanderi-silk-kurta-set',
    'Handwoven pure Chanderi silk kurta paired with tonal cigarette trousers and sheer tissue dupatta. Finished with artisanal metallic gota patti work along the neckline and cuffs.',
    'Pure Chanderi Silk & Mulmul Cotton Lining',
    ARRAY['Dry clean only', 'Keep wrapped in muslin cloth', 'Do not bleach or tumble dry'],
    599.00,
    1199.00,
    true,
    true
  ) ON CONFLICT (slug) DO UPDATE SET
    price = EXCLUDED.price,
    compare_at_price = EXCLUDED.compare_at_price
  RETURNING id INTO v_prod_id;

  DELETE FROM public.product_images WHERE product_id = v_prod_id;
  INSERT INTO public.product_images (product_id, image_url, sort_order, alt_text) VALUES
    (v_prod_id, 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80', 0, 'Royal Wine Front View'),
    (v_prod_id, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80', 1, 'Burgundy Detail View');

  DELETE FROM public.product_variants WHERE product_id = v_prod_id;
  INSERT INTO public.product_variants (product_id, sku, size, color, stock_quantity, is_active) VALUES
    (v_prod_id, 'NT-KT-001-S-WNE', 'S', 'Royal Wine', 8, true),
    (v_prod_id, 'NT-KT-001-M-WNE', 'M', 'Royal Wine', 14, true),
    (v_prod_id, 'NT-KT-001-L-WNE', 'L', 'Royal Wine', 9, true),
    (v_prod_id, 'NT-KT-001-XL-WNE', 'XL', 'Royal Wine', 6, true);

  -- =============================================================================
  -- PRODUCT 4: Handwoven Banarasi Tissue Organza Saree
  -- =============================================================================
  INSERT INTO public.products (
    category_id, name, slug, description, fabric, care_instructions, price, compare_at_price, is_active, is_featured
  ) VALUES (
    v_cat_saree_id,
    'Whisper-Light Tissue Organza Banarasi Saree',
    'whisper-light-tissue-organza-saree',
    'Woven with real silver and gold-dipped zari in the holy looms of Varanasi. Translucent, weightless tissue organza saree paired with an unstitched heavy brocade blouse piece.',
    'Pure Tissue Organza with 24k Gold electroplated Zari border',
    ARRAY['Dry clean only by luxury silk specialists', 'Store folded with butter paper between folds', 'Never use naphthalene balls directly'],
    899.00,
    1899.00,
    true,
    true
  ) ON CONFLICT (slug) DO UPDATE SET
    price = EXCLUDED.price,
    compare_at_price = EXCLUDED.compare_at_price
  RETURNING id INTO v_prod_id;

  DELETE FROM public.product_images WHERE product_id = v_prod_id;
  INSERT INTO public.product_images (product_id, image_url, sort_order, alt_text) VALUES
    (v_prod_id, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80', 0, 'Tissue Saree Main Drapery'),
    (v_prod_id, 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80', 1, 'Gold Pallu Intricate Weave');

  DELETE FROM public.product_variants WHERE product_id = v_prod_id;
  INSERT INTO public.product_variants (product_id, sku, size, color, stock_quantity, is_active) VALUES
    (v_prod_id, 'NT-SR-001-FS-GLD', 'Free Size', 'Liquid Gold', 12, true),
    (v_prod_id, 'NT-SR-001-FS-SLV', 'Free Size', 'Antique Silver', 8, true);

  -- =============================================================================
  -- 2. SEED COUPONS
  -- =============================================================================
  INSERT INTO public.coupons (code, discount_type, discount_value, minimum_order, maximum_discount, is_active)
  VALUES
    ('NILORA10', 'percent', 10.00, 999.00, 500.00, true),
    ('FESTIVE500', 'flat', 500.00, 2499.00, 500.00, true),
    ('WELCOMEVIP', 'percent', 15.00, 1499.00, 750.00, true)
  ON CONFLICT (code) DO UPDATE SET
    discount_type = EXCLUDED.discount_type,
    discount_value = EXCLUDED.discount_value,
    minimum_order = EXCLUDED.minimum_order,
    maximum_discount = EXCLUDED.maximum_discount,
    is_active = true;

END $$;
