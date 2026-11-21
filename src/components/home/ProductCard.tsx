'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Check, X } from 'lucide-react';
import { Product, ProductSize } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { getColorHexFallback } from '@/lib/api/products';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [isHovered, setIsHovered] = useState(false);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  const isFavorited = isInWishlist(product.id);

  // Active color and active photo for this product
  const activeColor = product.colors && product.colors[selectedColorIndex]
    ? product.colors[selectedColorIndex]
    : product.colors?.[0];

  const activeImage = activeColor?.image || product.images[selectedColorIndex] || product.images[0];
  const secondaryImage =
    activeColor?.closeUpImage ||
    (activeColor?.images && activeColor.images.length > 1 ? activeColor.images[1] : undefined);

  const productUrl = `/products/${product.slug}${activeColor?.name ? `?color=${encodeURIComponent(activeColor.name)}` : ''}`;

  const handleSelectSize = (size: ProductSize, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const chosenColor = activeColor?.name || 'Default';
    addToCart(product, size, chosenColor, 1);
    setShowSizeSelector(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div
      className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-[#E8D6C7] hover:border-[#D9A08C] transition-all duration-300 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowSizeSelector(false);
      }}
    >
      {/* Product Image Frame */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#E8D6C7]">
        <Link href={productUrl} className="block w-full h-full">
          {/* Main Photo */}
          <Image
            src={activeImage}
            alt={`${product.name} in ${activeColor?.name || 'exclusive hue'}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
            className={`object-cover transition-all duration-500 ${
              !product.inStock ? 'grayscale-[25%] opacity-85' : ''
            } ${
              isHovered && secondaryImage ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
            }`}
          />
          {/* Alternate angle on hover */}
          {secondaryImage && (
            <Image
              src={secondaryImage}
              alt={`${product.name} alternate angle`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
              className={`object-cover transition-all duration-500 absolute inset-0 ${
                !product.inStock ? 'grayscale-[25%] opacity-85' : ''
              } ${
                isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
              }`}
            />
          )}

          {/* Out of Stock Subtle Overlay Watermark */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-[#1A1310]/25 flex items-center justify-center pointer-events-none">
              <span className="bg-[#1A1310]/90 backdrop-blur-xs text-[#FAF7F2] text-[10px] sm:text-xs font-serif tracking-widest uppercase px-3.5 py-1 rounded-full border border-white/20 shadow-lg">
                Out of Stock
              </span>
            </div>
          )}
        </Link>

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
          {!product.inStock ? (
            <span className="bg-[#1A1310]/95 backdrop-blur-xs text-[#FAF7F2] text-[9px] sm:text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-md border border-[#FAF7F2]/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block animate-pulse" />
              Out of Stock
            </span>
          ) : product.discountPercent && product.discountPercent > 0 ? (
            <span className="bg-[#392820] text-[#FAF7F2] text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              {product.discountPercent}% OFF
            </span>
          ) : product.isNewArrival ? (
            <span className="bg-[#D9A08C] text-white text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full shadow-xs">
              New
            </span>
          ) : null}
        </div>

        {/* Heart-shaped Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full shadow-xs transition-transform duration-200 z-10 ${
            isFavorited
              ? 'bg-[#392820] text-rose-400 scale-110'
              : 'bg-white/90 backdrop-blur-xs text-[#392820] hover:text-rose-500 hover:bg-white'
          }`}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorited ? 'fill-current text-rose-500' : ''}`} />
        </button>

        {/* Add to Cart / Select Options Overlay */}
        <div className="absolute bottom-2.5 inset-x-2.5 z-10">
          {!product.inStock ? (
            <div className="w-full py-2 px-3 rounded-xl text-[10px] sm:text-xs font-bold tracking-wider uppercase bg-[#FAF7F2]/95 backdrop-blur-xs text-[#735D50] border border-[#E8D6C7] flex items-center justify-center gap-1.5 cursor-not-allowed select-none shadow-xs">
              <X className="w-3.5 h-3.5 text-rose-500" />
              <span>Out of Stock</span>
            </div>
          ) : showSizeSelector ? (
            <div className="bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-[#D9A08C] shadow-lg animate-in fade-in zoom-in-95 duration-150">
              <p className="text-[10px] font-bold text-[#392820] mb-1.5 text-center uppercase tracking-wider">
                Select Size:
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                {product.sizes.map((s) => (
                  <button
                    key={s.size}
                    disabled={!s.inStock}
                    onClick={(e) => handleSelectSize(s.size, e)}
                    className={`px-2 py-0.5 text-[10px] sm:text-xs rounded font-semibold transition-colors ${
                      s.inStock
                        ? 'border border-[#392820] text-[#392820] hover:bg-[#392820] hover:text-white'
                        : 'border border-dashed border-neutral-300 text-neutral-400 cursor-not-allowed line-through'
                    }`}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (product.sizes.length === 1 && product.sizes[0].size === 'Free Size') {
                  handleSelectSize('Free Size', e);
                } else {
                  setShowSizeSelector(true);
                }
              }}
              className={`w-full py-2 px-3 rounded-xl text-[10px] sm:text-xs font-bold tracking-wider uppercase shadow-xs flex items-center justify-center gap-1.5 transition-all duration-200 ${
                justAdded
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white/95 backdrop-blur-xs text-[#392820] hover:bg-[#392820] hover:text-white border border-[#E8D6C7]'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Added!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5 text-[#D9A08C]" /> Add to Cart
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between bg-white">
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[#D9A08C] font-semibold block">
              {product.categoryLabel}
            </span>
            {product.colors && product.colors.length > 1 && (
              <span className="text-[10px] text-[#735D50] font-medium">
                {product.colors.length} Colors
              </span>
            )}
          </div>

          <Link href={productUrl} className="block hover:text-[#D9A08C] transition-colors">
            <h3 className="font-serif text-xs sm:text-sm font-normal text-[#392820] line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Colours available down of the product - Clickable to open clicked color product */}
          {product.colors && product.colors.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {product.colors.map((color, idx) => {
                  const isSelected = selectedColorIndex === idx;
                  const colorUrl = `/products/${product.slug}?color=${encodeURIComponent(color.name)}`;
                  const isPaleWhiteDefault = color.hex === '#E8D6C7' || !color.hex;
                  const isActuallyBeige = /beige|champagne|cream|sand|wheat/i.test(color.name);
                  const displayHex = (isPaleWhiteDefault && !isActuallyBeige) ? getColorHexFallback(color.name) : (color.hex || '#C41D53');
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedColorIndex(idx);
                      }}
                      onMouseEnter={() => setSelectedColorIndex(idx)}
                      title={`View ${color.name} (${product.name})`}
                      className={`relative p-0.5 rounded-full transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-[#392820] ring-offset-1 scale-110'
                          : 'opacity-75 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <span
                        className="block w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-black/15 shadow-2xs"
                        style={{ backgroundColor: displayHex }}
                      />
                      <span className="sr-only">{color.name}</span>
                    </button>
                  );
                })}
                <Link
                  href={`/products/${product.slug}?color=${encodeURIComponent(activeColor?.name || '')}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] text-[#735D50] hover:text-[#392820] hover:underline ml-1 font-medium truncate max-w-[130px]"
                >
                  {activeColor?.name} &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Pricing in Indian Rupees & Stock Status */}
        <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-[#FAF7F2]">
          <div className="flex items-baseline gap-2">
            <span className="text-xs sm:text-sm font-bold text-[#392820]">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-[10px] sm:text-xs text-[#392820]/50 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          <span
            className={`text-[10px] font-semibold tracking-wide flex items-center gap-1 ${
              product.inStock ? 'text-emerald-700' : 'text-rose-700 font-bold'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${product.inStock ? 'bg-emerald-600' : 'bg-rose-500 animate-pulse'}`} />
            {product.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
      </div>
    </div>
  );
}
