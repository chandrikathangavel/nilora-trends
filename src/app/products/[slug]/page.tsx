'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, useSearchParams } from 'next/navigation';
import { 
  Heart, 
  ShoppingBag, 
  Star, 
  Truck, 
  RotateCcw, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft,
  Sparkles, 
  Check,
  X,
  Palette
} from 'lucide-react';
import { DEMO_PRODUCTS } from '@/data/demoProducts';
import { ProductCard } from '@/components/home/ProductCard';
import { formatPrice } from '@/lib/utils';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { Product, ProductSize } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getColorHexFallback, isDefaultFeatureText } from '@/lib/api/products';

export const dynamic = 'force-dynamic';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const { products, isLoading, refetchCatalog } = useStore();
  const [productFromApi, setProductFromApi] = useState<Product | null>(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);
  const [hasCheckedApi, setHasCheckedApi] = useState(false);

  // Find product from store products, direct API fetch, or DEMO_PRODUCTS
  const product =
    products.find((p) => p.slug === resolvedParams.slug || p.id === resolvedParams.slug) ||
    productFromApi ||
    DEMO_PRODUCTS.find((p) => p.slug === resolvedParams.slug || p.id === resolvedParams.slug);

  useEffect(() => {
    if (!product && resolvedParams.slug) {
      setIsFetchingDirect(true);
      fetch(`/api/products/${encodeURIComponent(resolvedParams.slug)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.product) {
            setProductFromApi(data.product);
          }
        })
        .catch((err) => console.warn('Product direct fetch note:', err))
        .finally(() => {
          setIsFetchingDirect(false);
          setHasCheckedApi(true);
        });
    } else if (product) {
      setHasCheckedApi(true);
    }
  }, [product, resolvedParams.slug]);

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [colorPhotoIndex, setColorPhotoIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductSize>('M');
  const [selectedColor, setSelectedColor] = useState<string>('Default');
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [addToCartError, setAddToCartError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'fabric' | 'shipping'>('details');

  // Reviews states
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewerName, setReviewerName] = useState(user?.name || '');
  const [reviewChannel, setReviewChannel] = useState<string>('Boutique Walk-in Store');
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Review Form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitMessage, setReviewSubmitMessage] = useState<string | null>(null);
  const [reviewSubmitError, setReviewSubmitError] = useState<string | null>(null);

  // Fetch reviews for this product
  useEffect(() => {
    if (!product?.id) return;
    setLoadingReviews(true);
    fetch(`/api/reviews?productId=${encodeURIComponent(product.id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        }
      })
      .catch((e) => console.warn('Reviews note:', e))
      .finally(() => setLoadingReviews(false));
  }, [product?.id]);

  useEffect(() => {
    if (user?.name && !reviewerName) {
      setReviewerName(user.name);
    }
  }, [user?.name, reviewerName]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product?.id) return;
    if (!reviewComment.trim()) {
      setReviewSubmitError('Please share a few words about your experience.');
      return;
    }

    setSubmittingReview(true);
    setReviewSubmitError(null);
    setReviewSubmitMessage(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          rating: reviewRating,
          title: reviewTitle.trim() || undefined,
          comment: reviewComment.trim(),
          userId: user?.id || null,
          customerName: reviewerName.trim() || user?.name || 'Boutique Patron',
          purchaseChannel: reviewChannel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReviewSubmitError(data.error || 'Failed to submit review.');
      } else {
        setReviewSubmitMessage('Thank you! Your product review and rating have been published.');
        setReviewComment('');
        setReviewTitle('');
        if (data.review) {
          setReviews((prev) => [data.review, ...prev]);
        }
        refetchCatalog();
        setTimeout(() => setShowReviewForm(false), 3000);
      }
    } catch {
      setReviewSubmitError('An unexpected network error occurred.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Initialize size and color based on loaded product and ?color= query parameter
  useEffect(() => {
    if (!product) return;
    const initialSize = product.sizes?.find((s) => s.inStock)?.size || product.sizes?.[0]?.size || 'M';
    setSelectedSize(initialSize);

    let chosenColor = product.colors?.[0]?.name || 'Default';
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const colorParam = sp.get('color');
      if (colorParam) {
        const found = product.colors?.find(
          (c) => c.name.toLowerCase() === colorParam.toLowerCase()
        );
        if (found) {
          chosenColor = found.name;
        }
      }
    }

    setSelectedColor(chosenColor);
    const colorObj = product.colors?.find((c) => c.name === chosenColor);
    if (colorObj?.image) {
      const imgIdx = product.images.indexOf(colorObj.image);
      if (imgIdx !== -1) {
        setSelectedImageIndex(imgIdx);
        return;
      }
    }
    const colorIdx = product.colors?.findIndex((c) => c.name === chosenColor);
    if (colorIdx !== undefined && colorIdx !== -1 && product.images[colorIdx]) {
      setSelectedImageIndex(colorIdx);
    }
  }, [product]);

  if (!product && (isLoading || isFetchingDirect || !hasCheckedApi)) {
    return (
      <div className="bg-[#FAF7F2] min-h-screen py-24 px-4 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#D9A08C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-sm text-[#392820]">Retrieving couture garment details from Nilora database...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const activeColorObj = product.colors?.find(
    (c) => c.name.toLowerCase() === selectedColor.toLowerCase()
  ) || product.colors?.[0];

  const activeColorPhotos: string[] = [
    activeColorObj?.image,
    activeColorObj?.closeUpImage,
    ...(activeColorObj?.images || []),
  ].filter((url, idx, arr): url is string => Boolean(url) && arr.indexOf(url) === idx);

  const displayedPhotos: string[] =
    activeColorPhotos.length > 0 ? activeColorPhotos : product.images;

  const currentPhoto =
    displayedPhotos[colorPhotoIndex] || displayedPhotos[0] || product.images[0];

  const handleNextPhoto = () => {
    if (displayedPhotos.length <= 1) return;
    setColorPhotoIndex((prev) => (prev + 1) % displayedPhotos.length);
  };

  const handlePrevPhoto = () => {
    if (displayedPhotos.length <= 1) return;
    setColorPhotoIndex((prev) => (prev - 1 + displayedPhotos.length) % displayedPhotos.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const deltaX = touchStartX - e.changedTouches[0].clientX;
    const deltaY = touchStartY - e.changedTouches[0].clientY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        // Swiped left -> show next photo (e.g. Photo 2 Close-up view)
        handleNextPhoto();
      } else {
        // Swiped right -> show prev photo (e.g. Photo 1 Full look)
        handlePrevPhoto();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  const handleSelectImageIndex = (idx: number) => {
    setSelectedImageIndex(idx);
    setColorPhotoIndex(0);
    const clickedImg = product.images[idx];
    const matchingColor = product.colors.find((c) => c.image === clickedImg || c.closeUpImage === clickedImg) || product.colors[idx];
    if (matchingColor) {
      setSelectedColor(matchingColor.name);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('color', matchingColor.name);
        window.history.replaceState(null, '', url.toString());
      }
    }
  };

  const handleSelectColor = (colorName: string) => {
    setSelectedColor(colorName);
    setColorPhotoIndex(0);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('color', colorName);
      window.history.replaceState(null, '', url.toString());
    }
    const colorObj = product.colors.find((c) => c.name === colorName);
    if (colorObj?.image) {
      const imgIdx = product.images.indexOf(colorObj.image);
      if (imgIdx !== -1) {
        setSelectedImageIndex(imgIdx);
        return;
      }
    }
    const colorIdx = product.colors.findIndex((c) => c.name === colorName);
    if (colorIdx !== -1 && product.images[colorIdx]) {
      setSelectedImageIndex(colorIdx);
    }
  };

  const isFavorited = isInWishlist(product.id);
  const relatedProducts = DEMO_PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 3);

  const activeColorSizes =
    activeColorObj?.sizes && activeColorObj.sizes.length > 0
      ? activeColorObj.sizes
      : product.sizes && product.sizes.length > 0
      ? product.sizes
      : product.category === 'sarees'
      ? [{ size: 'Free Size' as ProductSize, inStock: true, stockCount: 15 }]
      : [];

  // Ensure selectedSize matches available sizes (e.g. Free Size for sarees)
  useEffect(() => {
    if (!activeColorSizes || activeColorSizes.length === 0) return;
    const exists = activeColorSizes.some(
      (s) => s.size.toLowerCase() === selectedSize.toLowerCase()
    );
    if (!exists) {
      const firstAvailable =
        activeColorSizes.find((s) => s.inStock)?.size ||
        activeColorSizes[0]?.size;
      if (firstAvailable) {
        setSelectedSize(firstAvailable);
      }
    }
  }, [activeColorSizes, selectedSize]);

  const selectedSizeInfo = activeColorSizes.find((s) => s.size.toLowerCase() === selectedSize.toLowerCase());

  const handleAddToCart = () => {
    setAddToCartError(null);
    if (selectedSizeInfo && (!selectedSizeInfo.inStock || selectedSizeInfo.stockCount <= 0)) {
      setAddToCartError(`Size ${selectedSize} in ${activeColorObj?.name || selectedColor} is currently sold out.`);
      setTimeout(() => setAddToCartError(null), 3500);
      return;
    }
    const res = addToCart(product, selectedSize, selectedColor, quantity);
    if (res.success) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2500);
    } else {
      setAddToCartError(res.error || 'Failed to add item to bag.');
      setTimeout(() => setAddToCartError(null), 3500);
    }
  };

  return (
    <div className="bg-[#F8F5F0] min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#735D50] mb-8 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-[#392820]">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#B79A72]" />
          <Link href={`/category/${product.category}`} className="hover:text-[#392820]">
            {product.categoryLabel}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#B79A72]" />
          <span className="text-[#392820] font-medium truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 bg-white rounded-3xl p-6 sm:p-10 border border-[#E8DCCB] shadow-sm">
          {/* Left: Product Images Gallery (with Swipe Left Inside Color) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Big Main Image Container */}
            <div
              className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-[#FAF7F2] border border-[#E8DCCB] shadow-inner select-none cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Image
                src={currentPhoto}
                alt={`${product.name} - ${activeColorObj?.name || selectedColor} (${colorPhotoIndex === 0 ? 'Full View' : 'Close-up View'})`}
                fill
                priority
                className="object-cover transition-opacity duration-300"
              />

              {/* Badges (Top Left) */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
                {product.isNewArrival && (
                  <span className="bg-[#392820] text-[#E8DCCB] text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full shadow-sm">
                    New In Boutique
                  </span>
                )}
                {product.isBestSeller && (
                  <span className="bg-[#B79A72] text-white text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full shadow-sm">
                    Boutique Bestseller
                  </span>
                )}
              </div>

              {/* Active Color Tag (Top Right) */}
              {activeColorObj && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full shadow-sm border border-black/10 z-10">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: activeColorObj.hex }}
                  />
                  <span className="text-[11px] font-semibold text-[#392820]">
                    {activeColorObj.name}
                  </span>
                </div>
              )}

              {/* Previous / Next Arrow Chevrons (when color has multiple photos) */}
              {displayedPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    aria-label="Previous angle"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-[#392820] shadow-md flex items-center justify-center transition-all cursor-pointer z-10 hover:scale-105 active:scale-95 border border-[#E8DCCB]"
                    title="View previous angle"
                  >
                    <ChevronLeft className="w-5 h-5 text-[#392820]" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    aria-label="Next angle / Close-up design"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-[#392820] shadow-md flex items-center justify-center transition-all cursor-pointer z-10 hover:scale-105 active:scale-95 border border-[#E8DCCB]"
                    title="Swipe or click for close-up view"
                  >
                    <ChevronRight className="w-5 h-5 text-[#392820]" />
                  </button>
                </>
              )}

              {/* Bottom Angle Indicator & Swipe Hint */}
              {displayedPhotos.length > 1 && (
                <div className="absolute bottom-4 inset-x-0 flex flex-col items-center gap-1.5 pointer-events-none z-10 px-3">
                  <div className="flex items-center gap-2 bg-[#1A1310]/85 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-[11px] font-medium shadow-lg pointer-events-auto">
                    {/* Dots */}
                    <div className="flex items-center gap-1.5 pr-2 border-r border-white/25">
                      {displayedPhotos.map((_, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setColorPhotoIndex(pIdx)}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            pIdx === colorPhotoIndex ? 'bg-[#D9A08C] w-4' : 'bg-white/40 hover:bg-white/70 w-2'
                          }`}
                          aria-label={`View photo ${pIdx + 1}`}
                        />
                      ))}
                    </div>
                    {/* Angle Name */}
                    <span className="font-semibold text-white">
                      {colorPhotoIndex === 0 ? '1/2 • Full Dress Look' : '2/2 • Close-up Design Detail'}
                    </span>
                    {/* Subtle Swipe Guidance */}
                    <span className="hidden sm:inline text-white/70 text-[10px]">
                      &bull; {colorPhotoIndex === 0 ? 'Swipe left for close-up view' : 'Swipe right for full view'} ⇄
                    </span>
                  </div>

                  {/* Mobile-only visible hint */}
                  <span className="sm:hidden text-[10px] text-white/95 bg-black/65 px-3 py-0.5 rounded-full backdrop-blur-xs font-medium tracking-wide">
                    {colorPhotoIndex === 0 ? '⇄ Swipe left to inspect close-up design' : '⇄ Swipe right for full dress view'}
                  </span>
                </div>
              )}
            </div>

            {/* Angles / Photos Available for this Color Dress */}
            {displayedPhotos.length > 1 && (
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DCCB] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-[#392820] font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D9A08C]" />
                    <span>Views Inside {activeColorObj?.name || selectedColor} ({displayedPhotos.length} Angles):</span>
                  </span>
                  <span className="text-[10px] text-[#735D50]">
                    Swipe left on dress or tap below
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {displayedPhotos.map((photoUrl, pIdx) => {
                    const isSelected = colorPhotoIndex === pIdx;
                    const label = pIdx === 0 ? 'Full Dress Look' : 'Close-up Design Detail';
                    return (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setColorPhotoIndex(pIdx)}
                        className={`flex items-center gap-2.5 p-2 pr-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white border-[#392820] shadow-sm ring-1 ring-[#392820]'
                            : 'bg-white/60 border-[#E8DCCB] hover:border-[#D9A08C]'
                        }`}
                      >
                        <div className="relative w-12 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                          <Image src={photoUrl} alt={label} fill className="object-cover" />
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] uppercase font-bold text-[#735D50] block">
                            Photo #{pIdx + 1}
                          </span>
                          <span className="text-xs font-semibold text-[#392820] block">
                            {label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Other Color Variants Swatches Row */}
            {product.colors && product.colors.length > 1 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-[#735D50] font-semibold flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#D9A08C]" />
                    <span>Available Color Shades ({product.colors.length}):</span>
                  </span>
                  <span className="text-[11px] text-[#392820] font-semibold">
                    Viewing: {selectedColor}
                  </span>
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {product.colors.map((color) => {
                    const isSelected = selectedColor.toLowerCase() === color.name.toLowerCase();
                    const colorImg = color.image || product.images[0];
                    const isPaleWhiteDefault = color.hex === '#E8D6C7' || !color.hex;
                    const isActuallyBeige = /beige|champagne|cream|sand|wheat/i.test(color.name);
                    const displayHex = (isPaleWhiteDefault && !isActuallyBeige) ? getColorHexFallback(color.name) : (color.hex || '#C41D53');
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => handleSelectColor(color.name)}
                        className={`relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer group ${
                          isSelected
                            ? 'border-[#392820] shadow-md ring-2 ring-[#392820]/30 scale-102'
                            : 'border-[#E8DCCB] opacity-80 hover:opacity-100 hover:border-[#D9A08C]'
                        }`}
                        title={`Switch to ${color.name}`}
                      >
                        <Image src={colorImg} alt={color.name} fill className="object-cover" />
                        <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-center gap-1 bg-[#1A1310]/85 backdrop-blur-xs py-0.5 px-1.5 rounded-full text-[9px] text-[#FAF7F2] font-medium truncate shadow-xs">
                          <span
                            className="w-2 h-2 rounded-full border border-white/50 shrink-0"
                            style={{ backgroundColor: displayHex }}
                          />
                          <span className="truncate">{color.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Product Buy Box */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Category & Occasion */}
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-[#735D50]">
                <span>{product.categoryLabel}</span>
                <span className="text-[#B79A72] font-semibold">&bull; {product.occasion}</span>
              </div>

              {/* Title & Subtitle */}
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl text-[#392820] font-medium leading-snug">
                  {product.name}
                </h1>
                <p className="text-xs sm:text-sm text-[#735D50] mt-1.5">{product.subtitle}</p>
              </div>

              {/* Rating & Verified Buyer Count */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                {product.reviewCount > 0 ? (
                  <>
                    <div className="flex items-center gap-1 bg-[#F8F5F0] px-2.5 py-1 rounded-md border border-[#E8DCCB]">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span className="font-bold text-[#392820]">{product.rating.toFixed(1)}</span>
                    </div>
                    <a href="#reviews-section" className="text-[#735D50] underline hover:text-[#392820]">
                      {product.reviewCount} Verified Buyer {product.reviewCount === 1 ? 'Review' : 'Reviews'}
                    </a>
                  </>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E8DCCB] text-[11px] font-medium text-[#735D50]">
                    No reviews yet &bull; Verified buyers can review after delivery
                  </span>
                )}
                <span className="text-[#735D50]">&bull; SKU: {product.sku}</span>
              </div>

              {/* Price & Stock Badge */}
              <div className="py-3 border-y border-[#F8F5F0] flex flex-wrap items-center gap-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-3xl font-semibold text-[#392820]">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice > product.price && (
                    <>
                      <span className="text-sm text-[#735D50] line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                        Save {product.discountPercent}%
                      </span>
                    </>
                  )}
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      product.inStock
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${product.inStock ? 'bg-emerald-600' : 'bg-rose-600 animate-pulse'}`} />
                    {product.inStock ? 'In Stock — Ready to Dispatch' : 'Currently Out of Stock'}
                  </span>
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#392820] mb-2">
                  Select Color: <span className="font-normal text-[#735D50]">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {product.colors.map((color) => {
                    const isSelected = selectedColor.toLowerCase() === color.name.toLowerCase();
                    const isPaleWhiteDefault = color.hex === '#E8D6C7' || !color.hex;
                    const isActuallyBeige = /beige|champagne|cream|sand|wheat/i.test(color.name);
                    const displayHex = (isPaleWhiteDefault && !isActuallyBeige) ? getColorHexFallback(color.name) : (color.hex || '#C41D53');
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => handleSelectColor(color.name)}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#392820] bg-[#392820] text-white shadow-sm ring-2 ring-[#392820]/20'
                            : 'border-[#E8DCCB] bg-white text-[#735D50] hover:border-[#B79A72] hover:text-[#392820]'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-full border shrink-0 ${isSelected ? 'border-white/60' : 'border-black/15'}`}
                          style={{ backgroundColor: displayHex }}
                        />
                        <span>{color.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#392820]">
                    Select Size: <span className="font-normal text-[#735D50]">{selectedSize}</span>
                  </label>
                  <Link href="/contact" className="text-xs text-[#B79A72] hover:underline font-medium">
                    Size &amp; Fit Guide
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeColorSizes.map((s) => {
                    const isAvailable = s.inStock && s.stockCount > 0;
                    return (
                      <button
                        key={s.size}
                        disabled={!isAvailable}
                        onClick={() => setSelectedSize(s.size)}
                        className={`min-w-12 py-2 px-3.5 rounded-xl text-xs font-semibold tracking-wider transition-all border ${
                          selectedSize === s.size
                            ? 'bg-[#392820] text-white border-[#392820] shadow-md ring-2 ring-[#392820]/20'
                            : isAvailable
                            ? 'bg-white text-[#392820] border-[#E8DCCB] hover:border-[#B79A72] hover:bg-[#FAF7F2]'
                            : 'bg-neutral-100 text-neutral-400 border-dashed border-neutral-300 cursor-not-allowed line-through opacity-70'
                        }`}
                        title={isAvailable ? `${s.stockCount} in stock for ${activeColorObj?.name || selectedColor}` : `Sold out in ${activeColorObj?.name || selectedColor}`}
                      >
                        {s.size}
                      </button>
                    );
                  })}
                </div>
                {selectedSizeInfo && selectedSizeInfo.inStock && selectedSizeInfo.stockCount <= 5 && selectedSizeInfo.stockCount > 0 && (
                  <p className="text-[11px] text-amber-700 font-medium mt-2 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Only {selectedSizeInfo.stockCount} left in size {selectedSize} for {activeColorObj?.name || selectedColor}!
                  </p>
                )}
                {selectedSizeInfo && (!selectedSizeInfo.inStock || selectedSizeInfo.stockCount <= 0) && (
                  <p className="text-[11px] text-rose-700 font-medium mt-2 flex items-center gap-1">
                    <span>Sold out in size {selectedSize} for {activeColorObj?.name || selectedColor}. Please choose another size or color.</span>
                  </p>
                )}
              </div>

              {/* Quantity & CTA Buttons */}
              <div className="pt-2 space-y-3">
                {addToCartError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <span className="font-semibold">{addToCartError}</span>
                  </div>
                )}
                <div className="flex gap-3">
                  <div className="flex items-center border border-[#E8DCCB] rounded-2xl bg-[#F8F5F0] px-3">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-2 py-2 text-sm font-bold text-[#392820] hover:text-[#B79A72]"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-semibold text-[#392820] select-none">{quantity}</span>
                    <button
                      onClick={() => {
                        const maxStock = selectedSizeInfo?.stockCount || 50;
                        setQuantity((q) => Math.min(maxStock, q + 1));
                      }}
                      className="px-2 py-2 text-sm font-bold text-[#392820] hover:text-[#B79A72]"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <button
                    disabled={!product.inStock}
                    onClick={handleAddToCart}
                    className={`flex-1 py-4 px-6 rounded-2xl text-xs font-semibold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all ${
                      !product.inStock
                        ? 'bg-neutral-200 text-neutral-500 border border-neutral-300 cursor-not-allowed shadow-none'
                        : addedSuccess
                        ? 'bg-emerald-700 text-white'
                        : 'bg-[#392820] text-[#F8F5F0] hover:bg-[#B79A72]'
                    }`}
                  >
                    {!product.inStock ? (
                      <>
                        <X className="w-4 h-4 text-rose-500" /> Currently Out of Stock
                      </>
                    ) : addedSuccess ? (
                      <>
                        <Check className="w-4 h-4" /> Added to Your Bag!
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 text-[#E8DCCB]" /> Add to Boutique Bag
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`p-4 rounded-2xl border transition-colors ${
                      isFavorited
                        ? 'bg-[#392820] text-rose-400 border-[#392820]'
                        : 'bg-[#F8F5F0] text-[#392820] border-[#E8DCCB] hover:text-rose-500'
                    }`}
                    title="Save to Wishlist"
                  >
                    <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current text-rose-500' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Guarantees Strip */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#F8F5F0] text-center">
                <div className="p-2 rounded-xl bg-[#F8F5F0]/80">
                  <Truck className="w-4 h-4 text-[#B79A72] mx-auto mb-1" />
                  <p className="text-[10px] font-semibold text-[#392820]">Free Shipping</p>
                  <p className="text-[9px] text-[#735D50]">On orders &gt; ₹1,999</p>
                </div>
                <div className="p-2 rounded-xl bg-[#F8F5F0]/80">
                  <RotateCcw className="w-4 h-4 text-[#B79A72] mx-auto mb-1" />
                  <p className="text-[10px] font-semibold text-[#392820]">7-Day Exchange</p>
                  <p className="text-[9px] text-[#735D50]">Hassle-free pickup</p>
                </div>
                <div className="p-2 rounded-xl bg-[#F8F5F0]/80">
                  <ShieldCheck className="w-4 h-4 text-[#B79A72] mx-auto mb-1" />
                  <p className="text-[10px] font-semibold text-[#392820]">Pure Weaves</p>
                  <p className="text-[9px] text-[#735D50]">Certified authentic</p>
                </div>
              </div>
            </div>

            {/* Accordion Tabs for Details */}
            <div className="border-t border-[#E8DCCB] pt-4">
              <div className="flex border-b border-[#E8DCCB] text-xs font-semibold uppercase tracking-wider">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-2.5 px-3 border-b-2 transition-all ${
                    activeTab === 'details'
                      ? 'border-[#392820] text-[#392820]'
                      : 'border-transparent text-[#735D50] hover:text-[#392820]'
                  }`}
                >
                  Features
                </button>
                <button
                  onClick={() => setActiveTab('fabric')}
                  className={`pb-2.5 px-3 border-b-2 transition-all ${
                    activeTab === 'fabric'
                      ? 'border-[#392820] text-[#392820]'
                      : 'border-transparent text-[#735D50] hover:text-[#392820]'
                  }`}
                >
                  Fabric &amp; Care
                </button>
                <button
                  onClick={() => setActiveTab('shipping')}
                  className={`pb-2.5 px-3 border-b-2 transition-all ${
                    activeTab === 'shipping'
                      ? 'border-[#392820] text-[#392820]'
                      : 'border-transparent text-[#735D50] hover:text-[#392820]'
                  }`}
                >
                  Shipping &amp; Delivery
                </button>
              </div>

              <div className="pt-4 text-xs text-[#735D50] leading-relaxed">
                {activeTab === 'details' && (
                  <div className="space-y-3">
                    <p className="whitespace-pre-line">{product.description}</p>
                    {product.features && product.features.filter((f) => !isDefaultFeatureText(f)).length > 0 && (
                      <ul className="list-disc pl-4 space-y-1 text-[#392820]">
                        {product.features
                          .filter((feat) => !isDefaultFeatureText(feat))
                          .map((feat, i) => (
                            <li key={i}>{feat}</li>
                          ))}
                      </ul>
                    )}
                  </div>
                )}

                {activeTab === 'fabric' && (
                  <div className="space-y-3">
                    <p>
                      <strong>Fabric:</strong> {product.fabric}
                    </p>
                    <p className="font-semibold text-[#392820]">Care Instructions:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {product.careInstructions.map((inst, i) => (
                        <li key={i}>{inst}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeTab === 'shipping' && (
                  <div className="space-y-2">
                    <p>
                      📦 <strong>Pan-India Express:</strong> Dispatches within 24-48 business hours. Deliveries typically take 3-5 working days across metro hubs.
                    </p>
                    <p>
                      🚚 <strong>Complimentary Shipping:</strong> Free shipping applies automatically on all orders over ₹1,999.
                    </p>
                    <p>
                      🔄 <strong>Easy Exchanges:</strong> We offer 7-day size and design exchanges with doorstep reverse pickup across eligible pincodes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews & Ratings Section */}
        <div id="reviews-section" className="mt-12 sm:mt-16 bg-white rounded-3xl p-6 sm:p-10 border border-[#E8DCCB] shadow-sm space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#FAF7F2]">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#D9A08C] font-bold">
                Authentic Client Experiences
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#392820] font-medium mt-1">
                Customer Reviews &amp; Ratings
              </h2>
              <p className="text-xs text-[#735D50] mt-1 max-w-xl leading-relaxed">
                Purchased at our boutique offline store or online? We warmly welcome all patrons to review the fabric, embroidery, craftsmanship, and fit.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {reviews.length > 0 && (
                <div className="flex items-center gap-3 bg-[#FAF7F2] px-4 py-2.5 rounded-2xl border border-[#E8DCCB]">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="font-serif text-xl font-bold text-[#392820]">
                      {(reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0) / reviews.length).toFixed(1)}
                    </span>
                  </div>
                  <div className="text-left text-[11px] text-[#735D50] border-l border-[#E8DCCB] pl-3">
                    <p className="font-semibold text-[#392820]">
                      {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
                    </p>
                    <p>Boutique &amp; Online Patrons</p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowReviewForm((prev) => !prev)}
                className="px-5 py-2.5 rounded-full bg-[#392820] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#111111] transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{showReviewForm ? 'Close Form' : 'Write a Review'}</span>
              </button>
            </div>
          </div>

          {/* Open Review Submission Box (Anyone can post: walk-in, offline, or online) */}
          {showReviewForm && (
            <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#E8DCCB] space-y-4 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8B5E3C] bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                  <Sparkles className="w-3.5 h-3.5 text-[#D9A08C]" />
                  <span>Open Feedback: Boutique Walk-in, Offline &amp; Online Patrons</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="text-xs text-[#735D50] hover:text-[#392820] underline font-medium"
                >
                  Cancel
                </button>
              </div>

              <div>
                <h3 className="font-serif text-lg font-semibold text-[#392820]">
                  Share Your Review for this Garment
                </h3>
                <p className="text-xs text-[#735D50]">
                  Share your genuine feedback on the fabric softness, embroidery craftsmanship, fitting, and overall boutique experience.
                </p>
              </div>

              {reviewSubmitMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{reviewSubmitMessage}</span>
                </div>
              )}

              {reviewSubmitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                  {reviewSubmitError}
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-4 pt-1">
                {/* Where was it experienced / purchased? */}
                <div>
                  <label className="block text-xs font-semibold text-[#392820] mb-1.5">
                    Your Shopping / Feedback Experience:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'Boutique Walk-in Store', label: '🏬 Boutique Walk-in Store' },
                      { key: 'Offline Store Purchase', label: '🛍️ Offline Store Purchase' },
                      { key: 'Online Boutique Order', label: '📦 Online Boutique Order' },
                      { key: 'Fabric & Fit Feedback', label: '🪡 Fabric & Silhouette Feedback' },
                    ].map((chan) => (
                      <button
                        key={chan.key}
                        type="button"
                        onClick={() => setReviewChannel(chan.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          reviewChannel === chan.key
                            ? 'bg-[#392820] text-white border-[#392820] shadow-xs'
                            : 'bg-white text-[#735D50] border-[#E8DCCB] hover:border-[#B79A72]'
                        }`}
                      >
                        {chan.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reviewer Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#392820] mb-1">
                      Your Name or Initials:
                    </label>
                    <input
                      type="text"
                      required
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="e.g. Ananya M. or Boutique Patron"
                      className="w-full bg-white border border-[#E8DCCB] px-4 py-2.5 rounded-xl text-xs text-[#392820] focus:ring-2 focus:ring-[#D9A08C] outline-none"
                    />
                  </div>

                  {/* Rating Stars */}
                  <div>
                    <label className="block text-xs font-semibold text-[#392820] mb-1">
                      Your Rating:
                    </label>
                    <div className="flex items-center gap-1.5 pt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                          title={`${star} Star${star > 1 ? 's' : ''}`}
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= reviewRating
                                ? 'fill-amber-500 text-amber-500'
                                : 'text-neutral-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-[#392820] ml-2">
                        {reviewRating} of 5 Stars
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Headline */}
                <div>
                  <label className="block text-xs font-semibold text-[#392820] mb-1">
                    Review Headline (Optional):
                  </label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Stunning embroidery & flawless cotton drape"
                    className="w-full bg-white border border-[#E8DCCB] px-4 py-2.5 rounded-xl text-xs text-[#392820] focus:ring-2 focus:ring-[#D9A08C] outline-none"
                  />
                </div>

                {/* Comment / Feedback */}
                <div>
                  <label className="block text-xs font-semibold text-[#392820] mb-1">
                    Your Review &amp; Feedback:
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your thoughts on the pure fabric feel, stitch precision, colors, design details, and fit..."
                    className="w-full bg-white border border-[#E8DCCB] p-4 rounded-xl text-xs text-[#392820] focus:ring-2 focus:ring-[#D9A08C] outline-none resize-none"
                    required
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-6 py-2.5 rounded-full bg-[#392820] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#111111] transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {submittingReview ? 'Publishing Review...' : 'Publish Public Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of Reviews or Empty State */}
          {loadingReviews ? (
            <div className="py-8 text-center text-xs text-[#735D50] animate-pulse">
              Loading customer reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 space-y-4 bg-[#FAF7F2]/60 rounded-3xl border border-dashed border-[#E8DCCB]">
              <div className="w-12 h-12 rounded-full bg-white text-[#D9A08C] flex items-center justify-center mx-auto border border-[#E8DCCB] shadow-xs">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#392820]">
                No Reviews Yet
              </h3>
              <p className="text-xs text-[#735D50] max-w-md mx-auto leading-relaxed">
                Be the first to review this artisanal silhouette! Whether you bought it at our offline boutique store or online, we would love to hear your feedback on the fabric, fit, and craftsmanship.
              </p>
              <button
                type="button"
                onClick={() => setShowReviewForm(true)}
                className="mt-2 px-5 py-2.5 rounded-full bg-[#392820] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#111111] transition-all inline-flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Write the First Review</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev: any) => {
                const date = rev.created_at
                  ? new Date(rev.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Recent Patron Review';

                // Parse author & channel if present in comment
                let cleanComment = rev.comment || '';
                let authorDisplay = 'Boutique Patron';
                let channelBadge = '🏬 Boutique Store Patron';

                const metaMatch = cleanComment.match(/^\[Author:\s*(.*?)\s*\|\s*Channel:\s*(.*?)\]\n/);
                if (metaMatch) {
                  authorDisplay = metaMatch[1];
                  channelBadge = metaMatch[2];
                  cleanComment = cleanComment.replace(metaMatch[0], '');
                } else if (rev.title && rev.title.includes('•')) {
                  const parts = rev.title.split('•');
                  channelBadge = parts[0]?.trim() || channelBadge;
                  authorDisplay = parts[1]?.trim() || authorDisplay;
                }

                return (
                  <div
                    key={rev.id}
                    className="bg-[#FAF7F2]/60 rounded-2xl p-5 border border-[#E8DCCB] space-y-3 shadow-2xs hover:border-[#D9A08C] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < Number(rev.rating || 5)
                                ? 'fill-current text-amber-500'
                                : 'text-neutral-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-[#735D50]">{date}</span>
                    </div>

                    <div className="space-y-1">
                      {rev.title && !rev.title.includes('•') && (
                        <h4 className="font-serif text-sm font-semibold text-[#392820]">
                          {rev.title}
                        </h4>
                      )}
                      <p className="text-xs text-[#523F34] leading-relaxed">
                        {cleanComment}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#E8DCCB]/60 flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-[#392820] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D9A08C]" />
                        <span>{authorDisplay}</span>
                      </span>
                      <span className="text-[#8B5E3C] bg-amber-50/80 px-2.5 py-0.5 rounded-full border border-amber-200/80 font-medium">
                        {channelBadge.startsWith('🏬') || channelBadge.startsWith('🛍️') || channelBadge.startsWith('📦')
                          ? channelBadge
                          : `✨ ${channelBadge}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Related Category Recommendations */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 sm:mt-24">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="text-xs uppercase tracking-[0.2em] text-[#B79A72] font-semibold">
                Complete Your Look
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#392820] font-medium mt-1">
                More from {product.categoryLabel}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
