'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, Heart, ShoppingBag, User, Menu, Shield } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { SearchModal } from './SearchModal';
import { MobileMenu } from './MobileMenu';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  const { toggleCart, cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('search') === 'open') {
        setIsSearchOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const NAV_ITEMS = [
    { label: 'Home', href: '/' },
    { label: 'Co-ord Sets', href: '/category/co-ord-sets' },
    { label: 'Kurtas', href: '/category/kurtas' },
    { label: 'Sarees', href: '/category/sarees' },
    { label: 'New Arrivals', href: '/new-arrivals' },
    { label: 'Shop', href: '/products' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          isScrolled
            ? 'bg-[#FAF7F2]/95 backdrop-blur-md shadow-sm border-b border-[#E8D6C7]'
            : 'bg-[#FAF7F2] border-b border-[#E8D6C7]/60'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[70px] sm:h-[86px]">
            {/* Left: Mobile Menu & Mobile Search */}
            <div className="flex items-center gap-1 lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-[#392820] hover:text-[#D9A08C] rounded-lg transition-colors"
                aria-label="Open mobile menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-[#392820] hover:text-[#D9A08C] rounded-lg transition-colors"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Brand Logo: strictly capped width */}
            <div className="flex items-center">
              <BrandLogo />
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-8">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-xs tracking-[0.14em] uppercase transition-all py-1.5 relative ${
                      isActive
                        ? 'text-[#392820] font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#D9A08C]'
                        : 'text-[#392820]/80 font-medium hover:text-[#D9A08C]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Icons: Search, Account, Wishlist, Cart */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Search Icon */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-[#392820] hover:text-[#D9A08C] transition-colors rounded-full hover:bg-[#E8D6C7]/30"
                aria-label="Search collection"
                title="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Account / Admin Icon */}
              {!isMounted ? (
                <Link
                  href="/login"
                  className="p-2 text-[#392820] hover:text-[#D9A08C] transition-colors rounded-full hover:bg-[#E8D6C7]/30 hidden sm:inline-flex"
                  aria-label="Sign In"
                  title="Sign In to Nilora Circle"
                >
                  <User className="w-5 h-5" />
                </Link>
              ) : isAdmin ? (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 rounded-full bg-[#392820] text-[#D9A08C] hover:bg-[#111111] transition-all text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                  aria-label="Admin Console"
                  title="Admin Console"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              ) : user ? (
                <Link
                  href="/profile"
                  className="px-2.5 py-1.5 text-[#392820] hover:text-[#D9A08C] transition-all rounded-full hover:bg-[#E8D6C7]/30 hidden sm:inline-flex items-center gap-2 border border-[#E8D6C7]/70"
                  aria-label="My Account"
                  title={`Signed in as ${user.name}`}
                >
                  {user.avatarUrl ? (
                    <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 border border-[#D9A08C]">
                      <Image src={user.avatarUrl} alt={user.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#392820] text-[#D9A08C] flex items-center justify-center text-[11px] font-bold shrink-0 shadow-2xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-medium max-w-[85px] truncate hidden md:inline">
                    {user.name.split(' ')[0]}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="p-2 text-[#392820] hover:text-[#D9A08C] transition-colors rounded-full hover:bg-[#E8D6C7]/30 hidden sm:inline-flex"
                  aria-label="Sign In"
                  title="Sign In to Nilora Circle"
                >
                  <User className="w-5 h-5" />
                </Link>
              )}

              {/* Wishlist Icon */}
              <Link
                href="/wishlist"
                className="p-2 text-[#392820] hover:text-[#D9A08C] transition-colors rounded-full hover:bg-[#E8D6C7]/30 relative"
                aria-label="Wishlist"
                title="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {isMounted && wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#D9A08C] text-white text-[10px] font-bold flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart Bag Icon with Button */}
              <button
                onClick={toggleCart}
                className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#392820] text-[#FAF7F2] hover:bg-[#111111] transition-all shadow-sm cursor-pointer"
                aria-label="Shopping Bag"
              >
                <ShoppingBag className="w-4 h-4 text-[#D9A08C]" />
                <span className="hidden sm:inline text-xs uppercase tracking-wider font-semibold">
                  Bag
                </span>
                <span className="w-5 h-5 rounded-full bg-[#D9A08C] text-[#111111] text-[11px] font-bold flex items-center justify-center">
                  {isMounted ? cartCount : 0}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal & Mobile Drawer */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
}
