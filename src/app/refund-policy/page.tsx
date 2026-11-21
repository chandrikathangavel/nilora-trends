import React from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Refund & Cancellation Policy | Nilora Trends',
  description: 'Easy 7-day exchange, return, and cancellation policies at Nilora Trends.',
};

export default function RefundPolicyPage() {
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
            <RefreshCw className="w-4 h-4" />
            <span>Customer Satisfaction Guarantee</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#392820] font-medium">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-xs text-[#735D50]">
            Last Updated: November 2026 &bull; Nilora Trends Boutique
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E8DCCB] shadow-sm space-y-6 text-xs text-[#523F34] leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#392820]">1. 7-Day Hassle-Free Exchange Policy</h2>
            <p>
              At Nilora Trends, we strive to ensure every handcrafted garment brings joy and confidence. If a garment does not fit perfectly or if you wish to choose a different size/color, you can initiate an exchange within <strong>7 days</strong> of delivery.
            </p>
            <p>
              Garments must be unworn, unwashed, with all original boutique tags intact and in their original packaging.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#392820]">2. Order Cancellation</h2>
            <p>
              You can cancel your boutique order at any time before the garment has been dispatched from our atelier.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Pre-dispatch cancellation:</strong> Full 100% refund credited back to your original payment method.</li>
              <li><strong>Post-dispatch cancellation:</strong> Please accept delivery and initiate an exchange request or return with our customer care team.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#392820]">3. Refund Timeline &amp; Method</h2>
            <p>
              Upon receiving and inspecting returned items at our atelier:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Online Payments (UPI / Cards / NetBanking via Razorpay):</strong> Refunds are initiated within 24 to 48 hours and typically reflect in your bank account within <strong>5 to 7 business days</strong> as per standard banking protocol.</li>
              <li><strong>Cash on Delivery (COD) Orders:</strong> Refunds are disbursed directly via bank transfer (NEFT/IMPS) or UPI to the account details provided by the customer.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#392820]">4. Damaged or Defective Items</h2>
            <p>
              Every Nilora Trends piece undergoes rigorous three-stage quality checking. In the rare event an item arrives damaged or flawed during transit, please notify us within 48 hours of receipt at <a href="https://mail.google.com/mail/?view=cm&fs=1&to=niloratrends@gmail.com" target="_blank" rel="noopener noreferrer" className="text-[#D9A08C] underline hover:text-[#392820] transition-colors">niloratrends@gmail.com</a> or WhatsApp (+91 82481 55545) with a photo. We will immediately arrange a complimentary pickup and express replacement.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}
