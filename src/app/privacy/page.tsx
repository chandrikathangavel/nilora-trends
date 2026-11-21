import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Nilora Trends',
  description: 'Privacy Policy and customer data protection standards at Nilora Trends.',
};

export default function PrivacyPage() {
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
            <Lock className="w-4 h-4" />
            <span>Data Privacy &amp; Security</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#392820] font-medium">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#735D50]">
            Last Updated: November 2026 &bull; Nilora Trends Boutique
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E8DCCB] shadow-sm space-y-6 text-xs text-[#523F34] leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#392820]">1. Information We Collect</h2>
            <p>
              When you purchase from Nilora Trends or register for an account, we collect necessary customer details: recipient name, email address, delivery address, phone number, and order history.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#392820]">2. Payment Information Security</h2>
            <p>
              We do not store or process debit/credit card numbers or UPI PINs on our servers. All financial transactions are securely processed through RBI-authorized payment processors (such as Razorpay) complying with PCI-DSS Tier 1 standards and 256-bit SSL encryption.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#392820]">3. How Your Information Is Used</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Processing and delivering boutique orders to your address.</li>
              <li>Sending transactional order confirmations and carrier shipment updates.</li>
              <li>Providing customer care, exchange handling, and size consultations.</li>
              <li>Preventing fraudulent transactions and ensuring store security.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#392820]">4. Data Protection &amp; Non-Disclosure</h2>
            <p>
              Nilora Trends treats patron data with utmost discretion. We do not sell, rent, or trade your personal information to third parties. Information is only shared with verified logistics partners (such as Delhivery) solely for delivery fulfillment.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#392820]">5. Privacy Contact</h2>
            <p>
              If you have inquiries regarding data protection or wish to update your details, contact our grievance officer at <a href="https://mail.google.com/mail/?view=cm&fs=1&to=niloratrends@gmail.com" target="_blank" rel="noopener noreferrer" className="text-[#D9A08C] underline hover:text-[#392820] transition-colors">niloratrends@gmail.com</a>.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}
