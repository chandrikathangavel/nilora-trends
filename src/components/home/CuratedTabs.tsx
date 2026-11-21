'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { ProductCard } from './ProductCard';

type TabKey = 'all' | 'co-ord-sets' | 'kurtas' | 'sarees' | 'bestsellers';

export function CuratedTabs() {
  const { products } = useStore();
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const TABS = [
    { key: 'all' as TabKey, label: 'All Curations' },
    { key: 'co-ord-sets' as TabKey, label: 'Co-ord Sets' },
    { key: 'kurtas' as TabKey, label: 'Kurtas' },
    { key: 'sarees' as TabKey, label: 'Sarees' },
    { key: 'bestsellers' as TabKey, label: 'Bestsellers' },
  ];

  const filteredProducts = useMemo(() => {
    switch (activeTab) {
      case 'co-ord-sets':
        return products.filter((p) => p.category === 'co-ord-sets');
      case 'kurtas':
        return products.filter((p) => p.category === 'kurtas');
      case 'sarees':
        return products.filter((p) => p.category === 'sarees');
      case 'bestsellers':
        return products.filter((p) => p.isBestSeller);
      default:
        return products;
    }
  }, [activeTab, products]);

  return (
    <section className="py-14 sm:py-20 bg-white border-t border-[#E8D6C7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#D9A08C] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Handpicked Fashion</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#392820] font-normal">
              Featured Products
            </h2>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#392820] hover:text-[#D9A08C] transition-colors"
          >
            <span>View All ({products.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
                  isActive
                    ? 'bg-[#392820] text-[#FAF7F2] shadow-xs'
                    : 'bg-[#FAF7F2] text-[#392820]/70 hover:bg-[#E8D6C7] hover:text-[#392820] border border-[#E8D6C7]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Responsive Grid: 4 on Desktop, 2 on Tablet, 2 on Mobile */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

      </div>
    </section>
  );
}
