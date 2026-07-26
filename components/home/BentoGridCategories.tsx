'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { CategoryDto } from '@/lib/catalog-types';
import { ArrowRight, Compass, Shield, Zap, Flame } from 'lucide-react';

interface BentoGridCategoriesProps {
  categories: CategoryDto[];
}

export default function BentoGridCategories({ categories }: BentoGridCategoriesProps) {
  // Preset editorial macro shots for high-fidelity tactical aesthetics
  const macroShots: { [key: string]: string } = {
    'camping-tents': 'https://tacticalhub.com.pk/cdn/shop/files/Untitled_design_3.jpg',
    'knives-tasers': 'https://tacticalhub.com.pk/cdn/shop/files/1_7162411a-422c-4acf-aec0-342732a1b5e3.webp?v=1780473836&width=360',
    'travel-camping': 'https://tacticalhub.com.pk/cdn/shop/files/TravelFoldingStool_1.webp?v=1779691127&width=360',
    'premium-items': 'https://tacticalhub.com.pk/cdn/shop/files/22_251114cc-c6cb-416d-a96c-9cc7e1702ef5.jpg?v=1781088997&width=360',
  };

  return (
    <section className="space-y-4 my-8">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-[#FF6600]" />
          <h2 className="text-lg sm:text-2xl font-black uppercase text-white tracking-tight">
            EDITORIAL DEPLOYMENT BENTO
          </h2>
        </div>
        <span className="text-xs font-mono text-[#B8EC44] font-bold uppercase tracking-wider">
          4 CATEGORY PANELS
        </span>
      </div>

      {/* Asymmetrical Bento Box Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Card 1: Wide 2-col Bento Card (Camping Tents) */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="sm:col-span-2 relative h-[240px] sm:h-[280px] bento-card bento-card-lg overflow-hidden group p-6 flex flex-col justify-between"
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
            style={{
              backgroundImage: `url('${macroShots['camping-tents']}')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/40 to-transparent" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#FF6600] uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full border border-white/10">
              MACRO WEAVE // WATERPROOF
            </span>
            <Flame className="w-5 h-5 text-[#FF6600]" />
          </div>

          <div className="relative z-10 space-y-2">
            <h3 className="text-2xl font-black uppercase text-white tracking-tight group-hover:text-[#FF6600] transition-colors">
              AUTOMATIC CAMPING TENTS
            </h3>
            <p className="text-xs text-neutral-300 line-clamp-1 font-medium">
              Heavy-duty double-layer 1000D ripstop nylon shelters engineered for harsh weather.
            </p>
            <Link
              href="/categories?slug=camping-tents"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-black text-[#FF6600] uppercase tracking-wider group-hover:translate-x-1 transition-transform"
            >
              <span>EXPLORE SHELTERS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

        {/* Card 2: 1-col Bento Square (Knives & Tasers) */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="sm:col-span-1 relative h-[240px] sm:h-[280px] bento-card bento-card-lg overflow-hidden group p-6 flex flex-col justify-between"
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
            style={{
              backgroundImage: `url('${macroShots['knives-tasers']}')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/40 to-transparent" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#B8EC44] uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full border border-white/10">
              DEFENSE
            </span>
            <Zap className="w-5 h-5 text-[#B8EC44]" />
          </div>

          <div className="relative z-10 space-y-1">
            <h3 className="text-xl font-black uppercase text-white tracking-tight group-hover:text-[#B8EC44] transition-colors">
              KNIVES & TASERS
            </h3>
            <Link
              href="/categories?slug=knives-tasers"
              className="inline-flex items-center gap-1 text-xs font-mono font-black text-[#B8EC44] uppercase tracking-wider group-hover:translate-x-1 transition-transform pt-1"
            >
              <span>INSPECT</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

        {/* Card 3: 1-col Bento Square (Travel & Camping) */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="sm:col-span-1 relative h-[240px] sm:h-[280px] bento-card bento-card-lg overflow-hidden group p-6 flex flex-col justify-between"
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
            style={{
              backgroundImage: `url('${macroShots['travel-camping']}')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/40 to-transparent" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full border border-white/10">
              FIELD UTILITY
            </span>
            <Shield className="w-5 h-5 text-white" />
          </div>

          <div className="relative z-10 space-y-1">
            <h3 className="text-xl font-black uppercase text-white tracking-tight group-hover:text-[#FF6600] transition-colors">
              TRAVEL & CAMPING
            </h3>
            <Link
              href="/categories?slug=travel-camping"
              className="inline-flex items-center gap-1 text-xs font-mono font-black text-[#FF6600] uppercase tracking-wider group-hover:translate-x-1 transition-transform pt-1"
            >
              <span>DISCOVER</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
