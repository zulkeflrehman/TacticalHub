'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import CatalogImage from '@/components/ui/CatalogImage';
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight, Tag, Truck } from 'lucide-react';

export default function CartDrawer() {
  const { cart, isOpen, toggleMiniCart, updateQuantity, removeFromCart } = useStore();
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

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
  const discountAmount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount);

  const freeShippingThreshold = 5000;
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - subtotal);
  const isFreeShippingUnlocked = subtotal >= freeShippingThreshold;

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([15, 30]);
    }
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    if (couponCode.trim().toUpperCase() === 'TACTICAL10' || couponCode.trim().toUpperCase() === 'RECON') {
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponError('Invalid promo code. Try "TACTICAL10"');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden rounded-none"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping cart"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#142230]/80 backdrop-blur-sm"
        onClick={() => toggleMiniCart(false)}
        aria-hidden="true"
      />

      {/* Slide-Up / Right Drawer Panel */}
      <div className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-[#1F3346] border-l border-[#33506B] shadow-2xl animate-slide-left rounded-none">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between bg-[#142230] px-4 py-3.5 border-b border-[#33506B] rounded-none">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#FFFFFF]" />
            <h2 className="text-xs font-mono font-black uppercase text-[#FFFFFF] tracking-wider">
              GEAR BAG ({cart.length} ITEMS)
            </h2>
          </div>
          <button
            onClick={() => toggleMiniCart(false)}
            aria-label="Close cart"
            className="p-2 text-[#A0B1C5] hover:text-[#FFFFFF] bg-[#1F3346] border border-[#33506B] rounded-none transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Free Shipping Meter */}
        <div className="bg-[#142230] border-b border-[#33506B] px-4 py-2 flex items-center gap-2 text-xs font-mono rounded-none">
          <Truck className="w-4 h-4 text-[#10B981] shrink-0" />
          {isFreeShippingUnlocked ? (
            <span className="text-[#10B981] font-bold">FREE SHIPPING UNLOCKED</span>
          ) : (
            <span className="text-[#A0B1C5]">
              ADD <strong className="text-[#FFFFFF]">Rs. {freeShippingRemaining.toLocaleString()}</strong> MORE FOR FREE SHIPPING
            </span>
          )}
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
              <ShoppingBag className="h-12 w-12 text-[#A0B1C5]/40" />
              <div>
                <p className="text-xs font-mono font-bold uppercase text-[#FFFFFF]">YOUR BAG IS EMPTY</p>
                <p className="mt-1 text-xs text-[#A0B1C5] font-sans">
                  Gear up with tactical equipment from our catalog.
                </p>
              </div>
              <button
                onClick={() => toggleMiniCart(false)}
                className="mt-2 h-11 px-6 bg-[#FFFFFF] hover:bg-[#F4F1E8] text-[#142230] text-xs font-mono font-bold uppercase rounded-none transition-all border border-[#FFFFFF]"
              >
                BROWSE CATALOGUE
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
                  className="bg-[#142230] border border-[#33506B] rounded-none p-3 flex gap-3 items-center relative"
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 shrink-0 overflow-hidden border border-[#33506B] bg-[#1F3346] rounded-none">
                    {item.image ? (
                      <CatalogImage src={item.image} alt={item.name} sizes="64px" className="rounded-none object-contain" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[9px] font-mono text-[#A0B1C5]">
                        NO IMAGE
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="line-clamp-1 text-xs font-mono font-bold uppercase text-[#FFFFFF]">
                          {item.name}
                        </h4>
                        {item.variantSku && (
                          <span className="text-[10px] font-mono text-[#A0B1C5] block truncate">
                            SPEC: {item.variantSku}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          triggerHaptic();
                          removeFromCart(item.productId, item.variantSku);
                        }}
                        className="w-7 h-7 bg-[#1F3346] border border-[#33506B] text-[#A0B1C5] hover:text-[#E55353] hover:border-[#E55353] flex items-center justify-center rounded-none transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {/* Quantity Stepper */}
                      <div className="flex items-center bg-[#1F3346] border border-[#33506B] rounded-none h-8">
                        <button
                          onClick={() => {
                            triggerHaptic();
                            updateQuantity(item.productId, item.quantity - 1, item.variantSku);
                          }}
                          className="w-7 h-full flex items-center justify-center text-[#A0B1C5] hover:text-[#FFFFFF] rounded-none"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center font-mono text-xs font-bold text-[#FFFFFF]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => {
                            triggerHaptic();
                            updateQuantity(item.productId, item.quantity + 1, item.variantSku);
                          }}
                          className="w-7 h-full flex items-center justify-center text-[#A0B1C5] hover:text-[#FFFFFF] rounded-none"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-xs font-mono font-black text-[#FFFFFF]">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer & Checkout Summary */}
        {cart.length > 0 && (
          <div className="shrink-0 border-t border-[#33506B] bg-[#142230] p-4 space-y-3 rounded-none">
            {/* Promo Code Input */}
            <form onSubmit={handleApplyCoupon} className="space-y-1">
              <div className="flex gap-2 relative">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-[#A0B1C5] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="PROMO CODE (TACTICAL10)"
                    className="w-full h-10 pl-9 pr-3 bg-[#1F3346] border border-[#33506B] text-xs font-mono uppercase text-[#FFFFFF] focus:border-[#FFFFFF] rounded-none outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="h-10 px-4 bg-[#1F3346] border border-[#33506B] hover:border-[#FFFFFF] text-[#FFFFFF] hover:bg-[#FFFFFF] hover:text-[#142230] text-xs font-mono font-bold uppercase rounded-none transition-colors"
                >
                  APPLY
                </button>
              </div>
              {couponApplied && (
                <p className="text-[10px] font-mono text-[#10B981]">PROMO CODE APPLIED (10% DISCOUNT)</p>
              )}
              {couponError && (
                <p className="text-[10px] font-mono text-[#E55353]">{couponError}</p>
              )}
            </form>

            {/* Totals Breakdown */}
            <div className="space-y-1 font-mono text-xs pt-1 border-t border-[#33506B]">
              <div className="flex justify-between text-[#A0B1C5]">
                <span>SUBTOTAL</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-[#10B981]">
                  <span>DISCOUNT (10%)</span>
                  <span>-Rs. {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-[#FFFFFF] text-base font-black pt-1 border-t border-[#33506B]">
                <span>TOTAL</span>
                <span>Rs. {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <a
              href="/checkout"
              onClick={() => toggleMiniCart(false)}
              className="w-full h-12 bg-[#FFFFFF] hover:bg-[#F4F1E8] text-[#142230] font-mono font-black text-xs uppercase rounded-none flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4 text-[#142230]" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
