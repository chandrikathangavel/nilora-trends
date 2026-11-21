import React from 'react';
import { Star, CheckCircle, Quote } from 'lucide-react';
import { DEMO_REVIEWS } from '@/data/demoProducts';

export function CustomerReviews() {
  return (
    <section className="py-16 sm:py-20 bg-[#FAF7F2] border-t border-[#E8D6C7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D9A08C]">
            Customer Diaries
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#392820] font-normal mt-1.5 mb-3">
            Loved Across India
          </h2>
          <div className="w-12 h-0.5 bg-[#D9A08C] mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-[#392820]/70 font-sans">
            Hear from real women who choose Nilora Trends for their key celebrations and everyday routines.
          </p>
        </div>

        {/* 3 Column Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {DEMO_REVIEWS.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-3xl p-7 shadow-xs border border-[#E8D6C7] flex flex-col justify-between relative group hover:shadow-md transition-shadow"
            >
              <Quote className="w-8 h-8 text-[#D9A08C]/20 absolute top-6 right-6 pointer-events-none" />

              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>

                <h4 className="font-serif text-base font-normal text-[#392820] mb-2 leading-snug">
                  &ldquo;{review.title}&rdquo;
                </h4>

                <p className="text-xs sm:text-sm text-[#392820]/75 leading-relaxed italic mb-6">
                  {review.comment}
                </p>
              </div>

              <div className="pt-4 border-t border-[#FAF7F2]">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-serif text-sm font-semibold text-[#392820]">
                      {review.authorName}
                    </h5>
                    <p className="text-[11px] text-[#392820]/60">{review.city}</p>
                  </div>
                  {review.verifiedBuyer && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-medium border border-emerald-200">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>

                {review.purchasedItem && (
                  <p className="text-[10px] text-[#D9A08C] font-semibold mt-2 line-clamp-1">
                    Purchased: {review.purchasedItem}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
