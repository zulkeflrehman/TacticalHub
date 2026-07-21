'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Home, Heart, ShoppingBag, User } from 'lucide-react';

export default function MobileBottomNavigation() {
  const pathname = usePathname();
  const { cart, wishlist, toggleMiniCart, isOpen: isMiniCartOpen } = useStore();

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    {
      name: 'Home',
      icon: Home,
      href: '/'
    },
    {
      name: 'Wishlist',
      icon: Heart,
      href: '/wishlist',
      badgeCount: wishlist.length
    },
    {
      name: 'Cart',
      icon: ShoppingBag,
      onClick: () => toggleMiniCart(true),
      badgeCount: totalCartItems
    },
    {
      name: 'Account',
      icon: User,
      href: '/account/profile'
    }
  ];

  // Hide navigation when CartDrawer is open to prevent overlap
  if (isMiniCartOpen) {
    return null;
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-white/95 backdrop-blur-md border-t border-brand-black/10 pb-safe shadow-lg">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href ? pathname === item.href : false;

          const buttonContent = (
            <div className="flex flex-col items-center gap-1 relative py-1 px-3">
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-brand-black stroke-[2.5]' : 'text-brand-dark-gray'}`} />
              <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-brand-black font-extrabold' : 'text-brand-dark-gray/80'}`}>
                {item.name}
              </span>
              {item.badgeCount && item.badgeCount > 0 ? (
                <span className={`absolute top-0 right-2 w-4.5 h-4.5 text-[8px] font-black rounded-full flex items-center justify-center border border-brand-white ${
                  item.name === 'Cart' ? 'bg-brand-accent text-brand-black' : 'bg-brand-black text-brand-white'
                }`}>
                  {item.badgeCount}
                </span>
              ) : null}
            </div>
          );

          if (item.onClick) {
            return (
              <button
                key={item.name}
                onClick={item.onClick}
                className="flex-1 flex justify-center focus:outline-none"
              >
                {buttonContent}
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href || '#'}
              className="flex-1 flex justify-center"
            >
              {buttonContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
