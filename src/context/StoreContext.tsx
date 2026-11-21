'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, FestivalOffer, StoreCoupon, StoreSettings, ProductCategory, CustomerInquiry, SearchPriceRangeTier } from '@/types';
import { DEMO_PRODUCTS } from '@/data/demoProducts';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getLiveProducts, getColorHexFallback, isDefaultFeatureText } from '@/lib/api/products';

export const healProductColors = (prod: Product): Product => {
  const healedFeatures = (prod.features || []).filter((f) => !isDefaultFeatureText(f));
  if (!prod.colors || prod.colors.length === 0) {
    return {
      ...prod,
      features: healedFeatures,
    };
  }
  const healedColors = prod.colors.map((col) => {
    const isPaleWhiteDefault = col.hex === '#E8D6C7' || !col.hex;
    const isActuallyBeige = /beige|champagne|cream|sand|wheat/i.test(col.name);
    if (isPaleWhiteDefault && !isActuallyBeige) {
      return {
        ...col,
        hex: getColorHexFallback(col.name),
      };
    }
    return col;
  });
  return {
    ...prod,
    colors: healedColors,
    features: healedFeatures,
  };
};

interface StoreContextType {
  products: Product[];
  isLoading: boolean;
  isLiveDb: boolean;
  error: string | null;
  refetchCatalog: () => Promise<void>;
  festivalOffers: FestivalOffer[];
  activeFestivalOffer: FestivalOffer | null;
  coupons: StoreCoupon[];
  storeSettings: StoreSettings;
  inquiries: CustomerInquiry[];
  unreadInquiriesCount: number;
  sendCustomerInquiry: (data: { name: string; phone: string; email: string; message: string }) => void;
  markInquiryAsRead: (id: string) => void;
  markAllInquiriesAsRead: () => void;
  deleteInquiry: (id: string) => void;
  clearAllInquiries: () => void;
  // Product management
  addProduct: (productData: Partial<Product>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  quickUpdatePrice: (id: string, newPrice: number, newOriginalPrice?: number) => void;
  quickUpdateStock: (id: string, inStock: boolean) => void;
  toggleProductNewArrival: (id: string) => void;
  resetCatalog: () => void;
  // Offers & Festival management
  postFestivalOffer: (offerData: Omit<FestivalOffer, 'id'>) => void;
  deleteFestivalOffer: (id: string) => void;
  toggleFestivalOffer: (id: string) => void;
  // Coupons management
  addCoupon: (coupon: StoreCoupon) => void;
  deleteCoupon: (code: string) => void;
  toggleCoupon: (code: string) => void;
  applyCoupon: (code: string, subtotal: number) => { valid: boolean; discountAmount: number; message: string };
  // Settings
  updateStoreSettings: (updates: Partial<StoreSettings>) => void;
  updateSearchPriceRanges: (ranges: SearchPriceRangeTier[]) => void;
  resetAllStoreData: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const DEFAULT_SEARCH_PRICE_RANGES: SearchPriceRangeTier[] = [
  { key: '199-399', label: '₹199 – ₹399', min: 199, max: 399 },
  { key: '399-799', label: '₹399 – ₹799', min: 399, max: 799 },
  { key: 'above-799', label: '₹799 & Above', min: 799, max: 999999 },
];

const DEFAULT_COUPONS: StoreCoupon[] = [
  { code: 'NILORA10', discount: '10% Off', discountValue: 10, discountType: 'percent', minOrderValue: 999, usageCount: 0, status: 'Active' },
  { code: 'FESTIVE500', discount: '₹500 Off', discountValue: 500, discountType: 'flat', minOrderValue: 2499, usageCount: 0, status: 'Active' },
  { code: 'WELCOMEVIP', discount: '15% Off', discountValue: 15, discountType: 'percent', minOrderValue: 1499, usageCount: 0, status: 'Active' },
];

const DEFAULT_FESTIVAL_OFFERS: FestivalOffer[] = [
  {
    id: 'festive-diwali-2026',
    title: 'Festive Boutique Edit',
    subtitle: 'Handcrafted Chanderi Kurtas, Tissue Silk Sarees & Designer Co-ords with Royal Zari details.',
    badge: '',
    couponCode: 'FESTIVE500',
    discountPercentage: 20,
    targetCategory: 'all',
    isActive: true,
  },
];

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'NILORA TRENDS',
  announcementMessages: [
    '✨ Handcrafted Luxury: Pure Fabrics & Artisanal Indian Craftsmanship',
    '✨ Authentic Handcrafted Luxury: Made with Pure Certified Fabrics',
    '🪷 Festive Edit 2026: Use code FESTIVE500 for ₹500 off on your royal attire',
    '⚡ Express Pan-India Delivery across 28,000+ Pincodes',
  ],
  freeShippingThreshold: 1999,
  supportPhone: '+91 9597186404',
  supportEmail: 'niloratrends@gmail.com',
  festivalMode: true,
  searchPriceRanges: DEFAULT_SEARCH_PRICE_RANGES,
};

const DEFAULT_INQUIRIES: CustomerInquiry[] = [];

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [festivalOffers, setFestivalOffers] = useState<FestivalOffer[]>(DEFAULT_FESTIVAL_OFFERS);
  const [coupons, setCoupons] = useState<StoreCoupon[]>(DEFAULT_COUPONS);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>(DEFAULT_INQUIRIES);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetchCatalog = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsLiveDb(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { products: liveProds, isLive, error: liveErr } = await getLiveProducts();
      if (isLive && liveProds.length > 0) {
        // Clean deletedList: Any product actively present in Supabase must NEVER be suppressed!
        const liveIds = new Set(liveProds.map((p) => p.id));
        const liveSlugs = new Set(liveProds.map((p) => p.slug));
        const liveNames = new Set(liveProds.map((p) => p.name.toLowerCase().trim()));

        let deletedList: string[] = [];
        try {
          const rawDel = localStorage.getItem('nilora_deleted_product_ids');
          if (rawDel) {
            const parsedDel: string[] = JSON.parse(rawDel);
            deletedList = parsedDel.filter(
              (item) => !liveIds.has(item) && !liveSlugs.has(item) && !liveNames.has(item.toLowerCase().trim())
            );
            localStorage.setItem('nilora_deleted_product_ids', JSON.stringify(deletedList));
          }
        } catch {}

        // Retrieve current locally saved products to merge any newly created local drafts
        let locallySavedProds: Product[] = [];
        try {
          const raw = localStorage.getItem('nilora_store_products');
          if (raw) locallySavedProds = JSON.parse(raw);
        } catch {}

        const unsyncedLocal = locallySavedProds.filter(
          (lp) =>
            lp.id.startsWith('prod-') &&
            !liveIds.has(lp.id) &&
            !liveSlugs.has(lp.slug) &&
            !liveNames.has(lp.name.toLowerCase().trim()) &&
            !deletedList.includes(lp.id)
        );

        // All live products from Supabase + any pending local drafts
        const combined = [...liveProds, ...unsyncedLocal];
        const healedCombined = combined.map(healProductColors);
        setProducts(healedCombined);
        setIsLiveDb(true);
        try {
          localStorage.setItem('nilora_store_products', JSON.stringify(healedCombined));
          localStorage.setItem('nilora_catalog_version', 'v7');
        } catch {}
      } else {
        setIsLiveDb(false);
        if (liveErr) setError(liveErr);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setIsLiveDb(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync with Supabase on mount if configured
  useEffect(() => {
    if (isSupabaseConfigured) {
      refetchCatalog();
    }
  }, [refetchCatalog]);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const storedProds = localStorage.getItem('nilora_store_products');
      if (storedProds) {
        const parsed = JSON.parse(storedProds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const healed = parsed.map(healProductColors);
          setProducts(healed);
        } else {
          setProducts(DEMO_PRODUCTS.map(healProductColors));
        }
      } else {
        setProducts(DEMO_PRODUCTS.map(healProductColors));
      }

      const storedOffers = localStorage.getItem('nilora_festival_offers');
      if (storedOffers) {
        setFestivalOffers(JSON.parse(storedOffers));
      }

      const storedCoupons = localStorage.getItem('nilora_coupons');
      if (storedCoupons) {
        setCoupons(JSON.parse(storedCoupons));
      }

      const storedSettings = localStorage.getItem('nilora_store_settings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        const cleanAnnouncements = Array.isArray(parsedSettings.announcementMessages)
          ? parsedSettings.announcementMessages.filter(
              (msg: string) => !/gift|packaging/i.test(msg)
            )
          : DEFAULT_SETTINGS.announcementMessages;

        setStoreSettings({
          ...DEFAULT_SETTINGS,
          ...parsedSettings,
          announcementMessages:
            cleanAnnouncements.length > 0 ? cleanAnnouncements : DEFAULT_SETTINGS.announcementMessages,
          searchPriceRanges: parsedSettings.searchPriceRanges || DEFAULT_SEARCH_PRICE_RANGES,
        });
      }

      const storedInquiries = localStorage.getItem('nilora_customer_inquiries');
      if (storedInquiries) {
        try {
          const parsed = JSON.parse(storedInquiries);
          // Purge demo inquiries (Priya Sundaram, Kavitha R)
          const cleanInquiries: CustomerInquiry[] = Array.isArray(parsed)
            ? parsed.filter(
                (inq: any) =>
                  inq.name !== 'Priya Sundaram' &&
                  inq.name !== 'Kavitha R' &&
                  !String(inq.id || '').includes('inq-1') &&
                  !String(inq.id || '').includes('inq-2')
              )
            : [];
          setInquiries(cleanInquiries);
          localStorage.setItem('nilora_customer_inquiries', JSON.stringify(cleanInquiries));
        } catch {
          setInquiries([]);
          localStorage.setItem('nilora_customer_inquiries', JSON.stringify([]));
        }
      } else {
        setInquiries([]);
      }
    } catch (e) {
      console.error('Failed to load store data from localStorage', e);
    }
  }, []);

  // Listen to cross-tab storage updates
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'nilora_customer_inquiries' && e.newValue) {
        try {
          setInquiries(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === 'nilora_store_products' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setProducts(parsed.map(healProductColors));
          }
        } catch {}
      }
      if (e.key === 'nilora_festival_offers' && e.newValue) {
        try {
          setFestivalOffers(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === 'nilora_coupons' && e.newValue) {
        try {
          setCoupons(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === 'nilora_store_settings' && e.newValue) {
        try {
          setStoreSettings(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Sync to localStorage
  const saveInquiries = (newInquiries: CustomerInquiry[]) => {
    setInquiries(newInquiries);
    try {
      localStorage.setItem('nilora_customer_inquiries', JSON.stringify(newInquiries));
    } catch (e) {
      console.error(e);
    }
  };

  const sendCustomerInquiry = (data: { name: string; phone: string; email: string; message: string }) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const newInquiry: CustomerInquiry = {
      id: `inq-${Date.now()}`,
      name: data.name,
      phone: data.phone,
      email: data.email,
      message: data.message,
      createdAt: `Today, ${timeStr}`,
      read: false,
    };
    const updated = [newInquiry, ...inquiries];
    saveInquiries(updated);
  };

  const markInquiryAsRead = (id: string) => {
    const updated = inquiries.map((inq) => (inq.id === id ? { ...inq, read: true } : inq));
    saveInquiries(updated);
  };

  const markAllInquiriesAsRead = () => {
    const updated = inquiries.map((inq) => ({ ...inq, read: true }));
    saveInquiries(updated);
  };

  const deleteInquiry = (id: string) => {
    const updated = inquiries.filter((inq) => inq.id !== id);
    saveInquiries(updated);
  };

  const clearAllInquiries = () => {
    saveInquiries([]);
  };

  const unreadInquiriesCount = inquiries.filter((inq) => !inq.read).length;

  // Sync to localStorage
  const saveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    try {
      localStorage.setItem('nilora_store_products', JSON.stringify(newProducts));
      localStorage.setItem('nilora_catalog_version', 'v6');
    } catch (e) {
      console.error('Failed to save products to localStorage', e);
    }
  };

  const saveOffers = (newOffers: FestivalOffer[]) => {
    setFestivalOffers(newOffers);
    localStorage.setItem('nilora_festival_offers', JSON.stringify(newOffers));
  };

  const saveCoupons = (newCoupons: StoreCoupon[]) => {
    setCoupons(newCoupons);
    localStorage.setItem('nilora_coupons', JSON.stringify(newCoupons));
  };

  const saveSettings = (newSettings: StoreSettings) => {
    setStoreSettings(newSettings);
    localStorage.setItem('nilora_store_settings', JSON.stringify(newSettings));
  };

  // Product CRUD
  const addProduct = (data: Partial<Product>): Product => {
    const category = (data.category || 'co-ord-sets') as ProductCategory;
    const catLabels: Record<ProductCategory, string> = {
      'co-ord-sets': 'Co-ord Set',
      'kurtas': 'Designer Kurta',
      'sarees': 'Handcrafted Saree',
    };

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      slug: data.slug || `${(data.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`,
      name: data.name || 'New Nilora Attire',
      subtitle: data.subtitle || 'Handcrafted Luxury Collection',
      category: category,
      categoryLabel: catLabels[category],
      occasion: data.occasion || 'Ethnic & Festive',
      price: Number(data.price) || 2999,
      originalPrice: Number(data.originalPrice) || Number(data.price) * 1.25 || 3799,
      fabric: data.fabric || 'Pure Chanderi Silk & Mulmul Cotton',
      description: data.description || 'Artisan-crafted ensemble designed with precision tailoring, slow-fashion craftsmanship, and signature Nilora silhouette.',
      features: data.features && data.features.length > 0 ? data.features.filter((f) => !isDefaultFeatureText(f)) : [],
      careInstructions: data.careInstructions && data.careInstructions.length > 0 ? data.careInstructions : ['Dry clean recommended', 'Steam iron only'],
      images: data.images && data.images.length > 0 ? data.images : [
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
      ],
      sizes: data.sizes && data.sizes.length > 0 ? data.sizes : [
        { size: 'XS', inStock: true, stockCount: 5 },
        { size: 'S', inStock: true, stockCount: 12 },
        { size: 'M', inStock: true, stockCount: 15 },
        { size: 'L', inStock: true, stockCount: 8 },
        { size: 'XL', inStock: true, stockCount: 4 },
      ],
      colors: data.colors && data.colors.length > 0 ? data.colors : [
        { name: 'Royal Ivory', hex: '#F8F5F0' },
        { name: 'Rose Gold', hex: '#D9A08C' },
      ],
      isNewArrival: data.isNewArrival ?? true,
      isBestSeller: data.isBestSeller ?? false,
      isFeatured: data.isFeatured ?? true,
      rating: 5.0,
      reviewCount: 0,
      sku: `NT-${category.toUpperCase().slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`,
      inStock: data.inStock ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: Date.now(),
    };

    // Clear any deleted list entries that match this new product
    try {
      const rawDel = localStorage.getItem('nilora_deleted_product_ids');
      if (rawDel) {
        const delList: string[] = JSON.parse(rawDel);
        const cleaned = delList.filter(
          (d) => d !== newProduct.id && d !== newProduct.slug && d.toLowerCase() !== newProduct.name.toLowerCase().trim()
        );
        localStorage.setItem('nilora_deleted_product_ids', JSON.stringify(cleaned));
      }
    } catch {}

    const updated = [newProduct, ...products];
    saveProducts(updated);

    // Sync to Supabase live database
    fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: newProduct }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.productId && data.productId !== newProduct.id) {
          setProducts((prev) =>
            prev.map((p) => (p.id === newProduct.id ? { ...p, id: data.productId } : p))
          );
          try {
            const raw = localStorage.getItem('nilora_store_products');
            if (raw) {
              const parsed: Product[] = JSON.parse(raw);
              const up = parsed.map((p) => (p.id === newProduct.id ? { ...p, id: data.productId } : p));
              localStorage.setItem('nilora_store_products', JSON.stringify(up));
            }
          } catch {}
        }
      })
      .catch((err) => console.warn('Failed to sync new product to DB:', err));

    return newProduct;
  };

  const syncProductToDb = (product: Product) => {
    fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.productId && data.productId !== product.id) {
          setProducts((prev) =>
            prev.map((p) => (p.id === product.id ? { ...p, id: data.productId } : p))
          );
          try {
            const raw = localStorage.getItem('nilora_store_products');
            if (raw) {
              const parsed: Product[] = JSON.parse(raw);
              const up = parsed.map((p) => (p.id === product.id ? { ...p, id: data.productId } : p));
              localStorage.setItem('nilora_store_products', JSON.stringify(up));
            }
          } catch {}
        }
      })
      .catch((err) => console.warn('Failed to sync product updates to DB:', err));
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        return { ...p, ...updates, updatedAt: Date.now() };
      }
      return p;
    });
    saveProducts(updated);

    const changed = updated.find((p) => p.id === id);
    if (changed) {
      syncProductToDb(changed);
    }
  };

  const deleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    const updated = products.filter((p) => p.id !== id);
    saveProducts(updated);

    // Track permanently deleted product
    try {
      const rawDel = localStorage.getItem('nilora_deleted_product_ids');
      const deletedList: string[] = rawDel ? JSON.parse(rawDel) : [];
      if (id && !deletedList.includes(id)) deletedList.push(id);
      if (target?.slug && !deletedList.includes(target.slug)) deletedList.push(target.slug);
      localStorage.setItem('nilora_deleted_product_ids', JSON.stringify(deletedList));
    } catch {}

    const deleteUrl = `/api/admin/products?id=${encodeURIComponent(id)}${target?.slug ? `&slug=${encodeURIComponent(target.slug)}` : ''}`;
    fetch(deleteUrl, {
      method: 'DELETE',
    }).catch((err) => console.warn('Failed to delete product from DB:', err));
  };

  const quickUpdatePrice = (id: string, newPrice: number, newOriginalPrice?: number) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        const orig = newOriginalPrice !== undefined ? newOriginalPrice : Math.max(p.originalPrice, newPrice);
        const discount = orig > newPrice ? Math.round(((orig - newPrice) / orig) * 100) : 0;
        return {
          ...p,
          price: newPrice,
          originalPrice: orig,
          discountPercent: discount,
          updatedAt: Date.now(),
        };
      }
      return p;
    });
    saveProducts(updated);

    const changed = updated.find((p) => p.id === id);
    if (changed) {
      syncProductToDb(changed);
    }
  };

  const quickUpdateStock = (id: string, inStock: boolean) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        return { ...p, inStock, updatedAt: Date.now() };
      }
      return p;
    });
    saveProducts(updated);

    const changed = updated.find((p) => p.id === id);
    if (changed) {
      syncProductToDb(changed);
    }
  };

  const toggleProductNewArrival = (id: string) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        return { ...p, isNewArrival: !p.isNewArrival, updatedAt: Date.now() };
      }
      return p;
    });
    saveProducts(updated);

    const changed = updated.find((p) => p.id === id);
    if (changed) {
      syncProductToDb(changed);
    }
  };

  const updateSearchPriceRanges = (ranges: SearchPriceRangeTier[]) => {
    updateStoreSettings({ searchPriceRanges: ranges });
  };

  const resetCatalog = () => {
    saveProducts(DEMO_PRODUCTS);
  };

  // Festival Offers CRUD
  const postFestivalOffer = (offerData: Omit<FestivalOffer, 'id'>) => {
    const newOffer: FestivalOffer = {
      ...offerData,
      id: `offer-${Date.now()}`,
    };
    const updated = [newOffer, ...festivalOffers];
    saveOffers(updated);

    // If new coupon code provided with this offer, auto-create it
    if (offerData.couponCode) {
      const codeUpper = offerData.couponCode.toUpperCase().trim();
      if (!coupons.some((c) => c.code === codeUpper)) {
        addCoupon({
          code: codeUpper,
          discount: `${offerData.discountPercentage}% Off`,
          discountValue: offerData.discountPercentage,
          discountType: 'percent',
          minOrderValue: 999,
          usageCount: 0,
          status: 'Active',
        });
      }
    }
  };

  const deleteFestivalOffer = (id: string) => {
    const updated = festivalOffers.filter((o) => o.id !== id);
    saveOffers(updated);
  };

  const toggleFestivalOffer = (id: string) => {
    const updated = festivalOffers.map((o) => {
      if (o.id === id) {
        return { ...o, isActive: !o.isActive };
      }
      return o;
    });
    saveOffers(updated);
  };

  // Coupon CRUD with Supabase synchronization
  const syncCouponToDb = (coupon: StoreCoupon) => {
    fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coupon }),
    }).catch((err) => console.warn('Failed to sync coupon to DB:', err));
  };

  const addCoupon = (coupon: StoreCoupon) => {
    const updated = [coupon, ...coupons.filter((c) => c.code !== coupon.code)];
    saveCoupons(updated);
    syncCouponToDb(coupon);
  };

  const deleteCoupon = (code: string) => {
    const updated = coupons.filter((c) => c.code !== code);
    saveCoupons(updated);
    fetch(`/api/admin/coupons?code=${encodeURIComponent(code)}`, {
      method: 'DELETE',
    }).catch((err) => console.warn('Failed to delete coupon from DB:', err));
  };

  const toggleCoupon = (code: string) => {
    const updated = coupons.map((c) => {
      if (c.code === code) {
        return { ...c, status: c.status === 'Active' ? 'Paused' : 'Active' } as StoreCoupon;
      }
      return c;
    });
    saveCoupons(updated);
    const changed = updated.find((c) => c.code === code);
    if (changed) {
      syncCouponToDb(changed);
    }
  };

  const applyCoupon = (code: string, subtotal: number): { valid: boolean; discountAmount: number; message: string } => {
    const cleanCode = code.trim().toUpperCase();
    const found = coupons.find((c) => c.code === cleanCode);

    if (!found) {
      return { valid: false, discountAmount: 0, message: 'Invalid coupon code.' };
    }

    if (found.status !== 'Active') {
      return { valid: false, discountAmount: 0, message: 'This coupon is currently paused or expired.' };
    }

    if (subtotal < found.minOrderValue) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Coupon requires minimum order of ₹${found.minOrderValue.toLocaleString('en-IN')}.`,
      };
    }

    let discountAmount = 0;
    if (found.discountType === 'percent') {
      discountAmount = Math.round((subtotal * found.discountValue) / 100);
    } else {
      discountAmount = Math.min(found.discountValue, subtotal);
    }

    return {
      valid: true,
      discountAmount,
      message: `Voucher applied: ${found.discount} savings!`,
    };
  };

  const updateStoreSettings = (updates: Partial<StoreSettings>) => {
    const updated = { ...storeSettings, ...updates };
    saveSettings(updated);
  };

  const resetAllStoreData = () => {
    saveProducts(DEMO_PRODUCTS);
    saveOffers(DEFAULT_FESTIVAL_OFFERS);
    saveCoupons(DEFAULT_COUPONS);
    saveSettings(DEFAULT_SETTINGS);
  };

  const activeFestivalOffer = festivalOffers.find((o) => o.isActive) || null;

  return (
    <StoreContext.Provider
      value={{
        products,
        isLoading,
        isLiveDb,
        error,
        refetchCatalog,
        festivalOffers,
        activeFestivalOffer,
        coupons,
        storeSettings,
        inquiries,
        unreadInquiriesCount,
        sendCustomerInquiry,
        markInquiryAsRead,
        markAllInquiriesAsRead,
        deleteInquiry,
        clearAllInquiries,
        addProduct,
        updateProduct,
        deleteProduct,
        quickUpdatePrice,
        quickUpdateStock,
        toggleProductNewArrival,
        resetCatalog,
        postFestivalOffer,
        deleteFestivalOffer,
        toggleFestivalOffer,
        addCoupon,
        deleteCoupon,
        toggleCoupon,
        applyCoupon,
        updateStoreSettings,
        updateSearchPriceRanges,
        resetAllStoreData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
