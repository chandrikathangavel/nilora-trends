'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Product, ProductSize, CartItem } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  toPaise,
  toRupees,
  calculateSubtotalPaise,
  calculateShippingFeePaise,
  calculateFreeShippingRemainingRupees,
} from '@/lib/money';
import {
  fetchUserCartFromDb,
  saveUserCartToDb,
  mergeCartItems,
} from '@/lib/cart-db';

export interface AppliedCoupon {
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  discountAmount: number;
  message: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    product: Product,
    size: ProductSize,
    color: string,
    quantity?: number
  ) => { success: boolean; error?: string };
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantityOrUpdater: number | ((prevQty: number) => number)) => void;
  clearCart: () => void;
  syncGuestCart: (userCartItems?: CartItem[]) => void;
  validateCartWithServer: () => Promise<void>;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  shippingFee: number;
  freeShippingRemaining: number;
  discountAmount: number;
  totalAmount: number;
  appliedCoupon: AppliedCoupon | null;
  applyCouponCode: (code: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  removeCouponCode: () => void;
  inventoryNotices: string[];
  clearInventoryNotices: () => void;
  isValidating: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_STORAGE_KEY = 'nilora_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [inventoryNotices, setInventoryNotices] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const prevUserIdRef = useRef<string | undefined>(undefined);
  const isInitializedRef = useRef<boolean>(false);
  const cartRef = useRef<CartItem[]>(cart);
  const isValidatingRef = useRef<boolean>(false);

  // Keep cartRef synchronized with latest cart state
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // Initial load from localStorage on client mount
  useEffect(() => {
    try {
      let cachedUserId: string | null = null;
      try {
        const storedUser = localStorage.getItem('nilora_current_user');
        if (storedUser) {
          cachedUserId = JSON.parse(storedUser)?.id || null;
        }
      } catch {}

      if (cachedUserId) {
        const storedUserCart = localStorage.getItem(`nilora_cart_${cachedUserId}`);
        if (storedUserCart) {
          const parsed = JSON.parse(storedUserCart);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCart(parsed);
          }
        }
      } else {
        const stored = localStorage.getItem(GUEST_CART_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCart(parsed);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load initial cart from localStorage:', e);
    }
    isInitializedRef.current = true;
  }, []);

  // Synchronize cart when user signs in or signs out
  useEffect(() => {
    const handleAuthChange = async () => {
      if (userId && userId !== prevUserIdRef.current) {
        prevUserIdRef.current = userId;

        // Patron just signed in: fetch their persistent DB cart
        const dbItems = await fetchUserCartFromDb(userId);

        // Read ACTUAL unauthenticated guest cart from storage (not the in-memory cart)
        let guestItems: CartItem[] = [];
        try {
          const rawGuest = localStorage.getItem(GUEST_CART_STORAGE_KEY);
          if (rawGuest) {
            guestItems = JSON.parse(rawGuest) || [];
          }
        } catch {}

        if (guestItems.length > 0) {
          // Merge guest cart with user DB cart
          const merged = mergeCartItems(dbItems, guestItems);
          setCart(merged);
          await saveUserCartToDb(userId, merged);
          try {
            localStorage.removeItem(GUEST_CART_STORAGE_KEY);
          } catch {}
        } else if (dbItems.length > 0) {
          setCart(dbItems);
        }
      } else if (!userId && prevUserIdRef.current) {
        // Patron signed out: load guest cart
        prevUserIdRef.current = undefined;
        try {
          const stored = localStorage.getItem(GUEST_CART_STORAGE_KEY);
          setCart(stored ? JSON.parse(stored) : []);
        } catch {
          setCart([]);
        }
        setAppliedCoupon(null);
      }
    };

    handleAuthChange();
  }, [userId]);

  // Persist cart to localStorage & Supabase DB when cart state changes
  useEffect(() => {
    if (typeof window === 'undefined' || !isInitializedRef.current) return;

    if (userId) {
      try {
        localStorage.setItem(`nilora_cart_${userId}`, JSON.stringify(cart));
      } catch {}

      // Debounce remote DB sync so rapid clicks don't flood or cause race conditions
      const timer = setTimeout(() => {
        saveUserCartToDb(userId, cart);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      try {
        localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(cart));
      } catch (e) {
        console.error('Failed to persist guest cart:', e);
      }
    }
  }, [cart, userId]);

  // Server-side Cart & Inventory Validation
  const validateCartWithServer = useCallback(async () => {
    const currentCart = cartRef.current;
    if (currentCart.length === 0 || isValidatingRef.current) return;

    isValidatingRef.current = true;
    setIsValidating(true);
    try {
      const payload = {
        items: currentCart.map((item) => ({
          id: item.id,
          productId: item.product.id,
          size: item.selectedSize,
          color: item.selectedColor,
          quantity: item.quantity,
        })),
      };

      const res = await fetch('/api/cart/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return;

      const data = await res.json();

      if (data.valid && Array.isArray(data.items)) {
        // Update items with server-verified prices & availability without overriding user's latest in-flight quantity
        setCart((prev) => {
          let hasChanges = false;
          const updated = prev.map((curr) => {
            const verified = data.items.find((v: any) => v.id === curr.id);
            if (!verified) return curr;

            // Only reduce quantity if server inventory strictly cannot fulfill it
            let safeQuantity = curr.quantity;
            if (verified.maxStock !== undefined && verified.maxStock > 0 && curr.quantity > verified.maxStock) {
              safeQuantity = verified.maxStock;
            }

            const priceChanged = curr.product.price !== verified.unitPrice;
            const stockChanged = curr.product.inStock !== verified.inStock;
            const qtyChanged = curr.quantity !== safeQuantity;

            if (priceChanged || stockChanged || qtyChanged) {
              hasChanges = true;
              return {
                ...curr,
                quantity: safeQuantity,
                product: {
                  ...curr.product,
                  price: verified.unitPrice,
                  inStock: verified.inStock,
                },
              };
            }

            return curr;
          });

          return hasChanges ? updated : prev;
        });

        if (data.notices && data.notices.length > 0) {
          setInventoryNotices(data.notices);
        }
      }
    } catch (err) {
      console.warn('Cart server validation warning:', err);
    } finally {
      isValidatingRef.current = false;
      setIsValidating(false);
    }
  }, []);

  // Re-validate coupon if cart total changes
  useEffect(() => {
    if (!appliedCoupon) return;

    const itemsForPrice = cart.map((item) => ({
      price: item.product.price,
      quantity: item.quantity,
    }));
    const subtotalPaise = calculateSubtotalPaise(itemsForPrice);
    const subtotalRupees = toRupees(subtotalPaise);

    // Recheck coupon on server
    fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ couponCode: appliedCoupon.code, subtotal: subtotalRupees }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setAppliedCoupon({
            code: data.couponCode,
            discountType: data.discountType,
            discountValue: data.discountValue,
            discountAmount: data.discountAmount,
            message: data.message,
          });
        } else {
          // Condition no longer met (e.g. removed an item and subtotal dropped below minOrder)
          setAppliedCoupon(null);
          setInventoryNotices((prev) => [
            ...prev,
            data.error || `Coupon "${appliedCoupon.code}" was removed because minimum order requirement is no longer met.`,
          ]);
        }
      })
      .catch(() => {});
  }, [cart.length, cart.reduce((acc, i) => acc + i.quantity, 0)]);

  // Add to cart with strict validation
  const addToCart = (
    product: Product,
    selectedSize: ProductSize,
    selectedColor: string,
    quantity = 1
  ): { success: boolean; error?: string } => {
    const chosenColor = selectedColor || product.colors?.[0]?.name || 'Standard';
    const chosenSize = selectedSize || 'Free Size';

    // 1. Require size selection when product has size choices (check color-specific sizes if defined)
    const matchingColorObj = product.colors?.find(
      (c) => c.name.toLowerCase() === chosenColor.toLowerCase()
    );
    const effectiveSizes =
      matchingColorObj?.sizes && matchingColorObj.sizes.length > 0
        ? matchingColorObj.sizes
        : product.sizes;

    if (effectiveSizes && effectiveSizes.length > 0) {
      if (!selectedSize || typeof selectedSize !== 'string' || selectedSize.trim() === '') {
        return { success: false, error: 'Please choose your desired size before adding to bag.' };
      }

      // Check if size is in stock for this color
      const sizeObj = effectiveSizes.find(
        (s) => s.size.toLowerCase() === selectedSize.toLowerCase()
      );

      if (sizeObj && (!sizeObj.inStock || sizeObj.stockCount <= 0)) {
        return { success: false, error: `Size ${selectedSize} in ${chosenColor} is currently sold out.` };
      }
    }

    // 2. Prevent adding if product overall is marked out of stock
    if (product.inStock === false) {
      return { success: false, error: 'This boutique piece is currently out of stock.' };
    }

    // 3. Prevent zero or negative quantity
    const safeQty = Math.max(1, Math.floor(quantity || 1));
    const itemKey = `${product.id}-${chosenSize}-${chosenColor}`;

    const chosenColorImg =
      matchingColorObj?.image ||
      product.images?.find((img) =>
        img.toLowerCase().includes(chosenColor.toLowerCase().replace(/\s+/g, '-'))
      ) ||
      product.images?.[0] ||
      '/nilora-logo-transparent.png';

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === itemKey);
      if (existingIndex !== -1) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + safeQty, selectedColorImage: chosenColorImg }
            : item
        );
      }
      return [
        ...prev,
        {
          id: itemKey,
          product,
          selectedSize: chosenSize,
          selectedColor: chosenColor,
          selectedColorImage: chosenColorImg,
          quantity: safeQty,
        },
      ];
    });

    // Auto open drawer to confirm addition
    setIsCartOpen(true);
    return { success: true };
  };

  // Remove item
  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Update quantity (supports functional updaters to prevent stale closures and sequential click glitches)
  const updateQuantity = (
    itemId: string,
    quantityOrUpdater: number | ((prevQty: number) => number)
  ) => {
    setCart((prev) => {
      const targetItem = prev.find((item) => item.id === itemId);
      if (!targetItem) return prev;

      const targetQty =
        typeof quantityOrUpdater === 'function'
          ? quantityOrUpdater(targetItem.quantity)
          : quantityOrUpdater;

      if (targetQty <= 0) {
        return prev.filter((item) => item.id !== itemId);
      }

      const safeQty = Math.floor(targetQty);
      const sizeInfo = targetItem.product.sizes?.find((s) => s.size === targetItem.selectedSize);
      const maxStock = sizeInfo?.stockCount || 50;
      const cappedQty = Math.min(maxStock, safeQty);

      return prev.map((item) =>
        item.id === itemId ? { ...item, quantity: cappedQty } : item
      );
    });
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setInventoryNotices([]);
  };

  const syncGuestCart = (userCartItems?: CartItem[]) => {
    if (!userCartItems || userCartItems.length === 0) return;
    setCart((prev) => mergeCartItems(prev, userCartItems));
  };

  // Server Coupon Validation
  const applyCouponCode = async (
    code: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    if (!code || !code.trim()) {
      return { success: false, error: 'Please enter a coupon code.' };
    }

    try {
      const subtotalPaise = calculateSubtotalPaise(
        cart.map((item) => ({ price: item.product.price, quantity: item.quantity }))
      );
      const subtotalRupees = toRupees(subtotalPaise);

      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: code.trim(), subtotal: subtotalRupees }),
      });

      const data = await res.json();

      if (data.valid) {
        setAppliedCoupon({
          code: data.couponCode,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountAmount: data.discountAmount,
          message: data.message,
        });
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || 'Invalid coupon code.' };
      }
    } catch {
      return { success: false, error: 'Unable to validate coupon code at this time.' };
    }
  };

  const removeCouponCode = () => {
    setAppliedCoupon(null);
  };

  const clearInventoryNotices = () => {
    setInventoryNotices([]);
  };

  const openCart = () => {
    setIsCartOpen(true);
    // Auto-validate inventory when opening drawer
    validateCartWithServer();
  };

  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  // Decimal-safe totals using integer paise
  const itemsForCalculation = cart.map((item) => ({
    price: item.product.price,
    quantity: item.quantity,
  }));
  const subtotalPaise = calculateSubtotalPaise(itemsForCalculation);
  const cartSubtotal = toRupees(subtotalPaise);

  const shippingFeePaise = calculateShippingFeePaise(subtotalPaise);
  const shippingFee = toRupees(shippingFeePaise);

  const freeShippingRemaining = calculateFreeShippingRemainingRupees(subtotalPaise);

  const discountPaise = appliedCoupon ? toPaise(appliedCoupon.discountAmount) : 0;
  const discountAmount = toRupees(discountPaise);

  const totalPaise = Math.max(0, subtotalPaise - discountPaise + shippingFeePaise);
  const totalAmount = toRupees(totalPaise);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        syncGuestCart,
        validateCartWithServer,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        cartCount,
        cartSubtotal,
        shippingFee,
        freeShippingRemaining,
        discountAmount,
        totalAmount,
        appliedCoupon,
        applyCouponCode,
        removeCouponCode,
        inventoryNotices,
        clearInventoryNotices,
        isValidating,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
