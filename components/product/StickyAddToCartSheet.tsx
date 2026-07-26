'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, CartItemState } from '@/lib/store';
import { useToastStore } from '@/lib/toast-store';
import { ShoppingBag, Plus, Minus, Loader2, Check } from 'lucide-react';

interface StickyAddToCartSheetProps {
  product: {
    id: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    vendor: string;
    images: { url: string }[];
    variants: {
      inventoryId: string;
      sku: string;
      name: string;
      price: number;
      compareAtPrice: number | null;
      stock: number;
    }[];
  };
  selectedVariantIndex?: number;
}

export default function StickyAddToCartSheet({ product, selectedVariantIndex = 0 }: StickyAddToCartSheetProps) {
  const { addToCart } = useStore();
  const addToast = useToastStore((state) => state.addToast);
  const [quantity, setQuantity] = useState(1);
  const [buttonState, setButtonState] = useState<'IDLE' | 'LOADING' | 'ADDED'>('IDLE');

  const selectedVariant = product.variants[selectedVariantIndex] || product.variants[0];
  const unitPrice = selectedVariant?.price ?? product.price;

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([25, 50]);
    }
  };

  const handleDecrease = () => {
    triggerHaptic();
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrease = () => {
    triggerHaptic();
    setQuantity((prev) => Math.min(20, prev + 1));
  };

  const handleAddToCart = () => {
    if (buttonState !== 'IDLE') return;

    if (!selectedVariant || selectedVariant.stock <= 0) {
      addToast('Selected item is currently out of stock.', 'error');
      return;
    }

    const item: CartItemState = {
      productId: product.id,
      inventoryId: selectedVariant.inventoryId,
      variantSku: selectedVariant.sku,
      name: product.name,
      price: unitPrice,
      image: product.images[0]?.url || '',
      quantity,
      vendor: product.vendor,
    };

    triggerHaptic();
    setButtonState('LOADING');

    setTimeout(() => {
      if (addToCart(item)) {
        setButtonState('ADDED');
        addToast(`Added ${quantity}× "${product.name}" to gear bag.`, 'success');
        setTimeout(() => setButtonState('IDLE'), 1800);
      } else {
        setButtonState('IDLE');
        addToast('Cart limit reached (max 5 distinct items).', 'error');
      }
    }, 450);
  };

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-0 right-0 z-40 px-3 sm:px-6 pointer-events-none">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md mx-auto bg-[#0B0B0B]/90 backdrop-blur-xl border border-white/10 p-3.5 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.9)] pointer-events-auto flex items-center justify-between gap-3"
      >
        {/* Price & Quantity Summary */}
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-mono text-[#FF6600] uppercase font-bold tracking-widest block truncate">
            Rs. {unitPrice.toLocaleString()} × {quantity}
          </span>
          <h4 className="text-xs font-black uppercase text-white truncate leading-tight">
            {product.name}
          </h4>
        </div>

        {/* Stepper */}
        <div className="flex items-center bg-[#141414] border border-white/10 rounded-xl">
          <button
            onClick={handleDecrease}
            className="p-2 text-neutral-400 hover:text-white transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-7 text-center font-mono text-xs font-black text-white">
            {quantity}
          </span>
          <button
            onClick={handleIncrease}
            className="p-2 text-neutral-400 hover:text-white transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Button Morphing State (Idle -> Loading Spinner -> Added Checkmark) */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAddToCart}
          disabled={buttonState !== 'IDLE' || (selectedVariant && selectedVariant.stock <= 0)}
          className={`py-3 px-5 rounded-xl font-mono text-xs font-black uppercase flex items-center justify-center gap-2 shrink-0 tactile-press transition-all duration-300 ${
            buttonState === 'ADDED'
              ? 'bg-[#10B981] text-black shadow-[0_0_20px_rgba(16,185,129,0.6)]'
              : 'bg-[#FF6600] text-black hover:bg-[#E05800] shadow-[0_0_20px_rgba(255,102,0,0.5)]'
          }`}
        >
          {buttonState === 'LOADING' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>ADDING...</span>
            </>
          ) : buttonState === 'ADDED' ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>ADDED!</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>ADD TO GEAR</span>
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
