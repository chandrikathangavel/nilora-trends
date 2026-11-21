'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Sparkles, Filter, ChevronRight, Shield, SlidersHorizontal } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { ProductCard } from '@/components/home/ProductCard';
import { ProductCategory, ProductOccasion } from '@/types';

function NewArrivalsContent() {
  const { products } = useStore();
  const { isAdmin } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [sortBy, setSortBy] = useState<string>('latest');

  const handleCategorySelect = (catKey: string) => {
    setSelectedCategory(catKey);
    if (catKey === 'sarees') {
      setSelectedSize('Free Size');
    } else if (selectedSize === 'Free Size') {
      setSelectedSize('all');
    }
  };

  const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  // Filter for products marked as isNewArrival
  const newArrivalProducts = useMemo(() => {
    // Primary set: products flagged with isNewArrival === true
    const flagged = products.filter((p) => p.isNewArrival);
    // If none are flagged, fallback to latest products
    const pool = flagged.length > 0 ? flagged : products;

    return pool
      .filter((product) => {
        // Category filter
        if (selectedCategory !== 'all' && product.category !== selectedCategory) {
          return false;
        }
        // Price filter
        if (product.price > maxPrice) {
          return false;
        }
        // Size filter
        if (selectedSize !== 'all') {
          if (selectedSize === 'Free Size') {
            const isFreeSize =
              product.category === 'sarees' ||
              product.sizes?.some((s) => s.size === 'Free Size') ||
              product.name.toLowerCase().includes('saree');
            if (!isFreeSize) return false;
          } else {
            if (product.category === 'sarees') return false;
            const hasSize = product.sizes?.some(
              (s) => s.size.toUpperCase() === selectedSize.toUpperCase() && (s.inStock || s.stockCount > 0)
            );
            if (!hasSize) return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        return 0; // latest default
      });
  }, [products, selectedCategory, selectedSize, maxPrice, sortBy]);

  return (
    <div className="bg-[#F8F5F0] min-h-screen py-8 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#735D50] mb-6">
          <Link href="/" className="hover:text-[#392820] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#B79A72]" />
          <span className="text-[#392820] font-medium">New Arrivals</span>
        </nav>

        {/* Editorial Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-[#241914] text-white p-8 sm:p-12 mb-10 border border-[#B79A72]/30 shadow-xl">
          <div className="max-w-2xl relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#392820] text-[#D9A08C] border border-[#B79A72]/40 text-xs font-semibold tracking-widest uppercase shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fresh From The Atelier</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-[#FAF7F2]">
              New Arrivals Collection
            </h1>
            <p className="text-xs sm:text-sm text-[#E8DCCB]/85 leading-relaxed font-sans">
              Discover our latest contemporary seasonal drops, celebratory Co-ord sets, royal Chanderi kurtas, and pure handwoven artisanal sarees — freshly released and crafted for modern Indian grace.
            </p>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 pointer-events-none hidden md:block">
            <div className="w-full h-full bg-gradient-to-l from-[#D9A08C]/40 to-transparent" />
          </div>
        </div>

        {/* Admin Quick Callout if admin is logged in */}
        {isAdmin && (
          <div className="mb-8 p-4 rounded-2xl bg-[#FAF7F2] border border-[#D9A08C] flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 text-xs text-[#392820]">
              <Shield className="w-4 h-4 text-[#D9A08C] shrink-0" />
              <span>
                <strong>Boutique Administrator Mode:</strong> You can edit products, adjust prices, or toggle New Arrival status directly.
              </span>
            </div>
            <Link
              href="/admin"
              className="text-xs font-semibold px-4 py-1.5 rounded-full bg-[#392820] text-[#D9A08C] hover:bg-[#111111] transition-all"
            >
              Open Admin Catalog Manager &rarr;
            </Link>
          </div>
        )}

        {/* Filter & Sorting Controls */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E8DCCB] shadow-sm mb-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F8F5F0] pb-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#392820]">
              <Filter className="w-4 h-4 text-[#B79A72]" />
              <span>Filter New Drops</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#735D50] hidden sm:inline">Sort By:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#F8F5F0] border border-[#E8DCCB] rounded-lg px-3 py-1.5 text-xs text-[#392820] outline-none font-medium cursor-pointer"
                >
                  <option value="latest">Latest Drop Date</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#735D50] mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'all', label: 'All New' },
                  { key: 'co-ord-sets', label: 'Co-ord Sets' },
                  { key: 'kurtas', label: 'Kurtas' },
                  { key: 'sarees', label: 'Sarees' },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => handleCategorySelect(cat.key)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      selectedCategory === cat.key
                        ? 'bg-[#392820] text-white border-[#392820]'
                        : 'bg-[#F8F5F0] text-[#392820] border-[#E8DCCB] hover:bg-[#E8DCCB]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#735D50] mb-2">
                Size
              </label>
              <div className="flex flex-wrap gap-1.5">
                {selectedCategory === 'sarees' ? (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setSelectedSize('Free Size')}
                      className="text-xs px-3 py-1.5 rounded-full bg-[#392820] text-white border border-[#392820] font-semibold w-fit"
                    >
                      Free Size
                    </button>
                    <span className="text-[10px] text-[#735D50] italic">
                      (Sarees are standard draped Free Size)
                    </span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedSize('all')}
                      className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${
                        selectedSize === 'all'
                          ? 'bg-[#392820] text-white border-[#392820]'
                          : 'bg-[#F8F5F0] text-[#392820] border-[#E8DCCB] hover:bg-[#E8DCCB]'
                      }`}
                    >
                      All
                    </button>
                    {STANDARD_SIZES.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`text-xs px-2 py-1.5 rounded-full border transition-all ${
                          selectedSize === sz
                            ? 'bg-[#392820] text-white border-[#392820]'
                            : 'bg-[#F8F5F0] text-[#392820] border-[#E8DCCB] hover:bg-[#E8DCCB]'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Max Price Slider (Starts at ₹199) */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#735D50]">
                  Max Price
                </label>
                <span className="text-xs font-bold text-[#392820]">
                  ₹{maxPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min={199}
                max={5000}
                step={50}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#B79A72] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#735D50] mt-1">
                <span>₹199</span>
                <span>₹5,000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#E8DCCB]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#735D50]">
            Showing <strong>{newArrivalProducts.length}</strong> new arrivals
          </p>
          <Link
            href="/products"
            className="text-xs text-[#B79A72] hover:text-[#392820] hover:underline font-semibold"
          >
            View All Catalog &rarr;
          </Link>
        </div>

        {/* Products Grid */}
        {newArrivalProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {newArrivalProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#E8DCCB] space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border border-[#E8D6C7] flex items-center justify-center mx-auto text-[#D9A08C]">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl text-[#392820]">No New Arrivals Found</h3>
            <p className="text-xs text-[#735D50] max-w-sm mx-auto">
              No products matched the selected filters. Clear filters or browse our full boutique catalog.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSize('all');
                setMaxPrice(10000);
              }}
              className="px-6 py-2.5 rounded-full bg-[#392820] text-white text-xs font-semibold hover:bg-[#111111] transition-all"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewArrivalsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8F5F0]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#392820]" />
        </div>
      }
    >
      <NewArrivalsContent />
    </Suspense>
  );
}
