import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { CartItem } from '@/types';
import { DEMO_PRODUCTS } from '@/data/demoProducts';

/**
 * Loads the user's cart from Supabase database or local session cache.
 */
export async function fetchUserCartFromDb(userId: string): Promise<CartItem[]> {
  if (!userId) return [];

  // Try DB first if Supabase is configured
  if (isSupabaseConfigured && !userId.startsWith('cust-') && userId !== 'admin-master') {
    try {
      const { data: cartData, error: cartError } = await (supabase as any)
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (cartData && !cartError) {
        const { data: itemsData, error: itemsError } = await (supabase as any)
          .from('cart_items')
          .select(`
            id,
            quantity,
            product_variant_id,
            product_variants (
              id,
              size,
              color,
              stock_quantity,
              price_override,
              is_active,
              product_id,
              products (
                id,
                name,
                slug,
                price,
                description,
                fabric,
                is_active,
                product_images (image_url, sort_order)
              )
            )
          `)
          .eq('cart_id', cartData.id);

        if (itemsData && !itemsError && itemsData.length > 0) {
          const parsedItems: CartItem[] = [];

          for (const row of itemsData) {
            const variant = row.product_variants;
            const product = variant?.products;
            if (!product || !variant) continue;

            const sortedImgs = product.product_images
              ? [...product.product_images].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
              : [];
            const images = sortedImgs.map((img: any) => img.image_url);

            const effectivePrice = variant.price_override !== null && variant.price_override !== undefined
              ? Number(variant.price_override)
              : Number(product.price);

            const colorSlug = variant.color.toLowerCase().replace(/\s+/g, '-');
            const matchingImg = images.find((img: string) => img.toLowerCase().includes(colorSlug)) || images[0] || '/nilora-logo-transparent.png';

            parsedItems.push({
              id: `${product.id}-${variant.size}-${variant.color}`,
              selectedSize: variant.size,
              selectedColor: variant.color,
              selectedColorImage: matchingImg,
              quantity: Math.max(1, row.quantity),
              product: {
                id: product.id,
                name: product.name,
                slug: product.slug,
                subtitle: '',
                category: 'co-ord-sets',
                categoryLabel: 'Artisanal Collection',
                occasion: 'Daily Wear',
                price: effectivePrice,
                originalPrice: Math.round(effectivePrice * 1.5),
                fabric: product.fabric || 'Pure Fabric',
                description: product.description || '',
                features: [],
                careInstructions: [],
                images: images.length > 0 ? images : ['/images/placeholder.jpg'],
                sizes: [{ size: variant.size as any, inStock: variant.stock_quantity > 0, stockCount: variant.stock_quantity }],
                colors: [{ name: variant.color, hex: '#392820' }],
                rating: 0,
                reviewCount: 0,
                sku: variant.id,
                inStock: variant.stock_quantity > 0 && variant.is_active,
              },
            });
          }

          if (parsedItems.length > 0) {
            return parsedItems;
          }
        }
      }
    } catch (err) {
      console.warn('Could not read user cart from Supabase:', err);
    }
  }

  // Fallback to user-scoped local storage cache
  try {
    const cached = localStorage.getItem(`nilora_cart_${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  return [];
}

/**
 * Persists the user's cart in the Supabase database.
 */
export async function saveUserCartToDb(userId: string, items: CartItem[]): Promise<void> {
  if (!userId) return;

  // Always keep user-scoped local cache updated
  try {
    localStorage.setItem(`nilora_cart_${userId}`, JSON.stringify(items));
  } catch {}

  if (!isSupabaseConfigured || userId.startsWith('cust-') || userId === 'admin-master') {
    return;
  }

  try {
    // 1. Get or create cart
    let cartId: string | null = null;
    const { data: existingCart } = await (supabase as any)
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingCart) {
      cartId = existingCart.id;
    } else {
      const { data: newCart, error: createError } = await (supabase as any)
        .from('carts')
        .insert({ user_id: userId })
        .select('id')
        .single();

      if (!createError && newCart) {
        cartId = newCart.id;
      }
    }

    if (!cartId) return;

    // 2. Clear current items and re-insert active items
    await (supabase as any).from('cart_items').delete().eq('cart_id', cartId);

    if (items.length === 0) return;

    // 3. Resolve variant IDs and batch insert
    const insertPayload: any[] = [];

    for (const item of items) {
      // Find variant ID
      let variantId: string | null = null;

      const { data: variant } = await (supabase as any)
        .from('product_variants')
        .select('id')
        .eq('product_id', item.product.id)
        .ilike('size', item.selectedSize)
        .ilike('color', item.selectedColor)
        .maybeSingle();

      if (variant) {
        variantId = variant.id;
      }

      if (variantId) {
        insertPayload.push({
          cart_id: cartId,
          product_variant_id: variantId,
          quantity: Math.max(1, item.quantity),
        });
      }
    }

    if (insertPayload.length > 0) {
      await (supabase as any).from('cart_items').insert(insertPayload);
    }
  } catch (err) {
    console.warn('Failed to sync cart to Supabase database:', err);
  }
}

/**
 * Safely merges guest cart items with user's existing cart, aggregating quantities
 * and avoiding duplicates.
 */
export function mergeCartItems(existingItems: CartItem[], guestItems: CartItem[]): CartItem[] {
  const merged: CartItem[] = [...existingItems];

  for (const guestItem of guestItems) {
    const itemKey = `${guestItem.product.id}-${guestItem.selectedSize}-${guestItem.selectedColor}`;
    const existingIndex = merged.findIndex(
      (m) => `${m.product.id}-${m.selectedSize}-${m.selectedColor}` === itemKey || m.id === itemKey
    );

    if (existingIndex !== -1) {
      // Maintain the customer's desired quantity rather than multiplying/doubling
      const current = merged[existingIndex];
      const maxStock = current.product.sizes?.find((s) => s.size === current.selectedSize)?.stockCount || 50;
      const safeQty = Math.min(maxStock, Math.max(current.quantity, guestItem.quantity));
      merged[existingIndex] = {
        ...current,
        quantity: safeQty,
      };
    } else {
      merged.push({
        ...guestItem,
        id: itemKey,
      });
    }
  }

  return merged;
}
