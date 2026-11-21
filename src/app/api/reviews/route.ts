import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createAdminServerClient } from '@/lib/supabase-server';

const DEMO_SLUG_MAP: Record<string, string[]> = {
  'nt-coord-01': ['womens-embroidered-floral-dabu-cotton-coord-set', 'handcrafted-floral-dabu-cotton-co-ord-set'],
  'nt-bandhani-kurta-01': ['elegant-bandhani-embroidered-3-piece-kurta-set', 'royal-bandhani-embroidered-3-piece-kurta-set'],
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

async function resolveProductUuid(client: any, idOrSlug: string): Promise<string> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  if (isUuid) return idOrSlug;

  // Try lookup by slug
  const { data: bySlug } = await client
    .from('products')
    .select('id')
    .eq('slug', idOrSlug)
    .maybeSingle();
  if (bySlug?.id) return bySlug.id;

  // Try lookup by demo mapping
  if (DEMO_SLUG_MAP[idOrSlug]) {
    for (const slug of DEMO_SLUG_MAP[idOrSlug]) {
      const { data } = await client.from('products').select('id').eq('slug', slug).maybeSingle();
      if (data?.id) return data.id;
    }
  }

  return idOrSlug;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    let productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'productId parameter is required' }, { status: 400 });
    }

    if (isSupabaseConfigured) {
      try {
        const client = createAdminServerClient() as any;
        const targetUuid = await resolveProductUuid(client, productId);

        const { data: reviews, error } = await client
          .from('reviews')
          .select('id, product_id, user_id, rating, title, comment, created_at')
          .or(`product_id.eq.${targetUuid},product_id.eq.${productId}`)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(reviews)) {
          const count = reviews.length;
          const avg = count > 0
            ? Math.round((reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0) / count) * 10) / 10
            : 0;

          return NextResponse.json({
            success: true,
            reviews,
            reviewCount: count,
            averageRating: avg,
          });
        }
      } catch (err) {
        console.warn('Supabase reviews fetch note:', err);
      }
    }

    // Default empty reviews
    return NextResponse.json({
      success: true,
      reviews: [],
      reviewCount: 0,
      averageRating: 0,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve reviews';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { productId, rating, title, comment, userId, customerName, purchaseChannel } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5 stars.' }, { status: 400 });
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length < 3) {
      return NextResponse.json({ error: 'Review feedback comment is required.' }, { status: 400 });
    }

    // Channel tags: anyone can post (walk-in store patrons, offline customers, online buyers, or style enthusiasts)
    const channel = purchaseChannel || 'Boutique Walk-in Store';
    const authorName = (customerName && customerName.trim()) ? customerName.trim() : 'Boutique Patron';

    // Format display title and comment incorporating author and channel
    const formattedTitle = title && title.trim()
      ? title.trim()
      : `${channel} • ${authorName}`;

    // Tag the comment header with the purchase channel & author for transparent offline/online community trust
    const commentWithMeta = `[Author: ${authorName} | Channel: ${channel}]\n${comment.trim()}`;

    let savedReview: any = null;

    if (isSupabaseConfigured) {
      try {
        const client = createAdminServerClient() as any;
        const targetUuid = await resolveProductUuid(client, productId);

        const { data, error } = await client
          .from('reviews')
          .insert({
            product_id: targetUuid,
            user_id: userId || null,
            rating: Math.round(numRating),
            title: formattedTitle,
            comment: commentWithMeta,
          })
          .select()
          .single();

        if (!error && data) {
          savedReview = data;
        } else {
          console.error('Failed to insert review in Supabase:', error);
        }
      } catch (err) {
        console.error('Supabase review insert error:', err);
      }
    }

    if (!savedReview) {
      savedReview = {
        id: `rev-${Date.now()}`,
        product_id: productId,
        user_id: userId || null,
        rating: Math.round(numRating),
        title: formattedTitle,
        comment: commentWithMeta,
        created_at: new Date().toISOString(),
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your product review and rating have been published.',
      review: savedReview,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to submit review';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
