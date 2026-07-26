'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ProductCard from '@/components/product/ProductCard';
import type { ProductDto } from '@/lib/catalog-types';
import { ChevronRight, Flame } from 'lucide-react';
import Link from 'next/link';

interface FluidCarouselProps {
  title: string;
  categorySlug?: string;
  products: ProductDto[];
}

export default function FluidCarousel({ title, categorySlug, products }: FluidCarouselProps) {
  if (products.length === 0) return null;

  return (
    <section className="space-y-4 my-8">
      {/* Header Row */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-[#FF6600]" />
          <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white">
            {title}
          </h2>
        </div>
        {categorySlug && (
          <Link
            href={`/categories?slug=${encodeURIComponent(categorySlug)}`}
            className="text-xs font-mono font-bold uppercase text-[#FF6600] hover:underline flex items-center gap-1 group"
          >
            <span>VIEW CATALOG</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {/* Edge-to-Edge Horizontal Scroll Carousel with Native Momentum */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none scroll-smooth -mx-3 px-3 sm:-mx-6 sm:px-6">
        {products.map((product, idx) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: idx * 0.06 }}
            className="min-w-[230px] sm:min-w-[270px] max-w-[270px] snap-start shrink-0"
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
