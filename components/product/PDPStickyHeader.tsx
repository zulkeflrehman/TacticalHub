'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ShieldCheck } from 'lucide-react';

interface PDPStickyHeaderProps {
  productName: string;
  price: number;
  onAddToCart: () => void;
}

export default function PDPStickyHeader({ productName, price, onAddToCart }: PDPStickyHeaderProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky header when user scrolls down past 400px
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-40 bg-[#0B0B0B]/90 backdrop-blur-xl border-b border-white/10 px-4 py-2.5 shadow-2xl flex items-center justify-between gap-4 max-w-7xl mx-auto"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-black uppercase text-white truncate leading-tight">
                {productName}
              </h4>
              <span className="text-[10px] font-mono text-[#FF6600] font-bold">
                Rs. {price.toLocaleString()}
              </span>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onAddToCart}
            className="bg-[#FF6600] text-black hover:bg-[#E05800] py-2 px-4 rounded-xl font-mono text-xs font-black uppercase flex items-center gap-1.5 shrink-0 tactile-press shadow-[0_0_12px_rgba(255,102,0,0.4)]"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">QUICK ADD</span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
