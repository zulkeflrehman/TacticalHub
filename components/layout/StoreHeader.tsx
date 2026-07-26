'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { useSpatialMotion } from '@/components/motion/SpatialMotionProvider';
import { Search, Heart, ShoppingBag, LayoutDashboard } from 'lucide-react';
import type { StoreUserDto } from '@/lib/catalog-types';
import { getUserProfile } from '@/lib/client-services';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

export default function StoreHeader() {
  const { cart, wishlist, toggleMiniCart } = useStore();
  const { setOmnisearchOpen } = useSpatialMotion();
  const [sessionUser, setSessionUser] = useState<StoreUserDto | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
      className="w-full bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#2A2A2A] z-40 sticky top-0"
    >
      {/* Tactical Status Ribbon */}
      <div 
        suppressHydrationWarning
        className="bg-[#121212] border-b border-[#2A2A2A] px-4 py-1 flex items-center justify-between text-[10px] font-mono text-neutral-400"
      >
        <div suppressHydrationWarning className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-white font-bold tracking-wider">TACTICAL HUB SYSTEM // ONLINE</span>
        </div>
        <div suppressHydrationWarning className="hidden sm:flex items-center gap-4 text-neutral-400">
          <span className="text-[#FF6600]">NATIONWIDE COD AVAILABLE</span>
          <span>PKR (₨)</span>
        </div>
      </div>

      {/* Main Header Row */}
      <div 
        suppressHydrationWarning
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4"
      >
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-[#FF6600] flex items-center justify-center clip-angled text-black font-black text-lg">
            T
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white group-hover:text-[#FF6600] transition-colors">
              TACTICAL<span className="text-[#FF6600]">HUB</span>
            </span>
            <span className="text-[8px] font-mono uppercase tracking-widest text-[#4A7C4A] font-extrabold -mt-1">
              MILITARY & DEFENSE GEAR
            </span>
          </div>
        </Link>

        {/* Omnisearch Trigger Bar */}
        <button
          onClick={() => setOmnisearchOpen(true)}
          className="flex-1 max-w-md hidden sm:flex items-center justify-between bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#FF6600]/50 py-2 px-4 text-xs text-neutral-400 clip-angled transition-all group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#FF6600] group-hover:scale-110 transition-transform" />
            <span>Search tactical equipment, tents, batons...</span>
          </div>
          <span className="text-[9px] font-mono bg-[#2A2A2A] px-2 py-0.5 text-neutral-300 border border-neutral-700">
            SEARCH
          </span>
        </button>

        {/* Header Right Action Icons */}
        <div suppressHydrationWarning className="flex items-center gap-1 sm:gap-3">
          {/* Mobile Search Button */}
          <button
            onClick={() => setOmnisearchOpen(true)}
            className="sm:hidden p-2 text-neutral-300 hover:text-[#FF6600] transition-colors"
            aria-label="Search catalog"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Admin Panel Link */}
          {sessionUser?.role === 'ADMIN' && (
            <Link 
              href="/admin/dashboard" 
              className="p-2 text-[#FF6600] hover:bg-[#FF6600]/10 transition-colors flex items-center gap-1 text-xs font-mono font-bold"
              title="Admin Dashboard"
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              <span className="hidden md:inline">ADMIN</span>
            </Link>
          )}

          {/* Wishlist Link */}
          <Link
            href="/wishlist"
            className="p-2 text-neutral-300 hover:text-white transition-colors relative"
            title="My Wishlist"
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-[#FF6600] text-black text-[9px] font-mono font-black flex items-center justify-center rounded-full">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Icon Drawer Trigger */}
          <button
            onClick={() => toggleMiniCart(true)}
            data-testid="cart-button"
            className="p-2 text-[#FF6600] hover:bg-[#FF6600]/10 transition-colors relative flex items-center gap-1.5 font-mono text-xs font-bold"
            title="Shopping Cart"
            aria-label={`Shopping cart, ${totalCartItems} items`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden sm:inline text-white font-sans">GEAR</span>
            {totalCartItems > 0 && (
              <span className="w-4 h-4 bg-[#FF6600] text-black text-[9px] font-black flex items-center justify-center rounded-full shadow-[0_0_8px_#FF6600]">
                {totalCartItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
