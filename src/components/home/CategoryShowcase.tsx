'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { ProductCategory, Product } from '@/types';

interface CategoryDefinition {
  key: ProductCategory;
  title: string;
  tagline: string;
  description: string;
  href: string;
  tag: string;
  fallbackImage: string;
}

const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    key: 'co-ord-sets',
    title: 'Co-ord Sets',
    tagline: 'Modern Tailored Comfort',
    description: 'Impeccably tailored matching sets crafted for everyday comfort, office elegance, and chic festive outings.',
    href: '/category/co-ord-sets',
    tag: 'Trending Now',
    fallbackImage: '/images/products/dabu-cotton-coord-teal-blue.jpg',
  },
  {
    key: 'kurtas',
    title: 'Kurtas',
    tagline: 'Royal Indian Craftsmanship',
    description: 'Flared Chanderi anarkalis, floral handblock prints, and authentic mirror-work kurtas with soft lining.',
    href: '/category/kurtas',
    tag: 'Signature Edit',
    fallbackImage: '/images/products/bandhani-kurta-rani-pink.jpg',
  },
  {
    key: 'sarees',
    title: 'Sarees',
    tagline: 'Drapes of Pure Poetry',
    description: 'Artisanal glossy georgettes, whisper-light tissue organzas, and designer festive sarees with ornate blouse pieces.',
    href: '/category/sarees',
    tag: 'Festive Luxury',
    fallbackImage: '/images/products/bandhani-kurta-royal-purple.jpg',
  },
];

export function CategoryShowcase() {
  const { products } = useStore();

  const categories = useMemo(() => {
    return CATEGORY_DEFINITIONS.map((def) => {
      // Find all live products for this category that have valid images
      const matching = products.filter(
        (p) => p.category === def.key && Array.isArray(p.images) && p.images.length > 0 && !!p.images[0]
      );

      // Sort by recency: last updated or newest created first
      const sorted = [...matching].sort((a, b) => {
        const timeA = a.updatedAt
          ? typeof a.updatedAt === 'number'
            ? a.updatedAt
            : new Date(a.updatedAt).getTime()
          : a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;
        const timeB = b.updatedAt
          ? typeof b.updatedAt === 'number'
            ? b.updatedAt
            : new Date(b.updatedAt).getTime()
          : b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;

        if (timeA && timeB && timeA !== timeB) return timeB - timeA;
        return 0; // Maintain catalog recency order
      });

      // Priority 1: Pick the latest non-unsplash uploaded boutique product
      const nonDemo = sorted.find((p) => p.images[0] && !p.images[0].includes('images.unsplash.com'));
      const latestProduct: Product | undefined = nonDemo || sorted[0];

      // Use the last updated product's primary picture as category cover
      const coverImage = latestProduct?.images?.[0] || def.fallbackImage;

      return {
        ...def,
        image: coverImage,
        latestProduct,
        count: matching.length,
      };
    });
  }, [products]);

  return (
    <section className="py-16 sm:py-20 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D9A08C]">
            Curated Collections
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#392820] font-normal mt-1.5 mb-3">
            Shop by Category
          </h2>
          <div className="w-12 h-0.5 bg-[#D9A08C] mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-[#392820]/70 font-sans">
            Three distinctive Indian boutique silhouettes designed for every chapter of your day.
          </p>
        </div>

        {/* 3-Column Desktop, 2-Column Tablet, 1-Column Mobile Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {categories.map((cat) => (
            <div
              key={cat.title}
              className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-[#E8D6C7] shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Visible Photograph: Last Updated Product Image */}
              <Link href={cat.href} className="relative aspect-[3/4] w-full overflow-hidden bg-[#FAF7F2] block">
                <Image
                  src={cat.image}
                  alt={cat.latestProduct?.name || cat.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Category Pill Tag */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1 rounded-full bg-[#FAF7F2]/95 backdrop-blur-xs text-[10px] font-bold tracking-wider uppercase text-[#392820] shadow-xs">
                    {cat.tag}
                  </span>
                </div>

                {/* Latest Updated Attire Banner */}
                {cat.latestProduct && (
                  <div className="absolute bottom-3 left-3 right-3 z-10">
                    <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] truncate flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#D9A08C] shrink-0" />
                      <span className="font-medium truncate">
                        {cat.latestProduct.name}
                      </span>
                    </div>
                  </div>
                )}
              </Link>

              {/* Category Details & Explore Link */}
              <div className="p-6 flex flex-col flex-1 justify-between bg-white space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-widest text-[#D9A08C] font-semibold">
                      {cat.tagline}
                    </span>
                    {cat.count > 0 && (
                      <span className="text-[10px] text-[#735D50] font-medium bg-[#FAF7F2] px-2 py-0.5 rounded-full border border-[#E8DCCB]">
                        {cat.count} Design{cat.count > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-2xl font-normal text-[#392820] mb-2">
                    <Link href={cat.href} className="hover:text-[#D9A08C] transition-colors">
                      {cat.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-[#392820]/70 leading-relaxed font-sans line-clamp-2">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#FAF7F2]">
                  <Link
                    href={cat.href}
                    className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#392820] group-hover:text-[#D9A08C] transition-colors"
                  >
                    <span>Explore Collection</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
