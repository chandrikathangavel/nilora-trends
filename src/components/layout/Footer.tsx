'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, RefreshCw, Truck, Heart } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#111111] text-[#FAF7F2] border-t border-[#D9A08C]/20 mt-16">
      
      {/* Brand Value Strip */}
      <div className="border-b border-white/10 bg-[#1A1A1A] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#392820] border border-[#D9A08C]/30 flex items-center justify-center shrink-0 text-[#D9A08C]">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-serif text-sm font-semibold text-white">Pan-India Express</h5>
                <p className="text-[11px] text-[#FAF7F2]/60">Free delivery on orders &gt; ₹1,999</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#392820] border border-[#D9A08C]/30 flex items-center justify-center shrink-0 text-[#D9A08C]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-serif text-sm font-semibold text-white">Artisanal Purity</h5>
                <p className="text-[11px] text-[#FAF7F2]/60">100% Certified pure fabrics</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#392820] border border-[#D9A08C]/30 flex items-center justify-center shrink-0 text-[#D9A08C]">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-serif text-sm font-semibold text-white">7-Day Exchanges</h5>
                <p className="text-[11px] text-[#FAF7F2]/60">Doorstep exchange pickup</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#392820] border border-[#D9A08C]/30 flex items-center justify-center shrink-0 text-[#D9A08C]">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-serif text-sm font-semibold text-white">Boutique Quality</h5>
                <p className="text-[11px] text-[#FAF7F2]/60">Certified pure Indian fabrics</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Presentation & Instagram */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo variant="footer" />
            <p className="text-xs text-[#FAF7F2]/70 leading-relaxed max-w-sm mt-3 font-sans">
              Nilora Trends is an Indian women&apos;s fashion boutique specializing in contemporary Co-ord sets, royal kurtas, and artisanal sarees curated for everyday confidence and celebratory occasions.
            </p>

            {/* Instagram Link */}
            <div className="pt-2">
              <a
                href="https://www.instagram.com/nilora_trends"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-[#D9A08C] hover:text-white transition-colors"
              >
                <InstagramIcon className="w-4 h-4" />
                <span>Follow us on Instagram @nilora_trends</span>
              </a>
            </div>
          </div>

          {/* Collections */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
              Collections
            </h4>
            <ul className="space-y-2 text-xs text-[#FAF7F2]/70 font-sans">
              <li>
                <Link href="/category/co-ord-sets" className="hover:text-[#D9A08C] transition-colors">
                  Co-ord Sets
                </Link>
              </li>
              <li>
                <Link href="/category/kurtas" className="hover:text-[#D9A08C] transition-colors">
                  Kurtas &amp; Anarkalis
                </Link>
              </li>
              <li>
                <Link href="/category/sarees" className="hover:text-[#D9A08C] transition-colors">
                  Artisanal Sarees
                </Link>
              </li>
              <li>
                <Link href="/new-arrivals" className="hover:text-[#D9A08C] transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-[#D9A08C] transition-colors">
                  Shop All Collections
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
              Customer Care
            </h4>
            <ul className="space-y-2 text-xs text-[#FAF7F2]/70 font-sans">
              <li>
                <Link href="/orders" className="hover:text-[#D9A08C] transition-colors">
                  Track My Order
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-[#D9A08C] transition-colors">
                  Shipping &amp; Delivery Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-[#D9A08C] transition-colors">
                  Returns &amp; Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#D9A08C] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#D9A08C] transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* About Us & Contact */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
              The Boutique
            </h4>
            <ul className="space-y-2 text-xs text-[#FAF7F2]/70 font-sans">
              <li>
                <Link href="/about" className="hover:text-[#D9A08C] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#D9A08C] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-[#D9A08C] transition-colors">
                  My Profile &amp; Addresses
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="text-[#FAF7F2]/30 hover:text-[#D9A08C] transition-colors">
                  Staff Console
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Sub-footer */}
        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#FAF7F2]/50 font-sans">
          <p>&copy; 2026 NILORA TRENDS. All rights reserved. &bull; Made with passion for Indian craftsmanship.</p>
          <div className="flex items-center gap-4">
            <span className="text-[#D9A08C]">Brand Tagline: &ldquo;Your Style. Your Statement.&rdquo;</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
