'use client';

import Link from 'next/link';
import CatalogImage from '@/components/ui/CatalogImage';
import { useStore } from '@/lib/store';
import { useToastStore } from '@/lib/toast-store';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useStore();
  const addToast = useToastStore((state) => state.addToast);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const shippingCost = subtotal >= 5000 || subtotal === 0 ? 0 : 250;
  const grandTotal = subtotal + shippingCost;

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <div className="text-[10px] font-bold text-brand-dark-gray/60 uppercase tracking-widest flex items-center gap-1">
        <Link href="/" className="hover:underline">Home</Link>
        <span>/</span>
        <span className="text-brand-black">Shopping Cart</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-brand-black/5 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-brand-black">
          Shopping Cart ({cart.length})
        </h1>
        {cart.length > 0 && (
          <button
            onClick={() => {
              clearCart();
              addToast('Cleared all items from your cart.', 'info');
            }}
            className="text-xs font-bold uppercase tracking-wider text-red-500 hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Cart</span>
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="bg-brand-white border border-brand-black/5 py-24 px-4 text-center rounded-none clip-angled">
          <ShoppingBag className="w-16 h-16 text-brand-dark-gray/30 mx-auto stroke-[1.5] mb-4" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Your shopping cart is empty</h3>
          <p className="text-xs text-brand-dark-gray mt-1 max-w-sm mx-auto">
            You don&apos;t have any tactical gear in your cart. Sift through our catalog to find items.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block border border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white text-xs font-bold uppercase py-2.5 px-6 transition-colors clip-angled"
          >
            Go Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Items list (8 cols) */}
          <div className="lg:col-span-8 space-y-4 bg-brand-white border border-brand-black/5 p-4 sm:p-6 clip-angled">
            <div className="divide-y divide-brand-black/5">
              {cart.map((item) => (
                <div 
                  key={`${item.productId}-${item.variantSku || ''}`}
                  className="flex flex-col sm:flex-row gap-4 py-6 first:pt-0 last:pb-0 items-start sm:items-center justify-between"
                >
                  <div className="flex gap-4 items-center">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 bg-brand-light-gray border border-brand-black/5 flex-shrink-0 relative overflow-hidden">
                      {item.image ? (
                        <CatalogImage src={item.image} alt={item.name} sizes="80px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-brand-dark-gray">No Img</div>
                      )}
                    </div>

                    {/* Meta */}
                    <div>
                      <Link href={`/products?slug=${encodeURIComponent(item.productId)}`} className="text-sm sm:text-base font-extrabold text-brand-black hover:underline line-clamp-1">
                        {item.name}
                      </Link>
                      <p className="text-[10px] text-brand-dark-gray/60 font-bold uppercase tracking-widest mt-0.5">
                        {item.vendor}
                      </p>
                      {item.variantSku && (
                        <p className="text-xs text-brand-dark-gray mt-0.5 font-medium">
                          SKU: {item.variantSku}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    {/* Quantity selectors */}
                    <div className="flex items-center border border-brand-black/10 bg-brand-white clip-angled-sm">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantSku)}
                        className="px-2 py-2 text-brand-dark-gray hover:text-brand-black transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantSku)}
                        className="px-2 py-2 text-brand-dark-gray hover:text-brand-black transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right min-w-[90px]">
                      <span className="text-sm sm:text-base font-extrabold block">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </span>
                      <button
                        onClick={() => {
                          removeFromCart(item.productId, item.variantSku);
                          addToast(`Removed "${item.name}" from cart.`, 'info');
                        }}
                        className="text-[10px] uppercase font-bold text-red-500 hover:underline mt-0.5"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart summary side block (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Calculations Box */}
            <div className="bg-brand-white border border-brand-black/5 p-6 clip-angled-lg space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-black border-l-2 border-brand-accent pl-2 mb-2">
                Order Summary
              </h3>

              <div className="space-y-2 text-xs font-semibold text-brand-dark-gray border-b border-brand-black/5 pb-4">
                <div className="flex justify-between">
                  <span>Cart Subtotal</span>
                  <span className="text-brand-black font-extrabold">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Cost</span>
                  <span className="text-brand-black font-extrabold">
                    {shippingCost === 0 ? 'Free Shipping' : `Rs. ${shippingCost.toLocaleString()}`}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-xs font-black uppercase tracking-wider">Total</span>
                <span className="text-xl sm:text-2xl font-black text-brand-black">Rs. {grandTotal.toLocaleString()}</span>
              </div>

              <Link
                href="/checkout"
                className="w-full inline-block bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black text-xs font-extrabold uppercase text-center py-4 transition-colors clip-angled-lg flex items-center justify-center gap-1.5"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <p className="text-[10px] text-center text-brand-dark-gray font-semibold">
                Valid promotion codes can be applied and verified on the checkout page.
              </p>

              <div className="flex justify-center items-center gap-2 pt-2 text-[10px] font-bold text-brand-dark-gray uppercase tracking-wide">
                <ShieldCheck className="w-4.5 h-4.5 text-brand-accent" />
                <span>Encrypted checkout system</span>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
