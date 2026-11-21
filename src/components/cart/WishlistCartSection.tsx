'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Plus, ShoppingBag, Check, Trash2, Sparkles, ArrowRight } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { Product, ProductSize } from '@/types';
import { formatPrice, getCartItemImage } from '@/lib/utils';

interface WishlistCartSectionProps {
  compact?: boolean;
  onItemAdded?: () => void;
}

export function WishlistCartSection({ compact = false, onItemAdded }: WishlistCartSectionProps) {
  const { wishlist, removeFromWishlist, toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { products } = useStore();

  // Local selection state for sizes and colors per product
  const [selectedSizes, setSelectedSizes] = useState<Record<string, ProductSize>>({});
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({});
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

  // Helper to get active color for a product
  const getActiveColor = (product: Product): string => {
    return selectedColors[product.id] || product.colors?.[0]?.name || 'Standard';
  };

  // Helper to get active size for a product
  const getActiveSize = (product: Product): ProductSize => {
    if (selectedSizes[product.id]) return selectedSizes[product.id];
    // Find first in-stock size, or fallback to first size or Free Size
    const inStockSize = product.sizes?.find((s) => s.inStock)?.size;
    return inStockSize || (product.sizes?.[0]?.size as ProductSize) || 'Free Size';
  };

  const handleColorChange = (productId: string, colorName: string) => {
    setSelectedColors((prev) => ({ ...prev, [productId]: colorName }));
    setErrorMessages((prev) => ({ ...prev, [productId]: '' }));
  };

  const handleSizeChange = (productId: string, size: ProductSize) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
    setErrorMessages((prev) => ({ ...prev, [productId]: '' }));
  };

  const handleAddToCartFromWishlist = (
    product: Product,
    shouldRemoveFromWishlist = false
  ) => {
    const chosenColor = getActiveColor(product);
    const chosenSize = getActiveSize(product);

    const res = addToCart(product, chosenSize, chosenColor, 1);

    if (res.success) {
      setAddedItemIds((prev) => ({ ...prev, [product.id]: true }));
      setErrorMessages((prev) => ({ ...prev, [product.id]: '' }));

      if (shouldRemoveFromWishlist) {
        removeFromWishlist(product.id);
      }

      if (onItemAdded) {
        onItemAdded();
      }

      // Reset success state after 2.5s
      setTimeout(() => {
        setAddedItemIds((prev) => ({ ...prev, [product.id]: false }));
      }, 2500);
    } else {
      setErrorMessages((prev) => ({
        ...prev,
        [product.id]: res.error || 'Failed to add item to bag.',
      }));
    }
  };

  // Recommendations to show if wishlist is empty
  const emptyWishlistSuggestions = (products || [])
    .filter((p) => p.inStock !== false)
    .slice(0, 2);

  return (
    <div className="mt-4 pt-4 border-t border-[#E8D6C7]/80">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#E8D6C7]/60 flex items-center justify-center text-[#392820]">
            <Heart className="w-3.5 h-3.5 fill-[#D9A08C] text-[#D9A08C]" />
          </div>
          <h3 className="font-serif text-sm font-semibold text-[#392820]">
            Add Product from Wishlist
          </h3>
        </div>
        {wishlist.length > 0 && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E8D6C7]/50 text-[#392820] border border-[#E8D6C7]">
            {wishlist.length} {wishlist.length === 1 ? 'saved' : 'saved'}
          </span>
        )}
      </div>

      {/* Case 1: Wishlist has items */}
      {wishlist.length > 0 ? (
        <div className="space-y-3">
          {wishlist.map((product) => {
            const currentColor = getActiveColor(product);
            const currentSize = getActiveSize(product);
            const itemImg = getCartItemImage({
              product,
              selectedColor: currentColor,
            });
            const isAdded = !!addedItemIds[product.id];
            const error = errorMessages[product.id];
            const productHref = `/products/${product.slug}?color=${encodeURIComponent(currentColor)}`;

            return (
              <div
                key={product.id}
                className="p-3 bg-white rounded-2xl border border-[#E8D6C7] shadow-xs relative flex flex-col gap-2.5 transition-all hover:border-[#D9A08C]/70"
              >
                {/* Top Row: Thumbnail + Info + Remove */}
                <div className="flex gap-3">
                  <Link
                    href={productHref}
                    className="relative w-16 h-20 sm:w-18 sm:h-22 rounded-xl overflow-hidden bg-[#FAF7F2] shrink-0 border border-[#E8D6C7] block group"
                  >
                    <Image
                      src={itemImg}
                      alt={`${product.name} - ${currentColor}`}
                      fill
                      sizes="72px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <Link
                          href={productHref}
                          className="font-serif text-xs font-semibold text-[#392820] hover:text-[#D9A08C] transition-colors line-clamp-1 leading-snug"
                        >
                          {product.name}
                        </Link>
                        <button
                          onClick={() => removeFromWishlist(product.id)}
                          className="text-[#735D50] hover:text-rose-600 transition-colors p-0.5 shrink-0"
                          title="Remove from wishlist"
                          aria-label={`Remove ${product.name} from wishlist`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="font-bold text-xs sm:text-sm text-[#392820]">
                          {formatPrice(product.price)}
                        </span>
                        {product.originalPrice > product.price && (
                          <span className="text-[10px] text-[#735D50] line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Color Swatches */}
                    {product.colors && product.colors.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] text-[#735D50] mr-0.5">Color:</span>
                        {product.colors.map((c) => {
                          const isSelected = currentColor.toLowerCase() === c.name.toLowerCase();
                          return (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => handleColorChange(product.id, c.name)}
                              title={c.name}
                              className={`w-4 h-4 rounded-full border transition-all relative ${
                                isSelected
                                  ? 'border-[#392820] ring-1 ring-[#392820] scale-110'
                                  : 'border-[#E8D6C7] hover:scale-105'
                              }`}
                              style={{ backgroundColor: c.hex || '#E8D6C7' }}
                            />
                          );
                        })}
                        <span className="text-[10px] font-medium text-[#392820] ml-1">
                          {currentColor}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Size Selector */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="pt-1 border-t border-[#FAF7F2]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-[#735D50] mr-1">Size:</span>
                      {product.sizes.map((s) => {
                        const isSelected = currentSize === s.size;
                        const isAvailable = s.inStock !== false;
                        return (
                          <button
                            key={s.size}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => handleSizeChange(product.id, s.size)}
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-md border transition-all ${
                              isSelected
                                ? 'bg-[#392820] text-[#FAF7F2] border-[#392820] font-bold shadow-xs'
                                : isAvailable
                                ? 'bg-[#FAF7F2] text-[#392820] border-[#E8D6C7] hover:border-[#D9A08C]'
                                : 'bg-gray-100 text-gray-400 border-gray-200 line-through cursor-not-allowed'
                            }`}
                          >
                            {s.size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Error notice if any */}
                {error && (
                  <p className="text-[10px] text-rose-600 font-medium px-1">
                    {error}
                  </p>
                )}

                {/* Action Button: Single clear + Add to Bag */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddToCartFromWishlist(product)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs ${
                      isAdded
                        ? 'bg-emerald-700 text-white'
                        : 'bg-[#392820] text-[#FAF7F2] hover:bg-[#111111]'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4" /> Added to Bag
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-[#D9A08C]" /> Add to Bag
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Case 2: Wishlist is empty - show inviting prompt and quick add */
        <div className="p-4 bg-white/80 rounded-2xl border border-dashed border-[#E8D6C7] text-center space-y-3">
          <div className="w-9 h-9 rounded-full bg-[#FAF7F2] text-[#D9A08C] flex items-center justify-center mx-auto border border-[#E8D6C7]">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <p className="font-serif text-xs font-semibold text-[#392820]">
              Your Saved Wishlist is Empty
            </p>
            <p className="text-[11px] text-[#735D50] mt-0.5 leading-relaxed">
              Tap the heart ♡ on any piece to save it here for instant 1-click addition to your bag!
            </p>
          </div>

          {/* Quick Trending Suggestions to save or add */}
          {emptyWishlistSuggestions.length > 0 && (
            <div className="pt-2 text-left border-t border-[#FAF7F2]">
              <span className="text-[10px] uppercase tracking-wider text-[#D9A08C] font-bold block mb-2">
                Popular Boutique Picks to Add:
              </span>
              <div className="space-y-2">
                {emptyWishlistSuggestions.map((item) => {
                  const itemColor = getActiveColor(item);
                  const itemSize = getActiveSize(item);
                  const itemImg = getCartItemImage({ product: item, selectedColor: itemColor });
                  const isSaved = isInWishlist(item.id);
                  const isAdded = !!addedItemIds[item.id];

                  return (
                    <div
                      key={item.id}
                      className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E8D6C7] flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative w-11 h-14 rounded-lg overflow-hidden bg-white shrink-0 border border-[#E8D6C7]">
                          <Image
                            src={itemImg}
                            alt={item.name}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-serif text-xs font-semibold text-[#392820] line-clamp-1">
                            {item.name}
                          </p>
                          <p className="text-[11px] font-bold text-[#392820] mt-0.5">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleWishlist(item)}
                          className="p-1.5 rounded-lg border border-[#E8D6C7] text-[#735D50] hover:text-[#D9A08C] transition-colors"
                          title={isSaved ? 'In Wishlist' : 'Save to Wishlist'}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              isSaved ? 'fill-[#D9A08C] text-[#D9A08C]' : ''
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddToCartFromWishlist(item, false)}
                          className={`text-[10px] font-semibold px-2.5 py-1.5 rounded-lg uppercase tracking-wider transition-all flex items-center gap-1 ${
                            isAdded
                              ? 'bg-emerald-700 text-white'
                              : 'bg-[#392820] text-[#FAF7F2] hover:bg-[#111111]'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3 h-3" /> Added
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3 text-[#D9A08C]" /> Bag
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#392820] hover:text-[#D9A08C] uppercase tracking-wider pt-1 transition-colors"
          >
            <span>Explore Boutique Catalog</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
