import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createAdminServerClient } from '@/lib/supabase-server';
import { Product, ProductSize } from '@/types';
import { getLiveProducts, isDefaultFeatureText } from '@/lib/api/products';

export async function GET() {
  try {
    const result = await getLiveProducts();
    return NextResponse.json({
      success: true,
      products: result.products,
      isLiveDb: result.isLive,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const product: Partial<Product> = body.product;

    if (!product || !product.name) {
      return NextResponse.json(
        { success: false, error: 'Product name and details are required.' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: 'Saved to local store (Supabase not configured)',
        product,
      });
    }

    const adminClient = createAdminServerClient() as any;

    // 1. Resolve category_id from category slug ('co-ord-sets', 'kurtas', 'sarees')
    const categorySlug = product.category || 'co-ord-sets';
    const { data: catData } = await adminClient
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .maybeSingle();

    const categoryId = catData?.id || null;

    const DEMO_SLUG_MAP: Record<string, string[]> = {
      'nt-coord-01': ['womens-embroidered-floral-dabu-cotton-coord-set', 'handcrafted-floral-dabu-cotton-co-ord-set'],
      'nt-bandhani-kurta-01': ['elegant-bandhani-embroidered-3-piece-kurta-set'],
      'nt-silk-kurta-02': [
        'women-s-embroidered-a-line-dabu-cotton-kurta-co-ord-set-8958',
        'chintz-handblock-cotton-straight-kurta',
        'womens-embroidered-a-line-dabu-cotton-kurta-co-ord-set'
      ],
      'nt-coord-02': ['champagne-silk-wrap-blazer-coord'],
      'nt-coord-03': ['terracotta-printed-modal-crop-set'],
      'nt-coord-04': ['rose-gold-modal-tunic-coord'],
      'nt-kurta-01': ['chanderi-silk-gold-zari-anarkali-kurta'],
      'nt-kurta-02': ['chintz-handblock-cotton-straight-kurta'],
      'nt-kurta-03': ['espresso-chikankari-embroidered-kurta'],
      'nt-kurta-04': ['champagne-angrakha-gota-kurta'],
      'nt-saree-01': ['pure-tissue-organza-gold-zari-saree'],
      'nt-saree-02': ['handwoven-banarasi-katan-silk-saree'],
      'nt-saree-03': ['contemporary-modal-satin-printed-saree'],
      'nt-saree-04': ['pastel-rose-gold-chanderi-saree'],
    };

    // Check if product exists in Supabase
    let productId: string | undefined = product.id;
    let existingDbRow: any = null;

    // Is valid UUID?
    const isUuid = !!productId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);

    // 1. Try finding by UUID
    if (isUuid && productId) {
      const { data } = await adminClient
        .from('products')
        .select('id, slug, name')
        .eq('id', productId)
        .maybeSingle();
      existingDbRow = data;
    }

    // 2. Try finding by product.slug
    if (!existingDbRow && product.slug) {
      const { data } = await adminClient
        .from('products')
        .select('id, slug, name')
        .eq('slug', product.slug)
        .maybeSingle();
      existingDbRow = data;
    }

    // 3. Try finding by body.previousSlug
    if (!existingDbRow && body.previousSlug) {
      const { data } = await adminClient
        .from('products')
        .select('id, slug, name')
        .eq('slug', body.previousSlug)
        .maybeSingle();
      existingDbRow = data;
    }

    // 4. Try finding by DEMO_SLUG_MAP
    if (!existingDbRow && productId && DEMO_SLUG_MAP[productId]) {
      for (const mapSlug of DEMO_SLUG_MAP[productId]) {
        const { data } = await adminClient
          .from('products')
          .select('id, slug, name')
          .eq('slug', mapSlug)
          .maybeSingle();
        if (data) {
          existingDbRow = data;
          break;
        }
      }
    }

    // 5. Try finding by product name
    if (!existingDbRow && product.name) {
      const { data } = await adminClient
        .from('products')
        .select('id, slug, name')
        .ilike('name', product.name.trim())
        .maybeSingle();
      existingDbRow = data;
    }

    // 6. Try finding by body.previousName
    if (!existingDbRow && body.previousName) {
      const { data } = await adminClient
        .from('products')
        .select('id, slug, name')
        .ilike('name', body.previousName.trim())
        .maybeSingle();
      existingDbRow = data;
    }

    if (existingDbRow) {
      productId = existingDbRow.id;
    }

    const price = Number(product.price) || 799;
    const comparePrice = Number(product.originalPrice) || Math.round(price * 1.5);
    const slug = product.slug || existingDbRow?.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Full authoritative metadata envelope
    const metaPayload = {
      id: productId,
      name: product.name,
      slug: slug,
      subtitle: product.subtitle || '',
      category: categorySlug,
      categoryLabel: product.categoryLabel,
      occasion: product.occasion || 'Ethnic & Festive',
      price,
      originalPrice: comparePrice,
      fabric: product.fabric || 'Regular Pure Cotton',
      description: product.description || product.subtitle || '',
      features: Array.isArray(product.features) ? product.features.filter((f: string) => !isDefaultFeatureText(f)) : [],
      inStock: product.inStock !== false,
      sizes: product.sizes,
      colors: product.colors,
      images: product.images,
      isFeatured: product.isFeatured ?? true,
      isNewArrival: product.isNewArrival ?? true,
      isBestSeller: product.isBestSeller ?? false,
      updatedAt: new Date().toISOString(),
    };

    // Clean out prior metadata markers from care_instructions
    const baseCareInstructions = (product.careInstructions || [
      'Gentle hand wash recommended for first wash',
      'Cold water wash with mild detergent',
      'Dry in shade',
      'Warm iron on reverse side',
    ]).filter((ci) => !ci.startsWith('__NILORA_COLORS_V1__:') && !ci.startsWith('__NILORA_PRODUCT_META_V1__:'));

    const careInstructionsToSave = [
      ...baseCareInstructions,
      `__NILORA_PRODUCT_META_V1__:${JSON.stringify(metaPayload)}`,
      `__NILORA_COLORS_V1__:${JSON.stringify(product.colors || [])}`,
    ];

    if (existingDbRow && productId) {
      // UPDATE EXISTING PRODUCT
      const { error: updateErr } = await adminClient
        .from('products')
        .update({
          name: product.name,
          slug,
          category_id: categoryId,
          description: product.description || product.subtitle || '',
          fabric: product.fabric || 'Pure Dabu Cotton',
          care_instructions: careInstructionsToSave,
          price,
          compare_at_price: comparePrice,
          is_active: true,
          is_featured: product.isFeatured ?? true,
        })
        .eq('id', productId);

      if (updateErr) {
        console.error('Error updating product in Supabase:', updateErr);
        throw updateErr;
      }
    } else {
      // INSERT NEW PRODUCT
      const { data: newProd, error: insertErr } = await adminClient
        .from('products')
        .insert({
          name: product.name,
          slug,
          category_id: categoryId,
          description: product.description || product.subtitle || '',
          fabric: product.fabric || 'Pure Dabu Cotton',
          care_instructions: careInstructionsToSave,
          price,
          compare_at_price: comparePrice,
          is_active: true,
          is_featured: product.isFeatured ?? true,
        })
        .select('id')
        .single();

      if (insertErr || !newProd) {
        console.error('Error inserting product into Supabase:', insertErr);
        throw insertErr;
      }

      productId = newProd.id;
    }

    // 2. Sync Images if provided
    if (productId && Array.isArray(product.images) && product.images.length > 0) {
      // Clear old images for this product
      await adminClient.from('product_images').delete().eq('product_id', productId);

      // Insert new images
      const imagesToInsert = product.images.map((imgUrl, idx) => {
        const colForImage = product.colors?.find((c) => c.image === imgUrl);
        const colForCloseUp = product.colors?.find((c) => c.closeUpImage === imgUrl);
        const colorName = colForImage?.name || colForCloseUp?.name || '';
        const colorHex = colForImage?.hex || colForCloseUp?.hex || '';
        return {
          product_id: productId,
          image_url: imgUrl,
          sort_order: idx + 1,
          alt_text: colorName ? `${product.name} - ${colorName} (${colorHex})` : `${product.name} - View ${idx + 1}`,
        };
      });

      await adminClient.from('product_images').insert(imagesToInsert);
    }

    // 3. Sync Variants if colors and sizes provided
    if (productId && product.colors && product.colors.length > 0) {
      // Clean up old variants
      await adminClient.from('product_variants').delete().eq('product_id', productId);

      const sizesList: ProductSize[] =
        product.sizes && product.sizes.length > 0
          ? product.sizes.map((s) => s.size)
          : ['M', 'L', 'XL', 'XXL'];

      const variantsToInsert: any[] = [];

      for (const col of product.colors) {
        for (const sz of sizesList) {
          const colorCode = col.name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'COL';
          const sku = `NT-${slug.slice(0, 8).toUpperCase()}-${colorCode}-${sz}`;
          const colorSizeObj = col.sizes?.find((s) => s.size.toLowerCase() === sz.toLowerCase());
          const sizeObj = product.sizes?.find((s) => s.size.toLowerCase() === sz.toLowerCase());
          const stock = colorSizeObj?.stockCount !== undefined 
            ? colorSizeObj.stockCount 
            : (sizeObj?.stockCount !== undefined ? sizeObj.stockCount : 10);

          variantsToInsert.push({
            product_id: productId,
            sku,
            size: sz,
            color: col.name,
            stock_quantity: stock,
            price_override: null,
            is_active: true,
          });
        }
      }

      if (variantsToInsert.length > 0) {
        await adminClient.from('product_variants').insert(variantsToInsert);
      }
    }

    return NextResponse.json({
      success: true,
      productId,
      message: 'Product synced live with Supabase database successfully!',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('API /api/admin/products failed:', err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    if (!id && !slug) {
      return NextResponse.json({ success: false, error: 'Product ID or slug required' }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({ success: true, message: 'Deleted locally' });
    }

    const adminClient = createAdminServerClient() as any;

    const DEMO_SLUG_MAP: Record<string, string[]> = {
      'nt-coord-01': ['womens-embroidered-floral-dabu-cotton-coord-set', 'handcrafted-floral-dabu-cotton-co-ord-set'],
      'nt-bandhani-kurta-01': ['elegant-bandhani-embroidered-3-piece-kurta-set'],
      'nt-silk-kurta-02': [
        'women-s-embroidered-a-line-dabu-cotton-kurta-co-ord-set-8958',
        'chintz-handblock-cotton-straight-kurta',
        'womens-embroidered-a-line-dabu-cotton-kurta-co-ord-set'
      ],
      'nt-coord-02': ['champagne-silk-wrap-blazer-coord'],
      'nt-coord-03': ['terracotta-printed-modal-crop-set'],
      'nt-coord-04': ['rose-gold-modal-tunic-coord'],
      'nt-kurta-01': ['chanderi-silk-gold-zari-anarkali-kurta'],
      'nt-kurta-02': ['chintz-handblock-cotton-straight-kurta'],
      'nt-kurta-03': ['espresso-chikankari-embroidered-kurta'],
      'nt-kurta-04': ['champagne-angrakha-gota-kurta'],
      'nt-saree-01': ['pure-tissue-organza-gold-zari-saree'],
      'nt-saree-02': ['handwoven-banarasi-katan-silk-saree'],
      'nt-saree-03': ['contemporary-modal-satin-printed-saree'],
      'nt-saree-04': ['pastel-rose-gold-chanderi-saree'],
    };

    let targetId: string | null = id;
    const isUuid = !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (!isUuid) {
      if (slug) {
        const { data } = await adminClient.from('products').select('id').eq('slug', slug).maybeSingle();
        if (data?.id) targetId = data.id;
      }
      if ((!targetId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)) && id && DEMO_SLUG_MAP[id]) {
        for (const mapSlug of DEMO_SLUG_MAP[id]) {
          const { data } = await adminClient.from('products').select('id').eq('slug', mapSlug).maybeSingle();
          if (data?.id) {
            targetId = data.id;
            break;
          }
        }
      }
    }

    if (targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)) {
      // Clean up child tables to avoid foreign key blocks
      await adminClient.from('product_images').delete().eq('product_id', targetId);
      await adminClient.from('product_variants').delete().eq('product_id', targetId);
      const { error: delErr } = await adminClient.from('products').delete().eq('id', targetId);
      if (delErr) {
        console.warn('Error deleting product row from Supabase:', delErr);
      }
    } else if (slug) {
      await adminClient.from('products').delete().eq('slug', slug);
    }

    return NextResponse.json({ success: true, message: 'Product deleted from database.', deletedId: targetId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
