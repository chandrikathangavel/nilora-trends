'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Heart, User, Package, LogIn, ShoppingBag } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { wishlistCount } = useWishlist();
  const { cartCount } = useCart();
  const { user } = useAuth();

  if (!isOpen) return null;

  const NAV_LINKS = [
    { label: 'Home', href: '/' },
    { label: 'New Arrivals', href: '/new-arrivals', badge: 'New Drop' },
    { label: 'Co-ord Sets', href: '/category/co-ord-sets', badge: 'Trending' },
    { label: 'Kurtas & Anarkalis', href: '/category/kurtas' },
    { label: 'Artisanal Sarees', href: '/category/sarees', badge: 'Festive' },
    { label: 'All Collections', href: '/products' },
    { label: 'About the Boutique', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#231813]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-[#F8F5F0] shadow-2xl z-10 flex flex-col justify-between border-r border-[#B79A72]/30">
        <div>
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-[#E8DCCB] bg-white">
            <BrandLogo size="sm" />
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#F8F5F0] text-[#392820]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Account actions */}
          <div className="p-4 grid grid-cols-2 gap-2 bg-[#F6F1EA] border-b border-[#E8DCCB] text-xs">
            <Link
              href="/cart"
              onClick={onClose}
              className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#E8DCCB] text-[#392820] font-medium"
            >
              <ShoppingBag className="w-4 h-4 text-[#D9A08C]" />
              <span>Bag ({cartCount})</span>
            </Link>
            <Link
              href="/wishlist"
              onClick={onClose}
              className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#E8DCCB] text-[#392820] font-medium"
            >
              <Heart className="w-4 h-4 text-[#D9A08C]" />
              <span>Wishlist ({wishlistCount})</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {NAV_LINKS.map((link) => {
              const isContact = link.href === '/contact';
              return (
                <div key={link.href} className="flex items-center gap-1">
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="flex-1 flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white text-[#392820] transition-colors group"
                  >
                    <span className="font-serif text-base font-medium group-hover:text-[#B79A72] transition-colors">
                      {link.label}
                    </span>
                    {link.badge && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#392820] text-[#E8DCCB] font-semibold">
                        {link.badge}
                      </span>
                    )}
                  </Link>

                  {isContact && (
                    <a
                      href="https://wa.me/919597186404"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 text-[#25D366] hover:bg-white rounded-xl transition-colors shrink-0"
                      title="Chat on WhatsApp (+91 9597186404)"
                      aria-label="Chat on WhatsApp"
                    >
                      <WhatsAppIcon className="w-5 h-5 fill-current" />
                    </a>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer info in menu */}
        <div className="p-4 border-t border-[#E8DCCB] bg-white text-xs text-[#735D50] space-y-3">
          {user ? (
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-2.5 p-2 rounded-xl bg-[#FAF7F2] border border-[#E8D6C7] text-[#392820] font-medium"
            >
              {user.avatarUrl ? (
                <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 border border-[#D9A08C]">
                  <Image src={user.avatarUrl} alt={user.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#392820] text-[#D9A08C] flex items-center justify-center text-xs font-bold shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs truncate">{user.name}</p>
                <p className="text-[10px] text-[#735D50] truncate">{user.email}</p>
              </div>
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#392820] text-[#FAF7F2] font-semibold text-xs uppercase tracking-wider hover:bg-[#111111]"
            >
              <LogIn className="w-4 h-4 text-[#D9A08C]" />
              <span>Sign In to Privilege Circle</span>
            </Link>
          )}

          <div className="pt-1 text-[11px] text-[#735D50]">
            <p className="font-medium text-[#392820]">NILORA TRENDS &copy; 2026</p>
            <p className="text-[10px] text-[#B79A72]">Your Style. Your Statement.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
