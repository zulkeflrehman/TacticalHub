'use client';

import React, { createContext, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ActiveProductTransition {
  id: string;
  name: string;
  image: string;
  rect: { top: number; left: number; width: number; height: number };
}

interface SpatialMotionContextType {
  activeTransition: ActiveProductTransition | null;
  triggerSharedTransition: (product: { id: string; name: string; image: string }, event: React.MouseEvent<HTMLElement>) => void;
  clearTransition: () => void;
  isOmnisearchOpen: boolean;
  setOmnisearchOpen: (open: boolean) => void;
}

const SpatialMotionContext = createContext<SpatialMotionContextType>({
  activeTransition: null,
  triggerSharedTransition: () => {},
  clearTransition: () => {},
  isOmnisearchOpen: false,
  setOmnisearchOpen: () => {},
});

export const useSpatialMotion = () => useContext(SpatialMotionContext);

export function SpatialMotionProvider({ children }: { children: React.ReactNode }) {
  const [activeTransition, setActiveTransition] = useState<ActiveProductTransition | null>(null);
  const [isOmnisearchOpen, setOmnisearchOpen] = useState(false);

  const triggerSharedTransition = (
    product: { id: string; name: string; image: string },
    event: React.MouseEvent<HTMLElement>
  ) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();

    // Haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([15, 30]);
    }

    setActiveTransition({
      id: product.id,
      name: product.name,
      image: product.image,
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
    });

    // Auto clear after transition animation duration
    setTimeout(() => {
      setActiveTransition(null);
    }, 450);
  };

  const clearTransition = () => setActiveTransition(null);

  return (
    <SpatialMotionContext.Provider
      value={{
        activeTransition,
        triggerSharedTransition,
        clearTransition,
        isOmnisearchOpen,
        setOmnisearchOpen,
      }}
    >
      {children}

      {/* Shared Element Transition Overlay */}
      <AnimatePresence>
        {activeTransition && (
          <motion.div
            initial={{
              position: 'fixed',
              top: activeTransition.rect.top,
              left: activeTransition.rect.left,
              width: activeTransition.rect.width,
              height: activeTransition.rect.height,
              zIndex: 9999,
              borderRadius: '0px',
            }}
            animate={{
              top: 0,
              left: 0,
              width: '100vw',
              height: '60vh',
              scale: [1, 1.02, 1],
            }}
            exit={{ opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            className="bg-[#161616] border border-[#FF6600]/40 overflow-hidden shadow-2xl pointer-events-none flex items-center justify-center"
          >
            <motion.img
              src={activeTransition.image}
              alt={activeTransition.name}
              className="w-full h-full object-contain p-6"
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <div className="absolute bottom-4 left-4 right-4 bg-[#0A0A0A]/80 backdrop-blur-md border border-[#FF6600]/30 p-3 clip-angled">
              <span className="text-[10px] font-mono text-[#FF6600] uppercase tracking-widest block">INITIALIZING SPATIAL PDP...</span>
              <span className="text-xs font-black uppercase text-white tracking-wider truncate block">{activeTransition.name}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SpatialMotionContext.Provider>
  );
}
