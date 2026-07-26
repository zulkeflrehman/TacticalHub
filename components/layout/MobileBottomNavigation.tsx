'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { Home, Heart, ShoppingBag, User } from 'lucide-react';

const emptySubscribe = () => () => {};
const useIsMounted = () => useSyncExternalStore(emptySubscribe, () => true, () => false);

export default function MobileBottomNavigation() {
  const pathname = usePathname();
  const { cart, wishlist, toggleMiniCart, isOpen: isMiniCartOpen } = useStore();
  const mounted = useIsMounted();

  const totalCartItems = mounted ? cart.reduce((acc, item) => acc + item.quantity, 0) : 0;
  const wishlistCount = mounted ? wishlist.length : 0;

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([12, 24]);
    }
  };

  const navItems = [
    {
      name: 'Home',
      icon: Home,
      href: '/',
    },
    {
      name: 'Wishlist',
      icon: Heart,
      href: '/wishlist',
      badgeCount: wishlistCount,
    },
    {
      name: 'Cart',
      icon: ShoppingBag,
      onClick: () => {
        triggerHaptic();
        toggleMiniCart(true);
      },
      badgeCount: totalCartItems,
    },
    {
      name: 'Account',
      icon: User,
      href: '/account/profile',
    },
  ];

  // Hide navigation when full cart overlay is open to avoid cluttering touch space
  if (isMiniCartOpen) {
    return null;
  }

  return (
    <nav 
      aria-label="Mobile Navigation Bar"
      suppressHydrationWarning
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-[#FF6600]/20 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.8)]"
    >
      <div suppressHydrationWarning className="flex h-16 items-center justify-around max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href ? pathname === item.href : false;

          const buttonContent = (
            <motion.div 
              whileTap={{ scale: 0.9, y: 1 }}
              onClick={triggerHaptic}
              className="flex flex-col items-center justify-center gap-1 relative py-1 px-3 w-full"
            >
              <div className="relative">
                <Icon 
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? 'text-[#FF6600] stroke-[2.5]' : 'text-neutral-400 group-hover:text-white'
                  }`} 
                />
                
                {/* Active Indicator Glow */}
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#FF6600] shadow-[0_0_8px_#FF6600]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Bouncy Cart Badge */}
                {item.badgeCount && item.badgeCount > 0 ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    transition={{ duration: 0.3 }}
                    className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 text-[9px] font-black font-mono rounded-full flex items-center justify-center bg-[#FF6600] text-black border border-black shadow-[0_0_10px_rgba(255,102,0,0.6)]"
                  >
                    {item.badgeCount}
                  </motion.span>
                ) : null}
              </div>

              <span 
                className={`text-[9px] font-extrabold uppercase tracking-widest font-mono transition-colors duration-200 ${
                  isActive ? 'text-[#FF6600]' : 'text-neutral-400'
                }`}
              >
                {item.name}
              </span>
            </motion.div>
          );

          if (item.onClick) {
            return (
              <button
                key={item.name}
                onClick={item.onClick}
                className="flex-1 flex justify-center focus:outline-none group"
              >
                {buttonContent}
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href || '#'}
              className="flex-1 flex justify-center group"
            >
              {buttonContent}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
