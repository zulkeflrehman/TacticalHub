'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import ProductCard from '@/components/product/ProductCard';
import type { ProductDto } from '@/lib/catalog-types';
import { ChevronRight, Shield } from 'lucide-react';
import Link from 'next/link';

interface MomentumCarouselProps {
  title: string;
  categorySlug?: string;
  products: ProductDto[];
}

export default function MomentumCarousel({ title, categorySlug, products }: MomentumCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollXProgress } = useScroll({ container: containerRef });

  // Perspective Parallax transform
  const rotateY = useTransform(scrollXProgress, [0, 1], [-3, 3]);

  if (products.length === 0) return null;

  return (
    <section className="space-y-4 my-8">
      {/* Header Row */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#FF6600]" />
          <h2 className="text-base sm:text-xl font-black uppercase tracking-wider text-white">
            {title}
          </h2>
        </div>
        {categorySlug && (
          <Link
            href={`/categories?slug=${encodeURIComponent(categorySlug)}`}
            className="text-xs font-mono font-bold uppercase text-[#FF6600] hover:underline flex items-center gap-1 group"
          >
            <span>EXPLORE ALL</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {/* Swipable Momentum Carousel Container */}
      <motion.div
        ref={containerRef}
        style={{ rotateY }}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none scroll-smooth px-1"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="min-w-[220px] sm:min-w-[260px] max-w-[260px] snap-start shrink-0"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </motion.div>
    </section>
  );
}
