import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { AuthProvider } from '@/context/AuthContext';
import { StoreProvider } from '@/context/StoreContext';

export const metadata: Metadata = {
  title: 'Nilora Trends | Your Style. Your Statement.',
  description:
    'Indian online clothing boutique specializing in contemporary Co-ord Sets, royal Kurtas, and artisanal Sarees. Curated for daily wear, festive moments, and office elegance.',
  keywords: [
    'Nilora Trends',
    'Co-ord sets India',
    'Kurtas',
    'Anarkalis',
    'Organza sarees',
    'Banarasi silk saree',
    'Indian boutique clothing',
    'Ethnic fashion',
  ],
  authors: [{ name: 'Nilora Trends' }],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#392820] antialiased selection:bg-[#D9A08C] selection:text-white">
        <AuthProvider>
          <StoreProvider>
            <CartProvider>
              <WishlistProvider>
                <AnnouncementBar />
                <Suspense fallback={<header className="h-[70px] sm:h-[86px] bg-[#FAF7F2] border-b border-[#E8D6C7]" />}>
                  <Navbar />
                </Suspense>
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
                <CartDrawer />
              </WishlistProvider>
            </CartProvider>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
