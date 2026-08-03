'use client';

import React from 'react';

export function ProductCardSkeleton() {
  return (
    <div className="bg-[#1F3346] border border-[#33506B] rounded-none p-3 flex flex-col justify-between space-y-3 relative overflow-hidden h-full">
      <div className="w-full aspect-square skeleton-shimmer rounded-none" />
      <div className="w-16 h-3 skeleton-shimmer rounded-none" />
      <div className="w-3/4 h-4 skeleton-shimmer rounded-none" />
      <div className="flex flex-col gap-2 pt-2 border-t border-[#33506B]">
        <div className="w-16 h-5 skeleton-shimmer rounded-none" />
        <div className="w-full h-9 skeleton-shimmer rounded-none" />
      </div>
    </div>
  );
}

export function HeroShowcaseSkeleton() {
  return (
    <div className="w-full aspect-[16/10] sm:aspect-[21/9] min-h-[300px] bg-[#1F3346] border border-[#33506B] rounded-none p-4 sm:p-8 relative overflow-hidden flex flex-col justify-end space-y-3">
      <div className="w-32 h-5 skeleton-shimmer rounded-none" />
      <div className="w-3/4 h-8 skeleton-shimmer rounded-none" />
      <div className="w-32 h-11 skeleton-shimmer rounded-none" />
    </div>
  );
}

export function PDPGallerySkeleton() {
  return (
    <div className="w-full aspect-square max-h-[480px] bg-[#1F3346] border border-[#33506B] rounded-none relative overflow-hidden flex items-center justify-center p-4">
      <div className="w-full h-full skeleton-shimmer opacity-50 rounded-none" />
    </div>
  );
}
