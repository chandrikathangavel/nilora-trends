import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

export default function AboutPage() {
  return (
    <div className="bg-[#F8F5F0] min-h-screen py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <BrandLogo variant="monogram-only" className="mx-auto" />
          <span className="text-xs uppercase tracking-[0.25em] text-[#B79A72] font-semibold">
            Our Atelier &amp; Heritage
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#392820] font-medium leading-tight">
            The Story Behind <br />
            <span className="italic text-[#B79A72]">Nilora Trends</span>
          </h1>
          <p className="text-sm sm:text-base text-[#735D50] leading-relaxed font-sans">
            Tagline: <em>&ldquo;Your Style. Your Statement.&rdquo;</em> &mdash; Founded on the belief that everyday clothing should feel as poetic as bridal heirlooms, yet move with the freedom demanded by modern life.
          </p>
        </div>

        {/* Narrative Image & Story Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <Image
                src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80"
                alt="Nilora Trends Handloom Weaving Atelier"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 p-6 rounded-2xl bg-[#392820] text-[#E8DCCB] max-w-xs shadow-xl hidden sm:block border border-[#B79A72]/40">
              <p className="font-serif text-2xl font-bold text-[#B79A72]">30+ Days</p>
              <p className="text-xs text-[#E8DCCB]/80 mt-1">
                Average loom time for our certified handwoven Banarasi and Chanderi fabrics.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <h2 className="font-serif text-3xl sm:text-4xl text-[#392820] font-medium leading-snug">
              From Royal Handlooms to the Boardroom.
            </h2>
            <p className="text-xs sm:text-sm text-[#735D50] leading-relaxed">
              Nilora Trends began as a boutique inquiry: Why should Indian women have to choose between stiff, formal western suits and delicate, heavy ethnic wear that can only be worn once a year?
            </p>
            <p className="text-xs sm:text-sm text-[#735D50] leading-relaxed">
              We answered that inquiry with three signature categories:
            </p>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#E8DCCB]">
                <h4 className="font-serif text-base font-semibold text-[#392820]">1. Co-ord Sets</h4>
                <p className="text-xs text-[#735D50] mt-1">
                  Engineered in organic linens and crepe silks with discreet back elastication and functional pockets, pairing effortless tailoring with understated gold accents.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#E8DCCB]">
                <h4 className="font-serif text-base font-semibold text-[#392820]">2. Kurtas &amp; Anarkalis</h4>
                <p className="text-xs text-[#735D50] mt-1">
                  Breathable Chanderi silks and hand-block combed cottons with authentic Lucknowi Chikankari, designed for movement from morning presentations to evening aartis.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#E8DCCB]">
                <h4 className="font-serif text-base font-semibold text-[#392820]">3. Curated Sarees</h4>
                <p className="text-xs text-[#735D50] mt-1">
                  Whisper-light metallic tissue organzas that pleat in seconds, alongside authentic Silk Mark certified Banarasi heirlooms to cherish for generations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-[#241914] text-white rounded-3xl p-10 sm:p-14 text-center space-y-4 border border-[#B79A72]/30">
          <h3 className="font-serif text-2xl sm:text-3xl font-medium">
            Discover Your Next Statement
          </h3>
          <p className="text-xs sm:text-sm text-[#E8DCCB]/80 max-w-xl mx-auto">
            Experience our limited-edition handcrafted collections delivered with complimentary express shipping across India.
          </p>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#B79A72] text-[#241914] text-xs font-semibold uppercase tracking-widest hover:bg-white transition-colors"
            >
              Browse Boutique Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
