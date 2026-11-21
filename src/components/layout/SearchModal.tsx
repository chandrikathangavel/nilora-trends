'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, ArrowRight, RotateCcw, Filter, Sparkles, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore, DEFAULT_SEARCH_PRICE_RANGES } from '@/context/StoreContext';
import { DEMO_PRODUCTS } from '@/data/demoProducts';
import { formatPrice } from '@/lib/utils';
import { ProductCategory, ProductSize, SearchPriceRangeTier } from '@/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPES: { key: 'all' | ProductCategory; label: string }[] = [
  { key: 'all', label: 'All Types' },
  { key: 'co-ord-sets', label: 'Co-ord Sets' },
  { key: 'kurtas', label: 'Kurtas' },
  { key: 'sarees', label: 'Sarees' },
];

const STANDARD_SIZES: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const store = useStore();
  const allProducts = store?.products && store.products.length > 0 ? store.products : DEMO_PRODUCTS;

  // Dynamic price ranges from admin store settings
  const availablePriceRanges: SearchPriceRangeTier[] = useMemo(() => {
    const configured = store?.storeSettings?.searchPriceRanges && store.storeSettings.searchPriceRanges.length > 0
      ? store.storeSettings.searchPriceRanges
      : DEFAULT_SEARCH_PRICE_RANGES;
    return [
      { key: 'all', label: 'All Prices', min: 0, max: Infinity },
      ...configured,
    ];
  }, [store?.storeSettings?.searchPriceRanges]);

  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | ProductCategory>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');

  // Handle Type Change: If type is Saree, make size Free Size
  const handleTypeSelect = (typeKey: 'all' | ProductCategory) => {
    setSelectedType(typeKey);
    if (typeKey === 'sarees') {
      setSelectedSize('Free Size');
    } else if (selectedSize === 'Free Size') {
      setSelectedSize('all');
    }
  };

  const handleResetFilters = () => {
    setQuery('');
    setSelectedType('all');
    setPriceRange('all');
    setSelectedSize('all');
  };

  const hasActiveFilters =
    query.trim().length > 0 ||
    selectedType !== 'all' ||
    priceRange !== 'all' ||
    selectedSize !== 'all';

  const filteredProducts = useMemo(() => {
    if (!hasActiveFilters) return [];

    const q = query.trim().toLowerCase();

    return allProducts.filter((product) => {
      // 1. Text Search Query
      if (q) {
        const matchesQuery =
          product.name.toLowerCase().includes(q) ||
          product.categoryLabel.toLowerCase().includes(q) ||
          product.fabric.toLowerCase().includes(q) ||
          product.occasion.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q) ||
          (product.subtitle && product.subtitle.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      // 2. Type Filter
      if (selectedType !== 'all') {
        if (product.category !== selectedType) return false;
      }

      // 3. Price Range Filter
      if (priceRange !== 'all') {
        const activeRange = availablePriceRanges.find((r) => r.key === priceRange);
        if (activeRange) {
          if (product.price < activeRange.min || product.price > activeRange.max) {
            return false;
          }
        }
      }

      // 4. Size Filter (if saree, size is Free Size)
      if (selectedSize !== 'all') {
        if (selectedSize === 'Free Size') {
          const isFreeSize =
            product.category === 'sarees' ||
            product.sizes?.some((s) => s.size === 'Free Size') ||
            product.name.toLowerCase().includes('saree');
          if (!isFreeSize) return false;
        } else {
          // If a stitched size (XS to XXXL) is selected, sarees do not match
          if (product.category === 'sarees') return false;
          const hasSize = product.sizes?.some(
            (s) => s.size.toUpperCase() === selectedSize.toUpperCase() && (s.inStock || s.stockCount > 0)
          );
          if (!hasSize) return false;
        }
      }

      return true;
    });
  }, [allProducts, hasActiveFilters, query, selectedType, priceRange, selectedSize, availablePriceRanges]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-3 sm:px-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#231813]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-[#FAF7F2] rounded-3xl shadow-2xl border border-[#D9A08C]/30 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Search Input Bar */}
        <div className="flex items-center px-4 sm:px-6 py-4 border-b border-[#E8D6C7] bg-white">
          <Search className="w-5 h-5 text-[#D9A08C] mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for Co-ord sets, Chanderi Kurtas, Tissue Sarees, Linen..."
            className="flex-1 bg-transparent text-[#392820] placeholder-[#735D50]/60 text-sm sm:text-base outline-none font-sans"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:text-[#392820] text-[#735D50] mr-2"
              title="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#FAF7F2] text-[#392820] transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar (Type, Price Range, Size) */}
        <div className="bg-[#F5EFE6] border-b border-[#E8D6C7] px-4 sm:px-6 py-3.5 space-y-3">
          
          {/* 1. Type Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#392820] w-16 shrink-0">
              Type:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => handleTypeSelect(t.key)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    selectedType === t.key
                      ? 'bg-[#392820] text-[#FAF7F2] border-[#392820] shadow-xs font-semibold'
                      : 'bg-white text-[#392820] border-[#E8D6C7] hover:border-[#D9A08C]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Price Range Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#392820] w-16 shrink-0">
              Price:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {availablePriceRanges.map((pr) => (
                <button
                  key={pr.key}
                  onClick={() => setPriceRange(pr.key)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    priceRange === pr.key
                      ? 'bg-[#392820] text-[#FAF7F2] border-[#392820] shadow-xs font-semibold'
                      : 'bg-white text-[#392820] border-[#E8D6C7] hover:border-[#D9A08C]'
                  }`}
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Size Filter (XS, S, M, L, XL, XXL, XXXL — Free Size for Sarees) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#392820] w-16 shrink-0">
              Size:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedType === 'sarees' ? (
                /* When type is Saree, size is strictly Free Size */
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedSize('Free Size')}
                    className="text-xs px-3.5 py-1 rounded-full bg-[#392820] text-[#FAF7F2] border border-[#392820] font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 text-[#D9A08C]" />
                    <span>Free Size</span>
                  </button>
                  <span className="text-[11px] text-[#735D50] italic">
                    (Sarees are standard draped Free Size)
                  </span>
                </div>
              ) : (
                /* When type is not saree, show All Sizes, standard sizes, plus Free Size */
                <>
                  <button
                    onClick={() => setSelectedSize('all')}
                    className={`text-xs px-3 py-1 rounded-full border transition-all ${
                      selectedSize === 'all'
                        ? 'bg-[#392820] text-[#FAF7F2] border-[#392820] shadow-xs font-semibold'
                        : 'bg-white text-[#392820] border-[#E8D6C7] hover:border-[#D9A08C]'
                    }`}
                  >
                    All Sizes
                  </button>
                  {STANDARD_SIZES.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                        selectedSize === sz
                          ? 'bg-[#392820] text-[#FAF7F2] border-[#392820] shadow-xs font-semibold'
                          : 'bg-white text-[#392820] border-[#E8D6C7] hover:border-[#D9A08C]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                  {selectedType === 'all' && (
                    <button
                      onClick={() => setSelectedSize('Free Size')}
                      className={`text-xs px-3 py-1 rounded-full border transition-all ${
                        selectedSize === 'Free Size'
                          ? 'bg-[#392820] text-[#FAF7F2] border-[#392820] shadow-xs font-semibold'
                          : 'bg-white text-[#392820] border-[#E8D6C7] hover:border-[#D9A08C]'
                      }`}
                    >
                      Free Size
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Active Filter Chips & Reset */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-1 border-t border-[#E8D6C7]/60 text-xs">
              <span className="text-[#735D50]">
                Active filters: <strong className="text-[#392820]">{filteredProducts.length}</strong> piece(s) match
              </span>
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-[#D9A08C] hover:text-[#392820] font-semibold flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>

        {/* Results / Suggestions Container */}
        <div className="max-h-[55vh] overflow-y-auto p-4 sm:p-6">
          {!hasActiveFilters ? (
            <div className="py-4 space-y-6">
              {/* Trending Searches */}
              <div>
                <p className="text-xs uppercase tracking-widest text-[#735D50] font-semibold mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D9A08C]" />
                  <span>Trending Boutique Searches</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Tissue Organza Sarees',
                    'Ivory Linen Co-ord',
                    'Chanderi Anarkali',
                    'Office Wear Kurtas',
                    'Espresso Silk',
                  ].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="text-xs px-3.5 py-1.5 rounded-full bg-white hover:bg-[#392820] hover:text-[#FAF7F2] border border-[#E8D6C7] transition-all text-[#392820] shadow-2xs"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Category Jump */}
              <div className="pt-2 border-t border-[#E8D6C7]">
                <p className="text-xs uppercase tracking-widest text-[#735D50] font-semibold mb-3">
                  Quick Category Jump
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Co-ord Sets', type: 'co-ord-sets' as const },
                    { label: 'Royal Kurtas', type: 'kurtas' as const },
                    { label: 'Artisanal Sarees', type: 'sarees' as const },
                  ].map((cat) => (
                    <button
                      key={cat.type}
                      onClick={() => handleTypeSelect(cat.type)}
                      className="p-3 bg-white rounded-2xl border border-[#E8D6C7] text-center hover:border-[#D9A08C] hover:shadow-xs transition-all text-xs font-serif font-medium text-[#392820]"
                    >
                      {cat.label} &rarr;
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8D6C7]">
                <p className="text-xs text-[#735D50] font-medium">
                  Showing <strong className="text-[#392820]">{filteredProducts.length}</strong> boutique pieces
                </p>
                <span className="text-[11px] text-[#D9A08C] font-semibold uppercase tracking-wider">
                  Handcrafted Collections
                </span>
              </div>

              <div className="divide-y divide-[#E8D6C7]/60">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-4 py-3 px-2 rounded-2xl hover:bg-white transition-all group"
                  >
                    <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-[#FAF7F2] shrink-0 border border-[#E8D6C7]">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] tracking-wider uppercase text-[#D9A08C] font-semibold">
                          {product.categoryLabel}
                        </span>
                        <span className="text-[#735D50] text-[10px]">&bull;</span>
                        <span className="text-[10px] text-[#735D50]">
                          {product.fabric.split('with')[0].trim()}
                        </span>
                        <span
                          className={`ml-auto text-[9px] uppercase px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                            product.inStock
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          <span className={`w-1 h-1 rounded-full ${product.inStock ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                      <h4 className="font-serif text-sm font-semibold text-[#392820] truncate group-hover:text-[#D9A08C] transition-colors mt-0.5">
                        {product.name}
                      </h4>
                      
                      {/* Price and Available Sizes */}
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-[#392820]">
                          {formatPrice(product.price)}
                        </span>
                        {product.originalPrice > product.price && (
                          <span className="text-xs text-[#735D50] line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                        <div className="flex items-center gap-1 ml-auto">
                          {product.category === 'sarees' ? (
                            <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-[#E8D6C7]/60 text-[#392820] font-semibold">
                              Free Size
                            </span>
                          ) : (
                            <div className="flex items-center gap-0.5">
                              {product.sizes
                                ?.filter((s) => s.inStock || s.stockCount > 0)
                                .slice(0, 5)
                                .map((s) => (
                                  <span
                                    key={s.size}
                                    className={`text-[9px] px-1.5 py-0.5 rounded ${
                                      selectedSize === s.size
                                        ? 'bg-[#392820] text-[#FAF7F2] font-bold'
                                        : 'bg-white text-[#735D50] border border-[#E8D6C7]'
                                    }`}
                                  >
                                    {s.size}
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#D9A08C] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#E8D6C7]/50 text-[#392820] flex items-center justify-center mx-auto">
                <Search className="w-5 h-5 text-[#D9A08C]" />
              </div>
              <h3 className="font-serif text-lg text-[#392820] font-medium">No matching boutique pieces</h3>
              <p className="text-xs text-[#735D50] max-w-sm mx-auto">
                No items match your active filters. Try adjusting your type, size, or price range.
              </p>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 text-xs text-[#392820] bg-white border border-[#D9A08C] px-4 py-2 rounded-full font-semibold hover:bg-[#FAF7F2] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#D9A08C]" />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
