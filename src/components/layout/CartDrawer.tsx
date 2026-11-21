'use client';

import React from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { WishlistCartSection } from '@/components/cart/WishlistCartSection';
import { formatPrice, getCartItemImage } from '@/lib/utils';
import { FREE_SHIPPING_THRESHOLD_RUPEES } from '@/lib/money';

export function CartDrawer() {
  const {
    cart,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    shippingFee,
    freeShippingRemaining,
    discountAmount,
    totalAmount,
    appliedCoupon,
    cartCount,
    inventoryNotices,
    clearInventoryNotices,
  } = useCart();
  const { user } = useAuth();

  if (!isCartOpen) return null;

  const freeShippingProgress = Math.min(100, (cartSubtotal / FREE_SHIPPING_THRESHOLD_RUPEES) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#231813]/60 backdrop-blur-xs transition-opacity"
        onClick={closeCart}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FAF7F2] border-l border-[#E8D6C7] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4.5 bg-white border-b border-[#E8D6C7] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#E8D6C7]/50 flex items-center justify-center text-[#392820]">
                <ShoppingBag className="w-4 h-4 text-[#D9A08C]" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-semibold text-[#392820]">
                  Your Boutique Bag
                </h2>
                <p className="text-[11px] text-[#735D50]">
                  {cartCount} {cartCount === 1 ? 'handcrafted piece' : 'handcrafted pieces'}
                </p>
              </div>
            </div>
            <button
              onClick={closeCart}
              className="p-2 rounded-full hover:bg-[#FAF7F2] text-[#735D50] hover:text-[#392820] transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Inventory / Stock Notices Banner */}
          {inventoryNotices.length > 0 && (
            <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex items-start justify-between gap-2 text-xs text-amber-900">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  {inventoryNotices.map((notice, idx) => (
                    <p key={idx} className="text-[11px] font-medium leading-tight">
                      {notice}
                    </p>
                  ))}
                </div>
              </div>
              <button
                onClick={clearInventoryNotices}
                className="text-amber-700 hover:text-amber-900 p-0.5"
                title="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Free Shipping Meter */}
          <div className="px-6 py-3 bg-[#F4EDE4] border-b border-[#E8D6C7]">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium text-[#392820]">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-[#D9A08C]" />
                {freeShippingRemaining === 0 ? (
                  <span className="text-emerald-800 font-semibold">
                    Congratulations! You unlocked FREE Pan-India Delivery!
                  </span>
                ) : (
                  <span>
                    Add <strong className="text-[#392820] font-bold">{formatPrice(freeShippingRemaining)}</strong> more for <strong>FREE Pan-India Delivery</strong>
                  </span>
                )}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#E8D6C7] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#D9A08C] to-[#392820] transition-all duration-500 rounded-full"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-[#E8D6C7]/50 flex items-center justify-center mb-4 text-[#D9A08C] border border-[#D9A08C]/40">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#392820] mb-1.5">
                  Your bag is currently empty
                </h3>
                <p className="text-xs text-[#735D50] max-w-xs mb-6 leading-relaxed">
                  Discover our artisanal Co-ord sets, royal Chanderi kurtas, and luxury festive sarees.
                </p>
                <Link
                  href="/products"
                  onClick={closeCart}
                  className="px-6 py-2.5 rounded-full bg-[#392820] text-[#FAF7F2] text-xs font-semibold tracking-wider uppercase hover:bg-[#111111] transition-all shadow-sm"
                >
                  Explore Collections
                </Link>
              </div>
            ) : (
              <>
                {cart.map((item) => {
                  const itemImg = getCartItemImage(item);
                  const unitPrice = item.product.price;
                  const lineTotal = unitPrice * item.quantity;
                  const itemUrl = `/products/${item.product.slug}?color=${encodeURIComponent(item.selectedColor)}`;

                  return (
                    <div
                      key={item.id}
                      className="flex gap-3.5 p-3.5 bg-white rounded-2xl border border-[#E8D6C7] shadow-xs relative group"
                    >
                      {/* Thumbnail */}
                      <Link
                        href={itemUrl}
                        onClick={closeCart}
                        className="relative w-18 h-24 sm:w-20 sm:h-26 rounded-xl overflow-hidden bg-[#FAF7F2] shrink-0 border border-[#E8D6C7] block"
                      >
                        <Image
                          src={itemImg}
                          alt={`${item.product.name} - ${item.selectedColor}`}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-serif text-xs sm:text-sm font-semibold text-[#392820] leading-snug line-clamp-1">
                              <Link
                                href={itemUrl}
                                onClick={closeCart}
                                className="hover:text-[#D9A08C] transition-colors"
                              >
                                {item.product.name}
                              </Link>
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-[#735D50] hover:text-rose-600 transition-colors p-1"
                              title="Remove item"
                              aria-label={`Remove ${item.product.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Variant Badges */}
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#392820] border border-[#E8D6C7] font-semibold">
                              Size: {item.selectedSize}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#735D50] border border-[#E8D6C7]">
                              {item.selectedColor}
                            </span>
                          </div>

                          {/* Unit price indicator */}
                          <p className="text-[11px] text-[#735D50] mt-1 font-medium">
                            {formatPrice(unitPrice)} each
                          </p>
                        </div>

                        {/* Quantity Selector & Item Subtotal */}
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#FAF7F2]">
                          <div className="flex items-center border border-[#E8D6C7] rounded-lg bg-[#FAF7F2] overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-1 hover:bg-[#E8D6C7] text-[#392820] transition-colors text-xs"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-bold text-[#392820] select-none">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-1 hover:bg-[#E8D6C7] text-[#392820] transition-colors text-xs"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="font-bold text-xs sm:text-sm text-[#392820]">
                            {formatPrice(lineTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add product from wishlist feature - directly below the added products in the cart */}
                <WishlistCartSection compact={true} />
              </>
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-5 sm:p-6 bg-white border-t border-[#E8D6C7] space-y-3 shadow-lg">
              <div className="space-y-1.5 text-xs text-[#735D50]">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span className="font-semibold text-[#392820]">{formatPrice(cartSubtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-medium">
                    <span>Privilege Discount ({appliedCoupon?.code})</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Shipping</span>
                  <span>
                    {cartSubtotal >= FREE_SHIPPING_THRESHOLD_RUPEES ? (
                      <strong className="text-emerald-700 font-bold uppercase text-[11px] tracking-wider">
                        FREE
                      </strong>
                    ) : (
                      <span className="text-[11px] text-[#A68A78] font-medium">
                        Calculated at checkout
                      </span>
                    )}
                  </span>
                </div>

                <div className="border-t border-[#E8D6C7] pt-2 flex justify-between text-sm font-semibold text-[#392820]">
                  <span>Estimated Total</span>
                  <span className="text-base font-bold text-[#392820]">
                    {formatPrice(Math.max(0, cartSubtotal - discountAmount))}
                  </span>
                </div>
                <p className="text-[10px] text-[#A68A78]">
                  Delivery fee calculated based on your delivery address at checkout
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href={user ? '/checkout' : '/login?redirect=/checkout'}
                  onClick={closeCart}
                  className="w-full py-3.5 rounded-full bg-[#392820] text-[#FAF7F2] text-center text-xs tracking-wider uppercase font-semibold hover:bg-[#111111] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/cart"
                    onClick={closeCart}
                    className="py-2.5 rounded-full border border-[#D9A08C] text-[#392820] text-center text-[11px] tracking-wider uppercase font-semibold hover:bg-[#FAF7F2] transition-colors"
                  >
                    View Bag Details
                  </Link>
                  <button
                    onClick={closeCart}
                    className="py-2.5 rounded-full border border-[#E8D6C7] text-[#735D50] hover:text-[#392820] text-center text-[11px] tracking-wider uppercase font-medium hover:bg-[#FAF7F2] transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>

              <div className="pt-1 text-center text-[10px] text-[#735D50] flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D9A08C]" />
                <span>256-bit Bank-grade Encryption &bull; Artisanal Quality Assured</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
