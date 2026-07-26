'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ShieldCheck, ArrowRight, MapPin } from 'lucide-react';
import type { ProductDto } from '@/lib/catalog-types';

interface HeroCinematicProps {
  featuredProducts?: ProductDto[];
}

export default function HeroCinematic({ featuredProducts = [] }: HeroCinematicProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax Scroll Offset
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const videoY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-8%']);

  const heroItem = featuredProducts[0] || {
    id: 'hero-1',
    name: 'AUTOMATIC TELESCOPIC SELFDEFENCE STICK',
    slug: 'automatic-telescopic-selfdefence-stick',
    price: 2500,
    shortDescription: 'High-strength steel automatic spring telescopic self-defense baton with haptic rubber grip.',
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[480px] sm:h-[580px] rounded-3xl overflow-hidden bento-card border border-white/10 my-4 shadow-2xl flex flex-col justify-between p-6 sm:p-10 group"
    >
      {/* Background Parallax Video Layer */}
      <motion.div style={{ y: videoY }} className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="https://tacticalhub.com.pk/cdn/shop/files/Untitled_design_3.jpg"
          className="w-full h-[115%] object-cover opacity-50 scale-102 transition-transform duration-1000 group-hover:scale-100"
        >
          <source
            src="https://cdn.coverr.co/videos/coverr-rain-falling-on-a-tent-5694/1080p.mp4"
            type="video/mp4"
          />
        </video>
        {/* Dark Vignette Overlay for Premium Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B]/80 via-transparent to-[#0B0B0B]/80" />
      </motion.div>

      {/* Top Banner: Authentic E-commerce Badges for Pakistan */}
      <div className="relative z-10 flex items-center justify-between gap-3 pointer-events-auto">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 bg-[#FF6600]/10 border border-[#FF6600]/40 py-1.5 px-4 rounded-full text-[10px] font-mono text-[#FF6600] font-black uppercase tracking-widest shadow-[0_0_12px_rgba(255,102,0,0.15)]">
            <MapPin className="w-3.5 h-3.5" />
            <span>DELIVERY ALL OVER PAKISTAN</span>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-[#B8EC44]/15 border border-[#B8EC44]/35 py-1.5 px-4 rounded-full text-[10px] font-mono text-[#B8EC44] font-black uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>CASH ON DELIVERY (COD)</span>
          </div>
        </div>
      </div>

      {/* Foreground Content */}
      <motion.div style={{ y: textY }} className="relative z-10 space-y-5 max-w-3xl pointer-events-auto mt-auto text-left">
        <div className="space-y-3">
          <span className="text-xs font-mono font-bold text-[#FF6600] tracking-widest uppercase block">
            PREMIUM OUTDOOR & SELF-DEFENSE EQUIPMENT
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase text-white tracking-tight leading-none">
            GEAR UP FOR <br />
            THE <span className="text-[#FF6600] drop-shadow-[0_0_15px_rgba(255,102,0,0.45)]">UNEXPLORED</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-200 font-medium leading-relaxed max-w-2xl">
            {heroItem.shortDescription || 'Professional grade equipment sourced for extreme outdoor durability.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href={`/products?slug=${encodeURIComponent(heroItem.slug)}`}
            className="bg-[#FF6600] text-black hover:bg-[#E05800] text-xs font-mono font-black uppercase py-4 px-8 rounded-xl transition-all flex items-center gap-2.5 tactile-press shadow-[0_0_20px_rgba(255,102,0,0.4)] border border-[#FF6600]"
          >
            <span>INSPECT GEAR</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/categories?slug=camping-tents"
            className="bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 hover:border-white/30 text-xs font-mono font-black uppercase py-4 px-8 rounded-xl transition-all tactile-press"
          >
            BROWSE TENTS
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
