'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

export default function ReviewRatingDistribution() {
  const ratings = [
    { stars: 5, percentage: 84, count: 142 },
    { stars: 4, percentage: 12, count: 20 },
    { stars: 3, percentage: 3, count: 5 },
    { stars: 2, percentage: 1, count: 2 },
    { stars: 1, percentage: 0, count: 0 },
  ];

  return (
    <div className="space-y-3 bg-[#1F3346] border border-[#33506B] p-4 clip-angled my-3">
      <div className="flex items-center justify-between border-b border-[#33506B] pb-3">
        <div>
          <span className="text-2xl font-black font-mono text-white">4.9</span>
          <span className="text-xs text-neutral-400 font-mono"> / 5.0</span>
          <p className="text-[10px] font-mono text-[#9BCB77] uppercase font-bold">169 VERIFIED FIELD REVIEWS</p>
        </div>
        <div className="flex items-center text-[#FFFFFF]">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-current" />
          ))}
        </div>
      </div>

      {/* Animated Rating Bars */}
      <div className="space-y-2 pt-1">
        {ratings.map((r) => (
          <div key={r.stars} className="flex items-center gap-3 text-xs font-mono">
            <span className="w-12 text-neutral-400 flex items-center gap-1">
              {r.stars} <Star className="w-3 h-3 text-[#FFFFFF] fill-current" />
            </span>
            
            <div className="flex-1 h-2 bg-[#1F3346] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${r.percentage}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[#2F4F2F] to-[#FFFFFF]"
              />
            </div>
            
            <span className="w-10 text-right font-bold text-white">{r.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
