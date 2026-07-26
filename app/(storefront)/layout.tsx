'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import StoreHeader from '@/components/layout/StoreHeader';
import StoreFooter from '@/components/layout/StoreFooter';
import MobileBottomNavigation from '@/components/layout/MobileBottomNavigation';
import OmnisearchOverlay from '@/components/search/OmnisearchOverlay';
import CartDrawer from '@/components/cart/CartDrawer';
import { SpatialMotionProvider } from '@/components/motion/SpatialMotionProvider';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const usesLightContentSurface = [
    '/cart',
    '/checkout',
    '/wishlist',
    '/search',
    '/categories',
    '/pages',
  ].some((route) => pathname === route || pathname.startsWith(`${route}/`));

  return (
    <SpatialMotionProvider>
      <div className="min-h-screen flex flex-col bg-[#121212] text-[#F5F5F5] overflow-x-hidden selection:bg-[#FF6600] selection:text-black">
        <StoreHeader />
        
        <main
          className={`flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 ${
            usesLightContentSurface ? 'light-surface bg-brand-light-gray text-brand-black' : ''
          }`}
        >
          {children}
        </main>
        
        <StoreFooter />
        <CartDrawer />
        <MobileBottomNavigation />
        <OmnisearchOverlay />
      </div>
    </SpatialMotionProvider>
  );
}
