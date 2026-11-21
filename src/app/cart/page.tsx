'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Tag,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  X,
  Plus,
  Minus,
  ArrowLeft,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { WishlistCartSection } from '@/components/cart/WishlistCartSection';
import { formatPrice, getCartItemImage } from '@/lib/utils';
import { FREE_SHIPPING_THRESHOLD_RUPEES } from '@/lib/money';

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    shippingFee,
    freeShippingRemaining,
    discountAmount,
    totalAmount,
    appliedCoupon,
    applyCouponCode,
    removeCouponCode,
    cartCount,
    inventoryNotices,
    clearInventoryNotices,
    validateCartWithServer,
    isValidating,
  } = useCart();
  const { user } = useAuth();

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Validate cart inventory and prices against server on page load
  useEffect(() => {
    validateCartWithServer();
  }, [validateCartWithServer]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);

    if (!couponInput.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setCouponLoading(true);
    const res = await applyCouponCode(couponInput.trim());
    setCouponLoading(false);

    if (res.success) {
      setCouponSuccess(res.message || 'Coupon applied successfully!');
      setCouponInput('');
    } else {
      setCouponError(res.error || 'Failed to apply coupon.');
    }
  };

  const handleRemoveCoupon = () => {
    removeCouponCode();
    setCouponSuccess(null);
    setCouponError(null);
  };

  const freeShippingProgress = Math.min(100, (cartSubtotal / FREE_SHIPPING_THRESHOLD_RUPEES) * 100);

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12">
          <span className="text-xs uppercase tracking-[0.25em] text-[#D9A08C] font-semibold block mb-1">
            Boutique Cart
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#392820] font-medium mb-2">
            Your Shopping Bag
          </h1>
          <p className="text-xs sm:text-sm text-[#735D50]">
            Review your handcrafted artisanal selections ({cartCount} {cartCount === 1 ? 'item' : 'items'})
          </p>
        </div>

        {/* Inventory Notices */}
        {inventoryNotices.length > 0 && (
          <div className="max-w-4xl mx-auto mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-3 text-xs text-amber-900 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-950">Important Inventory Updates:</p>
                {inventoryNotices.map((notice, idx) => (
                  <p key={idx} className="text-amber-800 text-xs">
                    &bull; {notice}
                  </p>
                ))}
              </div>
            </div>
            <button
              onClick={clearInventoryNotices}
              className="text-amber-700 hover:text-amber-950 p-1"
              title="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {cart.length === 0 ? (
          /* Empty Bag State */
          <div className="bg-white rounded-3xl p-12 sm:p-16 text-center max-w-md mx-auto border border-[#E8D6C7] shadow-sm space-y-4">
            <div className="w-18 h-18 rounded-full bg-[#FAF7F2] flex items-center justify-center mx-auto text-[#D9A08C] border border-[#E8D6C7]">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-xl font-semibold text-[#392820]">
                Your bag is currently empty
              </h3>
              <p className="text-xs text-[#735D50] leading-relaxed max-w-xs mx-auto">
                Explore our festive curations, royal Chanderi kurtas, and luxury Co-ord sets.
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
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Left Items Column */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Free Shipping Meter */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8D6C7] shadow-xs">
                <div className="flex items-center justify-between text-xs mb-2 font-medium text-[#392820]">
                  <span className="flex items-center gap-1.5 font-semibold text-xs">
                    <Sparkles className="w-4 h-4 text-[#D9A08C]" />
                    {freeShippingRemaining === 0 ? (
                      <span className="text-emerald-800">
                        Congratulations! You unlocked FREE Pan-India Delivery!
                      </span>
                    ) : (
                      <span>
                        Add <strong className="text-[#392820] font-bold">{formatPrice(freeShippingRemaining)}</strong> more for <strong>FREE Pan-India Delivery</strong>
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-[#735D50]">Goal: ₹1,999</span>
                </div>
                <div className="w-full h-2 bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E8D6C7]/60">
                  <div
                    className="h-full bg-gradient-to-r from-[#D9A08C] to-[#392820] transition-all duration-500 rounded-full"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>

              {/* Items Card List */}
              {cart.map((item) => {
                const itemImg = getCartItemImage(item);
                const unitPrice = item.product.price;
                const lineTotal = unitPrice * item.quantity;
                const itemUrl = `/products/${item.product.slug}?color=${encodeURIComponent(item.selectedColor)}`;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E8D6C7] shadow-xs flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
                  >
                    <div className="flex gap-4 items-center">
                      <Link
                        href={itemUrl}
                        className="relative w-22 h-28 sm:w-24 sm:h-30 rounded-xl overflow-hidden bg-[#FAF7F2] shrink-0 border border-[#E8D6C7] block"
                      >
                        <Image
                          src={itemImg}
                          alt={`${item.product.name} - ${item.selectedColor}`}
                          fill
                          sizes="100px"
                          className="object-cover"
                        />
                      </Link>
                      <div className="space-y-1">
                        <span className="text-[10px] tracking-wider uppercase text-[#D9A08C] font-semibold">
                          {item.product.categoryLabel || 'Boutique Collection'}
                        </span>
                        <h3 className="font-serif text-sm sm:text-base font-semibold text-[#392820]">
                          <Link href={itemUrl} className="hover:text-[#D9A08C] transition-colors">
                            {item.product.name}
                          </Link>
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[#735D50]">
                          <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E8D6C7] font-semibold text-[#392820]">
                            Size: {item.selectedSize}
                          </span>
                          <span>&bull;</span>
                          <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E8D6C7] text-[#735D50]">
                            Color: {item.selectedColor}
                          </span>
                        </div>
                        <p className="text-xs text-[#735D50] pt-1">
                          Unit Price: <strong className="text-[#392820] font-semibold">{formatPrice(unitPrice)}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Quantity & Item Subtotal */}
                    <div className="flex items-center justify-between w-full sm:w-auto sm:gap-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                      <div className="flex items-center border border-[#E8D6C7] rounded-xl bg-[#FAF7F2] overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1.5 text-xs font-semibold hover:bg-[#E8D6C7] text-[#392820] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-[#392820] select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1.5 text-xs font-semibold hover:bg-[#E8D6C7] text-[#392820] transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-sm sm:text-base font-bold text-[#392820]">
                          {formatPrice(lineTotal)}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-xs text-[#735D50] hover:text-rose-600 transition-colors flex items-center gap-1 mt-1 justify-end"
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add product from wishlist feature - directly below the added products in the cart */}
              <WishlistCartSection />

              {/* Navigation CTA */}
              <div className="flex justify-between items-center pt-2">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#392820] hover:text-[#D9A08C] uppercase tracking-wider transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Continue Shopping</span>
                </Link>

                {isValidating && (
                  <span className="text-[11px] text-[#735D50] animate-pulse">
                    Validating live pricing &amp; inventory...
                  </span>
                )}
              </div>
            </div>

            {/* Right Summary Column */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Server-Validated Coupon Card */}
              <div className="bg-white rounded-2xl p-6 border border-[#E8D6C7] shadow-xs space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#392820] flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#D9A08C]" />
                  <span>Promo or Privilege Code</span>
                </h4>

                {appliedCoupon ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{appliedCoupon.code}</span>
                      </div>
                      <p className="text-[11px] text-emerald-700">
                        {appliedCoupon.message || `Saved ${formatPrice(appliedCoupon.discountAmount)}`}
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-xs font-semibold text-rose-600 hover:underline p-1"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="E.g. NILORA10"
                        className="flex-1 bg-[#FAF7F2] border border-[#E8D6C7] px-3.5 py-2.5 rounded-xl text-xs uppercase outline-none focus:border-[#D9A08C] text-[#392820]"
                      />
                      <button
                        type="submit"
                        disabled={couponLoading}
                        className="px-4 py-2.5 bg-[#392820] text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-[#111111] transition-colors disabled:opacity-50"
                      >
                        {couponLoading ? 'Checking...' : 'Apply'}
                      </button>
                    </div>

                    <div className="flex gap-1.5 pt-1 text-[11px] text-[#735D50]">
                      <span>Try:</span>
                      <button
                        type="button"
                        onClick={() => setCouponInput('NILORA10')}
                        className="text-[#D9A08C] font-semibold hover:underline"
                      >
                        NILORA10
                      </button>
                      <span>or</span>
                      <button
                        type="button"
                        onClick={() => setCouponInput('FESTIVE500')}
                        className="text-[#D9A08C] font-semibold hover:underline"
                      >
                        FESTIVE500
                      </button>
                    </div>
                  </form>
                )}

                {couponError && (
                  <p className="text-xs text-rose-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{couponError}</span>
                  </p>
                )}

                {couponSuccess && !appliedCoupon && (
                  <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{couponSuccess}</span>
                  </p>
                )}
              </div>

              {/* Order Total & Checkout */}
              <div className="bg-white rounded-2xl p-6 border border-[#E8D6C7] shadow-xs space-y-4">
                <h4 className="font-serif text-lg font-semibold text-[#392820] pb-3 border-b border-[#FAF7F2]">
                  Order Summary
                </h4>

                <div className="space-y-2.5 text-xs text-[#735D50]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
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

                  <div className="pt-3 border-t border-[#FAF7F2] flex justify-between text-base font-bold text-[#392820]">
                    <span>Estimated Total</span>
                    <span className="font-serif text-xl">
                      {formatPrice(Math.max(0, cartSubtotal - discountAmount))}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#735D50]/80">
                    Delivery fee calculated based on your delivery address at checkout
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <Link
                    href={user ? "/checkout" : "/login?redirect=/checkout"}
                    className="w-full py-3.5 rounded-full bg-[#392820] text-[#FAF7F2] text-center text-xs tracking-wider uppercase font-semibold hover:bg-[#111111] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/products"
                    className="w-full py-2.5 rounded-full border border-[#E8D6C7] text-[#735D50] hover:text-[#392820] text-center text-xs tracking-wider uppercase font-medium hover:bg-[#FAF7F2] transition-colors block"
                  >
                    Continue Shopping
                  </Link>
                </div>

                <div className="pt-2 text-center text-[10px] text-[#735D50] flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#D9A08C]" />
                  <span>256-bit Encrypted Checkout &bull; Easy 7-Day Exchange</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
