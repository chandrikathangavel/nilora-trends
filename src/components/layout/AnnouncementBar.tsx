'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

export function AnnouncementBar() {
  const { storeSettings } = useStore();
  const [index, setIndex] = useState(0);

  const messages = (storeSettings?.announcementMessages && storeSettings.announcementMessages.length > 0)
    ? storeSettings.announcementMessages
    : [
        'Complimentary Pan-India Delivery on Orders Above ₹1,999',
        'New Festive Drop: Pure Tissue Organza Sarees & Silk Co-ords',
        'Welcome Privilege: Use Code NILORA10 for 10% Off Your First Order',
      ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="bg-[#392820] text-[#FAF7F2] text-[11px] sm:text-xs py-1.5 px-3 sm:px-4 border-b border-[#D9A08C]/20 tracking-wide relative z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Flagship Boutique indicator (Desktop only) */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-[#FAF7F2]/80 font-normal shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D9A08C] inline-block animate-pulse" />
          <span>Indian Boutique Flagship &bull; Pan-India Shipping</span>
        </div>

        {/* Center: Rotating messages (strictly truncates so it never overflows or pushes right-side controls) */}
        <div className="flex-1 text-left sm:text-center font-medium px-1 sm:px-2 min-w-0 overflow-hidden">
          <p className="truncate text-[10px] sm:text-xs text-[#FAF7F2]/90 transition-opacity duration-300">
            {messages[index % messages.length]}
          </p>
        </div>

        {/* Right: Currency + Contact + WhatsApp logo (shrink-0, clean gap, zero overlap) */}
        <div className="flex items-center gap-2 sm:gap-2.5 text-[11px] shrink-0">
          <span className="text-[#D9A08C] font-semibold hidden md:inline">INR ₹ (India)</span>
          <span className="text-[#FAF7F2]/30 hidden md:inline">|</span>

          {/* Contact link */}
          <Link
            href="/contact"
            className="text-[#FAF7F2] hover:text-[#D9A08C] font-semibold transition-colors cursor-pointer py-0.5 px-1.5 rounded hover:bg-white/10 shrink-0 text-[11px]"
            title="Click to view Contact Us details"
          >
            Contact
          </Link>

          {/* WhatsApp Logo & Chat link */}
          <a
            href="https://wa.me/919597186404"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold transition-all shadow-xs hover:shadow-sm shrink-0 active:scale-95"
            title="Chat on WhatsApp (+91 9597186404)"
            aria-label="Chat with Nilora Trends on WhatsApp (+91 9597186404)"
          >
            <WhatsAppIcon className="w-3 h-3 fill-current shrink-0" />
            <span className="tracking-normal font-sans hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
