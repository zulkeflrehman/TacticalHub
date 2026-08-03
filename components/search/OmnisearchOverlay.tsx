'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpatialMotion } from '@/components/motion/SpatialMotionProvider';
import { listPublishedProducts } from '@/lib/client-services';
import type { ProductDto } from '@/lib/catalog-types';
import CatalogImage from '@/components/ui/CatalogImage';
import { Search, X, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function OmnisearchOverlay() {
  const router = useRouter();
  const { isOmnisearchOpen, setOmnisearchOpen } = useSpatialMotion();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<ProductDto[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPublishedProducts().then(setProducts).catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (isOmnisearchOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOmnisearchOpen]);

  const { filteredResults, searchConfidence } = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) {
      return { filteredResults: [], searchConfidence: 0 };
    }

    const matches = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.vendor.toLowerCase().includes(q) ||
        p.shortDescription?.toLowerCase().includes(q)
    );

    const topMatches = matches.slice(0, 6);
    let confidence = 20;
    if (matches.length > 0) {
      const topMatch = matches[0].name.toLowerCase();
      confidence = topMatch.startsWith(q) ? 98 : topMatch.includes(q) ? 85 : 70;
    }

    return { filteredResults: topMatches, searchConfidence: confidence };
  }, [query, products]);

  const handleClose = () => {
    setOmnisearchOpen(false);
    setQuery('');
  };

  const handleProductSelect = (slug: string) => {
    handleClose();
    router.push(`/products?slug=${encodeURIComponent(slug)}`);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const q = query.trim();
      handleClose();
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  if (!isOmnisearchOpen) return null;

  // Dynamic glowing gradient border color based on confidence score
  const getConfidenceBorder = () => {
    if (searchConfidence >= 90) return 'border-[#FFFFFF] shadow-[0_0_20px_rgba(255,102,0,0.6)]';
    if (searchConfidence >= 70) return 'border-[#4A7C4A] shadow-[0_0_15px_rgba(74,124,74,0.4)]';
    if (searchConfidence > 0) return 'border-amber-500/50';
    return 'border-[#33506B]';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#142230]/90 backdrop-blur-2xl flex flex-col p-4 sm:p-6 overflow-hidden"
      >
        {/* Background 3D Tactical Shader Grid Simulation */}
        <div className="absolute inset-0 tactical-grid-accent opacity-20 pointer-events-none" />

        {/* Top Close Row */}
        <div className="flex items-center justify-between z-10 max-w-3xl w-full mx-auto pb-4 border-b border-[#33506B]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#FFFFFF]" />
            <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">
              OMNISEARCH // INTELLIGENCE SYSTEM
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-neutral-400 hover:text-white bg-[#1F3346] border border-[#33506B] clip-angled transition-colors"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input & Search Confidence Display */}
        <div className="max-w-3xl w-full mx-auto my-6 z-10 space-y-2">
          <form onSubmit={handleFormSubmit} className="relative">
            <div className={`relative clip-angled border transition-all duration-300 ${getConfidenceBorder()}`}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tactical equipment, tents, batons, defense gear..."
                className="w-full bg-[#1F3346] text-white py-4 pl-12 pr-28 text-base sm:text-lg font-bold placeholder-neutral-500 focus:outline-none"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFFFFF]" />
              
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#FFFFFF] text-black hover:bg-[#F4F1E8] px-4 py-2 font-mono text-xs font-black uppercase clip-angled transition-colors"
              >
                EXECUTE
              </button>
            </div>
          </form>

          {/* Search Confidence Metric Indicator */}
          {query.trim().length > 0 && (
            <div className="flex items-center justify-between text-[11px] font-mono px-2">
              <span className="text-neutral-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#FFFFFF]" />
                RELEVANCE MATRIX
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-[#1F3346] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#2F4F2F] via-[#4A7C4A] to-[#FFFFFF] transition-all duration-300"
                    style={{ width: `${searchConfidence}%` }}
                  />
                </div>
                <span className="font-bold text-[#FFFFFF]">{searchConfidence}% CONFIDENCE</span>
              </div>
            </div>
          )}
        </div>

        {/* Results Container with Staggered Animations */}
        <div className="max-w-3xl w-full mx-auto flex-1 overflow-y-auto z-10 space-y-3 pr-1">
          {query.trim().length === 0 ? (
            <div className="space-y-4 pt-4">
              <span className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider block">
                SUGGESTED DEPLOYMENT CATEGORIES
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['Camping Tents', 'Knives & Tasers', 'Travel & Camping', 'Self-Defense', 'Outdoor Tools', 'Tactical Gear'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setQuery(cat)}
                    className="p-3 bg-[#1F3346] border border-[#33506B] hover:border-[#FFFFFF]/40 clip-angled text-left transition-all group"
                  >
                    <span className="text-xs font-bold text-white group-hover:text-[#FFFFFF] transition-colors block">
                      {cat}
                    </span>
                    <span className="text-[9px] font-mono text-neutral-400 uppercase block mt-1">QUICK FILTER</span>
                  </button>
                ))}
              </div>
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#9BCB77] uppercase tracking-wider block">
                MATCHED ASSETS ({filteredResults.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredResults.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleProductSelect(product.slug)}
                    className="p-3 bg-[#1F3346] border border-[#33506B] hover:border-[#FFFFFF] clip-angled cursor-pointer flex gap-3 items-center group transition-all"
                  >
                    <div className="w-14 h-14 bg-[#1F3346] border border-[#33506B] relative shrink-0 overflow-hidden clip-angled-sm">
                      {product.images[0]?.url ? (
                        <CatalogImage src={product.images[0].url} alt={product.name} sizes="56px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-400">
                          NO IMAGE
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-mono text-[#FFFFFF] uppercase font-bold block truncate">
                        {product.categoryName}
                      </span>
                      <h4 className="text-xs font-black uppercase text-white truncate group-hover:text-[#FFFFFF] transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-xs font-mono font-extrabold text-white mt-1">
                        Rs. {product.price.toLocaleString()}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#FFFFFF] group-hover:translate-x-1 transition-all shrink-0" />
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 space-y-2">
              <p className="text-sm font-mono font-bold text-neutral-400 uppercase">NO TACTICAL ASSETS FOUND</p>
              <p className="text-xs text-neutral-400">Try searching for &quot;tents&quot;, &quot;batons&quot;, &quot;tasers&quot;, or &quot;knives&quot;</p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
