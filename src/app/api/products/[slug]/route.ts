import { NextRequest, NextResponse } from 'next/server';
import { getLiveProductBySlug, getLiveProducts } from '@/lib/api/products';
import { DEMO_PRODUCTS } from '@/data/demoProducts';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug parameter is required.' }, { status: 400 });
    }

    const decodedSlug = decodeURIComponent(slug).toLowerCase().trim();

    // 1. Try single slug lookup first
    const { product: directProduct } = await getLiveProductBySlug(decodedSlug);
    if (directProduct) {
      return NextResponse.json({ success: true, product: directProduct });
    }

    // 2. Fetch live products list (handles ID lookup, care_instructions metadata, fuzzy slug matching)
    const { products: liveProducts } = await getLiveProducts();

    // Look for exact slug or ID match
    let matched = liveProducts.find(
      (p) =>
        p.slug.toLowerCase().trim() === decodedSlug ||
        p.id.toLowerCase() === decodedSlug
    );

    // Look inside DEMO_PRODUCTS
    if (!matched) {
      matched = DEMO_PRODUCTS.find(
        (p) =>
          p.slug.toLowerCase().trim() === decodedSlug ||
          p.id.toLowerCase() === decodedSlug
      );
    }

    // Try fuzzy substring matching on slug
    if (!matched) {
      matched = liveProducts.find((p) => {
        const s = p.slug.toLowerCase();
        return s.includes(decodedSlug) || decodedSlug.includes(s);
      });
    }

    // Try matching on name
    if (!matched) {
      matched = liveProducts.find((p) => {
        const n = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return n.includes(decodedSlug) || decodedSlug.includes(n);
      });
    }

    if (matched) {
      return NextResponse.json({
        success: true,
        product: matched,
      });
    }

    return NextResponse.json(
      { success: false, error: `Product "${decodedSlug}" not found.` },
      { status: 404 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
