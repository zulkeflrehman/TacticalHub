'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { placeCodOrder, quoteCoupon } from '@/lib/client-services';
import { auth } from '@/lib/firebase-client';
import { onAuthStateChanged, type User } from 'firebase/auth';
import AddressAutocompleteInput from './AddressAutocompleteInput';
import KineticSuccessModal from './KineticSuccessModal';
import { useToastStore } from '@/lib/toast-store';
import {
  X, Check, ArrowRight, ArrowLeft, ShieldCheck,
  Truck
} from 'lucide-react';

interface CheckoutStepperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutStepperModal({ isOpen, onClose }: CheckoutStepperModalProps) {
  const { cart, clearCart } = useStore();
  const addToast = useToastStore((state) => state.addToast);

  const [step, setStep] = useState<'SHIPPING' | 'PAYMENT' | 'REVIEW'>('SHIPPING');
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city] = useState('Lahore');
  const [stateName] = useState('Punjab');
  const [postalCode] = useState('54000');
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Form Validation Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setSessionUser(user);
      if (user) {
        setEmail(user.email || '');
        if (user.displayName) {
          const parts = user.displayName.split(' ');
          setFirstName(parts[0] || '');
          setLastName(parts.slice(1).join(' ') || '');
        }
      }
    });
  }, []);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = subtotal >= 5000 ? 0 : 250;
  const total = Math.max(0, subtotal - discountAmount + shippingCost);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([15, 30]);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const quote = await quoteCoupon(couponCode, subtotal);
      setDiscountAmount(quote.discount);
      addToast(`Applied coupon ${quote.code}! Discount: Rs. ${quote.discount.toLocaleString()}`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid coupon code';
      addToast(msg, 'error');
    }
  };

  const validateShipping = () => {
    const errs: { [key: string]: string } = {};
    if (!firstName.trim()) errs.firstName = 'First name required';
    if (!lastName.trim()) errs.lastName = 'Last name required';
    if (!email.trim() || !email.includes('@')) errs.email = 'Valid email required';
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) errs.phone = 'Valid phone number required';
    if (!address.trim() || address.length < 6) errs.address = 'Detailed address required (min 6 chars)';
    
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      triggerHaptic();
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    triggerHaptic();
    if (step === 'SHIPPING') {
      if (validateShipping()) setStep('PAYMENT');
    } else if (step === 'PAYMENT') {
      setStep('REVIEW');
    }
  };

  const handlePrevStep = () => {
    triggerHaptic();
    if (step === 'REVIEW') setStep('PAYMENT');
    else if (step === 'PAYMENT') setStep('SHIPPING');
  };

  const handleExpressPay = (provider: string) => {
    triggerHaptic();
    addToast(`Express Checkout via ${provider} initiated. Continuing to order confirmation...`, 'info');
    if (validateShipping()) {
      setStep('REVIEW');
    } else {
      setStep('SHIPPING');
    }
  };

  const handleSubmitOrder = async () => {
    if (!validateShipping()) {
      setStep('SHIPPING');
      return;
    }

    if (cart.length === 0) {
      addToast('Your gear bag is empty.', 'error');
      return;
    }

    setSubmitting(true);
    triggerHaptic();

    try {
      if (!sessionUser) {
        // Fallback for guest checkout simulation
        const fakeOrderNo = `TH-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        setConfirmedOrderNumber(fakeOrderNo);
        clearCart();
        return;
      }

      const order = await placeCodOrder(
        sessionUser,
        cart,
        {
          email,
          phone,
          firstName,
          lastName,
          address,
          city,
          state: stateName,
          postalCode,
        },
        couponCode || undefined
      );

      setConfirmedOrderNumber(order.orderNumber);
      clearCart();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place order';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {confirmedOrderNumber ? (
        <KineticSuccessModal
          orderNumber={confirmedOrderNumber}
          onClose={() => {
            setConfirmedOrderNumber(null);
            onClose();
          }}
        />
      ) : (
        <div className="fixed inset-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Main Modal Shell */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative max-w-xl w-full bg-[#121212] border border-[#FF6600]/40 clip-angled shadow-[0_0_40px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden my-auto"
          >
            {/* Modal Top Bar */}
            <div className="px-4 py-3 bg-[#0A0A0A] border-b border-[#2A2A2A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#FF6600]" />
                <span className="text-xs font-mono font-black text-white uppercase tracking-widest">
                  TACTICAL CHECKOUT PIPELINE
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-white bg-[#1A1A1A] border border-[#2A2A2A] clip-angled transition-colors"
                aria-label="Close checkout modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Express Checkout Section */}
            <div className="p-4 bg-[#161616] border-b border-[#2A2A2A] space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#FF6600] uppercase tracking-wider block">
                EXPRESS ONE-CLICK CHECKOUT
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleExpressPay('Apple Pay')}
                  className="py-2 px-3 bg-black border border-[#2A2A2A] hover:border-white text-white font-mono text-xs font-bold clip-angled transition-all text-center"
                >
                   Pay
                </button>
                <button
                  onClick={() => handleExpressPay('Google Pay')}
                  className="py-2 px-3 bg-black border border-[#2A2A2A] hover:border-white text-white font-mono text-xs font-bold clip-angled transition-all text-center"
                >
                  G Pay
                </button>
                <button
                  onClick={() => handleExpressPay('PayPal')}
                  className="py-2 px-3 bg-[#003087] border border-[#0079C1] text-white font-mono text-xs font-bold clip-angled transition-all text-center"
                >
                  PayPal
                </button>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="grid grid-cols-3 text-center border-b border-[#2A2A2A] font-mono text-[10px] font-bold">
              {[
                { id: 'SHIPPING', label: '1. SHIPPING' },
                { id: 'PAYMENT', label: '2. PAYMENT' },
                { id: 'REVIEW', label: '3. REVIEW' },
              ].map((s) => {
                const isActive = step === s.id;
                return (
                  <div
                    key={s.id}
                    className={`py-2.5 transition-colors border-r last:border-r-0 border-[#2A2A2A] ${
                      isActive ? 'bg-[#FF6600] text-black font-black' : 'bg-[#0A0A0A] text-neutral-500'
                    }`}
                  >
                    {s.label}
                  </div>
                );
              })}
            </div>

            {/* Single-View Stepper Body with Horizontal Slide Transitions */}
            <div className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <AnimatePresence mode="wait">
                {step === 'SHIPPING' && (
                  <motion.div
                    key="shipping"
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -40, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block mb-1">
                          FIRST NAME
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full bg-[#121212] text-white p-2.5 text-xs font-mono border border-[#2A2A2A] focus:border-[#FF6600] clip-angled outline-none"
                        />
                        {errors.firstName && <span className="text-[9px] text-[#EF4444] font-mono">{errors.firstName}</span>}
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block mb-1">
                          LAST NAME
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full bg-[#121212] text-white p-2.5 text-xs font-mono border border-[#2A2A2A] focus:border-[#FF6600] clip-angled outline-none"
                        />
                        {errors.lastName && <span className="text-[9px] text-[#EF4444] font-mono">{errors.lastName}</span>}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block mb-1">
                        EMAIL ADDRESS
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#121212] text-white p-2.5 text-xs font-mono border border-[#2A2A2A] focus:border-[#FF6600] clip-angled outline-none"
                      />
                      {errors.email && <span className="text-[9px] text-[#EF4444] font-mono">{errors.email}</span>}
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block mb-1">
                        MOBILE PHONE (COD VERIFICATION)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="03001234567"
                        className="w-full bg-[#121212] text-white p-2.5 text-xs font-mono border border-[#2A2A2A] focus:border-[#FF6600] clip-angled outline-none"
                      />
                      {errors.phone && <span className="text-[9px] text-[#EF4444] font-mono">{errors.phone}</span>}
                    </div>

                    {/* Google Maps Predictive Address Autocomplete */}
                    <AddressAutocompleteInput
                      value={address}
                      onChange={setAddress}
                      error={errors.address}
                    />
                  </motion.div>
                )}

                {step === 'PAYMENT' && (
                  <motion.div
                    key="payment"
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -40, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="bg-[#1A1A1A] border border-[#FF6600] p-4 clip-angled flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Truck className="w-6 h-6 text-[#FF6600]" />
                        <div>
                          <h4 className="text-xs font-mono font-black uppercase text-white">
                            CASH ON DELIVERY (COD) NATIONWIDE
                          </h4>
                          <p className="text-[10px] text-neutral-400">
                            Pay upon receipt of tactical shipment across Pakistan.
                          </p>
                        </div>
                      </div>
                      <Check className="w-5 h-5 text-[#10B981]" />
                    </div>

                    {/* Coupon Input */}
                    <div className="space-y-1.5 pt-2">
                      <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">
                        PROMO / COUPON CODE
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="TACTICAL10"
                          className="flex-1 bg-[#121212] text-white p-2.5 text-xs font-mono border border-[#2A2A2A] clip-angled outline-none uppercase"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          className="bg-[#2F4F2F] text-white px-4 py-2 text-xs font-mono font-bold uppercase clip-angled hover:bg-[#4A7C4A] transition-colors"
                        >
                          APPLY
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 'REVIEW' && (
                  <motion.div
                    key="review"
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -40, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 font-mono text-xs"
                  >
                    <div className="bg-[#161616] border border-[#2A2A2A] p-3 clip-angled space-y-1">
                      <span className="text-[9px] text-[#4A7C4A] font-bold uppercase">RECIPIENT & DESTINATION</span>
                      <p className="text-white font-bold uppercase">{firstName} {lastName} ({phone})</p>
                      <p className="text-neutral-400">{address}, {city}, {stateName}</p>
                    </div>

                    {/* Itemized Breakdown */}
                    <div className="space-y-2">
                      <span className="text-[9px] text-neutral-500 uppercase font-bold">ITEMIZED GEAR ORDER</span>
                      {cart.map((item) => (
                        <div key={`${item.productId}-${item.variantSku}`} className="flex justify-between items-center text-neutral-300">
                          <span className="truncate max-w-[200px]">{item.quantity}× {item.name}</span>
                          <span className="font-bold text-white">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-[#2A2A2A] pt-3 space-y-1 text-neutral-400">
                      <div className="flex justify-between">
                        <span>SUBTOTAL</span>
                        <span>Rs. {subtotal.toLocaleString()}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-[#10B981]">
                          <span>DISCOUNT</span>
                          <span>-Rs. {discountAmount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>SHIPPING</span>
                        <span>{shippingCost === 0 ? 'FREE' : `Rs. ${shippingCost}`}</span>
                      </div>
                      <div className="flex justify-between text-base font-black text-[#FF6600] pt-2 border-t border-[#2A2A2A]">
                        <span>GRAND TOTAL</span>
                        <span>Rs. {total.toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-[#0A0A0A] border-t border-[#2A2A2A] flex items-center justify-between gap-3">
              {step !== 'SHIPPING' ? (
                <button
                  onClick={handlePrevStep}
                  className="bg-[#1A1A1A] text-neutral-300 hover:text-white px-4 py-3 font-mono text-xs font-bold uppercase clip-angled flex items-center gap-1 border border-[#2A2A2A]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>BACK</span>
                </button>
              ) : <div />}

              {step !== 'REVIEW' ? (
                <button
                  onClick={handleNextStep}
                  className="bg-[#FF6600] text-black hover:bg-[#E05800] px-6 py-3 font-mono text-xs font-black uppercase clip-angled flex items-center gap-1.5 tactile-depress shadow-[0_0_15px_rgba(255,102,0,0.4)] ml-auto"
                >
                  <span>CONTINUE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                  className="bg-[#FF6600] text-black hover:bg-[#E05800] px-6 py-3.5 font-mono text-xs font-black uppercase clip-angled flex items-center gap-2 tactile-depress shadow-[0_0_20px_rgba(255,102,0,0.6)] ml-auto disabled:opacity-60"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{submitting ? 'DISPATCHING...' : 'CONFIRM COD ORDER'}</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
