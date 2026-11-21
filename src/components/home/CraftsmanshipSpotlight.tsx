import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Scissors, Feather, Award } from 'lucide-react';

export function CraftsmanshipSpotlight() {
  return (
    <section className="py-16 sm:py-20 bg-[#1A1A1A] text-[#FAF7F2] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Visual Showcase */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-[#D9A08C]/30 shadow-2xl bg-[#222222]">
              <Image
                src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80"
                alt="Nilora Trends Artisanal Craftsmanship"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-[#111111]/90 backdrop-blur-md border border-[#D9A08C]/30">
                <p className="text-[10px] uppercase tracking-widest text-[#D9A08C] font-semibold">
                  Slow Fashion &bull; Certified Authenticity
                </p>
                <p className="font-serif text-sm font-normal text-white mt-0.5">
                  Hand-spun yarns &amp; hand-guided aari needlecraft from partner master weavers across India.
                </p>
              </div>
            </div>
          </div>

          {/* Editorial Copy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#392820] text-[#D9A08C] border border-[#D9A08C]/30 text-xs font-semibold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>The Nilora Philosophy</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl text-white font-normal leading-tight">
              Woven for Memory, <br />
              <span className="italic text-[#D9A08C]">Tailored for Modern Life.</span>
            </h2>

            <p className="text-xs sm:text-sm text-[#FAF7F2]/80 leading-relaxed font-sans">
              At <strong>Nilora Trends</strong>, we believe fashion shouldn&apos;t force women to choose between royal elegance and everyday comfort. Each Co-ord set, Kurta, and Saree is thoughtfully designed to bridge centuries of Indian craft with versatile silhouettes made for work, intimate gatherings, and celebrations.
            </p>

            {/* Value list */}
            <div className="space-y-4 pt-2">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#392820] border border-[#D9A08C]/30 flex items-center justify-center shrink-0 text-[#D9A08C]">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-base text-white font-medium">
                    Thoughtful Silhouettes
                  </h4>
                  <p className="text-xs text-[#FAF7F2]/70 mt-0.5">
                    Elasticated waist inserts, deep functional pockets in every set, and relaxed armholes designed for Indian body types.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#392820] border border-[#D9A08C]/30 flex items-center justify-center shrink-0 text-[#D9A08C]">
                  <Feather className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-base text-white font-medium">
                    100% Breathable Pure Weaves
                  </h4>
                  <p className="text-xs text-[#FAF7F2]/70 mt-0.5">
                    Skin-friendly Chanderi silks, pure organic linens, and whisper-soft mulmul cotton slips that breathe across all seasons.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#392820] border border-[#D9A08C]/30 flex items-center justify-center shrink-0 text-[#D9A08C]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-base text-white font-medium">
                    Fair-Trade Weaver Partnerships
                  </h4>
                  <p className="text-xs text-[#FAF7F2]/70 mt-0.5">
                    Direct artisan remuneration with zero middleman exploitation, preserving heirloom weaving heritage.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D9A08C] text-[#111111] text-xs font-bold tracking-wider uppercase hover:bg-white transition-colors"
              >
                Learn Our Boutique Story
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
