import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Product, ProductCategory, ProductSize, ProductColor, ProductInventorySize } from '@/types';
import { DEMO_PRODUCTS } from '@/data/demoProducts';

interface SupabaseProductRow {
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
  categories?: { name: string; slug: string } | null;
  product_images?: { image_url: string; sort_order: number; alt_text: string | null }[];
  product_variants?: {
    id: string;
    sku: string;
    size: string;
    color: string;
    stock_quantity: number;
    price_override: number | null;
    is_active: boolean;
  }[];
  reviews?: { id: string; rating: number; comment: string; title?: string | null; created_at: string }[];
}

/**
 * Transforms Supabase database product record with relational images and variants into Nilora's Product interface
 */
export function mapSupabaseToProduct(row: SupabaseProductRow): Product {
  const categorySlug = (row.categories?.slug || 'co-ord-sets') as ProductCategory;
  const categoryLabel = row.categories?.name || 'Co-ord Sets';

  // Sort images by sort_order
  const sortedImages = (row.product_images || [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => img.image_url);

  // Group variants by size
  const sizeMap = new Map<ProductSize, { stock: number; inStock: boolean }>();
  // Group variants by color
  const colorMap = new Map<string, ProductColor>();
  const colorSizesMap = new Map<string, Map<ProductSize, ProductInventorySize>>();

  // Check if we have saved comprehensive product metadata or colors metadata in care_instructions
  const metaV1Entry = (row.care_instructions || []).find((ci) =>
    ci.startsWith('__NILORA_PRODUCT_META_V1__:')
  );
  let metaPayload: any = null;
  if (metaV1Entry) {
    try {
      metaPayload = JSON.parse(metaV1Entry.replace('__NILORA_PRODUCT_META_V1__:', ''));
    } catch (e) {
      console.warn('Failed to parse __NILORA_PRODUCT_META_V1__ from care_instructions', e);
    }
  }

  const colorsMetaEntry = (row.care_instructions || []).find((ci) =>
    ci.startsWith('__NILORA_COLORS_V1__:')
  );
  let savedColorsFromMeta: ProductColor[] = [];
  if (colorsMetaEntry) {
    try {
      const parsed = JSON.parse(colorsMetaEntry.replace('__NILORA_COLORS_V1__:', ''));
      if (Array.isArray(parsed)) {
        savedColorsFromMeta = parsed;
      }
    } catch (e) {
      console.warn('Failed to parse __NILORA_COLORS_V1__ from care_instructions', e);
    }
  }

  // Cross-reference DEMO_PRODUCTS for authentic pre-configured color palettes
  const demoProdMatch = DEMO_PRODUCTS.find((p) => p.slug === row.slug || p.id === row.id);

  const variants = row.product_variants || [];
  let totalStock = 0;

  for (const v of variants) {
    totalStock += v.stock_quantity;

    // Size aggregation
    const sizeName = v.size as ProductSize;
    const existingSize = sizeMap.get(sizeName) || { stock: 0, inStock: false };
    existingSize.stock += v.stock_quantity;
    existingSize.inStock = existingSize.stock > 0;
    sizeMap.set(sizeName, existingSize);

    // Color-specific size aggregation
    if (!colorSizesMap.has(v.color)) {
      colorSizesMap.set(v.color, new Map());
    }
    colorSizesMap.get(v.color)!.set(sizeName, {
      size: sizeName,
      stockCount: v.stock_quantity,
      inStock: v.stock_quantity > 0,
    });
  }

  let finalColors: ProductColor[] = [];

  // Priority 1: If metaPayload has explicit colors saved by the admin, they are authoritative!
  if (metaPayload?.colors && Array.isArray(metaPayload.colors) && metaPayload.colors.length > 0) {
    finalColors = metaPayload.colors.map((c: ProductColor) => {
      const hex = c.hex && c.hex !== '#E8D6C7' ? c.hex : getColorHexFallback(c.name);
      return {
        ...c,
        hex,
        closeUpImage: c.closeUpImage || undefined,
      };
    });
  } else if (savedColorsFromMeta && savedColorsFromMeta.length > 0) {
    finalColors = savedColorsFromMeta.map((c) => ({
      ...c,
      hex: c.hex && c.hex !== '#E8D6C7' ? c.hex : getColorHexFallback(c.name),
      closeUpImage: c.closeUpImage || undefined,
    }));
  } else {
    // Construct from variants & demo fallback
    for (const v of variants) {
      if (!colorMap.has(v.color)) {
        const colorLower = v.color.toLowerCase().replace(/\s+/g, '-');
        const matchingImages = sortedImages.filter((img) => img.toLowerCase().includes(colorLower));
        const primaryImg =
          matchingImages.find((img) => !img.toLowerCase().includes('closeup')) ||
          matchingImages[0] ||
          sortedImages[colorMap.size] ||
          sortedImages[0];
        const closeUpImg =
          matchingImages.find((img) => img.toLowerCase().includes('closeup')) ||
          (matchingImages.length > 1 ? matchingImages[1] : undefined);
        const allColorImages = [primaryImg, closeUpImg].filter(Boolean) as string[];

        // Check priority 1: Saved metadata from database
        const metaCol = savedColorsFromMeta.find(
          (c) => c.name.toLowerCase().trim() === v.color.toLowerCase().trim()
        );
        // Check priority 2: Demo product configured color
        const demoCol = demoProdMatch?.colors?.find(
          (c) => c.name.toLowerCase().trim() === v.color.toLowerCase().trim()
        );

        const finalHex = metaCol?.hex || demoCol?.hex || getColorHexFallback(v.color);
        const finalImage = metaCol?.image || demoCol?.image || primaryImg;
        const finalCloseUp = metaCol ? (metaCol.closeUpImage || undefined) : (demoCol?.closeUpImage || closeUpImg);
        const finalImages =
          metaCol?.images && metaCol.images.length > 0
            ? metaCol.images
            : demoCol?.images && demoCol.images.length > 0
            ? demoCol.images
            : allColorImages;

        colorMap.set(v.color, {
          name: v.color,
          hex: finalHex,
          image: finalImage,
          closeUpImage: finalCloseUp,
          images: finalImages,
        });
      }
    }

    if (colorMap.size === 0 && demoProdMatch?.colors) {
      for (const dCol of demoProdMatch.colors) {
        if (!colorMap.has(dCol.name)) {
          colorMap.set(dCol.name, dCol);
        }
      }
    }

    // Attach color-specific sizes
    for (const [colName, colObj] of colorMap.entries()) {
      const cMap = colorSizesMap.get(colName);
      if (cMap && cMap.size > 0) {
        colObj.sizes = Array.from(cMap.values());
      }
    }

    finalColors = Array.from(colorMap.values());
  }

  // Sizes: if metaPayload has explicit sizes matrix, use them
  let finalSizes: ProductInventorySize[] = [];
  if (metaPayload?.sizes && Array.isArray(metaPayload.sizes) && metaPayload.sizes.length > 0) {
    finalSizes = metaPayload.sizes;
  } else {
    finalSizes = Array.from(sizeMap.entries()).map(([size, data]) => ({
      size,
      stockCount: data.stock,
      inStock: data.inStock,
    }));
  }

  const originalPrice = Number(metaPayload?.originalPrice || row.compare_at_price || row.price * 1.5);
  const currentPrice = Number(metaPayload?.price || row.price);
  const discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);

  const dbReviews = row.reviews || [];
  const reviewCount = dbReviews.length;
  const avgRating = reviewCount > 0
    ? Math.round((dbReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / reviewCount) * 10) / 10
    : 0;

  // Clean care instructions: strip internal metadata tags so customers only see clean care guidelines
  const cleanCareInstructions = (row.care_instructions || [])
    .filter((ci) => !ci.startsWith('__NILORA_COLORS_V1__:') && !ci.startsWith('__NILORA_PRODUCT_META_V1__:'))
    .filter(Boolean);

  const finalImages = (metaPayload?.images && Array.isArray(metaPayload.images) && metaPayload.images.length > 0)
    ? metaPayload.images
    : (sortedImages.length > 0 ? sortedImages : [
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'
      ]);

  return {
    id: row.id,
    slug: metaPayload?.slug || row.slug,
    name: metaPayload?.name || row.name,
    subtitle: metaPayload?.subtitle || (row.description ? row.description.slice(0, 70) : ''),
    category: (metaPayload?.category || categorySlug) as ProductCategory,
    categoryLabel: metaPayload?.categoryLabel || categoryLabel,
    occasion: (metaPayload?.occasion || 'Ethnic & Festive') as any,
    price: currentPrice,
    originalPrice: originalPrice,
    discountPercent: discountPercent > 0 ? discountPercent : undefined,
    fabric: metaPayload?.fabric || row.fabric || 'Pure Artisanal Fabric',
    description: metaPayload?.description || row.description || '',
    features: (metaPayload?.features && Array.isArray(metaPayload.features))
      ? metaPayload.features.filter((f: string) => !isDefaultFeatureText(f))
      : [],
    careInstructions: cleanCareInstructions.length > 0 ? cleanCareInstructions : [
      'Dry clean recommended for first wash',
      'Gentle hand wash with mild detergent',
      'Dry in shade',
    ],
    images: finalImages,
    sizes: finalSizes.length > 0 ? finalSizes : [
      { size: 'S', inStock: true, stockCount: 10 },
      { size: 'M', inStock: true, stockCount: 15 },
      { size: 'L', inStock: true, stockCount: 8 },
    ],
    colors: finalColors.length > 0 ? finalColors : [
      { name: 'Ivory Pearl', hex: '#FAF7F2' }
    ],
    isFeatured: metaPayload?.isFeatured ?? row.is_featured,
    isNewArrival: metaPayload?.isNewArrival ?? true,
    isBestSeller: metaPayload?.isBestSeller ?? row.is_featured,
    rating: avgRating,
    reviewCount: reviewCount,
    sku: variants[0]?.sku || `NT-${row.slug.slice(0, 5).toUpperCase()}`,
    inStock:
      metaPayload?.category === 'sarees' || categorySlug === 'sarees'
        ? true
        : metaPayload?.inStock ?? (totalStock > 0 || variants.length === 0 || finalSizes.some((s) => s.inStock)),
    createdAt: row.created_at,
    updatedAt: metaPayload?.updatedAt || row.created_at,
  };
}

const DEFAULT_BOUTIQUE_FEATURE_STRINGS = [
  'handcrafted embroidery',
  'breathable pure fabric',
  'tailored comfort fit',
  'handcrafted luxury indian silhouette',
  'artisanal finishing with delicate details',
  '100% pure certified fabric',
  'designed for timeless festive elegance',
];

export function isDefaultFeatureText(text: string): boolean {
  if (!text) return true;
  const lower = text.trim().toLowerCase();
  return DEFAULT_BOUTIQUE_FEATURE_STRINGS.some((d) => lower === d || lower.includes(d));
}

export function getColorHexFallback(colorName: string): string {
  if (!colorName) return '#C41D53';
  const clean = colorName.trim().toLowerCase();

  // If a hex code was directly embedded e.g. "Royal Purple (#582C83)"
  const hexMatch = colorName.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/);
  if (hexMatch) return hexMatch[0];

  // Comprehensive palette of Indian ethnic wear shades:
  const map: Record<string, string> = {
    // Pinks & Purples
    'rani pink': '#C41D53',
    'royal purple': '#582C83',
    'purple': '#582C83',
    'dark purple': '#3E1A47',
    'wine': '#722F37',
    'royal wine': '#5B2333',
    'plum': '#5D2E46',
    'magenta': '#D80064',
    'fuchsia': '#C11C84',
    'lavender': '#967BB6',
    'lilac': '#C8A2C8',
    'mauve': '#915F6D',
    'rose': '#B76E79',
    'rose gold': '#D9A08C',
    'rose gold nude': '#D9A08C',
    'dusty rose': '#DCAE96',
    'blush': '#DE5D83',
    'baby pink': '#F4C2C2',

    // Blues
    'slate-blue': '#4B687F',
    'slate blue': '#4B687F',
    'teal blue': '#1A5B66',
    'teal': '#135B6E',
    'peacock teal': '#008080',
    'navy': '#0A192F',
    'navy blue': '#0A192F',
    'royal blue': '#1D4ED8',
    'sky blue': '#87CEEB',
    'powder blue': '#B0E0E6',
    'indigo': '#2E1A47',
    'midnight blue': '#191970',

    // Greens
    'olive green': '#4D5D28',
    'olive': '#556B2F',
    'emerald green': '#005A36',
    'emerald': '#097969',
    'sage green': '#8A9A5B',
    'sage': '#9CAF88',
    'mint green': '#98FF98',
    'bottle green': '#004225',
    'mehendi': '#5B6E27',
    'forest green': '#228B22',

    // Yellows & Golds & Oranges
    'mustard gold': '#C29200',
    'mustard': '#E1AD01',
    'liquid gold': '#D4AF37',
    'gold': '#D4AF37',
    'yellow': '#F4B400',
    'haldi yellow': '#E5A912',
    'orange': '#D84315',
    'rust': '#B7410E',
    'rust orange': '#C04000',
    'terracotta': '#E2725B',
    'copper': '#B87333',
    'peach': '#FAD1AF',
    'apricot': '#FBCEB1',

    // Reds & Browns & Neutrals
    'ruby red': '#9B111E',
    'ruby': '#9B111E',
    'red': '#C21807',
    'maroon': '#800000',
    'crimson': '#990000',
    'brick red': '#8B3A3A',
    'espresso mink': '#392820',
    'coffee': '#4B3621',
    'chocolate': '#3D1C02',
    'brown': '#654321',
    'beige': '#D1B48C',
    'champagne beige': '#E8D6C7',
    'champagne glow': '#F4E8DC',
    'ivory': '#FFFFF0',
    'ivory pearl': '#FAF7F2',
    'cream': '#FDFBF7',
    'antique silver': '#C0C0C0',
    'silver': '#C0C0C0',
    'charcoal': '#36454F',
    'midnight black': '#1A1A1A',
    'black': '#1E1E1E',
    'white': '#FFFFFF',
  };

  if (map[clean]) return map[clean];

  // Substring match
  for (const [key, val] of Object.entries(map)) {
    if (clean.includes(key) || key.includes(clean)) return val;
  }

  // Nilora Signature Rani Pink default fallback instead of pale white
  return '#C41D53';
}

/**
 * Fetch all active products from Supabase (with fallback to demo catalog if Supabase is offline/not configured)
 */
export async function getLiveProducts(): Promise<{ products: Product[]; isLive: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { products: DEMO_PRODUCTS, isLive: false };
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        category_id,
        name,
        slug,
        description,
        fabric,
        care_instructions,
        price,
        compare_at_price,
        is_active,
        is_featured,
        created_at,
        categories (name, slug),
        product_images (image_url, sort_order, alt_text),
        product_variants (id, sku, size, color, stock_quantity, price_override, is_active),
        reviews (id, rating, comment, title, created_at)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Failed to fetch products from Supabase, falling back to demo catalog:', error.message);
      return { products: DEMO_PRODUCTS, isLive: false, error: error.message };
    }

    if (!data || data.length === 0) {
      // Supabase is connected but tables haven't been seeded yet
      return { products: DEMO_PRODUCTS, isLive: false, error: 'Database connected but no products seeded yet. Run 005_seed_nilora_catalog.sql.' };
    }

    const mapped = (data as unknown as SupabaseProductRow[]).map(mapSupabaseToProduct);
    return { products: mapped, isLive: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Unexpected error fetching live products:', err);
    return { products: DEMO_PRODUCTS, isLive: false, error: errorMsg };
  }
}

/**
 * Fetch a single product by its slug
 */
export async function getLiveProductBySlug(slug: string): Promise<{ product: Product | null; isLive: boolean }> {
  if (!isSupabaseConfigured) {
    const demo = DEMO_PRODUCTS.find((p) => p.slug === slug) || null;
    return { product: demo, isLive: false };
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        category_id,
        name,
        slug,
        description,
        fabric,
        care_instructions,
        price,
        compare_at_price,
        is_active,
        is_featured,
        created_at,
        categories (name, slug),
        product_images (image_url, sort_order, alt_text),
        product_variants (id, sku, size, color, stock_quantity, price_override, is_active),
        reviews (id, rating, comment, title, created_at)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      const demo = DEMO_PRODUCTS.find((p) => p.slug === slug) || null;
      return { product: demo, isLive: false };
    }

    return { product: mapSupabaseToProduct(data as unknown as SupabaseProductRow), isLive: true };
  } catch {
    const demo = DEMO_PRODUCTS.find((p) => p.slug === slug) || null;
    return { product: demo, isLive: false };
  }
}
