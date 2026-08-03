'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { Home, LayoutGrid, Tag, ShoppingBag, User } from 'lucide-react';

const emptySubscribe = () => () => {};
const useIsMounted = () => useSyncExternalStore(emptySubscribe, () => true, () => false);

export default function MobileBottomNavigation() {
  const pathname = usePathname();
  const { cart, toggleMiniCart, isOpen: isMiniCartOpen } = useStore();
  const mounted = useIsMounted();

  const totalCartItems = mounted ? cart.reduce((acc, item) => acc + item.quantity, 0) : 0;

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
      name: 'Categories',
      icon: LayoutGrid,
      href: '/categories',
    },
    {
      name: 'Deals',
      icon: Tag,
      href: '/categories?slug=deals',
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

  if (isMiniCartOpen) {
    return null;
  }

  return (
    <nav 
      aria-label="Mobile Navigation Bar"
      suppressHydrationWarning
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1F3346] border-t border-[#33506B] pb-safe rounded-none shadow-2xl"
    >
      <div suppressHydrationWarning className="flex h-16 items-center justify-between max-w-md mx-auto px-1.5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href ? pathname === item.href : false;

          const buttonInner = (
            <motion.div 
              whileTap={{ scale: 0.96 }}
              onClick={triggerHaptic}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 px-2 w-full h-12 rounded-none transition-colors ${
                isActive ? 'bg-[#FFFFFF] text-[#142230]' : 'bg-transparent text-[#A0B1C5] hover:text-[#FFFFFF]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon 
                  className={`w-4.5 h-4.5 ${
                    isActive ? 'text-[#142230] stroke-[2.5]' : 'text-[#A0B1C5]'
                  }`} 
                />

                {item.badgeCount && item.badgeCount > 0 ? (
                  <span className={`absolute -top-2 -right-3 min-w-4 h-4 px-1 text-[9px] font-black font-mono flex items-center justify-center rounded-none border ${
                    isActive ? 'bg-[#142230] text-[#FFFFFF] border-[#142230]' : 'bg-[#FFFFFF] text-[#142230] border-[#FFFFFF]'
                  }`}>
                    {item.badgeCount}
                  </span>
                ) : null}
              </div>

              <span 
                className={`text-[9px] font-extrabold uppercase tracking-wider font-mono ${
                  isActive ? 'text-[#142230]' : 'text-[#A0B1C5]'
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
                className="flex-1 flex justify-center focus:outline-none rounded-none touch-target"
              >
                {buttonInner}
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href || '#'}
              className="flex-1 flex justify-center rounded-none touch-target"
            >
              {buttonInner}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
