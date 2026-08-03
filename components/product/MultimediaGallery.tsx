'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CatalogImage from '@/components/ui/CatalogImage';
import { ZoomIn, X, ImageIcon } from 'lucide-react';

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

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      setIsZoomOpen(true);
    }
    setLastTap(now);
  };

  const formattedIndex = String(currentIndex + 1).padStart(2, '0');
  const formattedTotal = String(displayImages.length).padStart(2, '0');

  return (
    <div className="relative w-full aspect-square bg-[#1F3346] border border-[#33506B] rounded-none overflow-hidden flex flex-col justify-between p-3 my-2 shadow-md">
      {/* Top Media Counter Bar */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 bg-[#142230] border border-[#33506B] px-3 py-1 rounded-none font-mono text-[10px] font-bold text-[#FFFFFF]">
          <ImageIcon className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span>IMAGE {formattedIndex} / {formattedTotal}</span>
        </div>

        <button
          onClick={() => setIsZoomOpen(true)}
          className="inline-flex items-center gap-1 bg-[#142230] border border-[#33506B] px-2.5 py-1 rounded-none font-mono text-[10px] text-[#A0B1C5] hover:border-[#FFFFFF] hover:text-[#FFFFFF] transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span className="hidden sm:inline">ZOOM</span>
        </button>
      </div>

      {/* Main Viewport Container */}
      <div
        onClick={handleTap}
        className="relative flex-1 w-full h-full flex items-center justify-center cursor-pointer select-none bg-[#142230] border border-[#33506B] my-2 rounded-none"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full flex items-center justify-center p-3"
          >
            {currentImage ? (
              <CatalogImage
                src={currentImage}
                alt={productName}
                className="object-contain max-h-full rounded-none"
                sizes="(max-width: 768px) 100vw, 600px"
                priority
              />
            ) : (
              <div className="text-[#A0B1C5] font-mono text-xs">NO HIGH-RES MEDIA AVAILABLE</div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="relative z-10 flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
        {displayImages.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-12 h-12 bg-[#142230] border rounded-none overflow-hidden transition-all shrink-0 ${
              idx === currentIndex ? 'border-[#FFFFFF] bg-[#FFFFFF]/10' : 'border-[#33506B] opacity-60'
            }`}
          >
            {img.url && <CatalogImage src={img.url} alt={`Thumb ${idx}`} sizes="48px" className="rounded-none" />}
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
            className="fixed inset-0 z-50 bg-[#142230]/95 backdrop-blur-md flex flex-col justify-between p-4 rounded-none"
          >
            <div className="flex justify-between items-center z-10 max-w-7xl mx-auto w-full">
              <span className="font-mono text-xs font-bold text-[#FFFFFF]">IMAGE ZOOM // {productName}</span>
              <button
                onClick={() => setIsZoomOpen(false)}
                className="p-2 bg-[#1F3346] border border-[#33506B] text-[#FFFFFF] rounded-none hover:bg-[#FFFFFF] hover:text-[#142230] transition-colors"
                aria-label="Close zoom"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              <motion.img
                src={currentImage}
                alt={productName}
                initial={{ scale: 1 }}
                animate={{ scale: 1.4 }}
                className="max-h-[85vh] object-contain cursor-zoom-out rounded-none"
                onClick={() => setIsZoomOpen(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
