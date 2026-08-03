'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import CatalogImage from '@/components/ui/CatalogImage';
import type { ProductDto } from '@/lib/catalog-types';
import { ArrowRight, ShieldAlert } from 'lucide-react';

interface HeroSpotlightProps {
  products: ProductDto[];
}

export default function HeroSpotlight({ products }: HeroSpotlightProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const heroItems = (products.length > 0 ? products : [
    {
      id: 'default-1',
      name: 'MIL-SPEC RECON SURVIVAL TENT',
      slug: 'camping-tents',
      price: 24500,
      images: [{ url: '/images/tactical-tent.jpg' }],
      shortDescription: 'Heavy-duty weatherproof 4-person shelter with thermal lining.',
    }
  ]).slice(0, 4);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth > 0) {
      const index = Math.round(scrollLeft / clientWidth);
      setActiveIndex(index);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative w-full max-w-7xl mx-auto px-3 pt-2">
      {/* Slider Container */}
      <div
        ref={scrollRef}
        className="flex w-full snap-x snap-mandatory overflow-x-auto scrollbar-none rounded-none border border-[#33506B] bg-[#1F3346]"
      >
        {heroItems.map((item, index) => {
          const mainImg = item.images?.[0]?.url || '';
          return (
            <div
              key={item.id || index}
              className="w-full shrink-0 snap-center relative aspect-[16/10] sm:aspect-[21/9] min-h-[300px] flex flex-col justify-end overflow-hidden rounded-none"
            >
              {/* Background Image */}
              <div className="absolute inset-0 bg-[#142230]">
                {mainImg ? (
                  <CatalogImage
                    src={mainImg}
                    alt={item.name}
                    className="object-cover object-center w-full h-full opacity-60 rounded-none"
                    sizes="(max-width: 768px) 100vw, 1200px"
                    priority={index === 0}
                  />
                ) : (
                  <div className="w-full h-full bg-[#1F3346]" />
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#142230] via-[#1F3346]/75 to-transparent" />
              </div>

              {/* Foreground Hero Content */}
              <div className="relative z-10 p-4 sm:p-8 space-y-2.5 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-[#142230] border border-[#33506B] text-[#FFFFFF] text-[10px] font-mono font-bold uppercase tracking-widest">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#FFFFFF]" />
                  MIL-SPEC TACTICAL GEAR
                </span>

                <h1 className="text-xl sm:text-3xl md:text-4xl font-black uppercase text-[#FFFFFF] leading-tight line-clamp-2 tracking-tight">
                  {item.name}
                </h1>

                <p className="hidden sm:line-clamp-2 text-xs text-[#A0B1C5] leading-relaxed font-sans">
                  {item.shortDescription}
                </p>

                <div className="pt-1">
                  <Link
                    href={`/products?slug=${encodeURIComponent(item.slug)}`}
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-none bg-[#FFFFFF] hover:bg-[#F4F1E8] text-[#142230] font-mono font-black text-xs uppercase tracking-wider active:scale-[0.98] transition-all shadow-md"
                  >
                    <span>SHOP CATALOGUE</span>
                    <ArrowRight className="w-4 h-4 text-[#142230]" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rectangular Pagination Indicators */}
      {heroItems.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          {heroItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollTo({
                    left: idx * scrollRef.current.clientWidth,
                    behavior: 'smooth',
                  });
                }
              }}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-none transition-all duration-200 ${
                idx === activeIndex
                  ? 'w-6 bg-[#FFFFFF]'
                  : 'w-2 bg-[#33506B] hover:bg-[#A0B1C5]'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
