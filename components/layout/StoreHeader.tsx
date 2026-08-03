'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { useSpatialMotion } from '@/components/motion/SpatialMotionProvider';
import { Search, Heart, ShoppingBag, LayoutDashboard, Menu, X, LogIn, User } from 'lucide-react';
import type { StoreUserDto } from '@/lib/catalog-types';
import { getUserProfile } from '@/lib/client-services';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

const emptySubscribe = () => () => {};
const useIsMounted = () => useSyncExternalStore(emptySubscribe, () => true, () => false);

export default function StoreHeader() {
  const { cart, wishlist, toggleMiniCart } = useStore();
  const { setOmnisearchOpen } = useSpatialMotion();
  const [sessionUser, setSessionUser] = useState<StoreUserDto | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mounted = useIsMounted();

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (!user) return setSessionUser(null);
      getUserProfile(user).then(setSessionUser).catch(() => setSessionUser(null));
    });
  }, []);

  const totalCartItems = mounted ? cart.reduce((acc, item) => acc + item.quantity, 0) : 0;
  const wishlistCount = mounted ? wishlist.length : 0;

  return (
    <header 
      suppressHydrationWarning
      className="w-full h-14 bg-[#1F3346] border-b border-[#33506B] z-40 sticky top-0 flex items-center rounded-none"
    >
      <div 
        suppressHydrationWarning
        className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4"
      >
        <div className="flex items-center gap-2">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-[#A0B1C5] hover:text-[#FFFFFF] transition-colors rounded-none touch-target"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Logo with zoomed logo.png */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white flex items-center justify-center rounded-none shadow-sm overflow-hidden border border-[#33506B] shrink-0">
              <Image
                src="/logo.png"
                alt="Tactical Hub Logo"
                width={52}
                height={52}
                className="w-full h-full object-cover scale-[1.35] transition-transform duration-300 group-hover:scale-[1.45]"
                priority
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-base sm:text-xl font-black uppercase tracking-wider text-[#FFFFFF] group-hover:text-[#F4F1E8] transition-colors leading-tight">
                TACTICAL <span className="text-[#FFFFFF]">HUB</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Omnisearch Trigger Bar (Desktop) */}
        <button
          onClick={() => setOmnisearchOpen(true)}
          className="flex-1 max-w-md hidden sm:flex items-center justify-between bg-[#142230] border border-[#33506B] hover:border-[#FFFFFF] py-2 px-3 text-xs text-[#A0B1C5] rounded-none transition-all group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#FFFFFF] group-hover:scale-110 transition-transform" />
            <span>Search tactical gear, knives, optics...</span>
          </div>
          <span className="text-[9px] font-mono bg-[#1F3346] px-2 py-0.5 text-[#FFFFFF] border border-[#33506B] rounded-none">
            SEARCH
          </span>
        </button>

        {/* Header Right Action Buttons */}
        <div suppressHydrationWarning className="flex items-center gap-2">
          {/* Square Search Button (Mobile) */}
          <button
            onClick={() => setOmnisearchOpen(true)}
            className="sm:hidden p-2 text-[#FFFFFF] hover:bg-[#142230] border border-[#33506B] rounded-none transition-colors touch-target flex items-center justify-center"
            aria-label="Search catalog"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Admin Dashboard Link */}
          {sessionUser?.role === 'ADMIN' && (
            <Link 
              href="/admin/dashboard" 
              className="p-2 bg-[#142230] border border-[#33506B] text-[#FFFFFF] hover:bg-[#FFFFFF] hover:text-[#142230] transition-colors flex items-center gap-1 text-xs font-mono font-bold rounded-none"
              title="Admin Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden md:inline">ADMIN</span>
            </Link>
          )}

          {/* Wishlist Link */}
          <Link
            href="/wishlist"
            className="p-2 text-[#A0B1C5] hover:text-[#FFFFFF] hover:bg-[#142230] border border-[#33506B] rounded-none transition-colors relative"
            title="My Wishlist"
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFFFFF] text-[#142230] text-[9px] font-mono font-black flex items-center justify-center rounded-none border border-[#33506B]">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Login / Account Button */}
          {sessionUser ? (
            <Link
              href="/account/profile"
              className="h-9 px-3 bg-[#142230] border border-[#33506B] text-[#A0B1C5] hover:text-[#FFFFFF] hover:border-[#FFFFFF] transition-colors flex items-center gap-1.5 font-mono text-xs font-bold rounded-none"
              title="My Account"
              aria-label="Account profile"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline uppercase">ACCOUNT</span>
            </Link>
          ) : (
            <Link
              href="/account/login"
              className="h-9 px-3 bg-[#142230] border border-[#33506B] text-[#FFFFFF] hover:bg-[#FFFFFF] hover:text-[#142230] transition-colors flex items-center gap-1.5 font-mono text-xs font-bold rounded-none active:scale-[0.98]"
              title="Login"
              aria-label="Login to your account"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline uppercase">LOGIN</span>
            </Link>
          )}

          {/* Square Cart Button with Live Count Badge */}
          <button
            onClick={() => toggleMiniCart(true)}
            data-testid="cart-button"
            className="h-9 px-3 bg-[#FFFFFF] text-[#142230] hover:bg-[#F4F1E8] transition-colors relative flex items-center gap-2 font-mono text-xs font-bold rounded-none border border-[#FFFFFF] active:scale-[0.98]"
            title="Shopping Cart"
            aria-label={`Shopping cart, ${totalCartItems} items`}
          >
            <ShoppingBag className="w-4 h-4 text-[#142230]" />
            <span className="hidden sm:inline font-sans text-xs uppercase font-extrabold text-[#142230]">CART</span>
            <span className="w-5 h-5 bg-[#142230] text-[#FFFFFF] text-[10px] font-mono font-black flex items-center justify-center rounded-none">
              {totalCartItems}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 z-50 lg:hidden"
        >
          <div
            className="fixed inset-0 bg-[#142230]/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-[min(320px,85vw)] bg-[#1F3346] border-r border-[#33506B] shadow-2xl flex flex-col z-50 animate-slide-right rounded-none">
            <div className="px-4 py-3 border-b border-[#33506B] flex items-center justify-between bg-[#142230] text-[#FFFFFF] shrink-0 rounded-none">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white flex items-center justify-center rounded-none overflow-hidden border border-[#33506B] shrink-0">
                  <Image
                    src="/logo.png"
                    alt="Tactical Hub Logo"
                    width={36}
                    height={36}
                    className="w-full h-full object-cover scale-[1.35]"
                  />
                </div>
                <span className="font-extrabold tracking-wider text-sm uppercase text-[#FFFFFF]">TACTICAL HUB</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="text-[#A0B1C5] hover:text-[#FFFFFF] p-2 rounded-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-3 border-b border-[#33506B] shrink-0">
              <button
                onClick={() => { setIsMobileMenuOpen(false); setOmnisearchOpen(true); }}
                className="w-full flex items-center justify-between bg-[#142230] border border-[#33506B] py-2.5 px-3 text-xs text-[#A0B1C5] rounded-none"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#FFFFFF]" />
                  <span>Search products...</span>
                </div>
              </button>
            </div>

            <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto">
              <div className="px-2 py-2 space-y-1">
                <p className="px-3 pt-3 pb-1 text-[10px] font-mono font-black uppercase tracking-widest text-[#A0B1C5]">
                  Categories
                </p>
                {[
                  { name: 'Tents & Shelter', href: '/categories?slug=camping-tents' },
                  { name: 'Self Defense Gear', href: '/categories?slug=self-defense' },
                  { name: 'Outdoor Survival Tools', href: '/categories?slug=outdoor-tools' },
                  { name: 'Tasers & Baton Sticks', href: '/categories?slug=tasers-baton-sticks' }
                ].map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-3 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#142230] text-[#FFFFFF] border border-transparent hover:border-[#33506B] rounded-none transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
