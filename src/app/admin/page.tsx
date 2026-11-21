'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tag,
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Eye,
  Layers,
  Sparkles,
  Settings,
  Shield,
  LogOut,
  RotateCcw,
  Percent,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  Flame,
  Volume2,
  Bell,
  MessageSquare,
  Mail,
  Phone,
  CheckCheck,
  Image as ImageIcon,
  Palette,
  Copy,
  ExternalLink,
  Database,
  RefreshCw,
  Server,
  UploadCloud,
  Loader2,
  Truck,
  CheckCircle2,
  Camera,
  Upload,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Product, ProductCategory, ProductOccasion, ProductSize, ProductInventorySize, FestivalOffer, StoreCoupon, CustomerInquiry, SearchPriceRangeTier, ProductColor } from '@/types';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { useStore, DEFAULT_SEARCH_PRICE_RANGES } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { getColorHexFallback } from '@/lib/api/products';

type AdminTab = 'overview' | 'products' | 'offers' | 'inventory' | 'orders' | 'discounts' | 'inquiries' | 'settings';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const {
    products,
    festivalOffers,
    coupons,
    storeSettings,
    inquiries,
    unreadInquiriesCount,
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
    updateStoreSettings,
    updateSearchPriceRanges,
    resetAllStoreData,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'new-arrivals' | ProductCategory>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Search Price Filter Brackets State
  const [editingPriceRanges, setEditingPriceRanges] = useState<SearchPriceRangeTier[]>([]);

  useEffect(() => {
    if (storeSettings.searchPriceRanges && storeSettings.searchPriceRanges.length > 0) {
      setEditingPriceRanges(storeSettings.searchPriceRanges);
    } else {
      setEditingPriceRanges(DEFAULT_SEARCH_PRICE_RANGES);
    }
  }, [storeSettings.searchPriceRanges]);

  const handleUpdatePriceBracket = (index: number, field: keyof SearchPriceRangeTier, val: any) => {
    const updated = [...editingPriceRanges];
    updated[index] = { ...updated[index], [field]: val };
    setEditingPriceRanges(updated);
  };

  const handleAddPriceBracket = () => {
    const newTier: SearchPriceRangeTier = {
      key: `tier-${Date.now()}`,
      label: 'New Range',
      min: 199,
      max: 499,
    };
    setEditingPriceRanges([...editingPriceRanges, newTier]);
  };

  const handleRemovePriceBracket = (index: number) => {
    if (editingPriceRanges.length <= 1) {
      showNotification('At least one price range tier must be kept.');
      return;
    }
    const updated = editingPriceRanges.filter((_, i) => i !== index);
    setEditingPriceRanges(updated);
  };

  const handleSavePriceBrackets = () => {
    updateStoreSettings({ searchPriceRanges: editingPriceRanges });
    showNotification('Search price rating brackets successfully saved!');
  };

  const handleResetPriceBrackets = () => {
    setEditingPriceRanges(DEFAULT_SEARCH_PRICE_RANGES);
    updateStoreSettings({ searchPriceRanges: DEFAULT_SEARCH_PRICE_RANGES });
    showNotification('Search price rating brackets reset to defaults.');
  };

  // Database Health & Architecture Diagnostic State
  const [dbHealth, setDbHealth] = useState<any>(null);
  const [isTestingDb, setIsTestingDb] = useState(false);

  const testDatabaseConnection = async () => {
    setIsTestingDb(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setDbHealth(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection test failed';
      setDbHealth({ status: 'error', message: msg });
    } finally {
      setIsTestingDb(false);
    }
  };

  // Inquiries & Bell Notifications State
  const [isInquiriesOpen, setIsInquiriesOpen] = useState(false);
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [inquirySearch, setInquirySearch] = useState('');

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Media Gallery & Color Variants Modal State
  const [mediaModalProduct, setMediaModalProduct] = useState<Product | null>(null);
  const [newGalleryImageUrl, setNewGalleryImageUrl] = useState('');
  const [newColorVariantName, setNewColorVariantName] = useState('');
  const [newColorVariantHex, setNewColorVariantHex] = useState('#D9A08C');
  const [newColorVariantR, setNewColorVariantR] = useState(217);
  const [newColorVariantG, setNewColorVariantG] = useState(160);
  const [newColorVariantB, setNewColorVariantB] = useState(140);
  const [newColorVariantImage, setNewColorVariantImage] = useState('');
  const [newColorVariantCloseUpImage, setNewColorVariantCloseUpImage] = useState('');
  const [uploadingColorCloseUp, setUploadingColorCloseUp] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [collapsedColorStockMap, setCollapsedColorStockMap] = useState<Record<string, boolean>>({});

  const toggleColorStockCollapse = (productId: string) => {
    setCollapsedColorStockMap((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // Helper functions for Hex <-> RGB conversions
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    let clean = (hex || '').replace('#', '').trim();
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('');
    }
    const num = parseInt(clean, 16);
    if (isNaN(num) || clean.length !== 6) return { r: 196, g: 29, b: 83 };
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v) || 0));
    const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const ensureHex7 = (val: string): string => {
    if (!val) return '#c41d53';
    let clean = val.trim().toLowerCase();
    if (!clean.startsWith('#')) clean = '#' + clean;
    if (/^#[0-9a-f]{6}$/.test(clean)) return clean;
    if (/^#[0-9a-f]{3}$/.test(clean)) {
      return `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`;
    }
    return '#c41d53';
  };

  const BOUTIQUE_COLOR_PRESETS = [
    { name: 'Rani Pink', hex: '#C41D53' },
    { name: 'Royal Purple', hex: '#463272' },
    { name: 'Wine', hex: '#702244' },
    { name: 'Slate-blue', hex: '#3A435B' },
    { name: 'Teal Blue', hex: '#135B6E' },
    { name: 'Olive Green', hex: '#4D5D28' },
    { name: 'Rust Orange', hex: '#D84315' },
    { name: 'Mustard Gold', hex: '#D4AF37' },
    { name: 'Rose Gold', hex: '#D9A08C' },
    { name: 'Ivory Cream', hex: '#F8F5F0' },
    { name: 'Charcoal Black', hex: '#111111' },
  ];

  const FABRIC_PRESETS = [
    'Regular Pure Cotton',
    'Premium Dabu Cotton',
    'Pure Chanderi Silk',
    'Banarasi Tissue Organza',
    'Viscose Modal',
    'Heavy Crepe Silk',
  ];

  const OCCASION_OPTIONS: string[] = [
    'Daily Wear',
    'Office Wear',
    'Ethnic & Festive',
    'Occasion Wear',
    'College & Casual',
  ];

  const DEFAULT_SIZE_LIST: ProductInventorySize[] = [
    { size: 'XS', inStock: false, stockCount: 0 },
    { size: 'S', inStock: false, stockCount: 0 },
    { size: 'M', inStock: true, stockCount: 15 },
    { size: 'L', inStock: true, stockCount: 15 },
    { size: 'XL', inStock: true, stockCount: 12 },
    { size: 'XXL', inStock: true, stockCount: 10 },
  ];

  // Upload States for other modals
  const [isUploadingNewProdCover, setIsUploadingNewProdCover] = useState(false);
  const [isUploadingPrimaryCloseUp, setIsUploadingPrimaryCloseUp] = useState(false);
  const [isUploadingNewProdAdditional, setIsUploadingNewProdAdditional] = useState(false);
  const [isUploadingEditPhoto, setIsUploadingEditPhoto] = useState(false);

  // New Product Form State - starts completely empty for admin to input real details
  const [newProdName, setNewProdName] = useState('');
  const [newProdSubtitle, setNewProdSubtitle] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<ProductCategory>('co-ord-sets');
  const [newProdOccasion, setNewProdOccasion] = useState<ProductOccasion>('Ethnic & Festive');
  const [newProdOccasions, setNewProdOccasions] = useState<string[]>(['Ethnic & Festive']);

  const toggleNewProdOccasion = (occ: string) => {
    setNewProdOccasions((prev) => {
      let updated: string[];
      if (prev.includes(occ)) {
        updated = prev.filter((o) => o !== occ);
        if (updated.length === 0) updated = [occ]; // Keep at least one selected
      } else {
        updated = [...prev, occ];
      }
      setNewProdOccasion(updated.join(', ') as ProductOccasion);
      return updated;
    });
  };
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdOriginalPrice, setNewProdOriginalPrice] = useState('');
  const [newProdFabric, setNewProdFabric] = useState('');
  const [newProdDescription, setNewProdDescription] = useState('');
  
  // Primary Product Photography & Primary Color
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdPrimaryCloseUp, setNewProdPrimaryCloseUp] = useState('');
  const [newProdPrimaryColorName, setNewProdPrimaryColorName] = useState('');
  const [newProdPrimaryColorHex, setNewProdPrimaryColorHex] = useState('#C41D53');
  const [newProdPrimaryColorR, setNewProdPrimaryColorR] = useState(196);
  const [newProdPrimaryColorG, setNewProdPrimaryColorG] = useState(29);
  const [newProdPrimaryColorB, setNewProdPrimaryColorB] = useState(83);

  // New Product Sizes
  const [newProdSizes, setNewProdSizes] = useState<ProductInventorySize[]>(DEFAULT_SIZE_LIST);

  // Additional Products (Shades) & Colors
  const [newProdColors, setNewProdColors] = useState<ProductColor[]>([]);
  const [newProdColorName, setNewProdColorName] = useState('');
  const [newProdColorHex, setNewProdColorHex] = useState('#463272');
  const [newProdColorR, setNewProdColorR] = useState(70);
  const [newProdColorG, setNewProdColorG] = useState(50);
  const [newProdColorB, setNewProdColorB] = useState(114);
  const [newProdColorPhoto1, setNewProdColorPhoto1] = useState('');
  const [newProdColorPhoto2, setNewProdColorPhoto2] = useState('');
  const [isUploadingNewColor1, setIsUploadingNewColor1] = useState(false);
  const [isUploadingNewColor2, setIsUploadingNewColor2] = useState(false);

  const [newProdAdditionalImages, setNewProdAdditionalImages] = useState<string[]>([]);
  const [newProdExtraImageUrl, setNewProdExtraImageUrl] = useState('');
  const [newProdIsNew, setNewProdIsNew] = useState(true);
  const [newProdIsBest, setNewProdIsBest] = useState(false);
  const [newProdIsFeatured, setNewProdIsFeatured] = useState(true);

  // Helper to ensure Add Product form opens completely blank
  const resetNewProductForm = () => {
    setNewProdName('');
    setNewProdSubtitle('');
    setNewProdCategory('co-ord-sets');
    setNewProdOccasion('Ethnic & Festive');
    setNewProdOccasions(['Ethnic & Festive']);
    setNewProdPrice('');
    setNewProdOriginalPrice('');
    setNewProdFabric('');
    setNewProdDescription('');
    setNewProdImage('');
    setNewProdPrimaryCloseUp('');
    setNewProdPrimaryColorName('');
    setNewProdPrimaryColorHex('#C41D53');
    setNewProdPrimaryColorR(196);
    setNewProdPrimaryColorG(29);
    setNewProdPrimaryColorB(83);
    setNewProdSizes(DEFAULT_SIZE_LIST);
    setNewProdColors([]);
    setNewProdColorName('');
    setNewProdColorHex('#463272');
    setNewProdColorR(70);
    setNewProdColorG(50);
    setNewProdColorB(114);
    setNewProdColorPhoto1('');
    setNewProdColorPhoto2('');
    setNewProdAdditionalImages([]);
    setNewProdExtraImageUrl('');
    setNewProdIsNew(true);
    setNewProdIsBest(false);
    setNewProdIsFeatured(true);
  };

  // Edit Product Color Adding state
  const [editProdColorName, setEditProdColorName] = useState('');
  const [editProdColorHex, setEditProdColorHex] = useState('#463272');
  const [editProdColorR, setEditProdColorR] = useState(70);
  const [editProdColorG, setEditProdColorG] = useState(50);
  const [editProdColorB, setEditProdColorB] = useState(114);
  const [editProdColorPhoto1, setEditProdColorPhoto1] = useState('');
  const [editProdColorPhoto2, setEditProdColorPhoto2] = useState('');
  const [isUploadingEditColor1, setIsUploadingEditColor1] = useState(false);
  const [isUploadingEditColor2, setIsUploadingEditColor2] = useState(false);

  // Existing Color Variant Editing State (for updating color name, HEX, and replacing photos)
  const [editingVariantKey, setEditingVariantKey] = useState<string | null>(null);
  const [editVariantName, setEditVariantName] = useState('');
  const [editVariantHex, setEditVariantHex] = useState('');
  const [editVariantR, setEditVariantR] = useState(196);
  const [editVariantG, setEditVariantG] = useState(29);
  const [editVariantB, setEditVariantB] = useState(83);
  const [editVariantPhoto1, setEditVariantPhoto1] = useState('');
  const [editVariantPhoto2, setEditVariantPhoto2] = useState('');
  const [isUploadingVariantPhoto1, setIsUploadingVariantPhoto1] = useState(false);
  const [isUploadingVariantPhoto2, setIsUploadingVariantPhoto2] = useState(false);

  // Festival Offer Modal State
  const [isNewOfferOpen, setIsNewOfferOpen] = useState(false);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerSubtitle, setOfferSubtitle] = useState('');
  const [offerBadge, setOfferBadge] = useState('ROYAL FESTIVE DROP');
  const [offerCoupon, setOfferCoupon] = useState('');
  const [offerDiscount, setOfferDiscount] = useState('20');
  const [offerCategory, setOfferCategory] = useState<'all' | ProductCategory>('all');

  // New Coupon Form
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'flat' | 'percent'>('flat');
  const [couponDiscount, setCouponDiscount] = useState('₹100 Off');
  const [couponVal, setCouponVal] = useState('100');
  const [couponMinOrder, setCouponMinOrder] = useState('499');

  // Inline Quick Price Edit State
  const [quickPriceId, setQuickPriceId] = useState<string | null>(null);
  const [quickPriceValue, setQuickPriceValue] = useState<string>('');

  // Announcement Message edit
  const [newAnnouncement, setNewAnnouncement] = useState('');

  const showNotification = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Orders Pipeline Live State
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchAdminOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/orders', {
        headers: {
          'x-admin-key': 'niloratrends-master-admin',
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrdersList(data.orders);
      }
    } catch (e) {
      console.error('Failed to fetch admin orders:', e);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders' || activeTab === 'overview') {
      fetchAdminOrders();
    }
  }, [activeTab]);

  const handleCreateSampleOrder = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'niloratrends-master-admin',
        },
        body: JSON.stringify({ action: 'create_sample_order' }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrdersList((prev) => [data.order, ...prev.filter((o) => o.order_number !== data.order.order_number)]);
        showNotification(`Sample Order #${data.order.order_number} created with "Confirmed Order" status!`);
      } else {
        showNotification(data.error || 'Failed to create sample order.');
      }
    } catch (e) {
      showNotification('Network error while creating test order.');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'niloratrends-master-admin',
        },
        body: JSON.stringify({ newOrderStatus: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const labelMap: Record<string, string> = {
          confirmed: 'Confirmed Order',
          shipped: 'Shipped',
          delivered: 'Delivered',
          packed: 'Atelier Packed',
          cancelled: 'Cancelled',
        };
        const statusDisplay = labelMap[newStatus] || newStatus;
        showNotification(`Order status updated to "${statusDisplay}". Customer page reflects this change.`);
        setOrdersList((prev) =>
          prev.map((o) =>
            o.id === orderId || o.order_number === orderId
              ? { ...o, order_status: newStatus }
              : o
          )
        );
      } else {
        showNotification(`Failed to update status: ${data.error || 'Server error'}`);
      }
    } catch (e) {
      showNotification('Network error while updating order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-key': 'niloratrends-master-admin',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Order #${orderId} has been removed.`);
        setOrdersList((prev) => prev.filter((o) => o.id !== orderId && o.order_number !== orderId));
      } else {
        showNotification(data.error || 'Failed to delete order.');
      }
    } catch {
      showNotification('Network error while deleting order.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleClearAllOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'DELETE',
        headers: {
          'x-admin-key': 'niloratrends-master-admin',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrdersList([]);
        showNotification('All demo orders have been removed from the pipeline.');
      } else {
        showNotification(data.error || 'Failed to clear orders.');
      }
    } catch {
      showNotification('Network error while clearing orders.');
    } finally {
      setOrdersLoading(false);
    }
  };

  // SECURITY GUARD: If not logged in as Admin
  if (!isAdmin) {
    return (
      <div className="bg-[#231813] min-h-screen flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-[#312119] text-[#FAF7F2] rounded-3xl p-8 border border-rose-500/30 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#D9A08C] font-semibold">
              Restricted Area
            </span>
            <h2 className="font-serif text-2xl font-medium">
              Administrator Authentication Required
            </h2>
            <p className="text-xs text-[#FAF7F2]/70 leading-relaxed">
              This management console is strictly restricted to authorized Nilora Trends boutique staff and directors.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/admin/login"
              className="w-full py-3 rounded-full bg-[#D9A08C] text-[#231813] font-bold text-xs tracking-wider uppercase hover:bg-white transition-all shadow-lg"
            >
              Sign In to Admin Portal &rarr;
            </Link>
            <Link
              href="/"
              className="w-full py-3 rounded-full border border-white/20 text-[#FAF7F2] font-semibold text-xs tracking-wider uppercase hover:bg-white/10 transition-all"
            >
              Return to Public Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Media & Color Variants handlers
  const handleUploadPhotoFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !mediaModalProduct) return;

    setIsUploadingPhoto(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to upload photo.');
      }

      const uploadedUrls: string[] = data.urls || [data.url];
      const updatedImages = [...mediaModalProduct.images, ...uploadedUrls];
      const updated = { ...mediaModalProduct, images: updatedImages };
      setMediaModalProduct(updated);
      updateProduct(mediaModalProduct.id, { images: updatedImages });

      setUploadSuccess(`Successfully uploaded ${uploadedUrls.length} photo(s)!`);
      showNotification(`Added ${uploadedUrls.length} photograph(s) from your device to ${mediaModalProduct.name}`);

      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(msg);
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleUploadNewProdCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingNewProdCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');
      setNewProdImage(data.url);
      showNotification('Cover photograph uploaded successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Upload error: ${msg}`);
    } finally {
      setIsUploadingNewProdCover(false);
      e.target.value = '';
    }
  };

  const handleUploadPrimaryCloseUp = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPrimaryCloseUp(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');
      setNewProdPrimaryCloseUp(data.url);
      showNotification('Primary close-up swipe photograph uploaded!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Upload error: ${msg}`);
    } finally {
      setIsUploadingPrimaryCloseUp(false);
      e.target.value = '';
    }
  };

  const handleUploadNewProdAdditional = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingNewProdAdditional(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');
      const uploadedUrls: string[] = data.urls || [data.url];
      setNewProdAdditionalImages((prev) => [...prev, ...uploadedUrls]);
      showNotification(`Uploaded ${uploadedUrls.length} additional photo(s)!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Upload error: ${msg}`);
    } finally {
      setIsUploadingNewProdAdditional(false);
      e.target.value = '';
    }
  };

  const handleUploadEditPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingProduct) return;

    setIsUploadingEditPhoto(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');
      const uploadedUrls: string[] = data.urls || [data.url];
      const updated = {
        ...editingProduct,
        images: [...editingProduct.images, ...uploadedUrls],
      };
      setEditingProduct(updated);
      updateProduct(editingProduct.id, { images: updated.images });
      showNotification(`Uploaded ${uploadedUrls.length} photo(s)!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Upload error: ${msg}`);
    } finally {
      setIsUploadingEditPhoto(false);
      e.target.value = '';
    }
  };

  // Color addition and photo upload handlers for + Post New Product Modal
  const handleAddNewProdColor = () => {
    if (!newProdColorName.trim()) {
      alert('Please enter a color name (e.g. Royal Purple)');
      return;
    }
    const cleanCloseUp = newProdColorPhoto2.trim() || undefined;
    const primary = newProdColorPhoto1.trim() || newProdImage || (newProdAdditionalImages[0] || '');
    const imgList = [primary, cleanCloseUp].filter(Boolean) as string[];

    const newCol: ProductColor = {
      name: newProdColorName.trim(),
      hex: newProdColorHex || '#C41D53',
      image: primary,
      closeUpImage: cleanCloseUp,
      images: imgList,
      sizes: [...newProdSizes],
    };

    setNewProdColors((prev) => [...prev, newCol]);

    // Ensure these images are in the product images list as well
    if (primary && primary !== newProdImage && !newProdAdditionalImages.includes(primary)) {
      setNewProdAdditionalImages((prev) => [...prev, primary]);
    }
    if (cleanCloseUp && !newProdAdditionalImages.includes(cleanCloseUp)) {
      setNewProdAdditionalImages((prev) => [...prev, cleanCloseUp]);
    }

    setNewProdColorName('');
    setNewProdColorPhoto1('');
    setNewProdColorPhoto2('');
    showNotification(`Added color shade "${newCol.name}" to new attire!`);
  };

  const handleRemoveNewProdColor = (colorName: string) => {
    setNewProdColors((prev) => prev.filter((c) => c.name !== colorName));
    showNotification(`Color "${colorName}" removed.`);
  };

  const handleUploadNewProdColorPhoto = async (
    target: 'photo1' | 'photo2',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (target === 'photo1') setIsUploadingNewColor1(true);
    else setIsUploadingNewColor2(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');

      if (target === 'photo1') {
        setNewProdColorPhoto1(data.url);
        if (newProdImage !== data.url && !newProdAdditionalImages.includes(data.url)) {
          setNewProdAdditionalImages((prev) => [...prev, data.url]);
        }
        showNotification('Full dress photo uploaded!');
      } else {
        setNewProdColorPhoto2(data.url);
        if (!newProdAdditionalImages.includes(data.url)) {
          setNewProdAdditionalImages((prev) => [...prev, data.url]);
        }
        showNotification('Close-up swipe photo uploaded!');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Upload error: ${msg}`);
    } finally {
      if (target === 'photo1') setIsUploadingNewColor1(false);
      else setIsUploadingNewColor2(false);
      e.target.value = '';
    }
  };

  // Color addition and photo upload handlers for Edit Product Modal
  const handleAddEditProdColor = () => {
    if (!editingProduct || !editProdColorName.trim()) {
      alert('Please enter a color name (e.g. Royal Purple)');
      return;
    }
    const cleanCloseUp = editProdColorPhoto2.trim() || undefined;
    const primary = editProdColorPhoto1.trim() || editingProduct.images[0] || '';
    const imgList = [primary, cleanCloseUp].filter(Boolean) as string[];

    const newCol: ProductColor = {
      name: editProdColorName.trim(),
      hex: editProdColorHex || '#463272',
      image: primary,
      closeUpImage: cleanCloseUp,
      images: imgList,
      sizes: editingProduct.sizes && editingProduct.sizes.length > 0 ? [...editingProduct.sizes] : [...DEFAULT_SIZE_LIST],
    };

    const updatedColors = [...(editingProduct.colors || []), newCol];
    let updatedImages = [...editingProduct.images];
    if (primary && !updatedImages.includes(primary)) updatedImages.push(primary);
    if (cleanCloseUp && !updatedImages.includes(cleanCloseUp)) updatedImages.push(cleanCloseUp);

    const updated = {
      ...editingProduct,
      colors: updatedColors,
      images: updatedImages,
    };
    setEditingProduct(updated);
    updateProduct(editingProduct.id, { colors: updatedColors, images: updatedImages });

    setEditProdColorName('');
    setEditProdColorPhoto1('');
    setEditProdColorPhoto2('');
    showNotification(`Added color shade "${newCol.name}" to ${editingProduct.name}!`);
  };

  const handleRemoveEditProdColor = (colorName: string) => {
    if (!editingProduct) return;
    const updatedColors = (editingProduct.colors || []).filter((c) => c.name !== colorName);
    const updated = { ...editingProduct, colors: updatedColors };
    setEditingProduct(updated);
    updateProduct(editingProduct.id, { colors: updatedColors });
    showNotification(`Color shade "${colorName}" removed.`);
  };

  const handleUploadEditProdColorPhoto = async (
    target: 'photo1' | 'photo2',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;

    if (target === 'photo1') setIsUploadingEditColor1(true);
    else setIsUploadingEditColor2(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');

      if (target === 'photo1') {
        setEditProdColorPhoto1(data.url);
        if (!editingProduct.images.includes(data.url)) {
          const updatedImages = [...editingProduct.images, data.url];
          setEditingProduct({ ...editingProduct, images: updatedImages });
          updateProduct(editingProduct.id, { images: updatedImages });
        }
        showNotification('Full dress photo uploaded!');
      } else {
        setEditProdColorPhoto2(data.url);
        if (!editingProduct.images.includes(data.url)) {
          const updatedImages = [...editingProduct.images, data.url];
          setEditingProduct({ ...editingProduct, images: updatedImages });
          updateProduct(editingProduct.id, { images: updatedImages });
        }
        showNotification('Close-up swipe photo uploaded!');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Upload error: ${msg}`);
    } finally {
      if (target === 'photo1') setIsUploadingEditColor1(false);
      else setIsUploadingEditColor2(false);
      e.target.value = '';
    }
  };

  // Color Variant Inline Editing Handlers (Allows editing color name, HEX code, replacing photos, and direct save)
  const handleStartEditVariant = (color: ProductColor) => {
    setEditingVariantKey(color.name);
    setEditVariantName(color.name);
    const isPaleWhiteDefault = color.hex === '#E8D6C7' || !color.hex;
    const isActuallyBeige = /beige|champagne|cream|sand|wheat/i.test(color.name);
    const hex = (isPaleWhiteDefault && !isActuallyBeige)
      ? getColorHexFallback(color.name)
      : (color.hex || '#C41D53');
    setEditVariantHex(hex);
    const rgb = hexToRgb(hex);
    setEditVariantR(rgb.r);
    setEditVariantG(rgb.g);
    setEditVariantB(rgb.b);
    setEditVariantPhoto1(color.image || '');
    setEditVariantPhoto2(color.closeUpImage || '');
  };

  const handleCancelEditVariant = () => {
    setEditingVariantKey(null);
    setEditVariantName('');
    setEditVariantHex('');
    setEditVariantPhoto1('');
    setEditVariantPhoto2('');
  };

  const handleUploadVariantPhoto = async (
    target: 'photo1' | 'photo2',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (target === 'photo1') setIsUploadingVariantPhoto1(true);
    else setIsUploadingVariantPhoto2(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');

      if (target === 'photo1') {
        setEditVariantPhoto1(data.url);
        showNotification('Full dress photo uploaded from device!');
      } else {
        setEditVariantPhoto2(data.url);
        showNotification('Close-up swipe photo uploaded from device!');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Upload error: ${msg}`);
    } finally {
      if (target === 'photo1') setIsUploadingVariantPhoto1(false);
      else setIsUploadingVariantPhoto2(false);
      e.target.value = '';
    }
  };

  const handleSaveEditedVariant = (targetProdId: string) => {
    if (!editingVariantKey) return;
    const cleanName = editVariantName.trim();
    if (!cleanName) {
      alert('Colour name cannot be empty.');
      return;
    }

    const targetProduct = products.find((p) => p.id === targetProdId) || editingProduct || mediaModalProduct;
    if (!targetProduct) return;

    const originalColors = targetProduct.colors || [];
    const photo1 = editVariantPhoto1.trim();
    const photo2 = editVariantPhoto2.trim() || undefined;
    const imagesList = [photo1, photo2].filter(Boolean) as string[];

    const updatedColors = originalColors.map((col) => {
      if (col.name.toLowerCase() === editingVariantKey.toLowerCase()) {
        return {
          ...col,
          name: cleanName,
          hex: editVariantHex || col.hex,
          image: photo1 || col.image,
          closeUpImage: photo2,
          images: imagesList.length > 0 ? imagesList : (col.images || []),
        };
      }
      return col;
    });

    // Also ensure any newly attached photo URLs are present in product.images list
    let updatedImages = [...targetProduct.images];
    if (photo1 && !updatedImages.includes(photo1)) {
      updatedImages.push(photo1);
    }
    if (photo2 && !updatedImages.includes(photo2)) {
      updatedImages.push(photo2);
    }

    // If this is the 1st variant (primary cover), ensure photo1 is at index 0 so thumbnail updates live
    const isFirstVariant = originalColors.findIndex((c) => c.name.toLowerCase() === editingVariantKey.toLowerCase()) === 0;
    if (isFirstVariant && photo1) {
      updatedImages = [photo1, ...updatedImages.filter((img) => img !== photo1)];
    }

    // Save directly to the existing product in DB and local state
    updateProduct(targetProduct.id, {
      colors: updatedColors,
      images: updatedImages,
    });

    // Update current active modals in state
    if (editingProduct && editingProduct.id === targetProduct.id) {
      setEditingProduct({
        ...editingProduct,
        colors: updatedColors,
        images: updatedImages,
      });
    }
    if (mediaModalProduct && mediaModalProduct.id === targetProduct.id) {
      setMediaModalProduct({
        ...mediaModalProduct,
        colors: updatedColors,
        images: updatedImages,
      });
    }

    showNotification(`Colour variant "${cleanName}" updated & saved live!`);
    setEditingVariantKey(null);
  };

  const handleStockCountChange = (productId: string, sizeName: string, newCount: number) => {
    const safeCount = isNaN(newCount) ? 0 : Math.max(0, Math.floor(newCount));
    const targetProd = products.find((p) => p.id === productId);
    if (!targetProd) return;

    const existingSizes = targetProd.sizes || [];
    let updatedSizes = [...existingSizes];

    const idx = updatedSizes.findIndex((s) => s.size.toLowerCase() === sizeName.toLowerCase());
    if (idx !== -1) {
      updatedSizes[idx] = {
        ...updatedSizes[idx],
        stockCount: safeCount,
        inStock: safeCount > 0,
      };
    } else {
      updatedSizes.push({
        size: sizeName as ProductSize,
        stockCount: safeCount,
        inStock: safeCount > 0,
      });
    }

    // If product has color variants, distribute proportionally across colors
    let updatedColors = targetProd.colors;
    if (updatedColors && updatedColors.length > 0) {
      const perColor = Math.floor(safeCount / updatedColors.length);
      const remainder = safeCount % updatedColors.length;

      updatedColors = updatedColors.map((col, cIdx) => {
        const colSizes = col.sizes && col.sizes.length > 0 ? [...col.sizes] : [...updatedSizes];
        const sIdx = colSizes.findIndex((s) => s.size.toLowerCase() === sizeName.toLowerCase());
        const countForCol = perColor + (cIdx < remainder ? 1 : 0);

        if (sIdx !== -1) {
          colSizes[sIdx] = {
            ...colSizes[sIdx],
            stockCount: countForCol,
            inStock: countForCol > 0,
          };
        } else {
          colSizes.push({
            size: sizeName as ProductSize,
            stockCount: countForCol,
            inStock: countForCol > 0,
          });
        }
        return { ...col, sizes: colSizes };
      });
    }

    const totalStock = updatedSizes.reduce((acc, s) => acc + (s.stockCount || 0), 0);
    const overallInStock = totalStock > 0;

    updateProduct(productId, {
      sizes: updatedSizes,
      colors: updatedColors,
      inStock: overallInStock,
    });
  };

  const handleColorStockCountChange = (
    productId: string,
    colorName: string,
    sizeName: string,
    newCount: number
  ) => {
    const safeCount = isNaN(newCount) ? 0 : Math.max(0, Math.floor(newCount));
    const targetProd = products.find((p) => p.id === productId);
    if (!targetProd) return;

    const baseSizesList: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

    // Update color-specific sizes
    const updatedColors = (targetProd.colors || []).map((col) => {
      if (col.name.toLowerCase() === colorName.toLowerCase()) {
        const existingColorSizes = col.sizes && col.sizes.length > 0 ? col.sizes : (targetProd.sizes || []);
        let updatedColSizes = [...existingColorSizes];

        const sIdx = updatedColSizes.findIndex((s) => s.size.toLowerCase() === sizeName.toLowerCase());
        if (sIdx !== -1) {
          updatedColSizes[sIdx] = {
            ...updatedColSizes[sIdx],
            stockCount: safeCount,
            inStock: safeCount > 0,
          };
        } else {
          updatedColSizes.push({
            size: sizeName as ProductSize,
            stockCount: safeCount,
            inStock: safeCount > 0,
          });
        }
        return {
          ...col,
          sizes: updatedColSizes,
        };
      }
      return col;
    });

    // Recompute overall product sizes from all color variants
    const updatedProductSizes = baseSizesList.map((sz) => {
      const sumForSize = updatedColors.reduce((sum, c) => {
        const cSizeObj = c.sizes?.find((s) => s.size.toLowerCase() === sz.toLowerCase());
        return sum + (cSizeObj?.stockCount !== undefined ? cSizeObj.stockCount : 0);
      }, 0);

      return {
        size: sz,
        stockCount: sumForSize,
        inStock: sumForSize > 0,
      };
    });

    const totalStock = updatedProductSizes.reduce((acc, s) => acc + (s.stockCount || 0), 0);

    updateProduct(productId, {
      colors: updatedColors,
      sizes: updatedProductSizes,
      inStock: totalStock > 0,
    });
  };

  const handleToggleColorStock = (productId: string, colorName: string, currentlyInStock: boolean) => {
    const targetProd = products.find((p) => p.id === productId);
    if (!targetProd) return;

    const baseSizesList: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const newCount = currentlyInStock ? 0 : 10;

    const updatedColors = (targetProd.colors || []).map((col) => {
      if (col.name.toLowerCase() === colorName.toLowerCase()) {
        const updatedColSizes = baseSizesList.map((sz) => ({
          size: sz,
          stockCount: newCount,
          inStock: !currentlyInStock,
        }));
        return {
          ...col,
          sizes: updatedColSizes,
        };
      }
      return col;
    });

    const updatedProductSizes = baseSizesList.map((sz) => {
      const sumForSize = updatedColors.reduce((sum, c) => {
        const cSizeObj = c.sizes?.find((s) => s.size.toLowerCase() === sz.toLowerCase());
        return sum + (cSizeObj?.stockCount !== undefined ? cSizeObj.stockCount : 0);
      }, 0);
      return {
        size: sz,
        stockCount: sumForSize,
        inStock: sumForSize > 0,
      };
    });

    const totalStock = updatedProductSizes.reduce((acc, s) => acc + (s.stockCount || 0), 0);
    updateProduct(productId, {
      colors: updatedColors,
      sizes: updatedProductSizes,
      inStock: totalStock > 0,
    });
    showNotification(`Updated inventory status for "${colorName}" shade.`);
  };

  const handleAddImageToProduct = () => {
    if (!mediaModalProduct || !newGalleryImageUrl.trim()) return;
    const updatedImages = [...mediaModalProduct.images, newGalleryImageUrl.trim()];
    const updated = { ...mediaModalProduct, images: updatedImages };
    setMediaModalProduct(updated);
    updateProduct(mediaModalProduct.id, { images: updatedImages });
    setNewGalleryImageUrl('');
    showNotification(`Added photograph to ${mediaModalProduct.name}`);
  };

  const handleRemoveImageFromProduct = (indexToRemove: number) => {
    if (!mediaModalProduct) return;
    if (mediaModalProduct.images.length <= 1) {
      alert('A product must maintain at least 1 image.');
      return;
    }
    const updatedImages = mediaModalProduct.images.filter((_, idx) => idx !== indexToRemove);
    const updated = { ...mediaModalProduct, images: updatedImages };
    setMediaModalProduct(updated);
    updateProduct(mediaModalProduct.id, { images: updatedImages });
    showNotification(`Photograph removed from ${mediaModalProduct.name}`);
  };

  const handleSetPrimaryImage = (indexToPrimary: number) => {
    if (!mediaModalProduct || indexToPrimary === 0) return;
    const targetImg = mediaModalProduct.images[indexToPrimary];
    const otherImages = mediaModalProduct.images.filter((_, idx) => idx !== indexToPrimary);
    const updatedImages = [targetImg, ...otherImages];
    const updated = { ...mediaModalProduct, images: updatedImages };
    setMediaModalProduct(updated);
    updateProduct(mediaModalProduct.id, { images: updatedImages });
    showNotification(`Set primary cover photo for ${mediaModalProduct.name}`);
  };

  const handleAddColorToProduct = () => {
    if (!mediaModalProduct || !newColorVariantName.trim()) return;
    const primaryImg = newColorVariantImage || mediaModalProduct.images[0];
    const cleanCloseUp = newColorVariantCloseUpImage.trim() || undefined;
    const imagesList = [primaryImg, cleanCloseUp].filter(Boolean) as string[];

    const newCol: ProductColor = {
      name: newColorVariantName.trim(),
      hex: newColorVariantHex || '#D9A08C',
      image: primaryImg,
      closeUpImage: cleanCloseUp,
      images: imagesList,
    };
    const updatedColors = [...(mediaModalProduct.colors || []), newCol];
    const updated = { ...mediaModalProduct, colors: updatedColors };
    setMediaModalProduct(updated);
    updateProduct(mediaModalProduct.id, { colors: updatedColors });
    setNewColorVariantName('');
    setNewColorVariantImage('');
    setNewColorVariantCloseUpImage('');
    showNotification(`Added color shade "${newCol.name}" to ${mediaModalProduct.name}`);
  };

  const handleRemoveColorFromProduct = (colorName: string) => {
    if (!mediaModalProduct) return;
    if ((mediaModalProduct.colors?.length || 0) <= 1) {
      alert('Product must retain at least 1 color option.');
      return;
    }
    const updatedColors = mediaModalProduct.colors.filter((c) => c.name !== colorName);
    const updated = { ...mediaModalProduct, colors: updatedColors };
    setMediaModalProduct(updated);
    updateProduct(mediaModalProduct.id, { colors: updatedColors });
    showNotification(`Color shade "${colorName}" removed.`);
  };

  const handleUpdateColorImages = (colorName: string, primarySrc: string, closeUpSrc?: string) => {
    if (!mediaModalProduct) return;
    const cleanCloseUp = closeUpSrc && closeUpSrc.trim() !== '' ? closeUpSrc.trim() : undefined;

    const updatedColors = mediaModalProduct.colors.map((c) => {
      if (c.name === colorName) {
        const imagesList = [primarySrc, cleanCloseUp].filter(Boolean) as string[];
        return {
          ...c,
          image: primarySrc,
          closeUpImage: cleanCloseUp,
          images: imagesList,
        };
      }
      return c;
    });

    // Ensure images are present in mediaModalProduct.images
    let updatedImages = [...mediaModalProduct.images];
    if (primarySrc && !updatedImages.includes(primarySrc)) {
      updatedImages.push(primarySrc);
    }
    if (cleanCloseUp && !updatedImages.includes(cleanCloseUp)) {
      updatedImages.push(cleanCloseUp);
    }

    const updated = { ...mediaModalProduct, colors: updatedColors, images: updatedImages };
    setMediaModalProduct(updated);
    updateProduct(mediaModalProduct.id, { colors: updatedColors, images: updatedImages });
    showNotification(`Photos updated for color "${colorName}"`);
  };

  const handleRemoveColorCloseUp = (colorName: string) => {
    if (!mediaModalProduct) return;
    const updatedColors = mediaModalProduct.colors.map((c) => {
      if (c.name === colorName) {
        return {
          ...c,
          closeUpImage: undefined,
          images: c.image ? [c.image] : [],
        };
      }
      return c;
    });
    const updated = { ...mediaModalProduct, colors: updatedColors };
    setMediaModalProduct(updated);
    updateProduct(mediaModalProduct.id, { colors: updatedColors });
    showNotification(`Removed close-up photo for "${colorName}". Switched to single photo.`);
  };

  const handleUploadColorCloseUp = async (colorName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !mediaModalProduct) return;

    setUploadingColorCloseUp(colorName);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');
      const closeUpUrl = data.url;

      const updatedImages = mediaModalProduct.images.includes(closeUpUrl)
        ? mediaModalProduct.images
        : [...mediaModalProduct.images, closeUpUrl];

      const updatedColors = mediaModalProduct.colors.map((c) => {
        if (c.name === colorName) {
          const primaryImg = c.image || mediaModalProduct.images[0];
          return {
            ...c,
            image: primaryImg,
            closeUpImage: closeUpUrl,
            images: [primaryImg, closeUpUrl],
          };
        }
        return c;
      });

      const updated = { ...mediaModalProduct, colors: updatedColors, images: updatedImages };
      setMediaModalProduct(updated);
      updateProduct(mediaModalProduct.id, { colors: updatedColors, images: updatedImages });
      showNotification(`Close-up design photo uploaded & linked to "${colorName}"!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Upload error: ${msg}`);
    } finally {
      setUploadingColorCloseUp(null);
      e.target.value = '';
    }
  };

  // Handlers
  const handleSaveNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      showNotification('Product title is required.');
      return;
    }
    if (!newProdImage.trim()) {
      showNotification('Please upload or enter a primary cover photograph.');
      return;
    }

    const primaryImg = newProdImage.trim();
    const primaryCloseUp = newProdPrimaryCloseUp.trim() || undefined;

    // Ensure sizes are formatted properly
    let finalSizes = newProdSizes && newProdSizes.length > 0 ? newProdSizes : DEFAULT_SIZE_LIST;

    // For Sarees or free-size attires, or if no sizes were explicitly checked, provide default stock so the attire is live and in stock!
    const hasAnyInStockSize = finalSizes.some((s) => s.inStock && s.stockCount > 0);
    if (newProdCategory === 'sarees' || !hasAnyInStockSize) {
      finalSizes = finalSizes.map((s) => ({
        ...s,
        inStock: true,
        stockCount: s.stockCount > 0 ? s.stockCount : 10,
      }));
    }

    // Build the primary color shade object
    const primaryColorObj: ProductColor = {
      name: newProdPrimaryColorName.trim() || 'Primary Shade',
      hex: newProdPrimaryColorHex || '#C41D53',
      image: primaryImg,
      closeUpImage: primaryCloseUp,
      images: [primaryImg, primaryCloseUp].filter(Boolean) as string[],
      sizes: [...finalSizes],
    };

    // Combine primary color + additional colors (including any pending additional color in the form fields)
    let combinedAdditionalColors = [...newProdColors];
    if (newProdColorName.trim()) {
      const pendingColName = newProdColorName.trim();
      if (!combinedAdditionalColors.some((c) => c.name.toLowerCase() === pendingColName.toLowerCase())) {
        const cleanCloseUp = newProdColorPhoto2.trim() || undefined;
        const primary = newProdColorPhoto1.trim() || '';
        combinedAdditionalColors.push({
          name: pendingColName,
          hex: newProdColorHex || '#C41D53',
          image: primary,
          closeUpImage: cleanCloseUp,
          images: [primary, cleanCloseUp].filter(Boolean) as string[],
          sizes: [...finalSizes],
        });
      }
    }

    const allColors: ProductColor[] = [
      primaryColorObj,
      ...combinedAdditionalColors.map((col) => ({
        ...col,
        sizes: col.sizes && col.sizes.length > 0 ? col.sizes : [...finalSizes],
        images: col.images && col.images.length > 0 ? col.images : [col.image, col.closeUpImage].filter(Boolean) as string[],
      })),
    ];

    // Collect all image URLs
    const colorImages = allColors.flatMap((c) => [c.image, c.closeUpImage]).filter(Boolean) as string[];
    const allImages = Array.from(new Set([primaryImg, ...colorImages, ...newProdAdditionalImages.filter(Boolean)]));

    const priceNum = Number(newProdPrice) || 0;
    const origPriceNum = Number(newProdOriginalPrice) || (priceNum > 0 ? Math.round(priceNum * 1.3) : 0);

    const created = addProduct({
      name: newProdName.trim(),
      subtitle: newProdSubtitle.trim() || 'Handcrafted Luxury Collection',
      category: newProdCategory,
      occasion: (newProdOccasions.length > 0 ? newProdOccasions.join(', ') : newProdOccasion) as ProductOccasion,
      price: priceNum,
      originalPrice: origPriceNum,
      fabric: newProdFabric.trim() || 'Regular Pure Cotton',
      description: newProdDescription.trim(),
      images: allImages,
      sizes: finalSizes,
      colors: allColors,
      isNewArrival: newProdIsNew,
      isBestSeller: newProdIsBest,
      isFeatured: newProdIsFeatured,
      inStock: true,
    });

    setIsAddProductOpen(false);
    showNotification(`New attire "${created.name}" posted successfully to ${newProdCategory}!`);
    resetNewProductForm();
  };

  const handleUpdateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    let currentSizes = editingProduct.sizes && editingProduct.sizes.length > 0 ? editingProduct.sizes : DEFAULT_SIZE_LIST;
    if (editingProduct.category === 'sarees' && !currentSizes.some((s) => s.size === 'Free Size')) {
      currentSizes = [{ size: 'Free Size' as ProductSize, inStock: true, stockCount: 15 }, ...currentSizes];
    }
    const totalStock = currentSizes.reduce((acc, s) => acc + (s.stockCount || 0), 0);

    updateProduct(editingProduct.id, {
      name: editingProduct.name,
      subtitle: editingProduct.subtitle,
      price: Number(editingProduct.price),
      originalPrice: Number(editingProduct.originalPrice),
      fabric: editingProduct.fabric || 'Regular Pure Cotton',
      description: editingProduct.description,
      category: editingProduct.category,
      occasion: editingProduct.occasion,
      isNewArrival: editingProduct.isNewArrival,
      isBestSeller: editingProduct.isBestSeller,
      isFeatured: editingProduct.isFeatured,
      inStock: editingProduct.category === 'sarees' ? true : (editingProduct.inStock ?? totalStock > 0),
      images: editingProduct.images,
      colors: editingProduct.colors,
      sizes: currentSizes,
    });

    setEditingProduct(null);
    showNotification(`Product "${editingProduct.name}" updated successfully.`);
  };

  const handleSaveFestivalOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTitle.trim()) return;

    postFestivalOffer({
      title: offerTitle,
      subtitle: offerSubtitle || 'Special Boutique Celebration Edit',
      badge: offerBadge,
      couponCode: offerCoupon || 'FESTIVE20',
      discountPercentage: Number(offerDiscount) || 20,
      targetCategory: offerCategory,
      isActive: true,
    });

    setIsNewOfferOpen(false);
    setOfferTitle('');
    setOfferSubtitle('');
    setOfferCoupon('');
    showNotification('Festival offer & banner published live across the boutique storefront!');
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    const numVal = Math.max(1, Number(couponVal) || (couponType === 'flat' ? 100 : 10));
    const label = couponDiscount.trim() || (couponType === 'flat' ? `₹${numVal} Off` : `${numVal}% Off`);

    addCoupon({
      code: couponCode.trim().toUpperCase(),
      discount: label,
      discountValue: numVal,
      discountType: couponType,
      minOrderValue: Math.max(0, Number(couponMinOrder) || 0),
      usageCount: 0,
      status: 'Active',
    });

    setCouponCode('');
    showNotification(`Coupon code ${couponCode.toUpperCase()} (${label}) activated.`);
  };

  const handleAddAnnouncementMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;
    updateStoreSettings({
      announcementMessages: [newAnnouncement.trim(), ...storeSettings.announcementMessages],
    });
    setNewAnnouncement('');
    showNotification('Live announcement ticker updated.');
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCat =
      categoryFilter === 'all' ||
      (categoryFilter === 'new-arrivals' ? p.isNewArrival : p.category === categoryFilter);
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.fabric.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Filtered Inquiries (Strictly purging demo mock messages Priya Sundaram & Kavitha R)
  const realInquiries = inquiries.filter(
    (inq) =>
      inq.name !== 'Priya Sundaram' &&
      inq.name !== 'Kavitha R' &&
      !String(inq.id || '').includes('inq-1') &&
      !String(inq.id || '').includes('inq-2')
  );

  const realUnreadCount = realInquiries.filter((inq) => !inq.read).length;

  const filteredInquiries = realInquiries.filter((inq) => {
    const matchesFilter =
      inquiryFilter === 'all' ||
      (inquiryFilter === 'unread' && !inq.read) ||
      (inquiryFilter === 'read' && inq.read);
    const matchesSearch =
      inq.name.toLowerCase().includes(inquirySearch.toLowerCase()) ||
      inq.email.toLowerCase().includes(inquirySearch.toLowerCase()) ||
      inq.phone.toLowerCase().includes(inquirySearch.toLowerCase()) ||
      inq.message.toLowerCase().includes(inquirySearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="bg-[#F8F5F0] min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Executive Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8DCCB] shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs uppercase tracking-widest text-[#B79A72] font-semibold">
                Nilora Trends Management Console
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#392820] font-medium mt-1">
              Storewide Administration &amp; Control
            </h1>
            <p className="text-xs text-[#735D50] mt-0.5">
              Logged in as <span className="font-semibold text-[#392820]">{user?.email}</span> &bull; Full Catalog &amp; Offer Posting Rights
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap relative">
            {/* Bell Notification Icon for Customer Messages */}
            <div className="relative">
              <button
                onClick={() => setIsInquiriesOpen(!isInquiriesOpen)}
                className={`relative p-2.5 rounded-full border transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 flex items-center justify-center ${
                  isInquiriesOpen
                    ? 'bg-[#392820] text-white border-[#392820]'
                    : realUnreadCount > 0
                    ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 ring-2 ring-rose-400/30'
                    : 'bg-[#FAF7F2] text-[#392820] hover:bg-[#E8DCCB] border-[#E8DCCB]'
                }`}
                title={`Customer Messages & Inquiries (${realUnreadCount} Unread)`}
                aria-label="Customer Messages & Inquiries"
              >
                <Bell className={`w-4 h-4 ${realUnreadCount > 0 ? 'text-rose-600' : ''}`} />
                {realUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse">
                    {realUnreadCount > 9 ? '9+' : realUnreadCount}
                  </span>
                )}
              </button>

              {/* Inquiries Notification Dropdown Popup */}
              {isInquiriesOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsInquiriesOpen(false)}
                  />

                  <div className="absolute right-0 mt-3 w-[calc(100vw-40px)] sm:w-[420px] max-w-[420px] bg-white rounded-3xl shadow-2xl border border-[#E8DCCB] z-50 p-5 space-y-4 max-h-[85vh] flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#F8F5F0]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#FAF7F2] text-[#392820] flex items-center justify-center border border-[#E8DCCB]">
                          <Bell className="w-4 h-4 text-[#B79A72]" />
                        </div>
                        <div>
                          <h3 className="font-serif text-sm font-semibold text-[#392820]">
                            Customer Messages
                          </h3>
                          <p className="text-[10px] text-[#735D50]">
                            {realUnreadCount > 0
                              ? `${realUnreadCount} new unread inquiry${realUnreadCount > 1 ? 's' : ''}`
                              : 'All customer messages read'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {realUnreadCount > 0 && (
                          <button
                            onClick={markAllInquiriesAsRead}
                            className="text-[11px] text-[#B79A72] hover:text-[#392820] font-semibold transition-colors cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => setIsInquiriesOpen(false)}
                          className="p-1 rounded-full text-[#735D50] hover:text-[#392820] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Messages Scroll List */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[50vh]">
                      {realInquiries.length === 0 ? (
                        <div className="text-center py-8 text-xs text-[#735D50] space-y-2">
                          <div className="w-10 h-10 rounded-full bg-[#FAF7F2] text-[#D9A08C] flex items-center justify-center mx-auto border border-[#E8D6C7]">
                            <Mail className="w-5 h-5" />
                          </div>
                          <p className="font-medium text-[#392820]">No customer messages yet</p>
                          <p className="text-[11px] text-[#735D50]/80">
                            Customer inquiries sent via the Contact page will appear here immediately.
                          </p>
                        </div>
                      ) : (
                        realInquiries.map((inq) => (
                          <div
                            key={inq.id}
                            className={`p-3.5 rounded-2xl border transition-all text-xs space-y-2 relative ${
                              !inq.read
                                ? 'bg-[#FAF7F2] border-[#D9A08C] shadow-2xs'
                                : 'bg-white border-[#E8DCCB] hover:border-[#D9A08C]'
                            }`}
                          >
                            {/* Message top row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {!inq.read && (
                                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                                )}
                                <span className="font-serif font-semibold text-[#392820] text-sm">
                                  {inq.name}
                                </span>
                              </div>
                              <span className="text-[10px] text-[#735D50] font-mono">{inq.createdAt}</span>
                            </div>

                            {/* Contact Links */}
                            <div className="flex items-center gap-2 text-[11px] flex-wrap text-[#735D50]">
                              <a
                                href={`https://wa.me/${inq.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[#25D366] hover:underline font-semibold"
                                title="Reply on WhatsApp"
                              >
                                <WhatsAppIcon className="w-3 h-3 fill-current" />
                                <span>{inq.phone}</span>
                              </a>
                              <span>&bull;</span>
                              <a
                                href={`mailto:${inq.email}?subject=Nilora%20Trends%20Support`}
                                className="inline-flex items-center gap-1 text-[#392820] hover:text-[#B79A72] hover:underline"
                                title="Send Email"
                              >
                                <Mail className="w-3 h-3" />
                                <span className="truncate max-w-[140px]">{inq.email}</span>
                              </a>
                            </div>

                            {/* Message Body */}
                            <div className="p-2.5 rounded-xl bg-white border border-[#E8DCCB]/60 text-[#392820] leading-relaxed">
                              <p className="text-xs whitespace-pre-wrap">{inq.message}</p>
                            </div>

                            {/* Bottom row actions */}
                            <div className="flex items-center justify-between pt-1">
                              <button
                                onClick={() => markInquiryAsRead(inq.id)}
                                className="text-[10px] font-semibold text-[#B79A72] hover:text-[#392820] cursor-pointer"
                              >
                                {inq.read ? 'Mark Unread' : 'Mark as Read'}
                              </button>

                              <div className="flex items-center gap-2">
                                <a
                                  href={`https://wa.me/${inq.phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded-full bg-[#25D366] text-white text-[10px] font-semibold hover:bg-[#20bd5a] transition-colors inline-flex items-center gap-1"
                                >
                                  <WhatsAppIcon className="w-2.5 h-2.5 fill-current" /> Reply
                                </a>
                                <button
                                  onClick={() => deleteInquiry(inq.id)}
                                  className="p-1 text-[#735D50] hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Delete Message"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="pt-2 border-t border-[#F8F5F0] flex items-center justify-between">
                      <button
                        onClick={() => {
                          setIsInquiriesOpen(false);
                          setActiveTab('inquiries');
                        }}
                        className="text-xs text-[#392820] font-semibold hover:text-[#B79A72] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open Full Inquiries Workspace</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Link
              href="/"
              target="_blank"
              className="px-4 py-2 rounded-full border border-[#392820] text-xs font-semibold text-[#392820] hover:bg-[#392820] hover:text-white transition-colors"
            >
              Live Storefront &rarr;
            </Link>
            <button
              onClick={() => {
                logout();
                router.push('/admin/login');
              }}
              className="px-4 py-2 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedbackMsg && (
          <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-sm">
            <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E8DCCB]">
          {[
            { key: 'overview', label: 'Overview', icon: LayoutDashboard },
            { key: 'products', label: `Products (${products.length})`, icon: Package },
            { key: 'offers', label: `Offers & Festivals (${festivalOffers.length})`, icon: Flame },
            { key: 'inventory', label: 'Stock Matrix', icon: Layers },
            { key: 'orders', label: 'Customer Orders', icon: ShoppingBag },
            { key: 'discounts', label: `Coupons (${coupons.length})`, icon: Tag },
            { key: 'inquiries', label: `Inquiries (${realInquiries.length})`, icon: MessageSquare, badge: realUnreadCount },
            { key: 'settings', label: 'Store Configurations', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as AdminTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap relative cursor-pointer ${
                  isActive
                    ? 'bg-[#392820] text-white shadow-sm'
                    : 'bg-white text-[#735D50] hover:text-[#392820] hover:bg-[#FAF7F2] border border-[#E8DCCB]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-[#E8DCCB] shadow-xs space-y-2">
                <span className="text-xs uppercase tracking-wider text-[#735D50]">Gross Revenue</span>
                <p className="font-serif text-3xl text-[#392820] font-semibold">
                  {formatPrice(ordersList.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0))}
                </p>
                <span className="text-[11px] text-emerald-700 font-medium">Real-time live orders</span>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-[#E8DCCB] shadow-xs space-y-2">
                <span className="text-xs uppercase tracking-wider text-[#735D50]">Active Catalog</span>
                <p className="font-serif text-3xl text-[#392820] font-semibold">{products.length}</p>
                <span className="text-[11px] text-[#B79A72] font-medium">Co-ord Sets, Kurtas &amp; Sarees</span>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-[#E8DCCB] shadow-xs space-y-2">
                <span className="text-xs uppercase tracking-wider text-[#735D50]">Processed Orders</span>
                <p className="font-serif text-3xl text-[#392820] font-semibold">{ordersList.length}</p>
                <span className="text-[11px] text-emerald-700 font-medium">Live customer pipeline</span>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-[#E8DCCB] shadow-xs space-y-2">
                <span className="text-xs uppercase tracking-wider text-[#735D50]">Active Festival Offers</span>
                <p className="font-serif text-3xl text-[#D9A08C] font-semibold">{festivalOffers.filter(o => o.isActive).length}</p>
                <span className="text-[11px] text-[#B79A72] font-medium">Live on Storefront</span>
              </div>
            </div>

            {/* Quick Action Station */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8DCCB] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg text-[#392820] font-medium">
                  Instant Administrative Actions
                </h3>
                <span className="text-xs text-[#735D50]">Direct website update triggers</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    resetNewProductForm();
                    setIsAddProductOpen(true);
                    setActiveTab('products');
                  }}
                  className="p-4 rounded-2xl bg-[#FAF7F2] hover:bg-[#E8DCCB]/60 border border-[#E8DCCB] text-left transition-all group flex items-start gap-3"
                >
                  <div className="p-2.5 rounded-xl bg-[#392820] text-white">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#392820]">
                      + Post New Attire
                    </h4>
                    <p className="text-[11px] text-[#735D50] mt-0.5">
                      Add a new Co-ord, Kurta or Saree with custom photos and pricing.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsNewOfferOpen(true);
                    setActiveTab('offers');
                  }}
                  className="p-4 rounded-2xl bg-[#FAF7F2] hover:bg-[#E8DCCB]/60 border border-[#E8DCCB] text-left transition-all group flex items-start gap-3"
                >
                  <div className="p-2.5 rounded-xl bg-[#D9A08C] text-[#231813]">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#392820]">
                      + Launch Festival Offer
                    </h4>
                    <p className="text-[11px] text-[#735D50] mt-0.5">
                      Publish Diwali/celebration discounts, banners &amp; vouchers.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    if (confirm('Reset product catalog back to factory demo products? Any custom additions will be reverted.')) {
                      resetCatalog();
                      showNotification('Catalog restored to default demo attire.');
                    }
                  }}
                  className="p-4 rounded-2xl bg-[#FAF7F2] hover:bg-rose-50 border border-[#E8DCCB] text-left transition-all group flex items-start gap-3"
                >
                  <div className="p-2.5 rounded-xl bg-[#735D50] text-white">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#392820]">
                      Reset Catalog
                    </h4>
                    <p className="text-[11px] text-[#735D50] mt-0.5">
                      Restore default curated boutique collection with 1 click.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Supabase PostgreSQL Database & Architecture Status Console */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8DCCB] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F8F5F0]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#392820] text-[#D9A08C] flex items-center justify-center shadow-xs">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-[#392820] font-medium flex items-center gap-2">
                      <span>PostgreSQL Database &amp; Cloud Architecture</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        dbHealth?.supabase?.connected
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {dbHealth?.supabase?.connected ? 'Live DB Active' : 'Demo Local Mode'}
                      </span>
                    </h3>
                    <p className="text-xs text-[#735D50]">
                      16 Core Relational Entities &bull; Row Level Security &bull; Server-Controlled Checkout
                    </p>
                  </div>
                </div>

                <button
                  onClick={testDatabaseConnection}
                  disabled={isTestingDb}
                  className="px-4 py-2 rounded-full bg-[#FAF7F2] hover:bg-[#E8DCCB] text-[#392820] border border-[#E8DCCB] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin' : ''}`} />
                  <span>{isTestingDb ? 'Testing Connection...' : 'Test Database Connection'}</span>
                </button>
              </div>

              {/* Diagnostic Results Box */}
              {dbHealth && (
                <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  dbHealth.supabase?.connected
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/80 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-center justify-between font-semibold">
                    <span>Diagnostic Result: {dbHealth.supabase?.message}</span>
                    <span className="font-mono text-[10px] opacity-75">{dbHealth.timestamp?.slice(11, 19)}</span>
                  </div>
                  {dbHealth.supabase?.tablesVerified && (
                    <p className="text-[11px] opacity-90">
                      Verified Tables: {dbHealth.supabase.tablesVerified.join(', ')} &bull; Products: {dbHealth.supabase.productsCount} &bull; Categories: {dbHealth.supabase.categoriesCount}
                    </p>
                  )}
                  {dbHealth.supabase?.error && (
                    <p className="font-mono text-[10px] text-red-700 bg-red-100/50 p-2 rounded-lg">
                      {dbHealth.supabase.error}
                    </p>
                  )}
                </div>
              )}

              {/* Database Architecture Entities Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8DCCB]/70 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-[#392820]">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Catalog Schema</span>
                  </div>
                  <p className="text-[11px] text-[#735D50]">categories, products, product_images, product_variants</p>
                </div>

                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8DCCB]/70 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-[#392820]">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Customer Data</span>
                  </div>
                  <p className="text-[11px] text-[#735D50]">profiles, addresses, carts, cart_items, wishlists</p>
                </div>

                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8DCCB]/70 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-[#392820]">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Orders &amp; Auditing</span>
                  </div>
                  <p className="text-[11px] text-[#735D50]">orders, order_items, payments, inventory_movements</p>
                </div>

                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8DCCB]/70 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-[#392820]">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Security &amp; RLS</span>
                  </div>
                  <p className="text-[11px] text-[#735D50]">admin_roles, coupons, reviews, Storage policies</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS MANAGER (FULL CRUD & PRICING) */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            
            {/* Toolbar: Search, Filter, Add */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-[#E8DCCB]">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-[#735D50] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search by title, SKU, or fabric..."
                    className="w-full pl-9 pr-4 py-2 rounded-full border border-[#E8DCCB] text-xs text-[#392820] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D9A08C]"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {[
                    { key: 'all', label: `All (${products.length})` },
                    { key: 'new-arrivals', label: `★ New (${products.filter((p) => p.isNewArrival).length})` },
                    { key: 'co-ord-sets', label: 'Co-ord Sets' },
                    { key: 'kurtas', label: 'Kurtas' },
                    { key: 'sarees', label: 'Sarees' },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setCategoryFilter(cat.key as any)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                        categoryFilter === cat.key
                          ? 'bg-[#392820] text-white shadow-xs'
                          : 'bg-[#FAF7F2] text-[#735D50] hover:text-[#392820]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    resetNewProductForm();
                    setIsAddProductOpen(true);
                  }}
                  className="px-4 py-2 rounded-full bg-[#392820] text-white text-xs font-semibold hover:bg-[#111111] transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4 text-[#D9A08C]" />
                  <span>+ Post New Product</span>
                </button>
              </div>
            </div>

            {/* Product Table */}
            <div className="bg-white rounded-3xl border border-[#E8DCCB] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] border-b border-[#E8DCCB] text-[#735D50] uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Attire &amp; Photo</th>
                      <th className="p-4">Category &amp; Occasion</th>
                      <th className="p-4">Price (₹ INR)</th>
                      <th className="p-4">Stock Status</th>
                      <th className="p-4">Tags</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DCCB]">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              onClick={() => setMediaModalProduct(p)}
                              className="relative w-12 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-[#E8DCCB] cursor-pointer group/thumb hover:border-[#392820] shadow-2xs transition-all"
                              title="Click to view & manage all images"
                            >
                              <Image
                                src={p.images[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80'}
                                alt={p.name}
                                fill
                                className="object-cover group-hover/thumb:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-white" />
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#392820] text-sm truncate max-w-[200px]">{p.name}</p>
                              <p className="text-[11px] text-[#735D50]">{p.fabric}</p>
                              
                              {/* Photos & Colors accessible row */}
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  type="button"
                                  onClick={() => setMediaModalProduct(p)}
                                  className="text-[10px] font-semibold text-[#392820] hover:text-[#D9A08C] bg-[#FAF7F2] hover:bg-[#E8D6C7]/50 border border-[#E8DCCB] px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Manage multiple images & color links"
                                >
                                  <ImageIcon className="w-3 h-3 text-[#D9A08C]" />
                                  <span>{p.images?.length || 1} Photos</span>
                                </button>

                                {p.colors && p.colors.length > 0 && (
                                  <div className="flex items-center gap-1" title={`${p.colors.length} color variants`}>
                                    {p.colors.slice(0, 4).map((c) => (
                                      <span
                                        key={c.name}
                                        title={`${c.name} (${c.hex})`}
                                        className="w-2.5 h-2.5 rounded-full border border-black/20"
                                        style={{ backgroundColor: c.hex }}
                                      />
                                    ))}
                                    {p.colors.length > 4 && (
                                      <span className="text-[9px] text-[#735D50]">+{p.colors.length - 4}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E8DCCB] text-[#392820] font-medium capitalize">
                            {p.category.replace('-', ' ')}
                          </span>
                          <p className="text-[11px] text-[#735D50] mt-1">{p.occasion}</p>
                        </td>

                        <td className="p-4">
                          {quickPriceId === p.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                autoFocus
                                value={quickPriceValue}
                                onChange={(e) => setQuickPriceValue(e.target.value)}
                                className="w-20 px-2 py-1 border border-[#D9A08C] rounded-lg text-xs font-semibold focus:outline-none"
                              />
                              <button
                                onClick={() => {
                                  if (Number(quickPriceValue) > 0) {
                                    quickUpdatePrice(p.id, Number(quickPriceValue));
                                    showNotification(`Updated price of ${p.name} to ₹${quickPriceValue}`);
                                  }
                                  setQuickPriceId(null);
                                }}
                                className="p-1 rounded bg-emerald-600 text-white"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setQuickPriceId(null)}
                                className="p-1 rounded bg-gray-200 text-gray-700"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setQuickPriceId(p.id);
                                setQuickPriceValue(p.price.toString());
                              }}
                              className="cursor-pointer group flex items-center gap-1"
                              title="Click to quickly edit price"
                            >
                              <span className="font-semibold text-[#392820] text-sm">
                                {formatPrice(p.price)}
                              </span>
                              <span className="text-[10px] text-[#735D50] line-through">
                                {formatPrice(p.originalPrice)}
                              </span>
                              <Edit2 className="w-3 h-3 text-[#D9A08C] opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <button
                            onClick={() => {
                              quickUpdateStock(p.id, !p.inStock);
                              showNotification(`Stock toggled for ${p.name}`);
                            }}
                            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                              p.inStock
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {p.inStock ? '● In Stock' : '○ Out of Stock'}
                          </button>
                        </td>

                        <td className="p-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                toggleProductNewArrival(p.id);
                                showNotification(`New Arrival status updated for ${p.name}`);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all border cursor-pointer ${
                                p.isNewArrival
                                  ? 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
                                  : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                              }`}
                              title="Click to toggle New Arrival status"
                            >
                              {p.isNewArrival ? '★ New Arrival' : '+ Tag New'}
                            </button>
                            {p.isBestSeller && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
                                Bestseller
                              </span>
                            )}
                            {p.isFeatured && (
                              <span className="px-1.5 py-0.5 rounded bg-[#FAF7F2] text-[#B79A72] border border-[#E8DCCB] text-[10px] font-semibold">
                                Featured
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setMediaModalProduct(p)}
                              className="p-1.5 rounded-lg border border-[#E8DCCB] text-[#392820] hover:bg-[#FAF7F2] hover:border-[#D9A08C] transition-colors"
                              title="Access & manage multiple photos & color shades"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-[#D9A08C]" />
                            </button>
                            <button
                              onClick={() => {
                                const pSizes = p.sizes && p.sizes.length > 0 ? p.sizes : (p.category === 'sarees' ? [{ size: 'Free Size' as ProductSize, inStock: true, stockCount: 15 }] : DEFAULT_SIZE_LIST);
                                const finalPSizes = p.category === 'sarees' && !pSizes.some(s => s.size === 'Free Size')
                                  ? [{ size: 'Free Size' as ProductSize, inStock: true, stockCount: 15 }, ...pSizes]
                                  : pSizes;
                                const pColors = p.colors && p.colors.length > 0 ? p.colors : [];
                                setEditingProduct({
                                  ...p,
                                  sizes: finalPSizes,
                                  colors: pColors,
                                  fabric: p.fabric || 'Regular Pure Cotton',
                                });
                              }}
                              className="p-1.5 rounded-lg border border-[#E8DCCB] text-[#392820] hover:bg-[#FAF7F2] transition-colors"
                              title="Edit all product details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <Link
                              href={`/products/${p.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-lg border border-[#E8DCCB] text-[#735D50] hover:bg-[#FAF7F2] transition-colors"
                              title="Preview on Storefront"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => {
                                if (confirm(`Remove "${p.name}" from active catalog?`)) {
                                  deleteProduct(p.id);
                                  showNotification(`Product "${p.name}" deleted.`);
                                }
                              }}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FESTIVAL OFFERS & FLASH SALES MANAGER */}
        {activeTab === 'offers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8DCCB]">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#D9A08C] font-semibold">
                  Promotional Broadcast Station
                </span>
                <h3 className="font-serif text-xl text-[#392820] font-medium mt-0.5">
                  Festival Offers, Banners &amp; Flash Sales
                </h3>
                <p className="text-xs text-[#735D50] mt-1">
                  Post celebration edits, festive banners, and storewide discounts that appear live on customer screens.
                </p>
              </div>

              <button
                onClick={() => setIsNewOfferOpen(true)}
                className="px-5 py-2.5 rounded-full bg-[#D9A08C] text-[#231813] font-bold text-xs uppercase tracking-wider hover:bg-white border border-[#D9A08C] transition-all shadow-sm flex items-center gap-2"
              >
                <Flame className="w-4 h-4" />
                <span>+ Post New Festival Offer</span>
              </button>
            </div>

            {/* Active Festival Offers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {festivalOffers.map((offer) => (
                <div
                  key={offer.id}
                  className={`rounded-3xl p-6 border transition-all ${
                    offer.isActive
                      ? 'bg-gradient-to-br from-[#392820] to-[#231813] text-white border-[#D9A08C]/40 shadow-xl'
                      : 'bg-white text-[#735D50] border-[#E8DCCB] opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#D9A08C] text-[#231813]">
                      {offer.badge}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          toggleFestivalOffer(offer.id);
                          showNotification(`Offer status toggled.`);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          offer.isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {offer.isActive ? '● Live on Store' : '○ Paused'}
                      </button>
                      <button
                        onClick={() => {
                          deleteFestivalOffer(offer.id);
                          showNotification('Festival offer removed.');
                        }}
                        className="p-1 rounded-lg text-rose-400 hover:text-rose-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-serif text-2xl font-medium mb-1 text-[#E8D6C7]">
                    {offer.title}
                  </h4>
                  <p className="text-xs text-white/80 leading-relaxed mb-4">
                    {offer.subtitle}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-[#D9A08C] block">Coupon Voucher</span>
                      <span className="font-mono font-bold text-white text-sm">{offer.couponCode}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-[#D9A08C] block">Savings</span>
                      <span className="font-semibold text-emerald-400">{offer.discountPercentage}% Off</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-[#D9A08C] block">Target Category</span>
                      <span className="font-semibold capitalize text-white">{offer.targetCategory}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Announcement Ticker Editor */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8DCCB] space-y-4">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#D9A08C]" />
                <h4 className="font-serif text-lg text-[#392820] font-medium">
                  Header Top Announcement Ticker
                </h4>
              </div>
              <p className="text-xs text-[#735D50]">
                Customize the high-priority messages that rotate at the very top of the website navbar:
              </p>

              <form onSubmit={handleAddAnnouncementMsg} className="flex gap-2">
                <input
                  type="text"
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                  placeholder="e.g. 🪷 DIWALI SALE: Flat 25% Off on all Kurtas with code FESTIVE25"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8DCCB] text-xs text-[#392820] bg-[#FAF7F2] focus:bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#392820] text-white text-xs font-semibold hover:bg-[#111111] transition-colors"
                >
                  + Add Ticker Notice
                </button>
              </form>

              <div className="space-y-2 pt-2">
                {storeSettings.announcementMessages.map((msg, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DCCB] text-xs text-[#392820]">
                    <span>{msg}</span>
                    <button
                      onClick={() => {
                        const updated = storeSettings.announcementMessages.filter((_, i) => i !== idx);
                        updateStoreSettings({ announcementMessages: updated });
                        showNotification('Announcement removed.');
                      }}
                      className="text-rose-600 hover:text-rose-800 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INVENTORY MATRIX (WITH MULTI-COLOR STOCK BREAKDOWN) */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-3xl p-6 border border-[#E8DCCB] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E8DCCB]/60">
              <div>
                <h3 className="font-serif text-lg text-[#392820] font-medium">
                  Size &amp; Stock Availability Matrix (Color Shades Inventory)
                </h3>
                <p className="text-xs text-[#735D50]">
                  Manage real-time inventory counts across XS to XXL sizes. For products with multiple colors, expand color stocks to manage each color shade independently.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#735D50] flex-wrap">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> &gt; 5 in stock
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 1&ndash;5 low stock
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> 0 sold out
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#E8DCCB] text-[#735D50]">
                  <tr>
                    <th className="p-3">Attire &amp; Color Variants</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-center">XS</th>
                    <th className="p-3 text-center">S</th>
                    <th className="p-3 text-center">M</th>
                    <th className="p-3 text-center">L</th>
                    <th className="p-3 text-center">XL</th>
                    <th className="p-3 text-center">XXL</th>
                    <th className="p-3 text-center">Total Stock</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DCCB]">
                  {products.map((p) => {
                    const hasMultipleColors = Boolean(p.colors && p.colors.length > 1);
                    const isCollapsed = collapsedColorStockMap[p.id] === true; // Default expanded!
                    const totalUnits = (p.sizes || []).reduce((sum, s) => sum + (s.stockCount || 0), 0);

                    return (
                      <React.Fragment key={p.id}>
                        {/* Parent Product Row */}
                        <tr className={`transition-colors ${hasMultipleColors ? 'bg-[#FAF7F2]/40 font-medium' : 'hover:bg-[#FAF7F2]/50'}`}>
                          <td className="p-3 font-semibold text-[#392820] min-w-[230px]">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span>{p.name}</span>
                              </div>
                              {hasMultipleColors && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => toggleColorStockCollapse(p.id)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#E8DCCB] text-[10px] font-semibold text-[#392820] hover:border-[#392820] hover:bg-[#FAF7F2] transition-colors cursor-pointer shadow-2xs"
                                    title="Click to toggle color-wise inventory breakdown"
                                  >
                                    <Palette className="w-3 h-3 text-[#D9A08C]" />
                                    <span>{p.colors.length} Colors</span>
                                    <span className="text-[#B79A72] font-mono text-[9px]">
                                      {isCollapsed ? '▸ Show Color Stocks' : '▾ Hide Color Stocks'}
                                    </span>
                                  </button>
                                  <div className="flex items-center -space-x-1">
                                    {p.colors.map((c) => (
                                      <span
                                        key={c.name}
                                        className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                                        style={{ backgroundColor: c.hex }}
                                        title={c.name}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-[#735D50] capitalize whitespace-nowrap">
                            {p.category.replace('-', ' ')}
                            {hasMultipleColors && (
                              <span className="block text-[10px] text-[#B79A72] font-medium">All Shades Total</span>
                            )}
                          </td>
                          {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => {
                            const sizeObj = p.sizes?.find((s) => s.size.toLowerCase() === sz.toLowerCase());
                            const count = sizeObj?.stockCount !== undefined ? sizeObj.stockCount : 10;
                            return (
                              <td key={sz} className="p-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="9999"
                                  value={count}
                                  onChange={(e) => handleStockCountChange(p.id, sz, parseInt(e.target.value))}
                                  className={`w-14 sm:w-16 px-1.5 py-1 text-center font-mono text-xs font-bold rounded-lg border outline-none transition-all ${
                                    count > 5
                                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500'
                                      : count > 0
                                      ? 'bg-amber-50 text-amber-900 border-amber-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
                                      : 'bg-rose-50 text-rose-700 border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                                  }`}
                                  title={hasMultipleColors ? `Total across all shades for ${sz}` : `Stock count for ${sz}`}
                                />
                              </td>
                            );
                          })}
                          <td className="p-3 text-center font-mono font-bold text-[#392820] whitespace-nowrap">
                            {totalUnits} pcs
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => quickUpdateStock(p.id, !p.inStock)}
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition-all hover:scale-105 ${
                                p.inStock
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              }`}
                              title="Click to toggle In Stock / Sold Out"
                            >
                              {p.inStock ? 'In Stock' : 'Sold Out'}
                            </button>
                          </td>
                        </tr>

                        {/* Color-Specific Stock Breakdown Sub-Rows */}
                        {hasMultipleColors && !isCollapsed && (
                          p.colors.map((col, cIdx) => {
                            const colSizes = col.sizes && col.sizes.length > 0 ? col.sizes : p.sizes;
                            const colTotal = ['XS', 'S', 'M', 'L', 'XL', 'XXL'].reduce((sum, sz) => {
                              const sObj = colSizes?.find((s) => s.size.toLowerCase() === sz.toLowerCase());
                              return sum + (sObj?.stockCount !== undefined ? sObj.stockCount : 0);
                            }, 0);
                            const isColorInStock = colTotal > 0;

                            return (
                              <tr
                                key={`${p.id}-${col.name}`}
                                className="bg-[#FFFDF9] hover:bg-amber-50/40 border-l-4 border-l-[#D9A08C] transition-colors"
                              >
                                <td className="p-2.5 pl-6">
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-[#B79A72] font-mono text-xs font-bold">↳</span>
                                    <span
                                      className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                                      style={{ backgroundColor: col.hex }}
                                    />
                                    {col.image && (
                                      <div className="relative w-7 h-9 rounded-md overflow-hidden border border-[#E8DCCB] shrink-0 bg-gray-100 shadow-2xs">
                                        <Image src={col.image} alt={col.name} fill className="object-cover" />
                                      </div>
                                    )}
                                    <div>
                                      <span className="font-semibold text-xs text-[#392820] flex items-center gap-1.5">
                                        <span>{col.name}</span>
                                        <span className="text-[9px] font-mono text-[#735D50] font-normal">({col.hex})</span>
                                      </span>
                                      <span className="text-[10px] text-[#B79A72] block">
                                        Shade #{cIdx + 1}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-2.5 text-[#735D50] whitespace-nowrap">
                                  <span className="text-[10px] font-semibold text-[#8C6D58] uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-[#E8DCCB]">
                                    Color Stock
                                  </span>
                                </td>
                                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => {
                                  const sObj = colSizes?.find((s) => s.size.toLowerCase() === sz.toLowerCase());
                                  const count = sObj?.stockCount !== undefined ? sObj.stockCount : 0;
                                  return (
                                    <td key={sz} className="p-2 text-center">
                                      <input
                                        type="number"
                                        min="0"
                                        max="9999"
                                        value={count}
                                        onChange={(e) => handleColorStockCountChange(p.id, col.name, sz, parseInt(e.target.value))}
                                        className={`w-14 sm:w-16 px-1.5 py-1 text-center font-mono text-xs font-bold rounded-lg border outline-none transition-all ${
                                          count > 5
                                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500'
                                            : count > 0
                                            ? 'bg-amber-50 text-amber-900 border-amber-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
                                            : 'bg-rose-50 text-rose-700 border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                                        }`}
                                        title={`Edit ${col.name} stock count for size ${sz}`}
                                      />
                                    </td>
                                  );
                                })}
                                <td className="p-2.5 text-center font-mono font-bold text-[#392820] whitespace-nowrap">
                                  {colTotal} pcs
                                </td>
                                <td className="p-2.5 text-center whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleColorStock(p.id, col.name, isColorInStock)}
                                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer transition-all hover:scale-105 ${
                                      isColorInStock
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                                        : 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                                    }`}
                                    title={`Toggle stock for ${col.name}`}
                                  >
                                    {isColorInStock ? `${col.name} In Stock` : `${col.name} Sold Out`}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: ORDERS PROCESSING */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl p-6 border border-[#E8DCCB] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8DCCB]">
              <div>
                <h3 className="font-serif text-lg text-[#392820] font-medium">
                  Boutique Customer Orders Pipeline
                </h3>
                <p className="text-xs text-[#735D50]">
                  Manage real-time order fulfillment status: Confirmed Order, Shipped, and Delivered.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCreateSampleOrder}
                  disabled={ordersLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#392820] hover:bg-[#111111] text-xs font-semibold text-[#FAF7F2] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  title="Generate a sample test order to test live fulfillment pipeline"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D9A08C]" />
                  <span>+ Place Test Order</span>
                </button>
                <button
                  type="button"
                  onClick={fetchAdminOrders}
                  disabled={ordersLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2] hover:bg-white text-xs font-semibold text-[#392820] cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Orders ({ordersList.length})</span>
                </button>
                {ordersList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllOrders}
                    disabled={ordersLoading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                    title="Remove all demo orders"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Clear Orders</span>
                  </button>
                )}
              </div>
            </div>

            {ordersLoading && ordersList.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#735D50] animate-pulse space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D9A08C]" />
                <p>Fetching live boutique orders...</p>
              </div>
            ) : ordersList.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#735D50] border-2 border-dashed border-[#E8DCCB] rounded-2xl space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#FAF7F2] text-[#D9A08C] flex items-center justify-center mx-auto border border-[#E8DCCB]">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-[#392820]">No Orders In Pipeline Yet</p>
                  <p className="max-w-md mx-auto leading-relaxed text-[#735D50]">
                    No orders have been recorded in the boutique database yet. Place an order on the storefront or click below to generate a test order.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateSampleOrder}
                  disabled={ordersLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#392820] text-white font-semibold text-xs hover:bg-[#111111] transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4 text-[#D9A08C]" />
                  <span>Generate Sample Test Order</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {ordersList.map((order) => {
                  const orderRef = order.order_number || order.id;
                  const customerName = order.shipping_address_snapshot?.fullName || 'Customer';
                  const city = order.shipping_address_snapshot?.city || 'India';
                  const phone = order.shipping_address_snapshot?.phone || '';
                  const currentStatus = (order.order_status || 'confirmed').toLowerCase();
                  const isUpdating = updatingOrderId === (order.id || order.order_number);

                  const itemsSummary =
                    (order.items || order.order_items || [])
                      .map((i: any) => `${i.product_name_snapshot || i.name || 'Garment'} (${i.size_snapshot || i.size || 'M'}) x${i.quantity}`)
                      .join(', ') || 'Boutique Apparel';

                  const dateStr = order.created_at
                    ? new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent';

                  return (
                    <div
                      key={order.id || order.order_number}
                      className="p-5 rounded-2xl border border-[#E8DCCB] bg-[#FAF7F2]/40 hover:bg-[#FAF7F2]/80 flex flex-col gap-4 text-xs hover:border-[#D9A08C] transition-all"
                    >
                      {/* Top Header of Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-[#392820] bg-white px-2.5 py-1 rounded-lg border border-[#E8DCCB] text-xs">
                            #{orderRef}
                          </span>
                          <span className="text-[#B79A72]">&bull;</span>
                          <span className="font-semibold text-sm text-[#392820]">{customerName}</span>
                          {phone && (
                            <span className="text-[11px] text-[#735D50]">
                              +91 {phone}
                            </span>
                          )}
                          <span className="text-[#735D50]">({city})</span>
                          <span className="text-[10px] text-[#735D50] bg-white px-2 py-0.5 rounded-full border border-[#E8DCCB]">
                            {order.payment_method?.toUpperCase()} &bull; {order.payment_status}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs ${
                              currentStatus === 'delivered'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : currentStatus === 'shipped'
                                ? 'bg-blue-100 text-blue-900 border-blue-300'
                                : currentStatus === 'packed'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : currentStatus === 'cancelled'
                                ? 'bg-rose-100 text-rose-900 border-rose-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            }`}
                          >
                            {currentStatus === 'delivered' ? (
                              <>
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Delivered</span>
                              </>
                            ) : currentStatus === 'shipped' ? (
                              <>
                                <Truck className="w-3.5 h-3.5 text-blue-700" />
                                <span>Shipped</span>
                              </>
                            ) : currentStatus === 'packed' ? (
                              <>
                                <Package className="w-3.5 h-3.5 text-amber-700" />
                                <span>Atelier Packed</span>
                              </>
                            ) : currentStatus === 'cancelled' ? (
                              <>
                                <X className="w-3.5 h-3.5 text-rose-700" />
                                <span>Cancelled</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Confirmed Order</span>
                              </>
                            )}
                          </span>

                          <Link
                            href={`/profile/orders/${orderRef}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E8DCCB] bg-white hover:bg-[#FAF7F2] text-[#735D50] hover:text-[#392820] text-[11px] font-semibold transition-colors"
                            title="Inspect live customer tracking page"
                          >
                            <span>Customer View</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleDeleteOrder(order.id || order.order_number)}
                            className="p-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                            title="Delete / Remove this order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Items & Date Summary */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#735D50] pt-1 border-t border-[#E8DCCB]/50">
                        <p className="text-[11px] text-[#392820] font-medium leading-relaxed">
                          {itemsSummary}
                        </p>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[11px] text-[#735D50]">{dateStr}</span>
                          <span className="font-serif text-base font-bold text-[#392820]">
                            {formatPrice(order.total_amount)}
                          </span>
                        </div>
                      </div>

                      {/* Status Control Actions */}
                      <div className="pt-2 border-t border-[#E8DCCB]/60 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold text-[#735D50] uppercase tracking-wider mr-1">
                            Update Order Status:
                          </span>

                          {/* Quick Option 1: Confirmed Order */}
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateOrderStatus(order.id || order.order_number, 'confirmed')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                              currentStatus === 'confirmed'
                                ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-600'
                                : 'bg-white hover:bg-emerald-50 text-[#392820] border border-[#E8DCCB] hover:border-emerald-300'
                            } disabled:opacity-50`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirmed Order</span>
                          </button>

                          {/* Quick Option 2: Shipped */}
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateOrderStatus(order.id || order.order_number, 'shipped')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                              currentStatus === 'shipped'
                                ? 'bg-blue-700 text-white shadow-sm ring-2 ring-blue-600'
                                : 'bg-white hover:bg-blue-50 text-[#392820] border border-[#E8DCCB] hover:border-blue-300'
                            } disabled:opacity-50`}
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Shipped</span>
                          </button>

                          {/* Quick Option 3: Delivered */}
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateOrderStatus(order.id || order.order_number, 'delivered')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                              currentStatus === 'delivered'
                                ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-700'
                                : 'bg-white hover:bg-emerald-50 text-[#392820] border border-[#E8DCCB] hover:border-emerald-400'
                            } disabled:opacity-50`}
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Delivered</span>
                          </button>

                          {/* Dropdown for All Status Options */}
                          <select
                            value={currentStatus}
                            disabled={isUpdating}
                            onChange={(e) => handleUpdateOrderStatus(order.id || order.order_number, e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-[#E8DCCB] bg-white text-xs font-semibold text-[#392820] cursor-pointer focus:ring-2 focus:ring-[#D9A08C]"
                          >
                            <option value="confirmed">Confirmed Order</option>
                            <option value="packed">Atelier Packed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        {/* Spinner while updating */}
                        {isUpdating && (
                          <div className="flex items-center gap-1.5 text-xs text-[#D9A08C] font-semibold animate-pulse">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Updating status...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: DISCOUNTS & COUPONS */}
        {activeTab === 'discounts' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Create Coupon Form */}
              <div className="bg-white p-6 rounded-3xl border border-[#E8DCCB] shadow-sm space-y-4">
                <h3 className="font-serif text-lg text-[#392820] font-medium">
                  Create Boutique Discount Voucher
                </h3>
                <form onSubmit={handleCreateCoupon} className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-[#735D50] font-semibold block mb-1">Coupon Code *</label>
                    <input
                      type="text"
                      required
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.replace(/\s+/g, ''))}
                      placeholder="e.g. SAVE100 or QWERTY"
                      className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2] uppercase font-mono font-bold text-sm tracking-wider"
                    />
                  </div>

                  {/* Discount Offer Type Selection */}
                  <div>
                    <label className="text-[#735D50] font-semibold block mb-1.5">Discount Offer Type *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCouponType('flat');
                          const val = couponVal || '100';
                          setCouponDiscount(`₹${val} Off`);
                        }}
                        className={`py-2 px-3 rounded-xl border text-left font-medium transition-all ${
                          couponType === 'flat'
                            ? 'border-[#392820] bg-[#392820] text-white shadow-sm'
                            : 'border-[#E8DCCB] bg-[#FAF7F2] text-[#735D50] hover:bg-[#F2ECE4]'
                        }`}
                      >
                        <span className="block font-bold text-xs">₹ Flat Price Off</span>
                        <span className={`text-[10px] block ${couponType === 'flat' ? 'text-amber-200' : 'text-[#8A7A70]'}`}>
                          e.g. Rs. 100 Off
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCouponType('percent');
                          const val = couponVal || '15';
                          setCouponDiscount(`${val}% Off`);
                        }}
                        className={`py-2 px-3 rounded-xl border text-left font-medium transition-all ${
                          couponType === 'percent'
                            ? 'border-[#392820] bg-[#392820] text-white shadow-sm'
                            : 'border-[#E8DCCB] bg-[#FAF7F2] text-[#735D50] hover:bg-[#F2ECE4]'
                        }`}
                      >
                        <span className="block font-bold text-xs">% Percentage Off</span>
                        <span className={`text-[10px] block ${couponType === 'percent' ? 'text-amber-200' : 'text-[#8A7A70]'}`}>
                          e.g. 20% Off
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#735D50] font-semibold block mb-1">
                        {couponType === 'flat' ? 'Value Number (₹ Rupees) *' : 'Value Number (% Percent) *'}
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={couponVal}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCouponVal(val);
                          setCouponDiscount(couponType === 'flat' ? `₹${val || '0'} Off` : `${val || '0'}% Off`);
                        }}
                        placeholder={couponType === 'flat' ? '100' : '20'}
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2] font-semibold text-sm"
                      />
                      <p className="text-[10px] text-[#8A7A70] mt-1 leading-tight">
                        {couponType === 'flat'
                          ? 'Deducts exact Rs. 100 from total.'
                          : 'Deducts 20% from total.'}
                      </p>
                    </div>

                    <div>
                      <label className="text-[#735D50] font-semibold block mb-1">Min Order (₹)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={couponMinOrder}
                        onChange={(e) => setCouponMinOrder(e.target.value)}
                        placeholder="0 for no minimum"
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]"
                      />
                      <p className="text-[10px] text-[#8A7A70] mt-1 leading-tight">
                        Min cart amount (0 for no limit).
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-[#735D50] font-semibold block mb-1">Discount Label (Badge)</label>
                    <input
                      type="text"
                      required
                      value={couponDiscount}
                      onChange={(e) => setCouponDiscount(e.target.value)}
                      placeholder={couponType === 'flat' ? '₹100 Off or Rs. 100 Off' : '20% Off'}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]"
                    />
                    <p className="text-[10px] text-[#8A7A70] mt-1">
                      Text customers see in their bag (e.g. &ldquo;Rs. 100 Off&rdquo; or &ldquo;₹100 Off&rdquo;).
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-full bg-[#392820] text-white font-semibold text-xs tracking-wider uppercase hover:bg-[#111111] transition-colors mt-2"
                  >
                    + Activate Coupon
                  </button>
                </form>
              </div>

              {/* Coupons List */}
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#E8DCCB] shadow-sm space-y-4">
                <h3 className="font-serif text-lg text-[#392820] font-medium">
                  Active Discount Coupons
                </h3>
                <div className="space-y-3">
                  {coupons.map((c) => (
                    <div key={c.code} className="p-4 rounded-2xl border border-[#E8DCCB] bg-[#FAF7F2]/60 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#392820]">{c.code}</span>
                          <span className="px-2 py-0.5 rounded bg-[#D9A08C]/20 text-[#392820] font-semibold">
                            {c.discount}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#735D50] mt-1">
                          Min order: ₹{c.minOrderValue} &bull; Used: {c.usageCount} times
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            toggleCoupon(c.code);
                            showNotification(`Coupon ${c.code} status changed.`);
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            c.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {c.status}
                        </button>
                        <button
                          onClick={() => {
                            deleteCoupon(c.code);
                            showNotification(`Coupon ${c.code} deleted.`);
                          }}
                          className="p-1 rounded-lg text-rose-600 hover:text-rose-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 7: CUSTOMER INQUIRIES & MESSAGES */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8DCCB] shadow-xs">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#B79A72] font-semibold">
                  Customer Communications Desk
                </span>
                <h2 className="font-serif text-2xl text-[#392820] font-medium mt-1">
                  Inquiries &amp; Messages ({realInquiries.length})
                </h2>
                <p className="text-xs text-[#735D50]">
                  Real-time messages sent by visitors through the boutique contact form.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {realUnreadCount > 0 && (
                  <button
                    onClick={markAllInquiriesAsRead}
                    className="px-4 py-2 rounded-full bg-[#FAF7F2] text-[#392820] hover:bg-[#E8DCCB] border border-[#E8DCCB] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Mark All as Read ({realUnreadCount})
                  </button>
                )}
                {realInquiries.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to clear all inquiries?')) {
                        clearAllInquiries();
                        showNotification('All inquiries cleared.');
                      }
                    }}
                    className="px-3.5 py-2 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filters and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInquiryFilter('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    inquiryFilter === 'all'
                      ? 'bg-[#392820] text-white shadow-xs'
                      : 'bg-white text-[#735D50] border border-[#E8DCCB] hover:text-[#392820]'
                  }`}
                >
                  All Messages ({realInquiries.length})
                </button>
                <button
                  onClick={() => setInquiryFilter('unread')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    inquiryFilter === 'unread'
                      ? 'bg-[#392820] text-white shadow-xs'
                      : 'bg-white text-[#735D50] border border-[#E8DCCB] hover:text-[#392820]'
                  }`}
                >
                  <span>Unread</span>
                  {realUnreadCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {realUnreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setInquiryFilter('read')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    inquiryFilter === 'read'
                      ? 'bg-[#392820] text-white shadow-xs'
                      : 'bg-white text-[#735D50] border border-[#E8DCCB] hover:text-[#392820]'
                  }`}
                >
                  Read ({realInquiries.length - realUnreadCount})
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#735D50] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inquirySearch}
                  onChange={(e) => setInquirySearch(e.target.value)}
                  placeholder="Search inquiries..."
                  className="w-full bg-white border border-[#E8DCCB] pl-9 pr-4 py-1.5 rounded-full text-xs text-[#392820] placeholder-[#735D50]/60 outline-none focus:ring-1 focus:ring-[#B79A72]"
                />
              </div>
            </div>

            {/* Inquiries Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInquiries.length === 0 ? (
                <div className="col-span-1 md:col-span-2 text-center py-16 bg-white rounded-3xl border border-[#E8DCCB] space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#FAF7F2] text-[#D9A08C] flex items-center justify-center mx-auto border border-[#E8D6C7]">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif text-lg font-semibold text-[#392820]">
                    {realInquiries.length === 0 ? 'No Customer Inquiries Yet' : 'No messages match search'}
                  </h4>
                  <p className="text-xs text-[#735D50] max-w-sm mx-auto">
                    {realInquiries.length === 0
                      ? 'Real-time messages submitted by visitors through the boutique Contact form will appear here.'
                      : inquiryFilter === 'unread'
                      ? 'All customer messages have been read!'
                      : 'No messages match your search criteria.'}
                  </p>
                </div>
              ) : (
                filteredInquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className={`bg-white rounded-3xl p-6 border transition-all space-y-4 relative ${
                      !inq.read
                        ? 'border-[#D9A08C] ring-1 ring-[#D9A08C]/60 shadow-xs'
                        : 'border-[#E8DCCB] hover:border-[#D9A08C]'
                    }`}
                  >
                    {/* Header: Name, Unread Dot, Timestamp */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {!inq.read && (
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                          )}
                          <h3 className="font-serif text-lg font-semibold text-[#392820]">
                            {inq.name}
                          </h3>
                          {!inq.read && (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#735D50] font-mono">{inq.createdAt}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => markInquiryAsRead(inq.id)}
                          className="px-2.5 py-1 rounded-full border border-[#E8DCCB] text-[10px] font-semibold text-[#735D50] hover:text-[#392820] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                        >
                          {inq.read ? 'Mark Unread' : 'Mark as Read'}
                        </button>
                        <button
                          onClick={() => deleteInquiry(inq.id)}
                          className="p-1.5 rounded-full text-[#735D50] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Message"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Contact Badges */}
                    <div className="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-[#F8F5F0]">
                      <a
                        href={`https://wa.me/${inq.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all font-semibold border border-[#C8E6C9]"
                        title="Chat with customer on WhatsApp"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                        <span>{inq.phone}</span>
                      </a>
                      <a
                        href={`mailto:${inq.email}?subject=Nilora%20Trends%20Support`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] text-[#392820] hover:bg-[#E8DCCB] transition-colors font-medium border border-[#E8DCCB]"
                        title="Email customer"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#B79A72]" />
                        <span>{inq.email}</span>
                      </a>
                    </div>

                    {/* Message Box */}
                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DCCB]/60 text-xs text-[#392820] leading-relaxed">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#B79A72] block mb-1">
                        Customer Message
                      </span>
                      <p className="whitespace-pre-wrap">{inq.message}</p>
                    </div>

                    {/* Actions bar */}
                    <div className="pt-2 flex items-center justify-end gap-2">
                      <a
                        href={`https://wa.me/${inq.phone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(inq.name)},%20thank%20you%20for%20contacting%20Nilora%20Trends!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-1.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                        <span>Reply on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 8: STORE CONFIGURATIONS & RESET */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8DCCB] shadow-sm space-y-8">
            <div>
              <h3 className="font-serif text-xl text-[#392820] font-medium">
                Storewide Configurations &amp; Reset
              </h3>
              <p className="text-xs text-[#735D50] mt-1">
                Control boutique defaults, free delivery triggers, customer care details, and master reset.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#392820]">Free Shipping Threshold (₹ INR)</label>
                <input
                  type="number"
                  value={storeSettings.freeShippingThreshold}
                  onChange={(e) => updateStoreSettings({ freeShippingThreshold: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]"
                />
                <p className="text-[11px] text-[#735D50]">Orders equal to or above this amount receive free delivery.</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#392820]">Customer Helpline Phone</label>
                <input
                  type="text"
                  value={storeSettings.supportPhone}
                  onChange={(e) => updateStoreSettings({ supportPhone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#392820]">Customer Support Email</label>
                <input
                  type="email"
                  value={storeSettings.supportEmail}
                  onChange={(e) => updateStoreSettings({ supportEmail: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#392820]">Storewide Festival Mode</label>
                <button
                  type="button"
                  onClick={() => {
                    updateStoreSettings({ festivalMode: !storeSettings.festivalMode });
                    showNotification(`Festival mode ${!storeSettings.festivalMode ? 'activated' : 'deactivated'}.`);
                  }}
                  className={`w-full py-2.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                    storeSettings.festivalMode
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-[#D9A08C]" />
                  <span>{storeSettings.festivalMode ? 'Festive Mode Active' : 'Standard Mode'}</span>
                </button>
              </div>
            </div>

            {/* Search Price Rating Brackets Manager */}
            <div className="pt-6 border-t border-[#E8DCCB] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-serif text-base text-[#392820] font-semibold flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#D9A08C]" />
                    <span>Search Modal Price Filter Brackets</span>
                  </h4>
                  <p className="text-xs text-[#735D50] mt-0.5">
                    Customize the price rating brackets shown in the store header search drawer. Customers use these to filter budget tiers.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddPriceBracket}
                    className="px-3.5 py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#E8D6C7] text-[#392820] border border-[#E8DCCB] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D9A08C]" />
                    <span>+ Add Bracket</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPriceBrackets}
                    className="px-3.5 py-1.5 rounded-full text-xs text-[#735D50] hover:text-[#392820] hover:bg-[#FAF7F2] border border-[#E8DCCB] transition-all cursor-pointer"
                    title="Reset to ₹199-₹399, ₹399-₹799, ₹799+"
                  >
                    Reset Defaults
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {editingPriceRanges.map((tier, idx) => (
                  <div
                    key={tier.key || idx}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DCCB]"
                  >
                    <div className="flex-1 min-w-[140px] space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[#735D50]">Bracket Display Label</label>
                      <input
                        type="text"
                        value={tier.label}
                        onChange={(e) => handleUpdatePriceBracket(idx, 'label', e.target.value)}
                        placeholder="e.g. ₹199 – ₹399"
                        className="w-full px-3 py-1.5 rounded-xl border border-[#E8DCCB] bg-white text-xs text-[#392820] outline-none focus:ring-1 focus:ring-[#D9A08C]"
                      />
                    </div>
                    <div className="w-28 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[#735D50]">Min Price (₹)</label>
                      <input
                        type="number"
                        value={tier.min}
                        onChange={(e) => handleUpdatePriceBracket(idx, 'min', Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-xl border border-[#E8DCCB] bg-white text-xs text-[#392820] outline-none focus:ring-1 focus:ring-[#D9A08C]"
                      />
                    </div>
                    <div className="w-28 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[#735D50]">Max Price (₹)</label>
                      <input
                        type="number"
                        value={tier.max === Infinity ? 999999 : tier.max}
                        onChange={(e) => handleUpdatePriceBracket(idx, 'max', Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-xl border border-[#E8DCCB] bg-white text-xs text-[#392820] outline-none focus:ring-1 focus:ring-[#D9A08C]"
                      />
                    </div>
                    <div className="pt-4 flex items-center">
                      <button
                        type="button"
                        onClick={() => handleRemovePriceBracket(idx)}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete bracket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSavePriceBrackets}
                  className="px-6 py-2.5 rounded-full bg-[#392820] text-white hover:bg-[#111111] text-xs font-semibold uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  Save Search Price Brackets
                </button>
              </div>
            </div>

            {/* Master Factory Reset */}
            <div className="pt-6 border-t border-[#E8DCCB] space-y-3">
              <h4 className="font-serif text-base text-rose-800 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Master Store Reset</span>
              </h4>
              <p className="text-xs text-[#735D50]">
                Revert all modified products, customized festival offers, announcements, and vouchers back to default clean boutique settings.
              </p>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset all store data to factory defaults?')) {
                    resetAllStoreData();
                    showNotification('All boutique data reset to factory defaults.');
                  }
                }}
                className="px-5 py-2.5 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 text-xs font-semibold transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset All Store Data &amp; Catalog</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* MODAL: PRODUCT MEDIA & COLOR VARIANTS GALLERY */}
      {mediaModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 border border-[#E8DCCB] shadow-2xl space-y-6 my-8 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E8DCCB] pb-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#D9A08C] font-semibold flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Media Gallery &amp; Color Variants</span>
                </span>
                <h3 className="font-serif text-2xl text-[#392820] font-medium mt-0.5">
                  {mediaModalProduct.name}
                </h3>
                <p className="text-xs text-[#735D50]">
                  SKU: {mediaModalProduct.sku} &bull; Category: {mediaModalProduct.categoryLabel}
                </p>
              </div>
              <button
                onClick={() => setMediaModalProduct(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECTION 1: ALL PRODUCT IMAGES */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-serif text-lg text-[#392820] font-semibold">
                    Product Photographs ({mediaModalProduct.images.length})
                  </h4>
                  <p className="text-xs text-[#735D50]">
                    Manage multiple high-definition photos for this product. The first photo is used as the default cover.
                  </p>
                </div>
              </div>

              {/* Gallery Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mediaModalProduct.images.map((img, idx) => {
                  const isPrimary = idx === 0;
                  const primaryForColor = mediaModalProduct.colors?.find((c) => c.image === img);
                  const closeUpForColor = mediaModalProduct.colors?.find((c) => c.closeUpImage === img);
                  return (
                    <div
                      key={idx}
                      className={`relative rounded-2xl overflow-hidden border-2 bg-[#FAF7F2] p-2 flex flex-col justify-between group ${
                        isPrimary ? 'border-[#392820] shadow-sm' : 'border-[#E8DCCB]'
                      }`}
                    >
                      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-gray-100 mb-2">
                        <Image src={img} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                        {isPrimary && (
                          <span className="absolute top-2 left-2 bg-[#392820] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                            Primary Cover
                          </span>
                        )}
                        {closeUpForColor && (
                          <span
                            className="absolute top-2 right-2 bg-amber-900/90 text-amber-100 backdrop-blur-xs text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1 shadow-xs"
                            title={`Close-up / Swipe photo for ${closeUpForColor.name}`}
                          >
                            <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                            <span className="truncate max-w-[90px]">{closeUpForColor.name} &bull; Close-up</span>
                          </span>
                        )}
                        {primaryForColor && (
                          <span
                            className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs text-[#392820] text-[9px] font-semibold px-2 py-0.5 rounded-full border border-black/10 flex items-center gap-1 shadow-xs"
                            title={`Assigned as Full Look for ${primaryForColor.name}`}
                          >
                            <span
                              className="w-2 h-2 rounded-full border border-black/20"
                              style={{ backgroundColor: primaryForColor.hex }}
                            />
                            <span className="truncate max-w-[90px]">{primaryForColor.name} &bull; Full</span>
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-[#735D50]">
                          <span className="font-semibold">Photo #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(img);
                              showNotification('Image URL copied to clipboard!');
                            }}
                            className="text-[#B79A72] hover:underline flex items-center gap-0.5"
                            title="Copy image URL"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1 border-t border-[#E8DCCB]">
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              className="flex-1 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#392820] hover:text-white border border-[#E8DCCB] text-[10px] font-semibold text-[#392820] transition-colors"
                            >
                              Make Primary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImageFromProduct(idx)}
                            className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                            title="Delete this image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Step-by-Step Guide Banner */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-2 text-xs text-[#392820]">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>How to Post &amp; Link Photos Inside a Single Color (Max 2 Photos / Swipe Left Feature):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-amber-950/90 pl-1">
                  <li><strong>Upload your dress photographs</strong> using the direct device button below (select one or multiple images).</li>
                  <li>In the gallery above, tap <strong>&ldquo;Make Primary&rdquo;</strong> on the cover image you want customers to see first in catalogs.</li>
                  <li>Scroll down to <strong>&ldquo;Color Variants &amp; Photo Linkage&rdquo;</strong>: for each dress color (e.g. Teal Blue), you can attach <strong>up to 2 photos</strong>:
                    <ul className="list-disc list-inside pl-3 pt-1 space-y-0.5 text-amber-900">
                      <li><strong>Photo 1 (Full Dress Look):</strong> The complete head-to-toe dress view shown first.</li>
                      <li><strong>Photo 2 (Close-up / Design Detail):</strong> The zoomed-in embroidery or pattern shot. Customers <strong>swipe left</strong> on that dress to view it!</li>
                    </ul>
                  </li>
                  <li>You can either select from uploaded gallery photos or click <strong>&ldquo;Upload Close-up from Device&rdquo;</strong> directly under that color!</li>
                </ol>
              </div>

              {/* Add New Photograph: Direct Upload + URL Option */}
              <div className="p-4.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DCCB] space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#392820] flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-[#D9A08C]" />
                    <span>Upload Photograph from Device (Computer / Phone)</span>
                  </label>
                  <p className="text-[11px] text-[#735D50]">
                    Select high-resolution photos directly from your device. You can select multiple images at once.
                  </p>
                </div>

                {/* Direct File Upload Dropzone/Button */}
                <div>
                  <input
                    type="file"
                    id="media-gallery-upload-input"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    multiple
                    disabled={isUploadingPhoto}
                    onChange={handleUploadPhotoFiles}
                    className="hidden"
                  />
                  <label
                    htmlFor="media-gallery-upload-input"
                    className={`w-full py-4 px-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer ${
                      isUploadingPhoto
                        ? 'bg-amber-50/50 border-amber-300 cursor-not-allowed opacity-80'
                        : 'bg-white hover:bg-amber-50/30 border-[#D9A08C] hover:border-[#392820] shadow-xs'
                    }`}
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 className="w-6 h-6 text-amber-700 animate-spin" />
                        <span className="text-xs font-bold text-[#392820]">
                          Uploading photographs to boutique gallery...
                        </span>
                        <span className="text-[10px] text-[#735D50]">
                          Saving file and syncing to catalog database...
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-[#E8D6C7]/50 flex items-center justify-center text-[#392820]">
                          <UploadCloud className="w-5 h-5 text-[#392820]" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#392820] block">
                            Click to Choose Photos from Computer / Phone
                          </span>
                          <span className="text-[11px] text-[#735D50] block mt-0.5">
                            JPG, PNG, WEBP, or AVIF (Up to 15MB) &bull; Multiple files supported
                          </span>
                        </div>
                      </>
                    )}
                  </label>
                </div>

                {/* Upload Feedback */}
                {uploadSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{uploadSuccess}</span>
                  </div>
                )}

                {uploadError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Secondary Option: Image Web URL */}
                <div className="pt-2 border-t border-[#E8DCCB]/60 space-y-2">
                  <span className="text-[11px] font-semibold text-[#735D50] block">
                    Or Add via Image Web Link:
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={newGalleryImageUrl}
                      onChange={(e) => setNewGalleryImageUrl(e.target.value)}
                      placeholder="Paste image URL (https://...)"
                      className="flex-1 px-3 py-2 rounded-xl border border-[#E8DCCB] bg-white text-xs text-[#392820] font-mono outline-none focus:ring-1 focus:ring-[#D9A08C]"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageToProduct}
                      className="px-5 py-2 rounded-xl bg-[#392820] text-white hover:bg-[#111111] text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
                    >
                      Add URL Photo
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: COLOR VARIANTS & IMAGE ASSIGNMENT (MAX 2 PHOTOS PER COLOR) */}
            <div className="pt-6 border-t border-[#E8DCCB] space-y-4">
              <div>
                <h4 className="font-serif text-lg text-[#392820] font-semibold flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#D9A08C]" />
                  <span>Color Variants &amp; Photo Linkage (Up to 2 Photos Per Color &bull; Swipe Left Feature)</span>
                </h4>
                <p className="text-xs text-[#735D50]">
                  Link up to <strong>2 photos per color</strong>: Photo 1 is the <strong>Full Dress Look</strong> (shown first), and Photo 2 is the <strong>Close-up Design Detail</strong> (customers swipe left on the dress to inspect embroidery and patterns).
                </p>
              </div>

              {/* Existing Colors List */}
              <div className="space-y-4">
                {mediaModalProduct.colors?.map((col, cIdx) => {
                  const hasTwoPhotos = Boolean(col.closeUpImage);
                  const isEditingThis = editingVariantKey === col.name;

                  if (isEditingThis) {
                    return (
                      <div
                        key={col.name}
                        className="p-4 rounded-2xl bg-[#FFFBF7] border-2 border-[#D9A08C] space-y-3.5 shadow-md transition-all ring-2 ring-[#D9A08C]/20"
                      >
                        {/* Header with Live Swatch */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9A08C]/40 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-6 h-6 rounded-full border border-black/20 shadow-xs shrink-0 ring-2 ring-white"
                              style={{ backgroundColor: editVariantHex || col.hex }}
                            />
                            <div>
                              <p className="font-bold text-xs text-[#392820] flex items-center gap-1.5">
                                <span>Editing Variant #{cIdx + 1}:</span>
                                <span className="text-[#C41D53] font-extrabold">{editVariantName || col.name}</span>
                              </p>
                              <p className="text-[10px] text-[#735D50] font-mono">
                                {editVariantHex} &bull; rgb({editVariantR}, {editVariantG}, {editVariantB})
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-[#735D50] bg-white px-2.5 py-1 rounded-full border border-[#D9A08C]/40">
                            Editing in progress &mdash; Save below
                          </span>
                        </div>

                        {/* Colour Name and Color Picker (Circle + Hex + RGB + Presets) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Edit Color Name */}
                          <div>
                            <label className="text-[10px] uppercase font-bold text-[#735D50] block mb-1">
                              Colour Name *
                            </label>
                            <input
                              type="text"
                              value={editVariantName}
                              onChange={(e) => setEditVariantName(e.target.value)}
                              placeholder="e.g. Royal Purple, Wine, Slate-blue"
                              className="w-full px-3 py-2 rounded-xl border border-[#D9A08C] bg-white text-xs text-[#392820] font-bold focus:ring-2 focus:ring-[#392820]/20 outline-none"
                            />
                          </div>

                          {/* Manual Color Picker (Circle + Hex + RGB) */}
                          <div>
                            <label className="text-[10px] uppercase font-bold text-[#735D50] block mb-1">
                              Select Color (Circle / RGB / Hex) *
                            </label>
                            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white border border-[#D9A08C]">
                              {/* Circle Picker (Label-wrapped for 100% reliable click/touch response) */}
                              <label
                                className="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-black/30 cursor-pointer hover:scale-110 active:scale-95 transition-transform shrink-0"
                                style={{ backgroundColor: ensureHex7(editVariantHex) }}
                                title="Click or touch circle to open color wheel / spectrum"
                              >
                                <input
                                  type="color"
                                  value={ensureHex7(editVariantHex)}
                                  onChange={(e) => {
                                    const hex = e.target.value;
                                    setEditVariantHex(hex);
                                    const rgbVal = hexToRgb(hex);
                                    setEditVariantR(rgbVal.r);
                                    setEditVariantG(rgbVal.g);
                                    setEditVariantB(rgbVal.b);
                                  }}
                                  className="sr-only"
                                />
                                <Palette className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none" />
                              </label>

                              {/* Hex */}
                              <input
                                type="text"
                                value={editVariantHex}
                                onChange={(e) => {
                                  let val = e.target.value;
                                  if (!val.startsWith('#') && val.length > 0) val = '#' + val;
                                  setEditVariantHex(val);
                                  if (val.length === 7 || val.length === 4) {
                                    const rgbVal = hexToRgb(val);
                                    setEditVariantR(rgbVal.r);
                                    setEditVariantG(rgbVal.g);
                                    setEditVariantB(rgbVal.b);
                                  }
                                }}
                                placeholder="#463272"
                                className="w-20 px-1.5 py-1 rounded-lg border border-[#E8DCCB] text-[11px] font-mono font-bold text-center"
                              />

                              {/* RGB Inputs */}
                              <div className="flex items-center gap-1 flex-1 min-w-0">
                                <input
                                  type="number"
                                  min={0}
                                  max={255}
                                  value={editVariantR}
                                  onChange={(e) => {
                                    const r = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                                    setEditVariantR(r);
                                    setEditVariantHex(rgbToHex(r, editVariantG, editVariantB));
                                  }}
                                  className="w-full px-1 py-1 rounded border border-[#E8DCCB] text-[10px] font-mono text-center font-bold text-rose-700"
                                  title="Red (0-255)"
                                />
                                <input
                                  type="number"
                                  min={0}
                                  max={255}
                                  value={editVariantG}
                                  onChange={(e) => {
                                    const g = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                                    setEditVariantG(g);
                                    setEditVariantHex(rgbToHex(editVariantR, g, editVariantB));
                                  }}
                                  className="w-full px-1 py-1 rounded border border-[#E8DCCB] text-[10px] font-mono text-center font-bold text-emerald-700"
                                  title="Green (0-255)"
                                />
                                <input
                                  type="number"
                                  min={0}
                                  max={255}
                                  value={editVariantB}
                                  onChange={(e) => {
                                    const b = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                                    setEditVariantB(b);
                                    setEditVariantHex(rgbToHex(editVariantR, editVariantG, b));
                                  }}
                                  className="w-full px-1 py-1 rounded border border-[#E8DCCB] text-[10px] font-mono text-center font-bold text-blue-700"
                                  title="Blue (0-255)"
                                />
                              </div>
                            </div>

                            {/* Preset palette */}
                            <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                              <span className="text-[9px] text-[#735D50]">Presets:</span>
                              {BOUTIQUE_COLOR_PRESETS.map((p) => (
                                <button
                                  key={p.hex}
                                  type="button"
                                  onClick={() => {
                                    setEditVariantHex(p.hex);
                                    const rgbVal = hexToRgb(p.hex);
                                    setEditVariantR(rgbVal.r);
                                    setEditVariantG(rgbVal.g);
                                    setEditVariantB(rgbVal.b);
                                    if (!editVariantName || editVariantName === col.name) {
                                      setEditVariantName(p.name);
                                    }
                                  }}
                                  className="w-4 h-4 rounded-full border border-black/20 hover:scale-125 transition-transform cursor-pointer"
                                  style={{ backgroundColor: p.hex }}
                                  title={`${p.name} (${p.hex})`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Photo 1 & Photo 2 Replacement Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                          {/* Photo 1: Full Look */}
                          <div className="space-y-2 p-3 rounded-xl bg-white border border-[#D9A08C]">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-[#392820] flex items-center gap-1">
                                <span className="w-4 h-4 rounded-full bg-[#392820] text-white flex items-center justify-center text-[9px] font-mono">1</span>
                                <span>Photo 1 &bull; Full Dress Look (Main View)</span>
                              </span>
                              <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                                Primary
                              </span>
                            </div>

                            <div className="flex items-start gap-2.5">
                              {editVariantPhoto1 ? (
                                <div className="relative w-14 h-18 rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-[#E8DCCB] shadow-2xs">
                                  <Image src={editVariantPhoto1} alt="Photo 1" fill className="object-cover" />
                                  <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] text-white text-center py-0.5 font-semibold">
                                    Full Look
                                  </span>
                                </div>
                              ) : (
                                <div className="w-14 h-18 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-[9px] text-gray-400 shrink-0">
                                  No Photo
                                </div>
                              )}
                              <div className="flex-1 space-y-1.5">
                                <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#D9A08C] text-[#392820] hover:bg-[#F3ECE1] text-[11px] font-semibold cursor-pointer w-full justify-center transition-colors">
                                  {isUploadingVariantPhoto1 ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#392820]" />
                                  ) : (
                                    <Upload className="w-3.5 h-3.5 text-[#392820]" />
                                  )}
                                  <span>{isUploadingVariantPhoto1 ? 'Uploading...' : 'Upload New Photo from Device'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    disabled={isUploadingVariantPhoto1}
                                    onChange={(e) => handleUploadVariantPhoto('photo1', e)}
                                    className="hidden"
                                  />
                                </label>
                                <input
                                  type="text"
                                  value={editVariantPhoto1}
                                  onChange={(e) => setEditVariantPhoto1(e.target.value)}
                                  placeholder="Or paste image URL..."
                                  className="w-full px-2 py-1 rounded-lg border border-[#E8DCCB] text-[10px] text-[#392820]"
                                />
                                {mediaModalProduct.images.length > 0 && (
                                  <select
                                    value={mediaModalProduct.images.includes(editVariantPhoto1) ? editVariantPhoto1 : ''}
                                    onChange={(e) => {
                                      if (e.target.value) setEditVariantPhoto1(e.target.value);
                                    }}
                                    className="w-full px-2 py-1 rounded-lg border border-[#E8DCCB] bg-gray-50 text-[10px]"
                                  >
                                    <option value="">-- Or Pick from Product Gallery --</option>
                                    {mediaModalProduct.images.map((img, i) => (
                                      <option key={i} value={img}>
                                        Photo #{i + 1} {i === 0 ? '(Cover)' : ''} &mdash; {img.slice(0, 30)}...
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Photo 2: Close-up / Design (Swipe Left) */}
                          <div className="space-y-2 p-3 rounded-xl bg-white border border-amber-300">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>Photo 2 &bull; Close-up / Design (Swipe Left)</span>
                              </span>
                              {editVariantPhoto2 ? (
                                <button
                                  type="button"
                                  onClick={() => setEditVariantPhoto2('')}
                                  className="text-[9px] text-rose-600 hover:text-rose-800 underline font-semibold cursor-pointer"
                                >
                                  Remove Close-up
                                </button>
                              ) : (
                                <span className="text-[9px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded font-semibold">
                                  Optional
                                </span>
                              )}
                            </div>

                            <div className="flex items-start gap-2.5">
                              {editVariantPhoto2 ? (
                                <div className="relative w-14 h-18 rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-amber-300 shadow-2xs">
                                  <Image src={editVariantPhoto2} alt="Photo 2" fill className="object-cover" />
                                  <span className="absolute bottom-0 inset-x-0 bg-amber-900/90 text-[8px] text-white text-center py-0.5 font-semibold">
                                    Swipe Angle
                                  </span>
                                </div>
                              ) : (
                                <div className="w-14 h-18 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/50 flex items-center justify-center text-[8px] text-amber-700 text-center px-1 shrink-0">
                                  Single Photo Only
                                </div>
                              )}
                              <div className="flex-1 space-y-1.5">
                                <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] border border-amber-300 text-amber-900 hover:bg-amber-100 text-[11px] font-semibold cursor-pointer w-full justify-center transition-colors">
                                  {isUploadingVariantPhoto2 ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-800" />
                                  ) : (
                                    <Upload className="w-3.5 h-3.5 text-amber-800" />
                                  )}
                                  <span>{isUploadingVariantPhoto2 ? 'Uploading...' : 'Upload Close-up from Device'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    disabled={isUploadingVariantPhoto2}
                                    onChange={(e) => handleUploadVariantPhoto('photo2', e)}
                                    className="hidden"
                                  />
                                </label>
                                <input
                                  type="text"
                                  value={editVariantPhoto2}
                                  onChange={(e) => setEditVariantPhoto2(e.target.value)}
                                  placeholder="Or paste close-up URL..."
                                  className="w-full px-2 py-1 rounded-lg border border-[#E8DCCB] text-[10px] text-[#392820]"
                                />
                                {mediaModalProduct.images.length > 0 && (
                                  <select
                                    value={mediaModalProduct.images.includes(editVariantPhoto2) ? editVariantPhoto2 : ''}
                                    onChange={(e) => {
                                      if (e.target.value) setEditVariantPhoto2(e.target.value);
                                    }}
                                    className="w-full px-2 py-1 rounded-lg border border-[#E8DCCB] bg-gray-50 text-[10px]"
                                  >
                                    <option value="">-- No Close-up (Single Photo Only) --</option>
                                    {mediaModalProduct.images.map((img, i) => (
                                      <option key={i} value={img}>
                                        Photo #{i + 1} &mdash; {img.slice(0, 30)}...
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Action Footer */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#D9A08C]/40">
                          <p className="text-[10px] text-[#735D50]">
                            Saves changes directly to this product in database without affecting other colors.
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleCancelEditVariant}
                              className="px-3 py-1.5 rounded-xl border border-[#E8DCCB] bg-white text-[#735D50] hover:bg-gray-100 text-xs font-medium cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditedVariant(mediaModalProduct.id)}
                              className="px-4 py-1.5 rounded-xl bg-[#392820] text-white hover:bg-[#111111] text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Save Colour Changes</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const isPaleBeige = col.hex === '#E8D6C7' || !col.hex;
                  const isActualBeige = /beige|champagne|cream|sand|wheat/i.test(col.name);
                  const displayColHex = (isPaleBeige && !isActualBeige) ? getColorHexFallback(col.name) : (col.hex || '#C41D53');

                  return (
                    <div
                      key={col.name}
                      className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DCCB] space-y-3.5 shadow-2xs"
                    >
                      {/* Color Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8DCCB]/80 pb-3">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditVariant(col)}
                            className="w-7 h-7 rounded-full border-2 border-white shadow-sm ring-1 ring-black/25 shrink-0 hover:scale-115 active:scale-95 transition-transform cursor-pointer relative group flex items-center justify-center"
                            style={{ backgroundColor: displayColHex }}
                            title={`Touch or click circle to edit ${col.name} color & photos`}
                          >
                            <Palette className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </button>
                          <div onClick={() => handleStartEditVariant(col)} className="cursor-pointer">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm text-[#392820] hover:text-[#C41D53] transition-colors">
                                #{cIdx + 1} &bull; {col.name}
                              </p>
                              {hasTwoPhotos ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-emerald-600" />
                                  <span>2 Photos Active &bull; Swipe Left Enabled</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-medium">
                                  1 Photo Active &bull; Add Close-up for Swipe View
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#735D50] font-mono hover:text-[#392820]">{displayColHex}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEditVariant(col)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#392820] text-white hover:bg-[#111111] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            title="Edit this colour name, HEX code, and photos"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#D9A08C]" />
                            <span>Edit Colour</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveColorFromProduct(col.name)}
                            className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            title="Remove this color"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Delete Color</span>
                          </button>
                        </div>
                      </div>

                      {/* 2 Photo Slots (Max 2 Photos Inside Single Color Variant) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {/* PHOTO 1: Full Dress View (Primary Angle) */}
                        <div className="p-3.5 rounded-xl bg-white border border-[#E8DCCB] space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] uppercase font-bold text-[#392820] flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-[#392820] text-white flex items-center justify-center text-[9px] font-mono font-bold">1</span>
                              <span>Photo 1 &bull; Full Dress Look (Main View)</span>
                            </label>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Primary
                            </span>
                          </div>

                          <div className="flex items-start gap-3">
                            {col.image ? (
                              <div className="relative w-16 h-20 rounded-xl overflow-hidden border border-[#E8DCCB] shrink-0 bg-gray-50 shadow-2xs">
                                <Image src={col.image} alt={`${col.name} full`} fill className="object-cover" />
                                <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] text-white text-center py-0.5 font-semibold">
                                  Full Look
                                </span>
                              </div>
                            ) : (
                              <div className="w-16 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-[9px] text-gray-400 text-center shrink-0">
                                No Photo
                              </div>
                            )}

                            <div className="flex-1 space-y-2">
                              <select
                                value={col.image || mediaModalProduct.images[0]}
                                onChange={(e) => handleUpdateColorImages(col.name, e.target.value, col.closeUpImage)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E8DCCB] bg-[#FAF7F2] text-xs text-[#392820] outline-none font-medium"
                              >
                                {mediaModalProduct.images.map((img, i) => (
                                  <option key={i} value={img}>
                                    Photo #{i + 1} {i === 0 ? '(Primary Cover)' : ''} &mdash; {img.slice(0, 35)}...
                                  </option>
                                ))}
                              </select>

                              <p className="text-[10px] text-[#735D50] leading-tight">
                                Full dress photo customers see first when choosing #{cIdx + 1} ({col.name}).
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* PHOTO 2: Close-up / Design Detail View (Swipe Left Angle) */}
                        <div className={`p-3.5 rounded-xl border space-y-2.5 transition-all shadow-2xs ${
                          col.closeUpImage ? 'bg-white border-amber-300' : 'bg-white/80 border-dashed border-[#D9A08C]'
                        }`}>
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] uppercase font-bold text-[#392820] flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-[#D9A08C] text-[#392820] flex items-center justify-center text-[9px] font-mono font-bold">2</span>
                              <span>Photo 2 &bull; Close-up / Design (Swipe Left)</span>
                            </label>
                            {col.closeUpImage ? (
                              <button
                                type="button"
                                onClick={() => handleRemoveColorCloseUp(col.name)}
                                className="text-[10px] text-rose-600 hover:text-rose-800 underline font-semibold"
                                title="Remove close-up photo and revert to 1 photo"
                              >
                                Remove Close-up
                              </button>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Swipe Feature
                              </span>
                            )}
                          </div>

                          <div className="flex items-start gap-3">
                            {col.closeUpImage ? (
                              <div className="relative w-16 h-20 rounded-xl overflow-hidden border-2 border-amber-400 shrink-0 bg-gray-50 shadow-2xs">
                                <Image src={col.closeUpImage} alt={`${col.name} close-up`} fill className="object-cover" />
                                <span className="absolute bottom-0 inset-x-0 bg-amber-900/90 text-[8px] text-white text-center py-0.5 font-semibold">
                                  Swipe Angle
                                </span>
                              </div>
                            ) : (
                              <div className="w-16 h-20 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 flex flex-col items-center justify-center text-[9px] text-amber-800 text-center shrink-0 p-1">
                                <Sparkles className="w-4 h-4 text-amber-600 mb-0.5" />
                                <span>No Close-up</span>
                              </div>
                            )}

                            <div className="flex-1 space-y-2">
                              <select
                                value={col.closeUpImage || ''}
                                onChange={(e) => handleUpdateColorImages(col.name, col.image || mediaModalProduct.images[0], e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E8DCCB] bg-[#FAF7F2] text-xs text-[#392820] outline-none font-medium"
                              >
                                <option value="">-- No Close-up (Single Photo Only) --</option>
                                {mediaModalProduct.images.map((img, i) => (
                                  <option key={i} value={img}>
                                    Photo #{i + 1} &mdash; {img.slice(0, 35)}...
                                  </option>
                                ))}
                              </select>

                              {/* Direct Device Upload Button for Close-up View */}
                              <div className="flex items-center gap-2 pt-0.5">
                                <input
                                  type="file"
                                  id={`upload-closeup-${col.name.replace(/[^a-zA-Z0-9]/g, '-')}`}
                                  accept="image/jpeg,image/png,image/webp,image/avif"
                                  disabled={uploadingColorCloseUp === col.name}
                                  onChange={(e) => handleUploadColorCloseUp(col.name, e)}
                                  className="hidden"
                                />
                                <label
                                  htmlFor={`upload-closeup-${col.name.replace(/[^a-zA-Z0-9]/g, '-')}`}
                                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                                    uploadingColorCloseUp === col.name
                                      ? 'bg-amber-100 text-amber-900 border-amber-300 cursor-wait'
                                      : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs'
                                  }`}
                                >
                                  {uploadingColorCloseUp === col.name ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                                      <span>Uploading close-up...</span>
                                    </>
                                  ) : (
                                    <>
                                      <UploadCloud className="w-3.5 h-3.5 text-amber-700" />
                                      <span>{col.closeUpImage ? 'Replace Close-up Photo' : 'Upload Close-up from Device'}</span>
                                    </>
                                  )}
                                </label>
                              </div>

                              <p className="text-[10px] text-[#735D50] leading-tight">
                                Customers swipe left on this dress to see close-up embroidery and design craftsmanship.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Color Variant */}
              <div className="p-4 rounded-2xl bg-white border border-[#E8DCCB] space-y-3">
                <label className="text-xs font-semibold text-[#392820] block">
                  + Add New Color Shade to this Product:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#735D50] block mb-1">
                      Color Name:
                    </label>
                    <input
                      type="text"
                      value={newColorVariantName}
                      onChange={(e) => setNewColorVariantName(e.target.value)}
                      placeholder="e.g. Royal Purple"
                      className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2] text-xs text-[#392820]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-[#735D50] block mb-1">
                      Manual Color (Circle / RGB / Hex) *
                    </label>
                    <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8DCCB]">
                      {/* Circle Picker (Label-wrapped for 100% reliable click/touch response) */}
                      <label
                        className="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-black/30 cursor-pointer hover:scale-110 active:scale-95 transition-transform shrink-0"
                        style={{ backgroundColor: ensureHex7(newColorVariantHex) }}
                        title="Click or touch circle to open color wheel / spectrum"
                      >
                        <input
                          type="color"
                          value={ensureHex7(newColorVariantHex)}
                          onChange={(e) => {
                            const hex = e.target.value;
                            setNewColorVariantHex(hex);
                            const rgb = hexToRgb(hex);
                            setNewColorVariantR(rgb.r);
                            setNewColorVariantG(rgb.g);
                            setNewColorVariantB(rgb.b);
                          }}
                          className="sr-only"
                        />
                        <Palette className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none" />
                      </label>

                      {/* Hex */}
                      <input
                        type="text"
                        value={newColorVariantHex}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (!val.startsWith('#') && val.length > 0) val = '#' + val;
                          setNewColorVariantHex(val);
                          if (val.length === 7 || val.length === 4) {
                            const rgb = hexToRgb(val);
                            setNewColorVariantR(rgb.r);
                            setNewColorVariantG(rgb.g);
                            setNewColorVariantB(rgb.b);
                          }
                        }}
                        placeholder="#D9A08C"
                        className="w-18 px-1.5 py-1 rounded-lg border border-[#E8DCCB] text-[11px] font-mono font-bold text-center bg-white"
                      />

                      {/* RGB Inputs */}
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <input
                          type="number"
                          min={0}
                          max={255}
                          value={newColorVariantR}
                          onChange={(e) => {
                            const r = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                            setNewColorVariantR(r);
                            setNewColorVariantHex(rgbToHex(r, newColorVariantG, newColorVariantB));
                          }}
                          className="w-full px-1 py-1 rounded border border-[#E8DCCB] text-[10px] font-mono text-center font-bold text-rose-700 bg-white"
                          title="Red (0-255)"
                        />
                        <input
                          type="number"
                          min={0}
                          max={255}
                          value={newColorVariantG}
                          onChange={(e) => {
                            const g = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                            setNewColorVariantG(g);
                            setNewColorVariantHex(rgbToHex(newColorVariantR, g, newColorVariantB));
                          }}
                          className="w-full px-1 py-1 rounded border border-[#E8DCCB] text-[10px] font-mono text-center font-bold text-emerald-700 bg-white"
                          title="Green (0-255)"
                        />
                        <input
                          type="number"
                          min={0}
                          max={255}
                          value={newColorVariantB}
                          onChange={(e) => {
                            const b = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                            setNewColorVariantB(b);
                            setNewColorVariantHex(rgbToHex(newColorVariantR, newColorVariantG, b));
                          }}
                          className="w-full px-1 py-1 rounded border border-[#E8DCCB] text-[10px] font-mono text-center font-bold text-blue-700 bg-white"
                          title="Blue (0-255)"
                        />
                      </div>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                      <span className="text-[9px] text-[#735D50]">Presets:</span>
                      {BOUTIQUE_COLOR_PRESETS.slice(0, 8).map((p) => (
                        <button
                          key={p.hex}
                          type="button"
                          onClick={() => {
                            setNewColorVariantName(p.name);
                            setNewColorVariantHex(p.hex);
                            const rgb = hexToRgb(p.hex);
                            setNewColorVariantR(rgb.r);
                            setNewColorVariantG(rgb.g);
                            setNewColorVariantB(rgb.b);
                          }}
                          className="w-4 h-4 rounded-full border border-black/20 hover:scale-125 transition-transform cursor-pointer"
                          style={{ backgroundColor: p.hex }}
                          title={`${p.name} (${p.hex})`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#735D50] block mb-1">
                      Photo 1 (Full Look):
                    </label>
                    <select
                      value={newColorVariantImage}
                      onChange={(e) => setNewColorVariantImage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2] text-xs text-[#392820]"
                    >
                      <option value="">Select Photo 1</option>
                      {mediaModalProduct.images.map((img, i) => (
                        <option key={i} value={img}>
                          Photo #{i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#735D50] block mb-1">
                      Photo 2 (Close-up Swipe):
                    </label>
                    <select
                      value={newColorVariantCloseUpImage}
                      onChange={(e) => setNewColorVariantCloseUpImage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2] text-xs text-[#392820]"
                    >
                      <option value="">-- Optional Close-up --</option>
                      {mediaModalProduct.images.map((img, i) => (
                        <option key={i} value={img}>
                          Photo #{i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddColorToProduct}
                      className="w-full py-2.5 rounded-xl bg-[#392820] text-white hover:bg-[#111111] text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      + Add Color
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-[#E8DCCB] flex items-center justify-between">
              <Link
                href={`/products/${mediaModalProduct.slug}`}
                target="_blank"
                className="text-xs text-[#B79A72] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View Live on Boutique Storefront</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMediaModalProduct(null);
                  showNotification(`Media & Color settings saved for ${mediaModalProduct.name}!`);
                }}
                className="px-6 py-2.5 rounded-full bg-[#392820] text-white hover:bg-[#111111] text-xs font-semibold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: POST NEW PRODUCT */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-[#E8DCCB] shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E8DCCB] pb-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#D9A08C] font-semibold">Boutique Inventory</span>
                <h3 className="font-serif text-2xl text-[#392820] font-medium">+ Post New Product</h3>
              </div>
              <button onClick={() => setIsAddProductOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSaveNewProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-[#392820] block mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. Royal Organza Zari Saree"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#392820] block mb-1">Subtitle / Lineage</label>
                  <input
                    type="text"
                    value={newProdSubtitle}
                    onChange={(e) => setNewProdSubtitle(e.target.value)}
                    placeholder="e.g. Hand-embroidered festive edit"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-[#392820] block mb-1">Category *</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => {
                      const cat = e.target.value as ProductCategory;
                      setNewProdCategory(cat);
                      if (cat === 'sarees') {
                        setNewProdSizes([
                          { size: 'Free Size', inStock: true, stockCount: 15 },
                        ]);
                      } else if (newProdSizes.length === 1 && newProdSizes[0].size === 'Free Size') {
                        setNewProdSizes(DEFAULT_SIZE_LIST);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]"
                  >
                    <option value="co-ord-sets">Co-ord Sets</option>
                    <option value="kurtas">Kurtas &amp; Anarkalis</option>
                    <option value="sarees">Artisanal Sarees</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-[#392820] block text-xs">
                      Occasion (Select with Checkboxes) *
                    </label>
                    <span className="text-[10px] text-[#735D50] font-medium">
                      {newProdOccasions.length > 0 ? `${newProdOccasions.length} selected` : 'Select 1+'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {OCCASION_OPTIONS.map((occ) => {
                        const isChecked = newProdOccasions.includes(occ);
                        return (
                          <label
                            key={occ}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer select-none transition-all text-xs font-medium ${
                              isChecked
                                ? 'bg-[#392820] text-white shadow-xs'
                                : 'text-[#392820] hover:bg-[#EFE6D8] bg-white border border-[#E8DCCB]/60'
                            } ${occ === 'College & Casual' ? 'sm:col-span-2' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleNewProdOccasion(occ)}
                              className="w-4 h-4 rounded border-[#D8C7B5] accent-[#C29200] text-[#392820] cursor-pointer"
                            />
                            <span className="flex-1 truncate">{occ}</span>
                            {isChecked && (
                              <span className="text-[10px] text-[#F3E5D8] font-normal">
                                ✓
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-[#392820] block mb-1">Selling Price (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="e.g. 849"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2] font-semibold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#392820] block mb-1">MRP Original Price (₹ INR)</label>
                  <input
                    type="number"
                    value={newProdOriginalPrice}
                    onChange={(e) => setNewProdOriginalPrice(e.target.value)}
                    placeholder="e.g. 1199"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]"
                  />
                </div>
              </div>

              {/* 1. Fabric & Material Details */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#392820] block">
                    Fabric &amp; Craftsmanship Details *
                  </label>
                  <span className="text-[10px] text-[#735D50]">Quick select chip:</span>
                </div>
                <input
                  type="text"
                  required
                  value={newProdFabric}
                  onChange={(e) => setNewProdFabric(e.target.value)}
                  placeholder="e.g. Regular Pure Cotton, Pure Chanderi Silk with Mulmul Lining"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2] text-xs font-medium"
                />
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {FABRIC_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewProdFabric(preset)}
                      className="px-2.5 py-0.5 rounded-full bg-white border border-[#E8DCCB] text-[10px] font-semibold text-[#735D50] hover:text-[#392820] hover:border-[#392820] transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Available Sizes & Stock Quantities */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DCCB] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="font-semibold text-[#392820] text-xs block">
                      Available Sizes &amp; Stock Quantities *
                    </label>
                    <p className="text-[11px] text-[#735D50]">
                      Select available sizes for this attire, and configure stock counts.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {newProdCategory === 'sarees' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setNewProdSizes([
                              { size: 'Free Size', inStock: true, stockCount: 15 },
                            ]);
                          }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all shadow-2xs ${
                            newProdSizes.length === 1 && newProdSizes[0].size === 'Free Size'
                              ? 'bg-[#392820] text-white'
                              : 'bg-amber-100 text-[#392820] border border-amber-300 hover:bg-amber-200'
                          }`}
                        >
                          ✨ Free Size Only
                        </button>
                        {!newProdSizes.some((s) => s.size === 'Free Size') && (
                          <button
                            type="button"
                            onClick={() => {
                              setNewProdSizes([
                                { size: 'Free Size', inStock: true, stockCount: 15 },
                                ...newProdSizes,
                              ]);
                            }}
                            className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-semibold hover:bg-emerald-100 shadow-2xs"
                          >
                            + Free Size
                          </button>
                        )}
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const list: ProductInventorySize[] = newProdCategory === 'sarees'
                          ? [
                              { size: 'Free Size', inStock: true, stockCount: 15 },
                              { size: 'M', inStock: true, stockCount: 15 },
                              { size: 'L', inStock: true, stockCount: 15 },
                              { size: 'XL', inStock: true, stockCount: 12 },
                              { size: 'XXL', inStock: true, stockCount: 10 },
                            ]
                          : [
                              { size: 'XS', inStock: false, stockCount: 0 },
                              { size: 'S', inStock: false, stockCount: 0 },
                              { size: 'M', inStock: true, stockCount: 15 },
                              { size: 'L', inStock: true, stockCount: 15 },
                              { size: 'XL', inStock: true, stockCount: 12 },
                              { size: 'XXL', inStock: true, stockCount: 10 },
                            ];
                        setNewProdSizes(list);
                      }}
                      className="px-2.5 py-1 rounded-full bg-white border border-[#E8DCCB] text-[10px] font-semibold text-[#392820] hover:bg-[#FAF7F2] shadow-2xs"
                    >
                      Standard (M–XXL)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const list: ProductInventorySize[] = newProdCategory === 'sarees'
                          ? [
                              { size: 'Free Size', inStock: true, stockCount: 15 },
                              { size: 'XS', inStock: true, stockCount: 10 },
                              { size: 'S', inStock: true, stockCount: 10 },
                              { size: 'M', inStock: true, stockCount: 15 },
                              { size: 'L', inStock: true, stockCount: 15 },
                              { size: 'XL', inStock: true, stockCount: 12 },
                              { size: 'XXL', inStock: true, stockCount: 10 },
                            ]
                          : [
                              { size: 'XS', inStock: true, stockCount: 10 },
                              { size: 'S', inStock: true, stockCount: 10 },
                              { size: 'M', inStock: true, stockCount: 15 },
                              { size: 'L', inStock: true, stockCount: 15 },
                              { size: 'XL', inStock: true, stockCount: 12 },
                              { size: 'XXL', inStock: true, stockCount: 10 },
                            ];
                        setNewProdSizes(list);
                      }}
                      className="px-2.5 py-1 rounded-full bg-white border border-[#E8DCCB] text-[10px] font-semibold text-[#392820] hover:bg-[#FAF7F2] shadow-2xs"
                    >
                      All {newProdCategory === 'sarees' ? '(Free Size + XS–XXL)' : '(XS–XXL)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewProdSizes(newProdSizes.map((s) => ({ ...s, inStock: false, stockCount: 0 })));
                      }}
                      className="px-2.5 py-1 rounded-full bg-white border border-[#E8DCCB] text-[10px] font-semibold text-rose-600 hover:bg-rose-50 shadow-2xs"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  {(() => {
                    let displaySizes = [...newProdSizes];
                    if (newProdCategory === 'sarees' && !displaySizes.some((s) => s.size === 'Free Size')) {
                      displaySizes = [{ size: 'Free Size', inStock: true, stockCount: 15 }, ...displaySizes];
                    }
                    return displaySizes.map((sItem) => (
                      <div
                        key={sItem.size}
                        className={`p-2.5 rounded-xl border transition-all ${
                          sItem.inStock
                            ? sItem.size === 'Free Size'
                              ? 'bg-amber-50/70 border-amber-600 shadow-2xs ring-1 ring-amber-500/20'
                              : 'bg-white border-[#392820] shadow-2xs'
                            : 'bg-[#FAF7F2]/60 border-[#E8DCCB] opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-[#392820]">
                            <input
                              type="checkbox"
                              checked={sItem.inStock}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const exists = newProdSizes.some((s) => s.size === sItem.size);
                                const base = exists ? newProdSizes : [{ size: sItem.size, inStock: false, stockCount: 0 }, ...newProdSizes];
                                setNewProdSizes(
                                  base.map((s) =>
                                    s.size === sItem.size
                                      ? { ...s, inStock: checked, stockCount: checked ? (s.stockCount > 0 ? s.stockCount : 15) : 0 }
                                      : s
                                  )
                                );
                              }}
                              className="w-3.5 h-3.5 rounded text-[#392820]"
                            />
                            <span className={sItem.size === 'Free Size' ? 'text-amber-900 font-extrabold' : ''}>
                              {sItem.size}
                            </span>
                          </label>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              sItem.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sItem.inStock ? 'In Stock' : 'Out'}
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[9px] text-[#735D50] block">Stock Units:</span>
                          <input
                            type="number"
                            min={0}
                            disabled={!sItem.inStock}
                            value={sItem.stockCount}
                            onChange={(e) => {
                              const count = Math.max(0, parseInt(e.target.value) || 0);
                              const exists = newProdSizes.some((s) => s.size === sItem.size);
                              const base = exists ? newProdSizes : [{ size: sItem.size, inStock: true, stockCount: 15 }, ...newProdSizes];
                              setNewProdSizes(
                                base.map((s) =>
                                  s.size === sItem.size
                                    ? { ...s, stockCount: count, inStock: count > 0 }
                                    : s
                                )
                              );
                            }}
                            className="w-full px-2 py-1 rounded-lg border border-[#E8DCCB] bg-white text-xs font-semibold text-center outline-none focus:border-[#392820] disabled:bg-gray-100 disabled:text-gray-400"
                          />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* 3. PRIMARY PHOTOGRAPHY & PRIMARY COLOR DETAILS (DIRECTLY BELOW DETAILS & SIZES) */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border-2 border-[#D9A08C]/50 space-y-4 shadow-sm">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-[#D9A08C]" />
                      <h4 className="font-serif text-sm font-semibold text-[#392820]">
                        Primary Photography &amp; Primary Color
                      </h4>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-[#D9A08C] bg-white px-2.5 py-0.5 rounded-full border border-[#D9A08C]/40">
                      Primary Product Cover
                    </span>
                  </div>
                  <p className="text-[11px] text-[#735D50] mt-0.5">
                    Upload the primary cover photography for this attire, and specify its matching color shade.
                  </p>
                </div>

                {/* Primary Photos: Photo 1 (Full Look) & Photo 2 (Close-up Swipe) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Photo 1: Primary Cover */}
                  <div className="space-y-2 p-3 rounded-xl bg-white border border-[#E8DCCB]">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-[#392820] flex items-center gap-1">
                        <span>Photo 1 &bull; Full Dress (Cover) *</span>
                      </label>
                      <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#392820] text-white text-[10px] font-semibold cursor-pointer hover:bg-[#111111] transition-colors">
                        <UploadCloud className="w-3 h-3 text-[#D9A08C]" />
                        <span>{isUploadingNewProdCover ? 'Uploading...' : 'Device'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingNewProdCover}
                          onChange={handleUploadNewProdCover}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <input
                      type="url"
                      required
                      value={newProdImage}
                      onChange={(e) => setNewProdImage(e.target.value)}
                      placeholder="Paste image URL or click Device above &rarr;"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E8DCCB] bg-[#FAF7F2] font-mono text-[11px]"
                    />
                    {newProdImage ? (
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#FAF7F2] border border-[#E8DCCB]">
                        <div className="relative w-10 h-14 rounded-md overflow-hidden bg-white border border-[#E8DCCB] shrink-0">
                          <Image src={newProdImage} alt="Primary Cover Preview" fill className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded inline-block">
                            Cover Photo Active
                          </span>
                          <span className="text-[9px] text-[#735D50] truncate block mt-0.5">{newProdImage}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewProdImage('')}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          title="Remove cover photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg border border-dashed border-gray-300 text-center text-[10px] text-gray-400">
                        No cover photo uploaded yet (Select device upload or paste URL)
                      </div>
                    )}
                  </div>

                  {/* Photo 2: Close-up / Swipe Left */}
                  <div className="space-y-2 p-3 rounded-xl bg-white border border-amber-200">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-amber-900 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Photo 2 &bull; Close-up (Swipe Left)</span>
                      </label>
                      <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-900 text-amber-100 text-[10px] font-semibold cursor-pointer hover:bg-amber-950 transition-colors">
                        <UploadCloud className="w-3 h-3 text-amber-300" />
                        <span>{isUploadingPrimaryCloseUp ? 'Uploading...' : 'Device'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingPrimaryCloseUp}
                          onChange={handleUploadPrimaryCloseUp}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <input
                      type="url"
                      value={newProdPrimaryCloseUp}
                      onChange={(e) => setNewProdPrimaryCloseUp(e.target.value)}
                      placeholder="Optional close-up URL or click Device &rarr;"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E8DCCB] bg-[#FAF7F2] font-mono text-[11px]"
                    />
                    {newProdPrimaryCloseUp ? (
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-amber-50/60 border border-amber-300">
                        <div className="relative w-10 h-14 rounded-md overflow-hidden bg-white border border-amber-300 shrink-0">
                          <Image src={newProdPrimaryCloseUp} alt="Primary Close-up Preview" fill className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded inline-block">
                            Swipe Left Angle Active
                          </span>
                          <span className="text-[9px] text-[#735D50] truncate block mt-0.5">{newProdPrimaryCloseUp}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewProdPrimaryCloseUp('')}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          title="Remove close-up photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg border border-dashed border-amber-200 bg-amber-50/20 text-center text-[10px] text-amber-700">
                        Single photo mode (Upload close-up to let customers swipe left)
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Color Details for the Primary Product */}
                <div className="pt-2 border-t border-[#E8DCCB] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#392820] flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-[#D9A08C]" />
                      <span>Primary Product Color Details:</span>
                    </span>
                    <span className="text-[10px] text-[#735D50]">Circle / RGB / Hex manual selection</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Primary Color Name */}
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#735D50] block mb-1">
                        Primary Color Name
                      </label>
                      <input
                        type="text"
                        value={newProdPrimaryColorName}
                        onChange={(e) => setNewProdPrimaryColorName(e.target.value)}
                        placeholder="e.g. Rani Pink, Royal Purple, Teal Blue"
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-white text-xs text-[#392820] font-medium"
                      />
                    </div>

                    {/* Manual Color Picker (Circle + Hex + RGB) */}
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#735D50] block mb-1">
                        Select Color (Circle / RGB / Hex)
                      </label>
                      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white border border-[#E8DCCB]">
                        {/* Circle Picker (Label-wrapped for 100% reliable click/touch response) */}
                        <label
                          className="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-black/30 cursor-pointer hover:scale-110 active:scale-95 transition-transform shrink-0"
                          style={{ backgroundColor: ensureHex7(newProdPrimaryColorHex) }}
                          title="Click or touch circle to open color wheel / spectrum"
                        >
                          <input
                            type="color"
                            value={ensureHex7(newProdPrimaryColorHex)}
                            onChange={(e) => {
                              const hex = e.target.value;
                              setNewProdPrimaryColorHex(hex);
                              const rgb = hexToRgb(hex);
                              setNewProdPrimaryColorR(rgb.r);
                              setNewProdPrimaryColorG(rgb.g);
                              setNewProdPrimaryColorB(rgb.b);
                            }}
                            className="sr-only"
                          />
                          <Palette className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none" />
                        </label>

                        {/* Hex */}
                        <input
                          type="text"
                          value={newProdPrimaryColorHex}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (!val.startsWith('#') && val.length > 0) val = '#' + val;
                            setNewProdPrimaryColorHex(val);
                            if (val.length === 7 || val.length === 4) {
                              const rgb = hexToRgb(val);
                              setNewProdPrimaryColorR(rgb.r);
                              setNewProdPrimaryColorG(rgb.g);
                              setNewProdPrimaryColorB(rgb.b);
                            }
                          }}
                          placeholder="#C41D53"
                          className="w-18 px-1.5 py-1 rounded-lg border border-[#E8DCCB] text-[11px] font-mono font-bold text-center"
                        />

                        {/* RGB Inputs */}
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <input
                            type="number"
                            min={0}
                            max={255}
                            value={newProdPrimaryColorR}
                            onChange={(e) => {
                              const r = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                              setNewProdPrimaryColorR(r);
                              setNewProdPrimaryColorHex(rgbToHex(r, newProdPrimaryColorG, newProdPrimaryColorB));
                            }}
                            className="w-full px-1 py-1 rounded border border-[#E8DCCB] text-[10px] font-mono text-center font-bold text-rose-700"
                            title="Red (0-255)"
                          />
                          <input
                            type="number"
                            min={0}
                            max={255}
                            value={newProdPrimaryColorG}
                            onChange={(e) => {
                              const g = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                              setNewProdPrimaryColorG(g);
                              setNewProdPrimaryColorHex(rgbToHex(newProdPrimaryColorR, g, newProdPrimaryColorB));
                            }}
                            className="w-full px-1 py-1 rounded border border-[#E8DCCB] text-[10px] font-mono text-center font-bold text-emerald-700"
                            title="Green (0-255)"
                          />
                          <input
                            type="number"
                            min={0}
                            max={255}
                            value={newProdPrimaryColorB}
                            onChange={(e) => {
                              const b = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                              setNewProdPrimaryColorB(b);
                              setNewProdPrimaryColorHex(rgbToHex(newProdPrimaryColorR, newProdPrimaryColorG, b));
                            }}
                            className="w-full px-1 py-1 rounded border border-[#E8DCCB] text-[10px] font-mono text-center font-bold text-blue-700"
                            title="Blue (0-255)"
                          />
                        </div>
                      </div>

                      {/* Preset palette */}
                      <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                        <span className="text-[9px] text-[#735D50]">Presets:</span>
                        {BOUTIQUE_COLOR_PRESETS.slice(0, 8).map((p) => (
                          <button
                            key={p.hex}
                            type="button"
                            onClick={() => {
                              setNewProdPrimaryColorName(p.name);
                              setNewProdPrimaryColorHex(p.hex);
                              const rgb = hexToRgb(p.hex);
                              setNewProdPrimaryColorR(rgb.r);
                              setNewProdPrimaryColorG(rgb.g);
                              setNewProdPrimaryColorB(rgb.b);
                            }}
                            className="w-4 h-4 rounded-full border border-black/20 hover:scale-125 transition-transform cursor-pointer"
                            style={{ backgroundColor: p.hex }}
                            title={`${p.name} (${p.hex})`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. ADDITIONAL PRODUCTS & ADDITIONAL COLOR SHADES (JUST BELOW PRIMARY PRODUCTS) */}
              <div className="p-4 rounded-2xl bg-white border border-[#E8DCCB] space-y-4 shadow-sm">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-[#D9A08C]" />
                      <h4 className="font-serif text-sm font-semibold text-[#392820]">
                        Additional Products &amp; Color Shades
                      </h4>
                    </div>
                    {newProdColors.length > 0 ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {newProdColors.length} Additional Shade{newProdColors.length > 1 ? 's' : ''} Added
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#735D50] italic">Optional extra color shades</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#735D50] mt-0.5">
                    If this attire is available in additional colors (e.g. Royal Purple, Wine, Slate-blue), add them here just below the primary product. For each additional shade, you can attach Photo 1 (Full Look) and Photo 2 (Close-up Swipe).
                  </p>
                </div>

                {/* List of Added Additional Colors */}
                {newProdColors.length > 0 && (
                  <div className="space-y-3">
                    {newProdColors.map((col, idx) => {
                      const rgb = hexToRgb(col.hex);
                      return (
                        <div
                          key={col.name}
                          className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DCCB] space-y-2.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between border-b border-[#E8DCCB]/60 pb-2">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-5 h-5 rounded-full border border-black/20 shadow-xs shrink-0"
                                style={{ backgroundColor: col.hex }}
                              />
                              <div>
                                <p className="font-semibold text-xs text-[#392820]">
                                  Additional Color #{idx + 1} &bull; {col.name}
                                </p>
                                <p className="text-[10px] text-[#735D50] font-mono">
                                  {col.hex} &bull; rgb({rgb.r}, {rgb.g}, {rgb.b})
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveNewProdColor(col.name)}
                              className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 text-xs flex items-center gap-1 cursor-pointer"
                              title="Remove color"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {/* Photo 1 Preview */}
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#E8DCCB]">
                              {col.image ? (
                                <div className="relative w-10 h-14 rounded-md overflow-hidden bg-gray-50 shrink-0 border border-[#E8DCCB]">
                                  <Image src={col.image} alt={col.name} fill className="object-cover" />
                                </div>
                              ) : (
                                <div className="w-10 h-14 rounded-md border border-dashed border-gray-300 flex items-center justify-center text-[8px] text-gray-400 shrink-0">
                                  No Photo
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-bold text-[#392820] block">Photo 1 (Full Look)</span>
                                <span className="text-[9px] text-[#735D50] truncate block">{col.image || 'None'}</span>
                              </div>
                            </div>

                            {/* Photo 2 Preview */}
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-amber-200">
                              {col.closeUpImage ? (
                                <div className="relative w-10 h-14 rounded-md overflow-hidden bg-gray-50 shrink-0 border border-amber-300">
                                  <Image src={col.closeUpImage} alt={`${col.name} close-up`} fill className="object-cover" />
                                </div>
                              ) : (
                                <div className="w-10 h-14 rounded-md border border-dashed border-amber-300 bg-amber-50/50 flex items-center justify-center text-[8px] text-amber-700 shrink-0">
                                  Single Photo
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                                  <span>Photo 2 (Close-up Swipe)</span>
                                </span>
                                <span className="text-[9px] text-[#735D50] truncate block">{col.closeUpImage || 'No close-up'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Additional Color Form Box */}
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#D9A08C]/60 space-y-3">
                  <span className="text-xs font-semibold text-[#392820] block">
                    + Add an Additional Color Shade:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Color Name */}
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#735D50] block mb-1">
                        Color Name *
                      </label>
                      <input
                        type="text"
                        value={newProdColorName}
                        onChange={(e) => setNewProdColorName(e.target.value)}
                        placeholder="e.g. Royal Purple, Wine, Slate-blue"
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-white text-xs text-[#392820] font-medium"
                      />
                    </div>

                    {/* Manual Color Picker (Circle + Hex + RGB) */}
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#735D50] block mb-1">
                        Select Color (Circle / RGB / Hex) *
                      </label>
                      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white border border-[#E8DCCB]">
                        {/* Circle Picker (Label-wrapped for 100% reliable click/touch response) */}
                        <label
                          className="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-black/30 cursor-pointer hover:scale-110 active:scale-95 transition-transform shrink-0"
                          style={{ backgroundColor: ensureHex7(newProdColorHex) }}
                          title="Click or touch circle to open color wheel / spectrum"
                        >
                          <input
                            type="color"
                            value={ensureHex7(newProdColorHex)}
                            onChange={(e) => {
                              const hex = e.target.value;
                              setNewProdColorHex(hex);
                              const rgbVal = hexToRgb(hex);
                              setNewProdColorR(rgbVal.r);
                              setNewProdColorG(rgbVal.g);
                              setNewProdColorB(rgbVal.b);
                            }}
                            className="sr-only"
                          />
                          <Palette className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none" />
                        </label>

                        {/* Hex */}
                        <input
                          type="text"
                          value={newProdColorHex}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (!val.startsWith('#') && val.length > 0) val = '#' + val;
                            setNewProdColorHex(val);
                            if (val.length === 7 || val.length === 4) {
                              const rgb = hexToRgb(val);
                              setNewProdColorR(rgb.r);
                              setNewProdColorG(rgb.g);
                              setNewProdColorB(rgb.b);
                            }
                          }}
                          placeholder="#463272"
                          className="w-18 px-1.5 py-1 rounded-lg border border-[#E8DCCB] text-[11px] font-mono font-bold text-center"
                        />

                        {/* RGB Inputs */}
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <input
                            type="number"
                            min={0}
                            max={255}
                            value={newProdColorR}
                            onChange={(e) => {
                              const r = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                              setNewProdColorR(r);
                              setNewProdColorHex(rgbToHex(r, newProdColorG, newProdColorB));
                            }}
                            className="w-full px-1 py-1 rounded border border-[#E8DCCB] text-[10px] font-mono text-center font-bold text-rose-700"
                            title="Red (0-255)"
                          />
                          <input
                            type="number"
                            min={0}
                            max={255}
                            value={newProdColorG}
                            onChange={(e) => {
                              const g = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                              setNewProdColorG(g);
                              setNewProdColorHex(rgbToHex(newProdColorR, g, newProdColorB));
                            }}
                            className="w-full px-1 py-1 rounded border border-[#E8DCCB] text-[10px] font-mono text-center font-bold text-emerald-700"
                            title="Green (0-255)"
                          />
                          <input
                            type="number"
                            min={0}
                            max={255}
                            value={newProdColorB}
                            onChange={(e) => {
                              const b = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                              setNewProdColorB(b);
                              setNewProdColorHex(rgbToHex(newProdColorR, newProdColorG, b));
                            }}
                            className="w-full px-1 py-1 rounded border border-[#E8DCCB] text-[10px] font-mono text-center font-bold text-blue-700"
                            title="Blue (0-255)"
                          />
                        </div>
                      </div>

                      {/* Preset palette */}
                      <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                        <span className="text-[9px] text-[#735D50]">Presets:</span>
                        {BOUTIQUE_COLOR_PRESETS.slice(0, 8).map((p) => (
                          <button
                            key={p.hex}
                            type="button"
                            onClick={() => {
                              setNewProdColorName(p.name);
                              setNewProdColorHex(p.hex);
                              const rgb = hexToRgb(p.hex);
                              setNewProdColorR(rgb.r);
                              setNewProdColorG(rgb.g);
                              setNewProdColorB(rgb.b);
                            }}
                            className="w-4 h-4 rounded-full border border-black/20 hover:scale-125 transition-transform cursor-pointer"
                            style={{ backgroundColor: p.hex }}
                            title={`${p.name} (${p.hex})`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Photo 1 & Photo 2 for this Additional Color */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Photo 1: Full Look */}
                    <div className="space-y-1.5 p-2.5 rounded-xl bg-white border border-[#E8DCCB]">
                      <label className="text-[10px] uppercase font-bold text-[#392820] flex items-center justify-between">
                        <span>Photo 1 &bull; Full Dress Look</span>
                        <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">Color Primary</span>
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="url"
                          value={newProdColorPhoto1}
                          onChange={(e) => setNewProdColorPhoto1(e.target.value)}
                          placeholder="Paste image URL or upload &rarr;"
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#E8DCCB] text-[11px] font-mono"
                        />
                        <label className="px-2.5 py-1.5 rounded-lg bg-[#392820] text-white text-[10px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-[#111111]">
                          <UploadCloud className="w-3 h-3 text-[#D9A08C]" />
                          <span>{isUploadingNewColor1 ? '...' : 'Device'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingNewColor1}
                            onChange={(e) => handleUploadNewProdColorPhoto('photo1', e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Photo 2: Close-up Swipe */}
                    <div className="space-y-1.5 p-2.5 rounded-xl bg-white border border-amber-300">
                      <label className="text-[10px] uppercase font-bold text-[#392820] flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>Photo 2 &bull; Close-up Swipe Angle</span>
                        </span>
                        <span className="text-[9px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded font-semibold">Optional</span>
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="url"
                          value={newProdColorPhoto2}
                          onChange={(e) => setNewProdColorPhoto2(e.target.value)}
                          placeholder="Paste close-up URL or upload &rarr;"
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#E8DCCB] text-[11px] font-mono"
                        />
                        <label className="px-2.5 py-1.5 rounded-lg bg-amber-900 text-amber-100 text-[10px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-amber-950">
                          <UploadCloud className="w-3 h-3 text-amber-300" />
                          <span>{isUploadingNewColor2 ? '...' : 'Device'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingNewColor2}
                            onChange={(e) => handleUploadNewProdColorPhoto('photo2', e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Add Color Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddNewProdColor}
                      className="px-4 py-2 rounded-xl bg-[#392820] text-white hover:bg-[#111111] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#D9A08C]" />
                      <span>+ Add Color Shade to Product</span>
                    </button>
                  </div>
                </div>

                {/* Extra General Photos (Optional) */}
                <div className="pt-2 border-t border-[#E8DCCB] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#735D50]">
                      Extra Photoshoot Gallery ({newProdAdditionalImages.length}):
                    </span>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#D9A08C] text-[#392820] text-[11px] font-semibold cursor-pointer hover:bg-[#FAF7F2] transition-colors">
                      <UploadCloud className="w-3.5 h-3.5 text-[#D9A08C]" />
                      <span>{isUploadingNewProdAdditional ? 'Uploading...' : 'Upload Photos'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={isUploadingNewProdAdditional}
                        onChange={handleUploadNewProdAdditional}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {newProdAdditionalImages.map((extraUrl, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#735D50] w-14 shrink-0">Photo #{i + 2}</span>
                      <input
                        type="url"
                        value={extraUrl}
                        onChange={(e) => {
                          const updated = [...newProdAdditionalImages];
                          updated[i] = e.target.value;
                          setNewProdAdditionalImages(updated);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2] font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => setNewProdAdditionalImages(newProdAdditionalImages.filter((_, idx) => idx !== i))}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newProdExtraImageUrl}
                      onChange={(e) => setNewProdExtraImageUrl(e.target.value)}
                      placeholder="+ Or paste additional photoshoot photo URL"
                      className="flex-1 px-3 py-1.5 rounded-xl border border-[#E8DCCB] bg-white font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newProdExtraImageUrl.trim()) {
                          setNewProdAdditionalImages([...newProdAdditionalImages, newProdExtraImageUrl.trim()]);
                          setNewProdExtraImageUrl('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#E8D6C7] text-[#392820] border border-[#E8DCCB] font-semibold text-[11px] cursor-pointer"
                    >
                      + Add URL
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. FULL DESCRIPTION (AT THE LAST OF PRODUCT DETAILS) */}
              <div>
                <label className="font-semibold text-[#392820] block mb-1">Full Description</label>
                <textarea
                  rows={4}
                  value={newProdDescription}
                  onChange={(e) => setNewProdDescription(e.target.value)}
                  placeholder="e.g. Elevate your ethnic wardrobe with this elegant 3-piece Cotton Kurta Set. Featuring a straight-cut kurta with band collar, paired with matching trousers and dupatta..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProdIsNew}
                    onChange={(e) => setNewProdIsNew(e.target.checked)}
                    className="w-4 h-4 rounded text-[#392820]"
                  />
                  <span>Mark as New Arrival</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProdIsBest}
                    onChange={(e) => setNewProdIsBest(e.target.checked)}
                    className="w-4 h-4 rounded text-[#392820]"
                  />
                  <span>Mark as Bestseller</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E8DCCB]">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#392820] text-white font-semibold uppercase tracking-wider hover:bg-[#111111]"
                >
                  Publish Attire Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PRODUCT DETAILS */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-[#E8DCCB] shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E8DCCB] pb-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#D9A08C] font-semibold">Editing Product</span>
                <h3 className="font-serif text-2xl text-[#392820] font-medium">{editingProduct.name}</h3>
              </div>
              <button onClick={() => setEditingProduct(null)} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateProductSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-[#392820] block mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#392820] block mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={editingProduct.subtitle}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subtitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-[#392820] block mb-1">Category *</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => {
                      const newCat = e.target.value as ProductCategory;
                      if (newCat === 'sarees') {
                        const current = editingProduct.sizes && editingProduct.sizes.length > 0 ? editingProduct.sizes : [];
                        if (!current.some((s) => s.size === 'Free Size')) {
                          setEditingProduct({
                            ...editingProduct,
                            category: newCat,
                            sizes: [{ size: 'Free Size' as ProductSize, inStock: true, stockCount: 15 }, ...current],
                          });
                          return;
                        }
                      }
                      setEditingProduct({ ...editingProduct, category: newCat });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]"
                  >
                    <option value="co-ord-sets">Co-ord Sets</option>
                    <option value="kurtas">Kurtas &amp; Anarkalis</option>
                    <option value="sarees">Artisanal Sarees</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-[#392820] block text-xs">
                      Occasion (Select with Checkboxes) *
                    </label>
                    <span className="text-[10px] text-[#735D50] font-medium">
                      {
                        (editingProduct.occasion || '')
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean).length
                      }{' '}
                      selected
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {OCCASION_OPTIONS.map((occ) => {
                        const currentOccs = (editingProduct.occasion || '')
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean);
                        const isChecked = currentOccs.includes(occ);
                        return (
                          <label
                            key={occ}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer select-none transition-all text-xs font-medium ${
                              isChecked
                                ? 'bg-[#392820] text-white shadow-xs'
                                : 'text-[#392820] hover:bg-[#EFE6D8] bg-white border border-[#E8DCCB]/60'
                            } ${occ === 'College & Casual' ? 'sm:col-span-2' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                let updated: string[];
                                if (isChecked) {
                                  updated = currentOccs.filter((o) => o !== occ);
                                  if (updated.length === 0) updated = [occ];
                                } else {
                                  updated = [...currentOccs, occ];
                                }
                                setEditingProduct({
                                  ...editingProduct,
                                  occasion: updated.join(', ') as ProductOccasion,
                                });
                              }}
                              className="w-4 h-4 rounded border-[#D8C7B5] accent-[#C29200] text-[#392820] cursor-pointer"
                            />
                            <span className="flex-1 truncate">{occ}</span>
                            {isChecked && (
                              <span className="text-[10px] text-[#F3E5D8] font-normal">
                                ✓
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-[#392820] block mb-1">Selling Price (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2] font-semibold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#392820] block mb-1">MRP Original Price (₹ INR)</label>
                  <input
                    type="number"
                    value={editingProduct.originalPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]"
                  />
                </div>
              </div>

              {/* Fabric Details with Quick Preset Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#392820] block">
                    Fabric &amp; Craftsmanship Details *
                  </label>
                  <span className="text-[10px] text-[#735D50]">Quick select chip:</span>
                </div>
                <input
                  type="text"
                  required
                  value={editingProduct.fabric || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, fabric: e.target.value })}
                  placeholder="e.g. Regular Pure Cotton, Pure Chanderi Silk with Mulmul Lining"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2] text-xs font-medium"
                />
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {FABRIC_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, fabric: preset })}
                      className="px-2.5 py-0.5 rounded-full bg-white border border-[#E8DCCB] text-[10px] font-semibold text-[#735D50] hover:text-[#392820] hover:border-[#392820] transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Sizes & Live Stock Quantities for Editable Product */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DCCB] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="font-semibold text-[#392820] text-xs block">
                      Available Sizes &amp; Stock Quantities *
                    </label>
                    <p className="text-[11px] text-[#735D50]">
                      Specify which sizes are active and edit inventory counts for this garment.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {editingProduct.category === 'sarees' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct({
                              ...editingProduct,
                              sizes: [{ size: 'Free Size' as ProductSize, inStock: true, stockCount: 15 }],
                            });
                          }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all shadow-2xs ${
                            editingProduct.sizes?.length === 1 && editingProduct.sizes[0].size === 'Free Size'
                              ? 'bg-[#392820] text-white'
                              : 'bg-amber-100 text-[#392820] border border-amber-300 hover:bg-amber-200'
                          }`}
                        >
                          ✨ Free Size Only
                        </button>
                        {!editingProduct.sizes?.some((s) => s.size === 'Free Size') && (
                          <button
                            type="button"
                            onClick={() => {
                              const curr = editingProduct.sizes && editingProduct.sizes.length > 0 ? editingProduct.sizes : DEFAULT_SIZE_LIST;
                              setEditingProduct({
                                ...editingProduct,
                                sizes: [{ size: 'Free Size' as ProductSize, inStock: true, stockCount: 15 }, ...curr],
                              });
                            }}
                            className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-semibold hover:bg-emerald-100 shadow-2xs"
                          >
                            + Free Size
                          </button>
                        )}
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const list: ProductInventorySize[] = editingProduct.category === 'sarees'
                          ? [
                              { size: 'Free Size' as ProductSize, inStock: true, stockCount: 15 },
                              { size: 'M' as ProductSize, inStock: true, stockCount: 15 },
                              { size: 'L' as ProductSize, inStock: true, stockCount: 15 },
                              { size: 'XL' as ProductSize, inStock: true, stockCount: 12 },
                              { size: 'XXL' as ProductSize, inStock: true, stockCount: 10 },
                            ]
                          : [
                              { size: 'XS' as ProductSize, inStock: false, stockCount: 0 },
                              { size: 'S' as ProductSize, inStock: false, stockCount: 0 },
                              { size: 'M' as ProductSize, inStock: true, stockCount: 15 },
                              { size: 'L' as ProductSize, inStock: true, stockCount: 15 },
                              { size: 'XL' as ProductSize, inStock: true, stockCount: 12 },
                              { size: 'XXL' as ProductSize, inStock: true, stockCount: 10 },
                            ];
                        setEditingProduct({ ...editingProduct, sizes: list });
                      }}
                      className="px-2.5 py-1 rounded-full bg-white border border-[#E8DCCB] text-[10px] font-semibold text-[#392820] hover:bg-[#FAF7F2] shadow-2xs"
                    >
                      Standard (M–XXL)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const list: ProductInventorySize[] = editingProduct.category === 'sarees'
                          ? [
                              { size: 'Free Size' as ProductSize, inStock: true, stockCount: 15 },
                              { size: 'XS' as ProductSize, inStock: true, stockCount: 10 },
                              { size: 'S' as ProductSize, inStock: true, stockCount: 10 },
                              { size: 'M' as ProductSize, inStock: true, stockCount: 15 },
                              { size: 'L' as ProductSize, inStock: true, stockCount: 15 },
                              { size: 'XL' as ProductSize, inStock: true, stockCount: 12 },
                              { size: 'XXL' as ProductSize, inStock: true, stockCount: 10 },
                            ]
                          : [
                              { size: 'XS' as ProductSize, inStock: true, stockCount: 10 },
                              { size: 'S' as ProductSize, inStock: true, stockCount: 10 },
                              { size: 'M' as ProductSize, inStock: true, stockCount: 15 },
                              { size: 'L' as ProductSize, inStock: true, stockCount: 15 },
                              { size: 'XL' as ProductSize, inStock: true, stockCount: 12 },
                              { size: 'XXL' as ProductSize, inStock: true, stockCount: 10 },
                            ];
                        setEditingProduct({ ...editingProduct, sizes: list });
                      }}
                      className="px-2.5 py-1 rounded-full bg-white border border-[#E8DCCB] text-[10px] font-semibold text-[#392820] hover:bg-[#FAF7F2] shadow-2xs"
                    >
                      All {editingProduct.category === 'sarees' ? '(Free Size + XS–XXL)' : '(XS–XXL)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const current = editingProduct.sizes && editingProduct.sizes.length > 0 ? editingProduct.sizes : DEFAULT_SIZE_LIST;
                        const cleared = current.map((s) => ({ ...s, inStock: false, stockCount: 0 }));
                        setEditingProduct({ ...editingProduct, sizes: cleared });
                      }}
                      className="px-2.5 py-1 rounded-full bg-white border border-[#E8DCCB] text-[10px] font-semibold text-rose-600 hover:bg-rose-50 shadow-2xs"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  {(() => {
                    const currentSizes = editingProduct.sizes && editingProduct.sizes.length > 0 ? editingProduct.sizes : DEFAULT_SIZE_LIST;
                    let displaySizes = [...currentSizes];
                    if (editingProduct.category === 'sarees' && !displaySizes.some((s) => s.size === 'Free Size')) {
                      displaySizes = [{ size: 'Free Size' as ProductSize, inStock: true, stockCount: 15 }, ...displaySizes];
                    }
                    return displaySizes.map((sItem) => (
                      <div
                        key={sItem.size}
                        className={`p-2.5 rounded-xl border transition-all ${
                          sItem.inStock
                            ? sItem.size === 'Free Size'
                              ? 'bg-amber-50/70 border-amber-600 shadow-2xs ring-1 ring-amber-500/20'
                              : 'bg-white border-[#392820] shadow-2xs'
                            : 'bg-[#FAF7F2]/60 border-[#E8DCCB] opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-[#392820]">
                            <input
                              type="checkbox"
                              checked={sItem.inStock}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const exists = currentSizes.some((s) => s.size === sItem.size);
                                const base = exists ? currentSizes : [{ size: sItem.size, inStock: false, stockCount: 0 }, ...currentSizes];
                                const updatedSizes = base.map((s) =>
                                  s.size === sItem.size
                                    ? { ...s, inStock: checked, stockCount: checked ? (s.stockCount > 0 ? s.stockCount : 15) : 0 }
                                    : s
                                );
                                setEditingProduct({ ...editingProduct, sizes: updatedSizes });
                              }}
                              className="w-3.5 h-3.5 rounded text-[#392820]"
                            />
                            <span className={sItem.size === 'Free Size' ? 'text-amber-900 font-extrabold' : ''}>
                              {sItem.size}
                            </span>
                          </label>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              sItem.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sItem.inStock ? 'In Stock' : 'Out'}
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[9px] text-[#735D50] block">Stock Units:</span>
                          <input
                            type="number"
                            min={0}
                            disabled={!sItem.inStock}
                            value={sItem.stockCount}
                            onChange={(e) => {
                              const count = Math.max(0, parseInt(e.target.value) || 0);
                              const exists = currentSizes.some((s) => s.size === sItem.size);
                              const base = exists ? currentSizes : [{ size: sItem.size, inStock: false, stockCount: 0 }, ...currentSizes];
                              const updatedSizes = base.map((s) =>
                                s.size === sItem.size
                                  ? { ...s, stockCount: count, inStock: count > 0 }
                                  : s
                              );
                              setEditingProduct({ ...editingProduct, sizes: updatedSizes });
                            }}
                            className="w-full px-2 py-1 rounded-lg border border-[#E8DCCB] bg-white text-xs font-semibold text-center outline-none focus:border-[#392820] disabled:bg-gray-100 disabled:text-gray-400"
                          />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Color Variants & Photo Linkage (Swipe Left Feature) DIRECTLY BELOW THE PRODUCT in Edit Modal */}
              <div className="p-4 rounded-2xl bg-white border border-[#E8DCCB] space-y-4 shadow-sm">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-[#D9A08C]" />
                      <h4 className="font-serif text-sm font-semibold text-[#392820]">
                        Color Variants &amp; Photo Linkage (Swipe Left Feature)
                      </h4>
                    </div>
                    {editingProduct.colors && editingProduct.colors.length > 0 && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {editingProduct.colors.length} Color{editingProduct.colors.length > 1 ? 's' : ''} Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#735D50] mt-0.5">
                    Colors for this product appear directly below. Select colors using the <strong>circle picker</strong> or enter <strong>RGB / HEX</strong>. Assign Photo 1 (Full Dress) and Photo 2 (Close-up Swipe).
                  </p>
                </div>

                {/* List of Existing Colors for this Product */}
                {editingProduct.colors && editingProduct.colors.length > 0 && (
                  <div className="space-y-3">
                    {editingProduct.colors.map((col, idx) => {
                      const rgb = hexToRgb(col.hex);
                      const hasTwoPhotos = Boolean(col.closeUpImage);
                      const isEditingThis = editingVariantKey === col.name;

                      if (isEditingThis) {
                        return (
                          <div
                            key={col.name}
                            className="p-4 rounded-2xl bg-[#FFFBF7] border-2 border-[#D9A08C] space-y-3.5 shadow-md transition-all ring-2 ring-[#D9A08C]/20"
                          >
                            {/* Header with Live Swatch */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9A08C]/40 pb-2.5">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="w-6 h-6 rounded-full border border-black/20 shadow-xs shrink-0 ring-2 ring-white"
                                  style={{ backgroundColor: editVariantHex || col.hex }}
                                />
                                <div>
                                  <p className="font-bold text-xs text-[#392820] flex items-center gap-1.5">
                                    <span>Editing Variant #{idx + 1}:</span>
                                    <span className="text-[#C41D53] font-extrabold">{editVariantName || col.name}</span>
                                  </p>
                                  <p className="text-[10px] text-[#735D50] font-mono">
                                    {editVariantHex} &bull; rgb({editVariantR}, {editVariantG}, {editVariantB})
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-semibold text-[#735D50] bg-white px-2.5 py-1 rounded-full border border-[#D9A08C]/40">
                                Editing in progress &mdash; Save below
                              </span>
                            </div>

                            {/* Colour Name and Color Picker (Circle + Hex + RGB + Presets) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Edit Color Name */}
                              <div>
                                <label className="text-[10px] uppercase font-bold text-[#735D50] block mb-1">
                                  Colour Name *
                                </label>
                                <input
                                  type="text"
                                  value={editVariantName}
                                  onChange={(e) => setEditVariantName(e.target.value)}
                                  placeholder="e.g. Royal Purple, Wine, Slate-blue"
                                  className="w-full px-3 py-2 rounded-xl border border-[#D9A08C] bg-white text-xs text-[#392820] font-bold focus:ring-2 focus:ring-[#392820]/20 outline-none"
                                />
                              </div>

                              {/* Manual Color Picker (Circle + Hex + RGB) */}
                              <div>
                                <label className="text-[10px] uppercase font-bold text-[#735D50] block mb-1">
                                  Select Color (Circle / RGB / Hex) *
                                </label>
                                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white border border-[#D9A08C]">
                                  {/* Circle Picker (Label-wrapped for 100% reliable click/touch response) */}
                                  <label
                                    className="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-black/30 cursor-pointer hover:scale-110 active:scale-95 transition-transform shrink-0"
                                    style={{ backgroundColor: ensureHex7(editVariantHex) }}
                                    title="Click or touch circle to open color wheel / spectrum"
                                  >
                                    <input
                                      type="color"
                                      value={ensureHex7(editVariantHex)}
                                      onChange={(e) => {
                                        const hex = e.target.value;
                                        setEditVariantHex(hex);
                                        const rgbVal = hexToRgb(hex);
                                        setEditVariantR(rgbVal.r);
                                        setEditVariantG(rgbVal.g);
                                        setEditVariantB(rgbVal.b);
                                      }}
                                      className="sr-only"
                                    />
                                    <Palette className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none" />
                                  </label>

                                  {/* Hex */}
                                  <input
                                    type="text"
                                    value={editVariantHex}
                                    onChange={(e) => {
                                      let val = e.target.value;
                                      if (!val.startsWith('#') && val.length > 0) val = '#' + val;
                                      setEditVariantHex(val);
                                      if (val.length === 7 || val.length === 4) {
                                        const rgbVal = hexToRgb(val);
                                        setEditVariantR(rgbVal.r);
                                        setEditVariantG(rgbVal.g);
                                        setEditVariantB(rgbVal.b);
                                      }
                                    }}
                                    placeholder="#463272"
                                    className="w-20 px-1.5 py-1 rounded-lg border border-[#E8DCCB] text-[11px] font-mono font-bold text-center"
                                  />

                                  {/* RGB Inputs */}
                                  <div className="flex items-center gap-1 flex-1 min-w-0">
                                    <input
                                      type="number"
                                      min={0}
                                      max={255}
                                      value={editVariantR}
                                      onChange={(e) => {
                                        const r = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                                        setEditVariantR(r);
                                        setEditVariantHex(rgbToHex(r, editVariantG, editVariantB));
                                      }}
                                      className="w-full px-1 py-1 rounded border border-[#E8DCCB] text-[10px] font-mono text-center font-bold text-rose-700"
                                      title="Red (0-255)"
                                    />
                                    <input
                                      type="number"
                                      min={0}
                                      max={255}
                                      value={editVariantG}
                                      onChange={(e) => {
                                        const g = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                                        setEditVariantG(g);
                                        setEditVariantHex(rgbToHex(editVariantR, g, editVariantB));
                                      }}
                                      className="w-full px-1 py-1 rounded border border-[#E8DCCB] text-[10px] font-mono text-center font-bold text-emerald-700"
                                      title="Green (0-255)"
                                    />
                                    <input
                                      type="number"
                                      min={0}
                                      max={255}
                                      value={editVariantB}
                                      onChange={(e) => {
                                        const b = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                                        setEditVariantB(b);
                                        setEditVariantHex(rgbToHex(editVariantR, editVariantG, b));
                                      }}
                                      className="w-full px-1 py-1 rounded border border-[#E8DCCB] text-[10px] font-mono text-center font-bold text-blue-700"
                                      title="Blue (0-255)"
                                    />
                                  </div>
                                </div>

                                {/* Preset palette */}
                                <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                                  <span className="text-[9px] text-[#735D50]">Presets:</span>
                                  {BOUTIQUE_COLOR_PRESETS.map((p) => (
                                    <button
                                      key={p.hex}
                                      type="button"
                                      onClick={() => {
                                        setEditVariantHex(p.hex);
                                        const rgbVal = hexToRgb(p.hex);
                                        setEditVariantR(rgbVal.r);
                                        setEditVariantG(rgbVal.g);
                                        setEditVariantB(rgbVal.b);
                                        if (!editVariantName || editVariantName === col.name) {
                                          setEditVariantName(p.name);
                                        }
                                      }}
                                      className="w-4 h-4 rounded-full border border-black/20 hover:scale-125 transition-transform cursor-pointer"
                                      style={{ backgroundColor: p.hex }}
                                      title={`${p.name} (${p.hex})`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Photo 1 & Photo 2 Replacement Controls */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                              {/* Photo 1: Full Look */}
                              <div className="space-y-2 p-3 rounded-xl bg-white border border-[#D9A08C]">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-[#392820] flex items-center gap-1">
                                    <span className="w-4 h-4 rounded-full bg-[#392820] text-white flex items-center justify-center text-[9px] font-mono">1</span>
                                    <span>Photo 1 &bull; Full Dress Look (Main View)</span>
                                  </span>
                                  <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                                    Primary
                                  </span>
                                </div>

                                <div className="flex items-start gap-2.5">
                                  {editVariantPhoto1 ? (
                                    <div className="relative w-14 h-18 rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-[#E8DCCB] shadow-2xs">
                                      <Image src={editVariantPhoto1} alt="Photo 1" fill className="object-cover" />
                                      <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] text-white text-center py-0.5 font-semibold">
                                        Full Look
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="w-14 h-18 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-[9px] text-gray-400 shrink-0">
                                      No Photo
                                    </div>
                                  )}
                                  <div className="flex-1 space-y-1.5">
                                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#D9A08C] text-[#392820] hover:bg-[#F3ECE1] text-[11px] font-semibold cursor-pointer w-full justify-center transition-colors">
                                      {isUploadingVariantPhoto1 ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#392820]" />
                                      ) : (
                                        <Upload className="w-3.5 h-3.5 text-[#392820]" />
                                      )}
                                      <span>{isUploadingVariantPhoto1 ? 'Uploading...' : 'Upload New Photo from Device'}</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        disabled={isUploadingVariantPhoto1}
                                        onChange={(e) => handleUploadVariantPhoto('photo1', e)}
                                        className="hidden"
                                      />
                                    </label>
                                    <input
                                      type="text"
                                      value={editVariantPhoto1}
                                      onChange={(e) => setEditVariantPhoto1(e.target.value)}
                                      placeholder="Or paste image URL..."
                                      className="w-full px-2 py-1 rounded-lg border border-[#E8DCCB] text-[10px] text-[#392820]"
                                    />
                                    {editingProduct.images.length > 0 && (
                                      <select
                                        value={editingProduct.images.includes(editVariantPhoto1) ? editVariantPhoto1 : ''}
                                        onChange={(e) => {
                                          if (e.target.value) setEditVariantPhoto1(e.target.value);
                                        }}
                                        className="w-full px-2 py-1 rounded-lg border border-[#E8DCCB] bg-gray-50 text-[10px]"
                                      >
                                        <option value="">-- Or Pick from Product Gallery --</option>
                                        {editingProduct.images.map((img, i) => (
                                          <option key={i} value={img}>
                                            Photo #{i + 1} {i === 0 ? '(Cover)' : ''} &mdash; {img.slice(0, 30)}...
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Photo 2: Close-up / Design (Swipe Left) */}
                              <div className="space-y-2 p-3 rounded-xl bg-white border border-amber-300">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-amber-600" />
                                    <span>Photo 2 &bull; Close-up / Design (Swipe Left)</span>
                                  </span>
                                  {editVariantPhoto2 ? (
                                    <button
                                      type="button"
                                      onClick={() => setEditVariantPhoto2('')}
                                      className="text-[9px] text-rose-600 hover:text-rose-800 underline font-semibold cursor-pointer"
                                    >
                                      Remove Close-up
                                    </button>
                                  ) : (
                                    <span className="text-[9px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded font-semibold">
                                      Optional
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-start gap-2.5">
                                  {editVariantPhoto2 ? (
                                    <div className="relative w-14 h-18 rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-amber-300 shadow-2xs">
                                      <Image src={editVariantPhoto2} alt="Photo 2" fill className="object-cover" />
                                      <span className="absolute bottom-0 inset-x-0 bg-amber-900/90 text-[8px] text-white text-center py-0.5 font-semibold">
                                        Swipe Angle
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="w-14 h-18 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/50 flex items-center justify-center text-[8px] text-amber-700 text-center px-1 shrink-0">
                                      Single Photo Only
                                    </div>
                                  )}
                                  <div className="flex-1 space-y-1.5">
                                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] border border-amber-300 text-amber-900 hover:bg-amber-100 text-[11px] font-semibold cursor-pointer w-full justify-center transition-colors">
                                      {isUploadingVariantPhoto2 ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-800" />
                                      ) : (
                                        <Upload className="w-3.5 h-3.5 text-amber-800" />
                                      )}
                                      <span>{isUploadingVariantPhoto2 ? 'Uploading...' : 'Upload Close-up from Device'}</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        disabled={isUploadingVariantPhoto2}
                                        onChange={(e) => handleUploadVariantPhoto('photo2', e)}
                                        className="hidden"
                                      />
                                    </label>
                                    <input
                                      type="text"
                                      value={editVariantPhoto2}
                                      onChange={(e) => setEditVariantPhoto2(e.target.value)}
                                      placeholder="Or paste close-up URL..."
                                      className="w-full px-2 py-1 rounded-lg border border-[#E8DCCB] text-[10px] text-[#392820]"
                                    />
                                    {editingProduct.images.length > 0 && (
                                      <select
                                        value={editingProduct.images.includes(editVariantPhoto2) ? editVariantPhoto2 : ''}
                                        onChange={(e) => {
                                          if (e.target.value) setEditVariantPhoto2(e.target.value);
                                        }}
                                        className="w-full px-2 py-1 rounded-lg border border-[#E8DCCB] bg-gray-50 text-[10px]"
                                      >
                                        <option value="">-- No Close-up (Single Photo Only) --</option>
                                        {editingProduct.images.map((img, i) => (
                                          <option key={i} value={img}>
                                            Photo #{i + 1} &mdash; {img.slice(0, 30)}...
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Bottom Action Footer */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#D9A08C]/40">
                              <p className="text-[10px] text-[#735D50]">
                                Saves changes directly to this product in database without affecting other colors.
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={handleCancelEditVariant}
                                  className="px-3 py-1.5 rounded-xl border border-[#E8DCCB] bg-white text-[#735D50] hover:bg-gray-100 text-xs font-medium cursor-pointer transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditedVariant(editingProduct.id)}
                                  className="px-4 py-1.5 rounded-xl bg-[#392820] text-white hover:bg-[#111111] text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Save Colour Changes</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Normal view: exactly matches user's design, with the new "Edit Colour" button!
                      const isPaleBeige = col.hex === '#E8D6C7' || !col.hex;
                      const isActualBeige = /beige|champagne|cream|sand|wheat/i.test(col.name);
                      const displayColHex = (isPaleBeige && !isActualBeige) ? getColorHexFallback(col.name) : (col.hex || '#C41D53');
                      const displayRgb = hexToRgb(displayColHex);

                      return (
                        <div
                          key={col.name}
                          className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DCCB] space-y-2.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between border-b border-[#E8DCCB]/60 pb-2">
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => handleStartEditVariant(col)}
                                className="w-6 h-6 rounded-full border-2 border-white shadow-sm ring-1 ring-black/25 shrink-0 hover:scale-115 active:scale-95 transition-transform cursor-pointer relative group flex items-center justify-center"
                                style={{ backgroundColor: displayColHex }}
                                title={`Touch or click circle to edit ${col.name} color & photos`}
                              >
                                <Palette className="w-3 h-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                              </button>
                              <div onClick={() => handleStartEditVariant(col)} className="cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-xs text-[#392820] hover:text-[#C41D53] transition-colors">
                                    #{idx + 1} &bull; {col.name}
                                  </p>
                                  {hasTwoPhotos ? (
                                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full flex items-center gap-1">
                                      <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                      <span>2 Photos Active &bull; Swipe Left</span>
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-medium text-amber-800 bg-amber-100 px-2 py-0.2 rounded-full">
                                      1 Photo Active
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-[#735D50] font-mono hover:text-[#392820]">
                                  {displayColHex} &bull; rgb({displayRgb.r}, {displayRgb.g}, {displayRgb.b})
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEditVariant(col)}
                                className="px-2.5 py-1 rounded-lg bg-[#392820] text-white hover:bg-[#111111] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                                title="Edit this colour name, HEX code, and photos"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-[#D9A08C]" />
                                <span>Edit Colour</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveEditProdColor(col.name)}
                                className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                title="Delete color"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Color</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {/* Photo 1: Full Dress Look */}
                            <div className="space-y-1.5 p-2.5 rounded-xl bg-white border border-[#E8DCCB]">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-[#392820]">Photo 1 &bull; Full Dress Look</span>
                                <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">Primary</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {col.image ? (
                                  <div className="relative w-10 h-14 rounded-md overflow-hidden bg-gray-50 shrink-0 border border-[#E8DCCB]">
                                    <Image src={col.image} alt={col.name} fill className="object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-10 h-14 rounded-md border border-dashed border-gray-300 flex items-center justify-center text-[8px] text-gray-400 shrink-0">
                                    No Photo
                                  </div>
                                )}
                                <div className="flex-1 space-y-1">
                                  <select
                                    value={col.image || editingProduct.images[0] || ''}
                                    onChange={(e) => {
                                      const newImg = e.target.value;
                                      const updatedColors = editingProduct.colors.map((c) =>
                                        c.name === col.name
                                          ? { ...c, image: newImg, images: [newImg, c.closeUpImage].filter(Boolean) as string[] }
                                          : c
                                      );
                                      setEditingProduct({ ...editingProduct, colors: updatedColors });
                                    }}
                                    className="w-full px-2 py-1 rounded-lg border border-[#E8DCCB] text-[11px]"
                                  >
                                    {editingProduct.images.map((img, i) => (
                                      <option key={i} value={img}>Photo #{i + 1} &mdash; {img.slice(0, 30)}...</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* Photo 2: Close-up Swipe Angle */}
                            <div className="space-y-1.5 p-2.5 rounded-xl bg-white border border-amber-300">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                                  <span>Photo 2 &bull; Close-up (Swipe Left)</span>
                                </span>
                                {col.closeUpImage ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedColors = editingProduct.colors.map((c) =>
                                        c.name === col.name
                                          ? { ...c, closeUpImage: undefined, images: c.image ? [c.image] : [] }
                                          : c
                                      );
                                      setEditingProduct({ ...editingProduct, colors: updatedColors });
                                    }}
                                    className="text-[9px] text-rose-600 underline font-semibold cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                ) : (
                                  <span className="text-[9px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded font-semibold">Optional</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {col.closeUpImage ? (
                                  <div className="relative w-10 h-14 rounded-md overflow-hidden bg-gray-50 shrink-0 border border-amber-300">
                                    <Image src={col.closeUpImage} alt={`${col.name} close-up`} fill className="object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-10 h-14 rounded-md border border-dashed border-amber-300 bg-amber-50/50 flex items-center justify-center text-[8px] text-amber-700 shrink-0">
                                    Single Photo
                                  </div>
                                )}
                                <div className="flex-1 space-y-1">
                                  <select
                                    value={col.closeUpImage || ''}
                                    onChange={(e) => {
                                      const newCloseUp = e.target.value.trim() || undefined;
                                      const updatedColors = editingProduct.colors.map((c) =>
                                        c.name === col.name
                                          ? { ...c, closeUpImage: newCloseUp, images: [c.image, newCloseUp].filter(Boolean) as string[] }
                                          : c
                                      );
                                      setEditingProduct({ ...editingProduct, colors: updatedColors });
                                    }}
                                    className="w-full px-2 py-1 rounded-lg border border-[#E8DCCB] text-[11px]"
                                  >
                                    <option value="">-- No Close-up (Single Photo Only) --</option>
                                    {editingProduct.images.map((img, i) => (
                                      <option key={i} value={img}>Photo #{i + 1} &mdash; {img.slice(0, 30)}...</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add New Color Form Box inside Edit Modal */}
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#D9A08C]/60 space-y-3">
                  <span className="text-xs font-semibold text-[#392820] block">
                    + Add a New Color Shade:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Color Name */}
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#735D50] block mb-1">
                        Color Name *
                      </label>
                      <input
                        type="text"
                        value={editProdColorName}
                        onChange={(e) => setEditProdColorName(e.target.value)}
                        placeholder="e.g. Royal Purple, Rani Pink, Olive Green"
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-white text-xs text-[#392820] font-medium"
                      />
                    </div>

                    {/* Manual Color Picker (Circle + Hex + RGB) */}
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#735D50] block mb-1">
                        Select Color (Circle / RGB / Hex) *
                      </label>
                      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white border border-[#E8DCCB]">
                        {/* Circle Picker (Label-wrapped for 100% reliable click/touch response) */}
                        <label
                          className="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-black/30 cursor-pointer hover:scale-110 active:scale-95 transition-transform shrink-0"
                          style={{ backgroundColor: ensureHex7(editProdColorHex) }}
                          title="Click or touch circle to open color wheel / spectrum"
                        >
                          <input
                            type="color"
                            value={ensureHex7(editProdColorHex)}
                            onChange={(e) => {
                              const hex = e.target.value;
                              setEditProdColorHex(hex);
                              const rgbVal = hexToRgb(hex);
                              setEditProdColorR(rgbVal.r);
                              setEditProdColorG(rgbVal.g);
                              setEditProdColorB(rgbVal.b);
                            }}
                            className="sr-only"
                          />
                          <Palette className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none" />
                        </label>

                        {/* Hex */}
                        <input
                          type="text"
                          value={editProdColorHex}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (!val.startsWith('#') && val.length > 0) val = '#' + val;
                            setEditProdColorHex(val);
                            if (val.length === 7 || val.length === 4) {
                              const rgb = hexToRgb(val);
                              setEditProdColorR(rgb.r);
                              setEditProdColorG(rgb.g);
                              setEditProdColorB(rgb.b);
                            }
                          }}
                          placeholder="#463272"
                          className="w-18 px-1.5 py-1 rounded-lg border border-[#E8DCCB] text-[11px] font-mono font-bold text-center"
                        />

                        {/* RGB Inputs */}
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <input
                            type="number"
                            min={0}
                            max={255}
                            value={editProdColorR}
                            onChange={(e) => {
                              const r = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                              setEditProdColorR(r);
                              setEditProdColorHex(rgbToHex(r, editProdColorG, editProdColorB));
                            }}
                            className="w-full px-1 py-1 rounded border border-[#E8DCCB] text-[10px] font-mono text-center font-bold text-rose-700"
                            title="Red (0-255)"
                          />
                          <input
                            type="number"
                            min={0}
                            max={255}
                            value={editProdColorG}
                            onChange={(e) => {
                              const g = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                              setEditProdColorG(g);
                              setEditProdColorHex(rgbToHex(editProdColorR, g, editProdColorB));
                            }}
                            className="w-full px-1 py-1 rounded border border-[#E8DCCB] text-[10px] font-mono text-center font-bold text-emerald-700"
                            title="Green (0-255)"
                          />
                          <input
                            type="number"
                            min={0}
                            max={255}
                            value={editProdColorB}
                            onChange={(e) => {
                              const b = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                              setEditProdColorB(b);
                              setEditProdColorHex(rgbToHex(editProdColorR, editProdColorG, b));
                            }}
                            className="w-full px-1 py-1 rounded border border-[#E8DCCB] text-[10px] font-mono text-center font-bold text-blue-700"
                            title="Blue (0-255)"
                          />
                        </div>
                      </div>

                      {/* Preset palette */}
                      <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                        <span className="text-[9px] text-[#735D50]">Presets:</span>
                        {BOUTIQUE_COLOR_PRESETS.slice(0, 8).map((p) => (
                          <button
                            key={p.hex}
                            type="button"
                            onClick={() => {
                              setEditProdColorName(p.name);
                              setEditProdColorHex(p.hex);
                              const rgb = hexToRgb(p.hex);
                              setEditProdColorR(rgb.r);
                              setEditProdColorG(rgb.g);
                              setEditProdColorB(rgb.b);
                            }}
                            className="w-4 h-4 rounded-full border border-black/20 hover:scale-125 transition-transform cursor-pointer"
                            style={{ backgroundColor: p.hex }}
                            title={`${p.name} (${p.hex})`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Photo 1 & Photo 2 for this Color */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Photo 1: Full Look */}
                    <div className="space-y-1.5 p-2.5 rounded-xl bg-white border border-[#E8DCCB]">
                      <label className="text-[10px] uppercase font-bold text-[#392820] flex items-center justify-between">
                        <span>Photo 1 &bull; Full Dress Look</span>
                        <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">Primary</span>
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="url"
                          value={editProdColorPhoto1}
                          onChange={(e) => setEditProdColorPhoto1(e.target.value)}
                          placeholder="Paste image URL or upload &rarr;"
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#E8DCCB] text-[11px] font-mono"
                        />
                        <label className="px-2.5 py-1.5 rounded-lg bg-[#392820] text-white text-[10px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-[#111111]">
                          <UploadCloud className="w-3 h-3 text-[#D9A08C]" />
                          <span>{isUploadingEditColor1 ? '...' : 'Device'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingEditColor1}
                            onChange={(e) => handleUploadEditProdColorPhoto('photo1', e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Photo 2: Close-up Swipe */}
                    <div className="space-y-1.5 p-2.5 rounded-xl bg-white border border-amber-300">
                      <label className="text-[10px] uppercase font-bold text-[#392820] flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>Photo 2 &bull; Close-up Swipe Angle</span>
                        </span>
                        <span className="text-[9px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded font-semibold">Optional</span>
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="url"
                          value={editProdColorPhoto2}
                          onChange={(e) => setEditProdColorPhoto2(e.target.value)}
                          placeholder="Paste close-up URL or upload &rarr;"
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#E8DCCB] text-[11px] font-mono"
                        />
                        <label className="px-2.5 py-1.5 rounded-lg bg-amber-900 text-amber-100 text-[10px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-amber-950">
                          <UploadCloud className="w-3 h-3 text-amber-300" />
                          <span>{isUploadingEditColor2 ? '...' : 'Device'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingEditColor2}
                            onChange={(e) => handleUploadEditProdColorPhoto('photo2', e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Add Color Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddEditProdColor}
                      className="px-4 py-2 rounded-xl bg-[#392820] text-white hover:bg-[#111111] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#D9A08C]" />
                      <span>+ Add Color Shade to Product</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#392820] block">
                    Product Photographs ({editingProduct.images.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaModalProduct(editingProduct);
                      setEditingProduct(null);
                    }}
                    className="text-[11px] text-[#B79A72] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Open Full Media &amp; Colors Gallery &rarr;</span>
                  </button>
                </div>

                {/* Mini Image Preview Strip */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {editingProduct.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-[#E8DCCB] group">
                      <Image src={img} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          if (editingProduct.images.length <= 1) {
                            alert('Product must have at least 1 image.');
                            return;
                          }
                          const updated = editingProduct.images.filter((_, i) => i !== idx);
                          setEditingProduct({ ...editingProduct, images: updated });
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 bg-[#392820] text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Upload from Device or Paste URL */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#392820] text-white text-xs font-semibold cursor-pointer hover:bg-[#111111] transition-colors shadow-xs">
                      <UploadCloud className="w-3.5 h-3.5 text-[#D9A08C]" />
                      <span>{isUploadingEditPhoto ? 'Uploading...' : 'Upload Photos from Device'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={isUploadingEditPhoto}
                        onChange={handleUploadEditPhoto}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Or enter additional photo URL to append..."
                      id="new-edit-photo-input"
                      className="flex-1 px-3 py-1.5 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2] font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const inp = document.getElementById('new-edit-photo-input') as HTMLInputElement;
                        if (inp && inp.value.trim()) {
                          const updated = {
                            ...editingProduct,
                            images: [...editingProduct.images, inp.value.trim()],
                          };
                          setEditingProduct(updated);
                          updateProduct(editingProduct.id, { images: updated.images });
                          inp.value = '';
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#E8DCCB] border border-[#E8DCCB] text-[#392820] text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    >
                      + Add URL
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#392820] block mb-1">Full Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.inStock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, inStock: e.target.checked })}
                    className="w-4 h-4 rounded text-[#392820]"
                  />
                  <span className="font-semibold">In Stock Available</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isNewArrival}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isNewArrival: e.target.checked })}
                    className="w-4 h-4 rounded text-[#392820]"
                  />
                  <span>New Arrival</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isBestSeller}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isBestSeller: e.target.checked })}
                    className="w-4 h-4 rounded text-[#392820]"
                  />
                  <span>Bestseller</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E8DCCB]">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#392820] text-white font-semibold uppercase tracking-wider hover:bg-[#111111]"
                >
                  Save Changes Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: POST FESTIVAL OFFER */}
      {isNewOfferOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#E8DCCB] shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#E8DCCB] pb-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#D9A08C] font-semibold">Storewide Promotion</span>
                <h3 className="font-serif text-2xl text-[#392820] font-medium">+ Post Festival Offer</h3>
              </div>
              <button onClick={() => setIsNewOfferOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSaveFestivalOffer} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[#392820] block mb-1">Offer Title *</label>
                <input
                  type="text"
                  required
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  placeholder="e.g. Royal Diwali Festive Extravaganza"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#392820] block mb-1">Subtitle / Callout Details</label>
                <input
                  type="text"
                  value={offerSubtitle}
                  onChange={(e) => setOfferSubtitle(e.target.value)}
                  placeholder="e.g. Handcrafted Silk Sarees & Royal Chanderi Kurtas at 25% Off"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#392820] block mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={offerBadge}
                    onChange={(e) => setOfferBadge(e.target.value)}
                    placeholder="DIWALI SPECIAL"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#392820] block mb-1">Discount %</label>
                  <input
                    type="number"
                    value={offerDiscount}
                    onChange={(e) => setOfferDiscount(e.target.value)}
                    placeholder="25"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#392820] block mb-1">Voucher Code</label>
                  <input
                    type="text"
                    value={offerCoupon}
                    onChange={(e) => setOfferCoupon(e.target.value)}
                    placeholder="FESTIVE25"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2] font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#392820] block mb-1">Target Category</label>
                  <select
                    value={offerCategory}
                    onChange={(e) => setOfferCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2]"
                  >
                    <option value="all">Entire Boutique</option>
                    <option value="sarees">Sarees Only</option>
                    <option value="kurtas">Kurtas Only</option>
                    <option value="co-ord-sets">Co-ord Sets Only</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E8DCCB]">
                <button
                  type="button"
                  onClick={() => setIsNewOfferOpen(false)}
                  className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#D9A08C] text-[#231813] font-bold uppercase tracking-wider hover:bg-white border border-[#D9A08C]"
                >
                  Publish Festival Offer Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
