import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Clock, FileText } from 'lucide-react';

export const metadata = {
  title: 'Terms & Conditions | Nilora Trends',
  description: 'Terms and Conditions for purchasing bespoke garments from Nilora Trends.',
};

export default function TermsPage() {
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
            <FileText className="w-4 h-4" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#392820] font-medium">
            Terms &amp; Conditions
          </h1>
          <p className="text-xs text-[#735D50]">
            Last Updated: November 2026 &bull; Nilora Trends Boutique
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E8DCCB] shadow-sm space-y-6 text-xs text-[#523F34] leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#392820]">1. Introduction &amp; Ownership</h2>
            <p>
              Welcome to Nilora Trends (operated by Thangavel Chandrika, having its registered operational atelier in Erode, Tamil Nadu, India - 638458). By visiting our website or purchasing garments from our boutique, you agree to be bound by the following terms and conditions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#392820]">2. Boutique Catalog &amp; Pricing</h2>
            <p>
              All prices displayed on Nilora Trends are in Indian Rupees (INR) inclusive of applicable GST. We reserve the right to modify prices or discontinue collections without prior notice. In the event of an inadvertent technical pricing discrepancy, our atelier reserves the right to cancel the order and provide a full refund.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#392820]">3. Orders &amp; Payments</h2>
            <p>
              Orders placed online are subject to fabric and garment stock availability. We accept secure digital payments processed by RBI-licensed payment gateways (including Razorpay: UPI, Debit/Credit Cards, NetBanking) and verified Cash on Delivery (COD) for serviceable Indian pincodes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#392820]">4. Intellectual Property</h2>
            <p>
              All imagery, handcrafted garment designs, brand logos, product descriptions, and textual content are the exclusive intellectual property of Nilora Trends. Unauthorized reproduction or commercial use is strictly prohibited.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#392820]">5. Contact &amp; Grievance Redressal</h2>
            <p>
              For questions regarding our terms, boutique orders, or customer support:
            </p>
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DCCB] space-y-1 font-sans">
              <p><strong>Boutique Name:</strong> Nilora Trends</p>
              <p><strong>Proprietor:</strong> Thangavel Chandrika</p>
              <p><strong>Operational Address:</strong> Palanigoundenputhur, Kedarai, Nambiyur, Dist-Erode, Tamil Nadu, India - 638458</p>
              <p><strong>Customer Care Email:</strong> <a href="https://mail.google.com/mail/?view=cm&fs=1&to=niloratrends@gmail.com" target="_blank" rel="noopener noreferrer" className="text-[#D9A08C] underline hover:text-[#392820] transition-colors">niloratrends@gmail.com</a></p>
              <p><strong>Support Hotline:</strong> +91 82481 55545</p>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
