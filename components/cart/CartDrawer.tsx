'use client';

import { useStore } from '@/lib/store';
import { X, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function CartDrawer() {
  const { cart, isOpen, toggleMiniCart, updateQuantity, removeFromCart } = useStore();

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => toggleMiniCart(false)}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-brand-white border-l border-brand-black/10 flex flex-col shadow-2xl animate-slide-left">
          {/* Header */}
          <div className="px-6 py-5 border-b border-brand-black/5 flex items-center justify-between bg-brand-black text-brand-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-accent" />
              <h2 className="text-lg font-bold tracking-tight uppercase">Your Cart ({cart.length})</h2>
            </div>
            <button 
              onClick={() => toggleMiniCart(false)}
              className="text-brand-white/80 hover:text-brand-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-12">
                <ShoppingBag className="w-12 h-12 text-brand-dark-gray/40 stroke-[1.5]" />
                <div>
                  <p className="text-base font-bold uppercase tracking-wider">Your cart is empty</p>
                  <p className="text-xs text-brand-dark-gray mt-1">Add items to get started on your adventure.</p>
                </div>
                <button
                  onClick={() => toggleMiniCart(false)}
                  className="mt-2 bg-brand-black text-brand-white text-xs font-bold uppercase py-3 px-6 hover:bg-brand-accent hover:text-brand-black transition-colors clip-angled"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={`${item.productId}-${item.variantSku || ''}`}
                  className="flex gap-4 py-4 border-b border-brand-black/5 items-start"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 bg-brand-light-gray relative flex-shrink-0 border border-brand-black/5 overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-brand-dark-gray">No Img</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-h-[80px]">
                    <div>
                      <h4 className="text-sm font-bold leading-tight line-clamp-1">{item.name}</h4>
                      {item.variantSku && (
                        <p className="text-xs text-brand-dark-gray mt-0.5">
                          SKU: {item.variantSku}
                        </p>
                      )}
                      <p className="text-xs text-brand-dark-gray mt-0.5 font-medium">
                        {item.vendor}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity selector */}
                      <div className="flex items-center border border-brand-black/10">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantSku)}
                          className="px-2 py-1 text-brand-dark-gray hover:text-brand-black transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-6 text-center select-none">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantSku)}
                          className="px-2 py-1 text-brand-dark-gray hover:text-brand-black transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price / Delete */}
                      <div className="text-right">
                        <span className="text-sm font-extrabold block">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.productId, item.variantSku)}
                          className="text-[10px] uppercase font-bold text-red-500 hover:underline mt-0.5"
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

          {/* Footer Summary */}
          {cart.length > 0 && (
            <div className="border-t border-brand-black/5 bg-brand-light-gray p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-dark-gray">Subtotal</span>
                <span className="text-xl font-extrabold text-brand-black">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-brand-dark-gray leading-normal">
                Shipping and taxes calculated at checkout. Free shipping applies above Rs. 5,000.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/cart"
                  onClick={() => toggleMiniCart(false)}
                  className="border border-brand-black text-brand-black text-xs font-bold uppercase text-center py-3.5 hover:bg-brand-black hover:text-brand-white transition-colors clip-angled"
                >
                  View Cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={() => toggleMiniCart(false)}
                  className="bg-brand-accent text-brand-black text-xs font-extrabold uppercase text-center py-3.5 hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-1 clip-angled"
                >
                  Checkout <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
