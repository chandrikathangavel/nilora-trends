import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createServerClient } from '@/lib/supabase-server';
import { DEMO_PRODUCTS } from '@/data/demoProducts';
import {
  toPaise,
  toRupees,
  calculateLineTotalPaise,
  calculateShippingFeePaise,
  calculateFreeShippingRemainingRupees,
  PAISE_PER_RUPEE,
} from '@/lib/money';

export interface CartValidationInputItem {
  id?: string;
  productId: string;
  variantId?: string;
  size: string;
  color: string;
  quantity: number;
}

export interface CartValidationResultItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number; // Official server price in Rupees
  lineTotal: number; // in Rupees
  unitPricePaise: number;
  lineTotalPaise: number;
  inStock: boolean;
  maxStock: number;
  isAvailable: boolean;
  adjustmentNotice?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: CartValidationInputItem[] = Array.isArray(body.items) ? body.items : [];

    const validatedItems: CartValidationResultItem[] = [];
    const notices: string[] = [];

    // 1. Fetch live DB products and variants if Supabase is configured
    let dbProducts: any[] = [];

    if (isSupabaseConfigured) {
      try {
        const client = createServerClient();
        const productIds = Array.from(new Set(items.map((i) => i.productId)));

        if (productIds.length > 0) {
          const { data: pData } = await (client as any)
            .from('products')
            .select(`
              id, name, slug, price, is_active,
              product_images (image_url, sort_order),
              product_variants (id, sku, size, color, stock_quantity, price_override, is_active)
            `)
            .in('id', productIds);

          if (pData) {
            dbProducts = pData;
          }
        }
      } catch (dbErr) {
        console.warn('Could not query Supabase tables for cart validation, falling back to local catalog:', dbErr);
      }
    }

    // 2. Validate each item against server source of truth
    for (const item of items) {
      if (!item.productId) continue;

      let verifiedName = 'Boutique Collection Piece';
      let verifiedSlug = '';
      let verifiedImage = '/images/placeholder.jpg';
      let officialPrice = 499;
      let inStock = true;
      let availableStock = 10;
      let isVariantActive = true;

      // Check DB first
      const dbProduct = dbProducts.find((p) => p.id === item.productId);
      if (dbProduct) {
        verifiedName = dbProduct.name;
        verifiedSlug = dbProduct.slug;
        officialPrice = Number(dbProduct.price) || 499;

        if (dbProduct.product_images && dbProduct.product_images.length > 0) {
          const sortedImgs = [...dbProduct.product_images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          verifiedImage = sortedImgs[0]?.image_url || verifiedImage;
        }

        const variant = dbProduct.product_variants?.find(
          (v: any) =>
            (v.id === item.variantId) ||
            (v.size?.toLowerCase() === item.size?.toLowerCase() && v.color?.toLowerCase() === item.color?.toLowerCase())
        );

        if (variant) {
          if (variant.price_override !== null && variant.price_override !== undefined) {
            officialPrice = Number(variant.price_override);
          }
          availableStock = Number(variant.stock_quantity) || 0;
          isVariantActive = Boolean(variant.is_active && dbProduct.is_active);
          inStock = availableStock > 0 && isVariantActive;
        } else {
          isVariantActive = Boolean(dbProduct.is_active);
        }
      } else {
        // Fallback to demo catalog
        const demoProduct = DEMO_PRODUCTS.find((p) => p.id === item.productId || p.slug === item.productId);
        if (demoProduct) {
          verifiedName = demoProduct.name;
          verifiedSlug = demoProduct.slug;
          officialPrice = demoProduct.price;
          verifiedImage = demoProduct.images?.[0] || verifiedImage;

          const sizeInfo = demoProduct.sizes?.find(
            (s) => s.size.toLowerCase() === item.size?.toLowerCase()
          );

          if (sizeInfo) {
            availableStock = sizeInfo.stockCount ?? (sizeInfo.inStock ? 5 : 0);
            inStock = sizeInfo.inStock && availableStock > 0 && demoProduct.inStock;
          } else {
            inStock = demoProduct.inStock;
            availableStock = demoProduct.inStock ? 10 : 0;
          }
        }
      }

      // Sanitize requested quantity
      let requestedQty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      let adjustmentNotice: string | undefined;

      if (!inStock || availableStock <= 0 || !isVariantActive) {
        adjustmentNotice = `"${verifiedName}" (${item.size} / ${item.color}) is currently out of stock.`;
        notices.push(adjustmentNotice);
      } else if (requestedQty > availableStock) {
        adjustmentNotice = `Quantity for "${verifiedName}" was updated to ${availableStock} (maximum available inventory).`;
        notices.push(adjustmentNotice);
        requestedQty = availableStock;
      }

      const itemKey = item.id || `${item.productId}-${item.size}-${item.color}`;
      const lineTotalPaise = calculateLineTotalPaise(officialPrice, requestedQty);

      validatedItems.push({
        id: itemKey,
        productId: item.productId,
        name: verifiedName,
        slug: verifiedSlug,
        image: verifiedImage,
        size: item.size || 'Free Size',
        color: item.color || 'Standard',
        quantity: requestedQty,
        unitPrice: officialPrice,
        unitPricePaise: toPaise(officialPrice),
        lineTotal: toRupees(lineTotalPaise),
        lineTotalPaise,
        inStock,
        maxStock: availableStock,
        isAvailable: inStock && availableStock > 0,
        adjustmentNotice,
      });
    }

    // 3. Subtotal, Shipping, and Free Shipping Threshold Calculations
    const activeItems = validatedItems.filter((i) => i.isAvailable);
    const subtotalPaise = activeItems.reduce((acc, i) => acc + i.lineTotalPaise, 0);
    const shippingFeePaise = calculateShippingFeePaise(subtotalPaise);
    const freeShippingRemaining = calculateFreeShippingRemainingRupees(subtotalPaise);
    const totalPaise = subtotalPaise + shippingFeePaise;

    return NextResponse.json({
      valid: true,
      items: validatedItems,
      activeItemCount: activeItems.length,
      totalQuantity: activeItems.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: toRupees(subtotalPaise),
      subtotalPaise,
      shippingFee: toRupees(shippingFeePaise),
      shippingFeePaise,
      freeShippingRemaining,
      isFreeShipping: shippingFeePaise === 0 && subtotalPaise > 0,
      total: toRupees(totalPaise),
      totalPaise,
      notices,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server failed to validate cart';
    console.error('Cart validation error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
