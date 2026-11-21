import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Truck, MapPin } from 'lucide-react';

export const metadata = {
  title: 'Shipping & Delivery Policy | Nilora Trends',
  description: 'Pan-India shipping rates, delivery timelines, and courier tracking at Nilora Trends.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="bg-[#FAF7F2] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E8DCCB] shadow-sm space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#735D50] hover:text-[#392820] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
          </Link>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#D9A08C] font-semibold">
            <Truck className="w-4 h-4" />
            <span>Logistics &amp; Courier Standards</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#392820] font-medium">
            Shipping &amp; Delivery Policy
          </h1>
          <p className="text-xs text-[#735D50]">
            Last Updated: November 2026 &bull; Dispatched from Erode, Tamil Nadu
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E8DCCB] shadow-sm space-y-6 text-xs text-[#523F34] leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#392820]">1. Pan-India Delivery Coverage</h2>
            <p>
              Nilora Trends ships across all states and union territories in India using premier courier partners (Delhivery Boutique Express, BlueDart, DTDC).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#392820]">2. Delivery Timelines</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Tamil Nadu &amp; South India:</strong> Delivered within <strong>2 to 4 business days</strong>.</li>
              <li><strong>Rest of India (Metro &amp; Major Cities):</strong> Delivered within <strong>3 to 5 business days</strong>.</li>
              <li><strong>Remote / North-East Pincodes:</strong> Delivered within <strong>5 to 7 business days</strong>.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#392820]">3. Transparent Shipping Charges</h2>
            <p>
              Shipping fees are calculated transparently based on delivery zones dispatched from our atelier in Erode, Tamil Nadu:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Local District (Erode):</strong> ₹40 flat courier fee.</li>
              <li><strong>Tamil Nadu &amp; Pondicherry:</strong> ₹85 standard express delivery.</li>
              <li><strong>Neighbouring South States (Karnataka, Kerala, AP, Telangana):</strong> ₹110 express delivery.</li>
              <li><strong>Rest of India:</strong> ₹140 national delivery.</li>
              <li><strong>Complimentary Free Shipping:</strong> Automatically applied to all bag totals of ₹1,999 and above!</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#392820]">4. Real-Time Tracking</h2>
            <p>
              Once your garment is dispatched, you will receive an SMS and email notification containing your unique AWB tracking number. You can also track your package in real-time on our website at <Link href="/orders" className="text-[#D9A08C] underline">Track My Order</Link>.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}
