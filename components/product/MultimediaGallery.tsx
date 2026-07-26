'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CatalogImage from '@/components/ui/CatalogImage';
import { ZoomIn, X, Play, Image as ImageIcon } from 'lucide-react';

interface MultimediaGalleryProps {
  productName: string;
  images: { url: string }[];
}

export default function MultimediaGallery({ productName, images }: MultimediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  const displayImages = images.length > 0 ? images : [{ url: '' }];
  const currentImage = displayImages[currentIndex]?.url || '';

  // Double tap gesture handler for deep zoom
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      setIsZoomOpen(true);
    }
    setLastTap(now);
  };

  return (
    <div className="relative w-full h-[55vh] min-h-[380px] sm:h-[65vh] bento-card bento-card-lg overflow-hidden flex flex-col justify-between p-4 my-2">
      {/* Top Media Counter */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full font-mono text-[10px] text-white">
          <ImageIcon className="w-3.5 h-3.5 text-[#FF6600]" />
          <span>ASSET {currentIndex + 1} / {displayImages.length}</span>
        </div>

        <button
          onClick={() => setIsZoomOpen(true)}
          className="inline-flex items-center gap-1 bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full font-mono text-[10px] text-[#B8EC44] hover:border-[#B8EC44] transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span>DOUBLE TAP TO DEEP-ZOOM</span>
        </button>
      </div>

      {/* Main Viewport Container */}
      <div
        onClick={handleTap}
        className="relative flex-1 w-full h-full flex items-center justify-center cursor-pointer select-none"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full flex items-center justify-center p-4"
          >
            {currentImage ? (
              <CatalogImage
                src={currentImage}
                alt={productName}
                className="object-contain max-h-full"
                sizes="100vw"
                priority
              />
            ) : (
              <div className="text-neutral-500 font-mono text-xs">NO HIGH-RES MEDIA AVAILABLE</div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="relative z-10 flex items-center gap-2 overflow-x-auto pb-1 pt-2">
        {displayImages.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-14 h-14 bg-black/80 border rounded-xl overflow-hidden transition-all shrink-0 ${
              idx === currentIndex ? 'border-[#FF6600] scale-105 shadow-[0_0_10px_rgba(255,102,0,0.4)]' : 'border-white/10 opacity-60'
            }`}
          >
            {img.url && <CatalogImage src={img.url} alt={`Thumb ${idx}`} sizes="56px" />}
          </button>
        ))}
      </div>

      {/* Full-Screen Deep Zoom Modal */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#070707]/95 backdrop-blur-2xl flex flex-col justify-between p-4"
          >
            <div className="flex justify-between items-center z-10 max-w-7xl mx-auto w-full">
              <span className="font-mono text-xs font-bold text-[#FF6600]">DEEP TEXTURE ZOOM // {productName}</span>
              <button
                onClick={() => setIsZoomOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                aria-label="Close zoom"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              <motion.img
                src={currentImage}
                alt={productName}
                initial={{ scale: 1 }}
                animate={{ scale: 1.6 }}
                className="max-h-[85vh] object-contain cursor-zoom-out"
                onClick={() => setIsZoomOpen(false)}
              />
            </div>

            <div className="text-center font-mono text-[10px] text-neutral-400">
              INSPECTING WEAVE STITCHING & MATERIAL DENSITY
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
