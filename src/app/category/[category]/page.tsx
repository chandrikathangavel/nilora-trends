'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { ProductCard } from '@/components/home/ProductCard';
import { ProductCategory } from '@/types';

const CATEGORY_META: Record<
  ProductCategory,
  {
    title: string;
    subtitle: string;
    description: string;
    bannerImage: string;
  }
> = {
  'co-ord-sets': {
    title: 'Designer Co-ord Sets',
    subtitle: 'Effortless Modern Matching Sets',
    description:
      'Impeccably tailored two-piece sets in organic linens, fluid modal blends, and lustrous crepe silks. Ideal for corporate power dressing, Sunday brunches, and vacation chic.',
    bannerImage: '/images/products/dabu-cotton-coord-teal-blue.jpg',
  },
  kurtas: {
    title: 'Artisanal Kurtas & Anarkalis',
    subtitle: 'Imperial Royal Grace for Every Occasion',
    description:
      'From 24-kali flared Chanderi Anarkalis with delicate gota trims to lightweight Lucknowi Chikankari shadow-work, tailored with breathable mulmul linings.',
    bannerImage: '/images/products/bandhani-kurta-rani-pink.jpg',
  },
  sarees: {
    title: 'Curated Artisanal Sarees',
    subtitle: 'Drapes of Pure Elegance & Poetry',
    description:
      'Ethereal metallic tissue organza, authentic handwoven Banarasi Katans, and fluid modal satins celebrating timeless Indian artisanal weaves.',
    bannerImage: '/images/products/bandhani-kurta-royal-purple.jpg',
  },
};

export const dynamic = 'force-dynamic';

export default function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const resolvedParams = use(params);
  if (resolvedParams.category === 'new-arrivals') {
    redirect('/new-arrivals');
  }

  const categoryKey = resolvedParams.category as ProductCategory;
  const meta = CATEGORY_META[categoryKey];

  if (!meta) {
    notFound();
  }

  const { products: allProducts } = useStore();
  const products = allProducts.filter((p) => p.category === categoryKey);

  return (
    <div className="bg-[#F8F5F0] min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#735D50] mb-8">
          <Link href="/" className="hover:text-[#392820]">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#B79A72]" />
          <span className="text-[#392820] font-medium">{meta.title}</span>
        </nav>

        {/* Editorial Category Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-[#241914] text-white p-8 sm:p-14 mb-12 border border-[#B79A72]/30 shadow-lg">
          <div className="max-w-2xl relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#392820] text-[#B79A72] border border-[#B79A72]/30 text-xs font-semibold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{meta.subtitle}</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight">
              {meta.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#E8DCCB]/80 leading-relaxed font-sans">
              {meta.description}
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none hidden md:block">
            {/* Ambient pattern */}
            <div className="w-full h-full bg-gradient-to-l from-[#B79A72]/40 to-transparent" />
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E8DCCB]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#735D50]">
            Showing <strong>{products.length}</strong> styles in {meta.title}
          </p>
          <Link
            href="/products"
            className="text-xs text-[#B79A72] hover:underline font-semibold"
          >
            Browse All Categories &rarr;
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
