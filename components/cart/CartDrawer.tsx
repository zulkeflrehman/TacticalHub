'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import CatalogImage from '@/components/ui/CatalogImage';
import { X, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CartDrawer() {
  const { cart, isOpen, toggleMiniCart, updateQuantity, removeFromCart } = useStore();

  // Close drawer on Escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleMiniCart(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, toggleMiniCart]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    /* Full-screen overlay — no left padding offset so drawer reaches the edge on every phone */
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping cart"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm"
        onClick={() => toggleMiniCart(false)}
        aria-hidden="true"
      />

      {/* Drawer panel — slides in from right, full height, max width preserved for wider screens */}
      <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-brand-white shadow-2xl animate-slide-left">

        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between bg-brand-black px-4 py-4 text-brand-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-brand-accent" />
            <h2 className="text-base font-bold uppercase tracking-tight">
              Cart ({cart.length})
            </h2>
          </div>
          <button
            onClick={() => toggleMiniCart(false)}
            aria-label="Close cart"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-brand-white/80 hover:text-brand-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Scrollable item list ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
              <ShoppingBag className="h-12 w-12 stroke-[1.5] text-brand-dark-gray/30" />
              <div>
                <p className="text-sm font-bold uppercase tracking-wider">Your cart is empty</p>
                <p className="mt-1 text-xs text-brand-dark-gray">
                  Add items to get started on your adventure.
                </p>
              </div>
              <button
                onClick={() => toggleMiniCart(false)}
                className="mt-2 bg-brand-black px-6 py-3 text-xs font-bold uppercase text-brand-white hover:bg-brand-accent hover:text-brand-black transition-colors clip-angled"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.productId}-${item.variantSku ?? ''}`}
                className="flex gap-3 border-b border-brand-black/5 pb-4 last:border-0 last:pb-0"
              >
                {/* Thumbnail — fixed square, never overflows */}
                <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden border border-brand-black/5 bg-brand-light-gray">
                  {item.image ? (
                    <CatalogImage src={item.image} alt={item.name} sizes="72px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[9px] text-brand-dark-gray">
                      No image
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-xs font-bold leading-snug text-brand-black">
                      {item.name}
                    </p>
                    {item.variantSku && (
                      <p className="mt-0.5 text-[10px] text-brand-dark-gray">
                        SKU: {item.variantSku}
                      </p>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    {/* Quantity control */}
                    <div className="flex items-center border border-brand-black/10">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1, item.variantSku)
                        }
                        aria-label="Decrease quantity"
                        className="flex h-[36px] w-[36px] items-center justify-center text-brand-dark-gray hover:text-brand-black transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 select-none text-center text-xs font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1, item.variantSku)
                        }
                        aria-label="Increase quantity"
                        className="flex h-[36px] w-[36px] items-center justify-center text-brand-dark-gray hover:text-brand-black transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Price + Remove */}
                    <div className="text-right">
                      <span className="block text-sm font-extrabold">
                        Rs.&nbsp;{(item.price * item.quantity).toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.productId, item.variantSku)}
                        className="mt-0.5 text-[10px] font-bold uppercase text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Sticky footer summary + actions ── */}
        {cart.length > 0 && (
          <div
            className="shrink-0 border-t border-brand-black/5 bg-brand-light-gray px-4 pt-4 pb-4"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            {/* Subtotal row */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-dark-gray">
                Subtotal
              </span>
              <span className="text-xl font-extrabold text-brand-black">
                Rs.&nbsp;{subtotal.toLocaleString()}
              </span>
            </div>
            <p className="mb-4 text-[10px] text-brand-dark-gray">
              Shipping calculated at checkout. Free above Rs.&nbsp;5,000.
            </p>

            {/* Action buttons — stack on narrow screens */}
            <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
              <Link
                href="/cart"
                onClick={() => toggleMiniCart(false)}
                className="flex items-center justify-center border border-brand-black py-3.5 text-xs font-bold uppercase text-brand-black hover:bg-brand-black hover:text-brand-white transition-colors clip-angled"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={() => toggleMiniCart(false)}
                className="flex items-center justify-center gap-1.5 bg-brand-accent py-3.5 text-xs font-extrabold uppercase text-brand-black hover:bg-brand-accent-hover transition-colors clip-angled"
              >
                Checkout <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
