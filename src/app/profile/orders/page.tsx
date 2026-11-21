'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Truck, ArrowRight, Clock, CheckCircle2, ChevronRight, AlertCircle, ShoppingBag, CheckCheck, RefreshCw, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';

export default function ProfileOrdersPage() {
  const { user, isLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'confirmed' | 'shipped' | 'delivered'>('all');

  const fetchOrders = async () => {
    try {
      const fetchedList: any[] = [];
      if (user?.id) {
        const res = await fetch(`/api/orders?userId=${encodeURIComponent(user.id)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          fetchedList.push(...data.orders);
        }
      }

      // Also check guest orders stored locally on this device
      if (typeof window !== 'undefined') {
        try {
          const rawStored = localStorage.getItem('nilora_placed_orders');
          if (rawStored) {
            const storedRefs: string[] = JSON.parse(rawStored);
            if (Array.isArray(storedRefs) && storedRefs.length > 0) {
              for (const ref of storedRefs) {
                if (!fetchedList.some((o) => o.order_number === ref || o.id === ref)) {
                  const r = await fetch(`/api/orders/${ref}`);
                  const d = await r.json();
                  if (d.success && d.order) {
                    fetchedList.push(d.order);
                  }
                }
              }
            }
          }
        } catch {}
      }

      // Sort newest first
      fetchedList.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setOrders(fetchedList);
    } catch (e) {
      console.warn('Orders fetch note:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    setLoadingOrders(true);
    fetchOrders();

    // Auto-polling so customer sees admin updates live
    const interval = setInterval(fetchOrders, 12000);
    return () => clearInterval(interval);
  }, [user, isLoading]);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'all') return true;
    return o.order_status?.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-10 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Breadcrumbs */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-xs text-[#735D50]">
            <Link href="/profile" className="hover:text-[#392820]">
              My Profile
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#D9A08C]" />
            <span className="text-[#392820] font-medium">Boutique Orders</span>
          </nav>
          <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#392820] font-medium">
                My Boutique Orders
              </h1>
              <p className="text-xs sm:text-sm text-[#735D50] mt-0.5">
                Track royal deliveries, view itemized receipts, and manage size exchanges.
              </p>
            </div>
            <Link
              href="/products"
              className="text-xs px-4 py-2 rounded-full border border-[#E8D6C7] text-[#392820] font-semibold uppercase tracking-wider hover:bg-white"
            >
              Shop New Drops
            </Link>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 border-b border-[#E8D6C7] pb-3 mb-6 overflow-x-auto text-xs font-semibold">
          {[
            { key: 'all', label: 'All Orders' },
            { key: 'confirmed', label: 'Confirmed Order' },
            { key: 'shipped', label: 'Shipped' },
            { key: 'delivered', label: 'Delivered' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-[#392820] text-white shadow-xs'
                  : 'bg-white text-[#735D50] hover:text-[#392820] border border-[#E8D6C7]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List or Empty State */}
        {loadingOrders ? (
          <div className="p-12 text-center text-xs text-[#735D50] animate-pulse">
            Loading your boutique orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto border border-[#E8D6C7] shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FAF7F2] text-[#D9A08C] flex items-center justify-center mx-auto border border-[#E8D6C7]">
              <Package className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-semibold text-[#392820]">
                No Orders Placed Yet
              </h3>
              <p className="text-xs text-[#735D50] max-w-xs mx-auto leading-relaxed">
                When you purchase your artisanal Co-ord set, royal Kurta, or luxury Saree, tracking details will appear here.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#392820] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#111111]"
              >
                <span>Explore Boutique Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const orderNum = order.order_number || order.id;
              const dateStr = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              const itemCount = order.order_items?.length || order.items?.length || 1;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8D6C7] shadow-xs space-y-5"
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#FAF7F2]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-serif text-base sm:text-lg font-semibold text-[#392820]">
                          Order #{orderNum}
                        </span>
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
                      </div>
                      <p className="text-xs text-[#735D50]">
                        Placed on {dateStr} &bull; {itemCount} {itemCount === 1 ? 'piece' : 'pieces'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-[#735D50] block">Total Amount</span>
                      <p className="font-serif text-lg font-bold text-[#392820]">
                        {formatPrice(
                          order.total_amount ??
                            order.total ??
                            (Number(order.subtotal || 0) + Number(order.shipping_fee || 0))
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Card Quick Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8D6C7]/60">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#735D50]">Payment Method:</span>
                      <p className="font-semibold text-[#392820]">
                        {order.payment_method === 'cod'
                          ? 'Cash on Delivery (Pay at Doorstep)'
                          : 'Online Payment (Razorpay)'}
                      </p>
                      <span className="text-[11px] text-amber-700 font-medium">
                        Payment: {order.payment_status === 'pending' ? 'Pending on Arrival' : 'Verified'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#735D50]">Carrier Tracking:</span>
                      <p className="font-semibold text-[#392820] flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-[#D9A08C]" />
                        <span>Delhivery Boutique Express</span>
                      </p>
                      <p className="text-[11px] font-mono text-[#735D50]">
                        AWB: NT-DEL-{orderNum.replace('NT-', '')}
                      </p>
                    </div>
                  </div>

                  {/* Link to Detail */}
                  <div className="flex justify-end pt-1">
                    <Link
                      href={`/profile/orders/${orderNum}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-5 py-2.5 rounded-full bg-[#392820] text-white hover:bg-[#111111] transition-all shadow-xs"
                    >
                      <span>View Full Order Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
