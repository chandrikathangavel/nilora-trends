import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface BrandLogoProps {
  className?: string;
  variant?: 'header' | 'footer' | 'compact' | 'monogram-only';
  size?: 'sm' | 'md' | 'lg' | string;
}

export function BrandLogo({ className = '', variant = 'header', size }: BrandLogoProps) {
  if (variant === 'footer') {
    return (
      <Link href="/" className={`inline-block group ${className}`} aria-label="Nilora Trends Home">
        <div className="relative w-[110px] sm:w-[130px] aspect-[376/512] transition-transform duration-300 group-hover:scale-105">
          <Image
            src="/nilora-logo-transparent.png"
            alt="Nilora Trends"
            fill
            className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
          />
        </div>
        <p className="text-[11px] tracking-[0.25em] uppercase text-[#D9A08C] font-semibold mt-3 font-sans">
          Your Style. Your Statement.
        </p>
      </Link>
    );
  }

  if (variant === 'monogram-only') {
    return (
      <Link href="/" className={`inline-block group ${className}`} aria-label="Nilora Trends">
        <div className="w-16 h-16 sm:w-20 sm:h-20 relative transition-transform duration-200 group-hover:scale-105">
          <Image
            src="/nilora-logo-transparent.png"
            alt="Nilora Trends Monogram"
            fill
            className="object-contain drop-shadow-[0_2px_8px_rgba(57,40,32,0.15)]"
          />
        </div>
      </Link>
    );
  }

  // Header & Compact variant: transparent background, prominent luxury sizing
  const heightClass = 
    size === 'sm' 
      ? 'h-[48px] sm:h-[54px]' 
      : size === 'lg' 
      ? 'h-[64px] sm:h-[76px] lg:h-[86px]' 
      : 'h-[52px] sm:h-[68px] lg:h-[76px]';

  return (
    <Link 
      href="/" 
      className={`inline-flex items-center group transition-all duration-300 hover:opacity-95 py-1 ${className}`}
      aria-label="Nilora Trends Home"
    >
      <div className={`relative ${heightClass} aspect-[376/512] flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
        <Image
          src="/nilora-logo-transparent.png"
          alt="Nilora Trends"
          fill
          priority
          className="object-contain drop-shadow-[0_2px_6px_rgba(57,40,32,0.16)]"
        />
      </div>
    </Link>
  );
}
