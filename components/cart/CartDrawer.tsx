'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import CatalogImage from '@/components/ui/CatalogImage';
import AccordionCheckoutModal from '@/components/checkout/AccordionCheckoutModal';
import { X, Plus, Minus, ShoppingBag, ArrowRight, Trash2, ShieldCheck, Lock } from 'lucide-react';

export default function CartDrawer() {
  const { cart, isOpen, toggleMiniCart, updateQuantity, removeFromCart } = useStore();
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggleMiniCart(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, toggleMiniCart]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([15, 30]);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-[#070707]/85 backdrop-blur-md"
          onClick={() => toggleMiniCart(false)}
          aria-hidden="true"
        />

        {/* Drawer Panel */}
        <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-[#0B0B0B] border-l border-white/10 shadow-2xl animate-slide-left">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between bg-[#121212] px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-[#FF6600]" />
              <h2 className="text-sm font-mono font-black uppercase text-white tracking-widest">
                GEAR BAG ({cart.length})
              </h2>
            </div>
            <button
              onClick={() => toggleMiniCart(false)}
              aria-label="Close cart"
              className="p-2 text-neutral-400 hover:text-white bg-[#1A1A1A] border border-white/10 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>



          {/* Scrollable Item List */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
                <ShoppingBag className="h-12 w-12 text-neutral-600" />
                <div>
                  <p className="text-xs font-mono font-bold uppercase text-white">YOUR GEAR BAG IS EMPTY</p>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    Add tactical equipment to gear up.
                  </p>
                </div>
                <button
                  onClick={() => toggleMiniCart(false)}
                  className="mt-2 bg-[#FF6600] text-black px-6 py-2.5 text-xs font-mono font-black uppercase rounded-xl shadow-[0_0_15px_rgba(255,102,0,0.4)] tactile-press"
                >
                  EXPLORE GEAR
                </button>
              </div>
            ) : (
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={`${item.productId}-${item.variantSku ?? ''}`}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    drag="x"
                    dragConstraints={{ left: -100, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -60) {
                        triggerHaptic();
                        removeFromCart(item.productId, item.variantSku);
                      }
                    }}
                    className="bento-card p-3 flex gap-3 relative cursor-grab active:cursor-grabbing"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-white/10 bg-[#070707] rounded-xl">
                      {item.image ? (
                        <CatalogImage src={item.image} alt={item.name} sizes="64px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[8px] text-neutral-500">
                          NO IMG
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div>
                        <h4 className="line-clamp-1 text-xs font-black uppercase text-white">
                          {item.name}
                        </h4>
                        <span className="text-[9px] font-mono text-neutral-400 block truncate">
                          {item.vendor} {item.variantSku ? `// SKU: ${item.variantSku}` : ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        {/* Stepper */}
                        <div className="flex items-center bg-[#141414] border border-white/10 rounded-xl">
                          <button
                            onClick={() => {
                              triggerHaptic();
                              updateQuantity(item.productId, item.quantity - 1, item.variantSku);
                            }}
                            className="p-1.5 text-neutral-400 hover:text-white"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center font-mono text-xs font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => {
                              triggerHaptic();
                              updateQuantity(item.productId, item.quantity + 1, item.variantSku);
                            }}
                            className="p-1.5 text-neutral-400 hover:text-white"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Price & Trash Trigger */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black text-white">
                            Rs. {(item.price * item.quantity).toLocaleString()}
                          </span>
                          <button
                            onClick={() => {
                              triggerHaptic();
                              removeFromCart(item.productId, item.variantSku);
                            }}
                            className="text-neutral-500 hover:text-[#EF4444] transition-colors p-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Footer Actions */}
          {cart.length > 0 && (
            <div className="shrink-0 border-t border-white/10 bg-[#121212] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400 uppercase font-bold">SUBTOTAL</span>
                <span className="text-xl font-black text-white">
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => {
                  triggerHaptic();
                  setCheckoutOpen(true);
                }}
                className="w-full bg-[#FF6600] text-black hover:bg-[#E05800] py-3.5 px-4 font-mono text-xs font-black uppercase rounded-xl flex items-center justify-center gap-2 tactile-press shadow-[0_0_20px_rgba(255,102,0,0.5)]"
              >
                <Lock className="w-4 h-4" />
                <span>PROCEED TO SECURE CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Accordion Checkout Modal */}
      <AccordionCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </>
  );
}
