'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  Package,
  Truck,
  ArrowLeft,
  Calendar,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
  Star,
  X,
  Check,
  CheckCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const orderId = (params?.id as string) || '';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Review modal state
  const [reviewModalItem, setReviewModalItem] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const handleOpenReviewModal = (item: any) => {
    setReviewModalItem(item);
    setReviewRating(5);
    setReviewTitle('');
    setReviewComment('');
    setReviewSuccess(null);
    setReviewError(null);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalItem) return;
    if (!reviewComment.trim()) {
      setReviewError('Please write a short review.');
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: reviewModalItem.product_id || reviewModalItem.id,
          rating: reviewRating,
          title: reviewTitle.trim() || undefined,
          comment: reviewComment.trim(),
          orderId: order?.id,
          userId: user?.id,
          customerName: user?.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || 'Failed to submit review.');
      } else {
        setReviewSuccess('Thank you! Your verified rating and review have been published.');
        setTimeout(() => {
          setReviewModalItem(null);
        }, 2200);
      }
    } catch {
      setReviewError('Network error occurred.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const fetchOrderDetails = () => {
    const userParam = user?.id ? `?userId=${encodeURIComponent(user.id)}` : '';

    fetch(`/api/orders/${orderId}${userParam}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 403) {
          setAuthError('Access Denied: You do not have permission to view this private order.');
        } else if (!res.ok) {
          setAuthError(data.error || 'Order not found.');
        } else if (data.success && data.order) {
          setOrder(data.order);
        }
      })
      .catch((err) => {
        setAuthError('Failed to load order details.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isLoading) return;
    if (!orderId) return;

    setLoading(true);
    setAuthError(null);
    fetchOrderDetails();

    // Live polling every 12 seconds to automatically reflect status updates from admin
    const pollInterval = setInterval(() => {
      fetchOrderDetails();
    }, 12000);

    return () => clearInterval(pollInterval);
  }, [orderId, user?.id, isLoading]);

  if (loading) {
    return (
      <div className="bg-[#FAF7F2] min-h-screen py-16 px-4 flex items-center justify-center">
        <p className="text-xs text-[#735D50] animate-pulse">Loading order details...</p>
      </div>
    );
  }

  if (authError || !order) {
    return (
      <div className="bg-[#FAF7F2] min-h-screen py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#E8D6C7] shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-[#392820]">
            Private Order Record
          </h2>
          <p className="text-xs text-[#735D50] leading-relaxed">
            {authError || 'Only the order owner or an authorized boutique administrator can access this record.'}
          </p>
          <div className="pt-2">
            <Link
              href="/profile/orders"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#392820] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#111111]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const shipping = order.shipping_address_snapshot;
  const items = order.items || order.order_items || [];
  const orderNumber = order.order_number || order.id;

  const STATUS_STEPS = [
    { key: 'confirmed', label: 'Confirmed Order', icon: CheckCircle2 },
    { key: 'packed', label: 'Atelier Packed', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCheck },
  ];

  const currentStatusIdx = STATUS_STEPS.findIndex((s) => s.key === order.order_status?.toLowerCase());
  const activeStep = currentStatusIdx !== -1 ? currentStatusIdx : 0;

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation & Order Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/profile/orders"
              className="inline-flex items-center gap-1.5 text-xs text-[#735D50] hover:text-[#392820] transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to All Orders</span>
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-serif text-2xl sm:text-3xl text-[#392820] font-medium">
                Order #{orderNumber}
              </h1>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-2xs inline-flex items-center gap-1.5 ${
                  order.order_status === 'delivered'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : order.order_status === 'shipped'
                    ? 'bg-blue-100 text-blue-900 border-blue-300'
                    : order.order_status === 'packed'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : order.order_status === 'cancelled'
                    ? 'bg-rose-100 text-rose-900 border-rose-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}
              >
                {order.order_status === 'delivered' ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Delivered</span>
                  </>
                ) : order.order_status === 'shipped' ? (
                  <>
                    <Truck className="w-3.5 h-3.5 text-blue-700" />
                    <span>Shipped</span>
                  </>
                ) : order.order_status === 'packed' ? (
                  <>
                    <Package className="w-3.5 h-3.5 text-amber-700" />
                    <span>Atelier Packed</span>
                  </>
                ) : order.order_status === 'cancelled' ? (
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

              <button
                type="button"
                onClick={fetchOrderDetails}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#735D50] hover:text-[#392820] bg-white px-2.5 py-1 rounded-lg border border-[#E8D6C7] transition-colors cursor-pointer"
                title="Refresh order status"
              >
                <RefreshCw className="w-3 h-3 text-[#D9A08C]" />
                <span>Refresh Status</span>
              </button>
            </div>
            <p className="text-xs text-[#735D50] mt-1">
              Placed on {new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-[#735D50] block">Final Order Total</span>
            <p className="font-serif text-2xl font-bold text-[#392820]">
              {formatPrice(order.total_amount || 499)}
            </p>
          </div>
        </div>

        {/* Dynamic Status Information Banner */}
        {order.order_status === 'delivered' ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3 shadow-xs">
            <CheckCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-sm text-emerald-900">Order Delivered to Doorstep</p>
              <p className="text-emerald-800/90 leading-relaxed">
                Your luxury Nilora ensemble has been safely delivered. We hope you adore your handcrafted pieces! In case of size alterations or exchanges, reach our boutique concierge within 7 days.
              </p>
            </div>
          </div>
        ) : order.order_status === 'shipped' ? (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-start gap-3 shadow-xs">
            <Truck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-sm text-blue-900">Order Shipped &amp; In Transit</p>
              <p className="text-blue-800/90 leading-relaxed">
                Your handcrafted attire has been dispatched with <strong>{order.tracking?.carrier || 'Delhivery Express'}</strong> under tracking AWB <strong className="font-mono">{order.tracking?.tracking_number}</strong>. It is on its way to your destination.
              </p>
            </div>
          </div>
        ) : order.order_status === 'packed' ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-3 shadow-xs">
            <Package className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-sm text-amber-900">Atelier Packed &amp; Steam Pressed</p>
              <p className="text-amber-800/90 leading-relaxed">
                Your garments have been meticulously inspected, pressed, and sealed into signature presentation packaging, ready for courier dispatch.
              </p>
            </div>
          </div>
        ) : order.order_status === 'cancelled' ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex items-start gap-3 shadow-xs">
            <X className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-sm text-rose-900">Order Cancelled</p>
              <p className="text-rose-800/90 leading-relaxed">
                This boutique order was cancelled. Reserved inventory has been restored to the atelier catalog.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-sm text-emerald-900">Confirmed Order</p>
              <p className="text-emerald-800/90 leading-relaxed">
                Your order is confirmed by Nilora Trends atelier.
              </p>
            </div>
          </div>
        )}

        {/* Fulfillment Tracking Progress Timeline */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8D6C7] shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#FAF7F2] pb-3">
            <h3 className="font-serif text-base font-semibold text-[#392820] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#D9A08C]" />
              <span>Delivery &amp; Tracking Timeline</span>
            </h3>
            <span className="font-mono text-xs text-[#735D50]">
              Carrier: {order.tracking?.carrier || 'Delhivery Boutique Express'}
            </span>
          </div>

          {/* Stepper */}
          <div className="grid grid-cols-4 gap-2 text-center relative">
            {STATUS_STEPS.map((step, idx) => {
              const isPastOrCurrent = idx <= activeStep;
              const Icon = step.icon;
              return (
                <div key={step.key} className="space-y-2 relative z-10">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full mx-auto flex items-center justify-center border transition-all ${
                      isPastOrCurrent
                        ? 'bg-[#392820] text-[#D9A08C] border-[#392820] shadow-sm'
                        : 'bg-[#FAF7F2] text-neutral-400 border-[#E8D6C7]'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <p
                    className={`text-[11px] sm:text-xs font-semibold ${
                      isPastOrCurrent ? 'text-[#392820]' : 'text-neutral-400'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8D6C7]/60 flex flex-wrap items-center justify-between text-xs gap-2">
            <div>
              <span className="text-[#735D50]">Tracking AWB: </span>
              <strong className="font-mono text-[#392820]">{order.tracking?.tracking_number || `NT-DEL-${orderNumber}`}</strong>
            </div>
            <div>
              <span className="text-[#735D50]">Estimated Delivery: </span>
              <strong className="text-[#392820]">{order.tracking?.estimated_delivery || '4-5 Days'}</strong>
            </div>
          </div>
        </div>

        {/* Ordered Items Immutable Snapshots */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8D6C7] shadow-xs space-y-4">
          <h3 className="font-serif text-base font-semibold text-[#392820] pb-3 border-b border-[#FAF7F2]">
            Ordered Pieces ({items.length})
          </h3>

          <div className="divide-y divide-[#FAF7F2]">
            {items.map((item: any, idx: number) => {
              const name = item.product_name_snapshot || item.name || 'Boutique Garment';
              const size = item.size_snapshot || item.size || 'Free Size';
              const color = item.color_snapshot || item.color || 'Standard';
              const unitPrice = item.unit_price_snapshot || item.price || 499;
              const qty = item.quantity || 1;
              const lineTotal = item.line_total || unitPrice * qty;

              return (
                <div key={idx} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3.5">
                    {item.image && (
                      <div className="relative w-14 h-18 rounded-xl overflow-hidden bg-[#FAF7F2] shrink-0 border border-[#E8D6C7]">
                        <Image src={item.image} alt={name} fill className="object-cover" />
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <p className="font-serif font-semibold text-sm text-[#392820]">{name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-[#735D50]">
                        <span>Size: <strong className="text-[#392820]">{size}</strong></span>
                        <span>&bull;</span>
                        <span>Color: <strong className="text-[#392820]">{color}</strong></span>
                        {item.sku_snapshot && (
                          <>
                            <span>&bull;</span>
                            <span className="font-mono text-[10px]">SKU: {item.sku_snapshot}</span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-[#735D50]">
                        Unit Price: {formatPrice(unitPrice)} &times; {qty}
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="font-bold text-sm text-[#392820] block">
                      {formatPrice(lineTotal)}
                    </span>
                    {(order.order_status || '').toLowerCase() === 'delivered' && (
                      <button
                        type="button"
                        onClick={() => handleOpenReviewModal(item)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-1 rounded-full transition-colors cursor-pointer"
                      >
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>Write Review</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing Totals Breakdown */}
          <div className="pt-4 border-t border-[#FAF7F2] space-y-2 text-xs text-[#735D50]">
            {(() => {
              const itemsList = order.items || order.order_items || [];
              const computedSubtotal = itemsList.reduce(
                (acc: number, it: any) =>
                  acc + (Number(it.line_total) || (Number(it.unit_price_snapshot) * Number(it.quantity)) || 0),
                0
              );
              const subtotal = typeof order.subtotal === 'number' && order.subtotal > 0 ? order.subtotal : computedSubtotal;
              const shippingFee = typeof order.shipping_fee === 'number' ? order.shipping_fee : 0;
              const discount = Number(order.discount_amount) || 0;
              const total = typeof order.total_amount === 'number' && order.total_amount > 0
                ? order.total_amount
                : Math.max(0, subtotal - discount + shippingFee);

              return (
                <>
                  <div className="flex justify-between">
                    <span>Product Amount ({itemsList.length} {itemsList.length === 1 ? 'piece' : 'pieces'})</span>
                    <span className="font-semibold text-[#392820]">{formatPrice(subtotal)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Shipping &amp; Delivery Fee</span>
                    <span>
                      {shippingFee === 0 ? (
                        <strong className="text-emerald-700 font-bold uppercase text-[11px] tracking-wider">FREE</strong>
                      ) : (
                        <span className="font-semibold text-[#392820]">{formatPrice(shippingFee)}</span>
                      )}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-800 font-medium">
                      <span>Privilege Discount</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#FAF7F2] flex justify-between text-base font-bold text-[#392820]">
                    <span>Total Final Amount</span>
                    <span className="font-serif text-xl">{formatPrice(total)}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Address & Payment Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Shipping Address */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8D6C7] shadow-xs space-y-2 text-xs">
            <h4 className="font-serif text-sm font-semibold text-[#392820] pb-2 border-b border-[#FAF7F2] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#D9A08C]" />
              <span>Delivery Address</span>
            </h4>
            {shipping ? (
              <div className="text-[#735D50] leading-relaxed pt-1 space-y-0.5">
                <p className="font-bold text-[#392820]">{shipping.fullName}</p>
                <p>{shipping.addressLine1}</p>
                {shipping.addressLine2 && <p>{shipping.addressLine2}</p>}
                <p>{shipping.city}, {shipping.state} - {shipping.pincode}</p>
                <p>Phone: +91 {shipping.phone}</p>
              </div>
            ) : (
              <p className="text-[#735D50]">Delivery address recorded in system.</p>
            )}
          </div>

          {/* Payment Snapshot */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8D6C7] shadow-xs space-y-2 text-xs">
            <h4 className="font-serif text-sm font-semibold text-[#392820] pb-2 border-b border-[#FAF7F2] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#D9A08C]" />
              <span>Payment Details</span>
            </h4>
            <div className="pt-1 space-y-1.5">
              <div>
                <span className="text-[#735D50]">Method: </span>
                <strong className="text-[#392820]">
                  {order.payment_method === 'cod' ? 'Cash on Delivery (Pay at Doorstep)' : 'Online Payment (Razorpay Gateway)'}
                </strong>
              </div>
              <div>
                <span className="text-[#735D50]">Payment Status: </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                  {order.payment_status === 'pending' ? 'Pending on Arrival' : 'Verified'}
                </span>
              </div>
              <p className="text-[11px] text-[#735D50] pt-1">
                {order.payment_method === 'cod'
                  ? 'Payment will be collected by courier in cash or UPI QR upon doorstep delivery.'
                  : 'Processed via Razorpay 256-bit encrypted checkout.'}
              </p>
            </div>
          </div>
        </div>

        {/* Verified Review Modal */}
        {reviewModalItem && (
          <div
            className="fixed inset-0 z-50 bg-[#1A1310]/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setReviewModalItem(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E8DCCB] space-y-5 relative animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between pb-3 border-b border-[#FAF7F2]">
                <div>
                  <span className="text-[10px] tracking-[0.2em] uppercase text-[#D9A08C] font-bold">
                    Verified Customer Review
                  </span>
                  <h3 className="font-serif text-xl font-semibold text-[#392820] mt-0.5">
                    {reviewModalItem.product_name_snapshot || reviewModalItem.name || 'Boutique Garment'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewModalItem(null)}
                  className="w-8 h-8 rounded-full bg-[#FAF7F2] text-[#735D50] hover:text-[#392820] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {reviewSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{reviewSuccess}</span>
                </div>
              )}

              {reviewError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                  {reviewError}
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#392820] mb-1.5">
                    Rating:
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
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

                <div>
                  <label className="block text-xs font-semibold text-[#392820] mb-1">
                    Headline (Optional):
                  </label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Gorgeous embroidery, true to size"
                    className="w-full bg-[#FAF7F2]/60 border border-[#E8D6C7] px-4 py-2.5 rounded-xl text-xs text-[#392820] focus:ring-2 focus:ring-[#D9A08C] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#392820] mb-1">
                    Review / Feedback:
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience on fabric comfort, fit, and elegance..."
                    className="w-full bg-[#FAF7F2]/60 border border-[#E8D6C7] p-3.5 rounded-xl text-xs text-[#392820] focus:ring-2 focus:ring-[#D9A08C] outline-none resize-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewModalItem(null)}
                    className="px-4 py-2 rounded-xl border border-[#E8D6C7] text-xs font-semibold text-[#735D50] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2 rounded-full bg-[#392820] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#111111] disabled:opacity-50 cursor-pointer"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
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
