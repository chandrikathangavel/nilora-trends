'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product, ProductSize } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import {
  fetchUserWishlistFromDb,
  toggleDbWishlistItem,
  saveUserWishlistToDb,
} from '@/lib/wishlist-db';

interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  removeFromWishlist: (productId: string) => void;
  moveWishlistItemToCart: (
    product: Product,
    size: ProductSize,
    color: string,
    quantity?: number
  ) => { success: boolean; error?: string };
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const GUEST_WISHLIST_KEY = 'nilora_wishlist';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const userId = user?.id;

  const [wishlist, setWishlist] = useState<Product[]>([]);
  const prevUserIdRef = useRef<string | undefined>(undefined);
  const isInitializedRef = useRef<boolean>(false);

  // Initial load from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(GUEST_WISHLIST_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWishlist(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load guest wishlist from localStorage:', e);
    }
    isInitializedRef.current = true;
  }, []);

  // Sync with Supabase on login / logout
  useEffect(() => {
    const handleAuthChange = async () => {
      if (userId && userId !== prevUserIdRef.current) {
        prevUserIdRef.current = userId;

        // Patron signed in: fetch DB wishlist and merge guest wishlist
        const guestItems = [...wishlist];
        const dbItems = await fetchUserWishlistFromDb(userId);

        // Merge without duplicates
        const combined = [...dbItems];
        for (const g of guestItems) {
          if (!combined.some((item) => item.id === g.id)) {
            combined.push(g);
          }
        }

        setWishlist(combined);
        await saveUserWishlistToDb(userId, combined);

        try {
          localStorage.removeItem(GUEST_WISHLIST_KEY);
        } catch {}
      } else if (!userId && prevUserIdRef.current) {
        // Patron signed out
        prevUserIdRef.current = undefined;
        try {
          const stored = localStorage.getItem(GUEST_WISHLIST_KEY);
          setWishlist(stored ? JSON.parse(stored) : []);
        } catch {
          setWishlist([]);
        }
      }
    };

    handleAuthChange();
  }, [userId]);

  // Persist guest wishlist to localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !isInitializedRef.current) return;

    if (userId) {
      // User cache
      try {
        localStorage.setItem(`nilora_wishlist_${userId}`, JSON.stringify(wishlist));
      } catch {}
    } else {
      // Guest cache
      try {
        localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlist));
      } catch (e) {
        console.error('Failed to save wishlist', e);
      }
    }
  }, [wishlist, userId]);

  const toggleWishlist = (product: Product) => {
    const exists = wishlist.some((p) => p.id === product.id);

    if (exists) {
      setWishlist((prev) => prev.filter((p) => p.id !== product.id));
      if (userId) {
        toggleDbWishlistItem(userId, product.id, false);
      }
    } else {
      setWishlist((prev) => [...prev, product]);
      if (userId) {
        toggleDbWishlistItem(userId, product.id, true);
      }
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((p) => p.id === productId);
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((p) => p.id !== productId));
    if (userId) {
      toggleDbWishlistItem(userId, productId, false);
    }
  };

  // Move item from wishlist to cart after variant selection
  const moveWishlistItemToCart = (
    product: Product,
    size: ProductSize,
    color: string,
    quantity = 1
  ): { success: boolean; error?: string } => {
    const res = addToCart(product, size, color, quantity);
    if (res.success) {
      removeFromWishlist(product.id);
    }
    return res;
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isInWishlist,
        removeFromWishlist,
        moveWishlistItemToCart,
        wishlistCount: wishlist.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
