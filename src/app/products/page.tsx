'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter, RefreshCw, AlertCircle, Database } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { ProductCard } from '@/components/home/ProductCard';
import { ProductOccasion } from '@/types';

function ProductsContent() {
  const { products, isLoading, error, isLiveDb, refetchCatalog } = useStore();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialSort = searchParams.get('sort') || 'featured';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedOccasion, setSelectedOccasion] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>(initialCategory === 'sarees' ? 'Free Size' : 'all');
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [maxPrice, setMaxPrice] = useState<number>(5000);

  const handleCategorySelect = (catKey: string) => {
    setSelectedCategory(catKey);
    if (catKey === 'sarees') {
      setSelectedSize('Free Size');
    } else if (selectedSize === 'Free Size') {
      setSelectedSize('all');
    }
  };

  const OCCASIONS: ProductOccasion[] = [
    'Daily Wear',
    'Office Wear',
    'Ethnic & Festive',
    'Occasion Wear',
    'College & Casual',
  ];

  const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }
      // Occasion filter
      if (selectedOccasion !== 'all') {
        const occStr = (product.occasion || '').toLowerCase();
        const targetOcc = selectedOccasion.toLowerCase();
        if (occStr !== targetOcc && !occStr.includes(targetOcc)) {
          return false;
        }
      }
      // Price filter
      if (product.price > maxPrice) {
        return false;
      }
      // Size filter (if saree, size is Free Size)
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
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'latest') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
      return 0; // featured default
    });
  }, [selectedCategory, selectedOccasion, selectedSize, sortBy, maxPrice, products]);

  return (
    <div className="bg-[#F8F5F0] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title & Breadcrumb */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs uppercase tracking-[0.25em] text-[#B79A72] font-semibold">
            Boutique Collection
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#392820] font-medium mt-2 mb-3">
            All Handcrafted Pieces
          </h1>
          <p className="text-xs sm:text-sm text-[#735D50]">
            Explore our signature range of Co-ord Sets, Kurtas, and Sarees tailored with pure fabrics and timeless detailing.
          </p>
          
          {/* Supabase Live DB Status Pill */}
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium border transition-colors bg-white border-[#E8DCCB] text-[#735D50]">
            <Database className={`w-3.5 h-3.5 ${isLiveDb ? 'text-emerald-600' : 'text-amber-600'}`} />
            <span>
              {isLiveDb ? 'Connected: Live PostgreSQL Catalog' : 'Catalog: Atelier Curated Preview'}
            </span>
          </div>
        </div>

        {/* Error Alert Bar with Retry */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => refetchCatalog()}
              className="px-3 py-1 rounded-lg bg-amber-200/60 hover:bg-amber-200 text-amber-900 font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Filter & Sorting Controls */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E8DCCB] shadow-sm mb-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F8F5F0] pb-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#392820]">
              <Filter className="w-4 h-4 text-[#B79A72]" />
              <span>Filters &amp; Sort</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#735D50] hidden sm:inline">Sort By:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#F8F5F0] border border-[#E8DCCB] rounded-lg px-3 py-1.5 text-xs text-[#392820] outline-none font-medium cursor-pointer"
                >
                  <option value="featured">Featured / Curated</option>
                  <option value="latest">New Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            {/* Category Pills */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#735D50] mb-2">
                Type / Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'all', label: 'All' },
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

            {/* Size Pills (XS, S, M, L, XL, XXL, XXXL - Free Size for Sarees) */}
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

            {/* Occasion Pills */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#735D50] mb-2">
                Occasion
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedOccasion('all')}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    selectedOccasion === 'all'
                      ? 'bg-[#392820] text-white border-[#392820]'
                      : 'bg-[#F8F5F0] text-[#392820] border-[#E8DCCB] hover:bg-[#E8DCCB]'
                  }`}
                >
                  All
                </button>
                {OCCASIONS.map((occ) => (
                  <button
                    key={occ}
                    onClick={() => setSelectedOccasion(occ)}
                    className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${
                      selectedOccasion === occ
                        ? 'bg-[#392820] text-white border-[#392820]'
                        : 'bg-[#F8F5F0] text-[#392820] border-[#E8DCCB] hover:bg-[#E8DCCB]'
                    }`}
                  >
                    {occ}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Price Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#735D50]">
                  Max Price
                </label>
                <span className="text-xs font-bold text-[#392820]">₹{maxPrice.toLocaleString('en-IN')}</span>
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

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-medium text-[#735D50]">
            Showing <strong>{filteredProducts.length}</strong> handcrafted pieces
          </p>
          {(selectedCategory !== 'all' || selectedOccasion !== 'all' || maxPrice < 10000) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedOccasion('all');
                setMaxPrice(10000);
              }}
              className="text-xs text-[#B79A72] hover:underline font-semibold"
            >
              Reset All Filters
            </button>
          )}
        </div>

        {/* Product Grid / Skeleton / Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[#E8DCCB] animate-pulse">
                <div className="aspect-3/4 bg-[#E8DCCB]/50 w-full" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-1/3 bg-[#E8DCCB]/60 rounded" />
                  <div className="h-5 w-3/4 bg-[#E8DCCB]/80 rounded" />
                  <div className="h-4 w-1/2 bg-[#E8DCCB]/40 rounded" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-6 w-16 bg-[#E8DCCB]/60 rounded-full" />
                    <div className="h-6 w-16 bg-[#E8DCCB]/60 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-16 text-center border border-[#E8DCCB]">
            <h3 className="font-serif text-xl text-[#392820] font-semibold mb-2">
              No products match your criteria
            </h3>
            <p className="text-xs text-[#735D50] mb-6">
              Try adjusting your price range or clearing occasion filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedOccasion('all');
                setMaxPrice(10000);
              }}
              className="px-6 py-2.5 rounded-full bg-[#392820] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#B79A72]"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs">Loading collection...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
