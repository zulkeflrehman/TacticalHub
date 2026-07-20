'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CatalogImage from '@/components/ui/CatalogImage';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStore } from '@/lib/store';
import { useToastStore } from '@/lib/toast-store';
import { auth } from '@/lib/firebase-client';
import { FREE_SHIPPING_THRESHOLD_PKR, placeCodOrder, quoteCoupon, SHIPPING_COST_PKR } from '@/lib/client-services';
import { 
  ShoppingBag, ShieldCheck, CheckCircle2,
  ArrowRight, Landmark, Truck
} from 'lucide-react';

// Validation Schema
const checkoutSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Invalid phone number format'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  address: z.string().min(5, 'Detailed shipping address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
  postalCode: z.string().min(4, 'Postal code must be at least 4 digits'),
  paymentMethod: z.literal('COD'),
  notes: z.string().optional()
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;
interface CheckoutQuote {
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  couponCode: string | null;
}

interface PlacedOrder {
  orderNumber: string;
  paymentMethod: 'COD';
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  total: number;
}

export default function CheckoutPage() {
  const { cart, clearCart } = useStore();
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [serverQuote, setServerQuote] = useState<CheckoutQuote | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);

  const localSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const subtotal = serverQuote?.subtotal ?? localSubtotal;
  const couponDiscount = serverQuote?.discount ?? 0;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCheckingCoupon(true);
    try {
      const cleanCode = couponCode.toUpperCase().trim();
      const quote = await quoteCoupon(cleanCode, localSubtotal);
      setServerQuote({ subtotal: localSubtotal, shippingCost: localSubtotal >= FREE_SHIPPING_THRESHOLD_PKR ? 0 : SHIPPING_COST_PKR, discount: quote.discount, total: localSubtotal - quote.discount + (localSubtotal >= FREE_SHIPPING_THRESHOLD_PKR ? 0 : SHIPPING_COST_PKR), couponCode: quote.code });
      setAppliedCoupon(cleanCode);
      addToast(`Coupon "${cleanCode}" applied.`, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to validate this coupon.', 'error');
    } finally {
      setCheckingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon('');
    setServerQuote(null);
    setCouponCode('');
    addToast('Coupon code removed.', 'info');
  };

  const shippingCost = serverQuote?.shippingCost ?? (subtotal >= FREE_SHIPPING_THRESHOLD_PKR || subtotal === 0 ? 0 : SHIPPING_COST_PKR);
  const grandTotal = serverQuote?.total ?? Math.max(0, subtotal + shippingCost);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: 'COD'
    }
  });
  const selectedPaymentMethod = useWatch({ control, name: 'paymentMethod' });

  const onSubmit = async (data: CheckoutFormData) => {
    if (cart.length === 0) {
      addToast('Your cart is empty.', 'error');
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      addToast('Log in or create an account before placing your order.', 'info');
      router.push('/account/login?redirect=/checkout');
      return;
    }

    setSubmittingOrder(true);
    try {
      const order = await placeCodOrder(user, cart, data, appliedCoupon || undefined);
      setPlacedOrder(order);
      clearCart();
      addToast('Order placed successfully!', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to place the order.', 'error');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // If order was successfully placed, render Order Confirmation
  if (placedOrder) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 bg-brand-white border border-brand-black/5 p-8 clip-angled-lg">
        <div className="text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-success mx-auto animate-pulse" />
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-brand-black">
              Order Confirmed!
            </h1>
            <p className="text-xs text-brand-dark-gray font-bold uppercase tracking-wider">
              Order Number: <span className="text-brand-black font-black">{placedOrder.orderNumber}</span>
            </p>
          </div>
          <p className="text-xs sm:text-sm text-brand-dark-gray max-w-lg mx-auto font-semibold leading-relaxed">
            Thank you for shopping at TecticalHub. Your order has been saved and is awaiting confirmation by our fulfillment team.
          </p>
        </div>

        <hr className="border-brand-black/5" />

        {/* Payment Instructions */}
        <div className="bg-brand-light-gray border border-brand-black/5 p-4 clip-angled-sm space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-brand-black flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-brand-accent" />
            <span>Payment Instructions</span>
          </h4>
          <p className="text-[11px] font-semibold text-brand-dark-gray leading-normal">
            You selected Cash on Delivery (COD). Please pay the courier officer in cash upon receiving your package at your shipping address.
          </p>
        </div>

        {/* Invoice Summary */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-black border-l-2 border-brand-accent pl-2">
            Invoice Summary
          </h3>
          <div className="border border-brand-black/5 divide-y divide-brand-black/5 text-xs">
            <div className="grid grid-cols-2 p-3 font-semibold">
              <span className="text-brand-dark-gray uppercase">Customer Name</span>
              <span className="text-brand-black text-right">{placedOrder.firstName} {placedOrder.lastName}</span>
            </div>
            <div className="grid grid-cols-2 p-3 font-semibold">
              <span className="text-brand-dark-gray uppercase">Shipping Address</span>
              <span className="text-brand-black text-right">{placedOrder.address}, {placedOrder.city}, {placedOrder.state}</span>
            </div>
            <div className="grid grid-cols-2 p-3 font-semibold">
              <span className="text-brand-dark-gray uppercase">Phone Number</span>
              <span className="text-brand-black text-right">{placedOrder.phone}</span>
            </div>
            <div className="grid grid-cols-2 p-3 font-semibold">
              <span className="text-brand-dark-gray uppercase">Payment Method</span>
              <span className="text-brand-black text-right uppercase">{placedOrder.paymentMethod}</span>
            </div>
            <div className="grid grid-cols-2 p-3 font-semibold bg-brand-light-gray">
              <span className="text-brand-black font-extrabold uppercase">Total Bill</span>
              <span className="text-brand-black text-right font-black">Rs. {placedOrder.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="text-center pt-2">
          <Link
            href="/"
            className="bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black text-xs font-bold uppercase py-3 px-8 transition-colors clip-angled"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Render Form if not submitted yet
  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <div className="text-[10px] font-bold text-brand-dark-gray/60 uppercase tracking-widest flex items-center gap-1">
        <Link href="/cart" className="hover:underline">Cart</Link>
        <span>/</span>
        <span className="text-brand-black">Checkout</span>
      </div>

      <div className="border-b border-brand-black/5 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-brand-black">
          Checkout Shipping & Order
        </h1>
      </div>

      {cart.length === 0 ? (
        <div className="bg-brand-white border border-brand-black/5 py-16 px-4 text-center rounded-none clip-angled">
          <ShoppingBag className="w-12 h-12 text-brand-dark-gray/30 mx-auto stroke-[1.5] mb-4" />
          <h3 className="text-sm font-bold uppercase tracking-wider">No items to checkout</h3>
          <p className="text-xs text-brand-dark-gray mt-1">Please add tactical items to your cart first.</p>
          <Link
            href="/"
            className="mt-6 inline-block bg-brand-black text-brand-white text-xs font-bold uppercase py-2.5 px-6 hover:bg-brand-accent hover:text-brand-black transition-colors clip-angled"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Shipping Form (7 cols) */}
          <div className="lg:col-span-7 bg-brand-white border border-brand-black/5 p-6 clip-angled space-y-6">
            
            {/* Contact Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-black border-l-2 border-brand-accent pl-2">
                1. Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Email Address</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black"
                  />
                  {errors.email && <p className="text-[10px] font-bold text-red-500">{errors.email.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Mobile Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 03001234567"
                    {...register('phone')}
                    className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black"
                  />
                  {errors.phone && <p className="text-[10px] font-bold text-red-500">{errors.phone.message}</p>}
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-black border-l-2 border-brand-accent pl-2">
                2. Shipping Address
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-brand-dark-gray block">First Name</label>
                  <input
                    type="text"
                    {...register('firstName')}
                    className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black"
                  />
                  {errors.firstName && <p className="text-[10px] font-bold text-red-500">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Last Name</label>
                  <input
                    type="text"
                    {...register('lastName')}
                    className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black"
                  />
                  {errors.lastName && <p className="text-[10px] font-bold text-red-500">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Detailed Address (Street, House/Flat, Area)</label>
                <input
                  type="text"
                  placeholder="Apartment, suite, unit, building, floor, street details"
                  {...register('address')}
                  className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black"
                />
                {errors.address && <p className="text-[10px] font-bold text-red-500">{errors.address.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-brand-dark-gray block">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Lahore / Karachi"
                    {...register('city')}
                    className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black"
                  />
                  {errors.city && <p className="text-[10px] font-bold text-red-500">{errors.city.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-brand-dark-gray block">State / Province</label>
                  <input
                    type="text"
                    placeholder="e.g. Punjab"
                    {...register('state')}
                    className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black"
                  />
                  {errors.state && <p className="text-[10px] font-bold text-red-500">{errors.state.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Postal Code</label>
                  <input
                    type="text"
                    {...register('postalCode')}
                    className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black"
                  />
                  {errors.postalCode && <p className="text-[10px] font-bold text-red-500">{errors.postalCode.message}</p>}
                </div>
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-black border-l-2 border-brand-accent pl-2">
                3. Payment Method
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* COD option */}
                <label className="flex items-start gap-3 p-4 bg-brand-light-gray border border-brand-black/10 hover:border-brand-black cursor-pointer clip-angled-sm">
                  <input
                    type="radio"
                    value="COD"
                    {...register('paymentMethod')}
                    className="accent-brand-black mt-1"
                  />
                  <div>
                    <span className="text-xs font-bold block uppercase flex items-center gap-1">
                      <Truck className="w-4 h-4 text-brand-accent" /> Cash On Delivery (COD)
                    </span>
                    <span className="text-[10px] text-brand-dark-gray/80 font-medium leading-relaxed block mt-1">
                      Pay on delivery nationwide at your shipping address.
                    </span>
                  </div>
                </label>

              </div>
            </div>

            {/* Order Notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Order Notes (Optional)</label>
              <textarea
                placeholder="Special delivery instructions, gate code, landmarks..."
                rows={3}
                {...register('notes')}
                className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black"
              />
            </div>

          </div>

          {/* Sidebar Summary & Review (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Coupon Box */}
            <div className="bg-brand-white border border-brand-black/5 p-6 clip-angled">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-black border-l-2 border-brand-accent pl-2 mb-4">
                Promo Code
              </h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-brand-light-gray p-3 border border-brand-accent clip-angled-sm">
                  <div>
                    <span className="text-xs font-bold block">{appliedCoupon} Applied</span>
                    <span className="text-[10px] text-brand-dark-gray font-semibold">Rs. {couponDiscount.toLocaleString()} Saved</span>
                  </div>
                  <button type="button" onClick={handleRemoveCoupon} className="text-xs font-bold text-red-500 hover:underline">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ENTER WELCOME10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 bg-brand-light-gray border border-brand-black/10 py-2 px-3 text-xs font-semibold uppercase focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={checkingCoupon}
                    className="bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black px-4 py-2 text-xs font-bold uppercase transition-colors clip-angled shrink-0"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Order Review List */}
            <div className="bg-brand-white border border-brand-black/5 p-6 clip-angled-lg space-y-6">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-black border-l-2 border-brand-accent pl-2">
                Order Review
              </h3>

              {/* Items Breakdown */}
              <div className="divide-y divide-brand-black/5 max-h-60 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={`${item.productId}-${item.variantSku || ''}`} className="flex gap-3 py-3 first:pt-0 last:pb-0 items-center">
                    <div className="w-10 h-10 bg-brand-light-gray border border-brand-black/5 shrink-0 relative overflow-hidden">
                      {item.image && <CatalogImage src={item.image} alt={item.name} sizes="40px" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-brand-black truncate">{item.name}</h4>
                      <p className="text-[10px] text-brand-dark-gray">Qty: {item.quantity} x Rs. {item.price.toLocaleString()}</p>
                    </div>
                    <span className="text-xs font-extrabold shrink-0">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="space-y-2 text-xs font-semibold text-brand-dark-gray border-t border-b border-brand-black/5 py-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-brand-black font-extrabold">Rs. {subtotal.toLocaleString()}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Coupon Discount</span>
                    <span className="font-extrabold">- Rs. {couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping Cost</span>
                  <span className="text-brand-black font-extrabold">
                    {shippingCost === 0 ? 'Free Shipping' : `Rs. ${shippingCost.toLocaleString()}`}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-1">
                <span className="text-xs font-black uppercase tracking-wider">Total Bill</span>
                <span className="text-xl font-black text-brand-black">Rs. {grandTotal.toLocaleString()}</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingOrder}
                className="w-full bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black text-xs font-extrabold uppercase text-center py-4 transition-colors clip-angled-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {submittingOrder ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <span>Place Order ({selectedPaymentMethod})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex justify-center items-center gap-2 pt-2 text-[9px] font-bold text-brand-dark-gray uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-brand-accent" />
                <span>Inventory verified by Firestore transaction</span>
              </div>
            </div>

          </div>

        </form>
      )}
    </div>
  );
}
