import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Product } from '@/types';
import { DEMO_PRODUCTS } from '@/data/demoProducts';

/**
 * Loads the user's wishlist from Supabase database or local session cache.
 */
export async function fetchUserWishlistFromDb(userId: string): Promise<Product[]> {
  if (!userId) return [];

  if (isSupabaseConfigured && !userId.startsWith('cust-') && userId !== 'admin-master') {
    try {
      const { data, error } = await (supabase as any)
        .from('wishlists')
        .select(`
          product_id,
          products (
            id, name, slug, price, description, fabric, is_active,
            categories (name, slug),
            product_images (image_url, sort_order)
          )
        `)
        .eq('user_id', userId);

      if (data && !error && data.length > 0) {
        const loaded: Product[] = [];

        for (const row of data) {
          const p = row.products;
          if (!p) {
            // Check fallback
            const demo = DEMO_PRODUCTS.find((d) => d.id === row.product_id);
            if (demo) loaded.push(demo);
            continue;
          }

          const sortedImgs = p.product_images
            ? [...p.product_images].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
            : [];
          const images = sortedImgs.map((img: any) => img.image_url);

          loaded.push({
            id: p.id,
            name: p.name,
            slug: p.slug,
            subtitle: '',
            category: (p.categories?.slug || 'co-ord-sets') as any,
            categoryLabel: p.categories?.name || 'Artisanal Collection',
            occasion: 'Daily Wear',
            price: Number(p.price),
            originalPrice: Math.round(Number(p.price) * 1.5),
            fabric: p.fabric || 'Pure Fabric',
            description: p.description || '',
            features: [],
            careInstructions: [],
            images: images.length > 0 ? images : ['/images/placeholder.jpg'],
            sizes: [{ size: 'Free Size', inStock: true, stockCount: 10 }],
            colors: [{ name: 'Default', hex: '#392820' }],
            rating: 0,
            reviewCount: 0,
            sku: p.id,
            inStock: Boolean(p.is_active),
          });
        }

        if (loaded.length > 0) return loaded;
      }
    } catch (err) {
      console.warn('Could not read user wishlist from Supabase:', err);
    }
  }

  // Fallback to local user cache
  try {
    const cached = localStorage.getItem(`nilora_wishlist_${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  return [];
}

/**
 * Persists wishlist additions / removals to Supabase.
 */
export async function toggleDbWishlistItem(userId: string, productId: string, add: boolean): Promise<void> {
  if (!userId || !productId) return;

  if (isSupabaseConfigured && !userId.startsWith('cust-') && userId !== 'admin-master') {
    try {
      if (add) {
        await (supabase as any)
          .from('wishlists')
          .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id' });
      } else {
        await (supabase as any)
          .from('wishlists')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', productId);
      }
    } catch (err) {
      console.warn('Failed to update wishlist in Supabase:', err);
    }
  }
}

/**
 * Syncs full wishlist to Supabase on user sign-in.
 */
export async function saveUserWishlistToDb(userId: string, products: Product[]): Promise<void> {
  if (!userId) return;

  try {
    localStorage.setItem(`nilora_wishlist_${userId}`, JSON.stringify(products));
  } catch {}

  if (!isSupabaseConfigured || userId.startsWith('cust-') || userId === 'admin-master') {
    return;
  }

  try {
    for (const p of products) {
      await (supabase as any)
        .from('wishlists')
        .upsert({ user_id: userId, product_id: p.id }, { onConflict: 'user_id,product_id' });
    }
  } catch (err) {
    console.warn('Failed to batch save wishlist to Supabase:', err);
  }
}
