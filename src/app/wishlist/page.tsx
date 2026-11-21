'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  ArrowRight,
  ShoppingBag,
  Trash2,
  Check,
  X,
  Sparkles,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { Product, ProductSize } from '@/types';
import { formatPrice } from '@/lib/utils';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, moveWishlistItemToCart, wishlistCount } = useWishlist();
  const { openCart } = useCart();

  // Variant selector modal state for "Move to Bag"
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductSize | ''>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [variantError, setVariantError] = useState<string | null>(null);
  const [moveSuccess, setMoveSuccess] = useState<string | null>(null);

  const handleOpenVariantModal = (product: Product) => {
    setSelectedProduct(product);
    setVariantError(null);
    setSelectedColor(product.colors?.[0]?.name || 'Standard');

    // Default to first available size
    const availableSize = product.sizes?.find((s) => s.inStock)?.size || (product.sizes?.[0]?.size as ProductSize) || 'Free Size';
    setSelectedSize(availableSize);
  };

  const handleCloseVariantModal = () => {
    setSelectedProduct(null);
    setSelectedSize('');
    setSelectedColor('');
    setVariantError(null);
  };

  const handleConfirmMoveToBag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (!selectedSize) {
      setVariantError('Please choose a size.');
      return;
    }

    const res = moveWishlistItemToCart(
      selectedProduct,
      selectedSize as ProductSize,
      selectedColor || 'Standard',
      1
    );

    if (res.success) {
      setMoveSuccess(`Moved "${selectedProduct.name}" to your bag!`);
      handleCloseVariantModal();
      openCart();
      setTimeout(() => setMoveSuccess(null), 3000);
    } else {
      setVariantError(res.error || 'Failed to move item to bag.');
    }
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12">
          <div className="w-12 h-12 rounded-full bg-[#E8D6C7]/50 text-[#392820] flex items-center justify-center mx-auto mb-3 border border-[#E8D6C7]">
            <Heart className="w-6 h-6 fill-[#D9A08C] text-[#D9A08C]" />
          </div>
          <span className="text-xs uppercase tracking-[0.25em] text-[#D9A08C] font-semibold block mb-1">
            Private Boutique Selection
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#392820] font-medium mb-2">
            My Saved Wishlist
          </h1>
          <p className="text-xs sm:text-sm text-[#735D50]">
            You have {wishlistCount} {wishlistCount === 1 ? 'handcrafted piece' : 'handcrafted pieces'} saved in your curation.
          </p>
        </div>

        {/* Success Feedback Toast */}
        {moveSuccess && (
          <div className="max-w-md mx-auto mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-center gap-2 shadow-xs">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{moveSuccess}</span>
          </div>
        )}

        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {wishlist.map((product) => {
              const imageSrc = product.images?.[0] || '/images/placeholder.jpg';
              const isAvailable = product.inStock !== false;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden border border-[#E8D6C7] hover:border-[#D9A08C] transition-all duration-300 shadow-xs hover:shadow-md flex flex-col group"
                >
                  {/* Image Frame */}
                  <div className="relative aspect-[3/4] w-full bg-[#FAF7F2] overflow-hidden">
                    <Link href={`/products/${product.slug}`} className="block w-full h-full">
                      <Image
                        src={imageSrc}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className={`object-cover group-hover:scale-105 transition-transform duration-500 ${
                          !isAvailable ? 'grayscale-[30%] opacity-85' : ''
                        }`}
                      />
                    </Link>

                    {/* Stock Status Badge */}
                    <div className="absolute top-3 left-3 z-10 pointer-events-none">
                      {!isAvailable ? (
                        <span className="bg-[#1A1310]/90 backdrop-blur-xs text-[#FAF7F2] text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-xs border border-white/20">
                          Out of Stock
                        </span>
                      ) : product.discountPercent && product.discountPercent > 0 ? (
                        <span className="bg-[#392820] text-[#FAF7F2] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                          {product.discountPercent}% OFF
                        </span>
                      ) : null}
                    </div>

                    {/* Remove from Wishlist Trash Button */}
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-xs text-[#735D50] hover:text-rose-600 hover:bg-white shadow-xs transition-colors z-10"
                      title="Remove from wishlist"
                      aria-label={`Remove ${product.name} from wishlist`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Card Info */}
                  <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#D9A08C] font-semibold block mb-0.5">
                        {product.categoryLabel || 'Boutique Piece'}
                      </span>
                      <h3 className="font-serif text-sm font-semibold text-[#392820] line-clamp-1">
                        <Link href={`/products/${product.slug}`} className="hover:text-[#D9A08C] transition-colors">
                          {product.name}
                        </Link>
                      </h3>
                      <p className="text-xs text-[#735D50] line-clamp-1 mt-0.5">
                        {product.fabric || 'Pure Fabric'}
                      </p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="font-serif text-base font-bold text-[#392820]">
                          {formatPrice(product.price)}
                        </span>
                        {product.originalPrice > product.price && (
                          <span className="text-xs text-[#735D50] line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Move to Bag Action Button */}
                    <div className="pt-2 border-t border-[#FAF7F2]">
                      {isAvailable ? (
                        <button
                          onClick={() => handleOpenVariantModal(product)}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#392820] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider hover:bg-[#111111] transition-all flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-[#D9A08C]" />
                          <span>Move to Bag</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-2.5 px-4 rounded-xl bg-neutral-200 text-neutral-500 text-xs font-semibold uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-1.5"
                        >
                          <span>Currently Sold Out</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Wishlist State */
          <div className="bg-white rounded-3xl p-12 sm:p-16 text-center max-w-md mx-auto border border-[#E8D6C7] shadow-sm space-y-4">
            <div className="w-18 h-18 rounded-full bg-[#FAF7F2] flex items-center justify-center mx-auto text-[#D9A08C] border border-[#E8D6C7]">
              <Heart className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-xl font-semibold text-[#392820]">
                Your wishlist is empty
              </h3>
              <p className="text-xs text-[#735D50] leading-relaxed max-w-xs mx-auto">
                Tap the heart icon on any Co-ord set, Kurta, or Saree while browsing to curate your private favorites.
              </p>
            </div>
            <div className="pt-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#392820] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider hover:bg-[#111111] transition-all shadow-md"
              >
                <span>Explore Collections</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Variant Selection Modal for "Move to Bag" */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-[#E8D6C7] shadow-2xl relative space-y-5">
              
              {/* Close Button */}
              <button
                onClick={handleCloseVariantModal}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-[#FAF7F2] text-[#735D50] hover:text-[#392820]"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex gap-4 items-center pr-8">
                <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-[#FAF7F2] shrink-0 border border-[#E8D6C7]">
                  <Image
                    src={selectedProduct.images?.[0] || '/images/placeholder.jpg'}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#D9A08C] font-semibold">
                    Select Your Fit
                  </span>
                  <h3 className="font-serif text-sm font-semibold text-[#392820] leading-snug">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-sm font-bold text-[#392820] mt-1">
                    {formatPrice(selectedProduct.price)}
                  </p>
                </div>
              </div>

              {variantError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{variantError}</span>
                </div>
              )}

              <form onSubmit={handleConfirmMoveToBag} className="space-y-4">
                {/* Size Selector (Required) */}
                <div>
                  <label className="text-xs font-semibold text-[#392820] block mb-2">
                    Size: <span className="text-[#D9A08C]">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.sizes?.map((s) => (
                      <button
                        type="button"
                        key={s.size}
                        disabled={!s.inStock}
                        onClick={() => setSelectedSize(s.size)}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                          selectedSize === s.size
                            ? 'border-[#392820] bg-[#392820] text-white shadow-xs'
                            : s.inStock
                            ? 'border-[#E8D6C7] bg-[#FAF7F2] text-[#392820] hover:border-[#D9A08C]'
                            : 'border-dashed border-neutral-300 text-neutral-400 line-through cursor-not-allowed'
                        }`}
                      >
                        {s.size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selector */}
                {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-[#392820] block mb-2">
                      Color: <strong className="text-[#735D50]">{selectedColor}</strong>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.colors.map((c) => (
                        <button
                          type="button"
                          key={c.name}
                          onClick={() => setSelectedColor(c.name)}
                          className={`px-3 py-1 text-xs rounded-xl border transition-all ${
                            selectedColor === c.name
                              ? 'border-[#392820] bg-[#FAF7F2] text-[#392820] font-bold shadow-xs'
                              : 'border-[#E8D6C7] text-[#735D50] hover:border-[#D9A08C]'
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Move CTA */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-full bg-[#392820] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider hover:bg-[#111111] transition-all flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#D9A08C]" />
                    <span>Confirm &amp; Move to Bag</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseVariantModal}
                    className="py-3 px-5 rounded-full border border-[#E8D6C7] text-[#735D50] text-xs font-semibold uppercase tracking-wider hover:bg-[#FAF7F2]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
