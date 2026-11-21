'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden min-h-[580px] sm:min-h-[660px] lg:min-h-[720px] flex flex-col justify-between bg-[#1A1310] border-b border-[#E8D6C7]">
      {/* Background Fashion Editorial Video (Live Cinematic Hero) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center scale-102"
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        {/* Multi-layered Editorial Overlays for Rich Contrast & Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A1310]/75 via-[#1A1310]/40 to-[#1A1310]/80" />
        <div className="absolute inset-0 bg-radial-[at_center] from-transparent via-[#1A1310]/20 to-[#1A1310]/60" />
      </div>

      {/* TOP: Brand Tagline - Centered, Neat and Subtle */}
      <div className="relative z-10 w-full pt-6 sm:pt-8 md:pt-10 px-4 text-center">
        <div className="inline-flex items-center justify-center gap-3 max-w-full">
          <span className="hidden sm:block w-10 sm:w-16 h-px bg-gradient-to-r from-transparent to-[#D9A08C]/60" />
          
          <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-white/20 text-[#FAF7F2] text-xs sm:text-sm font-medium tracking-[0.24em] sm:tracking-[0.28em] uppercase shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9A08C] inline-block animate-pulse shrink-0" />
            <span className="font-sans font-normal text-[#FAF7F2]/95">
              Your Style. Your Statement.
            </span>
          </div>

          <span className="hidden sm:block w-10 sm:w-16 h-px bg-gradient-to-l from-transparent to-[#D9A08C]/60" />
        </div>
      </div>

      {/* CENTER: Main Fashion Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 text-center space-y-5 my-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D9A08C]/20 border border-[#D9A08C]/40 text-[#D9A08C] text-[11px] sm:text-xs font-semibold tracking-widest uppercase backdrop-blur-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#D9A08C]" />
          <span>New Festive &amp; Atelier Collection 2026</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-[#FAF7F2] font-normal tracking-tight leading-[1.15] break-words drop-shadow-md">
          Elegance in Every Thread
        </h1>

        <p className="font-serif italic text-lg sm:text-2xl md:text-3xl text-[#E8D6C7] font-normal drop-shadow-sm">
          Discover Handcrafted Luxury Indian Wear
        </p>

        <p className="text-xs sm:text-sm md:text-base text-[#FAF7F2]/85 max-w-2xl mx-auto leading-relaxed font-sans font-light">
          Curated silhouettes designed for modern Indian women. Explore handcrafted Co-ord sets, royal Chanderi kurtas, and whisper-light tissue sarees made from 100% certified pure fabrics.
        </p>

        {/* Action Buttons: Large SHOP NOW */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/products"
            className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-[#FAF7F2] text-[#392820] text-xs sm:text-sm font-bold tracking-[0.16em] uppercase hover:bg-[#D9A08C] hover:text-white transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center gap-2.5 group transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Shop Now</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#392820] group-hover:text-white" />
          </Link>

          <Link
            href="/new-arrivals"
            className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF7F2] text-xs sm:text-sm font-semibold tracking-wider uppercase border border-white/30 backdrop-blur-md transition-all duration-200 cursor-pointer"
          >
            New Arrivals
          </Link>
        </div>
      </div>

      {/* Subtle bottom spacer for balanced layout */}
      <div className="relative z-10 w-full h-4 sm:h-8" />
    </section>
  );
}
