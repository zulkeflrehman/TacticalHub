'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewRatingDistribution from './ReviewRatingDistribution';
import { ChevronDown, ShieldCheck, Ruler, MessageSquare, CheckCircle } from 'lucide-react';

interface ProductAccordionsProps {
  product: {
    description: string;
    categoryName: string;
    vendor: string;
  };
}

export default function ProductAccordions({ product }: ProductAccordionsProps) {
  const [openSection, setOpenSection] = useState<'SPECS' | 'SIZING' | 'REVIEWS' | null>('SPECS');

  const toggleSection = (section: 'SPECS' | 'SIZING' | 'REVIEWS') => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const accordionItems = [
    {
      id: 'SPECS' as const,
      title: 'TECHNICAL SPECIFICATIONS',
      icon: ShieldCheck,
      content: (
        <div className="space-y-3 text-xs text-neutral-300 font-mono">
          <p className="leading-relaxed font-sans">{product.description || 'Military-grade high endurance tactical equipment.'}</p>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2A2A2A]">
            <div className="bg-[#1A1A1A] p-2 clip-angled-sm">
              <span className="text-[9px] text-neutral-500 block">CATEGORY</span>
              <span className="font-bold text-white uppercase">{product.categoryName}</span>
            </div>
            <div className="bg-[#1A1A1A] p-2 clip-angled-sm">
              <span className="text-[9px] text-neutral-500 block">VENDOR SPEC</span>
              <span className="font-bold text-[#FF6600] uppercase">{product.vendor || 'TECTICALHUB'}</span>
            </div>
            <div className="bg-[#1A1A1A] p-2 clip-angled-sm">
              <span className="text-[9px] text-neutral-500 block">WATER RESISTANCE</span>
              <span className="font-bold text-white uppercase">IP68 WATERPROOF</span>
            </div>
            <div className="bg-[#1A1A1A] p-2 clip-angled-sm">
              <span className="text-[9px] text-neutral-500 block">WARRANTY</span>
              <span className="font-bold text-white uppercase">1 YEAR LIMITED</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'SIZING' as const,
      title: 'TACTICAL SIZING & WEIGHT GUIDE',
      icon: Ruler,
      content: (
        <div className="space-y-2 text-xs font-mono text-neutral-300">
          <p>Standard military dimensions designed for maximum portability and tactical load distribution.</p>
          <table className="w-full text-left border-collapse border border-[#2A2A2A] mt-2">
            <thead>
              <tr className="bg-[#1A1A1A] text-[10px] text-[#FF6600]">
                <th className="p-2 border border-[#2A2A2A]">PARAM</th>
                <th className="p-2 border border-[#2A2A2A]">VALUE</th>
                <th className="p-2 border border-[#2A2A2A]">RATING</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-[#2A2A2A]">DIMENSIONS</td>
                <td className="p-2 border border-[#2A2A2A]">450 × 280 × 120 mm</td>
                <td className="p-2 border border-[#2A2A2A] text-[#4A7C4A]">COMPACT</td>
              </tr>
              <tr>
                <td className="p-2 border border-[#2A2A2A]">NET WEIGHT</td>
                <td className="p-2 border border-[#2A2A2A]">1.25 KG</td>
                <td className="p-2 border border-[#2A2A2A] text-[#4A7C4A]">LIGHTWEIGHT</td>
              </tr>
              <tr>
                <td className="p-2 border border-[#2A2A2A]">MATERIAL</td>
                <td className="p-2 border border-[#2A2A2A]">1000D NYLON / TITANIUM</td>
                <td className="p-2 border border-[#2A2A2A] text-[#FF6600]">EXTREME</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: 'REVIEWS' as const,
      title: 'FIELD REVIEWS & RATINGS',
      icon: MessageSquare,
      content: (
        <div className="space-y-4">
          <ReviewRatingDistribution />
          <div className="space-y-3">
            {[
              { author: 'Major R. Malik', text: 'Used in northern mountain deployment. Exceptional build quality and waterproof sealing.', date: '2 DAYS AGO' },
              { author: 'Captain Tariq A.', text: 'Fast delivery across Lahore. Product matched the exact tactical specifications.', date: '1 WEEK AGO' },
            ].map((rev, idx) => (
              <div key={idx} className="bg-[#121212] border border-[#2A2A2A] p-3 clip-angled space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" /> {rev.author}
                  </span>
                  <span className="text-[9px] text-neutral-500">{rev.date}</span>
                </div>
                <p className="text-xs text-neutral-300 font-sans">{rev.text}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3 my-6">
      {accordionItems.map((item) => {
        const Icon = item.icon;
        const isOpen = openSection === item.id;

        return (
          <div key={item.id} className="bg-[#161616] border border-[#2A2A2A] clip-angled overflow-hidden">
            <button
              onClick={() => toggleSection(item.id)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#1E1E1E] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-[#FF6600]" />
                <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                  {item.title}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${
                  isOpen ? 'rotate-180 text-[#FF6600]' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  className="px-4 pb-4 border-t border-[#2A2A2A]"
                >
                  <div className="pt-3">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
