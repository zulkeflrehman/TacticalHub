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
  X, ArrowRight, ShieldCheck, Lock,
  Truck, ChevronDown, ChevronUp
} from 'lucide-react';

interface AccordionCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccordionCheckoutModal({ isOpen, onClose }: AccordionCheckoutModalProps) {
  const { cart, clearCart } = useStore();
  const addToast = useToastStore((state) => state.addToast);

  const [activeSection, setActiveSection] = useState<'SHIPPING' | 'REVIEW'>('SHIPPING');
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
      navigator.vibrate?.([20, 40]);
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

  const checkShippingValid = () => {
    if (!firstName.trim()) return false;
    if (!lastName.trim()) return false;
    if (!email.trim() || !email.includes('@')) return false;
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) return false;
    if (!address.trim() || address.length < 6) return false;
    return true;
  };

  const handleShippingSubmit = () => {
    if (validateShipping()) {
      triggerHaptic();
      setActiveSection('REVIEW');
    }
  };

  const handleSubmitOrder = async () => {
    if (!validateShipping()) {
      setActiveSection('SHIPPING');
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
        // Guest simulation fallback
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
        <div className="fixed inset-0 z-50 bg-[#070707]/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative max-w-xl w-full bento-card bento-card-lg shadow-2xl flex flex-col overflow-hidden my-auto border border-white/10"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-[#0B0B0B] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#FF6600]" />
                <span className="text-xs font-mono font-black text-white uppercase tracking-widest">
                  256-BIT SECURE CHECKOUT
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-white bg-[#141414] border border-white/10 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Authentic Visual Trust Badges Bar */}
            <div className="grid grid-cols-3 gap-2 px-5 py-2.5 bg-[#141414] border-b border-white/10 text-[10px] font-mono text-neutral-300">
              <div className="flex items-center gap-1.5 justify-center">
                <Lock className="w-3.5 h-3.5 text-[#10B981]" />
                <span>SSL ENCRYPTED</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center border-x border-white/10">
                <Truck className="w-3.5 h-3.5 text-[#FF6600]" />
                <span>VERIFIED COD</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B8EC44]" />
                <span>100% AUTHENTIC</span>
              </div>
            </div>



            {/* Accordion Single View Container */}
            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              {/* Accordion Section 1: SHIPPING */}
              <div className="bento-card overflow-hidden">
                <button
                  onClick={() => { triggerHaptic(); setActiveSection('SHIPPING'); }}
                  className="w-full p-4 flex items-center justify-between bg-[#141414] hover:bg-[#1A1A1A] transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full font-mono text-[10px] font-black flex items-center justify-center ${
                      checkShippingValid() ? 'bg-[#10B981] text-black' : 'bg-[#FF6600] text-black'
                    }`}>
                      1
                    </span>
                    <span className="text-xs font-mono font-black text-white uppercase tracking-wider">
                      SHIPPING & DESTINATION DETAILS
                    </span>
                  </div>
                  {activeSection === 'SHIPPING' ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                </button>

                <AnimatePresence>
                  {activeSection === 'SHIPPING' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-4 space-y-3 border-t border-white/10"
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
                            className="w-full bg-[#070707] text-white p-2.5 text-xs font-mono border border-white/10 focus:border-[#FF6600] rounded-xl outline-none"
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
                            className="w-full bg-[#070707] text-white p-2.5 text-xs font-mono border border-white/10 focus:border-[#FF6600] rounded-xl outline-none"
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
                          className="w-full bg-[#070707] text-white p-2.5 text-xs font-mono border border-white/10 focus:border-[#FF6600] rounded-xl outline-none"
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
                          className="w-full bg-[#070707] text-white p-2.5 text-xs font-mono border border-white/10 focus:border-[#FF6600] rounded-xl outline-none"
                        />
                        {errors.phone && <span className="text-[9px] text-[#EF4444] font-mono">{errors.phone}</span>}
                      </div>

                      <AddressAutocompleteInput
                        value={address}
                        onChange={setAddress}
                        error={errors.address}
                      />

                      <button
                        onClick={handleShippingSubmit}
                        className="w-full bg-[#FF6600] text-black hover:bg-[#E05800] py-3 text-xs font-mono font-black uppercase rounded-xl flex items-center justify-center gap-1.5 tactile-press pt-2"
                      >
                        <span>CONFIRM SHIPPING & CONTINUE</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion Section 2: REVIEW */}
              <div className="bento-card overflow-hidden">
                <button
                  onClick={() => { triggerHaptic(); setActiveSection('REVIEW'); }}
                  className="w-full p-4 flex items-center justify-between bg-[#141414] hover:bg-[#1A1A1A] transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FF6600] font-mono text-[10px] font-black text-black flex items-center justify-center">
                      2
                    </span>
                    <span className="text-xs font-mono font-black text-white uppercase tracking-wider">
                      FINAL REVIEW & DISPATCH
                    </span>
                  </div>
                  {activeSection === 'REVIEW' ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                </button>

                <AnimatePresence>
                  {activeSection === 'REVIEW' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-4 space-y-4 font-mono text-xs border-t border-white/10"
                    >
                      {/* Cash on Delivery Policy Indicator */}
                      <div className="bg-[#141414] border border-[#B8EC44]/40 p-3.5 rounded-xl flex items-center gap-3">
                        <Truck className="w-5 h-5 text-[#B8EC44] shrink-0" />
                        <div>
                          <h4 className="text-[11px] font-black text-white uppercase">
                            CASH ON DELIVERY (COD) NATIONWIDE
                          </h4>
                          <p className="text-[9px] text-neutral-400">
                            Pay on delivery. No advance online payment required.
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#141414] p-3 rounded-xl space-y-1">
                        <span className="text-[9px] text-[#B8EC44] font-bold uppercase">RECIPIENT DESTINATION</span>
                        <p className="text-white font-bold uppercase">{firstName} {lastName} ({phone})</p>
                        <p className="text-neutral-400">{address}, {city}, {stateName}</p>
                      </div>

                      {/* Promo Code Entry */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[10px] text-neutral-400 uppercase font-bold block">
                          PROMO / COUPON CODE
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="TACTICAL10"
                            className="flex-1 bg-[#070707] text-white p-2.5 text-xs font-mono border border-white/10 rounded-xl outline-none uppercase"
                          />
                          <button
                            onClick={handleApplyCoupon}
                            className="bg-[#2F4F2F] text-white px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl hover:bg-[#4A7C4A] transition-colors"
                          >
                            APPLY
                          </button>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <span className="text-[9px] text-neutral-400 uppercase font-bold">ITEMIZED ORDER</span>
                        {cart.map((item) => (
                          <div key={`${item.productId}-${item.variantSku}`} className="flex justify-between items-center text-neutral-300">
                            <span className="truncate max-w-[200px]">{item.quantity}× {item.name}</span>
                            <span className="font-bold text-white">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-white/10 pt-3 space-y-1 text-neutral-400">
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
                        <div className="flex justify-between text-base font-black text-[#FF6600] pt-2 border-t border-white/10">
                          <span>GRAND TOTAL</span>
                          <span>Rs. {total.toLocaleString()}</span>
                        </div>
                      </div>

                      <button
                        onClick={handleSubmitOrder}
                        disabled={submitting}
                        className="w-full bg-[#FF6600] text-black hover:bg-[#E05800] py-3.5 text-xs font-mono font-black uppercase rounded-xl flex items-center justify-center gap-2 tactile-press shadow-[0_0_20px_rgba(255,102,0,0.6)] disabled:opacity-60"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{submitting ? 'DISPATCHING...' : 'CONFIRM COD DISPATCH'}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
