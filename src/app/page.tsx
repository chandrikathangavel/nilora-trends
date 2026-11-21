import React from 'react';
import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { CuratedTabs } from '@/components/home/CuratedTabs';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Editorial Section */}
      <HeroBanner />

      {/* 2. Three Boutique Specializations */}
      <CategoryShowcase />

      {/* 3. Interactive Curated Products with Tabs */}
      <CuratedTabs />
    </div>
  );
}
