'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { ProductDto } from '@/lib/catalog-types';

interface HeroCinematicProps {
  featuredProducts?: ProductDto[];
}

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?q=80&w=1600&auto=format&fit=crop',
];

export default function HeroCinematic({ featuredProducts = [] }: HeroCinematicProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-switch background image every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % HERO_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Parallax Scroll Offset
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-8%']);

  const handleShopNowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('products');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/products';
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[420px] sm:h-[520px] rounded-none overflow-hidden border border-[#33506B] my-2 shadow-2xl flex flex-col justify-end p-6 sm:p-12 group bg-[#142230]"
    >
      {/* Background Image Carousel (Switches every 4s, crisp & clear overlay) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full"
          >
            <Image
              src={HERO_IMAGES[currentImageIndex]}
              alt="Tactical Outdoor Tent & Gear"
              fill
              className="object-cover object-center w-full h-full opacity-85"
              priority={currentImageIndex === 0}
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>

        {/* Clear Vignette Overlay - Keeps images bright while making text readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#142230] via-[#142230]/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#142230]/70 via-transparent to-[#142230]/40" />
      </div>

      {/* Foreground Hero Content: GEAR UP FOR THE UNEXPLORED + Shop Now button only */}
      <motion.div
        style={{ y: textY }}
        className="relative z-10 space-y-6 max-w-2xl pointer-events-auto text-left"
      >
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase text-white tracking-tight leading-none drop-shadow-md">
          GEAR UP FOR <br />
          THE <span className="text-[#FFFFFF]">UNEXPLORED</span>
        </h1>

        <div>
          <a
            href="#products"
            onClick={handleShopNowClick}
            className="inline-flex items-center gap-2.5 h-11 px-7 rounded-none bg-[#FFFFFF] text-[#142230] hover:bg-[#F4F1E8] font-mono text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95 border border-[#FFFFFF]"
          >
            <span>Shop Now</span>
            <ArrowRight className="w-4 h-4 text-[#142230]" />
          </a>
        </div>
      </motion.div>

      {/* Carousel Progress Indicators */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 z-10 flex items-center gap-1.5">
        {HERO_IMAGES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentImageIndex(idx)}
            aria-label={`Go to hero image ${idx + 1}`}
            className={`h-1 transition-all duration-300 rounded-none ${
              idx === currentImageIndex ? 'w-6 bg-[#FFFFFF]' : 'w-2 bg-[#FFFFFF]/40 hover:bg-[#FFFFFF]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
