'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  ShieldCheck,
  Calendar,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useAuth } from '@/context/AuthContext';

export default function OrderSuccessPage() {
  const params = useParams();
  const orderId = (params?.id as string) || '';
  const { user } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    // Check cached order snapshot first for instant rendering
    try {
      const rawStored = localStorage.getItem(`nilora_order_${orderId}`);
      if (rawStored) {
        setOrder(JSON.parse(rawStored));
      } else {
        const rawLatest = sessionStorage.getItem('nilora_latest_order');
        if (rawLatest) {
          const parsed = JSON.parse(rawLatest);
          if (parsed.order_number === orderId || parsed.id === orderId) {
            setOrder(parsed);
          }
        }
      }
    } catch {}

    const userParam = user?.id ? `?userId=${encodeURIComponent(user.id)}` : '';
    fetch(`/api/orders/${orderId}${userParam}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.order) {
          setOrder(data.order);
        }
      })
      .catch((e) => console.error('Failed to load order:', e))
      .finally(() => setLoading(false));
  }, [orderId, user?.id]);

  const displayOrderNumber = order?.order_number || orderId || 'NT-892104';
  const shipping = order?.shipping_address_snapshot;
  const tracking = order?.tracking || {
    carrier: 'Delhivery Boutique Express',
    tracking_number: `NT-DEL-${displayOrderNumber.replace('NT-', '')}`,
    estimated_delivery: 'Within 4-5 business days',
  };

  const itemsList = order?.items || order?.order_items || [];
  const computedSubtotal = itemsList.reduce(
    (acc: number, item: any) =>
      acc + (Number(item.line_total) || (Number(item.unit_price_snapshot) * Number(item.quantity)) || 0),
    0
  );
  const subtotal = typeof order?.subtotal === 'number' && order.subtotal > 0 ? order.subtotal : computedSubtotal;
  const shippingFee = typeof order?.shipping_fee === 'number' ? order.shipping_fee : 0;
  const discountAmount = Number(order?.discount_amount) || 0;
  const totalAmount =
    typeof order?.total_amount === 'number' && order.total_amount > 0
      ? order.total_amount
      : Math.max(0, subtotal - discountAmount + shippingFee);

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-12 sm:py-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Celebration Header */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E8D6C7] shadow-xl text-center space-y-4">
          
          {/* Thank You by Nilora */}
          <div className="space-y-0.5 text-center">
            <h1 className="font-serif text-3xl sm:text-4xl text-[#392820] font-bold tracking-wide">
              Thank You
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#735D50] tracking-wider">
              by Nilora
            </p>
          </div>

          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <h2 className="font-serif text-2xl sm:text-3xl text-[#392820] font-medium">
              Confirmed Order
            </h2>
            <p className="text-sm font-bold text-[#392820] pt-1">
              Order Reference: <span className="font-mono text-[#D9A08C]">#{displayOrderNumber}</span>
            </p>
            <p className="text-xs text-[#735D50] max-w-md mx-auto pt-1 leading-relaxed">
              Your order is confirmed by Nilora Trends atelier.
            </p>
          </div>

          {/* Payment Status Pill */}
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8D6C7] flex items-center justify-between text-xs text-left">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[#735D50] tracking-wider block">
                Payment Method &amp; Status
              </span>
              <p className="font-semibold text-[#392820]">
                {order?.payment_method === 'cod' ? 'Cash on Delivery (Pay at Doorstep)' : 'Online Payment (Razorpay)'}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                order?.payment_status === 'completed'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {order?.payment_status === 'pending' ? 'Pending on Arrival' : 'Verified & Paid'}
            </span>
          </div>

          {/* Delivery & Carrier Info */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8D6C7] text-left space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-[#E8D6C7]/60 pb-2">
              <span className="font-semibold text-[#392820] flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#D9A08C]" />
                {tracking.carrier}
              </span>
              <span className="font-mono text-[11px] text-[#735D50]">
                AWB: {tracking.tracking_number}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#735D50]">Delivery Address:</span>
                {shipping ? (
                  <p className="text-[#392820] leading-snug">
                    <strong>{shipping.fullName}</strong><br />
                    {shipping.addressLine1} {shipping.addressLine2 ? `, ${shipping.addressLine2}` : ''}<br />
                    {shipping.city}, {shipping.state} - {shipping.pincode}<br />
                    Phone: +91 {shipping.phone}
                  </p>
                ) : (
                  <p className="text-[#735D50]">Address snapshot registered in database.</p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#735D50]">Estimated Delivery:</span>
                <p className="text-[#392820] font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#D9A08C]" />
                  <span>{tracking.estimated_delivery}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Ordered Items Preview & Cart Totals */}
          {itemsList.length > 0 && (
            <div className="text-left space-y-3 pt-3 border-t border-[#FAF7F2]">
              <span className="text-xs font-semibold text-[#392820] block">Ordered Pieces:</span>
              <div className="divide-y divide-[#FAF7F2]">
                {itemsList.map((item: any, idx: number) => {
                  const lineTotal =
                    Number(item.line_total) ||
                    Number(item.unit_price_snapshot) * Number(item.quantity) ||
                    0;
                  return (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-[#392820]">{item.product_name_snapshot}</p>
                        <p className="text-[11px] text-[#735D50]">
                          Size: {item.size_snapshot} &bull; Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="font-bold text-[#392820]">
                        {formatPrice(lineTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Total Cart Value Breakdown: Product Amount + Shipping Details Amount = Total Final Amount */}
              <div className="pt-3 border-t border-[#E8D6C7]/60 space-y-2 text-xs">
                <div className="flex justify-between text-[#735D50]">
                  <span>Product Amount ({itemsList.length} {itemsList.length === 1 ? 'piece' : 'pieces'})</span>
                  <span className="font-semibold text-[#392820]">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between text-[#735D50]">
                  <span>Shipping &amp; Delivery Details</span>
                  <span>
                    {shippingFee === 0 ? (
                      <strong className="text-emerald-700 font-bold uppercase text-[11px] tracking-wider">
                        FREE
                      </strong>
                    ) : (
                      <span className="font-semibold text-[#392820]">{formatPrice(shippingFee)}</span>
                    )}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-medium">
                    <span>Coupon Discount</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="pt-2.5 border-t border-[#E8D6C7] flex items-center justify-between text-base font-bold text-[#392820]">
                  <div>
                    <span className="block text-sm sm:text-base">Total Final Amount</span>
                    <span className="text-[10px] font-normal text-[#735D50] block">
                      {order?.payment_method === 'cod' ? 'Payable on Delivery' : 'Total Paid'} (Product Amount + Shipping)
                    </span>
                  </div>
                  <span className="font-serif text-xl sm:text-2xl text-[#392820]">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/profile/orders/${displayOrderNumber}`}
              className="flex-1 py-3.5 px-6 rounded-full bg-[#392820] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#111111] transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <span>View Full Order Details</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/products"
              className="py-3.5 px-6 rounded-full border border-[#E8D6C7] text-[#392820] text-xs font-semibold uppercase tracking-wider hover:bg-[#FAF7F2] transition-colors text-center"
            >
              Continue Shopping
            </Link>
          </div>

          <div className="pt-2 text-center text-[10px] text-[#735D50] flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#D9A08C]" />
            <span>256-bit Secure Fulfillment &bull; 7-Day Doorstep Exchange Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
}
